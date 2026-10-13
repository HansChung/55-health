// ────────────────────────────────────────────────
// 研學團遊記影片：從團體相簿挑照片，做成一支全團遊記（和年度回憶影片同一套剪輯，不花算力）
// GET  → { candidates, defaultPicks, quota, title }
// POST { title, music, picks: [{ key, caption }] } → { video, quota }（影片放在自己的「出遊回憶影片」）
// ────────────────────────────────────────────────
import { NextRequest, NextResponse, after } from "next/server";
import { z } from "zod";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { checkUserQuota } from "@/lib/ai/usage-tracker";
import { blockedResponse } from "@/lib/plan-access-server";
import { toClientVideo } from "@/lib/ai/travel-video-server";
import { insertCompilationVideo, syncYearly, toCandidate } from "@/lib/ai/travel-yearly-server";
import { albumSources, loadAlbumAccess } from "@/lib/tour-album-server";
import { DEFAULT_MONTAGE_MUSIC, MONTAGE_MUSIC_IDS } from "@/lib/travel-video";
import {
  YEARLY_MAX_PHOTOS,
  YEARLY_MIN_PHOTOS,
  defaultYearlyPicks,
  sanitizeYearlyCaption,
  sanitizeYearlyTitle,
  taipeiYearMonth,
} from "@/lib/travel-yearly";

/** 建立後在背景先剪第一段（剩下的由背景接力做完） */
export const maxDuration = 60;

const PostSchema = z.object({
  title: z.string().max(100),
  music: z.enum(MONTAGE_MUSIC_IDS).default(DEFAULT_MONTAGE_MUSIC),
  picks: z.array(z.object({ key: z.string().max(100), caption: z.string().max(100) })).min(YEARLY_MIN_PHOTOS).max(YEARLY_MAX_PHOTOS),
});

async function setup(ctx: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "未登入" }, { status: 401 }) };
  const { id } = await ctx.params;
  if (!z.string().uuid().safeParse(id).success) return { error: NextResponse.json({ error: "找不到這個相簿" }, { status: 404 }) };
  const quota = await checkUserQuota(user.id, "tour");
  const blocked = blockedResponse(quota.access, "tour_album");
  if (blocked) return { error: blocked };
  const admin = createSupabaseAdmin();
  const found = await loadAlbumAccess(admin, id, user.id, user.email);
  if (!found) return { error: NextResponse.json({ error: "報名參加這一團才看得到團體相簿" }, { status: 404 }) };
  return { user, admin, found, quota };
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const s = await setup(ctx);
  if ("error" in s) return s.error;
  try {
    const sources = await albumSources(s.admin, s.found);
    return NextResponse.json({
      title: sanitizeYearlyTitle(s.found.tour.title),
      candidates: sources.map(toCandidate),
      defaultPicks: defaultYearlyPicks(sources),
      quota: { used: s.quota.used, limit: s.quota.limit, tier: s.quota.tier },
    });
  } catch (e) {
    console.error("[api] tour video candidates:", e);
    return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const s = await setup(ctx);
  if ("error" in s) return s.error;
  const { user, admin, found, quota } = s;
  if (!quota.allowed) {
    return NextResponse.json(
      {
        error: quota.limit === 0 ? "你的方案還不能做研學團遊記影片" : `這個月的 ${quota.limit} 支研學團遊記做完了，下個月再來做吧`,
        quota: { used: quota.used, limit: quota.limit, tier: quota.tier },
      },
      { status: 429 }
    );
  }
  const parsed = PostSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: `請選 ${YEARLY_MIN_PHOTOS}～${YEARLY_MAX_PHOTOS} 張照片` }, { status: 400 });
  const body = parsed.data;
  let sources;
  try {
    sources = await albumSources(admin, found);
  } catch (e) {
    console.error("[api] tour video sources:", e);
    return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
  }
  const byKey = new Map(sources.map((x) => [x.key, x]));
  const seen = new Set<string>();
  const picks = body.picks.filter((p) => byKey.has(p.key) && !seen.has(p.key) && seen.add(p.key));
  if (picks.length < YEARLY_MIN_PHOTOS) {
    return NextResponse.json({ error: "有些照片找不到了（可能被刪掉），請重新選一次" }, { status: 400 });
  }
  const chosen = picks.map((p) => byKey.get(p.key)!);
  const captions = picks.map((p, i) => sanitizeYearlyCaption(p.caption) || chosen[i].caption);
  const title = sanitizeYearlyTitle(body.title) || sanitizeYearlyTitle(found.tour.title) || "研學團遊記";
  let created;
  try {
    created = await insertCompilationVideo(admin, {
      userId: user.id,
      kind: "tour",
      year: taipeiYearMonth(found.tour.starts_at).year,
      title,
      music: body.music,
      chosen,
      captions,
      place: found.tour.title.slice(0, 50),
    });
  } catch (e) {
    console.error("[api] tour video create:", e);
    return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
  }
  if ("pending" in created) return NextResponse.json({ error: "上一支研學團遊記還在做，做好再做下一支喔" }, { status: 409 });

  const origin = new URL(req.url).origin;
  const row = created.row;
  after(() => syncYearly(row, { origin }).then(() => undefined).catch((e) => console.error("[tour-video] first step failed:", e)));
  return NextResponse.json({ video: toClientVideo(admin, row), quota: { used: quota.used + 1, limit: quota.limit, tier: quota.tier } });
}

// ────────────────────────────────────────────────
// 年度回憶影片：把一整年的遊記、出遊影片、故事集照片串成一支（伺服器自己剪，不花算力）
// GET  ?year=2026 → { year, years, candidates, defaultPicks, quota }（1～2 月預設看去年，方便過年做）
// POST { year, title, music, picks: [{ key, caption }] } → { video, quota }
//   照片只認伺服器自己整理的 key（不信任前端給的路徑），複製到影片底下後開始剪；背景接力做完會推播
// ────────────────────────────────────────────────
import { NextRequest, NextResponse, after } from "next/server";
import { z } from "zod";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { checkUserQuota } from "@/lib/ai/usage-tracker";
import { blockedResponse } from "@/lib/plan-access-server";
import { TRAVEL_VIDEO_BUCKET, toClientVideo, type TravelVideoRow } from "@/lib/ai/travel-video-server";
import { collectYearlySources, copyYearlyPhotos, syncYearly, toCandidate, yearlySize } from "@/lib/ai/travel-yearly-server";
import { DEFAULT_MONTAGE_MUSIC, MONTAGE_MUSIC_IDS } from "@/lib/travel-video";
import {
  YEARLY_MAX_PHOTOS,
  YEARLY_MIN_PHOTOS,
  defaultYearlyPicks,
  defaultYearlyTitle,
  sanitizeYearlyCaption,
  sanitizeYearlyTitle,
  taipeiYearMonth,
  yearlySegments,
  type YearlyState,
} from "@/lib/travel-yearly";

/** 建立後在背景先剪第一段（剩下的由背景接力做完） */
export const maxDuration = 60;

const PENDING_MESSAGE = "上一支年度回憶影片還在做，做好再做下一支喔";

/** 可以選的年份：今年和去年 */
function allowedYears(now = new Date()): number[] {
  const { year } = taipeiYearMonth(now.toISOString());
  return [year, year - 1];
}

function defaultYear(now = new Date()): number {
  const { year, month } = taipeiYearMonth(now.toISOString());
  return month <= 2 ? year - 1 : year;
}

const PostSchema = z.object({
  year: z.number().int(),
  title: z.string().max(100),
  music: z.enum(MONTAGE_MUSIC_IDS).default(DEFAULT_MONTAGE_MUSIC),
  picks: z
    .array(z.object({ key: z.string().max(100), caption: z.string().max(100) }))
    .min(YEARLY_MIN_PHOTOS)
    .max(YEARLY_MAX_PHOTOS),
});

async function currentUser() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function GET(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });
  const years = allowedYears();
  const asked = Number(req.nextUrl.searchParams.get("year"));
  const year = years.includes(asked) ? asked : defaultYear();
  const quota = await checkUserQuota(user.id, "yearly");
  const blocked = blockedResponse(quota.access, "travel_yearly");
  if (blocked) return blocked;
  try {
    const sources = await collectYearlySources(createSupabaseAdmin(), user.id, year);
    return NextResponse.json({
      year,
      years,
      candidates: sources.map(toCandidate),
      defaultPicks: defaultYearlyPicks(sources),
      quota: { used: quota.used, limit: quota.limit, tier: quota.tier },
    });
  } catch (e) {
    console.error("[api] yearly candidates:", e);
    return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });
  const quota = await checkUserQuota(user.id, "yearly");
  const blocked = blockedResponse(quota.access, "travel_yearly");
  if (blocked) return blocked;
  if (!quota.allowed) {
    return NextResponse.json(
      {
        error: quota.limit === 0 ? "你的方案還不能做年度回憶影片，升級後就可以做" : `今年的 ${quota.limit} 支年度回憶影片做完了，明年再來做吧`,
        quota: { used: quota.used, limit: quota.limit, tier: quota.tier },
        ...(quota.limit === 0 ? { upgradeUrl: "/pricing" } : {}),
      },
      { status: 429 }
    );
  }

  const parsed = PostSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success || !allowedYears().includes(parsed.data.year)) {
    return NextResponse.json({ error: `請選 ${YEARLY_MIN_PHOTOS}～${YEARLY_MAX_PHOTOS} 張照片` }, { status: 400 });
  }
  const body = parsed.data;
  const title = sanitizeYearlyTitle(body.title) || defaultYearlyTitle(body.year);

  const admin = createSupabaseAdmin();
  let sources;
  try {
    sources = await collectYearlySources(admin, user.id, body.year);
  } catch (e) {
    console.error("[api] yearly sources:", e);
    return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
  }
  const byKey = new Map(sources.map((s) => [s.key, s]));
  const seen = new Set<string>();
  const picks = body.picks.filter((p) => byKey.has(p.key) && !seen.has(p.key) && seen.add(p.key));
  if (picks.length < YEARLY_MIN_PHOTOS) {
    return NextResponse.json({ error: "有些照片找不到了（可能被刪掉），請重新選一次" }, { status: 400 });
  }
  const chosen = picks.map((p) => byKey.get(p.key)!);
  const captions = picks.map((p, i) => sanitizeYearlyCaption(p.caption) || chosen[i].caption);

  // 照片複製一份到影片底下：之後遊記、故事被刪掉，年度影片也不受影響
  const id = crypto.randomUUID();
  let copied: string[];
  try {
    copied = await copyYearlyPhotos(admin, { user_id: user.id, id }, chosen);
  } catch (e) {
    console.error("[api] yearly photo copy:", e);
    return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
  }
  const state: YearlyState = {
    year: body.year,
    title,
    music: body.music,
    size: yearlySize(chosen),
    photos: chosen.map((s, i) => ({ path: copied[i], width: s.width ?? 0, height: s.height ?? 0, caption: captions[i] })),
    segments: yearlySegments(title, captions),
    attempts: 0,
  };
  const { data: inserted, error: insErr } = await admin
    .from("travel_videos")
    .insert({
      id,
      user_id: user.id,
      kind: "yearly",
      status: "queued",
      style: "gentle",
      place: null,
      prompt: title,
      model: "ffmpeg",
      photo_path: copied[0],
      yearly: state,
    })
    .select("*")
    .single();
  if (insErr || !inserted) {
    await admin.storage.from(TRAVEL_VIDEO_BUCKET).remove(copied);
    if (insErr?.code === "23505") return NextResponse.json({ error: PENDING_MESSAGE }, { status: 409 });
    console.error("[api] yearly insert (add-travel-video-yearly.sql 跑了嗎？):", insErr);
    return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
  }

  // 回應送出後先開始剪（背景接力會接著做完，長輩離開畫面也會做好並推播）
  const origin = new URL(req.url).origin;
  const row = inserted as TravelVideoRow;
  after(() => syncYearly(row, { origin }).then(() => undefined).catch((e) => console.error("[yearly] first step failed:", e)));

  return NextResponse.json({
    video: toClientVideo(admin, row),
    quota: { used: quota.used + 1, limit: quota.limit, tier: quota.tier },
  });
}

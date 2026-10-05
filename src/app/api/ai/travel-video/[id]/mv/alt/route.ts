// ────────────────────────────────────────────────
// MV「換另一個版本」（不花錢、不扣次數）：Suno 每次做兩首，第二首已經存起來了 →
// 另外做一支 MV（原本那支留著），用同樣的照片照第二首歌的長度重新剪
// POST → { video }
// ────────────────────────────────────────────────
import { NextRequest, NextResponse, after } from "next/server";
import { z } from "zod";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { toWav, wavDurationSeconds } from "@/lib/ai/audio-convert";
import { download } from "@/lib/ai/travel-montage-server";
import { mvPhotoPath, mvSongPath, syncMv } from "@/lib/ai/travel-mv-server";
import { TRAVEL_VIDEO_BUCKET, toClientVideo, type TravelVideoRow } from "@/lib/ai/travel-video-server";
import { MV_MAX_SECONDS, mvSegments, type MvState } from "@/lib/travel-video";

export const maxDuration = 60;

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });
  const { id } = await ctx.params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "找不到這支 MV" }, { status: 404 });

  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("travel_videos")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("kind", "mv")
    .eq("status", "succeeded")
    .is("deleted_at", null)
    .maybeSingle();
  const original = data as TravelVideoRow | null;
  const orig = original?.mv;
  if (!original || !orig) return NextResponse.json({ error: "找不到這支 MV" }, { status: 404 });
  if (orig.variant_of || !orig.alt_song_path) {
    return NextResponse.json({ error: "這支 MV 沒有另一個版本可以換" }, { status: 409 });
  }
  // 每支 MV 只能換一次（做壞了的不算）
  const { data: existing } = await admin
    .from("travel_videos")
    .select("id")
    .eq("user_id", user.id)
    .eq("kind", "mv")
    .eq("mv->>variant_of", id)
    .neq("status", "failed")
    .is("deleted_at", null)
    .limit(1);
  if ((existing ?? []).length > 0) return NextResponse.json({ error: "另一個版本已經做過了" }, { status: 409 });

  // 第二首歌的長度（新的 MV 做歌時就記下來了；舊的現在量）
  let seconds = Number(orig.alt_song_seconds ?? 0);
  if (!seconds) {
    try {
      seconds = wavDurationSeconds(await toWav(await download(admin, orig.alt_song_path), { maxSeconds: MV_MAX_SECONDS }));
    } catch (e) {
      console.error("[api] mv alt measure failed:", e);
      return NextResponse.json({ error: "另一個版本讀不出來，請稍後再試" }, { status: 500 });
    }
  }
  if (seconds < 10) return NextResponse.json({ error: "另一個版本太短了，沒辦法做成 MV" }, { status: 409 });

  // 照片和第二首歌複製到新的 MV 底下（原本那支刪掉也不受影響）
  const newId = crypto.randomUUID();
  const target = { user_id: user.id, id: newId };
  const copies: [string, string][] = [
    ...orig.photos.map((p, i) => [p.path, mvPhotoPath(target, i)] as [string, string]),
    [orig.alt_song_path, mvSongPath(target, 1)],
  ];
  const done: string[] = [];
  for (const [from, to] of copies) {
    const { error } = await admin.storage.from(TRAVEL_VIDEO_BUCKET).copy(from, to);
    if (error) {
      console.error("[api] mv alt copy:", error);
      if (done.length) await admin.storage.from(TRAVEL_VIDEO_BUCKET).remove(done);
      return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
    }
    done.push(to);
  }

  const state: MvState = {
    ...orig,
    song_path: mvSongPath(target, 1),
    alt_song_path: null,
    song_seconds: Number(seconds.toFixed(2)),
    alt_song_seconds: null,
    photos: orig.photos.map((p, i) => ({ ...p, path: mvPhotoPath(target, i) })),
    segments: mvSegments(seconds, orig.photos.length),
    attempts: 0,
    variant_of: original.id,
  };
  const { data: inserted, error: insErr } = await admin
    .from("travel_videos")
    .insert({
      id: newId,
      user_id: user.id,
      kind: "mv",
      status: "queued",
      style: original.style,
      place: original.place,
      prompt: original.prompt,
      model: original.model,
      photo_path: mvPhotoPath(target, 0),
      mv: state,
    })
    .select("*")
    .single();
  if (insErr || !inserted) {
    await admin.storage.from(TRAVEL_VIDEO_BUCKET).remove(done);
    if (insErr?.code === "23505") return NextResponse.json({ error: "上一支 MV 還在做，做好再換" }, { status: 409 });
    console.error("[api] mv alt insert:", insErr);
    return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
  }

  // 歌已經有了，直接開始剪（背景接力會接著做完並推播）
  const row = inserted as TravelVideoRow;
  const origin = new URL(req.url).origin;
  after(() => syncMv(row, { origin }).then(() => undefined).catch((e) => console.error("[mv] alt first step failed:", e)));
  return NextResponse.json({ video: toClientVideo(admin, row) });
}

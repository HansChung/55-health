// 遊記 MV 的來源：只能用自己做好的遊記（多張照片）
import { createSupabaseAdmin } from "../supabase/server";
import type { TravelVideoRow } from "./travel-video-server";

type Admin = ReturnType<typeof createSupabaseAdmin>;

export async function loadMvSource(admin: Admin, userId: string, videoId: string): Promise<TravelVideoRow | null> {
  const { data } = await admin
    .from("travel_videos")
    .select("*")
    .eq("id", videoId)
    .eq("user_id", userId)
    .eq("kind", "montage")
    .eq("status", "succeeded")
    .is("deleted_at", null)
    .maybeSingle();
  const row = data as TravelVideoRow | null;
  return row?.montage?.photos?.length ? row : null;
}

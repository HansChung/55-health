// ────────────────────────────────────────────────
// 家人看長輩的出遊影片（含按讚、留言）
// 只列出已接受、而且長輩沒關掉「出遊影片」權限的長輩；只給做好的影片
// ────────────────────────────────────────────────
import { NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { toClientVideo, type TravelVideoRow } from "@/lib/ai/travel-video-server";
import { loadCommentsViews } from "@/lib/video-comments-server";
import { familyCanSeeVideos } from "@/lib/video-comments";
import type { FamilyElderVideos } from "@/lib/api-client";

export const dynamic = "force-dynamic";

/** 每位長輩最多列幾支（最新的在前） */
const VIDEOS_PER_ELDER = 12;

export async function GET() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const admin = createSupabaseAdmin();
  const { data: links } = await admin
    .from("family_links")
    .select("owner_id, permissions")
    .eq("family_user_id", user.id)
    .eq("status", "accepted");
  const ownerIds = [
    ...new Set(
      ((links ?? []) as { owner_id: string; permissions: Record<string, unknown> | null }[])
        .filter((l) => familyCanSeeVideos(l.permissions))
        .map((l) => l.owner_id)
    ),
  ];
  if (ownerIds.length === 0) return NextResponse.json({ elders: [] satisfies FamilyElderVideos[] });

  const perOwner = await Promise.all(
    ownerIds.map(async (ownerId) => {
      const [{ data: profile }, { data: rows }] = await Promise.all([
        admin.from("profiles").select("display_name").eq("id", ownerId).maybeSingle(),
        admin
          .from("travel_videos")
          .select("*")
          .eq("user_id", ownerId)
          .eq("status", "succeeded")
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .limit(VIDEOS_PER_ELDER),
      ]);
      return {
        ownerId,
        name: (profile as { display_name: string | null } | null)?.display_name?.trim() || "長輩",
        rows: (rows ?? []) as TravelVideoRow[],
      };
    })
  );

  const comments = await loadCommentsViews(admin, perOwner.flatMap((o) => o.rows), user.id);
  const elders: FamilyElderVideos[] = perOwner
    .filter((o) => o.rows.length > 0)
    .map((o) => ({
      elder_id: o.ownerId,
      name: o.name,
      videos: o.rows.map((r) => ({ ...toClientVideo(admin, r), comments: comments.get(r.id) })),
    }));
  return NextResponse.json({ elders });
}

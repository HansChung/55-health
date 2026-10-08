// ────────────────────────────────────────────────
// 家人看長輩的故事（已接受的連結、而且那篇有給家人看）
// GET → { elders: [{ elder_id, name, stories }] }
// ────────────────────────────────────────────────
import { NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { loadStoryCommentsViews, signStoryPhotos, toClientStory, type StoryRow } from "@/lib/life-stories-server";

export async function GET() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });
  const admin = createSupabaseAdmin();
  const { data: links } = await admin
    .from("family_links")
    .select("owner_id, family_name")
    .eq("family_user_id", user.id)
    .eq("status", "accepted");
  const owners = [...new Set(((links ?? []) as { owner_id: string }[]).map((l) => l.owner_id))];
  if (owners.length === 0) return NextResponse.json({ elders: [] });

  const [{ data: profiles }, { data: rows, error }] = await Promise.all([
    admin.from("profiles").select("id, display_name").in("id", owners),
    admin
      .from("life_stories")
      .select("*")
      .in("user_id", owners)
      .eq("share_with_family", true)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(200),
  ]);
  if (error) {
    console.warn("[api] family stories:", error.message);
    return NextResponse.json({ elders: [] });
  }
  const stories = (rows ?? []) as StoryRow[];
  const [urls, comments] = await Promise.all([signStoryPhotos(admin, stories), loadStoryCommentsViews(admin, stories, user.id)]);
  const names = new Map(((profiles ?? []) as { id: string; display_name: string | null }[]).map((p) => [p.id, p.display_name?.trim() || "長輩"]));
  const elders = owners
    .map((id) => ({
      elder_id: id,
      name: names.get(id) ?? "長輩",
      stories: stories
        .filter((s) => s.user_id === id)
        .map((s) => ({ ...toClientStory(s, urls), ...(comments.has(s.id) ? { comments: comments.get(s.id) } : {}) })),
    }))
    .filter((e) => e.stories.length > 0);
  return NextResponse.json({ elders });
}

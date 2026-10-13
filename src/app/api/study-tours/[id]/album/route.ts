// ────────────────────────────────────────────────
// 研學團共享相簿
// GET  → { album }（只有這一團的參加者、幫他報名的家人、管理員看得到）
// POST { photoPath, width, height } → { album }：照片已直傳 user-uploads 暫存區，這裡複製到相簿
// ────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { loadAsker } from "@/lib/ai/ask-quota-server";
import { blockedResponse } from "@/lib/plan-access-server";
import { UserUploadError } from "@/lib/ai/user-uploads-server";
import { AlbumError, addAlbumPhoto, loadAlbumAccess, loadAlbumView } from "@/lib/tour-album-server";

const PostSchema = z.object({
  photoPath: z.string().max(200),
  width: z.number().int().min(0).max(20000),
  height: z.number().int().min(0).max(20000),
});

async function access(ctx: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "未登入" }, { status: 401 }) };
  const { id } = await ctx.params;
  if (!z.string().uuid().safeParse(id).success) return { error: NextResponse.json({ error: "找不到這個相簿" }, { status: 404 }) };
  const { access: plan } = await loadAsker(user.id, user.email);
  const blocked = blockedResponse(plan, "tour_album");
  if (blocked) return { error: blocked };
  const admin = createSupabaseAdmin();
  const found = await loadAlbumAccess(admin, id, user.id, user.email);
  if (!found) return { error: NextResponse.json({ error: "報名參加這一團才看得到團體相簿" }, { status: 404 }) };
  return { user, admin, found };
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const a = await access(ctx);
  if ("error" in a) return a.error;
  try {
    return NextResponse.json({ album: await loadAlbumView(a.admin, a.found, a.user.id) });
  } catch (e) {
    console.error("[api] tour album:", e);
    return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const a = await access(ctx);
  if ("error" in a) return a.error;
  const parsed = PostSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "照片格式有誤，請重新選一次" }, { status: 400 });
  try {
    await addAlbumPhoto(a.admin, a.found, a.user.id, parsed.data);
    return NextResponse.json({ album: await loadAlbumView(a.admin, a.found, a.user.id) });
  } catch (e) {
    if (e instanceof AlbumError) return NextResponse.json({ error: e.message }, { status: e.status });
    if (e instanceof UserUploadError) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error("[api] tour album upload:", e);
    return NextResponse.json({ error: "照片放不上去，請再試一次" }, { status: 500 });
  }
}

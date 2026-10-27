// 研學團相簿：刪一張照片（自己的；管理員可以刪任何一張）→ { album }
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { deleteAlbumPhoto, loadAlbumAccess, loadAlbumView } from "@/lib/tour-album-server";

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string; photoId: string }> }) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });
  const { id, photoId } = await ctx.params;
  if (!z.string().uuid().safeParse(id).success || !z.string().uuid().safeParse(photoId).success) {
    return NextResponse.json({ error: "找不到這張照片" }, { status: 404 });
  }
  const admin = createSupabaseAdmin();
  const found = await loadAlbumAccess(admin, id, user.id, user.email);
  if (!found) return NextResponse.json({ error: "找不到這張照片" }, { status: 404 });
  try {
    const ok = await deleteAlbumPhoto(admin, found, user.id, photoId);
    if (!ok) return NextResponse.json({ error: "只能刪自己放的照片" }, { status: 403 });
    return NextResponse.json({ album: await loadAlbumView(admin, found, user.id) });
  } catch (e) {
    console.error("[api] tour album delete:", e);
    return NextResponse.json({ error: "刪除沒成功，請再試一次" }, { status: 500 });
  }
}

// 管理員：上傳圖片（multipart/form-data：file、folder）→ 回傳公開網址
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { MAX_UPLOAD_BYTES, isUploadFolder, uploadAdminImage } from "@/lib/admin-media";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "權限不足" }, { status: 403 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const folder = form?.get("folder");
  if (!(file instanceof Blob)) return NextResponse.json({ error: "沒有收到檔案" }, { status: 400 });
  if (!isUploadFolder(folder)) return NextResponse.json({ error: "不支援的上傳位置" }, { status: 400 });
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "圖片超過 4MB，請換一張較小的圖" }, { status: 413 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const result = await uploadAdminImage(createSupabaseAdmin(), bytes, folder);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ url: result.url });
}

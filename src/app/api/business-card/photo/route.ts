// ────────────────────────────────────────────────
// 名片大頭照
// POST { photoPath } 或 { imageBase64, mimeType }（直傳失敗的舊方式）→ { card }：換照片（還沒有名片就先建一張）
// DELETE → { card }：拿掉照片
// ────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { loadAsker } from "@/lib/ai/ask-quota-server";
import { blockedResponse } from "@/lib/plan-access-server";
import { imageFromRequest, UserUploadError } from "@/lib/ai/user-uploads-server";
import { EMPTY_CARD_FIELDS } from "@/lib/business-card";
import { CardPhotoError, CardTableMissing, loadOwnCard, replaceCardPhoto, saveCardFields } from "@/lib/business-card-server";

async function gate() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, blocked: NextResponse.json({ error: "未登入" }, { status: 401 }) };
  const { access } = await loadAsker(user.id, user.email);
  return { user, blocked: blockedResponse(access, "business_card") };
}

function failed(e: unknown, where: string) {
  if (e instanceof UserUploadError || e instanceof CardPhotoError) return NextResponse.json({ error: e.message }, { status: 400 });
  if (e instanceof CardTableMissing) return NextResponse.json({ error: "數位名片還沒準備好" }, { status: 503 });
  console.error(`[api] business-card photo ${where}:`, e);
  return NextResponse.json({ error: "照片沒換成，請再試一次" }, { status: 500 });
}

export async function POST(req: NextRequest) {
  const { user, blocked } = await gate();
  if (blocked || !user) return blocked ?? NextResponse.json({ error: "未登入" }, { status: 401 });
  const body = ((await req.json().catch(() => null)) ?? {}) as Record<string, unknown>;
  const admin = createSupabaseAdmin();
  try {
    const image = await imageFromRequest(admin, user.id, body);
    if (!(await loadOwnCard(admin, user.id))) await saveCardFields(admin, user.id, EMPTY_CARD_FIELDS);
    const card = await replaceCardPhoto(admin, user.id, Buffer.from(image.base64, "base64"));
    return NextResponse.json({ card });
  } catch (e) {
    return failed(e, "POST");
  }
}

export async function DELETE() {
  const { user, blocked } = await gate();
  if (blocked || !user) return blocked ?? NextResponse.json({ error: "未登入" }, { status: 401 });
  const admin = createSupabaseAdmin();
  try {
    if (!(await loadOwnCard(admin, user.id))) return NextResponse.json({ card: null });
    return NextResponse.json({ card: await replaceCardPhoto(admin, user.id, null) });
  } catch (e) {
    return failed(e, "DELETE");
  }
}

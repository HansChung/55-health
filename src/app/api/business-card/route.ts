// ────────────────────────────────────────────────
// 數位名片
// GET  → { card, works, choices, suggestedName }：自己的名片（還沒做過是 null）、名片上的作品、可以選的作品
// PUT  { 名片欄位 } → { card, works }：存名片（作品只留本人的、還在的）
// POST { action: "share" | "unshare" | "new_link" } → { card }：開始／停止分享、換新連結（舊連結失效）
// 沒跑 add-business-cards.sql → 503
// ────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { loadAsker } from "@/lib/ai/ask-quota-server";
import { blockedResponse } from "@/lib/plan-access-server";
import { CardInputError, normalizeCardInput } from "@/lib/business-card";
import {
  CardTableMissing,
  loadCardWorks,
  loadOwnCard,
  loadWorkChoices,
  ownedWorkRefs,
  saveCardFields,
  updateCardSharing,
} from "@/lib/business-card-server";

async function currentUser() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/** 未登入、後台關掉（503）或方案不夠（403）就擋下來 */
async function gate() {
  const user = await currentUser();
  if (!user) return { user: null, blocked: NextResponse.json({ error: "未登入" }, { status: 401 }) };
  const { access } = await loadAsker(user.id, user.email);
  return { user, blocked: blockedResponse(access, "business_card") };
}

const notReady = () => NextResponse.json({ error: "數位名片還沒準備好" }, { status: 503 });

export async function GET() {
  const { user, blocked } = await gate();
  if (blocked || !user) return blocked ?? NextResponse.json({ error: "未登入" }, { status: 401 });
  const admin = createSupabaseAdmin();
  try {
    const [card, choices, profile] = await Promise.all([
      loadOwnCard(admin, user.id),
      loadWorkChoices(admin, user.id),
      admin.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
    ]);
    const works = card ? await loadCardWorks(admin, user.id, card.works) : [];
    const suggestedName = typeof profile.data?.display_name === "string" ? profile.data.display_name.slice(0, 20) : "";
    return NextResponse.json({ card, works, choices, suggestedName });
  } catch (e) {
    if (e instanceof CardTableMissing) {
      console.warn("[api] business-card GET (add-business-cards.sql 跑了嗎？):", e.message);
      return notReady();
    }
    console.error("[api] business-card GET:", e);
    return NextResponse.json({ error: "讀不到名片，請再試一次" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { user, blocked } = await gate();
  if (blocked || !user) return blocked ?? NextResponse.json({ error: "未登入" }, { status: 401 });
  let fields;
  try {
    fields = normalizeCardInput(await req.json().catch(() => null));
  } catch (e) {
    if (e instanceof CardInputError) return NextResponse.json({ error: e.message }, { status: 400 });
    throw e;
  }
  const admin = createSupabaseAdmin();
  try {
    fields.works = await ownedWorkRefs(admin, user.id, fields.works);
    const card = await saveCardFields(admin, user.id, fields);
    return NextResponse.json({ card, works: await loadCardWorks(admin, user.id, card.works) });
  } catch (e) {
    if (e instanceof CardTableMissing) return notReady();
    console.error("[api] business-card PUT:", e);
    return NextResponse.json({ error: "沒存到，請再試一次" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { user, blocked } = await gate();
  if (blocked || !user) return blocked ?? NextResponse.json({ error: "未登入" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { action?: unknown } | null;
  const action = body?.action;
  if (action !== "share" && action !== "unshare" && action !== "new_link") {
    return NextResponse.json({ error: "格式不對" }, { status: 400 });
  }
  try {
    const card = await updateCardSharing(createSupabaseAdmin(), user.id, action);
    if (!card) return NextResponse.json({ error: "請先把名片存起來" }, { status: 404 });
    return NextResponse.json({ card });
  } catch (e) {
    console.error("[api] business-card POST:", e);
    return NextResponse.json({ error: "沒改到，請再試一次" }, { status: 500 });
  }
}

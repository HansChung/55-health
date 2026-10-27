import { NextRequest, NextResponse } from "next/server";
import { getGeminiModel, isGeminiConfigured, parseModelJson, modelText } from "@/lib/ai/gemini";
import { createSupabaseServer } from "@/lib/supabase/server";
import { finishReservedUsage, releaseReservedUsage, reserveDailySlot } from "@/lib/ai/usage-tracker";
import { taipeiDayStartIso } from "@/lib/ask";
import { cachedSuggestion, suggestionCacheKey, taipeiClock } from "@/lib/suggestion-cache";

const ENDPOINT = "/api/ai/suggest";
/** 每人每天最多重新產生幾次（記餐、改資料、按「換一個建議」都算）；超過就給今天最後那一則 */
const SUGGEST_DAILY_LIMIT = 20;

const SUGGEST_PROMPT = `你是台灣長者的健康助理「暖暖」。根據用戶**今天的真實情況**給個性化建議。

⚠️ 絕對禁止：
- 不要用「阿伯」「阿姨」「長輩」「您」這類稱呼，直接用用戶提供的「稱呼」欄位
- 不要用罐頭話，例如「記得多喝水」「適量飲食」「均衡攝取」這種空泛建議
- 不要重複用戶已知的資訊（例如「您有高血壓所以要少鹽」）

✅ 必須做到：
- headline 要根據用戶「今天吃了什麼」+「現在時間」+「慢性病」**三者結合**給具體建議
- 例如用戶午餐吃便當（720 卡）+ 下午 3 點 → 「下午只吃半根香蕉就好，晚餐留點空間」
- 例如用戶還沒記錄 + 早上 8 點 → 「早餐建議燕麥粥配水煮蛋，70 歲後血糖比較穩」
- reason 解釋「為什麼」基於用戶具體數據
- recommendations 最多 3 個，要呼應 headline（例如建議水果就推 3 種具體水果）

格式（純 JSON，無其他文字）：
{
  "headline": "30 字內的具體建議",
  "reason": "50 字內基於用戶數據的解釋",
  "recommendations": [
    { "name": "食物名", "emoji": "🍊", "cal": 60, "color": "#E8845A" }
  ]
}

recommendations 沒推薦就回空陣列 []，不要硬塞。`;

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });
  /** 「換一個建議」：不用快取 */
  const fresh = req.nextUrl.searchParams.get("fresh") === "1";

  // 收集用戶背景
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, age, gender, chronic_conditions, calorie_goal")
    .eq("id", user.id)
    .single();

  // 「今天」和「現在幾點」都用台北時間（Vercel 是 UTC：以前早上 8 點前吃的不算今天、時間也差 8 小時）
  const dayStart = taipeiDayStartIso();
  const { data: meals } = await supabase
    .from("meals")
    .select("meal_type, items, total_cal, protein_g, carb_g, fat_g")
    .eq("user_id", user.id)
    .gte("eaten_at", dayStart);

  const { day, hour } = taipeiClock();
  const timeOfDay = hour < 11 ? "早上" : hour < 14 ? "中午" : hour < 18 ? "下午" : "晚上";

  // 今天吃的、個人資料都沒變 → 給上次的建議，不叫 AI（首頁每次打開、換手機都不會重算）
  const cacheKey = suggestionCacheKey({ day, profile, meals });
  // 今天最後一則產生好的建議（略過還在產生中、只佔了位子的那筆）
  const { data: last } = await supabase
    .from("ai_usage")
    .select("metadata")
    .eq("user_id", user.id)
    .eq("endpoint", ENDPOINT)
    .eq("success", true)
    .gte("created_at", dayStart)
    .not("metadata->suggestion", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!fresh) {
    const cached = cachedSuggestion(last?.metadata, cacheKey);
    if (cached) return NextResponse.json({ suggestion: cached, cached: true });
  }

  const context = `
時間：${timeOfDay} ${hour} 點
用戶：${profile?.display_name ?? "用戶"}（${profile?.age ?? "?"} 歲）
慢性病：${profile?.chronic_conditions?.join("、") ?? "無"}
每日卡路里目標：${profile?.calorie_goal ?? 1800} 大卡

今天吃的：
${meals?.length
    ? meals.map((m) => `- ${m.meal_type}：${(m.items as { name: string }[]).map((it) => it.name).join("、")}（${m.total_cal} 卡）`).join("\n")
    : "（還沒記錄）"}

總卡路里：${meals?.reduce((s, m) => s + (m.total_cal || 0), 0) ?? 0} / ${profile?.calorie_goal ?? 1800}
`;

  if (!isGeminiConfigured()) {
    console.error("[api] AI 建議：LK888_API_KEY / GEMINI_API_KEY 未設定");
    return NextResponse.json({ error: "建議服務暫停中，請稍後再試" }, { status: 503 });
  }

  // 先佔今天的一格（同時好幾個請求也不會超過上限）；佔不到 → 給今天最後那一則，不再叫 AI
  let slot: string | null;
  try {
    ({ id: slot } = await reserveDailySlot({
      userId: user.id, service: "gemini_text", endpoint: ENDPOINT, sinceIso: dayStart, limit: SUGGEST_DAILY_LIMIT,
    }));
  } catch (e) {
    console.error("[api] AI 建議佔次數失敗:", e);
    return NextResponse.json({ error: "建議生成失敗，請稍後再試" }, { status: 500 });
  }
  if (!slot) {
    const latest = (last?.metadata as { suggestion?: unknown } | null)?.suggestion;
    if (latest) return NextResponse.json({ suggestion: latest, cached: true, limited: true });
    return NextResponse.json({ error: "今天的建議換太多次了，明天再來看新的喔" }, { status: 429 });
  }

  try {
    // 有 LK888_API_KEY 走邁笙（gem-3.5-flash-lite）；Google 直連用 lite 即可，額度更大（15k/day）
    const { model: m, config } = getGeminiModel(
      { responseMimeType: "application/json", temperature: 0.7 },
      { task: "text", googleModel: "gemini-2.5-flash-lite" }
    );

    const result = await m.generateContent([
      { text: SUGGEST_PROMPT },
      { text: "用戶背景：\n" + context },
    ]);

    const text = modelText(result.response);
    const suggestion = parseModelJson(text);
    const usage = result.response.usageMetadata;

    await finishReservedUsage(slot, {
      model: config.model,
      inputTokens: usage?.promptTokenCount ?? 0,
      outputTokens: usage?.candidatesTokenCount ?? 0,
      metadata: { provider: config.provider, cache_key: cacheKey, suggestion },
    });

    return NextResponse.json({ suggestion });
  } catch (e) {
    await releaseReservedUsage(slot);
    console.error("[api] AI 建議生成失敗:", e);
    return NextResponse.json({ error: "建議生成失敗，請稍後再試" }, { status: 500 });
  }
}

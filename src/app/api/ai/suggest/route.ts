import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createSupabaseServer } from "@/lib/supabase/server";
import { trackAiUsage } from "@/lib/ai/usage-tracker";

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

export async function GET() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  // 收集用戶背景
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, age, gender, chronic_conditions, calorie_goal")
    .eq("id", user.id)
    .single();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const { data: meals } = await supabase
    .from("meals")
    .select("meal_type, items, total_cal, protein_g, carb_g, fat_g")
    .eq("user_id", user.id)
    .gte("eaten_at", todayStart.toISOString());

  const hour = new Date().getHours();
  const timeOfDay = hour < 11 ? "早上" : hour < 14 ? "中午" : hour < 18 ? "下午" : "晚上";

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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY 未設定" }, { status: 500 });

  try {
    const model = "gemini-2.5-flash-lite"; // 文字建議用 lite 即可，額度更大（15k/day）
    const genAI = new GoogleGenerativeAI(apiKey);
    const m = genAI.getGenerativeModel({
      model,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    });

    const result = await m.generateContent([
      { text: SUGGEST_PROMPT },
      { text: "用戶背景：\n" + context },
    ]);

    const text = result.response.text();
    const suggestion = JSON.parse(text);
    const usage = result.response.usageMetadata;

    await trackAiUsage({
      userId: user.id,
      service: "gemini_text",
      model,
      inputTokens: usage?.promptTokenCount ?? 0,
      outputTokens: usage?.candidatesTokenCount ?? 0,
      endpoint: "/api/ai/suggest",
      success: true,
    });

    return NextResponse.json({ suggestion });
  } catch (e) {
    console.error("[api] AI 建議生成失敗:", e);
    return NextResponse.json({ error: "建議生成失敗，請稍後再試" }, { status: 500 });
  }
}

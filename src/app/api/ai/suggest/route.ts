import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createSupabaseServer } from "@/lib/supabase/server";
import { trackAiUsage } from "@/lib/ai/usage-tracker";

const SUGGEST_PROMPT = `你是台灣長者的健康助理「暖暖」。請根據用戶今天的飲食和健康狀況，給一個**簡短、溫暖、實用**的建議。

要求：
- 一句話 30 字以內
- 繁體中文（台灣口語）
- 溫和、像家人關心
- 內容要具體（例如「下午吃顆柳丁補維他命C」），不要空話
- 結尾可以加 1 個 emoji

回覆格式（純 JSON，不要其他文字）：
{
  "headline": "30 字內的建議",
  "reason": "為什麼這樣建議（50 字以內）",
  "recommendations": [
    { "name": "食物名", "emoji": "🍊", "cal": 60, "color": "#E8845A" }
  ]
}

recommendations 最多 3 個（給用戶選擇），如果沒有特別推薦食物就回空陣列 []。`;

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
    const model = "gemini-2.5-flash"; // 文字建議用 flash 夠用
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
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: "建議生成失敗：" + msg }, { status: 500 });
  }
}

import { describe, expect, it } from "vitest";
import { parseVoiceReply, voiceHistory, VOICE_HISTORY_MAX, VOICE_RULES } from "./voice-chat";
import { buildVoiceSystemPrompt } from "./ai/voice-chat";

describe("parseVoiceReply", () => {
  it("分開「聽到」和「回答」", () => {
    expect(parseVoiceReply("聽到：我今天可以吃水餃嗎\n回答：可以呀，十顆左右，配一盤青菜。")).toEqual({
      heard: "我今天可以吃水餃嗎",
      reply: "可以呀，十顆左右，配一盤青菜。",
    });
  });

  it("半形冒號、前後空白、多行回答都可以", () => {
    const r = parseVoiceReply("  聽到: 血壓 140 高不高 \n回答: 有一點偏高。\n先休息五分鐘再量一次。\n");
    expect(r.heard).toBe("血壓 140 高不高");
    expect(r.reply).toBe("有一點偏高。\n先休息五分鐘再量一次。");
  });

  it("沒照格式：整段當回答", () => {
    expect(parseVoiceReply("您好，我在這裡陪您。")).toEqual({ heard: "", reply: "您好，我在這裡陪您。" });
  });

  it("只有「聽到」沒有「回答」：回答不會把聽到的話念出來", () => {
    expect(parseVoiceReply("聽到：你好\n很高興聽到您的聲音")).toEqual({ heard: "你好", reply: "很高興聽到您的聲音" });
  });

  it("拿掉 Markdown 符號（要念出來）", () => {
    expect(parseVoiceReply("聽到：哈囉\n回答：**記得**多喝水 #健康").reply).toBe("記得多喝水 健康");
  });
});

describe("voiceHistory", () => {
  it("只留最後幾則、去掉空白", () => {
    const many = Array.from({ length: 30 }, (_, i) => ({ role: (i % 2 ? "assistant" : "user") as "user" | "assistant", text: `第${i}句` }));
    const h = voiceHistory([...many, { role: "user", text: "   " }]);
    expect(h).toHaveLength(VOICE_HISTORY_MAX);
    expect(h[h.length - 1].text).toBe("第29句");
  });
});

describe("buildVoiceSystemPrompt", () => {
  it("接在暖暖的說話規則後面，並要求兩行格式", () => {
    const p = buildVoiceSystemPrompt({ displayName: "王媽媽", mode: "chat", chapterTitle: "用說的問暖暖" });
    expect(p).toContain("你是「暖暖」");
    expect(p).toContain("王媽媽");
    expect(p).toContain("用說的問暖暖");
    expect(p.endsWith(VOICE_RULES)).toBe(true);
    expect(p).toContain("聽到：");
    expect(p).toContain("回答：");
  });
});

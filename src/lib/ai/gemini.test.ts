import { describe, it, expect, vi } from "vitest";
import { analyzeFoodImage, getGeminiModel, parseModelJson, resolveGeminiConfig } from "./gemini";

describe("resolveGeminiConfig", () => {
  it("有 LK888_API_KEY → 走邁笙，預設 gem-3.8-flash", () => {
    const c = resolveGeminiConfig({ LK888_API_KEY: "sk-lk", GEMINI_API_KEY: "g" });
    expect(c).toEqual({
      provider: "lk888",
      apiKey: "sk-lk",
      model: "gem-3.8-flash",
      baseUrl: "https://api.lk888.ai",
    });
  });

  it("可用 LK888_VISION_MODEL / LK888_API_BASE 覆蓋", () => {
    const c = resolveGeminiConfig({
      LK888_API_KEY: "sk-lk",
      LK888_VISION_MODEL: "gem-3.5-flash",
      LK888_API_BASE: "https://proxy.example.com/",
    });
    expect(c.model).toBe("gem-3.5-flash");
    expect(c.baseUrl).toBe("https://proxy.example.com");
  });

  it("GEMINI_PROVIDER=google 強制走 Google 直連", () => {
    const c = resolveGeminiConfig({ GEMINI_PROVIDER: "google", LK888_API_KEY: "sk-lk", GEMINI_API_KEY: "g" });
    expect(c).toEqual({ provider: "google", apiKey: "g", model: "gemini-2.5-flash" });
  });

  it("沒有邁笙 key → 走 Google；指定的 googleModel 優先", () => {
    expect(resolveGeminiConfig({ GEMINI_API_KEY: "g", GEMINI_MODEL: "gemini-2.5-flash-lite" }).model).toBe(
      "gemini-2.5-flash-lite"
    );
    expect(resolveGeminiConfig({ GEMINI_API_KEY: "g" }, { googleModel: "gemini-2.5-flash" }).provider).toBe("google");
  });

  it("Google 直連仍保留 2.5-pro 保險絲", () => {
    expect(resolveGeminiConfig({ GEMINI_API_KEY: "g", GEMINI_MODEL: "gemini-2.5-pro" }).model).toBe(
      "gemini-2.5-flash"
    );
  });

  it("文字任務（AI 建議）走邁笙預設 gem-3.5-flash-lite，可用 LK888_TEXT_MODEL 改", () => {
    expect(resolveGeminiConfig({ LK888_API_KEY: "sk-lk" }, { task: "text" }).model).toBe("gem-3.5-flash-lite");
    expect(
      resolveGeminiConfig({ LK888_API_KEY: "sk-lk", LK888_TEXT_MODEL: "gem-3.8-flash" }, { task: "text" }).model
    ).toBe("gem-3.8-flash");
    // 看圖的模型設定不影響文字任務
    expect(
      resolveGeminiConfig({ LK888_API_KEY: "sk-lk", LK888_VISION_MODEL: "gem-3.1-pro" }, { task: "text" }).model
    ).toBe("gem-3.5-flash-lite");
  });

  it("文字任務走 Google 直連時用呼叫端指定的 lite", () => {
    expect(
      resolveGeminiConfig({ GEMINI_API_KEY: "g" }, { task: "text", googleModel: "gemini-2.5-flash-lite" })
    ).toEqual({ provider: "google", apiKey: "g", model: "gemini-2.5-flash-lite" });
  });

  it("GEMINI_PROVIDER=lk888 但沒 key → apiKey 為 null（呼叫端回報未設定）", () => {
    expect(resolveGeminiConfig({ GEMINI_PROVIDER: "lk888" }).apiKey).toBeNull();
  });
});

describe("parseModelJson", () => {
  it("一般 JSON", () => {
    expect(parseModelJson<{ a: number }>('{"a":1}')).toEqual({ a: 1 });
  });

  it("包在 ```json 區塊也能解析", () => {
    expect(parseModelJson<{ a: number }>('```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(parseModelJson<{ a: number }>('```\n{"a":2}\n```')).toEqual({ a: 2 });
  });

  it("不是 JSON 就丟錯", () => {
    expect(() => parseModelJson("抱歉我看不懂")).toThrow();
  });
});

describe("analyzeFoodImage 走邁笙", () => {
  it("打到 lk888 的 Gemini 相容端點、帶 key，並回傳 gem 模型用量", async () => {
    vi.stubEnv("LK888_API_KEY", "sk-test-lk888");
    vi.stubEnv("GEMINI_PROVIDER", "");
    const calls: { url: string; init: RequestInit }[] = [];
    vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
      calls.push({ url: String(url), init });
      return new Response(
        JSON.stringify({
          candidates: [{
            content: { role: "model", parts: [{ text: '{"items":[],"total":{"cal":100,"protein":1,"carb":2,"fat":3},"tip":"好"}' }] },
            finishReason: "STOP",
          }],
          usageMetadata: { promptTokenCount: 12, candidatesTokenCount: 34, totalTokenCount: 46 },
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    });

    try {
      const { result, usage } = await analyzeFoodImage("AAAA", "image/jpeg");

      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe("https://api.lk888.ai/v1beta/models/gem-3.8-flash:generateContent");
      expect(new Headers(calls[0].init.headers).get("x-goog-api-key")).toBe("sk-test-lk888");
      const body = JSON.parse(String(calls[0].init.body));
      expect(body.contents[0].parts[1]).toEqual({ inlineData: { data: "AAAA", mimeType: "image/jpeg" } });
      expect(body.generationConfig.responseMimeType).toBe("application/json");
      expect(result.total.cal).toBe(100);
      expect(usage).toEqual({ inputTokens: 12, outputTokens: 34, model: "gem-3.8-flash", provider: "lk888" });
    } finally {
      vi.unstubAllEnvs();
      vi.unstubAllGlobals();
    }
  });
});

describe("getGeminiModel 文字任務走邁笙", () => {
  it("AI 建議打到 gem-3.5-flash-lite 端點", async () => {
    vi.stubEnv("LK888_API_KEY", "sk-test-lk888");
    vi.stubEnv("GEMINI_PROVIDER", "");
    const urls: string[] = [];
    vi.stubGlobal("fetch", async (url: string) => {
      urls.push(String(url));
      return new Response(
        JSON.stringify({
          candidates: [{ content: { role: "model", parts: [{ text: '{"headline":"晚餐吃清淡點","reason":"午餐偏油","recommendations":[]}' }] }, finishReason: "STOP" }],
          usageMetadata: { promptTokenCount: 5, candidatesTokenCount: 6 },
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    });

    try {
      const { model, config } = getGeminiModel(
        { responseMimeType: "application/json" },
        { task: "text", googleModel: "gemini-2.5-flash-lite" }
      );
      const res = await model.generateContent([{ text: "hi" }]);
      expect(config).toMatchObject({ provider: "lk888", model: "gem-3.5-flash-lite" });
      expect(urls).toEqual(["https://api.lk888.ai/v1beta/models/gem-3.5-flash-lite:generateContent"]);
      expect(parseModelJson<{ headline: string }>(res.response.text()).headline).toBe("晚餐吃清淡點");
    } finally {
      vi.unstubAllEnvs();
      vi.unstubAllGlobals();
    }
  });
});

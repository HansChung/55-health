import { describe, expect, it, vi } from "vitest";
import {
  EXTERNAL_AI_MAX_PROMPT_CHARS,
  chatgptPracticeUrl,
  externalAiPracticeUrl,
  externalAiSuccessMessage,
  geminiPracticeUrl,
  openExternalAiPractice,
  truncateExternalAiPrompt,
} from "./external-ai";

describe("external-ai", () => {
  it("chatgptPracticeUrl encodes prompt in q=", () => {
    const url = chatgptPracticeUrl("請用簡單中文告訴我");
    expect(url).toBe(
      `https://chatgpt.com/?q=${encodeURIComponent("請用簡單中文告訴我")}`
    );
  });

  it("geminiPracticeUrl opens app with q=", () => {
    const url = geminiPracticeUrl("你好");
    expect(url).toBe(
      `https://gemini.google.com/app?q=${encodeURIComponent("你好")}`
    );
  });

  it("externalAiPracticeUrl routes by provider", () => {
    expect(externalAiPracticeUrl("chatgpt", "hi")).toContain("chatgpt.com");
    expect(externalAiPracticeUrl("gemini", "hi")).toContain("gemini.google.com");
  });

  it("truncateExternalAiPrompt respects max length", () => {
    const long = "あ".repeat(EXTERNAL_AI_MAX_PROMPT_CHARS + 50);
    expect(truncateExternalAiPrompt(long).length).toBe(EXTERNAL_AI_MAX_PROMPT_CHARS);
  });

  it("openExternalAiPractice copies then opens", async () => {
    const copyText = vi.fn(async () => undefined);
    const openUrl = vi.fn(() => ({ focus: () => undefined }) as unknown as Window);
    const result = await openExternalAiPractice("chatgpt", "  範例句  ", {
      copyText,
      openUrl,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.copied).toBe(true);
      expect(result.url).toContain("chatgpt.com");
    }
    expect(copyText).toHaveBeenCalledWith("範例句");
    expect(openUrl).toHaveBeenCalledOnce();
  });

  it("openExternalAiPractice rejects empty prompt", async () => {
    const result = await openExternalAiPractice("gemini", "   ");
    expect(result).toEqual({ ok: false, reason: "empty" });
  });

  it("openExternalAiPractice reports popup blocked", async () => {
    const result = await openExternalAiPractice("gemini", "測試", {
      copyText: async () => undefined,
      openUrl: () => null,
    });
    expect(result).toEqual({ ok: false, reason: "popup_blocked" });
  });

  it("externalAiSuccessMessage differs for gemini vs chatgpt", () => {
    expect(externalAiSuccessMessage("chatgpt", true)).toContain("ChatGPT");
    expect(externalAiSuccessMessage("gemini", true)).toContain("貼上");
  });
});

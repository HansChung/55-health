import { describe, it, expect } from "vitest";
import {
  DICTATION_END_SILENCE_MS,
  DICTATION_MAX_SECONDS,
  DICTATION_NO_SPEECH_MS,
  appendDictation,
  cleanTranscript,
  dictationErrorMessage,
  isSpeaking,
} from "./dictation";

describe("說話變文字：接到欄位裡", () => {
  it("空的欄位直接放；有字就補「，」再接；句尾已有標點不重複", () => {
    expect(appendDictation("", " 今天天氣很好 ", 30)).toBe("今天天氣很好");
    expect(appendDictation("今天天氣很好", "我們去日月潭", 30)).toBe("今天天氣很好，我們去日月潭");
    expect(appendDictation("好開心！", "下次再來", 30)).toBe("好開心！下次再來");
  });
  it("超過字數截掉（以字為單位，表情符號不會切壞）", () => {
    expect(appendDictation("好美🥰", "風景很漂亮", 6)).toBe("好美🥰，風景");
    expect([...appendDictation("", "一".repeat(50), 30)].length).toBe(30);
  });
  it("沒聽到東西就保持原樣", () => {
    expect(appendDictation("原本的字", "   ", 30)).toBe("原本的字");
  });
});

describe("說話變文字：錯誤訊息", () => {
  it("麥克風權限、沒聲音、網路各有說明；自己停止不提示", () => {
    expect(dictationErrorMessage("not-allowed")).toContain("麥克風權限");
    expect(dictationErrorMessage("no-speech")).toContain("沒有聽到聲音");
    expect(dictationErrorMessage("network")).toContain("網路");
    expect(dictationErrorMessage("aborted")).toBeNull();
    expect(dictationErrorMessage("whatever")).toContain("再說一次");
  });
});

describe("cleanTranscript（伺服器聽寫）", () => {
  it("去掉引號、前綴、多餘空白", () => {
    expect(cleanTranscript("「我今天血壓 130。」")).toBe("我今天血壓 130。");
    expect(cleanTranscript("聽寫：明天要回診\n")).toBe("明天要回診");
    expect(cleanTranscript("  幫我  記下來  ")).toBe("幫我 記下來");
  });
  it("沒聽到人聲的回答當作空白", () => {
    expect(cleanTranscript("（聽不清楚）")).toBe("");
    expect(cleanTranscript("無法辨識。")).toBe("");
    expect(cleanTranscript("")).toBe("");
    expect(cleanTranscript(null)).toBe("");
  });
  it("太長截到 300 字", () => {
    expect([...cleanTranscript("好".repeat(400))]).toHaveLength(300);
  });
});

describe("isSpeaking", () => {
  it("音量門檻", () => {
    expect(isSpeaking(0.005)).toBe(false);
    expect(isSpeaking(0.05)).toBe(true);
  });
  it("錄音設定：說完停一下就送、最長 30 秒", () => {
    expect(DICTATION_END_SILENCE_MS).toBeLessThan(2000);
    expect(DICTATION_MAX_SECONDS).toBe(30);
    expect(DICTATION_NO_SPEECH_MS).toBeGreaterThan(DICTATION_END_SILENCE_MS);
  });
});

describe("cleanTranscript：引號", () => {
  it("只拿掉整句外面成對的引號，句子裡的留著", () => {
    expect(cleanTranscript("「明天回診」")).toBe("明天回診");
    expect(cleanTranscript("醫生說「多喝水」")).toBe("醫生說「多喝水」");
    expect(cleanTranscript("他說：「好」")).toBe("他說：「好」");
  });
});

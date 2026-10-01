import { describe, it, expect } from "vitest";
import { appendDictation, dictationErrorMessage } from "./dictation";

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

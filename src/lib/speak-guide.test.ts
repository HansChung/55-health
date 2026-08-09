import { afterEach, describe, expect, it, vi } from "vitest";
import { canSpeakGuide, speakGuideParagraphs, stopGuideSpeech } from "./speak-guide";

describe("speak-guide", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("無 speechSynthesis 時回傳 false", () => {
    vi.stubGlobal("window", {});
    expect(canSpeakGuide()).toBe(false);
    expect(speakGuideParagraphs(["你好"])).toBe(false);
  });

  it("有 speechSynthesis 時會 speak", () => {
    const speak = vi.fn();
    const cancel = vi.fn();
    vi.stubGlobal("window", {
      speechSynthesis: { speak, cancel },
    });
    vi.stubGlobal("SpeechSynthesisUtterance", function (this: { text: string; lang: string; rate: number }, text: string) {
      this.text = text;
      this.lang = "";
      this.rate = 1;
    });

    expect(canSpeakGuide()).toBe(true);
    expect(speakGuideParagraphs(["第一段", "第二段"])).toBe(true);
    expect(cancel).toHaveBeenCalled();
    expect(speak).toHaveBeenCalledTimes(1);
    stopGuideSpeech();
    expect(cancel).toHaveBeenCalledTimes(2);
  });
});

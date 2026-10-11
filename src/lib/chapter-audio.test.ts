import { describe, it, expect } from "vitest";
import { buildChapterAudioPath, chapterAudioFolder, chapterAudioType, formatMegabytes, titleFromFileName } from "./chapter-audio";
import { referencedAudioUrls } from "./chapter-audio-server";
import { chapterOverridesSchema, isBlockFilled, normalizeOverrides, BLOCK_TYPE_LABELS } from "./chapter-content";

describe("書本章節 Podcast：音檔格式與路徑", () => {
  it("看瀏覽器給的類型，沒有就看副檔名；存檔一律用手機放得出來的類型", () => {
    expect(chapterAudioType("ep1.mp3", "audio/mpeg")).toEqual({ contentType: "audio/mpeg", ext: "mp3" });
    expect(chapterAudioType("ep1.m4a", "audio/x-m4a")).toEqual({ contentType: "audio/mp4", ext: "m4a" });
    expect(chapterAudioType("錄音.M4A", "")).toEqual({ contentType: "audio/mp4", ext: "m4a" });
    expect(chapterAudioType("ep1.wav", "audio/wav")).toEqual({ contentType: "audio/wav", ext: "wav" });
    expect(chapterAudioType("clip.webm", "audio/webm")).toBeNull();
    expect(chapterAudioType("hack.html", "text/html")).toBeNull();
  });
  it("路徑不含使用者給的檔名；章節代碼只留英數", () => {
    const now = Date.UTC(2026, 9, 12, 3, 0, 0);
    expect(buildChapterAudioPath("0105", "mp3", now, "abc123")).toBe(`chapters/0105/2026-10/${now}-abc123.mp3`);
    expect(buildChapterAudioPath("../x/0105", "m4a", now, "a/b")).toBe(`chapters/x0105/2026-10/${now}-ab.m4a`);
  });
  it("預設標題：拿掉副檔名、截到 120 字", () => {
    expect(titleFromFileName("第一章導讀.m4a")).toBe("第一章導讀");
    expect([...titleFromFileName("長".repeat(300) + ".mp3")]).toHaveLength(120);
    expect(chapterAudioFolder("0105")).toBe("chapters/0105");
  });
  it("找出章節現在用到的音檔（其他的存檔時清掉）", () => {
    const urls = referencedAudioUrls({
      blocks: [
        { id: "a", type: "audio", url: "https://x/ep1.mp3" },
        { id: "b", type: "text", body: "hi" },
        { id: "c", type: "audio", url: "https://x/ep2.mp3" },
      ],
    });
    expect([...urls]).toEqual(["https://x/ep1.mp3", "https://x/ep2.mp3"]);
    expect(referencedAudioUrls(null).size).toBe(0);
  });
  it("檔案大小顯示", () => {
    expect(formatMegabytes(5.5 * 1024 * 1024)).toBe("5.5MB");
    expect(formatMegabytes(42 * 1024 * 1024)).toBe("42MB");
  });
});

describe("書本章節 Podcast：內容區塊", () => {
  it("可以加 Podcast 區塊；網址要是 http(s)", () => {
    const ok = chapterOverridesSchema.safeParse({
      blocks: [{ id: "b1", type: "audio", url: "https://x.supabase.co/storage/v1/object/public/chapter-audio/chapters/0105/a.mp3", title: "第一章導讀" }],
    });
    expect(ok.success).toBe(true);
    expect(chapterOverridesSchema.safeParse({ blocks: [{ id: "b1", type: "audio", url: "javascript:alert(1)" }] }).success).toBe(false);
    expect(BLOCK_TYPE_LABELS.audio.label).toContain("Podcast");
  });
  it("沒放音檔的 Podcast 區塊存檔時丟掉", () => {
    expect(isBlockFilled({ id: "b1", type: "audio", url: " " })).toBe(false);
    const out = normalizeOverrides({ blocks: [{ id: "b1", type: "audio", url: "" } as never, { id: "b2", type: "audio", url: "https://a.b/ep.mp3" }] });
    expect(out.blocks?.map((b) => b.id)).toEqual(["b2"]);
  });
});

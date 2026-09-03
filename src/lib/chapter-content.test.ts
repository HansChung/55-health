import { describe, it, expect } from "vitest";
import {
  applyChapterOverrides,
  normalizeOverrides,
  youtubeEmbedUrl,
  chapterOverridesSchema,
  extractEditableDefaults,
} from "./chapter-content";
import { getChapterOpening } from "./chapter-opening";

const base = getChapterOpening("0200")!;

describe("applyChapterOverrides", () => {
  it("沒有覆蓋 → 原封不動回傳預設", () => {
    expect(applyChapterOverrides(base, null)).toBe(base);
  });

  it("有值的欄位會蓋過預設", () => {
    const out = applyChapterOverrides(base, { title: "新標題", quote: "新金句" });
    expect(out.title).toBe("新標題");
    expect(out.quote).toBe("新金句");
    // 沒改的欄位維持預設
    expect(out.tryPrompt).toBe(base.tryPrompt);
  });

  // 關鍵安全性：後台把欄位清空，不能把預設內容也清掉
  it("空字串／只有空白 → 視為沒改，保留預設", () => {
    const out = applyChapterOverrides(base, { title: "", atAGlance: "   " });
    expect(out.title).toBe(base.title);
    expect(out.atAGlance).toBe(base.atAGlance);
  });

  it("導讀段落：有內容才覆蓋，且會過濾空白段落", () => {
    const out = applyChapterOverrides(base, { guideParagraphs: ["第一段", "  ", "第二段"] });
    expect(out.guideParagraphs).toEqual(["第一段", "第二段"]);
    const untouched = applyChapterOverrides(base, { guideParagraphs: [] });
    expect(untouched.guideParagraphs).toEqual(base.guideParagraphs);
  });

  it("圖片與影片網址會加進章節", () => {
    const out = applyChapterOverrides(base, {
      heroImageUrl: "https://example.com/a.jpg",
      videoUrl: "https://youtu.be/dQw4w9WgXcQ",
    });
    expect(out.heroImageUrl).toBe("https://example.com/a.jpg");
    expect(out.videoUrl).toBe("https://youtu.be/dQw4w9WgXcQ");
  });

  it("不會改到原本的預設物件（immutable）", () => {
    const before = base.title;
    applyChapterOverrides(base, { title: "改掉" });
    expect(base.title).toBe(before);
  });

  it("互動練習等非白名單欄位不受影響", () => {
    const out = applyChapterOverrides(base, { title: "x" });
    expect(out.layout).toBe(base.layout);
    expect(out.id).toBe(base.id);
  });
});

describe("normalizeOverrides", () => {
  it("去掉空字串與空陣列", () => {
    expect(normalizeOverrides({ title: "", quote: "  ", entries: [], heroImageUrl: "" })).toEqual({});
  });

  it("保留有值的欄位並去頭尾空白", () => {
    expect(normalizeOverrides({ title: "  哈囉  " })).toEqual({ title: "哈囉" });
  });
});

describe("youtubeEmbedUrl", () => {
  const embed = "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ";

  it("支援常見的 YouTube 網址格式", () => {
    expect(youtubeEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(embed);
    expect(youtubeEmbedUrl("https://youtu.be/dQw4w9WgXcQ")).toBe(embed);
    expect(youtubeEmbedUrl("https://m.youtube.com/watch?v=dQw4w9WgXcQ&t=10s")).toBe(embed);
    expect(youtubeEmbedUrl("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe(embed);
    expect(youtubeEmbedUrl("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe(embed);
  });

  // 安全性：只接受 YouTube，避免後台貼任意網址被內嵌成 iframe
  it("非 YouTube 網址一律回 null", () => {
    expect(youtubeEmbedUrl("https://evil.com/watch?v=dQw4w9WgXcQ")).toBeNull();
    expect(youtubeEmbedUrl("https://vimeo.com/12345")).toBeNull();
    expect(youtubeEmbedUrl("not a url")).toBeNull();
    expect(youtubeEmbedUrl("")).toBeNull();
    expect(youtubeEmbedUrl(null)).toBeNull();
  });

  it("影片 id 格式不對也拒絕", () => {
    expect(youtubeEmbedUrl("https://www.youtube.com/watch?v=<script>")).toBeNull();
  });
});

describe("chapterOverridesSchema", () => {
  it("接受合法內容", () => {
    expect(chapterOverridesSchema.safeParse({ title: "x", entries: [{ id: "a", label: "A" }] }).success).toBe(true);
  });

  it("拒絕未知欄位（防止後台塞入非白名單資料）", () => {
    expect(chapterOverridesSchema.safeParse({ layout: "hack" }).success).toBe(false);
  });

  it("圖片網址必須是合法 URL（或留空）", () => {
    expect(chapterOverridesSchema.safeParse({ heroImageUrl: "" }).success).toBe(true);
    expect(chapterOverridesSchema.safeParse({ heroImageUrl: "隨便打" }).success).toBe(false);
  });
});

describe("extractEditableDefaults", () => {
  it("抽出所有可編輯欄位供後台顯示 placeholder", () => {
    const d = extractEditableDefaults(base);
    expect(d.title).toBe(base.title);
    expect(d.guideParagraphs).toEqual(base.guideParagraphs);
    expect(d.heroImageUrl).toBe("");
  });
});

import { describe, it, expect } from "vitest";
import {
  applyChapterOverrides,
  normalizeOverrides,
  youtubeEmbedUrl,
  chapterOverridesSchema,
  extractEditableDefaults,
  chapterBlockSchema,
  customChapterBase,
  isHttpUrl,
  isSafeHref,
  isBlockFilled,
  CUSTOM_CHAPTER_ID_RE,
  type ChapterBlock,
} from "./chapter-content";
import { getChapterOpening, getBookGuideSections } from "./chapter-opening";

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

describe("網址安全規則", () => {
  it("圖片／外部連結只接受 http(s)", () => {
    expect(isHttpUrl("https://example.com/a.jpg")).toBe(true);
    expect(isHttpUrl("http://example.com")).toBe(true);
    expect(isHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isHttpUrl("data:text/html,<script>")).toBe(false);
    expect(isHttpUrl("不是網址")).toBe(false);
  });

  it("連結可用站內路徑，但擋掉 // 與 /\\ 開頭（會跳到別的網域）", () => {
    expect(isSafeHref("/smart/chapter/0203")).toBe(true);
    expect(isSafeHref("https://nuan55.com")).toBe(true);
    expect(isSafeHref("//evil.com")).toBe(false);
    expect(isSafeHref("/\\evil.com")).toBe(false);
    expect(isSafeHref("javascript:alert(1)")).toBe(false);
  });

  it("章首圖片拒絕 javascript: 網址", () => {
    expect(chapterOverridesSchema.safeParse({ heroImageUrl: "javascript:alert(1)" }).success).toBe(false);
  });

  it("章首影片只接受 YouTube", () => {
    expect(chapterOverridesSchema.safeParse({ videoUrl: "https://youtu.be/dQw4w9WgXcQ" }).success).toBe(true);
    expect(chapterOverridesSchema.safeParse({ videoUrl: "https://vimeo.com/123456" }).success).toBe(false);
  });

  it("路線卡連結同樣受限", () => {
    const bad = { entries: [{ id: "a", label: "A", href: "javascript:alert(1)" }] };
    expect(chapterOverridesSchema.safeParse(bad).success).toBe(false);
  });
});

describe("內容區塊", () => {
  const blocks: ChapterBlock[] = [
    { id: "1", type: "text", title: "小叮嚀", body: "先喝口水再開始" },
    { id: "2", type: "image", url: "https://example.com/a.jpg", caption: "示意圖" },
    { id: "3", type: "video", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
    { id: "4", type: "example", prompt: "幫我規劃週末半日遊" },
    { id: "5", type: "link", label: "看更多", url: "/smart/guide" },
  ];

  it("五種區塊都能通過驗證", () => {
    expect(chapterOverridesSchema.safeParse({ blocks }).success).toBe(true);
  });

  it("圖片區塊拒絕非 http 網址、影片區塊拒絕非 YouTube", () => {
    expect(chapterBlockSchema.safeParse({ id: "x", type: "image", url: "javascript:alert(1)" }).success).toBe(false);
    expect(chapterBlockSchema.safeParse({ id: "x", type: "video", url: "https://evil.com/v" }).success).toBe(false);
  });

  it("未知區塊類型一律拒絕（例如 iframe、html）", () => {
    expect(chapterBlockSchema.safeParse({ id: "x", type: "html", body: "<script>" }).success).toBe(false);
  });

  it("儲存前丟掉空白區塊，保留有內容的", () => {
    const n = normalizeOverrides({
      blocks: [...blocks, { id: "6", type: "text", body: "   " }, { id: "7", type: "link", label: "", url: "/x" }],
    });
    expect(n.blocks).toHaveLength(5);
  });

  it("全部空白 → 不存 blocks（章節回到沒有區塊）", () => {
    expect(normalizeOverrides({ blocks: [{ id: "1", type: "text", body: "" }] }).blocks).toBeUndefined();
  });

  it("isBlockFilled 判斷各類型", () => {
    expect(isBlockFilled({ id: "a", type: "example", prompt: " " })).toBe(false);
    expect(isBlockFilled({ id: "a", type: "image", url: "https://x.com/a.png" })).toBe(true);
  });

  it("套用後章節帶有區塊，且順序不變", () => {
    const merged = applyChapterOverrides(base, { blocks });
    expect(merged.blocks?.map((b) => b.id)).toEqual(["1", "2", "3", "4", "5"]);
    expect(base.blocks).toBeUndefined();
  });
});

describe("後台新增的章節", () => {
  it("QR 碼規則：四碼、前兩碼 01–12", () => {
    expect(CUSTOM_CHAPTER_ID_RE.test("0215")).toBe(true);
    expect(CUSTOM_CHAPTER_ID_RE.test("1299")).toBe(true);
    expect(CUSTOM_CHAPTER_ID_RE.test("1300")).toBe(false);
    expect(CUSTOM_CHAPTER_ID_RE.test("0015")).toBe(false);
    expect(CUSTOM_CHAPTER_ID_RE.test("215")).toBe(false);
  });

  it("範本本身就是一個可顯示的完整章節（通用路線卡版型）", () => {
    const ch = customChapterBase("0299");
    expect(ch.id).toBe("0299");
    expect(ch.layout).toBe("routes");
    expect(ch.entries?.length).toBe(4);
    expect(ch.tryPrompt).toBeTruthy();
    expect(ch.reflectPrompt).toBeTruthy();
  });

  it("後台內容蓋在範本上", () => {
    const ch = applyChapterOverrides(customChapterBase("0299"), { title: "週末小旅行", blocks: [{ id: "1", type: "example", prompt: "幫我排一日遊" }] });
    expect(ch.title).toBe("週末小旅行");
    expect(ch.blocks).toHaveLength(1);
    expect(ch.layout).toBe("routes");
  });
});

describe("書本目錄合併後台資料", () => {
  it("已發布的新章節放進對應的章，並依 QR 排序", () => {
    const sections = getBookGuideSections({ custom: [{ id: "0299", title: "週末小旅行" }] });
    const ch2 = sections.find((s) => s.id === "ch2")!;
    const last = ch2.chapters[ch2.chapters.length - 1];
    expect(last.id).toBe("0299");
    expect(last.label).toBe("週末小旅行");
    expect(last.href).toBe("/smart/chapter/0299");
  });

  it("不會用新章節蓋掉同 QR 的內建章節", () => {
    const sections = getBookGuideSections({ custom: [{ id: "0200", title: "假的" }] });
    const ch2 = sections.find((s) => s.id === "ch2")!;
    expect(ch2.chapters.filter((c) => c.id === "0200")).toHaveLength(1);
    expect(ch2.chapters.find((c) => c.id === "0200")!.label).not.toBe("假的");
  });

  it("後台改過的標題會反映在目錄", () => {
    const sections = getBookGuideSections({ titles: { "0200": "新的第二章標題" } });
    const ch = sections.flatMap((s) => s.chapters).find((c) => c.id === "0200")!;
    expect(ch.label).toBe("新的第二章標題");
  });

  it("沒有後台資料時與原本完全一樣", () => {
    expect(getBookGuideSections({})).toEqual(getBookGuideSections());
  });
});

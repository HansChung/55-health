import { describe, expect, it } from "vitest";
import { isMobileDevice, mediaFilename, saveMode } from "./save-media";
import { videoSaveName } from "./travel-video";

describe("存到手機相簿", () => {
  it("檔名：去掉不能用的字、加副檔名、太長截掉", () => {
    expect(mediaFilename("暖暖-日月潭/遊記:1", "video/mp4")).toBe("暖暖-日月潭 遊記 1.mp4");
    expect(mediaFilename("王小美拍的", "image/jpeg")).toBe("王小美拍的.jpg");
    expect(mediaFilename("  ", "image/png")).toBe("暖暖.png");
    expect(mediaFilename("長".repeat(100), "video/mp4")).toHaveLength(64);
  });

  it("伺服器端（沒有 window）一律當作下載", () => {
    expect(saveMode()).toBe("download");
  });

  it("影片檔名：MV 用歌名、年度／研學團用標題、其他用地點，加台北日期", () => {
    const at = "2026-10-12T17:30:00Z"; // 台北 10/13
    expect(videoSaveName({ kind: "montage", place: "日月潭", created_at: at })).toBe("日月潭-20261013");
    expect(videoSaveName({ kind: "single", place: null, created_at: at })).toBe("出遊影片-20261013");
    expect(videoSaveName({ kind: "mv", place: "鹿港", created_at: at, mv: { title: "鹿港小鎮", lyrics: "", language: "mandarin", style: "folk", is_variant: false, alt_available: false } })).toBe("鹿港小鎮-20261013");
    expect(videoSaveName({ kind: "tour", place: null, created_at: at, yearly: { year: 2026, title: "太魯閣峽谷健行" } })).toBe("太魯閣峽谷健行-20261013");
  });
});

describe("手機才走分享選單", () => {
  it("iPhone、Android、iPad（假裝是 Mac 但有觸控）是手機；Windows／Mac 電腦不是", () => {
    expect(isMobileDevice("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)", 5)).toBe(true);
    expect(isMobileDevice("Mozilla/5.0 (Linux; Android 15; Pixel 9)", 5)).toBe(true);
    expect(isMobileDevice("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 5)).toBe(true);
    expect(isMobileDevice("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 0)).toBe(false);
    expect(isMobileDevice("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/140", 0)).toBe(false);
  });
});

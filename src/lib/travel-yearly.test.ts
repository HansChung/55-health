import { describe, expect, it } from "vitest";
import {
  YEARLY_MAX_PHOTOS,
  YEARLY_PHOTO_SECONDS,
  YEARLY_TITLE_SECONDS,
  defaultYearlyPicks,
  defaultYearlyTitle,
  sanitizeYearlyCaption,
  taipeiYearMonth,
  taipeiYearRange,
  yearlyCaption,
  yearlyProgress,
  yearlyProgressLabel,
  yearlySegments,
  yearlyStage,
  type YearlyState,
} from "./travel-yearly";
import { buildYearlyMuxArgs, yearlySize } from "./ai/travel-yearly-server";
import { videoShareMeta } from "./travel-video";

describe("年度回憶影片：時間與字幕", () => {
  it("台北時間的年份、月份（UTC 12/31 晚上已經是台北 1/1）", () => {
    expect(taipeiYearMonth("2026-12-31T17:00:00Z")).toEqual({ year: 2027, month: 1 });
    expect(taipeiYearMonth("2026-03-15T02:00:00Z")).toEqual({ year: 2026, month: 3 });
    expect(taipeiYearRange(2026)).toEqual({ start: "2025-12-31T16:00:00.000Z", end: "2026-12-31T16:00:00.000Z" });
  });

  it("預設字幕：「3 月・阿里山」；沒有地點只寫月份；太長截掉", () => {
    expect(yearlyCaption("2026-03-15T02:00:00Z", "阿里山")).toBe("3 月・阿里山");
    expect(yearlyCaption("2026-11-02T02:00:00Z", null)).toBe("11 月");
    expect([...yearlyCaption("2026-11-02T02:00:00Z", "很長很長很長很長很長的地方名字")].length).toBeLessThanOrEqual(14);
    expect(sanitizeYearlyCaption("  「女兒」的\n生日  ")).toBe("女兒的 生日");
    // 字型沒有表情符號，會變方框
    expect(sanitizeYearlyCaption("女兒生日快樂🎂👨‍👩‍👧❤️")).toBe("女兒生日快樂");
    expect(defaultYearlyTitle(2026)).toBe("2026 我的一年");
  });
});

describe("年度回憶影片：分段與進度", () => {
  it("片頭＋每張一段", () => {
    const segs = yearlySegments("2026 我的一年", ["3 月・阿里山", "5 月・鹿港", "8 月"]);
    expect(segs.map((s) => [s.photo, s.seconds, s.line])).toEqual([
      [0, YEARLY_TITLE_SECONDS, "2026 我的一年"],
      [0, YEARLY_PHOTO_SECONDS, "3 月・阿里山"],
      [1, YEARLY_PHOTO_SECONDS, "5 月・鹿港"],
      [2, YEARLY_PHOTO_SECONDS, "8 月"],
    ]);
    // 最多張也在 90 秒配樂內
    expect(YEARLY_TITLE_SECONDS + YEARLY_MAX_PHOTOS * YEARLY_PHOTO_SECONDS).toBeLessThanOrEqual(88);
  });

  it("進度：剪第幾段、合成", () => {
    const state: YearlyState = {
      year: 2026, title: "t", music: "warm", size: { width: 1280, height: 720 }, photos: [], attempts: 0,
      segments: yearlySegments("t", ["a", "b"]),
    };
    expect(yearlyStage(state)).toBe("clips");
    expect(yearlyProgressLabel(yearlyProgress(state))).toBe("正在剪第 1／3 段");
    state.segments = state.segments.map((s) => ({ ...s, clip_path: "x" }));
    expect(yearlyStage(state)).toBe("final");
    expect(yearlyProgressLabel(yearlyProgress(state))).toBe("快好了，正在配上音樂…");
  });
});

describe("defaultYearlyPicks", () => {
  const cands = (n: number) =>
    Array.from({ length: n }, (_, i) => ({ key: `k${i}`, date: new Date(Date.UTC(2026, 0, 1 + i * 3)).toISOString() }));
  it("不超過上限：全選，照日期排", () => {
    expect(defaultYearlyPicks([...cands(5)].reverse())).toEqual(["k0", "k1", "k2", "k3", "k4"]);
  });
  it("太多：整年平均挑剛好上限張、不重複", () => {
    const picks = defaultYearlyPicks(cands(100));
    expect(picks).toHaveLength(YEARLY_MAX_PHOTOS);
    expect(new Set(picks).size).toBe(YEARLY_MAX_PHOTOS);
    expect(Number(picks[0].slice(1))).toBeLessThan(10);
    expect(Number(picks[picks.length - 1].slice(1))).toBeGreaterThan(90);
  });
});

describe("合成與大小", () => {
  it("有配樂：循環播放、淡入淡出、長度照片段總長", () => {
    const args = buildYearlyMuxArgs({ listPath: "/t/list.txt", musicPath: "/m/warm.m4a", totalSeconds: 54, outPath: "/t/o.mp4" });
    expect(args.join(" ")).toContain("-stream_loop -1 -i /m/warm.m4a");
    expect(args.join(" ")).toContain("afade=t=out:st=50.00:d=4");
    expect(args[args.indexOf("-t") + 1]).toBe("54.00");
    expect(args).toContain("copy");
  });
  it("沒有配樂檔：配安靜的音軌", () => {
    const args = buildYearlyMuxArgs({ listPath: "/t/list.txt", musicPath: null, totalSeconds: 20, outPath: "/t/o.mp4" });
    expect(args.join(" ")).toContain("anullsrc");
  });
  it("直式照片多就直式；量不到大小的當橫式", () => {
    expect(yearlySize([{ width: 3, height: 4 }, { width: 3, height: 4 }, { width: null, height: null }])).toEqual({ width: 720, height: 1280 });
    expect(yearlySize([{ width: null, height: null }, { width: 3, height: 4 }])).toEqual({ width: 1280, height: 720 });
  });
  it("分享標題", () => {
    expect(videoShareMeta({ kind: "yearly", place: null, narration_text: null, montage_lines: null, yearly: { year: 2026, title: "2026 我的一年" } }).title).toBe(
      "📅 2026 我的一年"
    );
  });
});

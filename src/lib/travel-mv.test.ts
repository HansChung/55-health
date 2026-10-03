import { describe, it, expect } from "vitest";
import {
  MV_MAX_SECONDS,
  buildMvLyricsPrompt,
  mvProgressLabel,
  mvQuota,
  mvSegments,
  mvStage,
  mvSunoPrompt,
  sanitizeMvLyrics,
  sanitizeMvTitle,
  videoShareMeta,
  type MvState,
} from "./travel-video";
import { buildSongRequest } from "./ai/lk888-music";
import { buildMvMuxArgs } from "./ai/montage-compose";

function state(over: Partial<MvState> = {}): MvState {
  return {
    source_video_id: "s", language: "mandarin", style: "folk", vocal: "f", title: "日月潭之歌", lyrics: "[Verse 1]\n湖水藍藍",
    task_id: "1", song_path: null, alt_song_path: null, song_seconds: null, size: { width: 1280, height: 720 },
    photos: [{ path: "a", width: 1, height: 1 }, { path: "b", width: 1, height: 1 }, { path: "c", width: 1, height: 1 }],
    segments: null, attempts: 0, ...over,
  };
}

describe("MV 分段", () => {
  it("歌長分成約 9 秒一段、照片輪流，總長等於歌長", () => {
    const segs = mvSegments(150, 3);
    expect(segs.length).toBe(17);
    expect(segs.map((s) => s.photo).slice(0, 5)).toEqual([0, 1, 2, 0, 1]);
    expect(segs.reduce((a, s) => a + s.seconds, 0)).toBeCloseTo(150, 0);
  });
  it("超過 3 分鐘就只做 3 分鐘", () => {
    const total = mvSegments(240, 5).reduce((a, s) => a + s.seconds, 0);
    expect(total).toBeCloseTo(MV_MAX_SECONDS, 0);
  });
  it("做歌 → 剪輯 → 合成", () => {
    expect(mvStage(state())).toBe("song");
    const segs = mvSegments(30, 3);
    expect(mvStage(state({ song_path: "x", segments: segs }))).toBe("clips");
    expect(mvStage(state({ song_path: "x", segments: segs.map((s) => ({ ...s, clip_path: "c" })) }))).toBe("final");
    expect(mvProgressLabel({ stage: "clips", done: 2, total: 10 })).toBe("正在剪 MV 第 3／10 段");
  });
});

describe("MV 方案與文字", () => {
  it("只給專業版，每月 6 首", () => {
    expect(mvQuota("pro")).toBe(6);
    expect(mvQuota("basic")).toBe(0);
    expect(mvQuota("free")).toBe(0);
  });
  it("歌名、歌詞整理：保留換行與分段標記，去掉多餘空行", () => {
    expect(sanitizeMvTitle("  日月潭\n之歌  ")).toBe("日月潭 之歌");
    expect(sanitizeMvLyrics("[Verse 1]\r\n湖水  藍藍\n\n\n\n[Chorus]\n真歡喜")).toBe("[Verse 1]\n湖水 藍藍\n\n[Chorus]\n真歡喜");
  });
  it("台語歌：要求台語漢字、不要羅馬字；只寫遊記裡有的事", () => {
    const p = buildMvLyricsPrompt({ language: "taigi", style: "oldies", place: "鹿港", lines: ["今天來鹿港", "吃蚵仔煎"] });
    expect(p).toContain("台語漢字");
    expect(p).toContain("不要羅馬字");
    expect(p).toContain("1. 今天來鹿港");
    expect(p).toContain("不要編造");
    expect(buildMvLyricsPrompt({ language: "mandarin", style: "folk", place: null, lines: [] })).toContain("繁體中文");
  });
  it("Suno：曲風描述帶語言與男女聲，歌詞放 params.lyrics", () => {
    expect(mvSunoPrompt("upbeat", "taigi", "m")).toMatch(/upbeat.*male vocal.*Taiwanese Hokkien/);
    expect(buildSongRequest({ stylePrompt: "folk", lyrics: "[Verse]\n啦啦", vocal: "f" })).toEqual({
      model: "suno-v4.5",
      prompt: "folk",
      params: { lyrics: "[Verse]\n啦啦", mv: "chirp-v4-5", make_instrumental: "song", vocal_gender: "f" },
    });
  });
  it("分享頁標題：🎵 歌名・地點；說明用前兩句歌詞（不含分段標記）", () => {
    const meta = videoShareMeta({
      kind: "mv", place: "日月潭", narration_text: null, montage_lines: null,
      mv: { title: "湖邊的歌", lyrics: "[Verse 1]\n湖水藍藍\n風輕輕吹\n[Chorus]\n下次再來", language: "mandarin", style: "folk", source_video_id: "s" },
    });
    expect(meta.title).toBe("🎵 湖邊的歌・日月潭");
    expect(meta.description).toBe("「湖水藍藍／風輕輕吹」用暖暖做的MV");
  });
});

describe("MV 合成", () => {
  it("片段直接接、歌淡入淡出、長度跟片段一樣", () => {
    const args = buildMvMuxArgs({ listPath: "/t/l.txt", songPath: "/t/s.m4a", totalSeconds: 150, outPath: "/t/o.mp4" });
    const graph = args[args.indexOf("-filter_complex") + 1];
    expect(graph).toBe("[1:a]atrim=0:150.00,asetpts=PTS-STARTPTS,afade=t=in:d=0.5,afade=t=out:st=146.00:d=4[a]");
    expect(args.slice(args.indexOf("-c:v"), args.indexOf("-c:v") + 2)).toEqual(["-c:v", "copy"]);
    expect(args.slice(args.indexOf("-t"), args.indexOf("-t") + 2)).toEqual(["-t", "150.00"]);
  });
});

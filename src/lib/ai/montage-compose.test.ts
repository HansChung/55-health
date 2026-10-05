import { describe, expect, it } from "vitest";
import {
  buildClipArgs,
  buildConcatList,
  buildMuxArgs,
  clipBudgetNeededMs,
  kenBurns,
  montageClipSeconds,
  montageFrames,
  montageSize,
  narrationStarts,
} from "./montage-compose";
import {
  buildMontageScriptPrompt,
  montageProgress,
  montageProgressLabel,
  montageQuota,
  montageStage,
  sanitizeMontageLine,
  type MontageState,
} from "../travel-video";
import {
  leaseMsFor,
  montageAllPaths,
  montageContinueUrl,
  montageIntermediatePaths,
  montageRetryDelayMs,
} from "./travel-montage-server";

describe("遊記影片：版面與秒數", () => {
  it("直式照片比較多才做直式影片，一樣多時做橫式", () => {
    expect(montageSize([{ width: 900, height: 1600 }, { width: 900, height: 1600 }, { width: 1600, height: 900 }])).toEqual({ width: 720, height: 1280 });
    expect(montageSize([{ width: 900, height: 1600 }, { width: 1600, height: 900 }])).toEqual({ width: 1280, height: 720 });
    expect(montageSize([{ width: 1000, height: 1000 }])).toEqual({ width: 1280, height: 720 });
  });

  it("每張停留＝口白＋前後留白，落在 3.5～12 秒", () => {
    expect(montageClipSeconds(3.2)).toBe(4.5);
    expect(montageClipSeconds(0)).toBe(3.5);
    expect(montageClipSeconds(30)).toBe(12);
    expect(montageFrames(4.5)).toBe(113);
  });

  it("口白在每段開頭 0.4 秒開始", () => {
    expect(narrationStarts([4.5, 5.9, 5.1])).toEqual([0.4, 4.9, 10.8]);
  });
});

describe("遊記影片：ffmpeg 參數", () => {
  const size = { width: 1280, height: 720 };

  it("四種鏡頭輪流用，不用逗號（濾鏡字串才不會被切開）", () => {
    const moves = [0, 1, 2, 3, 4].map((v) => kenBurns(v, 100, size));
    expect(new Set(moves.slice(0, 4)).size).toBe(4);
    expect(moves[4]).toBe(moves[0]);
    for (const m of moves) {
      expect(m).toContain("d=100:s=1280x720:fps=25");
      expect(m.replace(/^zoompan=/, "").split(":").every((part) => !part.includes(","))).toBe(true);
    }
    expect(kenBurns(-1, 100, size)).toBe(moves[3]);
  });

  it("片段：模糊背景＋照片完整放進畫面＋淡入淡出＋ASS 字幕，沒有聲音", () => {
    const args = buildClipArgs({
      photoPath: "/tmp/p.jpg",
      assPath: "/tmp/a b/sub.ass",
      fontsDir: "/tmp/fonts",
      size,
      seconds: 4.5,
      variant: 0,
      outPath: "/tmp/out.mp4",
    });
    const graph = args[args.indexOf("-filter_complex") + 1];
    expect(graph).toContain("split=2[bgsrc][fgsrc]");
    expect(graph).toContain("boxblur=8:1");
    expect(graph).toContain("force_original_aspect_ratio=decrease");
    expect(graph).toContain("fade=t=in:st=0:d=0.5,fade=t=out:st=4.00:d=0.5");
    expect(graph).toContain("ass=filename='/tmp/a b/sub.ass':fontsdir='/tmp/fonts'");
    expect(graph).not.toContain("drawtext"); // Vercel 的 Linux ffmpeg 沒有 drawtext
    expect(args).toContain("-an");
    expect(args.slice(args.indexOf("-frames:v"), args.indexOf("-frames:v") + 2)).toEqual(["-frames:v", "113"]);
  });

  it("照片是使用者上傳的：只准本機檔案、只准圖片格式（防 SSRF）", () => {
    const args = buildClipArgs({ photoPath: "/t/p.jpg", assPath: null, fontsDir: "f", size, seconds: 4, variant: 1, outPath: "o" });
    const i = args.indexOf("-i");
    expect(args.slice(i - 4, i)).toEqual(["-protocol_whitelist", "file", "-format_whitelist", "image2,jpeg_pipe,png_pipe,webp_pipe"]);
  });

  it("沒有字幕時不加 ass 濾鏡", () => {
    const args = buildClipArgs({ photoPath: "p", assPath: null, fontsDir: "f", size, seconds: 4, variant: 1, outPath: "o" });
    expect(args[args.indexOf("-filter_complex") + 1]).not.toContain("ass=");
  });

  it("合成：片段直接接（不重新編碼），每句口白依序延遲後混在一起", () => {
    const args = buildMuxArgs({ listPath: "/t/list.txt", audioPaths: ["/t/a0.wav", "/t/a1.wav", "/t/a2.wav"], clipSeconds: [4.5, 5.9, 5.1], outPath: "/t/o.mp4" });
    expect(args.slice(0, 9)).toEqual(["-hide_banner", "-y", "-f", "concat", "-safe", "0", "-i", "/t/list.txt", "-i"]);
    const graph = args[args.indexOf("-filter_complex") + 1];
    expect(graph).toContain("[1:a]aresample=44100,adelay=400:all=1[a0]");
    expect(graph).toContain("[3:a]aresample=44100,adelay=10800:all=1[a2]");
    expect(graph).toContain("[a0][a1][a2]amix=inputs=3:duration=longest:dropout_transition=0:normalize=0,apad,atrim=0:15.50[aout]");
    expect(args.slice(args.indexOf("-c:v"), args.indexOf("-c:v") + 2)).toEqual(["-c:v", "copy"]);
    expect(args.slice(args.indexOf("-t"), args.indexOf("-t") + 2)).toEqual(["-t", "15.50"]);
  });

  it("有配樂：循環讀入、淡入淡出、說話時自動壓低，口白以原音量轉成立體聲", () => {
    const args = buildMuxArgs({ listPath: "/t/list.txt", audioPaths: ["/t/a0.wav", "/t/a1.wav"], clipSeconds: [6, 7], outPath: "/t/o.mp4", musicPath: "/m/warm.m4a" });
    const i = args.indexOf("/m/warm.m4a");
    expect(args.slice(i - 3, i + 1)).toEqual(["-stream_loop", "-1", "-i", "/m/warm.m4a"]);
    const graph = args[args.indexOf("-filter_complex") + 1];
    expect(graph).toContain("apad,atrim=0:13.00[narr]");
    expect(graph).toContain("[narr]pan=stereo|c0=c0|c1=c0,asplit=2[voice][key]");
    expect(graph).toContain("[3:a]aresample=44100,atrim=0:13.00,asetpts=PTS-STARTPTS,afade=t=in:d=1.5,afade=t=out:st=10.00:d=3[bgm]");
    expect(graph).toContain("[bgm][key]sidechaincompress=");
    expect(graph.endsWith("[voice][duck]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[aout]")).toBe(true);
  });

  it("沒有配樂：跟原本一樣只有口白", () => {
    const args = buildMuxArgs({ listPath: "/t/list.txt", audioPaths: ["/t/a0.wav"], clipSeconds: [6], outPath: "/t/o.mp4", musicPath: null });
    expect(args).not.toContain("-stream_loop");
    expect(args[args.indexOf("-filter_complex") + 1]).not.toContain("sidechaincompress");
  });

  it("concat 清單的路徑有單引號也不會壞", () => {
    expect(buildConcatList(["/tmp/a.mp4", "/tmp/it's.mp4"])).toBe("file '/tmp/a.mp4'\nfile '/tmp/it'\\''s.mp4'\n");
  });
});

describe("遊記影片：進度與設定", () => {
  const photo = (over: Partial<MontageState["photos"][number]> = {}) => ({
    path: "u/v/photo-0.jpg", width: 1024, height: 768, line: "今天來到日月潭",
    audio_path: null, narration_seconds: null, clip_path: null, clip_seconds: null, ...over,
  });

  it("配音 → 剪輯 → 合成", () => {
    const state: MontageState = { size: { width: 1280, height: 720 }, attempts: 0, photos: [photo(), photo()] };
    expect(montageStage(state)).toBe("tts");
    expect(montageProgress(state)).toEqual({ stage: "tts", done: 0, total: 2 });
    state.photos = [photo({ audio_path: "a0", clip_path: "c0" }), photo({ audio_path: "a1" })];
    expect(montageProgress(state)).toEqual({ stage: "clips", done: 1, total: 2 });
    expect(montageProgressLabel(montageProgress(state))).toBe("正在剪輯第 2／2 張");
    state.photos[1].clip_path = "c1";
    expect(montageStage(state)).toBe("final");
  });

  it("每句最多 20 字、去掉引號換行", () => {
    expect(sanitizeMontageLine("「今天\n來到日月潭」")).toBe("今天 來到日月潭");
    expect([...sanitizeMontageLine("字".repeat(40))]).toHaveLength(20);
  });

  it("每月遊記支數：免費版不能做", () => {
    expect(montageQuota("free")).toBe(0);
    expect(montageQuota("basic")).toBe(10);
    expect(montageQuota("unknown")).toBe(0);
  });

  it("AI 寫稿提示詞：張數、地點、字數", () => {
    const p = buildMontageScriptPrompt(4, "鹿港");
    expect(p).toContain("4 張");
    expect(p).toContain("剛好 4 句");
    expect(p).toContain("這趟去的地方：鹿港");
    expect(buildMontageScriptPrompt(3, "")).not.toContain("這趟去的地方");
  });

  it("刪除時清掉照片、配音、片段、成品", () => {
    const row = { user_id: "u", id: "v", montage: { size: { width: 1280, height: 720 }, attempts: 0, photos: [photo({ path: "u/v/photo-0.jpg" }), photo({ path: "u/v/photo-1.jpg" })] } };
    expect(montageIntermediatePaths(row, 2)).toEqual(["u/v/line-0.wav", "u/v/clip-0.mp4", "u/v/line-1.wav", "u/v/clip-1.mp4"]);
    expect(montageAllPaths(row)).toEqual([
      "u/v/photo-0.jpg", "u/v/photo-1.jpg",
      "u/v/line-0.wav", "u/v/clip-0.mp4", "u/v/line-1.wav", "u/v/clip-1.mp4",
      "u/v/video.mp4",
    ]);
  });
});

describe("遊記影片：背景接力", () => {
  it("有 CRON_SECRET 才接力；優先用正式網址，沒有才用這次請求的網址", () => {
    expect(montageContinueUrl({}, "https://nuan55.com")).toBeNull();
    expect(montageContinueUrl({ CRON_SECRET: "s", NEXT_PUBLIC_APP_URL: "https://nuan55.com/" }, "https://x.vercel.app"))
      .toBe("https://nuan55.com/api/cron/montage-step");
    expect(montageContinueUrl({ CRON_SECRET: "s", NEXT_PUBLIC_APP_URL: "http://localhost:3000" }, "http://localhost:3055"))
      .toBe("http://localhost:3055/api/cron/montage-step");
    expect(montageContinueUrl({ CRON_SECRET: "s" }, null)).toBeNull();
  });

  it("上一步失敗過就先等一下再試，最多等 12 秒", () => {
    expect(montageRetryDelayMs(0)).toBe(0);
    expect(montageRetryDelayMs(1)).toBe(4000);
    expect(montageRetryDelayMs(10)).toBe(12000);
  });
});

describe("雲端比較慢：一步做幾段、租約多長", () => {
  it("還沒做過就至少留 12 秒；做過一段就照上一段的時間再多留 3 秒", () => {
    expect(clipBudgetNeededMs(null)).toBe(12_000);
    expect(clipBudgetNeededMs(4_000)).toBe(12_000);
    expect(clipBudgetNeededMs(23_000)).toBe(26_000);
  });
  it("租約比這一步的工作時間長：畫面輪詢 45 秒 → 70 秒；背景接力 4 分鐘 → 4 分 25 秒", () => {
    expect(leaseMsFor(45_000)).toBe(70_000);
    expect(leaseMsFor(240_000)).toBe(265_000);
  });
});

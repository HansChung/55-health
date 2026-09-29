import { describe, it, expect } from "vitest";
import { buildComposeArgs, subtitleFontSize, wrapSubtitle } from "./video-compose";

const base = {
  videoPath: "/tmp/x/in.mp4",
  narrationPath: "/tmp/x/narration.wav",
  fontPath: "/tmp/x/font.ttf",
  outPath: "/tmp/x/out.mp4",
  cues: [
    { text: "今天來到日月潭", start: 0.4, end: 3.2, textFile: "/tmp/x/cue0.txt" },
    { text: "真的好舒服", start: 3.2, end: 10.5, textFile: "/tmp/x/cue1.txt" },
  ],
};

describe("buildComposeArgs", () => {
  it("有環境音：壓低環境音再和口白混音，字幕逐段依時間出現", () => {
    const args = buildComposeArgs({ ...base, info: { width: 1024, height: 768, hasAudio: true, duration: 10.13 } });
    const graph = args[args.indexOf("-filter_complex") + 1];
    expect(graph).toContain("[0:a]volume=0.25[amb]");
    expect(graph).toContain("[1:a]adelay=400:all=1[nar]");
    expect(graph).toContain("amix=inputs=2:duration=first");
    expect(graph).toContain("enable='between(t,0.4,3.2)'");
    expect(graph).toContain("enable='between(t,3.2,10.5)'");
    expect(graph).toContain("textfile='/tmp/x/cue0.txt'");
    expect(args.slice(-3)).toEqual(["-t", "10.13", "/tmp/x/out.mp4"]);
  });

  it("影片沒有音軌：只用口白（補靜音到影片結束）", () => {
    const args = buildComposeArgs({ ...base, info: { width: 1024, height: 768, hasAudio: false, duration: 10 } });
    const graph = args[args.indexOf("-filter_complex") + 1];
    expect(graph).not.toContain("[0:a]");
    expect(graph).toContain("[1:a]adelay=400:all=1,apad[aout]");
  });

  it("路徑裡的冒號、引號會被跳脫", () => {
    const args = buildComposeArgs({
      ...base,
      fontPath: "/tmp/a:b/font's.ttf",
      info: { width: 640, height: 480, hasAudio: true, duration: 5 },
    });
    expect(args.join(" ")).toContain("fontfile='/tmp/a\\:b/font\\'s.ttf'");
  });
});

describe("字幕排版", () => {
  it("字級依畫面短邊，直式影片不會太大", () => {
    expect(subtitleFontSize(1024, 768)).toBe(45);
    expect(subtitleFontSize(576, 1024)).toBe(33);
  });

  it("太長就平均分成多行", () => {
    expect(wrapSubtitle("今天來到日月潭", 20)).toBe("今天來到日月潭");
    expect(wrapSubtitle("一二三四五六七八九十", 6)).toBe("一二三四五\n六七八九十");
  });
});

import { ComposeBudgetError, composeNarratedVideo } from "./video-compose";

describe("composeNarratedVideo 時間預算", () => {
  it("剩餘時間不夠就不開始合成（丟 ComposeBudgetError，讓下次輪詢再做）", async () => {
    const t0 = Date.now();
    await expect(
      composeNarratedVideo({ video: Buffer.alloc(10), narration: Buffer.alloc(10), cues: [], deadline: Date.now() + 3_000 })
    ).rejects.toBeInstanceOf(ComposeBudgetError);
    expect(Date.now() - t0).toBeLessThan(1_000);
  });
});

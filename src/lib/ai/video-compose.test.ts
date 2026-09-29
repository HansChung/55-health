import { describe, it, expect } from "vitest";
import {
  assTime,
  buildAssSubtitles,
  buildComposeArgs,
  buildFontconfig,
  fontFamilyName,
  subtitleFontSize,
  wrapSubtitle,
} from "./video-compose";

const base = {
  videoPath: "/tmp/x/in.mp4",
  narrationPath: "/tmp/x/narration.wav",
  assPath: "/tmp/x/subtitles.ass",
  fontsDir: "/tmp/x/fonts",
  outPath: "/tmp/x/out.mp4",
};

describe("buildComposeArgs", () => {
  it("字幕用 ass 濾鏡（Vercel 的 Linux ffmpeg 沒有 drawtext）；環境音壓低再和口白混音", () => {
    const args = buildComposeArgs({ ...base, info: { width: 1024, height: 768, hasAudio: true, duration: 10.13 } });
    const graph = args[args.indexOf("-filter_complex") + 1];
    expect(graph).toContain("[0:v]ass=filename='/tmp/x/subtitles.ass':fontsdir='/tmp/x/fonts'[vout]");
    expect(graph).not.toContain("drawtext");
    expect(graph).toContain("[0:a]volume=0.25[amb]");
    expect(graph).toContain("[1:a]adelay=400:all=1[nar]");
    expect(graph).toContain("amix=inputs=2:duration=first");
    expect(args.slice(-3)).toEqual(["-t", "10.13", "/tmp/x/out.mp4"]);
  });

  it("影片沒有音軌：只用口白（補靜音到影片結束）；沒有字幕就不加 ass", () => {
    const args = buildComposeArgs({ ...base, assPath: null, info: { width: 1024, height: 768, hasAudio: false, duration: 10 } });
    const graph = args[args.indexOf("-filter_complex") + 1];
    expect(graph).toContain("[0:v]null[vout]");
    expect(graph).not.toContain("[0:a]");
    expect(graph).toContain("[1:a]adelay=400:all=1,apad[aout]");
  });

  it("路徑裡的冒號、引號會被跳脫", () => {
    const args = buildComposeArgs({
      ...base,
      assPath: "/tmp/a:b/sub's.ass",
      info: { width: 640, height: 480, hasAudio: true, duration: 5 },
    });
    expect(args.join(" ")).toContain("filename='/tmp/a\\:b/sub\\'s.ass'");
  });
});

describe("ASS 字幕檔", () => {
  it("時間格式 h:mm:ss.cc", () => {
    expect(assTime(0.4)).toBe("0:00:00.40");
    expect(assTime(6.245)).toBe("0:00:06.25");
    expect(assTime(75.5)).toBe("0:01:15.50");
  });

  it("以影片像素為座標、白字半透明黑框置中靠下，每段一行、時間照 cue", () => {
    const ass = buildAssSubtitles({
      cues: [
        { text: "清早漫步在日月潭的水上步道", start: 0.4, end: 6.24 },
        { text: "山水相伴心裡好快活", start: 6.24, end: 10.88 },
      ],
      width: 1152,
      height: 768,
      fontName: "Noto Sans TC",
    });
    expect(ass).toContain("PlayResX: 1152");
    expect(ass).toContain("PlayResY: 768");
    expect(ass).toMatch(/Style: Default,Noto Sans TC,45,&H00FFFFFF,&H00FFFFFF,&H8C000000,&H8C000000,-1,0,0,0,100,100,0,0,3,\d+,0,2,/);
    expect(ass).toContain("Dialogue: 0,0:00:00.40,0:00:06.24,Default,,0,0,0,,清早漫步在日月潭的水上步道");
    expect(ass).toContain("Dialogue: 0,0:00:06.24,0:00:10.88,Default,,0,0,0,,山水相伴心裡好快活");
  });

  it("太長換行用 \\N；{ } \\ 換成全形，避免被當成 ASS 指令", () => {
    const ass = buildAssSubtitles({
      cues: [{ text: "一二三四五六七八九十{特}\\", start: 0, end: 1 }],
      width: 300, // 字級 24、一行約 10 字
      height: 400,
      fontName: "F",
    });
    const line = ass.split("\n").find((l) => l.startsWith("Dialogue"))!;
    expect(line).toContain("\\N");
    expect(line).toContain("｛特｝＼");
    expect(line).not.toMatch(/[{}]/);
  });

  it("fontconfig 只看我們放的字型資料夾", () => {
    const conf = buildFontconfig("/tmp/x/fonts", "/tmp/x/cache");
    expect(conf).toContain("<dir>/tmp/x/fonts</dir>");
    expect(conf).toContain("<cachedir>/tmp/x/cache</cachedir>");
  });
});

/** 做一個只有 name 表的最小 TTF：nameID 1 = family */
function ttfWithFamily(family: string, typographic?: string): Buffer {
  const names = [[1, family], ...(typographic ? [[16, typographic]] : [])] as Array<[number, string]>;
  const encoded = names.map(([, n]) => Buffer.from(n, "utf16le").swap16());
  const count = names.length;
  const header = Buffer.alloc(6 + count * 12);
  header.writeUInt16BE(0, 0); header.writeUInt16BE(count, 2); header.writeUInt16BE(6 + count * 12, 4);
  let off = 0;
  names.forEach(([id], i) => {
    const r = 6 + i * 12;
    header.writeUInt16BE(3, r); header.writeUInt16BE(1, r + 2); header.writeUInt16BE(0x409, r + 4);
    header.writeUInt16BE(id, r + 6); header.writeUInt16BE(encoded[i].length, r + 8); header.writeUInt16BE(off, r + 10);
    off += encoded[i].length;
  });
  const nameTable = Buffer.concat([header, ...encoded]);
  const dir = Buffer.alloc(12 + 16);
  dir.writeUInt32BE(0x00010000, 0); dir.writeUInt16BE(1, 4);
  dir.write("name", 12, "ascii"); dir.writeUInt32BE(28, 20); dir.writeUInt32BE(nameTable.length, 24);
  return Buffer.concat([dir, nameTable]);
}

describe("fontFamilyName", () => {
  it("讀出字型家族名稱，優先用 typographic family（nameID 16）", () => {
    expect(fontFamilyName(ttfWithFamily("Noto Sans TC"))).toBe("Noto Sans TC");
    expect(fontFamilyName(ttfWithFamily("Noto Sans TC Bold", "Noto Sans TC"))).toBe("Noto Sans TC");
  });

  it("不是字型就回 null", () => {
    expect(fontFamilyName(Buffer.from("not a font"))).toBeNull();
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

import { chmod, mkdtemp, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { ensureExecutable } from "./video-compose";

describe("ensureExecutable（Vercel 上執行檔可能沒有執行權限）", () => {
  it("本來就能執行：直接用原路徑", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "ffx-"));
    const bin = path.join(dir, "ffmpeg");
    await writeFile(bin, "#!/bin/sh\n");
    await chmod(bin, 0o755);
    expect(await ensureExecutable(bin, path.join(dir, "copy"))).toBe(bin);
  });

  it("沒有執行權限：複製到可寫位置並補上執行權限", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "ffx-"));
    const bin = path.join(dir, "ffmpeg");
    const target = path.join(dir, "copy");
    await writeFile(bin, "#!/bin/sh\n");
    await chmod(bin, 0o644);
    expect(await ensureExecutable(bin, target)).toBe(target);
    expect((await stat(target)).mode & 0o111).not.toBe(0);
  });

  it("檔案不存在或沒有路徑：錯誤訊息說清楚", async () => {
    await expect(ensureExecutable("/nope/ffmpeg", "/tmp/x")).rejects.toThrow(/missing at \/nope\/ffmpeg/);
    await expect(ensureExecutable(null, "/tmp/x")).rejects.toThrow(/not available/);
  });
});

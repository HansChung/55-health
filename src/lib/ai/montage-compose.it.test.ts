/**
 * 真的跑 ffmpeg 做多張照片遊記影片（需本機素材）：
 *   MONTAGE_IT_DIR=素材資料夾（p1.jpg… 與 a1.wav…）MONTAGE_IT_OUT=輸出.mp4 npx vitest run montage-compose.it
 * 沒設環境變數時自動略過（CI 不跑）
 */
import { describe, it, expect } from "vitest";
import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { montageSize, muxMontage, renderMontageClip } from "./montage-compose";
import { fetchSubtitleFont, parseMediaInfo, runFfmpeg } from "./video-compose";
import { wavDurationSeconds } from "./lk888-tts";

const { MONTAGE_IT_DIR, MONTAGE_IT_OUT, MONTAGE_IT_SIZE } = process.env;
const LINES = ["今天來到日月潭", "湖邊的步道好舒服", "山上的空氣好清新", "中午吃了好吃的便當"];

describe.skipIf(!MONTAGE_IT_DIR)("遊記影片（整合）", () => {
  it("每張照片做成片段，再接成有口白字幕的影片", async () => {
    const files = (await readdir(MONTAGE_IT_DIR!)).sort();
    const photos = await Promise.all(files.filter((f) => /^p\d\.jpg$/.test(f)).map((f) => readFile(path.join(MONTAGE_IT_DIR!, f))));
    const audios = await Promise.all(files.filter((f) => /^a\d\.wav$/.test(f)).map((f) => readFile(path.join(MONTAGE_IT_DIR!, f))));
    const size = MONTAGE_IT_SIZE === "portrait" ? { width: 720, height: 1280 } : montageSize([{ width: 1024, height: 768 }]);
    const font = await fetchSubtitleFont(LINES.join(""));
    const clips: Buffer[] = [];
    const clipSeconds: number[] = [];
    for (let i = 0; i < photos.length; i++) {
      const t0 = Date.now();
      const { clip, seconds } = await renderMontageClip({
        photo: photos[i],
        line: LINES[i % LINES.length],
        narrationSeconds: wavDurationSeconds(audios[i]),
        size,
        variant: i,
        font,
        deadline: Date.now() + 60_000,
      });
      console.log(`clip ${i}: ${seconds}s ${(clip.length / 1e6).toFixed(2)}MB took=${Date.now() - t0}ms`);
      clips.push(clip);
      clipSeconds.push(seconds);
    }
    const t1 = Date.now();
    const out = await muxMontage({ clips, narrations: audios, clipSeconds, deadline: Date.now() + 60_000 });
    console.log(`mux: ${(out.length / 1e6).toFixed(2)}MB took=${Date.now() - t1}ms total=${clipSeconds.reduce((a, b) => a + b, 0).toFixed(1)}s`);
    if (MONTAGE_IT_OUT) {
      await writeFile(MONTAGE_IT_OUT, out);
      const probe = await runFfmpeg(["-hide_banner", "-i", MONTAGE_IT_OUT]);
      const info = parseMediaInfo(probe.stderr);
      console.log(JSON.stringify(info));
      expect(info.hasAudio).toBe(true);
      expect(info.width).toBe(size.width);
    }
    expect(out.length).toBeGreaterThan(200_000);
  }, 180_000);
});

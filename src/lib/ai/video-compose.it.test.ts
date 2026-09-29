/**
 * 真的跑 ffmpeg 合成（需本機素材）：
 *   FFMPEG_IT_VIDEO=影片.mp4 FFMPEG_IT_AUDIO=口白.wav FFMPEG_IT_OUT=輸出.mp4 npx vitest run video-compose.it
 * 沒設環境變數時自動略過（CI 不跑）
 */
import { describe, it, expect } from "vitest";
import { readFile, writeFile } from "node:fs/promises";
import { composeNarratedVideo, parseMediaInfo } from "./video-compose";
import { wavDurationSeconds } from "./lk888-tts";
import { buildSubtitleCues } from "../travel-video";

const { FFMPEG_IT_VIDEO, FFMPEG_IT_AUDIO, FFMPEG_IT_OUT, FFMPEG_IT_TEXT } = process.env;

describe.skipIf(!FFMPEG_IT_VIDEO || !FFMPEG_IT_AUDIO)("composeNarratedVideo（整合）", () => {
  it("輸出帶口白與字幕的 mp4", async () => {
    const video = await readFile(FFMPEG_IT_VIDEO!);
    const narration = await readFile(FFMPEG_IT_AUDIO!);
    const seconds = wavDurationSeconds(narration);
    const cues = buildSubtitleCues(FFMPEG_IT_TEXT ?? "今天來到日月潭，湖水好平靜，陽光灑在山上，真的好舒服。", seconds, 10.1);
    const t0 = Date.now();
    const out = await composeNarratedVideo({ video, narration, cues });
    console.log(`narration=${seconds.toFixed(2)}s cues=${JSON.stringify(cues)} out=${(out.length / 1e6).toFixed(2)}MB took=${Date.now() - t0}ms`);
    expect(out.length).toBeGreaterThan(100_000);
    if (FFMPEG_IT_OUT) await writeFile(FFMPEG_IT_OUT, out);
  }, 90_000);
});

describe("parseMediaInfo", () => {
  it("讀出尺寸、音軌、長度", () => {
    const info = parseMediaInfo(
      "  Duration: 00:00:10.13, start: 0.000000, bitrate: 4273 kb/s\n" +
        "  Stream #0:0[0x1](und): Video: h264 (High) (avc1 / 0x31637661), yuv420p(tv, bt709/bt709/iec61966-2-1, progressive), 1024x768, 4135 kb/s, 24 fps\n" +
        "  Stream #0:1[0x2](und): Audio: aac (LC) (mp4a / 0x6134706D), 32000 Hz, stereo, fltp, 130 kb/s (default)\n"
    );
    expect(info).toEqual({ width: 1024, height: 768, hasAudio: true, duration: 10.13 });
  });
});

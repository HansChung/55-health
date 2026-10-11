import { describe, it, expect } from "vitest";
import {
  ffmpegOutputSeconds,
  formatAudioDuration,
  formatRecordClock,
  isOwnPendingStoryAudio,
  pendingStoryAudioPath,
  storyAudioPath,
  storyAudioType,
} from "./story-audio";

const ME = "fdfa0297-542a-47e0-a471-b5a5bc4a75d2";
const OTHER = "fac6b1dc-079d-416a-ad4e-e45a0987367a";
const FILE = "0b6f5c1e-2a3d-4c5e-8f90-123456789abc";

describe("聲音故事：錄音格式", () => {
  it("上傳的 mp3／m4a 直接存；App 裡錄的 webm／ogg 要轉 m4a", () => {
    expect(storyAudioType("訪談.mp3", "audio/mpeg")).toEqual({ contentType: "audio/mpeg", ext: "mp3", convert: false });
    expect(storyAudioType("新錄音.m4a", "audio/x-m4a")).toEqual({ contentType: "audio/mp4", ext: "m4a", convert: false });
    expect(storyAudioType("錄音.M4A", "")).toEqual({ contentType: "audio/mp4", ext: "m4a", convert: false });
    expect(storyAudioType("recording.webm", "audio/webm;codecs=opus")).toEqual({ contentType: "audio/webm", ext: "webm", convert: true });
    expect(storyAudioType("recording.m4a", "audio/mp4")).toEqual({ contentType: "audio/mp4", ext: "m4a", convert: false });
    expect(storyAudioType("recording.ogg", "audio/ogg;codecs=opus")?.convert).toBe(true);
  });
  it("不收不認得的檔案", () => {
    expect(storyAudioType("影片.mov", "video/quicktime")).toBeNull();
    expect(storyAudioType("note.txt", "text/plain")).toBeNull();
    expect(storyAudioType("voice.amr", "audio/amr")).toBeNull();
  });
});

describe("聲音故事：存放位置", () => {
  it("暫存在自己的 pending 資料夾；存好後放在故事底下", () => {
    expect(pendingStoryAudioPath(ME, "m4a", FILE)).toBe(`${ME}/pending/${FILE}.m4a`);
    expect(storyAudioPath(ME, "story-1", "m4a")).toBe(`${ME}/story-1/audio.m4a`);
  });
  it("存故事時只認自己的暫存檔", () => {
    expect(isOwnPendingStoryAudio(`${ME}/pending/${FILE}.webm`, ME)).toBe(true);
    expect(isOwnPendingStoryAudio(`${OTHER}/pending/${FILE}.webm`, ME)).toBe(false);
    expect(isOwnPendingStoryAudio(`${ME}/story-1/audio.m4a`, ME)).toBe(false);
    expect(isOwnPendingStoryAudio(`${ME}/pending/../${OTHER}/x.m4a`, ME)).toBe(false);
    expect(isOwnPendingStoryAudio(`${ME}/pending/${FILE}.html`, ME)).toBe(false);
    expect(isOwnPendingStoryAudio(42, ME)).toBe(false);
  });
});

describe("聲音故事：長度", () => {
  it("顯示長度：秒、分、小時", () => {
    expect(formatAudioDuration(45)).toBe("45 秒");
    expect(formatAudioDuration(192)).toBe("3 分 12 秒");
    expect(formatAudioDuration(180)).toBe("3 分");
    expect(formatAudioDuration(3720)).toBe("1 小時 2 分");
    expect(formatRecordClock(155)).toBe("02:35");
  });
  it("從 ffmpeg 的進度拿到轉好的長度（webm 錄音常常沒有 Duration）", () => {
    const stderr = "Duration: N/A\nsize=  12kB time=00:00:05.12 bitrate=\nsize=  40kB time=00:03:12.48 bitrate= 64.0kbits/s";
    expect(ffmpegOutputSeconds(stderr)).toBeCloseTo(192.48);
    expect(ffmpegOutputSeconds("no progress")).toBeNull();
  });
});

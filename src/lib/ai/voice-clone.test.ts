import { describe, it, expect } from "vitest";
import { isVoiceExpired, toMyVoice, voiceCloneAllowed, type VoiceCloneRow } from "./voice-clone-server";
import { SAFE_AUDIO_INPUT, buildToWavArgs, isWav, wavRms } from "./audio-convert";

function row(over: Partial<VoiceCloneRow> = {}): VoiceCloneRow {
  return {
    id: "c1",
    user_id: "u1",
    provider_voice_id: "LK_1",
    model: "speech-2.8",
    sample_seconds: 20,
    demo_url: null,
    consent_text: "同意",
    consented_at: "2026-09-30T00:00:00Z",
    activated_at: null,
    expires_at: "2026-10-07T00:00:00Z",
    deleted_at: null,
    created_at: "2026-09-30T00:00:00Z",
    ...over,
  };
}

/** 16-bit 單聲道 WAV，每個取樣都是 value */
function pcmWav(samples: number, value: number): Buffer {
  const data = Buffer.alloc(samples * 2);
  for (let i = 0; i < samples; i++) data.writeInt16LE(value, i * 2);
  const fmt = Buffer.alloc(24);
  fmt.write("fmt ", 0); fmt.writeUInt32LE(16, 4); fmt.writeUInt16LE(1, 8); fmt.writeUInt16LE(1, 10);
  fmt.writeUInt32LE(24000, 12); fmt.writeUInt32LE(48000, 16); fmt.writeUInt16LE(2, 20); fmt.writeUInt16LE(16, 22);
  const head = Buffer.alloc(8); head.write("data", 0); head.writeUInt32LE(data.length, 4);
  const body = Buffer.concat([Buffer.from("WAVE"), fmt, head, data]);
  const riff = Buffer.alloc(8); riff.write("RIFF", 0); riff.writeUInt32LE(body.length, 4);
  return Buffer.concat([riff, body]);
}

describe("我的聲音：方案", () => {
  it("只有專業版與管理員可以用", () => {
    expect(voiceCloneAllowed("pro")).toBe(true);
    expect(voiceCloneAllowed("admin")).toBe(true);
    expect(voiceCloneAllowed("basic")).toBe(false);
    expect(voiceCloneAllowed("free")).toBe(false);
  });
});

describe("我的聲音：有效期", () => {
  const now = new Date("2026-10-08T00:00:00Z");
  it("沒用過、過了到期日 → 失效", () => {
    expect(isVoiceExpired(row(), now)).toBe(true);
    expect(isVoiceExpired(row(), new Date("2026-10-01T00:00:00Z"))).toBe(false);
  });
  it("用過一次就永久有效", () => {
    expect(isVoiceExpired(row({ activated_at: "2026-10-01T00:00:00Z" }), now)).toBe(false);
  });
  it("給前端的資料不含平台音色 id；啟用後不顯示到期日", () => {
    const v = toMyVoice(row({ activated_at: "2026-10-01T00:00:00Z" }), now);
    expect(v).toEqual({ id: "c1", created_at: "2026-09-30T00:00:00Z", demo_url: null, activated: true, expires_at: null, expired: false });
    expect(JSON.stringify(v)).not.toContain("LK_1");
  });
});

describe("錄音檢查", () => {
  it("認得 WAV", () => {
    expect(isWav(pcmWav(10, 0))).toBe(true);
    expect(isWav(Buffer.from("OggS......."))).toBe(false);
  });
  it("音量：一片安靜是 0，滿格約 1", () => {
    expect(wavRms(pcmWav(2400, 0))).toBe(0);
    expect(wavRms(pcmWav(2400, 16384))).toBeCloseTo(0.5, 3);
  });
  it("轉檔參數：單聲道 24kHz 16-bit，可截長度", () => {
    const args = buildToWavArgs("/tmp/in", "/tmp/out.wav", 60);
    expect(args).toEqual(expect.arrayContaining(["-ac", "1", "-ar", "24000", "-c:a", "pcm_s16le", "-t", "60"]));
    expect(args[args.length - 1]).toBe("/tmp/out.wav");
    expect(buildToWavArgs("/tmp/in", "/tmp/out.wav")).not.toContain("-t");
  });
});

describe("ffmpeg 讀使用者上傳的錄音：只准本機檔案、只准錄音格式（防 SSRF）", () => {
  it("whitelist 放在 -i 前面", () => {
    const args = buildToWavArgs("/tmp/in.bin", "/tmp/out.wav", 60);
    const i = args.indexOf("-i");
    expect(args.slice(i - SAFE_AUDIO_INPUT.length, i)).toEqual(SAFE_AUDIO_INPUT);
    expect(SAFE_AUDIO_INPUT).toEqual(expect.arrayContaining(["-protocol_whitelist", "file"]));
    const formats = SAFE_AUDIO_INPUT[SAFE_AUDIO_INPUT.indexOf("-format_whitelist") + 1];
    expect(formats).not.toMatch(/dash|hls|concat|http/);
  });
});

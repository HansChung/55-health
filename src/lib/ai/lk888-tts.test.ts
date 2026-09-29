import { describe, it, expect, vi } from "vitest";
import { buildTtsPrompt, synthesizeNarration, wavDurationSeconds } from "./lk888-tts";

/** 產生一段 PCM WAV：24kHz 單聲道 16-bit */
function makeWav(seconds: number, extraChunk = false): Buffer {
  const sampleRate = 24000, bytesPerSample = 2;
  const dataBytes = Math.round(seconds * sampleRate) * bytesPerSample;
  const fmt = Buffer.alloc(24);
  fmt.write("fmt ", 0); fmt.writeUInt32LE(16, 4); fmt.writeUInt16LE(1, 8); fmt.writeUInt16LE(1, 10);
  fmt.writeUInt32LE(sampleRate, 12); fmt.writeUInt32LE(sampleRate * bytesPerSample, 16);
  fmt.writeUInt16LE(bytesPerSample, 20); fmt.writeUInt16LE(16, 22);
  const list = extraChunk ? Buffer.concat([Buffer.from("LIST"), Buffer.from([4, 0, 0, 0]), Buffer.from("INFO")]) : Buffer.alloc(0);
  const dataHeader = Buffer.alloc(8); dataHeader.write("data", 0); dataHeader.writeUInt32LE(dataBytes, 4);
  const body = Buffer.concat([Buffer.from("WAVE"), fmt, list, dataHeader, Buffer.alloc(dataBytes)]);
  const riff = Buffer.alloc(8); riff.write("RIFF", 0); riff.writeUInt32LE(body.length, 4);
  return Buffer.concat([riff, body]);
}

describe("wavDurationSeconds", () => {
  it("算出秒數，中間有其他區塊也找得到 data", () => {
    expect(wavDurationSeconds(makeWav(9.5))).toBeCloseTo(9.5, 3);
    expect(wavDurationSeconds(makeWav(2, true))).toBeCloseTo(2, 3);
  });

  it("不是 WAV 就丟錯", () => {
    expect(() => wavDurationSeconds(Buffer.from("ID3 mp3 data......"))).toThrow();
  });
});

describe("buildTtsPrompt", () => {
  it("阿嬤／阿公：長輩語氣、慢慢念，台灣口音，原句放最後（與實測過的指示完全相同）", () => {
    expect(buildTtsPrompt("好漂亮", "female")).toBe(
      "Read slowly in a warm, kind, elderly Taiwanese grandmother's voice, with a gentle Taiwanese Mandarin accent: 好漂亮"
    );
    expect(buildTtsPrompt("好漂亮", "male")).toContain("elderly Taiwanese grandfather");
  });

  it("年輕女聲／男聲：二十多歲語氣（與實測過的指示完全相同）", () => {
    expect(buildTtsPrompt("好漂亮", "young_female")).toBe(
      "Read in a warm, friendly, young Taiwanese woman's voice (in their late twenties), with a natural Taiwanese Mandarin accent, at a relaxed pace: 好漂亮"
    );
    expect(buildTtsPrompt("好漂亮", "young_male")).toContain("young Taiwanese man's voice");
  });
});

describe("synthesizeNarration（攔截 fetch）", () => {
  it("送出 gem-3.1-tts、輪詢到完成、下載音檔並算秒數", async () => {
    vi.stubEnv("LK888_API_KEY", "sk-test");
    vi.useFakeTimers();
    const wav = makeWav(3.2);
    const calls: string[] = [];
    vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
      calls.push(String(url));
      if (String(url).endsWith("/v1/media/generate")) {
        const body = JSON.parse(String(init?.body));
        expect(body).toMatchObject({ model: "gem-3.1-tts", params: { voice_id: "Achird" } });
        return new Response(JSON.stringify({ code: 200, data: { task_id: 77 } }));
      }
      if (String(url).includes("/v1/skills/task-status")) {
        return new Response(JSON.stringify({ state: "success", is_final: true, error: null, cost: 0.03, result_urls: ["https://cdn/a.wav"], result_url: "https://cdn/a.wav" }));
      }
      return new Response(new Uint8Array(wav));
    });
    try {
      const p = synthesizeNarration("今天來到日月潭", "male");
      await vi.advanceTimersByTimeAsync(2_500);
      const r = await p;
      expect(r.seconds).toBeCloseTo(3.2, 3);
      expect(r.taskId).toBe("77");
      expect(r.platformCost).toBe(0.03);
      expect(calls[2]).toBe("https://cdn/a.wav");
    } finally {
      vi.useRealTimers();
      vi.unstubAllEnvs();
      vi.unstubAllGlobals();
    }
  });
});

describe("synthesizeNarration 總期限", () => {
  it("平台一直沒做好：在 45 秒內放棄並回報 timeout，不會拖過 route 的 60 秒", async () => {
    vi.stubEnv("LK888_API_KEY", "sk-test");
    vi.useFakeTimers();
    let polls = 0;
    vi.stubGlobal("fetch", async (url: string) => {
      if (String(url).endsWith("/v1/media/generate")) return new Response(JSON.stringify({ code: 200, data: { task_id: 5 } }));
      polls++;
      return new Response(JSON.stringify({ state: "running", is_final: false, error: null, result_urls: [] }));
    });
    try {
      const started = Date.now();
      const p = synthesizeNarration("好漂亮", "female");
      const assertion = expect(p).rejects.toMatchObject({ code: "timeout" });
      await vi.advanceTimersByTimeAsync(46_000);
      await assertion;
      expect(Date.now() - started).toBeLessThanOrEqual(46_000);
      expect(polls).toBeGreaterThan(10);
    } finally {
      vi.useRealTimers();
      vi.unstubAllEnvs();
      vi.unstubAllGlobals();
    }
  });
});

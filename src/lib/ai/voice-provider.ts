/**
 * 語音供應商抽象層 — STT（語音辨識）與 TTS（語音合成）
 *
 * 陪伴機器人的輕量問答走「錄音 → STT → LLM → TTS」管線，
 * 供應商用環境變數 VOICE_PROVIDER 切換：
 *   - openai（預設）：whisper-1 + tts-1
 *   - doubao：火山引擎（豆包）ASR/TTS，中文便宜很多；需要 DOUBAO_* env
 *
 * 之後要換供應商只要改 env，不用動任何呼叫端程式。
 */

export interface TranscribeResult {
  text: string;
  model: string;
}

export interface SynthesizeResult {
  audio: Buffer;
  mimeType: string;
  model: string;
}

export interface VoiceProvider {
  name: "openai" | "doubao";
  transcribe(audio: Buffer, mimeType: string): Promise<TranscribeResult>;
  synthesize(text: string): Promise<SynthesizeResult>;
}

export function getVoiceProvider(): VoiceProvider {
  const provider = (process.env.VOICE_PROVIDER || "openai").toLowerCase();
  if (provider === "doubao") return doubaoProvider;
  return openaiProvider;
}

// ────────────────────────────────────────────────
// OpenAI（預設）：whisper-1 + tts-1
// ────────────────────────────────────────────────

const openaiProvider: VoiceProvider = {
  name: "openai",

  async transcribe(audio, mimeType) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY 未設定");

    const model = "whisper-1";
    const ext = mimeType.includes("wav") ? "wav" : mimeType.includes("mpeg") ? "mp3" : "webm";
    const form = new FormData();
    form.append("file", new Blob([new Uint8Array(audio)], { type: mimeType }), `audio.${ext}`);
    form.append("model", model);
    form.append("language", "zh");
    // 提示詞讓 whisper 偏向台灣用語與健康情境
    form.append("prompt", "以下是台灣長輩用繁體中文的日常對話，內容多與飲食、健康、用藥有關。");

    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Whisper STT 失敗：${res.status} ${text.substring(0, 200)}`);
    }
    const data = await res.json();
    return { text: (data.text ?? "").trim(), model };
  },

  async synthesize(text) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY 未設定");

    const model = process.env.OPENAI_TTS_MODEL || "tts-1";
    const voice = process.env.OPENAI_TTS_VOICE || "shimmer"; // 與語音對話同聲線

    // wav：ESP32 不用解碼器就能直接 I2S 播放
    const res = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, voice, input: text, response_format: "wav" }),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenAI TTS 失敗：${res.status} ${errText.substring(0, 200)}`);
    }
    const audio = Buffer.from(await res.arrayBuffer());
    return { audio, mimeType: "audio/wav", model };
  },
};

// ────────────────────────────────────────────────
// 豆包 / 火山引擎（第二階段：中文成本更低）
// 需要 env：DOUBAO_APP_ID、DOUBAO_ACCESS_TOKEN
// 可選：DOUBAO_TTS_VOICE（預設 zh_female_wanwanxiaohe_moon_bigtts）、
//       DOUBAO_TTS_CLUSTER（預設 volcano_tts）
// 注意：豆包為中國大陸服務，延遲/資料落地需自行評估；
//       設 VOICE_PROVIDER=openai 可隨時切回。
// ────────────────────────────────────────────────

const doubaoProvider: VoiceProvider = {
  name: "doubao",

  async transcribe(audio, mimeType) {
    const appId = process.env.DOUBAO_APP_ID;
    const token = process.env.DOUBAO_ACCESS_TOKEN;
    if (!appId || !token) throw new Error("DOUBAO_APP_ID / DOUBAO_ACCESS_TOKEN 未設定");

    // 火山引擎「大模型錄音檔識別（極速版）」HTTP 端點：一次請求直接回文字
    const model = "doubao-asr-flash";
    const format = mimeType.includes("wav") ? "wav" : mimeType.includes("mpeg") ? "mp3" : "raw";
    const res = await fetch(
      "https://openspeech.bytedance.com/api/v3/auc/bigmodel/recognize/flash",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-App-Key": appId,
          "X-Api-Access-Key": token,
          "X-Api-Resource-Id": "volc.bigasr.auc_turbo",
          "X-Api-Request-Id": crypto.randomUUID(),
          "X-Api-Sequence": "-1",
        },
        body: JSON.stringify({
          user: { uid: "nuannuan-device" },
          audio: { format, data: audio.toString("base64") },
          request: { model_name: "bigmodel", enable_punc: true },
        }),
      }
    );
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`豆包 ASR 失敗：${res.status} ${errText.substring(0, 200)}`);
    }
    const data = await res.json();
    const text: string = data?.result?.text ?? data?.result?.utterances?.map((u: { text: string }) => u.text).join("") ?? "";
    return { text: text.trim(), model };
  },

  async synthesize(text) {
    const appId = process.env.DOUBAO_APP_ID;
    const token = process.env.DOUBAO_ACCESS_TOKEN;
    if (!appId || !token) throw new Error("DOUBAO_APP_ID / DOUBAO_ACCESS_TOKEN 未設定");

    const model = "doubao-tts";
    const res = await fetch("https://openspeech.bytedance.com/api/v1/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer;${token}`,
      },
      body: JSON.stringify({
        app: { appid: appId, token, cluster: process.env.DOUBAO_TTS_CLUSTER || "volcano_tts" },
        user: { uid: "nuannuan-device" },
        audio: {
          voice_type: process.env.DOUBAO_TTS_VOICE || "zh_female_wanwanxiaohe_moon_bigtts",
          encoding: "wav",
          speed_ratio: 0.9, // 稍慢一點，長輩聽得清楚
        },
        request: { reqid: crypto.randomUUID(), text, operation: "query" },
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`豆包 TTS 失敗：${res.status} ${errText.substring(0, 200)}`);
    }
    const data = await res.json();
    if (!data?.data) throw new Error(`豆包 TTS 回傳異常：${JSON.stringify(data).substring(0, 200)}`);
    return { audio: Buffer.from(data.data, "base64"), mimeType: "audio/wav", model };
  },
};

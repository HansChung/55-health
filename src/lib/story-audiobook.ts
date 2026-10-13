// ────────────────────────────────────────────────
// 回憶錄有聲書（前端用）：故事集照時間排成章節，一篇接一篇念
// 每一章用哪個聲音：自己錄的錄音 → 「用我的聲音念」的錄音（文字改過就不用）→ 手機內建的聲音念文字（免費）
// ────────────────────────────────────────────────

import { storySpeech, type LifeStory } from "./life-stories";

export type ChapterSource = "recording" | "voice" | "device";

export const CHAPTER_SOURCE_LABEL: Record<ChapterSource, string> = {
  recording: "🎙 自己錄的聲音",
  voice: "🗣 我的聲音（AI 合成）",
  device: "📱 手機的聲音念",
};

export interface AudiobookChapter {
  id: string;
  title: string;
  era: string | null;
  source: ChapterSource;
  /** recording／voice 的播放網址 */
  url: string | null;
  /** 手機念的句子（標題、年代、內文切成一句一句） */
  paragraphs: string[];
  /** 秒數（手機念的是估的） */
  seconds: number;
  cover: string | null;
}

/** 手機念的時候一次最多念幾個字（太長的一段有些瀏覽器會念到一半停住） */
export const SPEECH_CHUNK_MAX = 80;

/** 段落切成一句一句：先照句號、問號、驚嘆號切，還是太長就照逗號，最後硬切 */
export function speechChunks(paragraphs: string[], max = SPEECH_CHUNK_MAX): string[] {
  const out: string[] = [];
  const push = (t: string) => {
    const s = t.trim();
    if (s) out.push(s);
  };
  for (const p of paragraphs) {
    for (const sentence of p.split(/(?<=[。！？!?])/)) {
      if ([...sentence].length <= max) {
        push(sentence);
        continue;
      }
      let buf = "";
      for (const part of sentence.split(/(?<=[，、；,;])/)) {
        if ([...buf + part].length > max && buf) {
          push(buf);
          buf = "";
        }
        buf += part;
        while ([...buf].length > max) {
          push([...buf].slice(0, max).join(""));
          buf = [...buf].slice(max).join("");
        }
      }
      push(buf);
    }
  }
  return out;
}

/** 手機念中文大約每秒 4 個字（慢一點的速度） */
export const DEVICE_CHARS_PER_SECOND = 4;

export function estimateSpeechSeconds(paragraphs: string[]): number {
  const chars = paragraphs.reduce((n, p) => n + [...p.replace(/\s/g, "")].length, 0);
  return Math.max(1, Math.round(chars / DEVICE_CHARS_PER_SECOND));
}

/** 哪一篇的哪一種錄音播不出來（自己錄的、我的聲音分開記） */
export function brokenAudioKey(storyId: string, source: ChapterSource): string {
  return `${storyId}:${source}`;
}

/**
 * 章節：照寫故事的時間排（舊的在前，像一本書）；
 * 沒有錄音、也沒有文字可以念的篇（手機不能念時）就跳過
 */
export function audiobookChapters(
  stories: LifeStory[],
  opts: {
    deviceSpeech: boolean;
    /** 播不出來的錄音（brokenAudioKey）：跳過那一種，換下一種聲音 */
    brokenAudio?: ReadonlySet<string>;
  }
): AudiobookChapter[] {
  const sorted = [...stories].sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id));
  const out: AudiobookChapter[] = [];
  for (const s of sorted) {
    const base = { id: s.id, title: s.title, era: s.era, cover: s.photos[0]?.url ?? null };
    const paragraphs = speechChunks(storySpeech(s));
    const ok = (source: ChapterSource) => !opts.brokenAudio?.has(brokenAudioKey(s.id, source));
    if (ok("recording") && s.audio?.url) {
      out.push({ ...base, source: "recording", url: s.audio.url, paragraphs, seconds: Math.round(s.audio.seconds) });
    } else if (ok("voice") && s.voice_reading?.url && !s.voice_reading.outdated) {
      out.push({ ...base, source: "voice", url: s.voice_reading.url, paragraphs, seconds: Math.round(s.voice_reading.seconds) });
    } else if (opts.deviceSpeech && s.body.trim()) {
      out.push({ ...base, source: "device", url: null, paragraphs, seconds: estimateSpeechSeconds(paragraphs) });
    }
  }
  return out;
}

export function audiobookSeconds(chapters: AudiobookChapter[]): number {
  return chapters.reduce((n, c) => n + c.seconds, 0);
}

/** 約 1 小時 5 分／約 12 分鐘／不到 1 分鐘 */
export function formatBookDuration(seconds: number): string {
  const min = Math.round(seconds / 60);
  if (min < 1) return "不到 1 分鐘";
  if (min < 60) return `約 ${min} 分鐘`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `約 ${h} 小時 ${m} 分` : `約 ${h} 小時`;
}

/** 有幾章是用哪種聲音（給畫面說明） */
export function sourceCounts(chapters: AudiobookChapter[]): Record<ChapterSource, number> {
  const c: Record<ChapterSource, number> = { recording: 0, voice: 0, device: 0 };
  for (const ch of chapters) c[ch.source]++;
  return c;
}

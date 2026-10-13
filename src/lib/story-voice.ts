// ────────────────────────────────────────────────
// 我的故事集：用自己的聲音念（專業版，前後端共用）
// 長輩在「我的聲音」錄過一段 → 平台複製的聲音（speech-2.8）把整篇故事念成一個錄音檔，家人也聽得到
// 一篇最多 3000 多字：切成幾段分別合成，再接起來；每月有上限（每篇約 2～4 算力）
// ────────────────────────────────────────────────

import type { LifeStory } from "./life-stories";

// 每人每月可以念幾篇（重新念也算一篇）：後台「方案與次數」的 story_voice_monthly（預設 4）
/** 一段最多幾個字（平台一次合成的長度；太長容易逾時） */
export const STORY_VOICE_CHUNK_MAX = 300;
/** 段落之間停頓幾秒 */
export const STORY_VOICE_PAUSE_SECONDS = 0.5;

/** 要念的文字：標題、年代、內容（和「念給我聽」一樣） */
export function storyVoiceText(story: Pick<LifeStory, "title" | "era" | "body">): string {
  return [story.title, story.era ?? "", ...story.body.split(/\n+/)]
    .map((s) => s.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

/**
 * 切成一段段給平台合成：優先在換行、句號、問號、驚嘆號斷開，再不行在逗號，最後硬切。
 * 每段 ≤ max 個字（以字元算，emoji 等也不會被切壞）
 */
export function splitForVoice(text: string, max = STORY_VOICE_CHUNK_MAX): string[] {
  // 標題、年代、沒有句號的段落：補一個句號，合併成一段時才會停頓，不會念成一串
  const sentences = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => (/[。！？!?；;」』）)…]$/.test(line) ? line : `${line}。`))
    .flatMap((line) => line.match(/[^。！？!?；;]+[。！？!?；;」』）)]*|[^。！？!?；;]+$/g) ?? [])
    .map((s) => s.trim())
    .filter(Boolean);
  const pieces: string[] = [];
  for (const s of sentences) {
    if ([...s].length <= max) {
      pieces.push(s);
      continue;
    }
    // 太長的一句：在逗號斷，還是太長就硬切
    let buf = "";
    for (const part of s.match(/[^，,、]+[，,、]*/g) ?? [s]) {
      for (const ch of [...part]) {
        if ([...buf].length >= max) {
          pieces.push(buf);
          buf = "";
        }
        buf += ch;
      }
      if ([...buf].length >= max * 0.6) {
        pieces.push(buf);
        buf = "";
      }
    }
    if (buf) pieces.push(buf);
  }
  // 把短句併成接近 max 的段落（段數越少，合成越快）
  const chunks: string[] = [];
  let cur = "";
  for (const p of pieces) {
    if (cur && [...cur].length + [...p].length > max) {
      chunks.push(cur);
      cur = "";
    }
    cur += p;
  }
  if (cur) chunks.push(cur);
  return chunks;
}

/** 台北時間這個月 1 號 0 點（ISO） */
export function taipeiMonthStartIso(now: Date = new Date()): string {
  const tp = new Date(now.getTime() + 8 * 3600_000);
  return new Date(Date.UTC(tp.getUTCFullYear(), tp.getUTCMonth(), 1) - 8 * 3600_000).toISOString();
}

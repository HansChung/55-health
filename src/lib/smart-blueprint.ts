// ────────────────────────────────────────────────
// SMART RADAR 圓夢藍圖 — 日常「光點」（R = 安全）
// 與 SHI 問卷檢測並存：檢測看分數，藍圖看日常行動
// ────────────────────────────────────────────────

import type { SmartDimension, SmartScores } from "@/lib/smart";

export interface BlueprintDimension {
  key: SmartDimension;
  label: string;
  shortLabel: string;
  color: string;
  desc: string;
  examples: string[];
}

/** KU05 圓夢藍圖五軸（R = 安全） */
export const BLUEPRINT_DIMENSIONS: BlueprintDimension[] = [
  {
    key: "S",
    label: "連結",
    shortLabel: "S｜看見連結",
    color: "#E8845A",
    desc: "與家人朋友的互動與分享",
    examples: ["傳照片、傳訊息", "打一通電話給家人"],
  },
  {
    key: "M",
    label: "意義",
    shortLabel: "M｜看見意義",
    color: "#D9A441",
    desc: "整理故事、回憶與生活目標",
    examples: ["整理一段回憶", "寫下今天值得的事"],
  },
  {
    key: "A",
    label: "自主",
    shortLabel: "A｜看見自主",
    color: "#7AA779",
    desc: "自己安排、自己完成的事",
    examples: ["自己用導航去看診", "自己安排一日行程"],
  },
  {
    key: "R",
    label: "安全",
    shortLabel: "R｜看見安全",
    color: "#5BA0C9",
    desc: "防詐、查證、保護自己的安全",
    examples: ["截圖詢問可疑訊息", "查證不明連結再決定"],
  },
  {
    key: "T",
    label: "科技信任",
    shortLabel: "T｜看見科技信任",
    color: "#C95B6E",
    desc: "用科技保存、處理生活事務",
    examples: ["重要文件存進雲端", "用 App 完成一件事"],
  },
];

export const BLUEPRINT_INSIGHT =
  "SMART RADAR 的價值，不是把人生變成數字，而是讓方向變得清楚。";

export const BLUEPRINT_THINK =
  "一件日常小事，也可以成為人生羅盤上的第一個光點。";

export const CHECKLIST_ITEMS = [
  { id: "not_exam", label: "我知道 SMART RADAR 不是考試表。" },
  { id: "daily_ok", label: "我知道日常小事也可以放上雷達圖。" },
  { id: "picked", label: "我選出了一件最近完成的小事。" },
  { id: "found_spark", label: "我找到自己的第一個 SMART 光點。" },
  { id: "willing", label: "我願意從一個光點開始，慢慢看見方向。" },
] as const;

export type ChecklistId = (typeof CHECKLIST_ITEMS)[number]["id"];

export interface SmartSpark {
  id: string;
  user_id: string;
  dimension: SmartDimension;
  action_text: string;
  feeling_text: string;
  checklist: ChecklistId[];
  source: "spark_card" | "chapter3" | "chapter0100";
  created_at: string;
}

export interface SparkInput {
  dimension: SmartDimension;
  action_text: string;
  feeling_text: string;
  checklist?: ChecklistId[];
  source?: "spark_card" | "chapter3" | "chapter0100";
}

/** 光點數量 → 雷達顯示分數（0–100），讓第一個光點就看得見 */
export function sparkCountToScore(count: number): number {
  if (count <= 0) return 0;
  if (count === 1) return 45;
  if (count === 2) return 65;
  if (count === 3) return 80;
  return 100;
}

export function scoresFromSparkCounts(counts: Record<SmartDimension, number>): SmartScores {
  return {
    S: sparkCountToScore(counts.S),
    M: sparkCountToScore(counts.M),
    A: sparkCountToScore(counts.A),
    R: sparkCountToScore(counts.R),
    T: sparkCountToScore(counts.T),
  };
}

export function emptySparkCounts(): Record<SmartDimension, number> {
  return { S: 0, M: 0, A: 0, R: 0, T: 0 };
}

export function countSparksByDimension(
  sparks: Pick<SmartSpark, "dimension">[]
): Record<SmartDimension, number> {
  const counts = emptySparkCounts();
  for (const s of sparks) {
    if (counts[s.dimension] != null) counts[s.dimension] += 1;
  }
  return counts;
}

export function blueprintDim(key: SmartDimension): BlueprintDimension {
  return BLUEPRINT_DIMENSIONS.find((d) => d.key === key) ?? BLUEPRINT_DIMENSIONS[0];
}

/** 發光最多／需要補強（光點最少且為 0 優先） */
export function glowingDimension(counts: Record<SmartDimension, number>): BlueprintDimension {
  let best = BLUEPRINT_DIMENSIONS[0];
  let max = -1;
  for (const d of BLUEPRINT_DIMENSIONS) {
    if (counts[d.key] > max) {
      max = counts[d.key];
      best = d;
    }
  }
  return best;
}

export function needsBoostDimension(counts: Record<SmartDimension, number>): BlueprintDimension {
  let weakest = BLUEPRINT_DIMENSIONS[0];
  let min = Infinity;
  for (const d of BLUEPRINT_DIMENSIONS) {
    if (counts[d.key] < min) {
      min = counts[d.key];
      weakest = d;
    }
  }
  return weakest;
}

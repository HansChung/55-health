import type { ChapterLayout } from "./chapter-opening";

/** 支援登入後私人雲端草稿的版型（本頁卡片文字，不掃雲端／不搬檔） */
export const CLOUD_DRAFT_LAYOUTS = ["recipe-card", "life-assets"] as const;

export type CloudDraftLayout = (typeof CLOUD_DRAFT_LAYOUTS)[number];

export function supportsCloudDraft(layout: ChapterLayout | string | undefined): boolean {
  return CLOUD_DRAFT_LAYOUTS.includes(layout as CloudDraftLayout);
}

export function isChapterDraftId(id: string): boolean {
  return /^[0-9]{4}$/.test(id);
}

/** 判斷本機草稿是否「幾乎空白」（可被雲端覆蓋） */
export function isBlankDraftPayload(payload: unknown): boolean {
  if (!payload || typeof payload !== "object") return true;
  const values = Object.values(payload as Record<string, unknown>);
  if (values.length === 0) return true;
  return values.every((v) => {
    if (typeof v === "string") return v.trim() === "";
    if (typeof v === "boolean") return !v;
    if (Array.isArray(v)) return v.length === 0;
    return v == null;
  });
}

// 合作活動：後台送來的資料 → 寫進 DB 的欄位
import { z } from "zod";
import { isHttpUrl } from "./url-safety";

/** 網址欄位：http(s) 或留空（null／""＝清除） */
const optionalHttpUrl = z
  .union([z.literal(""), z.null(), z.string().max(1000).refine(isHttpUrl, "請輸入 http(s):// 開頭的網址")])
  .optional();

export const campaignPatchSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().min(1).max(500).optional(),
  partner_name: z.string().min(1).max(100).optional(),
  cta_label: z.string().max(40).optional(),
  cta_url: optionalHttpUrl,
  image_url: optionalHttpUrl,
  tags: z.array(z.string()).optional(),
  priority: z.number().int().optional(),
  starts_at: z.string().optional(),
  ends_at: z.string().nullable().optional(),
  active: z.boolean().optional(),
  disclaimer: z.string().max(200).optional(),
});
export type CampaignPatch = z.infer<typeof campaignPatchSchema>;

export const campaignCreateSchema = campaignPatchSchema.extend({
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  partner_name: z.string().min(1).max(100),
});

/**
 * 只更新「有送來」的欄位。
 * 修正：以前按「停用／啟用」只送 { active }，卻會把 cta_url、image_url 一起清成 null。
 */
export function buildCampaignPatch(body: CampaignPatch, now: string = new Date().toISOString()) {
  const patch: Record<string, unknown> = { updated_at: now };
  for (const [key, value] of Object.entries(body)) {
    if (value === undefined) continue;
    if (key === "cta_url" || key === "image_url") {
      patch[key] = value ? value : null; // "" 或 null → 清除
    } else {
      patch[key] = value;
    }
  }
  return patch;
}

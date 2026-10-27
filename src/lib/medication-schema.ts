// 一顆藥的格式（/api/profile 和 /api/profile/medications 共用）；沒列在這裡的欄位會被 zod 丟掉
// 上限放寬：舊資料（AI 從藥袋讀出來的長名字）也要存得回去
import { z } from "zod";

export const MedicationSchema = z.object({
  name: z.string().max(200),
  dose: z.string().max(200).optional(),
  time: z.string().max(200).optional(),
  english_name: z.string().max(200).optional(),
  purpose: z.string().max(500).optional(),
  warnings: z.array(z.string().max(500)).max(20).optional(),
  side_effects: z.array(z.string().max(500)).max(20).optional(),
  added_at: z.string().max(40).optional(),
  photo_url: z.string().max(1000).optional(),
  reminder_enabled: z.boolean().optional(),
  reminder_times: z.array(z.string().max(10)).max(12).optional(),
  taken_today: z.boolean().optional(),
  last_taken_at: z.string().max(40).optional(),
  taken_times: z.object({
    day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    times: z.array(z.string().max(10)).max(12),
  }).optional(),
});

export const MedicationListSchema = z.array(MedicationSchema).max(50);

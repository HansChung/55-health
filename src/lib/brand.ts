// ────────────────────────────────────────────────
// 白標品牌解析（依網域）
// 伺服端在 root layout 解析，注入 CSS 變數 + 提供給前端
// ────────────────────────────────────────────────
import { createClient } from "@supabase/supabase-js";

export interface Brand {
  id: string;
  app_name: string;
  tagline: string;
  primary_color: string;
  primary_deep: string;
  primary_soft: string;
  logo_emoji: string;
}

export const DEFAULT_BRAND: Brand = {
  id: "default",
  app_name: "暖暖",
  tagline: "陪 55+ 健康變老的 AI 管家",
  primary_color: "#E8845A",
  primary_deep: "#C95E36",
  primary_soft: "#FBE6D4",
  logo_emoji: "🐻",
};

/** 依 host 取得品牌；找不到就回預設（暖暖） */
export async function getBrandByHost(host: string | null): Promise<Brand> {
  if (!host) return DEFAULT_BRAND;
  // 去掉 port、轉小寫
  const clean = host.split(":")[0].toLowerCase();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return DEFAULT_BRAND;

  try {
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const { data } = await supabase
      .from("brands")
      .select("id, app_name, tagline, primary_color, primary_deep, primary_soft, logo_emoji")
      .eq("host", clean)
      .eq("active", true)
      .maybeSingle();
    if (data) return data as Brand;
  } catch {
    /* 解析失敗就用預設 */
  }
  return DEFAULT_BRAND;
}

/** 產生覆蓋 CSS 變數的字串（注入 <style>） */
export function brandCssVars(brand: Brand): string {
  return `:root{--primary:${brand.primary_color};--primary-deep:${brand.primary_deep};--primary-soft:${brand.primary_soft};}`;
}

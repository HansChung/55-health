"use client";

// ────────────────────────────────────────────────
// 顯示設定 hook — 字級放大 / 高對比
// 從 profile 載入，並同步到 <html> 的 data-fs / data-contrast 屬性
// （對長者重要：字級與對比直接影響可讀性）
// ────────────────────────────────────────────────

import { useEffect, useState } from "react";
import type { FontScale } from "@/lib/types";

interface DisplaySettingsSource {
  font_scale?: FontScale | null;
  high_contrast?: boolean | null;
}

export function useDisplaySettings(profile: DisplaySettingsSource | null | undefined) {
  const [fontScale, setFontScale] = useState<FontScale>("base");
  const [highContrast, setHighContrast] = useState(false);

  // 從 profile 同步初值
  useEffect(() => {
    if (profile?.font_scale) setFontScale(profile.font_scale);
    if (profile?.high_contrast !== undefined && profile?.high_contrast !== null) {
      setHighContrast(profile.high_contrast);
    }
  }, [profile]);

  // 套用到 <html>
  useEffect(() => {
    if (fontScale === "lg") document.documentElement.setAttribute("data-fs", "lg");
    else document.documentElement.removeAttribute("data-fs");
    if (highContrast) document.documentElement.setAttribute("data-contrast", "high");
    else document.documentElement.removeAttribute("data-contrast");
  }, [fontScale, highContrast]);

  return { fontScale, setFontScale, highContrast, setHighContrast };
}

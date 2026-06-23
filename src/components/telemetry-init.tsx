"use client";

import { useEffect } from "react";
import { installGlobalErrorTracking, trackEvent } from "@/lib/telemetry";

/** 在 App 啟動時掛上全域錯誤攔截，並記錄一次造訪 */
export function TelemetryInit() {
  useEffect(() => {
    installGlobalErrorTracking();
    trackEvent("app_open");
  }, []);
  return null;
}

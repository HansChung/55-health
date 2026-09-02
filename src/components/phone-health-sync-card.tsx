"use client";

import { useEffect, useState } from "react";
import { isNativeAndroid } from "@/lib/native-platform";
import {
  openPhoneHealthSettings,
  readTodaySteps,
  type PhoneHealthResult,
} from "@/lib/health-connect";

/**
 * 僅 Android App 顯示。網頁／iOS 回傳 null，不影響現有畫面。
 * 階段 1：只讀今日步數，不寫資料庫。
 */
export function PhoneHealthSyncCard() {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PhoneHealthResult | null>(null);

  useEffect(() => {
    setShow(isNativeAndroid());
  }, []);

  if (!show) return null;

  const onSync = async () => {
    setLoading(true);
    setResult(null);
    const r = await readTodaySteps();
    setResult(r);
    setLoading(false);
  };

  return (
    <div
      className="card"
      style={{
        padding: 18,
        marginBottom: 20,
        border: "1px solid var(--line)",
        background: "linear-gradient(180deg, #EEF6F0 0%, var(--surface) 70%)",
      }}
    >
      <div style={{ fontSize: "var(--fs-base)", fontWeight: 800, marginBottom: 6, color: "var(--ink-1)" }}>
        手機健康資料
      </div>
      <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", lineHeight: 1.5, marginBottom: 14 }}>
        從 Android「Health Connect」讀取今日步數。目前只顯示在這裡，還不會自動存進暖暖。
      </div>

      <button
        type="button"
        className="btn-primary"
        disabled={loading}
        onClick={onSync}
        style={{ width: "100%", opacity: loading ? 0.7 : 1 }}
      >
        {loading ? "讀取中…" : "同步今日步數"}
      </button>

      {result?.ok && (
        <div style={{ marginTop: 14, textAlign: "center" }}>
          <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", fontWeight: 700 }}>
            {result.dayKey} 步數
          </div>
          <div style={{ fontSize: 48, fontWeight: 800, color: "#7AA779", lineHeight: 1.1, margin: "4px 0" }}>
            {result.steps.toLocaleString("zh-TW")}
          </div>
          <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-3)" }}>{result.sourceNote}</div>
        </div>
      )}

      {result && !result.ok && (
        <div
          style={{
            marginTop: 14,
            padding: 12,
            borderRadius: 12,
            background: "var(--berry-soft, #F8E6E8)",
            color: "var(--berry, #C95B6E)",
            fontSize: "var(--fs-sm)",
            lineHeight: 1.5,
          }}
        >
          {result.message}
          {(result.code === "denied" || result.code === "unavailable") && (
            <button
              type="button"
              onClick={() => openPhoneHealthSettings()}
              style={{
                display: "block",
                marginTop: 10,
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid currentColor",
                background: "transparent",
                fontWeight: 700,
                fontSize: "var(--fs-sm)",
                color: "inherit",
                cursor: "pointer",
              }}
            >
              開啟 Health Connect 設定
            </button>
          )}
        </div>
      )}
    </div>
  );
}

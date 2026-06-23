// ────────────────────────────────────────────────
// 前端輕量遙測：使用事件 + 錯誤回報
// 用 sendBeacon（背景送出、不阻塞）；失敗就放棄，永不影響使用者
// ────────────────────────────────────────────────

interface QueuedEvent {
  kind: "usage" | "error";
  name: string;
  detail?: Record<string, unknown>;
  path?: string;
}

function send(events: QueuedEvent[]) {
  if (typeof window === "undefined" || events.length === 0) return;
  try {
    const body = JSON.stringify({ events });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/telemetry", new Blob([body], { type: "application/json" }));
    } else {
      fetch("/api/telemetry", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true });
    }
  } catch { /* 放棄 */ }
}

/** 記錄一筆使用事件 */
export function trackEvent(name: string, detail?: Record<string, unknown>) {
  send([{ kind: "usage", name, detail, path: typeof location !== "undefined" ? location.pathname : undefined }]);
}

/** 記錄一筆錯誤 */
export function trackError(name: string, detail?: Record<string, unknown>) {
  send([{ kind: "error", name, detail, path: typeof location !== "undefined" ? location.pathname : undefined }]);
}

let installed = false;
/** 掛上全域錯誤攔截（在 App 啟動時呼叫一次） */
export function installGlobalErrorTracking() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  window.addEventListener("error", (e) => {
    trackError("js_error", {
      message: String(e.message ?? "").slice(0, 300),
      source: e.filename,
      line: e.lineno,
    });
  });

  window.addEventListener("unhandledrejection", (e) => {
    const reason = (e as PromiseRejectionEvent).reason;
    trackError("unhandled_rejection", {
      message: String(reason?.message ?? reason ?? "").slice(0, 300),
    });
  });
}

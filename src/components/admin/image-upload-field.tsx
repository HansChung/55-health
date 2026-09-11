"use client";

// 後台用：上傳圖片欄位（點選或拖放 → 自動壓縮 → 上傳 → 回填網址）
// 也可以直接貼圖片網址
import { useRef, useState } from "react";
import { api } from "@/lib/api-client";
import { prepareImageForUpload } from "@/lib/image-resize";

interface Props {
  value: string;
  onChange: (url: string) => void;
  folder: "campaigns";
  hint?: string;
}

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

export function ImageUploadField({ value, onChange, folder, hint }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setError("");
    if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
      setError("請選擇 JPG、PNG、WebP 或 GIF 圖片");
      return;
    }
    setBusy(true);
    try {
      const prepared = await prepareImageForUpload(file);
      const { url } = await api.adminUploadImage(prepared, folder);
      onChange(url);
    } catch (e) {
      setError((e as Error).message || "上傳失敗");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => !busy && inputRef.current?.click()}
        onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !busy) inputRef.current?.click(); }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); upload(e.dataTransfer.files?.[0]); }}
        style={{
          border: `2px dashed ${dragging ? "#3b82f6" : "#334155"}`,
          background: dragging ? "#172554" : "#0f172a",
          borderRadius: 10, minHeight: 140, cursor: busy ? "wait" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          overflow: "hidden", position: "relative",
        }}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="活動圖片預覽" style={{ width: "100%", maxHeight: 220, objectFit: "contain", display: "block", opacity: busy ? 0.4 : 1 }} />
        ) : (
          <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 13, padding: 16, lineHeight: 1.6 }}>
            <div style={{ fontSize: 28 }}>🖼️</div>
            點這裡選擇圖片，或把圖片拖進來
            <div style={{ fontSize: 11, color: "#64748b" }}>{hint ?? "JPG／PNG／WebP／GIF，大圖會自動縮小"}</div>
          </div>
        )}
        {busy && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700 }}>
            上傳中…
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept={ACCEPT} hidden onChange={(e) => upload(e.target.files?.[0])} />

      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="或貼上圖片網址 https://…"
          style={{
            flex: 1, background: "#0f172a", color: "#fff", border: "1px solid #334155",
            padding: "7px 10px", borderRadius: 6, fontSize: 13, outline: "none", minWidth: 0,
          }}
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            style={{ background: "transparent", color: "#fecaca", border: "1px solid #7f1d1d", borderRadius: 6, padding: "6px 10px", cursor: "pointer", fontSize: 13 }}
          >
            移除圖片
          </button>
        )}
      </div>
      {error && <div style={{ color: "#fecaca", fontSize: 12, marginTop: 6 }}>{error}</div>}
    </div>
  );
}

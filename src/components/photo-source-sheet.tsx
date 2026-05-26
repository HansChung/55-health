"use client";

import { Icon } from "./icons";

interface PhotoSourceSheetProps {
  onClose: () => void;
  onCamera: () => void;             // 點「拍照」：開啟相機畫面
  onFile: (file: File) => void;     // 點「上傳照片」：選好檔案後回傳
}

/**
 * Action sheet：讓用戶選擇用相機拍 OR 從相簿/檔案上傳
 */
export function PhotoSourceSheet({ onClose, onCamera, onFile }: PhotoSourceSheetProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) onFile(f);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "absolute", inset: 0, zIndex: 60,
        background: "rgba(45, 28, 14, 0.45)",
        display: "flex", alignItems: "flex-end",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="fade-up"
        style={{
          width: "100%", background: "var(--bg)",
          borderRadius: "28px 28px 0 0",
          padding: "12px 20px 28px",
          boxShadow: "0 -10px 40px rgba(0,0,0,0.15)",
        }}
      >
        <div style={{
          width: 48, height: 5, borderRadius: 3,
          background: "var(--line-strong)", margin: "6px auto 16px",
        }} />

        <div style={{
          fontSize: "var(--fs-base)", fontWeight: 700, textAlign: "center",
          marginBottom: 16, color: "var(--ink-2)",
        }}>
          選擇照片來源
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {/* 拍照 */}
          <button
            onClick={() => { onClose(); onCamera(); }}
            style={{
              width: "100%", padding: "18px 20px",
              background: "var(--surface)",
              border: "2px solid var(--line)",
              borderRadius: 16,
              display: "flex", alignItems: "center", gap: 16,
              textAlign: "left", cursor: "pointer",
            }}
          >
            <div style={{
              width: 56, height: 56, borderRadius: 14,
              background: "var(--primary-soft)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <Icon name="camera" size={28} color="var(--primary-deep)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "var(--fs-base)", fontWeight: 700 }}>拍照</div>
              <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)" }}>
                開啟相機現場拍一張
              </div>
            </div>
            <Icon name="chevronR" size={22} color="var(--ink-3)" />
          </button>

          {/* 上傳檔案 — 用 label 包住才能在 iOS Safari 穩定觸發 */}
          <label
            style={{
              display: "flex",
              width: "100%", padding: "18px 20px",
              background: "var(--surface)",
              border: "2px solid var(--line)",
              borderRadius: 16,
              alignItems: "center", gap: 16,
              textAlign: "left", cursor: "pointer",
            }}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{
                position: "absolute",
                width: 1, height: 1,
                opacity: 0,
                pointerEvents: "none",
              }}
            />
            <div style={{
              width: 56, height: 56, borderRadius: 14,
              background: "var(--sage-soft)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <Icon name="book" size={28} color="var(--sage)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "var(--fs-base)", fontWeight: 700 }}>從相簿或檔案上傳</div>
              <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)" }}>
                選擇已經拍好的照片
              </div>
            </div>
            <Icon name="chevronR" size={22} color="var(--ink-3)" />
          </label>
        </div>

        <button
          onClick={onClose}
          style={{
            width: "100%", padding: "14px", marginTop: 16,
            background: "transparent",
            color: "var(--ink-2)",
            border: "none",
            fontSize: "var(--fs-base)", fontWeight: 600,
            cursor: "pointer",
          }}
        >
          取消
        </button>
      </div>
    </div>
  );
}

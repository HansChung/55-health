"use client";

import { useState, useEffect, useRef } from "react";
import { Icon } from "@/components/icons";
import { Mascot } from "@/components/mascot";
import { api } from "@/lib/api-client";
import type { FoodAnalysisResult } from "@/lib/ai/gemini";

interface CameraScreenProps {
  onClose: () => void;
  onCapture: (result: FoodAnalysisResult, photoDataUrl: string) => void;
}

export function CameraScreen({ onClose, onCapture }: CameraScreenProps) {
  const [stage, setStage] = useState<"aim" | "analyzing" | "error">("aim");
  const [errorMsg, setErrorMsg] = useState("");
  const [tipIdx, setTipIdx] = useState(0);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tips = ["對準餐盤", "光線充足會更準", "可以拍多樣食物"];

  useEffect(() => {
    if (stage !== "aim") return;
    const t = setInterval(() => setTipIdx((i) => (i + 1) % tips.length), 2500);
    return () => clearInterval(t);
  }, [stage]);

  const handleShutter = () => fileInputRef.current?.click();

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStage("analyzing");

    try {
      const dataUrl = await fileToDataUrl(file);
      setPhotoDataUrl(dataUrl);
      const base64 = dataUrl.split(",")[1];
      const mimeType = file.type || "image/jpeg";

      const { result } = await api.analyzeFood(base64, mimeType);
      onCapture(result, dataUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "辨識失敗";
      const status = (err as { status?: number })?.status;
      if (status === 401) setErrorMsg("請先登入");
      else if (status === 429) setErrorMsg("本月拍照次數已用完，請升級方案");
      else setErrorMsg(msg);
      setStage("error");
    }
  };

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 50,
      background: "#0E0905",
      display: "flex", flexDirection: "column",
    }}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelected}
        style={{ display: "none" }}
      />

      <div style={{
        flex: 1, position: "relative", overflow: "hidden",
        background: photoDataUrl
          ? `#000 url(${photoDataUrl}) center/cover no-repeat`
          : `radial-gradient(ellipse 70% 60% at 50% 55%, #D67340 0%, #8C4521 40%, #2A1409 90%)`,
      }}>
        {!photoDataUrl && (
          <div style={{
            position: "absolute", left: "50%", top: "50%",
            transform: "translate(-50%, -50%)",
            width: 280, height: 280, borderRadius: "50%",
            background: "radial-gradient(circle at 35% 30%, #FBE8C6 0%, #E0BC85 60%, #B8924C 100%)",
            boxShadow: "0 30px 60px rgba(0,0,0,0.5)",
            opacity: stage === "analyzing" ? 0.55 : 1,
          }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: 28 }}>
              <div style={{ width: 90, height: 90, borderRadius: "50%", background: "radial-gradient(circle at 30% 30%, #F5F0E0, #D4C8A4)" }} />
              <div style={{ width: 90, height: 80, borderRadius: "40%", background: "radial-gradient(circle at 30% 30%, #C95E36, #8C3A1C)" }} />
              <div style={{ width: 90, height: 80, borderRadius: "50%", background: "radial-gradient(circle at 40% 30%, #7AA779, #4F7A4E)" }} />
              <div style={{ width: 90, height: 90, borderRadius: 12, background: "repeating-linear-gradient(0deg, #E8C97A 0 6px, #D0AC55 6px 12px)" }} />
            </div>
          </div>
        )}

        <div style={{
          position: "absolute", top: 16, left: 16, right: 16,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <button onClick={onClose} style={{
            width: 52, height: 52, borderRadius: "50%",
            background: "rgba(0,0,0,0.5)", backdropFilter: "blur(10px)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon name="x" size={28} color="#fff" stroke={2.5} />
          </button>
          {stage === "aim" && (
            <div className="fade-up" key={tipIdx} style={{
              background: "rgba(0,0,0,0.55)", backdropFilter: "blur(10px)",
              borderRadius: 999, padding: "10px 18px",
              color: "#fff", fontSize: "var(--fs-sm)", fontWeight: 600,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <Icon name="sun" size={20} color="#F4B58E" />
              {tips[tipIdx]}
            </div>
          )}
          <div style={{ width: 52 }} />
        </div>

        {stage === "analyzing" && (
          <div style={{
            position: "absolute", inset: 0,
            background: "rgba(14,9,5,0.7)",
            backdropFilter: "blur(4px)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 24,
          }}>
            <div className="pop"><Mascot size={140} mood="thinking" /></div>
            <div className="fade-up" style={{
              background: "rgba(255,255,255,0.95)",
              borderRadius: 999, padding: "14px 24px",
              fontSize: "var(--fs-lg)", fontWeight: 700,
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <div style={{
                width: 24, height: 24, borderRadius: "50%",
                border: "3px solid var(--primary-soft)",
                borderTopColor: "var(--primary)",
                animation: "spin 0.8s linear infinite",
              }} />
              AI 正在看您吃了什麼…
            </div>
            <div style={{ fontSize: "var(--fs-sm)", color: "rgba(255,255,255,0.8)", textAlign: "center" }}>
              Gemini Pro 分析中，請稍候 5-10 秒
            </div>
          </div>
        )}

        {stage === "error" && (
          <div style={{
            position: "absolute", inset: 0,
            background: "rgba(14,9,5,0.85)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            padding: 32, gap: 20, textAlign: "center",
          }}>
            <div style={{ fontSize: 64 }}>😔</div>
            <h2 style={{ color: "#fff", fontSize: "var(--fs-xl)", margin: 0 }}>辨識失敗</h2>
            <p style={{ color: "rgba(255,255,255,0.8)", margin: 0 }}>{errorMsg}</p>
            <button
              className="btn-primary"
              onClick={() => { setStage("aim"); setPhotoDataUrl(null); setErrorMsg(""); }}
              style={{ marginTop: 12 }}
            >再試一次</button>
          </div>
        )}
      </div>

      <div style={{
        background: "#0E0905", padding: "24px 24px 40px",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <button onClick={handleShutter} disabled={stage !== "aim"} style={{
          width: 92, height: 92, borderRadius: "50%",
          background: "#fff",
          border: "5px solid rgba(255,255,255,0.3)",
          boxShadow: "0 0 0 4px #0E0905, 0 0 0 8px rgba(255,255,255,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          transform: stage === "analyzing" ? "scale(0.85)" : "scale(1)",
          transition: "transform 0.15s",
        }}>
          <div style={{
            width: 68, height: 68, borderRadius: "50%",
            background: stage === "analyzing" ? "var(--primary)" : "#fff",
            border: "2px solid var(--primary)",
          }} />
        </button>
      </div>
    </div>
  );
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

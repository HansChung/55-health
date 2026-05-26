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

type Stage = "init" | "ready" | "analyzing" | "error";

export function CameraScreen({ onClose, onCapture }: CameraScreenProps) {
  const [stage, setStage] = useState<Stage>("init");
  const [errorMsg, setErrorMsg] = useState("");
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [tipIdx, setTipIdx] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tips = ["對準餐盤", "光線充足會更準", "可以拍多樣食物"];

  // 啟動攝影機
  useEffect(() => {
    let mounted = true;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" }, // 優先後鏡頭
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setCameraReady(true);
        setStage("ready");
      } catch (err: unknown) {
        if (!mounted) return;
        const msg = err instanceof Error ? err.message : String(err);
        // 用戶拒絕、無攝影機等
        setErrorMsg(msg.includes("Permission") || msg.includes("NotAllowed")
          ? "需要相機權限才能拍照，請到瀏覽器設定開啟"
          : "無法開啟相機：" + msg);
        // 退化方案：直接打開檔案選擇
        setStage("ready");
      }
    }

    startCamera();
    return () => {
      mounted = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Tips 輪播
  useEffect(() => {
    if (stage !== "ready") return;
    const t = setInterval(() => setTipIdx((i) => (i + 1) % tips.length), 2500);
    return () => clearInterval(t);
  }, [stage]);

  const captureFromVideo = () => {
    if (!videoRef.current || !cameraReady) return null;
    const video = videoRef.current;
    // 縮到長邊最多 1280px，避免大圖
    const longest = Math.max(video.videoWidth, video.videoHeight);
    const scale = longest > 1280 ? 1280 / longest : 1;
    const w = Math.round(video.videoWidth * scale);
    const h = Math.round(video.videoHeight * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", 0.85);
  };

  const handleShutter = async () => {
    let dataUrl: string | null = null;

    if (cameraReady) {
      dataUrl = captureFromVideo();
    }

    if (!dataUrl) {
      // 退化：開檔案選擇器
      fileInputRef.current?.click();
      return;
    }

    await analyzePhoto(dataUrl);
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    await analyzePhoto(dataUrl);
  };

  const analyzePhoto = async (dataUrl: string) => {
    setPhotoDataUrl(dataUrl);
    setStage("analyzing");
    streamRef.current?.getTracks().forEach((t) => t.stop()); // 停 stream 省電

    try {
      const base64 = dataUrl.split(",")[1];
      const { result } = await api.analyzeFood(base64, "image/jpeg");
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

  const retake = () => {
    setStage("init");
    setPhotoDataUrl(null);
    setErrorMsg("");
    // 重新啟動相機
    window.location.reload();
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
        onChange={handleFileSelected}
        style={{ display: "none" }}
      />

      {/* 影像區 */}
      <div style={{
        flex: 1, position: "relative", overflow: "hidden",
        background: "#0E0905",
      }}>
        {/* 真實攝影機畫面 */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          style={{
            width: "100%", height: "100%", objectFit: "cover",
            display: photoDataUrl ? "none" : "block",
          }}
        />

        {/* 已拍照的預覽 */}
        {photoDataUrl && (
          <img
            src={photoDataUrl}
            alt="captured"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}

        {/* 初始化中 */}
        {stage === "init" && !errorMsg && (
          <div style={{
            position: "absolute", inset: 0,
            background: "rgba(14,9,5,0.8)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 16,
            color: "#fff",
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%",
              border: "3px solid rgba(255,255,255,0.3)",
              borderTopColor: "#fff",
              animation: "spin 0.8s linear infinite",
            }} />
            <div style={{ fontSize: "var(--fs-base)" }}>啟動相機中…</div>
          </div>
        )}

        {/* 上方按鈕列 */}
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
          {stage === "ready" && (
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

        {/* 取景框（四個角）*/}
        {stage === "ready" && !photoDataUrl && (
          <>
            {(["tl", "tr", "bl", "br"] as const).map((p) => {
              const m = 40;
              const styles: Record<string, React.CSSProperties> = {
                tl: { top: m, left: m, borderTop: "4px solid #fff", borderLeft: "4px solid #fff", borderRadius: "8px 0 0 0" },
                tr: { top: m, right: m, borderTop: "4px solid #fff", borderRight: "4px solid #fff", borderRadius: "0 8px 0 0" },
                bl: { bottom: m + 80, left: m, borderBottom: "4px solid #fff", borderLeft: "4px solid #fff", borderRadius: "0 0 0 8px" },
                br: { bottom: m + 80, right: m, borderBottom: "4px solid #fff", borderRight: "4px solid #fff", borderRadius: "0 0 8px 0" },
              };
              return <div key={p} style={{ position: "absolute", width: 36, height: 36, ...styles[p] }} />;
            })}
          </>
        )}

        {/* 分析中 */}
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

        {/* 錯誤 */}
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
            <button className="btn-primary" onClick={retake} style={{ marginTop: 12 }}>
              再試一次
            </button>
          </div>
        )}

        {/* 相機權限被拒，顯示 fallback */}
        {errorMsg && stage === "ready" && !photoDataUrl && (
          <div style={{
            position: "absolute", top: 80, left: 24, right: 24,
            background: "rgba(0,0,0,0.7)", color: "#fff",
            padding: 16, borderRadius: 12, fontSize: "var(--fs-sm)",
            textAlign: "center",
          }}>
            {errorMsg}<br />
            <span style={{ color: "#F4B58E" }}>請點下方按鈕從相簿選照片</span>
          </div>
        )}
      </div>

      {/* 底部控制列 */}
      <div style={{
        background: "#0E0905", padding: "20px 24px 36px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        {/* 左：從相簿選 */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={stage === "analyzing"}
          style={{
            width: 56, height: 56, borderRadius: 14,
            background: "rgba(255,255,255,0.1)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: 10, gap: 2,
          }}
        >
          <Icon name="book" size={24} color="#fff" />
          <span>相簿</span>
        </button>

        {/* 中：拍照 */}
        <button onClick={handleShutter} disabled={stage !== "ready"} style={{
          width: 92, height: 92, borderRadius: "50%",
          background: "#fff",
          border: "5px solid rgba(255,255,255,0.3)",
          boxShadow: "0 0 0 4px #0E0905, 0 0 0 8px rgba(255,255,255,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          transform: stage === "analyzing" ? "scale(0.85)" : "scale(1)",
          transition: "transform 0.15s",
          opacity: stage === "ready" ? 1 : 0.6,
        }}>
          <div style={{
            width: 68, height: 68, borderRadius: "50%",
            background: stage === "analyzing" ? "var(--primary)" : "#fff",
            border: "2px solid var(--primary)",
          }} />
        </button>

        {/* 右：切換前後鏡頭 */}
        <button
          onClick={() => switchCamera(streamRef, videoRef)}
          disabled={stage !== "ready" || !cameraReady}
          style={{
            width: 56, height: 56, borderRadius: 14,
            background: "rgba(255,255,255,0.1)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: 10, gap: 2,
          }}
        >
          <Icon name="refresh" size={24} color="#fff" />
          <span>翻轉</span>
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

async function switchCamera(
  streamRef: React.MutableRefObject<MediaStream | null>,
  videoRef: React.RefObject<HTMLVideoElement | null>
) {
  const currentTrack = streamRef.current?.getVideoTracks()[0];
  const currentFacing = currentTrack?.getSettings().facingMode;
  const newFacing = currentFacing === "user" ? "environment" : "user";

  streamRef.current?.getTracks().forEach((t) => t.stop());

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: newFacing } },
      audio: false,
    });
    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    }
  } catch (e) {
    console.error("switch camera failed", e);
  }
}

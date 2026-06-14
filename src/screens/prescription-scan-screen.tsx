"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { Mascot } from "@/components/mascot";
import { SubPage } from "@/components/sub-page";
import { api, type PrescriptionResult } from "@/lib/api-client";
import { compressImage } from "@/lib/image-utils";
import { uploadMealPhoto } from "@/lib/upload-photo";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { inferMedicationReminderTimes } from "@/lib/medication-utils";

interface PrescriptionScanScreenProps {
  onBack: () => void;
}

type Stage = "choose" | "camera" | "analyzing" | "result" | "error";

export function PrescriptionScanScreen({ onBack }: PrescriptionScanScreenProps) {
  const { user, profile, refreshProfile } = useAuth();
  const toast = useToast();
  const [stage, setStage] = useState<Stage>("choose");
  const [errorMsg, setErrorMsg] = useState("");
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<PrescriptionResult | null>(null);
  const [saving, setSaving] = useState(false);

  // 處理檔案選取
  const handleFile = async (file: File) => {
    setStage("analyzing");
    setErrorMsg("");
    try {
      const dataUrl = await compressImage(file, { maxSide: 1280, quality: 0.85 });
      setPhotoDataUrl(dataUrl);
      const base64 = dataUrl.split(",")[1];
      const { result } = await api.analyzePrescription(base64, "image/jpeg");
      setAnalysis(result);
      setStage("result");
    } catch (err: unknown) {
      console.error("[prescription] failed:", err);
      const status = (err as { status?: number })?.status;
      const msg = err instanceof Error ? err.message : "辨識失敗";
      if (status === 429) setErrorMsg("本月拍照次數已用完");
      else setErrorMsg(msg);
      setStage("error");
    }
  };

  // 儲存到 profile.medications
  const handleSaveAll = async () => {
    if (!analysis || !user) return;
    setSaving(true);
    try {
      // 上傳藥袋照片
      let photoUrl: string | null = null;
      if (photoDataUrl) {
        photoUrl = await uploadMealPhoto(user.id, photoDataUrl);
      }

      // 合併到現有藥物清單
      const existing = profile?.medications ?? [];
      const newMeds = analysis.medications.map((m) => ({
        name: m.name,
        dose: m.dose ?? "",
        time: [m.frequency, m.timing].filter(Boolean).join(" · "),
        // 附帶資訊
        english_name: m.english_name ?? undefined,
        purpose: m.purpose ?? undefined,
        warnings: m.warnings ?? undefined,
        side_effects: m.side_effects ?? undefined,
        added_at: new Date().toISOString(),
        photo_url: photoUrl ?? undefined,
        reminder_enabled: true,
        reminder_times: inferMedicationReminderTimes([m.frequency, m.timing].filter(Boolean).join(" ")),
        taken_today: false,
      }));

      await api.updateProfile({
        medications: [...existing, ...newMeds] as { name: string; dose?: string; time?: string }[],
      });
      await refreshProfile();
      toast.success(`已加入 ${newMeds.length} 種藥物到您的用藥清單。`);
      onBack();
    } catch (e) {
      console.error("儲存藥物失敗:", e);
      toast.error("沒存成功，請再試一次。");
    }
    setSaving(false);
  };

  if (stage === "camera") {
    return (
      <PrescriptionCamera
        onClose={() => setStage("choose")}
        onCapture={(result, dataUrl) => {
          setAnalysis(result);
          setPhotoDataUrl(dataUrl);
          setStage("result");
        }}
      />
    );
  }

  return (
    <SubPage
      title="拍藥袋辨識"
      onBack={onBack}
      accent="linear-gradient(180deg, #F7DDE0 0%, transparent 100%)"
    >
      {stage === "choose" && (
        <ChooseSource onCamera={() => setStage("camera")} onFile={handleFile} />
      )}

      {stage === "analyzing" && (
        <div style={{
          padding: 40, textAlign: "center",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 20,
        }}>
          {photoDataUrl && (
            <img
              src={photoDataUrl}
              alt="藥袋"
              style={{
                width: "100%", maxWidth: 280, borderRadius: 16,
                marginBottom: 8, opacity: 0.5,
              }}
            />
          )}
          <div className="pop"><Mascot size={120} mood="thinking" /></div>
          <div style={{
            background: "rgba(255,255,255,0.95)",
            borderRadius: 999, padding: "12px 22px",
            fontSize: "var(--fs-base)", fontWeight: 700,
            display: "flex", alignItems: "center", gap: 10,
            boxShadow: "var(--shadow-sm)",
          }}>
            <div style={{
              width: 20, height: 20, borderRadius: "50%",
              border: "3px solid var(--primary-soft)",
              borderTopColor: "var(--primary)",
              animation: "spin 0.8s linear infinite",
            }} />
            暖暖在看藥袋…
          </div>
          <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)" }}>
            約需 5-10 秒
          </div>
        </div>
      )}

      {stage === "error" && (
        <div style={{ padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 64, marginBottom: 12 }}>😔</div>
          <h2 style={{ margin: 0 }}>辨識失敗</h2>
          <p style={{ color: "var(--ink-2)", marginTop: 8 }}>{errorMsg}</p>
          <button
            className="btn-primary"
            style={{ marginTop: 20 }}
            onClick={() => { setStage("choose"); setPhotoDataUrl(null); setErrorMsg(""); }}
          >
            重新拍
          </button>
        </div>
      )}

      {stage === "result" && analysis && (
        <ResultView
          analysis={analysis}
          photoDataUrl={photoDataUrl}
          saving={saving}
          onSave={handleSaveAll}
          onRetry={() => { setStage("choose"); setAnalysis(null); setPhotoDataUrl(null); }}
        />
      )}
    </SubPage>
  );
}

function ChooseSource({ onCamera, onFile }: { onCamera: () => void; onFile: (file: File) => void }) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) onFile(f);
  };

  return (
    <>
      <div style={{
        background: "var(--berry-soft)", borderRadius: "var(--r-lg)",
        padding: 18, marginBottom: 22, display: "flex", gap: 14, alignItems: "flex-start",
        border: "1px solid #F7BFC6",
      }}>
        <div style={{ fontSize: 36 }}>💊</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "var(--fs-base)", fontWeight: 700, marginBottom: 4, color: "var(--berry)" }}>
            拍張您的藥袋
          </div>
          <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-1)", lineHeight: 1.5 }}>
            暖暖會幫您看：藥名、怎麼吃、注意事項。<br />
            自動加進您的用藥清單。
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {/* 拍照 */}
        <button onClick={onCamera} style={{
          display: "flex", padding: "20px",
          background: "var(--surface)", border: "2px solid var(--line)",
          borderRadius: 16, alignItems: "center", gap: 16, cursor: "pointer",
          textAlign: "left",
        }}>
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
            <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)" }}>用手機相機拍藥袋</div>
          </div>
          <Icon name="chevronR" size={22} color="var(--ink-3)" />
        </button>

        {/* 上傳 */}
        <label style={{
          display: "flex", padding: "20px",
          background: "var(--surface)", border: "2px solid var(--line)",
          borderRadius: 16, alignItems: "center", gap: 16, cursor: "pointer",
        }}>
          <input
            type="file"
            accept="image/*"
            onChange={handleChange}
            style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
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
            <div style={{ fontSize: "var(--fs-base)", fontWeight: 700 }}>從相簿上傳</div>
            <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)" }}>選擇已經拍好的照片</div>
          </div>
          <Icon name="chevronR" size={22} color="var(--ink-3)" />
        </label>
      </div>

      <div style={{
        marginTop: 24, padding: 14,
        background: "var(--surface-warm)", borderRadius: 12,
        fontSize: "var(--fs-sm)", color: "var(--ink-2)", lineHeight: 1.6,
      }}>
        💡 <strong>拍照小提醒：</strong><br />
        - 對準藥袋正面（看得到藥名 + 用法那一面）<br />
        - 光線充足、字看得清楚<br />
        - 一張照片可同時辨識多種藥
      </div>
    </>
  );
}

function PrescriptionCamera({ onClose, onCapture }: {
  onClose: () => void;
  onCapture: (result: PrescriptionResult, photoDataUrl: string) => void;
}) {
  const [stage, setStage] = useState<"init" | "ready" | "analyzing" | "error">("init");
  const [errorMsg, setErrorMsg] = useState("");
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let mounted = true;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
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
        setStage("ready");
      } catch (err: unknown) {
        if (!mounted) return;
        const msg = err instanceof Error ? err.message : String(err);
        setErrorMsg(msg.includes("Permission") || msg.includes("NotAllowed")
          ? "需要相機權限才能拍照，請到瀏覽器設定開啟"
          : "無法開啟相機：" + msg);
        setStage("ready");
      }
    }

    startCamera();
    return () => {
      mounted = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const captureFromVideo = () => {
    const video = videoRef.current;
    if (!video || !streamRef.current) return null;
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

  const analyzePhoto = async (dataUrl: string) => {
    setPhotoDataUrl(dataUrl);
    setStage("analyzing");
    streamRef.current?.getTracks().forEach((t) => t.stop());
    try {
      const base64 = dataUrl.split(",")[1];
      const { result } = await api.analyzePrescription(base64, "image/jpeg");
      onCapture(result, dataUrl);
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      const msg = err instanceof Error ? err.message : "辨識失敗";
      if (status === 429) setErrorMsg("本月拍照次數已用完");
      else if (status === 401) setErrorMsg("請先登入");
      else setErrorMsg(msg);
      setStage("error");
    }
  };

  const handleShutter = async () => {
    const dataUrl = captureFromVideo();
    if (!dataUrl) {
      fileInputRef.current?.click();
      return;
    }
    await analyzePhoto(dataUrl);
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await compressImage(file, { maxSide: 1280, quality: 0.85 });
    await analyzePhoto(dataUrl);
  };

  const retake = () => {
    setPhotoDataUrl(null);
    setErrorMsg("");
    setStage("init");
    streamRef.current?.getTracks().forEach((t) => t.stop());
    window.setTimeout(() => window.location.reload(), 0);
  };

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 60,
      background: "#0E0905", display: "flex", flexDirection: "column",
    }}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelected}
        style={{ display: "none" }}
      />

      <div style={{ flex: 1, position: "relative", overflow: "hidden", background: "#0E0905" }}>
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
        {photoDataUrl && (
          <img src={photoDataUrl} alt="藥袋" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        )}

        {stage === "init" && (
          <div style={{
            position: "absolute", inset: 0, background: "rgba(14,9,5,0.8)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: 16, color: "#fff",
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%",
              border: "3px solid rgba(255,255,255,0.3)",
              borderTopColor: "#fff", animation: "spin 0.8s linear infinite",
            }} />
            <div style={{ fontSize: "var(--fs-base)" }}>啟動相機中…</div>
          </div>
        )}

        <div style={{
          position: "absolute", top: 16, left: 16, right: 16,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <button onClick={onClose} aria-label="關閉相機" style={{
            width: 52, height: 52, borderRadius: "50%",
            background: "rgba(0,0,0,0.5)", backdropFilter: "blur(10px)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon name="x" size={28} color="#fff" stroke={2.5} />
          </button>
          {stage === "ready" && (
            <div style={{
              background: "rgba(0,0,0,0.55)", backdropFilter: "blur(10px)",
              borderRadius: 999, padding: "10px 18px",
              color: "#fff", fontSize: "var(--fs-sm)", fontWeight: 600,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <Icon name="sun" size={20} color="#F4B58E" />
              對準藥袋正面
            </div>
          )}
          <div style={{ width: 52 }} />
        </div>

        {stage === "ready" && !photoDataUrl && (
          <div style={{
            position: "absolute", left: 32, right: 32, top: "25%", bottom: "22%",
            border: "3px solid rgba(255,255,255,0.85)", borderRadius: 24,
            boxShadow: "0 0 0 999px rgba(0,0,0,0.18)",
          }} />
        )}

        {stage === "analyzing" && (
          <div style={{
            position: "absolute", inset: 0, background: "rgba(14,9,5,0.7)",
            backdropFilter: "blur(4px)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 24,
          }}>
            <div className="pop"><Mascot size={140} mood="thinking" /></div>
            <div style={{
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
              AI 正在看您的藥袋…
            </div>
          </div>
        )}

        {stage === "error" && (
          <div style={{
            position: "absolute", inset: 0, background: "rgba(14,9,5,0.85)",
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

        {errorMsg && stage === "ready" && !photoDataUrl && (
          <div style={{
            position: "absolute", top: 88, left: 24, right: 24,
            background: "rgba(0,0,0,0.7)", color: "#fff",
            padding: 16, borderRadius: 12, fontSize: "var(--fs-sm)",
            textAlign: "center",
          }}>
            {errorMsg}<br />
            <span style={{ color: "#F4B58E" }}>可改用下方相簿選照片</span>
          </div>
        )}
      </div>

      <div style={{
        background: "#0E0905", padding: "20px 24px 36px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
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

        <button onClick={handleShutter} disabled={stage !== "ready"} style={{
          width: 92, height: 92, borderRadius: "50%",
          background: "#fff",
          border: "5px solid rgba(255,255,255,0.3)",
          boxShadow: "0 0 0 4px #0E0905, 0 0 0 8px rgba(255,255,255,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          opacity: stage === "ready" ? 1 : 0.6,
        }}>
          <div style={{
            width: 68, height: 68, borderRadius: "50%",
            background: "#fff", border: "2px solid var(--berry)",
          }} />
        </button>

        <div style={{ width: 56 }} />
      </div>
    </div>
  );
}

function ResultView({ analysis, photoDataUrl, saving, onSave, onRetry }: {
  analysis: PrescriptionResult;
  photoDataUrl: string | null;
  saving: boolean;
  onSave: () => void;
  onRetry: () => void;
}) {
  return (
    <>
      {/* 暖暖總結 */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 12, marginBottom: 20 }}>
        <Mascot size={56} mood="happy" />
        <div style={{
          flex: 1, padding: "12px 16px",
          background: "var(--surface-warm)", borderRadius: 18,
          border: "1px solid var(--line)",
        }}>
          <div style={{ fontSize: "var(--fs-base)", fontWeight: 700, marginBottom: 4 }}>
            找到 {analysis.medications.length} 種藥
          </div>
          <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)" }}>
            {analysis.summary ?? "幫您整理好了，點儲存加入用藥清單"}
          </div>
        </div>
      </div>

      {photoDataUrl && (
        <img
          src={photoDataUrl}
          alt="藥袋"
          style={{
            width: "100%", maxHeight: 200, objectFit: "cover",
            borderRadius: 16, marginBottom: 20,
          }}
        />
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 100 }}>
        {analysis.medications.map((m, i) => (
          <div key={i} className="card" style={{ padding: 18 }}>
            {/* 藥名 */}
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 26 }}>💊</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "var(--fs-lg)", fontWeight: 800, color: "var(--berry)" }}>
                  {m.name}
                </div>
                {m.english_name && (
                  <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-3)", marginTop: 2 }}>
                    {m.english_name}
                  </div>
                )}
              </div>
            </div>

            {/* 怎麼吃 */}
            <Field icon="🕐" label="怎麼吃" value={[m.frequency, m.timing].filter(Boolean).join(" · ") || "—"} />
            {m.dose && <Field icon="📏" label="劑量" value={m.dose} />}
            {m.duration && <Field icon="📅" label="連續吃" value={m.duration} />}
            {m.purpose && <Field icon="🎯" label="治什麼" value={m.purpose} />}

            {/* 注意事項 */}
            {m.warnings && m.warnings.length > 0 && (
              <div style={{
                marginTop: 12, padding: 12,
                background: "#FFF3DF", borderRadius: 10,
                border: "1px solid var(--gold-soft)",
              }}>
                <div style={{
                  fontSize: "var(--fs-sm)", fontWeight: 700, color: "var(--primary-deep)", marginBottom: 6,
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  ⚠️ 注意事項
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: "var(--fs-sm)", lineHeight: 1.6 }}>
                  {m.warnings.map((w, j) => <li key={j}>{w}</li>)}
                </ul>
              </div>
            )}

            {/* 副作用 */}
            {m.side_effects && m.side_effects.length > 0 && (
              <div style={{
                marginTop: 10, padding: 12,
                background: "var(--sage-soft)", borderRadius: 10,
                border: "1px solid #B5D2B0",
              }}>
                <div style={{
                  fontSize: "var(--fs-sm)", fontWeight: 700, color: "#4F7A4E", marginBottom: 6,
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  💚 可能副作用
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: "var(--fs-sm)", lineHeight: 1.6 }}>
                  {m.side_effects.map((s, j) => <li key={j}>{s}</li>)}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 底部固定按鈕 */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: "16px 24px 32px",
        background: "linear-gradient(180deg, transparent, var(--bg) 30%)",
        display: "flex", gap: 12,
      }}>
        <button className="btn-ghost" style={{ flex: 1 }} onClick={onRetry}>
          重拍
        </button>
        <button
          className="btn-primary"
          style={{ flex: 2, opacity: saving ? 0.5 : 1 }}
          disabled={saving}
          onClick={onSave}
        >
          <Icon name="check" size={26} color="#fff" stroke={3} />
          {saving ? "儲存中…" : "加入用藥清單"}
        </button>
      </div>

      {/* 醫療免責 */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: "0 24px 6px", background: "var(--bg)",
        textAlign: "center", fontSize: "var(--fs-xs)", color: "var(--ink-3)",
        zIndex: -1,
      }}>
        ⚠️ AI 辨識僅供參考，正式用藥請以醫師指示為準
      </div>
    </>
  );
}

function Field({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "baseline", gap: 8,
      fontSize: "var(--fs-sm)", marginBottom: 6,
    }}>
      <span>{icon}</span>
      <span style={{ color: "var(--ink-2)", minWidth: 60 }}>{label}</span>
      <span style={{ flex: 1, fontWeight: 600 }}>{value}</span>
    </div>
  );
}

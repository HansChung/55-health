"use client";

// 後台：每一站一張 A4 集章海報（QR Code），印出來貼在現場
import { use, useEffect, useState } from "react";
import QRCode from "qrcode";
import { api } from "@/lib/api-client";
import { formatTourDateRange, stampUrl, type AdminStudyTourStop, type StudyTourRow } from "@/lib/study-tours";

/** QR 要指向正式網址：優先用 NEXT_PUBLIC_APP_URL，沒設才用目前網址 */
function appBaseUrl(): string {
  const env = process.env.NEXT_PUBLIC_APP_URL;
  if (env && /^https?:\/\//.test(env)) return env.replace(/\/+$/, "");
  return typeof window !== "undefined" ? window.location.origin : "";
}

export default function StudyTourQrPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [tour, setTour] = useState<StudyTourRow | null>(null);
  const [stops, setStops] = useState<AdminStudyTourStop[]>([]);
  const [svgs, setSvgs] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const baseUrl = appBaseUrl();
  const risky = !/^https:\/\//.test(baseUrl) || /localhost|127\.0\.0\.1/.test(baseUrl);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.adminGetStudyTour(id);
        setTour(data.tour);
        setStops(data.stops);
        const entries = await Promise.all(
          data.stops.map(async (s) => [
            s.id,
            await QRCode.toString(stampUrl(baseUrl, s.stamp_token), { type: "svg", margin: 1, errorCorrectionLevel: "M" }),
          ] as const)
        );
        setSvgs(Object.fromEntries(entries));
      } catch (e) {
        setError((e as Error).message);
      }
    })();
  }, [id, baseUrl]);

  return (
    <div>
      <style>{`
        @page { size: A4 portrait; margin: 0; }
        .qr-poster svg { width: 100%; height: 100%; display: block; }
        @media print {
          .admin-nav, .qr-toolbar { display: none !important; }
          .admin-root { background: #fff !important; display: block !important; }
          .admin-main { padding: 0 !important; overflow: visible !important; }
          .qr-poster { margin: 0 !important; box-shadow: none !important; border-radius: 0 !important; break-after: page; }
        }
      `}</style>

      <div className="qr-toolbar" style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#fff", margin: "0 0 8px" }}>
          列印集章 QR{tour ? `：${tour.title}` : ""}
        </h1>
        <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7 }}>
          每一站一張 A4。列印時「紙張」選 A4、「邊界」選無；建議護貝後貼在入口明顯處。<br />
          QR 網址：<code style={{ color: "#e2e8f0" }}>{baseUrl}/?stamp=…</code>
        </div>
        {risky && (
          <div style={{ marginTop: 10, padding: 12, borderRadius: 8, background: "#7f1d1d", color: "#fecaca", fontSize: 13 }}>
            ⚠️ 目前 QR 指向 {baseUrl}，長輩的手機可能連不到。請在正式站（例如 https://nuan55.com）的後台列印，或設定 NEXT_PUBLIC_APP_URL。
          </div>
        )}
        {error && <div style={{ color: "#fecaca", marginTop: 10 }}>錯誤：{error}</div>}
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button
            onClick={() => window.print()}
            disabled={stops.length === 0}
            style={{ background: "#3b82f6", color: "#fff", border: "none", padding: "10px 16px", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}
          >
            🖨️ 列印全部（{stops.length} 張）
          </button>
        </div>
        {tour && stops.length === 0 && (
          <div style={{ marginTop: 16, color: "#94a3b8" }}>這團還沒有站點，請先到研學團頁面新增站點。</div>
        )}
      </div>

      {tour && stops.map((stop, i) => (
        <section
          key={stop.id}
          className="qr-poster"
          style={{
            width: "210mm", height: "297mm", boxSizing: "border-box", margin: "0 auto 24px",
            background: "#fff", color: "#3D2E20", borderRadius: 8, boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
            padding: "16mm 16mm 12mm", display: "flex", flexDirection: "column", alignItems: "center",
            fontFamily: "\"Noto Sans TC\", \"PingFang TC\", system-ui, sans-serif", textAlign: "center",
          }}
        >
          <div style={{ fontSize: "14pt", fontWeight: 700, color: "#C95E36", letterSpacing: 2 }}>🧡 暖暖 55+ 研學護照・集章站</div>
          <div style={{ fontSize: "18pt", fontWeight: 700, marginTop: "4mm" }}>{tour.title}</div>
          <div style={{ fontSize: "12pt", color: "#6B5848", marginTop: "1mm" }}>{formatTourDateRange(tour.starts_at, tour.ends_at)}</div>

          <div style={{ fontSize: "54pt", lineHeight: 1, marginTop: "8mm" }}>{stop.stamp_emoji}</div>
          <div style={{ fontSize: "34pt", fontWeight: 800, marginTop: "3mm", lineHeight: 1.2 }}>
            第 {i + 1} 站　{stop.name}
          </div>

          <div
            aria-label={`第 ${i + 1} 站 QR Code`}
            style={{ width: "112mm", height: "112mm", marginTop: "8mm", border: "3mm solid #E8845A", borderRadius: "6mm", padding: "3mm", boxSizing: "content-box" }}
            dangerouslySetInnerHTML={{ __html: svgs[stop.id] ?? "" }}
          />

          <div style={{ fontSize: "20pt", fontWeight: 800, marginTop: "8mm", lineHeight: 1.7 }}>
            ① 打開手機相機　② 對準上面方塊<br />③ 點跳出來的連結，就蓋好章了！
          </div>
          <div style={{ marginTop: "auto", fontSize: "10pt", color: "#A89580" }}>
            集滿 {stops.length} 站可領結業證書　·　還沒有暖暖帳號的朋友，掃了會先請你登入
          </div>
        </section>
      ))}
    </div>
  );
}

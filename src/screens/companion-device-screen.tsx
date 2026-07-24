"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SubPage } from "@/components/sub-page";
import { Icon } from "@/components/icons";
import { Mascot } from "@/components/mascot";
import { api, type CompanionDevice } from "@/lib/api-client";

interface CompanionDeviceScreenProps {
  onBack: () => void;
}

/**
 * 陪伴機器人管理：
 * - 產生 6 位數配對碼（10 分鐘有效），機器人輸入後即綁定
 * - 顯示已綁定裝置（在線狀態 / 最後上線）、改名、解除綁定
 */
export function CompanionDeviceScreen({ onBack }: CompanionDeviceScreenProps) {
  const [devices, setDevices] = useState<CompanionDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pairing, setPairing] = useState<{ code: string; expiresAt: string; deviceId: string } | null>(null);
  const [creating, setCreating] = useState(false);
  const pollRef = useRef<number | null>(null);

  const reload = useCallback(async () => {
    try {
      const { devices } = await api.listDevices();
      setDevices(devices);
      return devices;
    } catch (e) {
      setError((e as Error).message);
      return [];
    }
  }, []);

  useEffect(() => {
    reload().finally(() => setLoading(false));
  }, [reload]);

  // 配對碼顯示期間每 4 秒輪詢：機器人配對成功會拿到 paired_at → 自動收起配對畫面
  useEffect(() => {
    if (!pairing) return;
    pollRef.current = window.setInterval(async () => {
      const list = await reload();
      const target = list.find((d) => d.id === pairing.deviceId);
      if (target?.paired_at) {
        setPairing(null);
      } else if (new Date(pairing.expiresAt).getTime() < Date.now()) {
        setPairing(null); // 過期自動收起
      }
    }, 4000);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [pairing, reload]);

  const startPairing = async () => {
    setCreating(true);
    setError("");
    try {
      const res = await api.createDevicePairing();
      setPairing({ code: res.pairing_code, expiresAt: res.expires_at, deviceId: res.device.id });
      await reload();
    } catch (e) {
      setError((e as Error).message);
    }
    setCreating(false);
  };

  const rename = async (device: CompanionDevice) => {
    const name = window.prompt("幫機器人取個名字", device.name);
    if (!name?.trim()) return;
    try {
      await api.renameDevice(device.id, name.trim().substring(0, 30));
      await reload();
    } catch (e) {
      alert("改名失敗：" + (e as Error).message);
    }
  };

  const unbind = async (device: CompanionDevice) => {
    if (!window.confirm(`確定要解除「${device.name}」的綁定嗎？機器人會立刻斷線。`)) return;
    try {
      await api.deleteDevice(device.id);
      await reload();
    } catch (e) {
      alert("解除綁定失敗：" + (e as Error).message);
    }
  };

  const paired = devices.filter((d) => d.paired_at);

  return (
    <SubPage
      title="陪伴機器人"
      onBack={onBack}
      accent="linear-gradient(180deg, #FBE6D4 0%, transparent 100%)"
    >
      {loading && (
        <div style={{ padding: 40, textAlign: "center", color: "var(--ink-2)" }}>載入中…</div>
      )}

      {error && (
        <div style={{
          padding: 12, marginBottom: 16,
          background: "var(--berry-soft)", borderRadius: 12,
          color: "var(--berry)", fontSize: "var(--fs-sm)",
        }}>{error}</div>
      )}

      {!loading && (
        <>
          {/* 說明卡 */}
          <div className="card" style={{
            padding: 20, marginBottom: 16,
            display: "flex", gap: 14, alignItems: "flex-start",
            background: "linear-gradient(135deg, #FFF9EF 0%, #FFFFFF 100%)",
          }}>
            <Mascot size={56} mood="excited" />
            <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", lineHeight: 1.6 }}>
              暖暖機器人是桌上的小夥伴：按一下就能跟暖暖說話、
              時間到會提醒吃藥。綁定後對話會同步到 App，家人也看得到。
            </div>
          </div>

          {/* 配對中：大字配對碼 */}
          {pairing ? (
            <div className="card" style={{ padding: 24, marginBottom: 16, textAlign: "center" }}>
              <div style={{ fontSize: "var(--fs-base)", fontWeight: 800, marginBottom: 12 }}>
                在機器人上輸入這組配對碼
              </div>
              <div style={{
                fontSize: 52, fontWeight: 800, letterSpacing: 10,
                color: "var(--primary-deep)", fontVariantNumeric: "tabular-nums",
              }}>
                {pairing.code}
              </div>
              <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-3)", marginTop: 10 }}>
                10 分鐘內有效 · 配對成功會自動完成
              </div>
              <div style={{
                marginTop: 14, fontSize: "var(--fs-sm)", color: "var(--ink-2)",
                textAlign: "left", background: "var(--surface)", borderRadius: 12, padding: 14, lineHeight: 1.7,
              }}>
                1. 機器人接上電源，等它亮起<br />
                2. 手機連到機器人的 Wi-Fi「NuanNuan-Setup」<br />
                3. 依畫面選家裡 Wi-Fi，輸入上面的配對碼
              </div>
              <button
                onClick={() => setPairing(null)}
                style={{ marginTop: 14, padding: "10px 18px", color: "var(--ink-2)", fontSize: "var(--fs-sm)", fontWeight: 700 }}
              >
                取消配對
              </button>
            </div>
          ) : (
            <button
              className="btn-primary"
              style={{ width: "100%", marginBottom: 16, opacity: creating ? 0.6 : 1 }}
              disabled={creating}
              onClick={startPairing}
            >
              <Icon name="plus" size={24} color="#fff" stroke={3} />
              {creating ? "產生配對碼中…" : "新增 / 配對機器人"}
            </button>
          )}

          {/* 已綁定裝置 */}
          {paired.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {paired.map((device) => {
                const online =
                  device.last_seen_at &&
                  Date.now() - new Date(device.last_seen_at).getTime() < 3 * 60 * 1000;
                return (
                  <div key={device.id} className="card" style={{ padding: 18, display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: 16, flexShrink: 0,
                      background: online ? "var(--sage-soft)" : "var(--bg-deep)",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28,
                    }}>
                      🤖
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "var(--fs-base)", fontWeight: 800 }}>{device.name}</div>
                      <div style={{ fontSize: "var(--fs-xs)", color: online ? "#4F7A4E" : "var(--ink-3)", marginTop: 2 }}>
                        {online
                          ? "● 在線上"
                          : device.last_seen_at
                            ? `最後上線 ${new Date(device.last_seen_at).toLocaleString("zh-TW", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}`
                            : "尚未上線"}
                        {device.fw_version ? `　·　韌體 ${device.fw_version}` : ""}
                      </div>
                    </div>
                    <button onClick={() => rename(device)} style={{ padding: 8 }} aria-label="改名">
                      <Icon name="pencil" size={20} color="var(--ink-2)" />
                    </button>
                    <button onClick={() => unbind(device)} style={{ padding: 8 }} aria-label="解除綁定">
                      <Icon name="x" size={20} color="var(--berry)" stroke={2.5} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {paired.length === 0 && !pairing && (
            <div style={{ padding: 24, textAlign: "center", color: "var(--ink-3)", fontSize: "var(--fs-sm)" }}>
              還沒有綁定的機器人
            </div>
          )}
        </>
      )}
    </SubPage>
  );
}

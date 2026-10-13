"use client";

// ────────────────────────────────────────────────
// 故事用自己的聲音念（專業版）：故事內頁的一張卡片
// 還沒錄「我的聲音」→ 先錄；錄好了 → 用我的聲音念成一段錄音（每月有篇數，念之前先確認）；
// 念好了 → 播放；文字改過 → 提示可以照新的內容重念。錄音是 AI 合成的，畫面上一律標明
// ────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/telemetry";
import { MyVoiceSheet } from "@/components/my-voice-sheet";
import { myVoiceReady } from "@/components/narration-voice-picker";
import { formatAudioDuration } from "@/lib/story-audio";
import type { LifeStory } from "@/lib/life-stories";
import type { MyVoiceStatus } from "@/lib/travel-video";

const linkBtn: React.CSSProperties = {
  background: "none", border: "none", padding: "8px 4px", minHeight: 44,
  color: "var(--ink-3)", fontSize: "var(--fs-sm)", textDecoration: "underline", cursor: "pointer",
};

export function StoryVoiceCard({ story, onStory }: { story: LifeStory; onStory: (s: LifeStory) => void }) {
  const toast = useToast();
  const [status, setStatus] = useState<MyVoiceStatus | null>(null);
  const [quota, setQuota] = useState<{ used: number; limit: number } | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sheet, setSheet] = useState(false);

  useEffect(() => {
    let alive = true;
    api.getMyVoice().then((r) => { if (alive) setStatus(r.status); }).catch(() => undefined);
    return () => { alive = false; };
  }, []);

  const reading = story.voice_reading ?? null;
  const ready = myVoiceReady(status);
  const remaining = quota ? Math.max(0, quota.limit - quota.used) : null;

  const askConfirm = () => {
    setConfirming(true);
    api.storyVoiceQuota(story.id).then((r) => setQuota(r.quota)).catch(() => undefined);
  };

  const start = async () => {
    if (busy) return;
    setBusy(true);
    setConfirming(false);
    trackEvent("story_voice_start");
    try {
      const res = await api.readStoryInMyVoice(story.id);
      setQuota(res.quota);
      onStory(res.story);
      toast.success("念好了！家人打開這篇也聽得到");
    } catch (e) {
      const data = e instanceof ApiError ? (e.data as { quota?: { used: number; limit: number } } | null) : null;
      if (data?.quota) setQuota(data.quota);
      toast.error(e instanceof ApiError && !e.isNetwork ? e.message : "網路不太穩，等一下回來看看念好了沒有");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await api.deleteStoryVoice(story.id);
      onStory(res.story);
    } catch (e) {
      toast.error(e instanceof ApiError && !e.isNetwork ? e.message : "沒刪成功，請再試一次");
    } finally {
      setBusy(false);
    }
  };

  // 沒有文字可念，或還不知道方案、方案不能用又沒有舊錄音：不顯示
  if (!story.body.trim()) return null;
  if (!reading && (!status || !status.allowed)) return null;

  return (
    <div className="card" style={{ padding: 14, background: "var(--surface-warm)", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontWeight: 800 }}>
        🎙️ 用我的聲音念{reading ? `（${formatAudioDuration(reading.seconds)}）` : ""}
      </div>

      {reading && (
        <>
          <audio controls preload="metadata" src={reading.url} style={{ width: "100%" }} />
          <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-3)", lineHeight: 1.5 }}>
            這是 AI 照你錄的聲音念的。{story.share_with_family ? "家人打開這篇也聽得到。" : ""}
          </div>
          {reading.outdated && (
            <div style={{ fontSize: "var(--fs-sm)", color: "var(--primary-deep)", lineHeight: 1.5 }}>
              文章改過了，這段錄音念的還是舊的內容。
            </div>
          )}
        </>
      )}

      {!reading && !busy && !confirming && (
        <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", lineHeight: 1.55 }}>
          {ready
            ? "AI 會用你在「我的聲音」錄的聲音，把這篇念成一段錄音，家人也能聽。"
            : "先錄一段自己的聲音（念一段固定的話），之後 AI 就能用你的聲音把故事念給家人聽。"}
        </div>
      )}

      {busy && (
        <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", lineHeight: 1.55 }} role="status">
          ⏳ 正在用你的聲音念，大約要 1～2 分鐘，請不要關掉這個畫面…
          {status?.voice && !status.voice.activated ? "（第一次用你的聲音會再久一點）" : ""}
        </div>
      )}

      {confirming && !busy && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", lineHeight: 1.55 }}>
            每個月可以念 {quota?.limit ?? "幾"} 篇，念一次算一篇（重念也算）。
            {remaining !== null ? `這個月還可以念 ${remaining} 篇。` : ""}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <button type="button" className="btn-ghost" onClick={() => setConfirming(false)}>先不要</button>
            <button type="button" className="btn-primary" onClick={start} disabled={remaining === 0}>開始念</button>
          </div>
        </div>
      )}

      {!busy && !confirming && status?.allowed && (
        ready ? (
          (!reading || reading.outdated) && (
            <button type="button" className="btn-primary" onClick={askConfirm}>
              {reading ? "🎙️ 照新的內容重念" : "🎙️ 用我的聲音念成錄音"}
            </button>
          )
        ) : (
          <button type="button" className="btn-ghost" onClick={() => setSheet(true)}>
            🎤 {status.voice?.expired ? "重新錄我的聲音" : "先錄下我的聲音"}
          </button>
        )
      )}

      {reading && !busy && (
        <button type="button" onClick={remove} style={{ ...linkBtn, alignSelf: "flex-start" }}>
          不要這段錄音
        </button>
      )}

      {sheet && (
        <MyVoiceSheet
          status={status}
          onClose={() => setSheet(false)}
          onChanged={(s, isReady) => {
            setStatus(s);
            if (isReady) setSheet(false);
          }}
        />
      )}
    </div>
  );
}

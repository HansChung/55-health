"use client";

// ────────────────────────────────────────────────
// 回憶錄有聲書：整本故事一篇接一篇念（自己錄的 → 我的聲音 → 手機的聲音），可以跳章、上一篇下一篇
// 錄音是 1 小時有效的網址：播到一半過期就重新拿一次故事清單再播（onRefresh）
// 手機的聲音一段一段念（一次塞整篇，有些瀏覽器念到一半會停）
// ────────────────────────────────────────────────

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { LifeStory } from "@/lib/life-stories";
import { trackEvent } from "@/lib/telemetry";
import { canSpeakGuide } from "@/lib/speak-guide";
import {
  CHAPTER_SOURCE_LABEL,
  DEVICE_CHARS_PER_SECOND,
  audiobookChapters,
  audiobookSeconds,
  formatBookDuration,
  sourceCounts,
  type AudiobookChapter,
} from "@/lib/story-audiobook";
import { formatAudioDuration } from "@/lib/story-audio";

const RATES = [0.8, 1, 1.2] as const;

export function StoryAudiobook({
  stories,
  title,
  author,
  onClose,
  onRefresh,
}: {
  stories: LifeStory[];
  /** 例如「我的回憶錄」「王阿嬤的回憶錄」 */
  title: string;
  /** 鎖定畫面顯示的作者 */
  author?: string;
  onClose: () => void;
  /** 錄音網址過期時重新拿故事（拿不到就跳下一篇） */
  onRefresh?: () => Promise<LifeStory[]>;
}) {
  const [list, setList] = useState(stories);
  const deviceSpeech = canSpeakGuide();
  const chapters = useMemo(() => audiobookChapters(list, { deviceSpeech }), [list, deviceSpeech]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState<(typeof RATES)[number]>(1);
  // 手機念的回呼要拿到「剛選的」速度（state 要等下一次畫面才更新）
  const rateRef = useRef<number>(1);
  /** 點目錄裡正在播的那一篇：index、playing 都沒變，靠這個讓播放重新開始 */
  const [playGen, setPlayGen] = useState(0);
  const [position, setPosition] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  /** 手機念到第幾段 */
  const paraRef = useRef(0);
  /** 換章、暫停時讓舊的念讀回呼失效 */
  const tokenRef = useRef(0);
  const retriedRef = useRef<string | null>(null);
  const current: AudiobookChapter | undefined = chapters[index];

  /** 錄音播完、出錯的回呼先拆掉（要播時播放的 effect 會重新掛上），免得停掉後又叫到 next */
  const detachAudio = () => {
    const a = audioRef.current;
    if (!a) return;
    a.onended = null;
    a.onerror = null;
    return a;
  };

  /** 長輩按的暫停、跳篇、關掉：全部停下來 */
  const stopAll = () => {
    tokenRef.current++;
    const a = detachAudio();
    // 載入失敗的錄音不要 pause：pause 會讓它重新載入
    if (a && !a.error) a.pause();
    if (deviceSpeech) window.speechSynthesis.cancel();
  };

  // 關掉時：停聲音，也把鎖定畫面的標題、按鈕清掉（不然按了會叫到已經關掉的播放器）
  useEffect(() => () => {
    stopAll();
    if ("mediaSession" in navigator) {
      try {
        navigator.mediaSession.metadata = null;
        for (const action of ["nexttrack", "previoustrack", "pause", "play"] as const) navigator.mediaSession.setActionHandler(action, null);
      } catch { /* 不支援就算了 */ }
    }
  }, []);

  /**
   * 下一篇。fromUser＝鎖定畫面按「下一首」：全部停下來。
   * 自然播完（錄音 onended、手機念完最後一句、錄音壞掉跳過）：只作廢排著的句子、拆掉錄音的回呼——
   * 不在 onend 裡 cancel 語音（有些瀏覽器會把下一篇的第一句吞掉），也不 pause 壞掉的錄音（會重新載入、一直出錯）
   */
  const next = (fromUser = false) => {
    if (fromUser) stopAll();
    else {
      tokenRef.current++;
      detachAudio();
    }
    if (index + 1 < chapters.length) {
      paraRef.current = 0;
      setIndex(index + 1);
    } else {
      setPlaying(false);
      paraRef.current = 0;
    }
  };

  // 手機的聲音：一段念完接下一段，整章念完換下一章
  const speakFrom = (ch: AudiobookChapter, start: number) => {
    const token = ++tokenRef.current;
    const say = (i: number) => {
      if (token !== tokenRef.current) return;
      if (i >= ch.paragraphs.length) {
        paraRef.current = 0;
        next();
        return;
      }
      paraRef.current = i;
      setPosition(i);
      const text = ch.paragraphs[i];
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "zh-TW";
      u.rate = 0.95 * rateRef.current;
      // 每一句只往下走一次（有些瀏覽器 cancel 時也會叫 onend）
      let done = false;
      const advance = () => {
        if (done) return;
        done = true;
        clearTimeout(watchdog);
        say(i + 1);
      };
      // 有些瀏覽器念到一半停住、onend 永遠不來：超過預估時間太多就跳下一句，整本不會卡在這一篇
      const watchdog = setTimeout(() => {
        if (token !== tokenRef.current || done) return;
        done = true;
        window.speechSynthesis.cancel();
        // 取消後馬上念，有些瀏覽器會把下一句也吞掉：稍等一下再念
        setTimeout(() => say(i + 1), 120);
      }, (([...text].length / DEVICE_CHARS_PER_SECOND) / (0.95 * rateRef.current)) * 2000 + 8000);
      u.onend = () => advance();
      u.onerror = () => {
        // 暫停、換章都會先讓 token 失效：token 還有效就不是長輩按的（包含瀏覽器自己 interrupted），接著念下一句
        if (token === tokenRef.current) advance();
        else { done = true; clearTimeout(watchdog); }
      };
      window.speechSynthesis.speak(u);
    };
    window.speechSynthesis.cancel();
    // 同上：取消後稍等一下再念第一句
    setTimeout(() => say(start), 60);
  };

  // 播放狀態或章節換了：開始念／播
  useEffect(() => {
    if (!current || !playing) return;
    if (current.source === "device") {
      audioRef.current?.pause();
      speakFrom(current, paraRef.current);
    } else {
      if (deviceSpeech) window.speechSynthesis.cancel();
      const token = ++tokenRef.current;
      const a = (audioRef.current ??= new Audio());
      if (a.src !== current.url) {
        a.src = current.url!;
        setPosition(0);
      }
      a.playbackRate = rate;
      a.onended = () => next();
      a.ontimeupdate = () => setPosition(a.currentTime);
      a.onerror = () => void handleAudioError(current);
      a.play().catch((e: unknown) => {
        // 換章時 pause 會讓上一次的 play 失敗（AbortError）；網址壞掉由 onerror 處理（會重新拿網址再播）。
        // 只有瀏覽器不讓自動播放（NotAllowedError）才顯示成暫停，讓長輩自己按一次
        if (token === tokenRef.current && (e as { name?: string })?.name === "NotAllowedError") setPlaying(false);
      });
    }
    // 鎖定畫面上的標題、上一篇下一篇
    if ("mediaSession" in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: current.title,
          artist: author ?? title,
          album: title,
          artwork: current.cover ? [{ src: current.cover }] : [],
        });
        navigator.mediaSession.setActionHandler("nexttrack", () => next(true));
        navigator.mediaSession.setActionHandler("previoustrack", () => go(Math.max(0, index - 1)));
        navigator.mediaSession.setActionHandler("pause", () => pause());
        navigator.mediaSession.setActionHandler("play", () => setPlaying(true));
      } catch { /* 不支援就算了 */ }
    }
  }, [index, playing, playGen, current?.url, current?.source]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = rate;
  }, [rate]);

  // 錄音網址過期（1 小時）：重新拿故事清單再播一次；還是不行就跳下一篇
  const handleAudioError = async (ch: AudiobookChapter) => {
    if (onRefresh && retriedRef.current !== ch.id) {
      retriedRef.current = ch.id;
      try {
        const fresh = await onRefresh();
        const again = audiobookChapters(fresh, { deviceSpeech }).find((c) => c.id === ch.id);
        // 拿到新的網址才重播（播放的 effect 看到網址換了會重新開始）；一樣的網址就是檔案本身壞了，跳過
        if (again?.url && again.url !== ch.url) {
          setList(fresh);
          return;
        }
      } catch { /* 拿不到就跳過 */ }
    }
    next();
  };

  const pause = () => {
    stopAll();
    setPlaying(false);
  };

  const go = (i: number) => {
    stopAll();
    paraRef.current = 0;
    retriedRef.current = null;
    if (audioRef.current) audioRef.current.removeAttribute("src");
    setIndex(i);
    setPosition(0);
    setPlaying(true);
    setPlayGen((g) => g + 1);
  };

  const start = () => {
    if (!playing) trackEvent("story_audiobook_play", { chapters: chapters.length, ...sourceCounts(chapters) });
    setPlaying(true);
  };

  const close = () => {
    stopAll();
    onClose();
  };

  if (typeof document === "undefined") return null;
  const total = audiobookSeconds(chapters);
  const counts = sourceCounts(chapters);

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={title} style={{ position: "fixed", inset: 0, zIndex: 80, background: "var(--bg)", overflowY: "auto", padding: "16px 16px 40px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <button type="button" onClick={close} aria-label="關閉" className="btn-ghost" style={{ minWidth: 48 }}>✕</button>
        <div style={{ fontSize: "var(--fs-lg)", fontWeight: 800 }}>🎧 {title}</div>
      </div>

      {chapters.length === 0 ? (
        <div className="card" style={{ textAlign: "center", color: "var(--ink-2)", lineHeight: 1.6, padding: 24 }}>
          還沒有可以聽的故事。用自己的聲音錄一篇，或寫好文字的故事就可以聽了。
        </div>
      ) : (
        <>
          <div className="card" style={{ padding: 18, textAlign: "center" }}>
            {current?.cover ? (
              <img src={current.cover} alt="" style={{ width: "100%", maxHeight: 220, objectFit: "cover", borderRadius: 14 }} />
            ) : (
              <div style={{ fontSize: 64 }} aria-hidden="true">📖</div>
            )}
            <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-3)", marginTop: 10 }}>第 {index + 1} 篇／共 {chapters.length} 篇</div>
            <div style={{ fontSize: "var(--fs-xl)", fontWeight: 800, marginTop: 4, lineHeight: 1.3 }}>{current?.title}</div>
            {current?.era && <div style={{ color: "var(--ink-2)", marginTop: 2 }}>{current.era}</div>}
            {current && <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", marginTop: 6 }}>{CHAPTER_SOURCE_LABEL[current.source]}</div>}
            {current && current.source !== "device" && (
              <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-3)", marginTop: 4 }}>
                {formatAudioDuration(position)}／{formatAudioDuration(current.seconds)}
              </div>
            )}
            {current && current.source === "device" && playing && (
              <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-3)", marginTop: 4 }}>
                第 {Math.min(position + 1, current.paragraphs.length)}／{current.paragraphs.length} 段
              </div>
            )}

            <div style={{ display: "flex", gap: 12, justifyContent: "center", alignItems: "center", marginTop: 16 }}>
              <button type="button" className="btn-ghost" style={{ minWidth: 64, minHeight: 64, fontSize: 26 }} onClick={() => go(Math.max(0, index - 1))} disabled={index === 0} aria-label="上一篇">⏮</button>
              <button
                type="button"
                className="btn-primary"
                style={{ minWidth: 96, minHeight: 80, fontSize: 34, borderRadius: 999 }}
                onClick={() => (playing ? pause() : start())}
                aria-label={playing ? "暫停" : "播放"}
              >
                {playing ? "⏸" : "▶️"}
              </button>
              <button type="button" className="btn-ghost" style={{ minWidth: 64, minHeight: 64, fontSize: 26 }} onClick={() => go(index + 1)} disabled={index + 1 >= chapters.length} aria-label="下一篇">⏭</button>
            </div>

            <div role="radiogroup" aria-label="速度" style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 14 }}>
              {RATES.map((r) => (
                <button
                  key={r}
                  type="button"
                  role="radio"
                  aria-checked={rate === r}
                  onClick={() => {
                    setRate(r);
                    rateRef.current = r;
                    // 手機念的：從這一段用新速度重念
                    if (playing && current?.source === "device") speakFrom(current, paraRef.current);
                  }}
                  style={{
                    minHeight: 44, minWidth: 72, borderRadius: 999, cursor: "pointer", fontWeight: 700, fontSize: "var(--fs-sm)",
                    border: `2px solid ${rate === r ? "var(--primary)" : "var(--line)"}`,
                    background: rate === r ? "var(--primary-soft)" : "var(--surface)", color: "var(--ink-1)",
                  }}
                >
                  {r === 0.8 ? "慢一點" : r === 1 ? "正常" : "快一點"}
                </button>
              ))}
            </div>
          </div>

          <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", margin: "14px 4px 8px", lineHeight: 1.6 }}>
            共 {chapters.length} 篇，{formatBookDuration(total)}。
            {counts.device > 0 && ` 其中 ${counts.device} 篇沒有錄音，用手機的聲音念。`}
          </div>
          <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {chapters.map((c, i) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => go(i)}
                  aria-current={i === index ? "true" : undefined}
                  className="card"
                  style={{
                    width: "100%", padding: 12, display: "flex", gap: 10, alignItems: "center", textAlign: "left", cursor: "pointer",
                    border: `2px solid ${i === index ? "var(--primary)" : "var(--line)"}`, background: i === index ? "var(--primary-soft)" : undefined,
                  }}
                >
                  <span style={{ fontWeight: 800, color: "var(--ink-3)", minWidth: 28 }}>{i + 1}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontWeight: 800, color: "var(--ink-1)" }}>{c.title}</span>
                    <span style={{ display: "block", fontSize: "var(--fs-xs)", color: "var(--ink-3)" }}>
                      {CHAPTER_SOURCE_LABEL[c.source]}・{c.source === "device" ? "約 " : ""}{formatAudioDuration(c.seconds)}
                    </span>
                  </span>
                  <span aria-hidden="true">{i === index && playing ? "🔊" : "▶️"}</span>
                </button>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>,
    document.body
  );
}

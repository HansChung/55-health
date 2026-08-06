"use client";

import { useRouter } from "next/navigation";
import { SubPage } from "@/components/sub-page";
import { BLUEPRINT_DIMENSIONS, BLUEPRINT_INSIGHT } from "@/lib/smart-blueprint";

const CHAPTER_2_LINKS: { id: string; label: string; color: string }[] = [
  { id: "0200", label: "感官覺醒｜章節開篇", color: "#5BA0C9" },
  { id: "0201", label: "數位華爾滋：一拍、二問、三記下", color: "#9B7AD4" },
  { id: "0202", label: "自然篇：路邊小花都有身世", color: "var(--sage)" },
  { id: "0203", label: "旅行篇：點菜的勇氣", color: "#E8845A" },
  { id: "0204", label: "消費篇：精明消費", color: "#7B5BB8" },
  { id: "0205", label: "知識篇：好奇心", color: "#5BA0C9" },
  { id: "0206", label: "美食篇：舌尖下的秘密", color: "var(--primary-deep)" },
  { id: "0207", label: "五色高纖食譜庫", color: "var(--sage)" },
  { id: "0208", label: "照片搜尋：回憶不必被埋沒", color: "#9B7AD4" },
  { id: "0209", label: "魔法橡皮擦：修復遺憾", color: "#5BA0C9" },
  { id: "0210", label: "人生策展", color: "#7B5BB8" },
  { id: "0211", label: "感官全開：把好奇變成生活反射", color: "#E8845A" },
];

/**
 * QR：SMART RADAR 溫暖導讀（文字版；之後可換成音檔）
 * 對應 KU05 左頁文案精華
 */
export default function SmartGuidePage() {
  const router = useRouter();

  return (
    <div style={{ minHeight: "100dvh", maxWidth: 480, margin: "0 auto", background: "var(--bg, #FAF5EC)" }}>
      <SubPage
        title="溫暖導讀"
        onBack={() => router.push("/")}
        accent="linear-gradient(180deg, #FBE6D4 0%, transparent 100%)"
        footer={
          <button
            className="btn-primary"
            style={{ width: "100%" }}
            onClick={() => router.push("/smart/spark")}
          >
            點亮我的第一個光點
          </button>
        }
      >
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🧭</div>
          <h1 style={{ fontSize: "var(--fs-2xl)", fontWeight: 800, margin: "0 0 6px" }}>
            SMART RADAR 圓夢藍圖
          </h1>
          <p style={{ fontSize: "var(--fs-base)", color: "var(--ink-2)", margin: 0 }}>
            不只是想，更要看見方向
          </p>
        </div>

        <div style={{
          fontSize: "var(--fs-base)", color: "var(--ink-1)", lineHeight: 1.7,
          marginBottom: 20,
        }}>
          <p>親愛的領航者：</p>
          <p>
            人生下半場，最怕的不是沒有夢想，而是夢想太多、方向太散。
            SMART 55+ 選擇更直覺的方式：<strong>SMART RADAR</strong>。
          </p>
          <p>
            它不是考試表，也不是壓力表，而是一張人生導航儀。
            更重要的是，它不要求您一次填完人生——它從日常開始。
          </p>
          <p style={{
            padding: 14, background: "var(--surface)", borderRadius: 12,
            border: "1px solid var(--line)", fontWeight: 700,
          }}>
            {BLUEPRINT_INSIGHT}
          </p>
        </div>

        <div style={{ fontSize: "var(--fs-sm)", fontWeight: 800, color: "var(--ink-2)", marginBottom: 10 }}>
          五個方向
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          {BLUEPRINT_DIMENSIONS.map((d) => (
            <div key={d.key} style={{
              padding: "12px 14px", borderRadius: 12,
              background: d.color + "14", border: `1px solid ${d.color}44`,
            }}>
              <div style={{ fontWeight: 800, color: d.color }}>{d.shortLabel}</div>
              <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-2)", marginTop: 2 }}>
                {d.examples.join("、")}
              </div>
            </div>
          ))}
        </div>

        <p style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", lineHeight: 1.6 }}>
          當方向清楚，圓夢就不再只是口號。它會變成一條看得見、走得到、能持續調整的路。
        </p>

        <button
          type="button"
          onClick={() => router.push("/smart/chapter/0100")}
          style={{
            width: "100%", marginTop: 16, padding: "16px",
            background: "var(--surface)", border: "2px solid #5BA0C9",
            borderRadius: "var(--r-lg)", fontWeight: 700,
            fontSize: "var(--fs-sm)", color: "#5BA0C9", cursor: "pointer",
          }}
        >
          章節 0100｜風起了，調整風帆 →
        </button>
        <button
          type="button"
          onClick={() => router.push("/smart/chapter/0102")}
          style={{
            width: "100%", marginTop: 10, padding: "16px",
            background: "var(--surface)", border: "2px solid #9B7AD4",
            borderRadius: "var(--r-lg)", fontWeight: 700,
            fontSize: "var(--fs-sm)", color: "#7B5BB8", cursor: "pointer",
          }}
        >
          章節 0102｜先找得到，再慢慢用 →
        </button>
        <button
          type="button"
          onClick={() => router.push("/smart/chapter/0103")}
          style={{
            width: "100%", marginTop: 10, padding: "16px",
            background: "var(--surface)", border: "2px solid #E8845A",
            borderRadius: "var(--r-lg)", fontWeight: 700,
            fontSize: "var(--fs-sm)", color: "var(--primary-deep)", cursor: "pointer",
          }}
        >
          章節 0103｜把關鍵字丟掉：用人話對話 →
        </button>
        <button
          type="button"
          onClick={() => router.push("/smart/chapter/0104")}
          style={{
            width: "100%", marginTop: 10, padding: "16px",
            background: "var(--surface)", border: "2px solid var(--sage)",
            borderRadius: "var(--r-lg)", fontWeight: 700,
            fontSize: "var(--fs-sm)", color: "var(--sage)", cursor: "pointer",
          }}
        >
          章節 0104｜第二個大腦：把繁雜交給 AI →
        </button>
        <button
          type="button"
          onClick={() => router.push("/smart/chapter/0105")}
          style={{
            width: "100%", marginTop: 10, padding: "16px",
            background: "var(--surface)", border: "2px solid #5BA0C9",
            borderRadius: "var(--r-lg)", fontWeight: 700,
            fontSize: "var(--fs-sm)", color: "#5BA0C9", cursor: "pointer",
          }}
        >
          章節 0105｜為手機裝上眼睛：萬物皆可問 →
        </button>
        <button
          type="button"
          onClick={() => router.push("/smart/chapter/0106")}
          style={{
            width: "100%", marginTop: 10, padding: "16px",
            background: "var(--surface)", border: "2px solid #9B7AD4",
            borderRadius: "var(--r-lg)", fontWeight: 700,
            fontSize: "var(--fs-sm)", color: "#7B5BB8", cursor: "pointer",
          }}
        >
          章節 0106｜為手機裝上相簿：照片可以搜尋 →
        </button>
        <button
          type="button"
          onClick={() => router.push("/smart/chapter/0107")}
          style={{
            width: "100%", marginTop: 10, padding: "16px",
            background: "var(--surface)", border: "2px solid var(--primary)",
            borderRadius: "var(--r-lg)", fontWeight: 700,
            fontSize: "var(--fs-sm)", color: "var(--primary-deep)", cursor: "pointer",
          }}
        >
          章節 0107｜為它準備便條紙：靈感被收藏 →
        </button>
        <button
          type="button"
          onClick={() => router.push("/smart/chapter/0108")}
          style={{
            width: "100%", marginTop: 10, padding: "16px",
            background: "var(--surface)", border: "2px solid #5BA0C9",
            borderRadius: "var(--r-lg)", fontWeight: 700,
            fontSize: "var(--fs-sm)", color: "#5BA0C9", cursor: "pointer",
          }}
        >
          章節 0108｜預備起飛：一拍、二問、三記下 →
        </button>

        <div style={{
          fontSize: "var(--fs-sm)", fontWeight: 800, color: "var(--sage)",
          marginTop: 24, marginBottom: 10,
        }}>
          第二章｜感官覺醒
        </div>
        <p style={{
          fontSize: "var(--fs-xs)", color: "var(--ink-2)", lineHeight: 1.55,
          margin: "0 0 12px", padding: "12px 14px",
          background: "var(--surface)", borderRadius: 12, border: "1px solid var(--line)",
        }}>
          <strong>書教節奏，暖暖留下痕跡。</strong>
          {" "}共同節奏：一拍、二問、三記下。練習完可把最有用的一句話「點成光點」。
        </p>
        {CHAPTER_2_LINKS.map((ch) => (
          <button
            key={ch.id}
            type="button"
            onClick={() => router.push(`/smart/chapter/${ch.id}`)}
            style={{
              width: "100%", marginTop: 8, padding: "14px 16px",
              background: "var(--surface)", border: `2px solid ${ch.color}`,
              borderRadius: "var(--r-lg)", fontWeight: 700,
              fontSize: "var(--fs-sm)", color: ch.color, cursor: "pointer",
              textAlign: "left",
            }}
          >
            章節 {ch.id}｜{ch.label} →
          </button>
        ))}
      </SubPage>
    </div>
  );
}

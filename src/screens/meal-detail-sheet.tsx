"use client";

import { Icon } from "@/components/icons";
import { MacroBar } from "@/components/macro-bar";
import type { MealRecord } from "@/lib/api-client";

interface MealDetailSheetProps {
  meal: MealRecord;
  onClose: () => void;
  onDelete?: () => void;
  onSaveFavorite?: (meal: MealRecord) => void;
}

const MEAL_LABEL: Record<string, string> = {
  breakfast: "早餐",
  lunch: "午餐",
  dinner: "晚餐",
  snack: "點心",
};

export function MealDetailSheet({ meal, onClose, onDelete, onSaveFavorite }: MealDetailSheetProps) {
  const eatenAt = new Date(meal.eaten_at);
  const timeLabel = eatenAt.toLocaleString("zh-TW", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return (
    <div
      onClick={onClose}
      style={{
        position: "absolute", inset: 0, zIndex: 50,
        background: "rgba(45, 28, 14, 0.5)",
        display: "flex", alignItems: "flex-end",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="fade-up"
        style={{
          width: "100%", background: "var(--bg)",
          borderRadius: "28px 28px 0 0",
          padding: "12px 24px 32px",
          maxHeight: "85%", overflowY: "auto",
          boxShadow: "0 -10px 40px rgba(0,0,0,0.15)",
        }}
      >
        <div style={{
          width: 48, height: 5, borderRadius: 3,
          background: "var(--line-strong)", margin: "6px auto 18px",
        }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
          <h2 style={{ fontSize: "var(--fs-xl)", fontWeight: 800, margin: 0 }}>
            {MEAL_LABEL[meal.meal_type] ?? meal.meal_type}
          </h2>
          <button onClick={onClose} aria-label="關閉" style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "var(--surface)", border: "1px solid var(--line)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon name="x" size={18} color="var(--ink-2)" stroke={2.5} />
          </button>
        </div>
        <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", marginBottom: 20 }}>
          {timeLabel}
        </div>

        {meal.photo_url && (
          <img
            src={meal.photo_url}
            alt={meal.items?.map((it) => it.name).join("、") || "餐點照片"}
            loading="lazy"
            decoding="async"
            style={{
              width: "100%", height: 180, objectFit: "cover",
              borderRadius: 16, marginBottom: 16,
            }}
          />
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          {meal.items.map((it, i) => (
            <div key={i} style={{
              background: "var(--surface)",
              borderRadius: 16, padding: "12px 16px",
              border: "1px solid var(--line)",
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: (it.color ?? "#E8845A") + "33",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, flexShrink: 0,
              }}>{it.emoji ?? "🍽"}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "var(--fs-base)", fontWeight: 700 }}>{it.name}</div>
                {it.amount && (
                  <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)" }}>{it.amount}</div>
                )}
              </div>
              <div style={{ fontSize: "var(--fs-base)", fontWeight: 700, color: "var(--primary-deep)" }}>
                {it.cal} 卡
              </div>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: 18, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: "var(--fs-base)", fontWeight: 700 }}>這餐營養</span>
            <span style={{ fontSize: "var(--fs-2xl)", fontWeight: 800, color: "var(--primary-deep)" }}>
              {meal.total_cal} <span style={{ fontSize: "var(--fs-sm)", fontWeight: 500, color: "var(--ink-2)" }}>大卡</span>
            </span>
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <MacroBar label="蛋白質" value={Number(meal.protein_g) || 0} max={65} color="linear-gradient(90deg, #E8845A, #F4B58E)" />
            <MacroBar label="醣類" value={Number(meal.carb_g) || 0} max={220} color="linear-gradient(90deg, #D9A441, #F0CB72)" />
            <MacroBar label="脂肪" value={Number(meal.fat_g) || 0} max={55} color="linear-gradient(90deg, #7AA779, #A3C4A0)" />
          </div>
        </div>

        {onSaveFavorite && (
          <button
            onClick={() => onSaveFavorite(meal)}
            style={{
              width: "100%", padding: 14, marginBottom: 10,
              background: "var(--primary-soft)",
              border: "1px solid var(--gold-soft)",
              borderRadius: 999,
              color: "var(--primary-deep)",
              fontSize: "var(--fs-base)", fontWeight: 700,
            }}
          >
            存成常吃餐點
          </button>
        )}

        {onDelete && (
          <button
            onClick={() => {
              if (confirm("確定要刪除這筆記錄？")) onDelete();
            }}
            style={{
              width: "100%", padding: 14,
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: 999,
              color: "var(--berry)",
              fontSize: "var(--fs-base)", fontWeight: 600,
            }}
          >
            刪除這筆記錄
          </button>
        )}
      </div>
    </div>
  );
}

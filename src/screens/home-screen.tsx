"use client";

import { Meal, MealType } from "@/lib/types";
import type { MealRecord } from "@/lib/api-client";
import { Icon } from "@/components/icons";
import { Mascot } from "@/components/mascot";
import { CalorieRing } from "@/components/calorie-ring";
import { MacroBar } from "@/components/macro-bar";
import { FoodPlaceholder } from "@/components/food-placeholder";

interface HomeScreenProps {
  meals: Meal[];
  calories: number;
  calorieGoal: number;
  displayName?: string | null;
  suggestion?: { headline: string } | null;
  suggestionLoading?: boolean;
  onCamera: () => void;
  onVoice: () => void;
  onMeal: (mealType: string) => void;
  onSuggestion: () => void;
  onExercise: () => void;
  repeatMeals?: Partial<Record<MealType, MealRecord>>;
  onRepeatMeal?: (mealType: MealType) => void;
}

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 11) return "早安";
  if (h < 18) return "午安";
  return "晚安";
}

function getDateLabel(): string {
  const d = new Date();
  return `${d.getMonth() + 1}月${d.getDate()}日　星期${WEEKDAYS[d.getDay()]}`;
}

export function HomeScreen({ meals, calories, calorieGoal, displayName, suggestion, suggestionLoading, onCamera, onVoice, onMeal, onSuggestion, onExercise, repeatMeals = {}, onRepeatMeal }: HomeScreenProps) {
  // 從餐點計算今日營養
  const totals = meals.reduce(
    (s, m) => {
      s.cal += m.cal || 0;
      s.protein += m.protein || 0;
      s.carb += m.carb || 0;
      s.fat += m.fat || 0;
      return s;
    },
    { cal: 0, protein: 0, carb: 0, fat: 0 }
  );
  const proteinG = Math.round(totals.protein);
  const carbG = Math.round(totals.carb);
  const fatG = Math.round(totals.fat);

  return (
    <div className="scroll-area" style={{ flex: 1, overflowY: "auto", paddingBottom: 120 }}>
      <div style={{ padding: "8px 24px 12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", marginBottom: 4 }}>
              {getDateLabel()}
            </div>
            <h1 style={{ fontSize: "var(--fs-2xl)", fontWeight: 800, margin: 0, letterSpacing: "-0.5px" }}>
              {getGreeting()}，{displayName || "您"}
            </h1>
          </div>
          <button style={{
            width: 52, height: 52, borderRadius: "50%",
            background: "var(--surface)", border: "1px solid var(--line)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "var(--shadow-sm)", position: "relative",
          }}>
            <Icon name="bell" size={26} color="var(--ink-1)" />
            <span style={{
              position: "absolute", top: 10, right: 12,
              width: 10, height: 10, borderRadius: "50%",
              background: "var(--primary)", border: "2px solid var(--surface)",
            }} />
          </button>
        </div>
      </div>

      <div style={{ padding: "0 24px" }}>
        <div className="card" style={{ padding: 24, background: "linear-gradient(180deg, #FFF9EF 0%, #FFFFFF 100%)" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
            <CalorieRing value={calories} max={calorieGoal} />
          </div>
          <div style={{ display: "flex", gap: 20, paddingTop: 4 }}>
            <MacroBar label="蛋白質" value={proteinG} max={65} color="linear-gradient(90deg, #E8845A, #F4B58E)" />
            <MacroBar label="醣類" value={carbG} max={220} color="linear-gradient(90deg, #D9A441, #F0CB72)" />
            <MacroBar label="脂肪" value={fatG} max={55} color="linear-gradient(90deg, #7AA779, #A3C4A0)" />
          </div>
        </div>
      </div>

      <div style={{ padding: "20px 24px 0" }}>
        <button onClick={onSuggestion} style={{
          width: "100%", textAlign: "left",
          background: "linear-gradient(135deg, #FBE6D4 0%, #F7E6BD 100%)",
          borderRadius: "var(--r-lg)",
          padding: 20,
          border: "1px solid var(--gold-soft)",
          display: "flex", gap: 16, alignItems: "flex-start",
          boxShadow: "var(--shadow-sm)",
        }}>
          <div style={{ flexShrink: 0, marginTop: 2 }}>
            <Mascot size={64} mood="excited" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <Icon name="sparkle" size={18} color="var(--primary-deep)" />
              <span style={{ fontSize: "var(--fs-sm)", color: "var(--primary-deep)", fontWeight: 700, letterSpacing: "0.5px" }}>
                暖暖的建議
              </span>
            </div>
            <div style={{ fontSize: "var(--fs-base)", fontWeight: 600, color: "var(--ink-1)", marginBottom: 4, lineHeight: 1.45 }}>
              {suggestionLoading
                ? "暖暖在想…"
                : suggestion?.headline
                ?? (meals.some(m => m.logged)
                  ? "今天已開始記錄，加油繼續！🍊"
                  : "拍張早餐照片就能開始記錄囉！📸")}
            </div>
            <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", display: "flex", alignItems: "center", gap: 4 }}>
              點開看詳細 <Icon name="chevronR" size={16} />
            </div>
          </div>
        </button>
      </div>

      <div style={{ padding: "24px 24px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
          <h2 style={{ fontSize: "var(--fs-lg)", fontWeight: 700, margin: 0 }}>今天吃了什麼</h2>
          <span style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)" }}>
            {meals.filter(m => m.logged).length}/3 餐
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {meals.map((m, i) => {
            const mealType = (["breakfast", "lunch", "dinner"] as MealType[])[i] ?? "snack";
            return (
              <MealRow
                key={i}
                meal={m}
                repeatMeal={repeatMeals[mealType]}
                onClick={() => m.logged ? onMeal(mealType) : onCamera()}
                onRepeat={() => onRepeatMeal?.(mealType)}
              />
            );
          })}
        </div>
      </div>

      <div style={{ padding: "24px 24px 0", display: "flex", gap: 12 }}>
        <button onClick={onVoice} style={{
          flex: 1, textAlign: "left",
          background: "var(--surface)",
          borderRadius: "var(--r-lg)",
          padding: "16px 14px",
          border: "2px dashed var(--line-strong)",
          display: "flex", flexDirection: "column", gap: 8,
          minHeight: 110,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%",
            background: "var(--primary-soft)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon name="mic" size={26} color="var(--primary-deep)" />
          </div>
          <div style={{ fontSize: "var(--fs-base)", fontWeight: 700 }}>跟暖暖聊聊</div>
          <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)" }}>按一下說話</div>
        </button>

        <button onClick={onExercise} style={{
          flex: 1, textAlign: "left",
          background: "linear-gradient(135deg, #DCEBD8 0%, #FFFFFF 100%)",
          borderRadius: "var(--r-lg)",
          padding: "16px 14px",
          border: "1px solid #B5D2B0",
          display: "flex", flexDirection: "column", gap: 8,
          minHeight: 110,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%",
            background: "var(--sage-soft)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 24 }}>🚶</span>
          </div>
          <div style={{ fontSize: "var(--fs-base)", fontWeight: 700 }}>記錄運動</div>
          <div style={{ fontSize: "var(--fs-sm)", color: "#4F7A4E", fontWeight: 600 }}>散步、太極等</div>
        </button>
      </div>
    </div>
  );
}

function MealRow({ meal, repeatMeal, onClick, onRepeat }: {
  meal: Meal;
  repeatMeal?: MealRecord;
  onClick: () => void;
  onRepeat?: () => void;
}) {
  if (!meal.logged) {
    return (
      <div style={{
        width: "100%",
        background: "var(--surface)",
        borderRadius: "var(--r-lg)",
        padding: 18,
        border: "1px dashed var(--line-strong)",
        display: "flex", gap: 14, alignItems: "center",
      }}>
        <button onClick={onClick} style={{
          flex: 1, minWidth: 0, textAlign: "left",
          display: "flex", gap: 16, alignItems: "center",
          background: "transparent",
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 14,
            background: "var(--bg-deep)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <Icon name="plus" size={32} color="var(--ink-3)" stroke={2.5} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "var(--fs-base)", fontWeight: 700, color: "var(--ink-1)" }}>{meal.name}</div>
            <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)" }}>
              還沒記錄　·　拍張照吧
            </div>
          </div>
          <Icon name="camera" size={28} color="var(--primary)" />
        </button>
        {repeatMeal && onRepeat && (
          <button
            onClick={onRepeat}
            style={{
              flexShrink: 0,
              borderRadius: 999,
              padding: "10px 12px",
              background: "var(--surface-warm)",
              border: "1px solid var(--gold-soft)",
              color: "var(--primary-deep)",
              fontSize: "var(--fs-sm)",
              fontWeight: 700,
            }}
          >
            跟昨天一樣
          </button>
        )}
      </div>
    );
  }
  return (
    <button onClick={onClick} style={{
      width: "100%", textAlign: "left",
      background: "var(--surface)",
      borderRadius: "var(--r-lg)",
      padding: 16,
      border: "1px solid var(--line)",
      display: "flex", gap: 16, alignItems: "center",
      boxShadow: "var(--shadow-sm)",
    }}>
      {meal.photoUrl ? (
        <img
          src={meal.photoUrl}
          alt={meal.items}
          style={{
            width: 72, height: 72, borderRadius: 14,
            objectFit: "cover", flexShrink: 0,
          }}
        />
      ) : (
        <FoodPlaceholder label={meal.photo} size={72} radius={14} color={meal.color} />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", marginBottom: 2 }}>
          {meal.name}　·　{meal.time}
        </div>
        <div style={{
          fontSize: "var(--fs-base)", fontWeight: 700, color: "var(--ink-1)",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {meal.items}
        </div>
        <div style={{
          fontSize: "var(--fs-sm)", color: "var(--primary-deep)",
          fontWeight: 600, display: "flex", alignItems: "center", gap: 4, marginTop: 2,
        }}>
          <Icon name="flame" size={16} color="var(--primary)" />
          {meal.cal} 大卡
        </div>
      </div>
      <Icon name="chevronR" size={22} color="var(--ink-3)" />
    </button>
  );
}

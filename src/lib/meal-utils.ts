import type { Meal, MealType } from "./types";
import type { MealRecord } from "./api-client";

const MEAL_LABEL: Record<MealType, string> = {
  breakfast: "早餐",
  lunch: "午餐",
  dinner: "晚餐",
  snack: "點心",
};

const MEAL_COLOR: Record<MealType, string> = {
  breakfast: "#E8845A",
  lunch: "#D9A441",
  dinner: "#7AA779",
  snack: "#C95B6E",
};

const EMPTY_MEAL_SLOTS: MealType[] = ["breakfast", "lunch", "dinner"];

/** 把 DB 餐點 merge 進「早餐 / 午餐 / 晚餐」3 個固定 slot；沒有的就保留空白 */
export function mergeMealsWithSlots(dbMeals: MealRecord[]): Meal[] {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // 過濾今天的，按 meal_type 分組
  const todayMealsByType = new Map<MealType, MealRecord>();
  for (const m of dbMeals) {
    if (new Date(m.eaten_at) >= todayStart) {
      todayMealsByType.set(m.meal_type as MealType, m);
    }
  }

  return EMPTY_MEAL_SLOTS.map((type) => {
    const db = todayMealsByType.get(type);
    if (db) {
      return {
        name: MEAL_LABEL[type],
        time: new Date(db.eaten_at).toTimeString().substring(0, 5),
        items: db.items.map((it) => it.name).join("、"),
        cal: db.total_cal,
        color: db.items[0]?.color ?? MEAL_COLOR[type],
        photo: db.items[0]?.emoji ?? "🍱",
        photoUrl: db.photo_url,
        logged: true,
      };
    }
    // 空 slot
    return {
      name: MEAL_LABEL[type],
      time: "",
      items: "",
      cal: 0,
      color: MEAL_COLOR[type],
      photo: "",
      logged: false,
    };
  });
}

/** 根據目前時間決定該記哪一餐 */
export function guessMealType(date: Date = new Date()): MealType {
  const h = date.getHours();
  if (h < 10) return "breakfast";
  if (h < 14) return "lunch";
  if (h < 17) return "snack";
  return "dinner";
}

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

/** 把單筆 DB 餐點轉成首頁卡片 */
function dbMealToCard(type: MealType, db: MealRecord): Meal {
  return {
    name: MEAL_LABEL[type],
    time: new Date(db.eaten_at).toTimeString().substring(0, 5),
    items: db.items.map((it) => it.name).join("、"),
    cal: db.total_cal,
    protein: db.protein_g,
    carb: db.carb_g,
    fat: db.fat_g,
    color: db.items[0]?.color ?? MEAL_COLOR[type],
    photo: db.items[0]?.emoji ?? "🍱",
    photoUrl: db.photo_url,
    logged: true,
    mealType: type,
  };
}

/**
 * 把 DB 餐點 merge 進「早餐 / 午餐 / 晚餐」3 個固定 slot；沒有的就保留空白。
 * 若今天有記錄「點心」，額外在後面附上點心卡片（沒有就不顯示，避免畫面雜亂）。
 */
export function mergeMealsWithSlots(dbMeals: MealRecord[]): Meal[] {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // 過濾今天的，按 meal_type 分組（同類型保留最新一筆）
  const todayMealsByType = new Map<MealType, MealRecord>();
  for (const m of dbMeals) {
    if (new Date(m.eaten_at) < todayStart) continue;
    const type = m.meal_type as MealType;
    const existing = todayMealsByType.get(type);
    if (!existing || new Date(m.eaten_at) > new Date(existing.eaten_at)) {
      todayMealsByType.set(type, m);
    }
  }

  // 三個固定主餐 slot
  const slots: Meal[] = EMPTY_MEAL_SLOTS.map((type) => {
    const db = todayMealsByType.get(type);
    if (db) return dbMealToCard(type, db);
    return {
      name: MEAL_LABEL[type],
      time: "",
      items: "",
      cal: 0,
      color: MEAL_COLOR[type],
      photo: "",
      logged: false,
      mealType: type,
    };
  });

  // 今天有點心 → 附加一張點心卡（只在有記錄時顯示）
  const snack = todayMealsByType.get("snack");
  if (snack) slots.push(dbMealToCard("snack", snack));

  return slots;
}

/** 根據目前時間決定該記哪一餐 */
export function guessMealType(date: Date = new Date()): MealType {
  const h = date.getHours();
  if (h < 10) return "breakfast";
  if (h < 14) return "lunch";
  if (h < 17) return "snack";
  return "dinner";
}

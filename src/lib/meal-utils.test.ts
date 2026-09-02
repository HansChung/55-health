import { describe, it, expect } from "vitest";
import { mergeMealsWithSlots, guessMealType } from "./meal-utils";
import type { MealRecord } from "./api-client";

/** 產生一筆測試餐點；hoursAgo 用「今天的第幾點」比較穩定，避免跨日 flaky */
function meal(
  meal_type: MealRecord["meal_type"],
  atHour: number,
  opts: { dayOffset?: number; cal?: number; name?: string } = {}
): MealRecord {
  const d = new Date();
  d.setDate(d.getDate() + (opts.dayOffset ?? 0));
  d.setHours(atHour, 0, 0, 0);
  return {
    id: `${meal_type}-${atHour}-${opts.dayOffset ?? 0}`,
    user_id: "u1",
    meal_type,
    eaten_at: d.toISOString(),
    photo_url: null,
    items: [{ name: opts.name ?? "白飯", color: "#E8845A", emoji: "🍚" }],
    total_cal: opts.cal ?? 300,
    protein_g: 10,
    carb_g: 40,
    fat_g: 5,
  } as unknown as MealRecord;
}

describe("mergeMealsWithSlots", () => {
  it("沒有任何記錄時，回傳早/午/晚三個空 slot", () => {
    const slots = mergeMealsWithSlots([]);
    expect(slots).toHaveLength(3);
    expect(slots.map((s) => s.mealType)).toEqual(["breakfast", "lunch", "dinner"]);
    expect(slots.every((s) => s.logged === false)).toBe(true);
  });

  it("今天的早餐會填進早餐 slot，其他仍為空", () => {
    const slots = mergeMealsWithSlots([meal("breakfast", 8, { cal: 450, name: "稀飯" })]);
    expect(slots[0].logged).toBe(true);
    expect(slots[0].cal).toBe(450);
    expect(slots[0].items).toBe("稀飯");
    expect(slots[1].logged).toBe(false);
    expect(slots[2].logged).toBe(false);
  });

  // 回歸測試：曾發生「下午 5 點前拍的晚餐被歸成點心，首頁卻不顯示」
  it("今天有點心時，額外附加第 4 張點心卡", () => {
    const slots = mergeMealsWithSlots([meal("snack", 15, { name: "水果" })]);
    expect(slots).toHaveLength(4);
    expect(slots[3].mealType).toBe("snack");
    expect(slots[3].logged).toBe(true);
    expect(slots[3].items).toBe("水果");
  });

  it("沒有點心時不顯示點心卡（避免長輩畫面雜亂）", () => {
    const slots = mergeMealsWithSlots([meal("lunch", 12)]);
    expect(slots).toHaveLength(3);
    expect(slots.some((s) => s.mealType === "snack")).toBe(false);
  });

  it("昨天的餐點不算進今天", () => {
    const slots = mergeMealsWithSlots([meal("breakfast", 8, { dayOffset: -1 })]);
    expect(slots.every((s) => s.logged === false)).toBe(true);
  });

  it("同一餐型有多筆時，保留最新的那筆", () => {
    const slots = mergeMealsWithSlots([
      meal("lunch", 11, { cal: 100, name: "舊的" }),
      meal("lunch", 13, { cal: 900, name: "新的" }),
    ]);
    expect(slots[1].cal).toBe(900);
    expect(slots[1].items).toBe("新的");
  });

  it("順序不影響結果（傳入順序顛倒仍取最新）", () => {
    const slots = mergeMealsWithSlots([
      meal("lunch", 13, { cal: 900, name: "新的" }),
      meal("lunch", 11, { cal: 100, name: "舊的" }),
    ]);
    expect(slots[1].cal).toBe(900);
  });

  it("三餐 + 點心全記錄時共 4 張卡", () => {
    const slots = mergeMealsWithSlots([
      meal("breakfast", 8), meal("lunch", 12), meal("dinner", 18), meal("snack", 15),
    ]);
    expect(slots).toHaveLength(4);
    expect(slots.every((s) => s.logged)).toBe(true);
  });
});

describe("guessMealType", () => {
  const at = (h: number) => {
    const d = new Date();
    d.setHours(h, 0, 0, 0);
    return d;
  };

  it("清晨到上午算早餐", () => {
    expect(guessMealType(at(6))).toBe("breakfast");
    expect(guessMealType(at(9))).toBe("breakfast");
  });

  it("10 點起算午餐", () => {
    expect(guessMealType(at(10))).toBe("lunch");
    expect(guessMealType(at(13))).toBe("lunch");
  });

  it("14–16 點算點心", () => {
    expect(guessMealType(at(14))).toBe("snack");
    expect(guessMealType(at(16))).toBe("snack");
  });

  it("17 點後算晚餐", () => {
    expect(guessMealType(at(17))).toBe("dinner");
    expect(guessMealType(at(21))).toBe("dinner");
  });
});

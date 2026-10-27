import { describe, expect, it } from "vitest";
import { DEFAULT_FAVORITES, MENU_GROUPS, MENU_ITEMS, pickFavorites, type MenuId } from "./feature-menu";

const all = Object.keys(MENU_ITEMS) as MenuId[];

describe("feature menu", () => {
  it("every item is in exactly one group", () => {
    const grouped = MENU_GROUPS.flatMap((g) => g.items);
    expect(new Set(grouped).size).toBe(grouped.length);
    expect([...grouped].sort()).toEqual([...all].sort());
  });
  it("defaults when nothing was used, shown in menu order", () => {
    expect(pickFavorites({}, all)).toEqual(["clinic", "ask", "photo_ask", "scam_check"]);
    expect(new Set(pickFavorites({}, all))).toEqual(new Set(DEFAULT_FAVORITES));
  });
  it("one use is not enough to replace a default, two uses are", () => {
    expect(pickFavorites({ stories: 1 }, all)).not.toContain("stories");
    expect(pickFavorites({ stories: 2 }, all)).toContain("stories");
  });
  it("only picks available features and fills from the menu", () => {
    const avail: MenuId[] = ["ask", "health_metrics", "exercise", "stories", "caregiver"];
    expect(pickFavorites({}, avail)).toEqual(["health_metrics", "exercise", "ask", "stories"]);
  });
});

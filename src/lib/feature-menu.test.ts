import { describe, expect, it } from "vitest";
import {
  COMPASS_CENTER, COMPASS_DIRECTIONS, DEFAULT_FAVORITES, MENU_GROUPS, MENU_ITEMS, pickFavorites, searchMenu, type MenuId,
} from "./feature-menu";

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

describe("life compass", () => {
  it("every item is in exactly one compass direction or the center", () => {
    const placed = [...COMPASS_CENTER, ...COMPASS_DIRECTIONS.flatMap((d) => d.items)];
    expect(new Set(placed).size).toBe(placed.length);
    expect([...placed].sort()).toEqual([...all].sort());
  });
  it("uses the book's five SMART directions with plain labels", () => {
    expect(COMPASS_DIRECTIONS.map((d) => d.key)).toEqual(["S", "M", "A", "R", "T"]);
    for (const d of COMPASS_DIRECTIONS) {
      expect(d.label.length).toBeGreaterThan(0);
      expect(d.smartLabel.startsWith(`${d.key}・`)).toBe(true);
      expect(d.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});

describe("searchMenu", () => {
  it("finds by name, description and keyword", () => {
    expect(searchMenu("血壓", all)).toContain("health_metrics");
    expect(searchMenu("詐騙", all)).toEqual(["scam_check"]);
    expect(searchMenu("太極", all)).toEqual(["exercise"]);
  });
  it("finds from a spoken sentence", () => {
    expect(searchMenu("我想量血壓。", all)).toContain("health_metrics");
    expect(searchMenu("我要看醫生", all)).toContain("clinic");
  });
  it("ignores spaces, case and punctuation; empty finds nothing", () => {
    expect(searchMenu(" line ", all)).toContain("scam_check");
    expect(searchMenu("  ", all)).toEqual([]);
    expect(searchMenu("？", all)).toEqual([]);
  });
  it("only returns available features, in menu order", () => {
    expect(searchMenu("詐騙", ["ask"])).toEqual([]);
    const r = searchMenu("影片", all);
    expect(r).toEqual(["travel_video", "greeting_video"]);
  });
});

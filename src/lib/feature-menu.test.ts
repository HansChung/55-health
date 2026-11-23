import { describe, expect, it } from "vitest";
import {
  COMPASS_BUTTON, COMPASS_CENTER, COMPASS_CENTER_SIZE, COMPASS_DIRECTIONS, COMPASS_RADIUS, compassLayout, DEFAULT_FAVORITES, MENU_GROUPS, MENU_ITEMS, pickFavorites, searchMenu, type MenuId,
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

describe("compassLayout（羅盤版面）", () => {
  const half = { w: COMPASS_BUTTON.width / 2, h: COMPASS_BUTTON.height / 2 };

  it("every direction button sits on the ring, the same distance from the middle", () => {
    for (let n = 1; n <= 5; n++) {
      const l = compassLayout(n);
      expect(l.spots).toHaveLength(n);
      for (const p of l.spots) expect(Math.hypot(p.x - l.cx, p.y - l.cy)).toBeCloseTo(COMPASS_RADIUS, 1);
    }
  });

  it("no button sticks out of the compass, for any number of directions", () => {
    for (let n = 0; n <= 5; n++) {
      const l = compassLayout(n);
      for (const p of l.spots) {
        expect(p.x - half.w).toBeGreaterThanOrEqual(0);
        expect(p.x + half.w).toBeLessThanOrEqual(100);
        expect(p.y - half.h).toBeGreaterThanOrEqual(0);
        expect(p.y + half.h).toBeLessThanOrEqual(l.height);
      }
      // 圓環和中間的暖暖也在裡面
      expect(l.cy - COMPASS_RADIUS).toBeGreaterThanOrEqual(0);
      expect(l.cy + COMPASS_RADIUS).toBeLessThanOrEqual(l.height);
    }
  });

  it("five directions: left and right mirror each other, same gap above and below", () => {
    const l = compassLayout(5);
    const [top, upperRight, lowerRight, lowerLeft, upperLeft] = l.spots;
    expect(top.x).toBe(50);
    expect(upperRight.x + upperLeft.x).toBeCloseTo(100, 1);
    expect(upperRight.y).toBeCloseTo(upperLeft.y, 1);
    expect(lowerRight.x + lowerLeft.x).toBeCloseTo(100, 1);
    expect(lowerRight.y).toBeCloseTo(lowerLeft.y, 1);
    expect(top.y - half.h).toBeCloseTo(l.height - (lowerLeft.y + half.h), 1);
  });

  it("buttons don't overlap each other or the middle", () => {
    const l = compassLayout(5);
    const overlaps = (a: { x: number; y: number }, b: { x: number; y: number }) =>
      Math.abs(a.x - b.x) < COMPASS_BUTTON.width && Math.abs(a.y - b.y) < COMPASS_BUTTON.height;
    l.spots.forEach((a, i) => l.spots.slice(i + 1).forEach((b) => expect(overlaps(a, b)).toBe(false)));
    // 中間是圓的：按鈕最近的點離圓心要比半徑遠
    for (const p of l.spots) {
      const dx = Math.max(Math.abs(p.x - l.cx) - half.w, 0);
      const dy = Math.max(Math.abs(p.y - l.cy) - half.h, 0);
      expect(Math.hypot(dx, dy)).toBeGreaterThan(COMPASS_CENTER_SIZE / 2);
    }
  });

  it("every direction has its own icon, different from the feature icons", () => {
    const icons = COMPASS_DIRECTIONS.map((d) => d.emoji);
    expect(new Set(icons).size).toBe(icons.length);
    const featureIcons = Object.values(MENU_ITEMS).map((m) => m.emoji);
    for (const icon of icons) expect(featureIcons).not.toContain(icon);
  });
});

import { describe, it, expect } from "vitest";
import { computeStreaks } from "./achievements";

// 用本地日期字串，避免 UTC 時差影響測試
function localKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function daysAgo(n: number): string {
  return localKey(new Date(Date.now() - n * 86400000));
}

describe("computeStreaks", () => {
  it("空陣列回傳 0/0", () => {
    expect(computeStreaks([])).toEqual({ current: 0, longest: 0 });
  });

  it("只有今天 → current=1, longest=1", () => {
    expect(computeStreaks([daysAgo(0)])).toEqual({ current: 1, longest: 1 });
  });

  it("連續三天（含今天）→ current=3", () => {
    const r = computeStreaks([daysAgo(2), daysAgo(1), daysAgo(0)]);
    expect(r.current).toBe(3);
    expect(r.longest).toBe(3);
  });

  it("同一天多筆只算一天", () => {
    const today = daysAgo(0);
    const r = computeStreaks([today, today, today]);
    expect(r.current).toBe(1);
    expect(r.longest).toBe(1);
  });

  it("最後記錄是前天 → current=0（中斷），但 longest 仍保留", () => {
    const r = computeStreaks([daysAgo(4), daysAgo(3), daysAgo(2)]);
    expect(r.current).toBe(0);
    expect(r.longest).toBe(3);
  });

  it("有中斷時 longest 取最長段", () => {
    // 最長一段是 5、4、3（連 3 天），今天單獨一天
    const r = computeStreaks([daysAgo(5), daysAgo(4), daysAgo(3), daysAgo(0)]);
    expect(r.longest).toBe(3);
    expect(r.current).toBe(1);
  });
});

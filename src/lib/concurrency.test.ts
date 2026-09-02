import { describe, it, expect } from "vitest";
import { mapWithConcurrency, createDeadline } from "./concurrency";

const tick = (ms = 0) => new Promise((r) => setTimeout(r, ms));

describe("mapWithConcurrency", () => {
  it("空陣列直接回傳空", async () => {
    expect(await mapWithConcurrency([], 3, async (x) => x)).toEqual([]);
  });

  it("回傳順序與輸入一致（即使完成順序不同）", async () => {
    const items = [30, 5, 20, 1];
    const out = await mapWithConcurrency(items, 2, async (ms) => {
      await tick(ms);
      return ms;
    });
    expect(out).toEqual(items);
  });

  it("同時執行數不超過上限", async () => {
    let running = 0;
    let peak = 0;
    await mapWithConcurrency(Array.from({ length: 20 }, (_, i) => i), 4, async () => {
      running++;
      peak = Math.max(peak, running);
      await tick(5);
      running--;
      return null;
    });
    expect(peak).toBeLessThanOrEqual(4);
    expect(peak).toBeGreaterThan(1); // 確實有併發，不是變成序列
  });

  it("每個項目都會被處理到一次", async () => {
    const seen: number[] = [];
    await mapWithConcurrency([1, 2, 3, 4, 5], 3, async (n) => {
      seen.push(n);
      return n;
    });
    expect(seen.sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it("併發數大於項目數時不會出錯", async () => {
    expect(await mapWithConcurrency([1, 2], 99, async (n) => n * 2)).toEqual([2, 4]);
  });
});

describe("createDeadline", () => {
  it("剛建立時尚未過期", () => {
    expect(createDeadline(1000).expired).toBe(false);
  });

  it("超過預算後標記為過期", async () => {
    const d = createDeadline(10);
    await tick(25);
    expect(d.expired).toBe(true);
  });

  it("回報已經過的時間", async () => {
    const d = createDeadline(1000);
    await tick(15);
    expect(d.elapsedMs).toBeGreaterThanOrEqual(10);
  });
});

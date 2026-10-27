import { describe, expect, it } from "vitest";
import { BRAIN_KINDS, brainStreak, dailyKind, dailyQuestion, makeQuestion, type BrainKind } from "./brain-games";

describe("questions", () => {
  it("every kind gives valid, deterministic questions for many seeds", () => {
    for (const { id } of BRAIN_KINDS) {
      for (let seed = 1; seed <= 300; seed++) {
        const q = makeQuestion(id as BrainKind, seed);
        expect(q.kind).toBe(id);
        expect(q.options.length).toBe(id === "odd" ? 6 : 4);
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.answer).toBeLessThan(q.options.length);
        if (id !== "odd") expect(new Set(q.options).size).toBe(q.options.length);
        expect(q.prompt.length).toBeGreaterThan(3);
        expect(makeQuestion(id as BrainKind, seed)).toEqual(q);
      }
    }
  });
  it("money questions add up", () => {
    for (let seed = 1; seed <= 100; seed++) {
      const q = makeQuestion("money", seed);
      const m = /一.+ (\d+) 元，買 (\d+) .+給老闆 (\d+) 元/.exec(q.prompt)!;
      expect(q.options[q.answer]).toBe(`${Number(m[3]) - Number(m[1]) * Number(m[2])} 元`);
    }
  });
  it("memory answer is the memorized number; idiom answer fills the blank", () => {
    const m = makeQuestion("memory", 7);
    expect(m.options[m.answer]).toBe(m.memorize);
    const q = makeQuestion("idiom", 3);
    expect(q.explain.startsWith(q.prompt.slice(1, q.prompt.indexOf("」")).replace("＿", q.options[q.answer]))).toBe(true);
  });
  it("odd one out has exactly one different emoji", () => {
    const q = makeQuestion("odd", 11);
    const other = q.options.filter((_, i) => i !== q.answer);
    expect(new Set(other).size).toBe(1);
    expect(other[0]).not.toBe(q.options[q.answer]);
  });
});

describe("daily", () => {
  it("rotates kinds day by day and is the same for everyone that day", () => {
    const kinds = ["2026-10-14", "2026-10-15", "2026-10-16", "2026-10-17", "2026-10-18"].map(dailyKind);
    expect(new Set(kinds).size).toBe(5);
    expect(dailyKind("2026-10-19")).toBe(kinds[0]);
    expect(dailyQuestion("2026-10-14")).toEqual(dailyQuestion("2026-10-14"));
  });
  it("streaks count consecutive Taipei days, today optional", () => {
    expect(brainStreak([], "2026-10-14")).toEqual({ current: 0, longest: 0 });
    expect(brainStreak(["2026-10-12", "2026-10-13"], "2026-10-14")).toEqual({ current: 2, longest: 2 });
    expect(brainStreak(["2026-10-12", "2026-10-13", "2026-10-14"], "2026-10-14")).toEqual({ current: 3, longest: 3 });
    expect(brainStreak(["2026-10-01", "2026-10-02", "2026-10-03", "2026-10-10"], "2026-10-14")).toEqual({ current: 0, longest: 3 });
  });
});

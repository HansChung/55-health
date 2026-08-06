import { describe, it, expect } from "vitest";
import {
  BLUEPRINT_DIMENSIONS,
  sparkCountToScore,
  scoresFromSparkCounts,
  countSparksByDimension,
  glowingDimension,
  needsBoostDimension,
} from "./smart-blueprint";

describe("圓夢藍圖構面", () => {
  it("R 軸為安全", () => {
    const r = BLUEPRINT_DIMENSIONS.find((d) => d.key === "R");
    expect(r?.label).toBe("安全");
    expect(r?.shortLabel).toContain("安全");
  });

  it("五軸齊全", () => {
    expect(BLUEPRINT_DIMENSIONS.map((d) => d.key)).toEqual(["S", "M", "A", "R", "T"]);
  });
});

describe("光點計分", () => {
  it("sparkCountToScore 門檻", () => {
    expect(sparkCountToScore(0)).toBe(0);
    expect(sparkCountToScore(1)).toBe(45);
    expect(sparkCountToScore(4)).toBe(100);
  });

  it("countSparksByDimension", () => {
    const counts = countSparksByDimension([
      { dimension: "R" },
      { dimension: "R" },
      { dimension: "S" },
    ]);
    expect(counts.R).toBe(2);
    expect(counts.S).toBe(1);
    expect(counts.A).toBe(0);
  });

  it("glowing / needsBoost", () => {
    const counts = { S: 1, M: 0, A: 3, R: 0, T: 0 };
    expect(glowingDimension(counts).key).toBe("A");
    expect(needsBoostDimension(counts).key).toBe("M"); // 同分取順序第一個 0
  });

  it("scoresFromSparkCounts", () => {
    const scores = scoresFromSparkCounts({ S: 1, M: 0, A: 0, R: 2, T: 0 });
    expect(scores.S).toBe(45);
    expect(scores.R).toBe(65);
    expect(scores.M).toBe(0);
  });
});

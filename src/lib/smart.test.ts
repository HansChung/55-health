import { describe, it, expect } from "vitest";
import {
  computeDimensionScores,
  computeScoresFromResponses,
  computeSHI,
  strongestDimension,
  weakestDimension,
  weakestDimensions,
  dimensionDeltas,
  buildSmartInsights,
  buildQuizPlan,
  personalizeFocusNote,
  extractAskedIds,
  type SmartScores,
  type SmartSignals,
} from "./smart";

const ALL_FIVE: number[] = Array.from({ length: 15 }, () => 5);
const ALL_ONE: number[] = Array.from({ length: 15 }, () => 1);

/** 刻意讓 R 最弱、S 最強 */
function unevenAnswers(): number[] {
  // 每構面 3 題：S=5, M=4, A=3, R=1, T=2
  return [
    5, 5, 5, // S → 100
    4, 4, 4, // M → 75
    3, 3, 3, // A → 50
    1, 1, 1, // R → 0
    2, 2, 2, // T → 25
  ];
}

describe("computeDimensionScores / computeSHI", () => {
  it("全部非常同意 → 五軸 100、SHI 100", () => {
    const scores = computeDimensionScores(ALL_FIVE);
    expect(scores).toEqual({ S: 100, M: 100, A: 100, R: 100, T: 100 });
    expect(computeSHI(scores)).toBe(100);
  });

  it("全部非常不同意 → 五軸 0、SHI 0", () => {
    const scores = computeDimensionScores(ALL_ONE);
    expect(scores).toEqual({ S: 0, M: 0, A: 0, R: 0, T: 0 });
    expect(computeSHI(scores)).toBe(0);
  });

  it("不均勻答案換算正確", () => {
    const scores = computeDimensionScores(unevenAnswers());
    expect(scores).toEqual({ S: 100, M: 75, A: 50, R: 0, T: 25 });
    expect(computeSHI(scores)).toBe(50);
  });
});

describe("strongest / weakest / deltas", () => {
  const scores: SmartScores = { S: 100, M: 75, A: 50, R: 0, T: 25 };

  it("strongest 取最高分構面", () => {
    expect(strongestDimension(scores).key).toBe("S");
  });

  it("weakest 取最低分構面", () => {
    expect(weakestDimension(scores).key).toBe("R");
  });

  it("dimensionDeltas 算本次−上次", () => {
    const prev: SmartScores = { S: 90, M: 80, A: 50, R: 10, T: 20 };
    expect(dimensionDeltas(scores, prev)).toEqual({
      S: 10,
      M: -5,
      A: 0,
      R: -10,
      T: 5,
    });
  });

  it("無上次 → deltas 為 null", () => {
    expect(dimensionDeltas(scores, null)).toBeNull();
  });
});

describe("buildSmartInsights / personalizeFocusNote", () => {
  const scores: SmartScores = { S: 100, M: 75, A: 50, R: 0, T: 25 };

  it("無訊號時仍有優勢／焦點與五軸建議", () => {
    const insights = buildSmartInsights(scores, null, null);
    expect(insights.strength.key).toBe("S");
    expect(insights.focus.key).toBe("R");
    expect(insights.shi).toBe(50);
    expect(insights.dimensionTips).toHaveLength(5);
    expect(insights.personalizedNote).toContain("0 分");
    expect(insights.strengthNote).toContain("社會連結");
  });

  it("韌性低 + 無運動 → 個人化建議提到運動", () => {
    const signals: SmartSignals = {
      mealDaysLast7: 5,
      exerciseCountLast7: 0,
      hasAcceptedFamily: true,
      hasMetricsLast7: true,
    };
    const note = personalizeFocusNote(
      { key: "R", en: "Resilience", label: "身心韌性", color: "#5BA0C9", desc: "" },
      scores,
      signals
    );
    expect(note).toMatch(/運動/);

    const insights = buildSmartInsights(scores, null, signals);
    const rTip = insights.dimensionTips.find((t) => t.key === "R")!;
    expect(rTip.cta).toBe("exercise");
    expect(rTip.tip).toMatch(/運動/);
  });

  it("社會連結低 + 無家人 → 建議邀請家人", () => {
    const lowS: SmartScores = { S: 10, M: 80, A: 80, R: 80, T: 80 };
    const signals: SmartSignals = {
      mealDaysLast7: 4,
      exerciseCountLast7: 2,
      hasAcceptedFamily: false,
      hasMetricsLast7: true,
    };
    const insights = buildSmartInsights(lowS, null, signals);
    expect(insights.focus.key).toBe("S");
    expect(insights.personalizedNote).toMatch(/家人/);
    const sTip = insights.dimensionTips.find((t) => t.key === "S")!;
    expect(sTip.cta).toBe("family");
  });

  it("有上次分數時帶出 deltas", () => {
    const prev: SmartScores = { S: 90, M: 70, A: 40, R: 20, T: 30 };
    const insights = buildSmartInsights(scores, prev, null);
    expect(insights.deltas).toEqual({
      S: 10,
      M: 5,
      A: 10,
      R: -20,
      T: -5,
    });
    expect(insights.dimensionTips.find((t) => t.key === "R")!.delta).toBe(-20);
  });
});

describe("智慧複測出題 / 計分", () => {
  const prev: SmartScores = { S: 100, M: 75, A: 50, R: 0, T: 25 };

  it("無上次 → 完整 15 題", () => {
    const plan = buildQuizPlan({ previousScores: null, seed: 1 });
    expect(plan.mode).toBe("full");
    expect(plan.questions).toHaveLength(15);
    expect(plan.questions.map((q) => q.id)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
    ]);
  });

  it("有上次 → 約 7 題，弱項各 2 題", () => {
    const plan = buildQuizPlan({ previousScores: prev, seed: 42 });
    expect(plan.mode).toBe("quick");
    expect(plan.questions).toHaveLength(7);
    expect(plan.focusDims).toEqual(["R", "T"]);
    const countByDim = { S: 0, M: 0, A: 0, R: 0, T: 0 };
    for (const q of plan.questions) countByDim[q.dim]++;
    expect(countByDim.R).toBe(2);
    expect(countByDim.T).toBe(2);
    expect(countByDim.S).toBe(1);
    expect(countByDim.M).toBe(1);
    expect(countByDim.A).toBe(1);
  });

  it("weakestDimensions 取最低兩個", () => {
    expect(weakestDimensions(prev, 2)).toEqual(["R", "T"]);
  });

  it("複測計分：有答的更新、沒答的沿用上次", () => {
    // 只答 R 兩題都 5 → R=100；其他沿用
    const scores = computeScoresFromResponses({ 10: 5, 25: 5 }, prev);
    expect(scores.R).toBe(100);
    expect(scores.S).toBe(100);
    expect(scores.T).toBe(25);
  });

  it("同 seed 出題穩定；避開最近題目", () => {
    const a = buildQuizPlan({ previousScores: prev, seed: 7, recentAskedIds: [10, 11, 12] });
    const b = buildQuizPlan({ previousScores: prev, seed: 7, recentAskedIds: [10, 11, 12] });
    expect(a.questions.map((q) => q.id)).toEqual(b.questions.map((q) => q.id));
    const rIds = a.questions.filter((q) => q.dim === "R").map((q) => q.id);
    // 應優先避開 10/11/12
    expect(rIds.every((id) => ![10, 11, 12].includes(id))).toBe(true);
  });

  it("extractAskedIds 支援舊陣列與新格式", () => {
    expect(extractAskedIds([5, 4, 3])).toEqual([1, 2, 3]);
    expect(extractAskedIds({ mode: "quick", responses: { "16": 4, "25": 5 } })).toEqual([16, 25]);
  });
});

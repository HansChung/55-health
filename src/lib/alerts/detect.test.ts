import { describe, it, expect } from "vitest";
import { detectAnomalies, THRESHOLDS } from "./detect";

const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY).toISOString();

interface Fixtures {
  /** 近期是否有活動記錄（餐點/量測/對話/運動任一） */
  hasActivity?: boolean;
  bp?: { systolic: number | null; diastolic: number | null } | null;
  glucose?: { glucose_mg_dl: number; glucose_context?: string } | null;
  weights?: { weight_kg: number | null }[];
}

/**
 * 假的 supabase client：模擬鏈式查詢，依 table + metric_type 回傳對應資料。
 * 每個方法都回傳同一個 thenable，所以不管鏈到哪一步 await 都拿得到資料。
 */
function fakeSupabase(f: Fixtures) {
  return {
    from(table: string) {
      const eqs: Record<string, unknown> = {};
      const builder: Record<string, unknown> = {};
      const chain = () => builder;
      Object.assign(builder, {
        select: chain,
        gte: chain,
        order: chain,
        limit: chain,
        eq: (col: string, val: unknown) => {
          eqs[col] = val;
          return builder;
        },
        then: (resolve: (v: { data: unknown[] }) => void) => {
          resolve({ data: resolveData(table, eqs, f) });
        },
      });
      return builder;
    },
  };
}

function resolveData(table: string, eqs: Record<string, unknown>, f: Fixtures): unknown[] {
  // 規則 1 的四張活動表
  if (["meals", "conversations", "exercises"].includes(table)) {
    return f.hasActivity ? [{ id: "x" }] : [];
  }
  if (table === "health_metrics") {
    const type = eqs["metric_type"];
    if (type === "blood_pressure") return f.bp ? [f.bp] : [];
    if (type === "blood_glucose") return f.glucose ? [f.glucose] : [];
    if (type === "weight") return f.weights ?? [];
    // 規則 1 也會查 health_metrics（沒帶 metric_type）
    return f.hasActivity ? [{ id: "x" }] : [];
  }
  return [];
}

/** 預設：有活動、各項健康值正常 → 不該有任何警報 */
const HEALTHY: Fixtures = {
  hasActivity: true,
  bp: { systolic: 125, diastolic: 80 },
  glucose: { glucose_mg_dl: 100, glucose_context: "fasting" },
  weights: [{ weight_kg: 60 }, { weight_kg: 60.3 }],
};

const run = (f: Fixtures, profile: Parameters<typeof detectAnomalies>[2] = null) =>
  detectAnomalies(fakeSupabase(f) as never, "elder-1", profile);

const types = (alerts: { type: string }[]) => alerts.map((a) => a.type);

describe("detectAnomalies — 整體", () => {
  it("一切正常時不發出任何警報（避免騷擾家人）", async () => {
    expect(await run(HEALTHY)).toEqual([]);
  });

  it("多項異常會同時回報", async () => {
    const alerts = await run({
      ...HEALTHY,
      hasActivity: false,
      bp: { systolic: 175, diastolic: 105 },
    });
    expect(types(alerts)).toContain("inactivity");
    expect(types(alerts)).toContain("blood_pressure");
  });
});

describe("規則 1：失聯偵測", () => {
  it("完全沒有活動記錄 → 發出失聯警報", async () => {
    const alerts = await run({ ...HEALTHY, hasActivity: false });
    const a = alerts.find((x) => x.type === "inactivity");
    expect(a?.severity).toBe("warning");
    expect(a?.title).toContain(String(THRESHOLDS.inactivityDays));
  });

  it("有活動記錄 → 不發失聯警報", async () => {
    expect(types(await run({ ...HEALTHY, hasActivity: true }))).not.toContain("inactivity");
  });
});

describe("規則 2：血壓", () => {
  it("收縮壓超標 → critical", async () => {
    const a = (await run({ ...HEALTHY, bp: { systolic: 175, diastolic: 95 } }))
      .find((x) => x.type === "blood_pressure");
    expect(a?.severity).toBe("critical");
    expect(a?.title).toBe("血壓偏高");
  });

  it("舒張壓單獨超標也要抓到", async () => {
    const a = (await run({ ...HEALTHY, bp: { systolic: 130, diastolic: 105 } }))
      .find((x) => x.type === "blood_pressure");
    expect(a?.severity).toBe("critical");
  });

  it("剛好等於閾值就算超標（>=）", async () => {
    const a = (await run({
      ...HEALTHY,
      bp: { systolic: THRESHOLDS.bpSystolicHigh, diastolic: 80 },
    })).find((x) => x.type === "blood_pressure");
    expect(a).toBeDefined();
  });

  it("血壓偏低 → warning（不是 critical）", async () => {
    const a = (await run({ ...HEALTHY, bp: { systolic: 85, diastolic: 55 } }))
      .find((x) => x.type === "blood_pressure");
    expect(a?.severity).toBe("warning");
    expect(a?.title).toBe("血壓偏低");
  });

  it("正常血壓不報", async () => {
    expect(types(await run({ ...HEALTHY, bp: { systolic: 120, diastolic: 75 } })))
      .not.toContain("blood_pressure");
  });

  it("沒有血壓記錄時不報（不能把「沒量」當成異常）", async () => {
    expect(types(await run({ ...HEALTHY, bp: null }))).not.toContain("blood_pressure");
  });

  it("數值為 null 時不報（資料不完整不應誤判）", async () => {
    expect(types(await run({ ...HEALTHY, bp: { systolic: null, diastolic: null } })))
      .not.toContain("blood_pressure");
  });
});

describe("規則 3：血糖", () => {
  it("空腹血糖超標用較嚴格的門檻", async () => {
    const a = (await run({
      ...HEALTHY,
      glucose: { glucose_mg_dl: 190, glucose_context: "fasting" },
    })).find((x) => x.type === "blood_glucose");
    expect(a?.severity).toBe("critical");
    expect(a?.message).toContain("空腹");
  });

  it("同樣數值但非空腹則不報（門檻較寬）", async () => {
    expect(types(await run({
      ...HEALTHY,
      glucose: { glucose_mg_dl: 190, glucose_context: "after_meal" },
    }))).not.toContain("blood_glucose");
  });

  it("低血糖視為 critical（有立即危險）", async () => {
    const a = (await run({ ...HEALTHY, glucose: { glucose_mg_dl: 60 } }))
      .find((x) => x.type === "blood_glucose");
    expect(a?.severity).toBe("critical");
    expect(a?.title).toBe("血糖偏低");
  });

  it("正常血糖不報", async () => {
    expect(types(await run({ ...HEALTHY, glucose: { glucose_mg_dl: 110 } })))
      .not.toContain("blood_glucose");
  });
});

describe("規則 4：體重驟變", () => {
  it("7 天內增加超過閾值 → 警報", async () => {
    const a = (await run({ ...HEALTHY, weights: [{ weight_kg: 63 }, { weight_kg: 60 }] }))
      .find((x) => x.type === "weight_change");
    expect(a?.severity).toBe("warning");
    expect(a?.title).toContain("增加");
  });

  it("驟降也要抓到", async () => {
    const a = (await run({ ...HEALTHY, weights: [{ weight_kg: 57 }, { weight_kg: 60 }] }))
      .find((x) => x.type === "weight_change");
    expect(a?.title).toContain("減少");
  });

  it("小幅波動不報（避免每天量體重就被打擾）", async () => {
    expect(types(await run({ ...HEALTHY, weights: [{ weight_kg: 60.8 }, { weight_kg: 60 }] })))
      .not.toContain("weight_change");
  });

  it("只有一筆體重時不報（無從比較）", async () => {
    expect(types(await run({ ...HEALTHY, weights: [{ weight_kg: 60 }] })))
      .not.toContain("weight_change");
  });
});

describe("規則 5：漏吃藥", () => {
  const withMeds = (meds: unknown[]) => ({ display_name: "陳阿伯", medications: meds } as never);

  it("開了提醒但多天沒服藥 → 警報", async () => {
    const a = (await run(HEALTHY, withMeds([
      { name: "阿斯匹靈", reminder_enabled: true, last_taken_at: daysAgo(5) },
    ]))).find((x) => x.type === "missed_medication");
    expect(a?.severity).toBe("warning");
    expect(a?.message).toContain("阿斯匹靈");
  });

  it("今天剛吃過 → 不報", async () => {
    expect(types(await run(HEALTHY, withMeds([
      { name: "阿斯匹靈", reminder_enabled: true, last_taken_at: daysAgo(0) },
    ])))).not.toContain("missed_medication");
  });

  it("從未記錄服藥 → 視為漏藥", async () => {
    expect(types(await run(HEALTHY, withMeds([
      { name: "降血壓藥", reminder_enabled: true },
    ])))).toContain("missed_medication");
  });

  it("沒開提醒的藥不納入判斷（用戶沒要求追蹤）", async () => {
    expect(types(await run(HEALTHY, withMeds([
      { name: "保健食品", reminder_enabled: false },
    ])))).not.toContain("missed_medication");
  });

  it("沒有藥物資料時不報", async () => {
    expect(types(await run(HEALTHY, null))).not.toContain("missed_medication");
  });
});

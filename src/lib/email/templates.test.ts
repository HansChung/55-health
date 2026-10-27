import { describe, expect, it } from "vitest";
import { buildWeeklyReportEmail } from "./templates";

const report = {
  meals: { days_logged: 5, meals_count: 12, avg_calories: 1650 },
  exercise: { minutes: 95 },
  tips: ["給長輩的提醒"],
  family_summary: ["飲食那句", "運動那句", "血壓血糖那句", "下週那句"],
  family_summary_by_kind: { diary: ["飲食那句", "運動那句", "下週那句"], health: ["血壓血糖那句"] },
};

describe("buildWeeklyReportEmail：家人只看到長輩願意分享的", () => {
  it("只開健康警示 → 沒有餐數、熱量、運動，只有血壓血糖那句", () => {
    const html = buildWeeklyReportEmail({ recipientName: "小美", elderName: "阿嬤", forFamily: true, share: { diary: false, calories: false, health: true }, report });
    expect(html).toContain("血壓血糖那句");
    expect(html).not.toContain("飲食那句");
    expect(html).not.toContain("大卡");
    expect(html).not.toContain("飲食記錄");
    expect(html).not.toContain("運動累積");
  });
  it("只開今日卡路里 → 只有平均熱量", () => {
    const html = buildWeeklyReportEmail({ recipientName: "小美", elderName: "阿嬤", forFamily: true, share: { diary: false, calories: true, health: false }, report });
    expect(html).toContain("1650");
    expect(html).not.toContain("飲食記錄");
    expect(html).not.toContain("血壓血糖那句");
  });
  it("全開 → 全部都有", () => {
    const html = buildWeeklyReportEmail({ recipientName: "小美", elderName: "阿嬤", forFamily: true, share: { diary: true, calories: true, health: true }, report });
    for (const t of ["飲食那句", "血壓血糖那句", "下週那句", "1650", "飲食記錄", "運動累積"]) expect(html).toContain(t);
  });
  it("寄家人卻沒給 share → 寧可什麼都不放", () => {
    const html = buildWeeklyReportEmail({ recipientName: "小美", elderName: "阿嬤", forFamily: true, report });
    expect(html).not.toContain("飲食那句");
    expect(html).not.toContain("1650");
  });
  it("長輩自己收 → 全部統計＋給長輩的提醒", () => {
    const html = buildWeeklyReportEmail({ recipientName: "阿嬤", elderName: "阿嬤", forFamily: false, report });
    expect(html).toContain("給長輩的提醒");
    expect(html).toContain("1650");
  });
});

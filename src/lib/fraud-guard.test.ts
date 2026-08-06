import { describe, expect, it } from "vitest";
import {
  FRAUD_SENSITIVE_REMINDER,
  buildFraudRockAskPrompt,
  createFraudListItem,
} from "./fraud-guard";

describe("fraud-guard", () => {
  it("buildFraudRockAskPrompt 禁止投資建議與個資", () => {
    const p = buildFraudRockAskPrompt("保證獲利");
    expect(p).toContain("模擬訊息");
    expect(p).toContain("不要提供投資建議");
    expect(p).toContain("驗證碼");
  });

  it("createFraudListItem", () => {
    const item = createFraudListItem("blacklist", "假客服", "要求驗證", "掛斷回撥官網電話");
    expect(item.kind).toBe("blacklist");
    expect(item.title).toBe("假客服");
    expect(item.id).toContain("blacklist");
  });

  it("敏感資料提醒存在", () => {
    expect(FRAUD_SENSITIVE_REMINDER).toContain("密碼");
  });
});

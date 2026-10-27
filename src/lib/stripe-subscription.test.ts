import { describe, expect, it, vi } from "vitest";
import { decideProfileChange, isLiveStatus, planForPrice } from "./stripe-subscription";
import { syncSubscription } from "./stripe-subscription-server";

const env = { STRIPE_PRICE_BASIC: "price_basic", STRIPE_PRICE_PRO: "price_pro" };
const sub = (over: Partial<{ id: string; status: string; priceId: string | null; periodEnd: number | null }> = {}) => ({
  id: "sub_new", status: "active", priceId: "price_pro", periodEnd: 1_800_000_000, ...over,
});

describe("planForPrice", () => {
  it("認得的價格 → 方案；認不得 → null", () => {
    expect(planForPrice("price_pro", env)).toBe("pro");
    expect(planForPrice("price_basic", env)).toBe("basic");
    expect(planForPrice("price_other", env)).toBeNull();
    expect(planForPrice(null, env)).toBeNull();
  });
});

describe("decideProfileChange", () => {
  it("有效的訂閱 → 設成那個方案、記下訂閱、到期日＝這一期結束", () => {
    expect(decideProfileChange(sub(), null, env)).toEqual({
      kind: "set", tier: "pro", subscriptionId: "sub_new", expiresAt: new Date(1_800_000_000 * 1000).toISOString(),
    });
  });
  it("扣款失敗（past_due）Stripe 還在重試 → 先不降級", () => {
    expect(decideProfileChange(sub({ status: "past_due" }), "sub_new", env)).toMatchObject({ kind: "set", tier: "pro" });
    expect(isLiveStatus("past_due")).toBe(true);
  });
  it("現在綁的那一份取消、欠款停用 → 降回免費", () => {
    for (const status of ["canceled", "unpaid", "incomplete_expired", "paused"]) {
      expect(decideProfileChange(sub({ status }), "sub_new", env)).toEqual({ kind: "set", tier: "free", subscriptionId: null, expiresAt: null });
    }
  });
  it("換方案時舊的那份被取消 → 不動（不會把正在付錢的人打回免費）", () => {
    expect(decideProfileChange(sub({ id: "sub_old", status: "canceled" }), "sub_new", env).kind).toBe("none");
  });
  it("後台手動給的方案（沒有綁訂閱）不會被不相干的取消事件降級", () => {
    expect(decideProfileChange(sub({ status: "canceled" }), null, env).kind).toBe("none");
  });
  it("第一次付款還沒完成（incomplete）、認不得的價格 → 不動", () => {
    expect(decideProfileChange(sub({ status: "incomplete" }), null, env).kind).toBe("none");
    expect(decideProfileChange(sub({ priceId: "price_other" }), null, env).kind).toBe("none");
  });
});

describe("syncSubscription", () => {
  const stripeWith = (s: object) => ({
    subscriptions: { retrieve: vi.fn().mockResolvedValue(s) },
    checkout: { sessions: { list: vi.fn().mockResolvedValue({ data: [] }) } },
  });
  const adminWith = (profile: object | null, updateError: object | null = null) => {
    const update = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: updateError }) });
    const select = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data: profile, error: null }),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    });
    return { client: { from: vi.fn().mockReturnValue({ select, update }) }, update };
  };
  const stripeSub = {
    id: "sub_new", status: "active", customer: "cus_1", metadata: { user_id: "u1" },
    items: { data: [{ price: { id: "price_pro" }, current_period_end: 1_800_000_000 }] },
  };

  it("讀 Stripe 最新狀態，寫方案、訂閱、客戶", async () => {
    vi.stubEnv("STRIPE_PRICE_PRO", "price_pro");
    const { client, update } = adminWith({ stripe_subscription_id: null });
    const r = await syncSubscription(stripeWith(stripeSub) as never, client as never, "sub_new");
    expect(r).toEqual({ userId: "u1", change: "tier=pro" });
    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      subscription_tier: "pro", stripe_subscription_id: "sub_new", stripe_customer_id: "cus_1",
    }));
    vi.unstubAllEnvs();
  });

  it("寫資料庫失敗要丟錯（webhook 回 500，Stripe 會重送）", async () => {
    vi.stubEnv("STRIPE_PRICE_PRO", "price_pro");
    const { client } = adminWith({ stripe_subscription_id: null }, { message: "column does not exist" });
    await expect(syncSubscription(stripeWith(stripeSub) as never, client as never, "sub_new")).rejects.toThrow(/update profile/);
    vi.unstubAllEnvs();
  });
});

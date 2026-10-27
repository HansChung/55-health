import { describe, expect, it } from "vitest";
import { checkInvite, generateInviteCode, normalizeInviteCode } from "./family-invite";

describe("generateInviteCode", () => {
  it("8 位數、中間一條橫線", () => {
    for (let i = 0; i < 50; i++) expect(generateInviteCode()).toMatch(/^\d{4}-\d{4}$/);
  });
});

describe("normalizeInviteCode", () => {
  it("新的 8 位數：有沒有橫線、空白、全形都可以", () => {
    expect(normalizeInviteCode("1234-5678")).toBe("1234-5678");
    expect(normalizeInviteCode("12345678")).toBe("1234-5678");
    expect(normalizeInviteCode(" 1234 5678 ")).toBe("1234-5678");
    expect(normalizeInviteCode("１２３４５６７８")).toBe("1234-5678");
  });
  it("之前發出去的 6 位數也收", () => {
    expect(normalizeInviteCode("123-456")).toBe("123-456");
    expect(normalizeInviteCode("123456")).toBe("123-456");
  });
  it("位數不對回 null", () => {
    expect(normalizeInviteCode("12345")).toBeNull();
    expect(normalizeInviteCode("123456789")).toBeNull();
    expect(normalizeInviteCode("abcd")).toBeNull();
  });
});

describe("checkInvite", () => {
  const now = new Date("2026-10-27T03:00:00Z");
  const link = { owner_id: "elder", status: "pending", family_user_id: null, invite_expires_at: "2026-10-28T00:00:00Z" };
  it("還有效、別人的碼 → 可以", () => {
    expect(checkInvite(link, "daughter", now)).toEqual({ ok: true });
  });
  it("自己的碼不能自己接受", () => {
    expect(checkInvite(link, "elder", now)).toMatchObject({ ok: false, status: 400 });
  });
  it("用過的、過期的不行", () => {
    expect(checkInvite({ ...link, status: "accepted", family_user_id: "son" }, "daughter", now)).toMatchObject({ ok: false, status: 409 });
    expect(checkInvite({ ...link, family_user_id: "son" }, "daughter", now)).toMatchObject({ ok: false, status: 409 });
    expect(checkInvite({ ...link, invite_expires_at: "2026-10-27T02:59:59Z" }, "daughter", now)).toMatchObject({ ok: false, status: 410 });
  });
});

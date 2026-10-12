import { describe, it, expect } from "vitest";
import {
  buildLineAuthorizeUrl,
  isPlaceholderEmail,
  lineConfig,
  lineErrorMessage,
  lineMode,
  placeholderEmail,
  safeNext,
} from "./line-login";

describe("LINE 登入：設定", () => {
  it("沒設 Channel ID／Secret 就是還沒開", () => {
    expect(lineConfig({})).toBeNull();
    expect(lineConfig({ LINE_LOGIN_CHANNEL_ID: "123" })).toBeNull();
    const cfg = lineConfig({ LINE_LOGIN_CHANNEL_ID: " 123 ", LINE_LOGIN_CHANNEL_SECRET: "s" });
    expect(cfg).toMatchObject({ channelId: "123", channelSecret: "s", requestEmail: false, accessBase: "https://access.line.me", apiBase: "https://api.line.me" });
  });
  it("同意畫面網址：申請到 Email 權限才要 email", () => {
    const base = { LINE_LOGIN_CHANNEL_ID: "123", LINE_LOGIN_CHANNEL_SECRET: "s" };
    const opts = { redirectUri: "https://nuan55.com/api/auth/line/callback", state: "st", nonce: "no" };
    const u = new URL(buildLineAuthorizeUrl(lineConfig(base)!, opts));
    expect(u.origin + u.pathname).toBe("https://access.line.me/oauth2/v2.1/authorize");
    expect(Object.fromEntries(u.searchParams)).toMatchObject({
      response_type: "code", client_id: "123", redirect_uri: opts.redirectUri, state: "st", nonce: "no", scope: "openid profile",
    });
    const withEmail = new URL(buildLineAuthorizeUrl(lineConfig({ ...base, LINE_LOGIN_REQUEST_EMAIL: "1" })!, opts));
    expect(withEmail.searchParams.get("scope")).toBe("openid profile email");
  });
});

describe("LINE 登入：安全", () => {
  it("登入後只回站內路徑", () => {
    expect(safeNext("/?open=stories")).toBe("/?open=stories");
    expect(safeNext("https://evil.example")).toBe("/");
    expect(safeNext("//evil.example")).toBe("/");
    expect(safeNext("/\\evil.example")).toBe("/");
    expect(safeNext(undefined)).toBe("/");
    expect(lineMode("link")).toBe("link");
    expect(lineMode("admin")).toBe("login");
  });
  it("沒有 Email 的 LINE 帳號用假地址（不寄信）", () => {
    const e = placeholderEmail("U4af4980629abc");
    expect(e).toBe("line-u4af4980629abc@line-login.invalid");
    expect(isPlaceholderEmail(e)).toBe(true);
    expect(isPlaceholderEmail("someone@gmail.com")).toBe(false);
    expect(isPlaceholderEmail(null)).toBe(false);
  });
  it("錯誤代碼 → 給長輩看的話；不認得的代碼不顯示", () => {
    expect(lineErrorMessage("email_exists")).toContain("先用 Email 登入");
    expect(lineErrorMessage("taken")).toContain("另一個暖暖帳號");
    expect(lineErrorMessage("<script>")).toBeNull();
  });
});

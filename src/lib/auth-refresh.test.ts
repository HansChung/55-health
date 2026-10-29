import { describe, it, expect } from "vitest";
import { sessionNeedsEarlyRefresh } from "./auth-refresh";

const NOW = Date.UTC(2026, 9, 29, 4, 0, 0);
const at = (secondsLeft: number) => Math.floor(NOW / 1000) + secondsLeft;

describe("sessionNeedsEarlyRefresh", () => {
  it("一小時的憑證：剩 10 分鐘以上不換", () => {
    expect(sessionNeedsEarlyRefresh({ expires_at: at(3600), expires_in: 3600 }, NOW)).toBe(false);
    expect(sessionNeedsEarlyRefresh({ expires_at: at(601), expires_in: 3600 }, NOW)).toBe(false);
  });

  it("剩不到 10 分鐘就換（遠早於伺服器會去換的 90 秒）", () => {
    expect(sessionNeedsEarlyRefresh({ expires_at: at(599), expires_in: 3600 }, NOW)).toBe(true);
    expect(sessionNeedsEarlyRefresh({ expires_at: at(90), expires_in: 3600 }, NOW)).toBe(true);
  });

  it("已經過期也換", () => {
    expect(sessionNeedsEarlyRefresh({ expires_at: at(-30), expires_in: 3600 }, NOW)).toBe(true);
  });

  it("短效憑證用一半壽命，不會一直換", () => {
    expect(sessionNeedsEarlyRefresh({ expires_at: at(200), expires_in: 300 }, NOW)).toBe(false);
    expect(sessionNeedsEarlyRefresh({ expires_at: at(149), expires_in: 300 }, NOW)).toBe(true);
  });

  it("沒有到期時間就不動；沒有壽命當一小時", () => {
    expect(sessionNeedsEarlyRefresh({}, NOW)).toBe(false);
    expect(sessionNeedsEarlyRefresh({ expires_at: at(500) }, NOW)).toBe(true);
    expect(sessionNeedsEarlyRefresh({ expires_at: at(700) }, NOW)).toBe(false);
  });
});

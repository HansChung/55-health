import { describe, it, expect, vi, afterEach } from "vitest";
import { countyForecast, tourForecasts } from "./weather-server";
import { tourDayLabel } from "./study-tours";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("tourDayLabel（台灣日期）", () => {
  const now = new Date("2026-09-30T15:30:00Z"); // 台灣 9/30 23:30
  it("今天、明天、後天、昨天，其他顯示日期", () => {
    expect(tourDayLabel("2026-09-30T15:00:00Z", now)).toBe("今天"); // 9/30 23:00
    expect(tourDayLabel("2026-10-01T01:00:00Z", now)).toBe("明天"); // 10/1 09:00
    expect(tourDayLabel("2026-10-01T16:30:00Z", now)).toBe("後天"); // 10/2 00:30
    expect(tourDayLabel("2026-09-29T15:30:00Z", now)).toBe("昨天"); // 9/29 23:30
    expect(tourDayLabel("2026-10-05T01:00:00Z", now)).toBe("10/5");
  });
});

describe("天氣查詢不會拖垮行前提醒", () => {
  const tour = (id: string, title: string) => ({ id, title, meeting_point: "", starts_at: "2026-10-01T01:00:00Z" });

  it("氣象署一直沒回應：整體只等 budget，沒查到的當作沒天氣", async () => {
    vi.stubEnv("CWA_API_KEY", "test");
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));
    const started = Date.now();
    const result = await tourForecasts([tour("a", "彰化一日遊"), tour("b", "花蓮一日遊")], 50);
    expect(Date.now() - started).toBeLessThan(1000);
    expect(result.get("a")).toBeUndefined();
    expect(result.get("b")).toBeUndefined();
  });

  it("查失敗會記住 5 分鐘，不會每一團都再打一次；同縣市同時只打一次", async () => {
    vi.stubEnv("CWA_API_KEY", "test");
    const fetchMock = vi.fn(async () => new Response("nope", { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);
    const [a, b] = await Promise.all([countyForecast("南投縣"), countyForecast("南投縣")]);
    expect(a).toBeNull();
    expect(b).toBeNull();
    expect(await countyForecast("南投縣")).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("沒設金鑰就不查", async () => {
    vi.stubEnv("CWA_API_KEY", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(await countyForecast("臺東縣")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

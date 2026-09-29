import { describe, it, expect } from "vitest";
import { isPastDeadline } from "./travel-video-server";

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

describe("isPastDeadline", () => {
  it("2 小時才放棄（平台影片常見 5～60 分鐘）", () => {
    expect(isPastDeadline({ created_at: minutesAgo(90) })).toBe(false);
    expect(isPastDeadline({ created_at: minutesAgo(121) })).toBe(true);
  });

  it("沒記到 task_id 的也等滿 2 小時：回呼要等影片做好才來，太早放棄會丟掉已付費的影片", () => {
    // 90 分鐘時回呼可能還沒到，仍要保留
    expect(isPastDeadline({ created_at: minutesAgo(90) })).toBe(false);
  });
});

import { describe, it, expect } from "vitest";
import { isPastDeadline } from "./travel-video-server";

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

describe("isPastDeadline", () => {
  it("有 task_id：2 小時才放棄（平台影片常見 5～60 分鐘）", () => {
    expect(isPastDeadline({ task_id: "1", created_at: minutesAgo(90) })).toBe(false);
    expect(isPastDeadline({ task_id: "1", created_at: minutesAgo(121) })).toBe(true);
  });

  it("沒記到 task_id：1 小時沒補回就放棄，別讓長輩一直不能做下一支", () => {
    expect(isPastDeadline({ task_id: null, created_at: minutesAgo(30) })).toBe(false);
    expect(isPastDeadline({ task_id: null, created_at: minutesAgo(61) })).toBe(true);
  });
});

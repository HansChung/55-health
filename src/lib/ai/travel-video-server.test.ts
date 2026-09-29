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

import { NARRATION_PREVIEW_TTL_MS, rawVideoStoragePath, selectStaleNarrationPaths } from "./travel-video-server";

describe("selectStaleNarrationPaths", () => {
  const now = Date.parse("2026-09-29T12:00:00Z");
  const ago = (ms: number) => new Date(now - ms).toISOString();
  const folder = "u1/narrations";
  const files = [
    { name: "old-unused.wav", created_at: ago(NARRATION_PREVIEW_TTL_MS + 60_000) },
    { name: "old-attached.wav", created_at: ago(NARRATION_PREVIEW_TTL_MS + 60_000) },
    { name: "fresh.wav", created_at: ago(5 * 60_000) },
    { name: "no-date.wav", created_at: null },
  ];

  it("只挑超過 1 小時、而且沒被影片用到的試聽檔", () => {
    expect(selectStaleNarrationPaths(files, folder, new Set(["u1/narrations/old-attached.wav"]), now)).toEqual([
      "u1/narrations/old-unused.wav",
    ]);
  });

  it("剛試聽完的不刪（長輩可能正要送出）", () => {
    expect(selectStaleNarrationPaths(files, folder, new Set(), now)).not.toContain("u1/narrations/fresh.wav");
  });
});

describe("rawVideoStoragePath", () => {
  it("放在影片自己的資料夾", () => {
    expect(rawVideoStoragePath({ user_id: "u1", id: "v1" })).toBe("u1/v1/raw.mp4");
  });
});

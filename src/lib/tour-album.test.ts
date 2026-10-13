import { describe, expect, it } from "vitest";
import { TOUR_ALBUM_CLOSE_AFTER_DAYS, tourAlbumOpen, tourAlbumPhotoPath } from "./tour-album";
import { videoShareMeta } from "./travel-video";
import { newVideoPushForFamily } from "./video-comments";

describe("研學團相簿：什麼時候可以放照片", () => {
  const tour = { starts_at: "2026-10-20T01:00:00Z", ends_at: "2026-10-20T08:00:00Z" };
  it("出發前 3 小時開始、結束後 30 天截止", () => {
    expect(tourAlbumOpen(tour, Date.parse("2026-10-19T21:59:00Z"))).toBe(false);
    expect(tourAlbumOpen(tour, Date.parse("2026-10-19T22:00:00Z"))).toBe(true);
    expect(tourAlbumOpen(tour, Date.parse("2026-10-20T12:00:00Z"))).toBe(true);
    const close = Date.parse(tour.ends_at) + TOUR_ALBUM_CLOSE_AFTER_DAYS * 86_400_000;
    expect(tourAlbumOpen(tour, close)).toBe(true);
    expect(tourAlbumOpen(tour, close + 1)).toBe(false);
  });
  it("照片位置：團／人／照片", () => {
    expect(tourAlbumPhotoPath("t1", "u1", "p1")).toBe("t1/u1/p1.jpg");
  });
});

describe("研學團遊記影片的標題與通知", () => {
  it("分享標題", () => {
    expect(
      videoShareMeta({ kind: "tour", place: "太魯閣峽谷健行", narration_text: null, montage_lines: null, yearly: { year: 2026, title: "太魯閣峽谷健行" } }).title
    ).toBe("🧭 太魯閣峽谷健行・研學團遊記");
  });
  it("家人收到的通知", () => {
    expect(newVideoPushForFamily({ elderName: "王阿嬤", place: null, montage: false, tour: true }).title).toBe("🎬 王阿嬤做了一支研學團遊記影片");
  });
});

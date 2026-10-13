// ────────────────────────────────────────────────
// 研學團共享相簿（前後端共用）：同一團的參加者一起放照片，結束後一鍵做成全團遊記影片
// 看得到／可以放照片：這一團有效報名的本人，和幫他報名的家人；管理員都可以（也可以刪任何一張）
// ────────────────────────────────────────────────

export const TOUR_ALBUM_BUCKET = "study-tour-photos";
/** 每人每團最多放幾張 */
export const TOUR_ALBUM_PER_USER = 30;
/** 一次最多選幾張上傳 */
export const TOUR_ALBUM_BATCH = 5;
/** 出發前幾小時開始可以放（和集章一樣） */
export const TOUR_ALBUM_OPEN_BEFORE_MS = 3 * 3600_000;
/** 結束後幾天內還可以放 */
export const TOUR_ALBUM_CLOSE_AFTER_DAYS = 30;

export interface TourAlbumPhoto {
  id: string;
  url: string;
  width: number;
  height: number;
  /** 誰放的（報名時填的名字，或個人資料的稱呼） */
  uploader: string;
  mine: boolean;
  /** 可以刪：自己的，或管理員 */
  can_delete: boolean;
  created_at: string;
}

export interface TourAlbumView {
  photos: TourAlbumPhoto[];
  /** 現在可以放照片嗎（出發前 3 小時～結束後 30 天） */
  can_upload: boolean;
  /** 自己還可以放幾張 */
  my_remaining: number;
}

/** 相簿什麼時候開放上傳 */
export function tourAlbumOpen(tour: { starts_at: string; ends_at: string }, now = Date.now()): boolean {
  const start = new Date(tour.starts_at).getTime() - TOUR_ALBUM_OPEN_BEFORE_MS;
  const end = new Date(tour.ends_at).getTime() + TOUR_ALBUM_CLOSE_AFTER_DAYS * 86_400_000;
  return now >= start && now <= end;
}

export function tourAlbumPhotoPath(tourId: string, userId: string, id: string, ext = "jpg"): string {
  return `${tourId}/${userId}/${id}.${ext}`;
}

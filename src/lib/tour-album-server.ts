// ────────────────────────────────────────────────
// 研學團共享相簿（只在 API route 用；service role）
// 誰看得到：這一團有效報名（confirmed，含現場補登記）的本人、幫他報名的家人；管理員都可以
// 照片：瀏覽器直傳 user-uploads 暫存區 → 這裡在 Supabase 裡複製到私人 bucket study-tour-photos
// ────────────────────────────────────────────────

import { createSupabaseAdmin } from "@/lib/supabase/server";
import { copyUserUpload } from "@/lib/ai/user-uploads-server";
import { isAdminEmail } from "@/lib/plan-access-server";
import type { YearlySource } from "@/lib/ai/travel-yearly-server";
import {
  TOUR_ALBUM_BUCKET,
  TOUR_ALBUM_PER_USER,
  tourAlbumOpen,
  tourAlbumPhotoPath,
  type TourAlbumPhoto,
  type TourAlbumView,
} from "@/lib/tour-album";
import { sanitizeYearlyCaption } from "@/lib/travel-yearly";

type Admin = ReturnType<typeof createSupabaseAdmin>;

/** 網址 1 小時有效（畫面每次載入重新簽） */
const SIGNED_URL_SECONDS = 3600;

export interface AlbumTour {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  status: string;
}

export interface AlbumAccess {
  tour: AlbumTour;
  isAdmin: boolean;
}

interface PhotoRow {
  id: string;
  tour_id: string;
  user_id: string;
  path: string;
  width: number;
  height: number;
  created_at: string;
}

/** 這個人可以看這一團的相簿嗎；不行回 null（不說是哪個原因，免得探出有哪些團） */
export async function loadAlbumAccess(admin: Admin, tourId: string, userId: string, email?: string | null): Promise<AlbumAccess | null> {
  const { data: tour } = await admin
    .from("study_tours")
    .select("id, title, starts_at, ends_at, status")
    .eq("id", tourId)
    .maybeSingle();
  if (!tour || (tour as AlbumTour).status === "draft") return null;
  const { data: profile } = await admin.from("profiles").select("is_admin").eq("id", userId).maybeSingle();
  if ((profile as { is_admin: boolean | null } | null)?.is_admin || isAdminEmail(email)) {
    return { tour: tour as AlbumTour, isAdmin: true };
  }
  const { data: regs } = await admin
    .from("study_tour_registrations")
    .select("id")
    .eq("tour_id", tourId)
    .eq("status", "confirmed")
    .or(`user_id.eq.${userId},registered_by.eq.${userId}`)
    .limit(1);
  return (regs ?? []).length > 0 ? { tour: tour as AlbumTour, isAdmin: false } : null;
}

/** 一團的全部照片（分頁讀，不會因為人多照片多就漏掉後面的） */
const PAGE = 1000;
async function loadPhotos(admin: Admin, tourId: string): Promise<PhotoRow[]> {
  const all: PhotoRow[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await admin
      .from("study_tour_photos")
      .select("id, tour_id, user_id, path, width, height, created_at")
      .eq("tour_id", tourId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`load tour photos failed (add-study-tour-album.sql 跑了嗎？): ${error.message}`);
    const rows = (data ?? []) as PhotoRow[];
    all.push(...rows);
    if (rows.length < PAGE) return all;
  }
}

/** 自己在這一團放了幾張（和上傳時的上限用同一個算法） */
async function countMine(admin: Admin, tourId: string, userId: string): Promise<number> {
  const { count, error } = await admin
    .from("study_tour_photos")
    .select("id", { count: "exact", head: true })
    .eq("tour_id", tourId)
    .eq("user_id", userId)
    .is("deleted_at", null);
  if (error) throw new Error(`count my tour photos failed: ${error.message}`);
  return count ?? 0;
}

/** 誰放的：這一團報名時填的名字，沒有就用個人資料的稱呼 */
async function uploaderNames(admin: Admin, tourId: string, userIds: string[]): Promise<Map<string, string>> {
  const names = new Map<string, string>();
  if (userIds.length === 0) return names;
  const [{ data: regs }, { data: profiles }] = await Promise.all([
    admin.from("study_tour_registrations").select("user_id, participant_name").eq("tour_id", tourId).neq("status", "cancelled").in("user_id", userIds),
    admin.from("profiles").select("id, display_name").in("id", userIds),
  ]);
  for (const p of (profiles ?? []) as { id: string; display_name: string | null }[]) {
    if (p.display_name?.trim()) names.set(p.id, p.display_name.trim());
  }
  for (const r of (regs ?? []) as { user_id: string; participant_name: string | null }[]) {
    if (r.participant_name?.trim()) names.set(r.user_id, r.participant_name.trim());
  }
  return names;
}

async function signPaths(admin: Admin, paths: string[]): Promise<Map<string, string>> {
  const urls = new Map<string, string>();
  // 一次簽一批（照片很多時也不會一個請求塞太多）
  for (let i = 0; i < paths.length; i += 200) {
    const { data, error } = await admin.storage.from(TOUR_ALBUM_BUCKET).createSignedUrls(paths.slice(i, i + 200), SIGNED_URL_SECONDS);
    if (error) console.warn("[tour-album] sign failed:", error.message);
    for (const d of (data ?? []) as { path: string | null; signedUrl: string }[]) if (d.path && d.signedUrl) urls.set(d.path, d.signedUrl);
  }
  return urls;
}

export async function loadAlbumView(admin: Admin, access: AlbumAccess, userId: string): Promise<TourAlbumView> {
  const [rows, mine] = await Promise.all([loadPhotos(admin, access.tour.id), countMine(admin, access.tour.id, userId)]);
  const [names, urls] = await Promise.all([
    uploaderNames(admin, access.tour.id, [...new Set(rows.map((r) => r.user_id))]),
    signPaths(admin, rows.map((r) => r.path)),
  ]);
  const photos: TourAlbumPhoto[] = rows
    .filter((r) => urls.has(r.path))
    .map((r) => ({
      id: r.id,
      url: urls.get(r.path)!,
      width: r.width,
      height: r.height,
      uploader: names.get(r.user_id) ?? "團員",
      mine: r.user_id === userId,
      can_delete: r.user_id === userId || access.isAdmin,
      created_at: r.created_at,
    }));
  return {
    photos,
    can_upload: access.isAdmin || (access.tour.status === "published" && tourAlbumOpen(access.tour)),
    my_remaining: access.isAdmin ? 999 : Math.max(0, TOUR_ALBUM_PER_USER - mine),
  };
}

export class AlbumError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

/**
 * 放一張照片：先記一筆再數（同時放好幾張也不會超過每人上限），超過就刪掉那一筆；
 * 然後把暫存照片複製過來（複製失敗也刪掉那一筆）
 */
export async function addAlbumPhoto(
  admin: Admin,
  access: AlbumAccess,
  userId: string,
  photo: { photoPath: string; width: number; height: number }
): Promise<void> {
  if (!access.isAdmin && !(access.tour.status === "published" && tourAlbumOpen(access.tour))) {
    throw new AlbumError("相簿只在出發當天到結束後 30 天可以放照片", 403);
  }
  const id = crypto.randomUUID();
  const path = tourAlbumPhotoPath(access.tour.id, userId, id);
  const { error: insErr } = await admin.from("study_tour_photos").insert({
    id,
    tour_id: access.tour.id,
    user_id: userId,
    path,
    width: Math.max(0, Math.round(photo.width)),
    height: Math.max(0, Math.round(photo.height)),
  });
  if (insErr) throw new Error(`insert tour photo failed: ${insErr.message}`);
  const drop = () => admin.from("study_tour_photos").delete().eq("id", id).then(() => undefined);
  if (!access.isAdmin) {
    const { data: kept, error } = await admin
      .from("study_tour_photos")
      .select("id")
      .eq("tour_id", access.tour.id)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .limit(TOUR_ALBUM_PER_USER);
    if (error) {
      await drop();
      throw new Error(`count tour photos failed: ${error.message}`);
    }
    if (!((kept ?? []) as { id: string }[]).some((r) => r.id === id)) {
      await drop();
      throw new AlbumError(`每個人在這一團最多放 ${TOUR_ALBUM_PER_USER} 張`, 429);
    }
  }
  try {
    await copyUserUpload(admin, userId, photo.photoPath, TOUR_ALBUM_BUCKET, path);
  } catch (e) {
    await drop();
    throw e;
  }
}

/** 刪一張：自己的，或管理員；先軟刪除再刪檔案，檔案刪不掉就把那一列還原、回報失敗（使用者可以再刪一次） */
export async function deleteAlbumPhoto(admin: Admin, access: AlbumAccess, userId: string, photoId: string): Promise<boolean> {
  let q = admin
    .from("study_tour_photos")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", photoId)
    .eq("tour_id", access.tour.id)
    .is("deleted_at", null);
  if (!access.isAdmin) q = q.eq("user_id", userId);
  const { data, error } = await q.select("path");
  if (error) throw new Error(`delete tour photo failed: ${error.message}`);
  const row = ((data ?? []) as { path: string }[])[0];
  if (!row) return false;
  const { error: rmErr } = await admin.storage.from(TOUR_ALBUM_BUCKET).remove([row.path]);
  if (rmErr) {
    await admin.from("study_tour_photos").update({ deleted_at: null }).eq("id", photoId);
    throw new Error(`remove tour photo file failed (row restored): ${rmErr.message}`);
  }
  return true;
}

/** 做全團遊記用：相簿每張照片變成候選（key = album:<id>，字幕預設「○○拍的」） */
export async function albumSources(admin: Admin, access: AlbumAccess): Promise<YearlySource[]> {
  const rows = await loadPhotos(admin, access.tour.id);
  const [names, urls] = await Promise.all([
    uploaderNames(admin, access.tour.id, [...new Set(rows.map((r) => r.user_id))]),
    signPaths(admin, rows.map((r) => r.path)),
  ]);
  return rows
    .filter((r) => urls.has(r.path))
    .map((r) => ({
      key: `album:${r.id}`,
      bucket: TOUR_ALBUM_BUCKET,
      path: r.path,
      url: urls.get(r.path)!,
      width: r.width || null,
      height: r.height || null,
      caption: sanitizeYearlyCaption(`${names.get(r.user_id) ?? "團員"}拍的`),
      date: r.created_at,
      source: "trip" as const,
    }));
}

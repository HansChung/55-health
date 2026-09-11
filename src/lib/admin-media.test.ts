import { describe, it, expect, vi } from "vitest";
import {
  sniffImageType,
  buildMediaPath,
  uploadAdminImage,
  isUploadFolder,
  MAX_UPLOAD_BYTES,
  ADMIN_MEDIA_BUCKET,
  type StorageLike,
} from "./admin-media";

const bytes = (...b: number[]) => new Uint8Array([...b, ...new Array(16).fill(0)]);
const JPEG = bytes(0xff, 0xd8, 0xff, 0xe0);
const PNG = bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
const GIF = bytes(0x47, 0x49, 0x46, 0x38, 0x39, 0x61);
const WEBP = bytes(0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50);
const SVG = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
const HTML = new TextEncoder().encode("<html><script>alert(1)</script></html>");

describe("sniffImageType — 看真實內容判斷格式", () => {
  it("認得 JPEG／PNG／GIF／WebP", () => {
    expect(sniffImageType(JPEG)).toBe("image/jpeg");
    expect(sniffImageType(PNG)).toBe("image/png");
    expect(sniffImageType(GIF)).toBe("image/gif");
    expect(sniffImageType(WEBP)).toBe("image/webp");
  });

  it("SVG、HTML 一律拒絕（就算檔名取成 .jpg 也沒用）", () => {
    expect(sniffImageType(SVG)).toBeNull();
    expect(sniffImageType(HTML)).toBeNull();
  });

  it("太短的資料不誤判", () => {
    expect(sniffImageType(new Uint8Array([0xff, 0xd8]))).toBeNull();
    expect(sniffImageType(new Uint8Array([]))).toBeNull();
  });
});

describe("buildMediaPath", () => {
  it("路徑依資料夾／年月整理，副檔名跟真實格式走", () => {
    const at = Date.UTC(2026, 8, 11);
    expect(buildMediaPath("campaigns", "image/png", at, "abc123")).toBe(`campaigns/2026/09/${at}-abc123.png`);
  });

  it("隨機字串只保留英數，避免奇怪字元進路徑", () => {
    expect(buildMediaPath("campaigns", "image/jpeg", 1, "../x")).toBe("campaigns/1970/01/1-x.jpg");
  });
});

describe("isUploadFolder", () => {
  it("只允許白名單資料夾", () => {
    expect(isUploadFolder("campaigns")).toBe(true);
    expect(isUploadFolder("../etc")).toBe(false);
    expect(isUploadFolder(null)).toBe(false);
  });
});

function fakeStorage(opts: { bucketMissing?: boolean; uploadFails?: boolean } = {}) {
  let bucketExists = !opts.bucketMissing;
  const uploads: { bucket: string; path: string; contentType: string }[] = [];
  const createBucket = vi.fn(async () => {
    bucketExists = true;
    return { error: null };
  });
  const client: StorageLike = {
    storage: {
      createBucket,
      from: (bucket: string) => ({
        upload: async (path, _body, o) => {
          if (!bucketExists) return { error: { message: "Bucket not found" } };
          if (opts.uploadFails) return { error: { message: "boom" } };
          uploads.push({ bucket, path, contentType: o.contentType });
          return { error: null };
        },
        getPublicUrl: (path) => ({ data: { publicUrl: `https://cdn.test/${bucket}/${path}` } }),
      }),
    },
  };
  return { client, uploads, createBucket };
}

describe("uploadAdminImage", () => {
  it("上傳成功回傳公開網址，contentType 用真實格式", async () => {
    const { client, uploads } = fakeStorage();
    const r = await uploadAdminImage(client, PNG, "campaigns");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.url).toMatch(new RegExp(`^https://cdn.test/${ADMIN_MEDIA_BUCKET}/campaigns/.+\\.png$`));
    expect(uploads[0].contentType).toBe("image/png");
  });

  it("第一次上傳時 bucket 不存在 → 自動建立（公開、只收圖片）再重試", async () => {
    const { client, uploads, createBucket } = fakeStorage({ bucketMissing: true });
    const r = await uploadAdminImage(client, JPEG, "campaigns");
    expect(r.ok).toBe(true);
    expect(createBucket).toHaveBeenCalledTimes(1);
    const [id, cfg] = createBucket.mock.calls[0] as unknown as [string, { public: boolean; allowedMimeTypes: string[] }];
    expect(id).toBe(ADMIN_MEDIA_BUCKET);
    expect(cfg.public).toBe(true);
    expect(cfg.allowedMimeTypes).not.toContain("image/svg+xml");
    expect(uploads).toHaveLength(1);
  });

  it("不是圖片 → 415，不會上傳", async () => {
    const { client, uploads } = fakeStorage();
    const r = await uploadAdminImage(client, SVG, "campaigns");
    expect(r).toMatchObject({ ok: false, status: 415 });
    expect(uploads).toHaveLength(0);
  });

  it("超過大小上限 → 413", async () => {
    const { client } = fakeStorage();
    const big = new Uint8Array(MAX_UPLOAD_BYTES + 1);
    big.set([0xff, 0xd8, 0xff]);
    expect(await uploadAdminImage(client, big, "campaigns")).toMatchObject({ ok: false, status: 413 });
  });

  it("空檔案 → 400", async () => {
    const { client } = fakeStorage();
    expect(await uploadAdminImage(client, new Uint8Array(), "campaigns")).toMatchObject({ ok: false, status: 400 });
  });

  it("儲存服務出錯 → 500，訊息不外洩內部細節", async () => {
    const { client } = fakeStorage({ uploadFails: true });
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const r = await uploadAdminImage(client, JPEG, "campaigns");
    expect(r).toMatchObject({ ok: false, status: 500 });
    if (!r.ok) expect(r.error).not.toContain("boom");
    spy.mockRestore();
  });
});

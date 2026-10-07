import { describe, it, expect } from "vitest";
import { isOwnUploadPath, userUploadPath } from "./user-uploads";

const ME = "fdfa0297-542a-47e0-a471-b5a5bc4a75d2";
const OTHER = "0ace030a-d6eb-4fa9-8d5f-132364456511";
const FILE = "3f2c8e1a-5b6d-4c7e-9f80-1a2b3c4d5e6f";

describe("照片直傳：暫存區路徑", () => {
  it("只認自己資料夾、隨機檔名、jpg／png／webp", () => {
    expect(isOwnUploadPath(`${ME}/${FILE}.jpg`, ME)).toBe(true);
    expect(isOwnUploadPath(`${ME}/${FILE}.webp`, ME)).toBe(true);
    expect(isOwnUploadPath(`${OTHER}/${FILE}.jpg`, ME)).toBe(false);
    expect(isOwnUploadPath(`${ME}/../${OTHER}/${FILE}.jpg`, ME)).toBe(false);
    expect(isOwnUploadPath(`${ME}/${FILE}.gif`, ME)).toBe(false);
    expect(isOwnUploadPath(`${ME}/photo.jpg`, ME)).toBe(false);
    expect(isOwnUploadPath(undefined, ME)).toBe(false);
  });
  it("檔名照格式給副檔名", () => {
    expect(userUploadPath(ME, FILE, "image/jpeg")).toBe(`${ME}/${FILE}.jpg`);
    expect(userUploadPath(ME, FILE, "image/png")).toBe(`${ME}/${FILE}.png`);
    expect(userUploadPath(ME, FILE, "image/webp")).toBe(`${ME}/${FILE}.webp`);
  });
});

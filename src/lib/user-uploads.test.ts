import { describe, it, expect } from "vitest";
import { audioUploadType, isOwnUploadPath, userUploadPath } from "./user-uploads";

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

describe("錄音直傳：格式與路徑", () => {
  it("MediaRecorder 的格式（帶 codecs）換成暫存區接受的格式", () => {
    expect(audioUploadType("audio/webm;codecs=opus")).toEqual({ contentType: "audio/webm", ext: "webm" });
    expect(audioUploadType("audio/mp4")).toEqual({ contentType: "audio/mp4", ext: "m4a" });
    expect(audioUploadType("audio/ogg; codecs=opus")).toEqual({ contentType: "audio/ogg", ext: "ogg" });
    expect(audioUploadType("video/webm")).toBeNull();
    expect(audioUploadType("")).toBeNull();
  });
  it("錄音路徑和照片路徑分開認", () => {
    expect(isOwnUploadPath(`${ME}/${FILE}.webm`, ME, "audio")).toBe(true);
    expect(isOwnUploadPath(`${ME}/${FILE}.m4a`, ME, "audio")).toBe(true);
    expect(isOwnUploadPath(`${ME}/${FILE}.webm`, ME)).toBe(false);
    expect(isOwnUploadPath(`${ME}/${FILE}.jpg`, ME, "audio")).toBe(false);
    expect(isOwnUploadPath(`${OTHER}/${FILE}.webm`, ME, "audio")).toBe(false);
  });
});

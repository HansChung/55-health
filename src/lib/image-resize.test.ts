import { describe, it, expect } from "vitest";
import { fitWithin } from "./image-resize";

describe("fitWithin — 上傳前縮圖尺寸", () => {
  it("手機直拍大圖縮到長邊 1600，保持比例", () => {
    expect(fitWithin(3024, 4032)).toEqual({ width: 1200, height: 1600 });
  });
  it("橫式也一樣", () => {
    expect(fitWithin(4000, 2250)).toEqual({ width: 1600, height: 900 });
  });
  it("本來就小的圖不放大", () => {
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 });
  });
});

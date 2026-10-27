import { describe, expect, it } from "vitest";
import {
  GREETING_OCCASIONS,
  defaultGreetingLine,
  greetingClosing,
  greetingOccasion,
  greetingSeconds,
  greetingSegments,
  greetingTitle,
  sanitizeGreetingName,
} from "./greeting-video";

describe("greeting video", () => {
  it("titles per occasion, with and without a name", () => {
    expect(greetingTitle("birthday", "小美")).toBe("祝小美 生日快樂");
    expect(greetingTitle("birthday", "")).toBe("生日快樂");
    expect(greetingTitle("new_year", "大家")).toBe("大家 新年快樂");
    expect(greetingTitle("thanks", "醫生")).toBe("謝謝醫生");
    expect(greetingTitle("nope" as never, "小明")).toBe("給小明");
  });
  it("names drop emoji/quotes and are capped", () => {
    expect(sanitizeGreetingName("「小美」🎂")).toBe("小美");
    expect([...sanitizeGreetingName("一二三四五六七八九十")].length).toBe(8);
  });
  it("closing line only when there is a sender", () => {
    expect(greetingClosing("阿嬤")).toBe("愛你的 阿嬤");
    expect(greetingClosing("  ")).toBe("");
  });
  it("default lines rotate", () => {
    const lines = greetingOccasion("birthday").lines;
    expect(defaultGreetingLine("birthday", 0)).toBe(lines[0]);
    expect(defaultGreetingLine("birthday", lines.length)).toBe(lines[0]);
  });
  it("segments: title, one per photo, closing on the last photo", () => {
    const segs = greetingSegments("生日快樂", ["a", "b"], "愛你的 阿嬤");
    expect(segs.map((s) => [s.photo, s.line, s.seconds])).toEqual([[0, "生日快樂", 4], [0, "a", 5], [1, "b", 5], [1, "愛你的 阿嬤", 4]]);
    expect(greetingSegments("生日快樂", ["a"], "")).toHaveLength(2);
    expect(greetingSeconds(2, true)).toBe(18);
  });
  it("every occasion fits the subtitle title limit", () => {
    for (const o of GREETING_OCCASIONS) expect(greetingTitle(o.id, "一二三四五六七八").length).toBeLessThanOrEqual(16);
  });
});

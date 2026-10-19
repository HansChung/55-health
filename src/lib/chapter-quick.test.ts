import { describe, expect, it } from "vitest";
import { listChapterOpenings } from "./chapter-opening";
import { ASK_MESSAGE_MAX } from "./ask";
import { CHAPTER_QUICK, chapterQuick, defaultQuick, quickHref, quickPrompt } from "./chapter-quick";

const chapters = listChapterOpenings();

describe("一步完成", () => {
  it("every built-in chapter has its own quick step", () => {
    const missing = chapters.filter((c) => !CHAPTER_QUICK[c.id]).map((c) => c.id);
    expect(missing).toEqual([]);
  });
  it("no quick step points at a chapter that doesn't exist", () => {
    const ids = new Set(chapters.map((c) => c.id));
    expect(Object.keys(CHAPTER_QUICK).filter((id) => !ids.has(id))).toEqual([]);
  });
  it("goals are one short sentence (low cognitive load)", () => {
    const long = Object.entries(CHAPTER_QUICK).filter(([, q]) => [...q.goal].length > 20).map(([id, q]) => `${id} ${q.goal}`);
    expect(long).toEqual([]);
  });
  it("prompt-based steps have a prompt that fits; the others open a real page", () => {
    for (const [id, q] of Object.entries(CHAPTER_QUICK)) {
      if (q.action === "ask" || q.action === "guided" || q.action === "photo") {
        const text = quickPrompt(q);
        expect(text.length, id).toBeGreaterThan(5);
        expect([...text].length, id).toBeLessThanOrEqual(q.action === "photo" ? 200 : ASK_MESSAGE_MAX);
        expect(quickHref(q.action, id), id).toBeNull();
      } else {
        expect(quickHref(q.action, id), id).toMatch(/^\/\?open=/);
      }
    }
  });
  it("guided prompts ask one question at a time; unknown chapters fall back to guided", () => {
    expect(quickPrompt(CHAPTER_QUICK["0801"])).toContain("一次只問我一題");
    expect(chapterQuick("9999", "新章節")).toEqual(defaultQuick("新章節"));
    expect(defaultQuick("新章節").prompt).toContain("新章節");
  });
});

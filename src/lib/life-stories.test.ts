import { describe, it, expect } from "vitest";
import {
  STORY_BODY_MAX,
  STORY_INTERVIEW_MAX,
  buildStoryWritePrompt,
  newStoryPushForFamily,
  normalizeStoryDraft,
  sanitizeStoryBody,
  sanitizeStoryTitle,
  storyAnswerCount,
  storyCommentPushForOwner,
  storySpeech,
  trimStoryInterview,
} from "./life-stories";
import { buildAskSystemPrompt } from "./ask";

describe("我的故事集：文字整理", () => {
  it("標題去掉書名號、壓成一行、截 40 字", () => {
    expect(sanitizeStoryTitle("《第一次 搭火車》")).toBe("第一次 搭火車");
    expect([...sanitizeStoryTitle("字".repeat(60))]).toHaveLength(40);
    expect(sanitizeStoryTitle(3)).toBe("");
  });
  it("內容保留段落、去掉多餘空行與 Markdown、截長", () => {
    expect(sanitizeStoryBody("## 標題\n**那年**夏天\n\n\n\n我十八歲")).toBe("標題\n那年夏天\n\n我十八歲");
    expect([...sanitizeStoryBody("字".repeat(5000))]).toHaveLength(STORY_BODY_MAX);
  });
  it("模型的草稿：沒標題給預設、沒內容就失敗", () => {
    expect(normalizeStoryDraft({ title: "", era: " 民國 62 年 ", body: "我在台北" })).toEqual({ title: "我的故事", era: "民國 62 年", body: "我在台北" });
    expect(() => normalizeStoryDraft({ title: "x", body: "  " })).toThrow();
  });
  it("回答題數不算第一則（題目）；念給我聽一段一段", () => {
    expect(storyAnswerCount([{ role: "user", text: "題目" }, { role: "assistant", text: "問" }, { role: "user", text: "答" }])).toBe(1);
    expect(storyAnswerCount([])).toBe(0);
    expect(storySpeech({ title: "第一份工作", era: null, body: "第一段\n\n第二段" })).toEqual(["第一份工作", "第一段", "第二段"]);
  });
  it("訪談太長時留第一則題目和最後的部分（存檔、整理都收得下）", () => {
    const long = [
      { role: "assistant" as const, text: "開場" },
      { role: "user" as const, text: "我想講的故事：第一份工作" },
      ...Array.from({ length: 150 }, (_, i) => [
        { role: "assistant" as const, text: `問 ${i}` },
        { role: "user" as const, text: `答 ${i}` },
      ]).flat(),
    ];
    const t = trimStoryInterview(long);
    expect(t).toHaveLength(STORY_INTERVIEW_MAX);
    expect(t[0]).toEqual({ role: "user", text: "我想講的故事：第一份工作" });
    expect(t[t.length - 1]).toEqual({ role: "user", text: "答 149" });
    const short = [{ role: "user" as const, text: "  題目 " }, { role: "assistant" as const, text: "" }];
    expect(trimStoryInterview(short)).toEqual([{ role: "user", text: "題目" }]);
  });
});

describe("我的故事集：暖暖", () => {
  it("說故事模式：一次一題、不編故事", () => {
    const p = buildAskSystemPrompt({ mode: "story" });
    expect(p).toContain("說故事模式");
    expect(p).toContain("一次只問一個問題");
    expect(p).toContain("不要自己編故事內容");
  });
  it("整理成文章：第一人稱、只寫說過的事、回 JSON", () => {
    const p = buildStoryWritePrompt([{ role: "user", text: "我想講第一份工作" }, { role: "assistant", text: "那是哪一年？" }, { role: "user", text: "民國六十年" }], { displayName: "王阿嬤" });
    expect(p).toContain("王阿嬤");
    expect(p).toContain("長輩：民國六十年");
    expect(p).toContain("第一人稱");
    expect(p).toContain("不要加上沒提到的");
    expect(p).toContain('{"title":"…","era":"…","body":"…"}');
  });
  it("推播文字", () => {
    expect(newStoryPushForFamily({ elderName: "王阿嬤", title: "第一份工作" }).body).toContain("《第一份工作》");
    expect(storyCommentPushForOwner({ authorName: "小美", relationship: "女兒", storyTitle: "第一份工作", emoji: "❤️" }).body).toBe("小美（女兒）對你的故事《第一份工作》按了 ❤️");
  });
});

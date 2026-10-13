import { describe, expect, it } from "vitest";
import type { LifeStory } from "./life-stories";
import { audiobookChapters, audiobookSeconds, brokenAudioKey, estimateSpeechSeconds, formatBookDuration, sourceCounts, speechChunks } from "./story-audiobook";

const story = (over: Partial<LifeStory>): LifeStory => ({
  id: "x", title: "標題", era: null, body: "", photos: [], audio: null, voice_reading: null,
  share_with_family: true, created_at: "2026-10-01T00:00:00Z", updated_at: "2026-10-01T00:00:00Z", ...over,
});

describe("audiobookChapters", () => {
  const stories = [
    story({ id: "c", title: "第三篇", body: "只有文字的故事。", created_at: "2026-10-03T00:00:00Z" }),
    story({ id: "a", title: "第一篇", body: "有錄音", audio: { url: "rec.m4a", seconds: 61.4 }, created_at: "2026-10-01T00:00:00Z",
      photos: [{ url: "p.jpg", width: 1, height: 1 } as LifeStory["photos"][number]] }),
    story({ id: "b", title: "第二篇", body: "有 AI 念的", voice_reading: { url: "voice.m4a", seconds: 120, outdated: false }, created_at: "2026-10-02T00:00:00Z" }),
    story({ id: "d", title: "改過字的", body: "文字改過了", voice_reading: { url: "old.m4a", seconds: 90, outdated: true }, created_at: "2026-10-04T00:00:00Z" }),
    story({ id: "e", title: "空的", body: "  ", created_at: "2026-10-05T00:00:00Z" }),
  ];

  it("orders oldest first and picks recording > current voice reading > device speech", () => {
    const ch = audiobookChapters(stories, { deviceSpeech: true });
    expect(ch.map((c) => [c.id, c.source, c.url])).toEqual([
      ["a", "recording", "rec.m4a"],
      ["b", "voice", "voice.m4a"],
      ["c", "device", null],
      ["d", "device", null],
    ]);
    expect(ch[0]).toMatchObject({ seconds: 61, cover: "p.jpg" });
    expect(sourceCounts(ch)).toEqual({ recording: 1, voice: 1, device: 2 });
  });

  it("falls back to the phone voice for chapters whose audio is broken", () => {
    const ch = audiobookChapters(stories, { deviceSpeech: true, brokenAudio: new Set([brokenAudioKey("a", "recording"), brokenAudioKey("b", "voice")]) });
    expect(ch.slice(0, 2).map((c) => [c.id, c.source])).toEqual([["a", "device"], ["b", "device"]]);
  });
  it("a broken recording still uses a current voice reading of the same story", () => {
    const both = [story({ id: "z", body: "文字", audio: { url: "rec.m4a", seconds: 5 }, voice_reading: { url: "voice.m4a", seconds: 9, outdated: false } })];
    const ch = audiobookChapters(both, { deviceSpeech: true, brokenAudio: new Set([brokenAudioKey("z", "recording")]) });
    expect(ch.map((c) => [c.source, c.url])).toEqual([["voice", "voice.m4a"]]);
  });
  it("skips text-only chapters when the phone cannot speak", () => {
    expect(audiobookChapters(stories, { deviceSpeech: false }).map((c) => c.id)).toEqual(["a", "b"]);
  });
});

describe("durations", () => {
  it("estimates device speech from characters", () => {
    expect(estimateSpeechSeconds(["一二三四", "五六七八"])).toBe(2);
    expect(estimateSpeechSeconds([""])).toBe(1);
  });
  it("formats book length", () => {
    expect(formatBookDuration(20)).toBe("不到 1 分鐘");
    expect(formatBookDuration(12 * 60)).toBe("約 12 分鐘");
    expect(formatBookDuration(65 * 60)).toBe("約 1 小時 5 分");
    expect(formatBookDuration(120 * 60)).toBe("約 2 小時");
    expect(audiobookSeconds([{ seconds: 3 }, { seconds: 4 }] as never)).toBe(7);
  });
});

describe("speechChunks", () => {
  it("splits paragraphs into sentences, then at commas, then hard", () => {
    expect(speechChunks(["第一句。第二句！", "第三句"])).toEqual(["第一句。", "第二句！", "第三句"]);
    const long = "一二三四五，六七八九十，甲乙丙丁戊";
    expect(speechChunks([long], 8)).toEqual(["一二三四五，", "六七八九十，", "甲乙丙丁戊"]);
    expect(speechChunks(["一二三四五六七八九十"], 4)).toEqual(["一二三四", "五六七八", "九十"]);
    expect(speechChunks(["  ", ""])).toEqual([]);
  });
});

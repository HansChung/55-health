import { describe, it, expect } from "vitest";
import {
  authorLabel,
  buildCommentsView,
  commentPushForFamily,
  commentPushForOwner,
  commentsSpeechText,
  familyCanSeeVideos,
  formatVoiceSeconds,
  isVideoReaction,
  newVideoPushForFamily,
  sanitizeComment,
  viewersLine,
  type CommentRow,
} from "./video-comments";

const OWNER = "elder";
const DAUGHTER = "daughter";
const SON = "son";
const directory = new Map([
  [OWNER, { name: "王阿嬤", relationship: null }],
  [DAUGHTER, { name: "小美", relationship: "女兒" }],
  [SON, { name: "阿明", relationship: "兒子" }],
]);

function row(over: Partial<CommentRow>): CommentRow {
  return { id: "c", video_id: "v1", author_id: DAUGHTER, emoji: null, body: null, created_at: "2026-09-30T01:00:00Z", ...over };
}

describe("buildCommentsView", () => {
  const rows = [
    row({ id: "r1", emoji: "❤️", author_id: DAUGHTER, created_at: "2026-09-30T01:00:00Z" }),
    row({ id: "r2", emoji: "❤️", author_id: SON, created_at: "2026-09-30T01:01:00Z" }),
    row({ id: "r3", emoji: "👍", author_id: SON, created_at: "2026-09-30T01:02:00Z" }),
    row({ id: "c2", body: "謝謝你", author_id: OWNER, created_at: "2026-09-30T03:00:00Z" }),
    row({ id: "c1", body: "好美喔！", author_id: DAUGHTER, created_at: "2026-09-30T02:00:00Z" }),
  ];

  it("家人看：按讚照表情順序合計、標出自己按的；留言照時間排、只能刪自己的", () => {
    const v = buildCommentsView({ rows, viewerId: DAUGHTER, ownerId: OWNER, directory });
    expect(v.reactions).toEqual([
      { emoji: "❤️", count: 2, mine: true, names: ["我", "阿明（兒子）"] },
      { emoji: "👍", count: 1, mine: false, names: ["阿明（兒子）"] },
    ]);
    expect(v.comments.map((c) => [c.id, authorLabel(c.author), c.can_delete])).toEqual([
      ["c1", "我", true],
      ["c2", "王阿嬤", false],
    ]);
    expect(v.comments[1].author.is_owner).toBe(true);
  });

  it("長輩看：家人顯示名字＋稱謂，自己影片底下的留言都可以刪", () => {
    const v = buildCommentsView({ rows, viewerId: OWNER, ownerId: OWNER, directory });
    expect(v.comments.map((c) => [authorLabel(c.author), c.can_delete])).toEqual([
      ["小美（女兒）", true],
      ["我", true],
    ]);
  });

  it("已經解除連結的人顯示「家人」", () => {
    const v = buildCommentsView({ rows: [row({ id: "x", body: "hi", author_id: "gone" })], viewerId: OWNER, ownerId: OWNER, directory });
    expect(authorLabel(v.comments[0].author)).toBe("家人");
  });
});

describe("留言文字與表情", () => {
  it("壓成一行、去控制字元、最多 100 字", () => {
    expect(sanitizeComment("  好美\n喔\u0007！ ")).toBe("好美 喔 ！");
    expect([...sanitizeComment("好".repeat(150))].length).toBe(100);
    expect(sanitizeComment(null)).toBe("");
  });
  it("只收五種表情", () => {
    expect(isVideoReaction("❤️")).toBe(true);
    expect(isVideoReaction("💩")).toBe(false);
  });
});

describe("權限", () => {
  it("家人預設看得到，長輩關掉才看不到", () => {
    expect(familyCanSeeVideos(null)).toBe(true);
    expect(familyCanSeeVideos({ calories: true })).toBe(true);
    expect(familyCanSeeVideos({ videos: false })).toBe(false);
  });
});

describe("推播文字", () => {
  it("家人按讚／留言給長輩", () => {
    expect(commentPushForOwner({ authorName: "小美", relationship: "女兒", place: "日月潭", emoji: "❤️" })).toEqual({
      title: "❤️ 小美（女兒）",
      body: "小美（女兒）對「日月潭」的影片按了 ❤️",
    });
    expect(commentPushForOwner({ authorName: "阿明", relationship: null, place: null, body: "好美！" })).toEqual({
      title: "💬 阿明留言了",
      body: "好美！",
    });
  });
  it("新影片通知家人", () => {
    expect(newVideoPushForFamily({ elderName: "王阿嬤", place: "鹿港", montage: true })).toEqual({
      title: "🎬 王阿嬤做了一支遊記影片",
      body: "在「鹿港」，點這裡看看，給王阿嬤按個讚吧",
    });
  });
});

describe("語音留言與念給我聽", () => {
  const rows: CommentRow[] = [
    row({ id: "t1", body: "好美喔！", author_id: DAUGHTER, created_at: "2026-10-01T01:00:00Z" }),
    row({ id: "v1", audio_url: "https://cdn/v1.m4a", audio_seconds: 7.6, author_id: SON, created_at: "2026-10-01T01:01:00Z" }),
    row({ id: "t2", body: "謝謝你們", author_id: OWNER, created_at: "2026-10-01T01:02:00Z" }),
  ];

  it("語音留言跟文字留言一起照時間排，帶網址和秒數", () => {
    const v = buildCommentsView({ rows, viewerId: OWNER, ownerId: OWNER, directory });
    expect(v.comments.map((c) => [c.id, c.body, c.audio_url, c.audio_seconds])).toEqual([
      ["t1", "好美喔！", null, null],
      ["v1", null, "https://cdn/v1.m4a", 7.6],
      ["t2", "謝謝你們", null, null],
    ]);
  });

  it("念給我聽：只念文字留言，說是誰說的", () => {
    const v = buildCommentsView({ rows, viewerId: OWNER, ownerId: OWNER, directory });
    expect(commentsSpeechText(v.comments)).toEqual(["小美（女兒）說：好美喔！", "我說：謝謝你們"]);
  });

  it("語音推播：家人傳給長輩、長輩回覆家人", () => {
    expect(commentPushForOwner({ authorName: "小美", relationship: "女兒", place: null, voiceSeconds: 7.6 })).toEqual({
      title: "🎤 小美（女兒）傳了一段語音",
      body: "點這裡聽聽看（8 秒）",
    });
    expect(commentPushForFamily({ elderName: "王阿嬤", voiceSeconds: 0.4 })).toEqual({
      title: "🎤 王阿嬤回覆了一段語音",
      body: "點這裡聽聽看（1 秒）",
    });
    expect(formatVoiceSeconds(12.4)).toBe("12 秒");
  });
});

describe("家人看過了", () => {
  const views = [
    { video_id: "v1", viewer_id: DAUGHTER, last_viewed_at: "2026-10-01T01:00:00Z" },
    { video_id: "v1", viewer_id: SON, last_viewed_at: "2026-10-02T01:00:00Z" },
    { video_id: "v1", viewer_id: "unlinked", last_viewed_at: "2026-10-03T01:00:00Z" },
    { video_id: "v1", viewer_id: OWNER, last_viewed_at: "2026-10-04T01:00:00Z" },
  ];

  it("長輩看自己的影片：最近看的在前；不列自己、不列已取消連結的人", () => {
    const v = buildCommentsView({ rows: [], viewerId: OWNER, ownerId: OWNER, directory, views });
    expect(v.viewers).toEqual([
      { name: "阿明", relationship: "兒子", last_viewed_at: "2026-10-02T01:00:00Z" },
      { name: "小美", relationship: "女兒", last_viewed_at: "2026-10-01T01:00:00Z" },
    ]);
  });

  it("家人看：拿不到誰看過了", () => {
    const v = buildCommentsView({ rows: [], viewerId: DAUGHTER, ownerId: OWNER, directory, views });
    expect(v.viewers).toBeUndefined();
  });

  it("一句話：超過 3 人就說「等 N 人」", () => {
    expect(viewersLine([])).toBe("");
    expect(viewersLine([{ name: "小美", relationship: "女兒" }, { name: "阿明", relationship: null }])).toBe("小美（女兒）、阿明看過了");
    const many = ["甲", "乙", "丙", "丁"].map((name) => ({ name, relationship: null }));
    expect(viewersLine(many)).toBe("甲、乙、丙等 4 人看過了");
  });
});

import { describe, it, expect } from "vitest";
import {
  authorLabel,
  buildCommentsView,
  commentPushForOwner,
  familyCanSeeVideos,
  isVideoReaction,
  newVideoPushForFamily,
  sanitizeComment,
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

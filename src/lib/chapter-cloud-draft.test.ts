import { describe, expect, it } from "vitest";
import {
  isBlankDraftPayload,
  isChapterDraftId,
  supportsCloudDraft,
} from "./chapter-cloud-draft";

describe("chapter-cloud-draft", () => {
  it("supportsCloudDraft 僅 recipe-card／life-assets", () => {
    expect(supportsCloudDraft("recipe-card")).toBe(true);
    expect(supportsCloudDraft("life-assets")).toBe(true);
    expect(supportsCloudDraft("routes")).toBe(false);
    expect(supportsCloudDraft(undefined)).toBe(false);
  });

  it("isChapterDraftId", () => {
    expect(isChapterDraftId("0207")).toBe(true);
    expect(isChapterDraftId("1201")).toBe(true);
    expect(isChapterDraftId("p4-open")).toBe(false);
    expect(isChapterDraftId("207")).toBe(false);
  });

  it("isBlankDraftPayload", () => {
    expect(isBlankDraftPayload(null)).toBe(true);
    expect(isBlankDraftPayload({})).toBe(true);
    expect(
      isBlankDraftPayload({
        dishName: "",
        colors: "  ",
        fiberSource: "",
        feeling: "",
        reflectNote: "",
      })
    ).toBe(true);
    expect(
      isBlankDraftPayload({
        dishName: "沙拉",
        colors: "",
        fiberSource: "",
        feeling: "",
        reflectNote: "",
      })
    ).toBe(false);
  });
});

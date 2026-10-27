import { describe, expect, it } from "vitest";
import {
  CardInputError,
  SLUG_LENGTH,
  buildVCard,
  cardShareMeta,
  cardTitle,
  isCardSlug,
  lineAddHref,
  normalizeCardInput,
  normalizeLineId,
  slugFromBytes,
  telHref,
  toPublicCard,
  type BusinessCard,
} from "./business-card";

const ID = "3f2b8c1e-4d5a-4b6c-8d7e-9f0a1b2c3d4e";

describe("normalizeCardInput", () => {
  it("trims, joins lines and cuts to the limits", () => {
    const f = normalizeCardInput({ display_name: "  王美玉  ", intro: "退休老師\n喜歡爬山", interests: "x".repeat(80) });
    expect(f.display_name).toBe("王美玉");
    expect(f.intro).toBe("退休老師 喜歡爬山");
    expect([...f.interests]).toHaveLength(60);
  });

  it("keeps contacts hidden unless switched on, and never shows an empty one", () => {
    const f = normalizeCardInput({ phone: "0912-345-678", show_phone: true, email: "", show_email: true, line_id: "meiyu0815" });
    expect(f.show_phone).toBe(true);
    expect(f.show_email).toBe(false);
    expect(f.show_line).toBe(false);
    expect(normalizeCardInput({}).show_phone).toBe(false);
  });

  it("rejects malformed phone, email and LINE", () => {
    expect(() => normalizeCardInput({ phone: "abc" })).toThrow(CardInputError);
    expect(() => normalizeCardInput({ email: "not-an-email" })).toThrow(CardInputError);
    expect(() => normalizeCardInput({ line_id: "https://evil.example.com/ti/p/x" })).toThrow(CardInputError);
    expect(() => normalizeCardInput({ line_id: "有空白 的id" })).toThrow(CardInputError);
  });

  it("keeps valid, de-duplicated works and caps them at 3", () => {
    const works = normalizeCardInput({
      works: [{ kind: "video", id: ID }, { kind: "video", id: ID }, { kind: "story", id: "bad" }, { kind: "x", id: ID }],
    }).works;
    expect(works).toEqual([{ kind: "video", id: ID }]);
    const four = ["1", "2", "3", "4"].map((n) => ({ kind: "story", id: ID.replace(/.$/, n) }));
    expect(() => normalizeCardInput({ works: four })).toThrow(CardInputError);
  });
});

describe("LINE / phone links", () => {
  it("accepts IDs, official @IDs and line.me links", () => {
    expect(normalizeLineId("meiyu.0815")).toBe("meiyu.0815");
    expect(normalizeLineId("https://line.me/ti/p/AbCdEf")).toBe("https://line.me/ti/p/AbCdEf");
    expect(normalizeLineId("http://line.me/ti/p/x")).toBeNull();
    expect(lineAddHref("meiyu")).toBe("https://line.me/ti/p/~meiyu");
    expect(lineAddHref("@shop")).toBe("https://line.me/R/ti/p/%40shop");
    expect(lineAddHref("https://lin.ee/abc")).toBe("https://lin.ee/abc");
  });

  it("dials digits only", () => {
    expect(telHref("0912 345-678")).toBe("tel:0912345678");
    expect(telHref("+886 (2) 1234-5678")).toBe("tel:+886212345678");
  });
});

describe("slug", () => {
  it("is lowercase, unambiguous and valid", () => {
    const slug = slugFromBytes(new Uint8Array(16).map((_, i) => i * 37));
    expect(slug).toHaveLength(SLUG_LENGTH);
    expect(slug).not.toMatch(/[01lo]/);
    expect(isCardSlug(slug)).toBe(true);
    expect(isCardSlug("../etc")).toBe(false);
  });
});

const card: BusinessCard = {
  slug: "abcdefghijkm",
  display_name: "王美玉",
  nickname: "美玉阿姨",
  intro: "退休老師, 喜歡爬山; 也愛唱歌",
  interests: "種花、唱歌",
  phone: "0912345678",
  line_id: "meiyu",
  email: "meiyu@example.com",
  show_phone: false,
  show_line: true,
  show_email: false,
  works: [],
  photo_url: null,
  is_public: true,
  updated_at: "",
};

describe("public card", () => {
  it("only exposes contacts the elder switched on", () => {
    const pub = toPublicCard(card, []);
    expect(pub.phone).toBeNull();
    expect(pub.email).toBeNull();
    expect(pub.line_id).toBe("meiyu");
    expect(JSON.stringify(pub)).not.toContain("0912345678");
  });

  it("titles the card with name and nickname", () => {
    expect(cardTitle(card)).toBe("王美玉（美玉阿姨）");
    expect(cardTitle({ display_name: "", nickname: "" })).toBe("我的名片");
    expect(cardShareMeta(card).title).toBe("王美玉（美玉阿姨）的名片");
    expect(cardShareMeta({ display_name: "", nickname: "", intro: "", interests: "" }).title).toBe("暖暖數位名片");
  });

  it("vCard escapes text and leaves hidden contacts out", () => {
    const v = buildVCard(toPublicCard(card, []), "https://nuan55.com/c/abcdefghijkm");
    expect(v).toContain("FN:王美玉\r\n");
    expect(v).toContain("NICKNAME:美玉阿姨");
    expect(v).toContain("退休老師\\, 喜歡爬山\\; 也愛唱歌");
    expect(v).toContain("URL:https://nuan55.com/c/abcdefghijkm");
    expect(v).not.toContain("TEL");
    expect(v).not.toContain("EMAIL");
    expect(v.startsWith("BEGIN:VCARD\r\n")).toBe(true);
  });
});

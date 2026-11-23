import { describe, it, expect } from "vitest";
import {
  bloodLabel,
  cleanPhone,
  emergencyFormError,
  isEmergencyEmpty,
  medicationLines,
  mergeEmergencyPatch,
  normalizeEmergencyInfo,
  telHref,
  toStoredEmergency,
  withPrimaryContact,
} from "./emergency-card";

const FULL = {
  name: "女兒小美",
  phone: "0912-345-678",
  contacts: [
    { name: "女兒小美", phone: "0912-345-678" },
    { name: "兒子阿明", phone: "02 2345 6789 #12" },
  ],
  blood_type: "A",
  rh_negative: false,
  allergies: "盤尼西林",
  note: "裝了心律調節器",
};

describe("電話", () => {
  it("只留數字和 + - # 空格", () => {
    expect(cleanPhone(" 0912-345-678 ")).toBe("0912-345-678");
    expect(cleanPhone("<script>abc")).toBe("");
    // 全形數字（中文輸入法）轉成半形，不會整支電話不見
    expect(cleanPhone("０９１２－３４５－６７８")).toBe("0912-345-678");
    expect(normalizeEmergencyInfo({ name: "女兒", phone: "０９１２３４５６７８" }).contacts).toEqual([{ name: "女兒", phone: "0912345678" }]);
    expect(cleanPhone("+886 912 345 678")).toBe("+886 912 345 678");
    expect(cleanPhone(null)).toBe("");
  });

  it("撥號連結：至少 3 個數字，+ 只留最前面", () => {
    expect(telHref("0912-345-678")).toBe("tel:0912345678");
    expect(telHref("+886 912+345")).toBe("tel:+886912345");
    expect(telHref("119")).toBe("tel:119");
    expect(telHref("12")).toBeNull();
    expect(telHref("")).toBeNull();
  });
});

describe("normalizeEmergencyInfo", () => {
  it("舊資料只有 name／phone：當成第一位聯絡人", () => {
    const info = normalizeEmergencyInfo({ name: "大兒子", phone: "0911222333" });
    expect(info.contacts).toEqual([{ name: "大兒子", phone: "0911222333" }]);
    expect(info.bloodType).toBeNull();
    expect(info.allergies).toBe("");
  });

  it("新資料：聯絡人最多 3 位、同一支電話只留一次、沒名字或電話不對的丟掉", () => {
    const info = normalizeEmergencyInfo({
      ...FULL,
      contacts: [
        ...FULL.contacts,
        { name: "重複", phone: "0912345678" },
        { name: "", phone: "0933000111" },
        { name: "沒電話", phone: "12" },
        { name: "鄰居王太太", phone: "0955666777" },
        { name: "第四位", phone: "0966777888" },
      ],
    });
    expect(info.contacts.map((c) => c.name)).toEqual(["女兒小美", "兒子阿明", "鄰居王太太"]);
    expect(info.bloodType).toBe("A");
    expect(info.note).toBe("裝了心律調節器");
  });

  it("亂七八糟的東西不會壞", () => {
    for (const raw of [null, undefined, "x", 3, [], { contacts: "no", blood_type: "Z", allergies: 5 }]) {
      const info = normalizeEmergencyInfo(raw);
      expect(info.contacts).toEqual([]);
      expect(info.bloodType).toBeNull();
      expect(isEmergencyEmpty(info)).toBe(true);
    }
  });

  it("太長的字會截掉，換行收成一格", () => {
    const info = normalizeEmergencyInfo({ contacts: [], allergies: "蝦\n\n蟹  花生", note: "很".repeat(500) });
    expect(info.allergies).toBe("蝦 蟹 花生");
    expect(info.note).toHaveLength(120);
  });
});

describe("toStoredEmergency", () => {
  it("name／phone 永遠等於第一位聯絡人（舊版程式只認這兩個）", () => {
    const stored = toStoredEmergency(normalizeEmergencyInfo(FULL))!;
    expect(stored.name).toBe("女兒小美");
    expect(stored.phone).toBe("0912-345-678");
    expect(stored.contacts).toHaveLength(2);
    expect(stored.blood_type).toBe("A");
    // 存了再讀回來一樣
    expect(normalizeEmergencyInfo(stored)).toEqual(normalizeEmergencyInfo(FULL));
  });

  it("只填血型、沒有聯絡人也能存；全部沒填 → null", () => {
    const stored = toStoredEmergency({ contacts: [], bloodType: "O", rhNegative: true, allergies: "", note: "" })!;
    expect(stored).toMatchObject({ name: "", phone: "", contacts: [], blood_type: "O", rh_negative: true });
    expect(normalizeEmergencyInfo(stored).contacts).toEqual([]);
    expect(toStoredEmergency({ contacts: [], bloodType: null, rhNegative: false, allergies: " ", note: "" })).toBeNull();
  });
});

describe("mergeEmergencyPatch（伺服器存檔）", () => {
  it("舊版程式只送 { name, phone }：只換第一位，血型、過敏、其他聯絡人照舊", () => {
    const merged = mergeEmergencyPatch(FULL, { name: "媳婦", phone: "0977888999" })!;
    expect(merged.contacts?.map((c) => c.name)).toEqual(["媳婦", "兒子阿明"]);
    expect(merged.name).toBe("媳婦");
    expect(merged.blood_type).toBe("A");
    expect(merged.allergies).toBe("盤尼西林");
  });

  it("新版送整張卡：照送來的存（聯絡人可以清空）", () => {
    const merged = mergeEmergencyPatch(FULL, { name: "", phone: "", contacts: [], blood_type: "B", allergies: "" })!;
    expect(merged.contacts).toEqual([]);
    expect(merged.blood_type).toBe("B");
    expect(merged.allergies).toBe("");
  });

  it("null 就是清掉；舊格式又不成樣子就照舊", () => {
    expect(mergeEmergencyPatch(FULL, null)).toBeNull();
    expect(mergeEmergencyPatch(FULL, { name: "", phone: "" })?.contacts).toHaveLength(2);
    expect(mergeEmergencyPatch(null, { name: "女兒", phone: "0912345678" })?.contacts).toEqual([{ name: "女兒", phone: "0912345678" }]);
  });

  it("送來的其他欄位（亂塞的）不會存進去", () => {
    const merged = mergeEmergencyPatch(null, { contacts: [], blood_type: "A", is_admin: true, extra: "x".repeat(900) })!;
    expect(Object.keys(merged).sort()).toEqual(["allergies", "blood_type", "contacts", "name", "note", "phone", "rh_negative"]);
  });
});

describe("withPrimaryContact", () => {
  it("新的第一位如果跟後面的同一支電話，不會重複", () => {
    const info = withPrimaryContact(normalizeEmergencyInfo(FULL), { name: "阿明", phone: "0223456789#12" });
    expect(info.contacts).toHaveLength(1);
    expect(info.contacts[0].name).toBe("阿明");
  });
});

describe("卡片上的字", () => {
  it("血型", () => {
    expect(bloodLabel({ bloodType: "AB", rhNegative: false })).toBe("AB 型");
    expect(bloodLabel({ bloodType: "O", rhNegative: true })).toBe("O 型（Rh 陰性）");
    expect(bloodLabel({ bloodType: null, rhNegative: false })).toBeNull();
  });

  it("用藥：名字＋劑量，重複的只列一次，太多說還有幾種", () => {
    const meds = Array.from({ length: 11 }, (_, i) => ({ name: `藥${i}`, dose: i === 0 ? "5mg" : undefined }));
    const { lines, more } = medicationLines([...meds, { name: "藥1" }, { name: " " }]);
    expect(lines[0]).toBe("藥0 5mg");
    expect(lines).toHaveLength(8);
    expect(more).toBe(3);
    expect(medicationLines(null)).toEqual({ lines: [], more: 0 });
  });

  it("表單檢查：名字和電話要一起填，空白列不管", () => {
    expect(emergencyFormError([{ name: "", phone: "" }])).toBeNull();
    expect(emergencyFormError([{ name: "女兒", phone: "0912345678" }, { name: "", phone: "" }])).toBeNull();
    expect(emergencyFormError([{ name: "", phone: "0912345678" }])).toContain("第 1 位");
    expect(emergencyFormError([{ name: "女兒", phone: "0912345678" }, { name: "兒子", phone: "abc" }])).toContain("第 2 位");
  });
});

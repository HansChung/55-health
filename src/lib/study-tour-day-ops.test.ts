import { describe, expect, it } from "vitest";
import {
  arrivalMessage,
  buildStudyTourView,
  checkinSummary,
  formatBroadcastTime,
  reminderMessage,
  sanitizeBroadcast,
  taipeiDateKey,
  tourStartsOn,
  type StudyTourRow,
} from "./study-tours";

const tour = { title: "鹿港老街文化小旅行", starts_at: "2026-10-12T00:30:00.000Z", meeting_point: "彰化火車站前站" }; // 台灣 10/12 08:30

describe("行前提醒：哪一天出發", () => {
  it("用台灣日期判斷，不是 UTC", () => {
    // 台灣 10/12 00:10 ＝ UTC 10/11 16:10
    expect(taipeiDateKey(new Date("2026-10-11T16:10:00Z"))).toBe("2026-10-12");
  });

  it("前一天 20:00（台灣）跑：明天出發的才提醒", () => {
    const now = new Date("2026-10-11T12:00:00Z"); // 台灣 10/11 20:00
    expect(tourStartsOn(tour, "day_before", now)).toBe(true);
    expect(tourStartsOn(tour, "same_day", now)).toBe(false);
  });

  it("當天 06:00（台灣）跑：今天出發的才提醒", () => {
    const now = new Date("2026-10-11T22:00:00Z"); // 台灣 10/12 06:00
    expect(tourStartsOn(tour, "same_day", now)).toBe(true);
    expect(tourStartsOn(tour, "day_before", now)).toBe(false);
  });
});

describe("行前提醒：內容", () => {
  const reg = { status: "confirmed" as const, for_self: true, participant_name: "王阿嬤" };

  it("正取：集合時間地點＋帶藥", () => {
    expect(reminderMessage("day_before", tour, reg)).toEqual({
      title: "🧭 明天出發：鹿港老街文化小旅行",
      body: "08:30 在「彰化火車站前站」集合。記得帶水、帽子和常吃的藥",
    });
    expect(reminderMessage("same_day", tour, reg)?.title).toBe("🧭 今天出發：鹿港老街文化小旅行");
  });

  it("家人代報：訊息帶長輩名字", () => {
    expect(reminderMessage("same_day", tour, { ...reg, for_self: false })?.body).toBe("（王阿嬤）08:30 在「彰化火車站前站」集合，出門前記得帶藥喔");
  });

  it("候補：只在前一天告知還在候補第幾位；當天不推", () => {
    const w = { ...reg, status: "waitlisted" as const, waitlist_position: 2 };
    expect(reminderMessage("day_before", tour, w)?.body).toBe("目前還在候補第 2 位，有名額會馬上通知你");
    expect(reminderMessage("same_day", tour, w)).toBeNull();
    expect(reminderMessage("day_before", tour, { ...reg, status: "cancelled" })).toBeNull();
  });

  it("沒填集合地點也說得通", () => {
    expect(reminderMessage("day_before", { ...tour, meeting_point: "" }, reg)?.body).toContain("08:30 準時集合");
  });
});

describe("集合廣播與家人抵達通知", () => {
  it("廣播內容：攤平換行、去掉控制字元、最多 120 字", () => {
    expect(sanitizeBroadcast("  10:30\n大門口\u0007集合  ")).toBe("10:30 大門口 集合");
    expect(sanitizeBroadcast("字".repeat(200))).toHaveLength(120);
    expect(sanitizeBroadcast(null)).toBe("");
  });

  it("抵達與結業通知", () => {
    const base = { elderName: "王阿嬤", tourTitle: "鹿港老街文化小旅行", stopName: "天后宮", stampedCount: 2, totalStops: 3, justCompleted: false };
    expect(arrivalMessage(base)).toEqual({ title: "🏮 王阿嬤已抵達「天后宮」", body: "鹿港老街文化小旅行・第 2／3 站" });
    expect(arrivalMessage({ ...base, stampedCount: 3, justCompleted: true }).title).toBe("🎓 王阿嬤完成了「鹿港老街文化小旅行」");
  });

  it("廣播時間：今天只寫時間，其他天寫日期", () => {
    const now = new Date("2026-10-12T03:00:00Z"); // 台灣 10/12 11:00
    expect(formatBroadcastTime("2026-10-12T02:25:00Z", now)).toBe("今天 10:25");
    expect(formatBroadcastTime("2026-10-11T02:25:00Z", now)).toBe("10/11 10:25");
  });
});

describe("報到名單", () => {
  it("只算正取：組數與人數", () => {
    expect(
      checkinSummary([
        { status: "confirmed", party_size: 2, checked_in_at: "2026-10-12T00:20:00Z" },
        { status: "confirmed", party_size: 1, checked_in_at: null },
        { status: "waitlisted", party_size: 1, checked_in_at: null },
        { status: "cancelled", party_size: 3, checked_in_at: "2026-10-12T00:10:00Z" },
      ])
    ).toEqual({ checkedGroups: 1, groups: 2, checkedPeople: 2, people: 3 });
  });
});

describe("長輩畫面：廣播只給有報名的人", () => {
  const row: StudyTourRow = {
    id: "t1", title: "t", summary: "", description: "", organizer_name: "", cover_image_url: null,
    starts_at: "2026-10-12T00:30:00Z", ends_at: "2026-10-12T08:00:00Z", meeting_point: "", fee_text: "",
    capacity: 10, walking_level: 1, accessibility_note: "", contact_phone: "", registration_deadline: null,
    status: "published", created_at: "", updated_at: "",
  };
  const broadcasts = [
    { id: "b1", message: "舊的", created_at: "2026-10-12T01:00:00Z" },
    { id: "b2", message: "新的", created_at: "2026-10-12T02:00:00Z" },
  ];

  it("沒報名：看不到廣播", () => {
    const v = buildStudyTourView({ tour: row, stops: [], activeRegs: [], myRegs: [], myStamps: [], broadcasts, userId: "u" });
    expect(v.broadcasts).toEqual([]);
  });

  it("有報名：新的在前", () => {
    const v = buildStudyTourView({
      tour: row, stops: [], activeRegs: [], myStamps: [], broadcasts, userId: "u",
      myRegs: [{
        id: "r", tour_id: "t1", user_id: "u", registered_by: "u", participant_name: "王", participant_phone: "", party_size: 1,
        note: "", status: "confirmed", source: "app", completed_at: null, cancelled_at: null, created_at: "2026-10-01T00:00:00Z",
      }],
    });
    expect(v.broadcasts.map((b) => b.message)).toEqual(["新的", "舊的"]);
  });
});

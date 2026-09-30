import { describe, expect, it } from "vitest";
import {
  buildStudyTourView,
  buildTourPatch,
  csvCell,
  formatCertificateDate,
  formatTourDateRange,
  isPassportComplete,
  isRegistrationOpen,
  publicAppOrigin,
  tourShareUrl,
  isStampToken,
  isoToTaipeiInput,
  ownRegistration,
  registerSchema,
  registrationStatusLabel,
  seatsLabel,
  stampProgress,
  stampUrl,
  stampWindow,
  studyTourErrorFromDb,
  summarizeSeats,
  taipeiInputToIso,
  tourCreateSchema,
  tourTimeProblem,
  waitlistPositions,
  walkingLevelMeta,
  type StudyTourRegistrationRow,
  type StudyTourRow,
} from "./study-tours";
import { computeAchievementProgress, type UserStats } from "./achievements";
import { generateStampToken, rpcIdList, studyTourDbError } from "./study-tours-server";

const ME = "11111111-1111-4111-8111-111111111111";
const MOM = "22222222-2222-4222-8222-222222222222";

function tourRow(over: Partial<StudyTourRow> = {}): StudyTourRow {
  return {
    id: "t1",
    title: "鹿港老街文化小旅行",
    summary: "",
    description: "",
    organizer_name: "暖暖旅行社",
    cover_image_url: null,
    starts_at: "2026-10-12T00:30:00.000Z", // 台灣 10/12 08:30
    ends_at: "2026-10-12T08:00:00.000Z", // 台灣 10/12 16:00
    meeting_point: "彰化火車站",
    fee_text: "NT$980",
    capacity: 10,
    walking_level: 2,
    accessibility_note: "",
    contact_phone: "",
    registration_deadline: null,
    status: "published",
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-01T00:00:00.000Z",
    ...over,
  };
}

function reg(over: Partial<StudyTourRegistrationRow>): StudyTourRegistrationRow {
  return {
    id: "r",
    tour_id: "t1",
    user_id: ME,
    registered_by: ME,
    participant_name: "王阿嬤",
    participant_phone: "0912345678",
    party_size: 1,
    note: "",
    status: "confirmed",
    source: "app",
    completed_at: null,
    cancelled_at: null,
    created_at: "2026-09-10T00:00:00.000Z",
    ...over,
  };
}

describe("台灣時間轉換", () => {
  it("後台輸入的台灣時間 → ISO（UTC）", () => {
    expect(taipeiInputToIso("2026-10-12T08:30")).toBe("2026-10-12T00:30:00.000Z");
    expect(taipeiInputToIso("2026-10-12T00:10")).toBe("2026-10-11T16:10:00.000Z");
  });

  it("格式不對回 null", () => {
    expect(taipeiInputToIso("")).toBeNull();
    expect(taipeiInputToIso("2026/10/12 08:30")).toBeNull();
    expect(taipeiInputToIso("2026-13-40T99:99")).toBeNull();
  });

  it("ISO → 後台輸入框（來回一致）", () => {
    expect(isoToTaipeiInput("2026-10-11T16:10:00.000Z")).toBe("2026-10-12T00:10");
    expect(isoToTaipeiInput(taipeiInputToIso("2026-12-31T23:59"))).toBe("2026-12-31T23:59");
    expect(isoToTaipeiInput(null)).toBe("");
  });

  it("證書日期要有年份（台灣時間）", () => {
    expect(formatCertificateDate("2026-09-30T16:30:00.000Z")).toBe("2026 年 10 月 1 日");
  });

  it("同一天只寫一次日期；跨天兩邊都寫", () => {
    expect(formatTourDateRange("2026-10-12T00:30:00.000Z", "2026-10-12T08:00:00.000Z")).toBe("10月12日（一）08:30～16:00");
    expect(formatTourDateRange("2026-10-12T00:30:00.000Z", "2026-10-13T08:00:00.000Z")).toBe(
      "10月12日（一）08:30～10月13日（二）16:00"
    );
  });
});

describe("名額與候補", () => {
  it("正取人數含同行家人；候補不佔名額", () => {
    const s = summarizeSeats(10, [
      { status: "confirmed", party_size: 3 },
      { status: "confirmed", party_size: 4 },
      { status: "waitlisted", party_size: 2 },
      { status: "cancelled", party_size: 4 },
    ]);
    expect(s).toEqual({ confirmed_people: 7, waitlisted_people: 2, waitlist_count: 1, seats_left: 3 });
  });

  it("超額時剩餘名額不會變負數", () => {
    expect(summarizeSeats(2, [{ status: "confirmed", party_size: 3 }]).seats_left).toBe(0);
  });

  it("候補順位依報名先後", () => {
    const pos = waitlistPositions([
      { id: "b", status: "waitlisted", created_at: "2026-09-02T00:00:00Z" },
      { id: "a", status: "waitlisted", created_at: "2026-09-01T00:00:00Z" },
      { id: "c", status: "confirmed", created_at: "2026-08-01T00:00:00Z" },
    ]);
    expect(pos.get("a")).toBe(1);
    expect(pos.get("b")).toBe(2);
    expect(pos.has("c")).toBe(false);
  });

  it("名額文字", () => {
    expect(seatsLabel({ seats_left: 3, waitlist_count: 0 })).toBe("還有 3 個名額");
    expect(seatsLabel({ seats_left: 0, waitlist_count: 0 })).toBe("額滿，可以排候補");
    expect(seatsLabel({ seats_left: 0, waitlist_count: 2 })).toBe("額滿，已有 2 組在候補");
    expect(registrationStatusLabel({ status: "waitlisted", waitlist_position: 2 })).toBe("⏳ 候補第 2 位");
    expect(registrationStatusLabel({ status: "confirmed", waitlist_position: null })).toBe("✅ 報名成功");
  });
});

describe("報名／蓋章時間", () => {
  it("沒設截止就到出發為止；草稿不能報", () => {
    const t = tourRow();
    expect(isRegistrationOpen(t, new Date("2026-10-12T00:29:00Z"))).toBe(true);
    expect(isRegistrationOpen(t, new Date("2026-10-12T00:31:00Z"))).toBe(false);
    expect(isRegistrationOpen({ ...t, status: "draft" }, new Date("2026-10-01T00:00:00Z"))).toBe(false);
    expect(isRegistrationOpen({ ...t, registration_deadline: "2026-10-10T00:00:00Z" }, new Date("2026-10-11T00:00:00Z"))).toBe(false);
  });

  it("蓋章開放：出發前 3 小時～結束後 12 小時（和 SQL 一致）", () => {
    const w = stampWindow(tourRow());
    expect(w.opensAt.toISOString()).toBe("2026-10-11T21:30:00.000Z");
    expect(w.closesAt.toISOString()).toBe("2026-10-12T20:00:00.000Z");
  });

  it("時間檢查", () => {
    expect(tourTimeProblem({ starts_at: "2026-10-12T00:00:00Z", ends_at: "2026-10-11T00:00:00Z" })).toMatch(/結束/);
    expect(
      tourTimeProblem({ starts_at: "2026-10-12T00:00:00Z", ends_at: "2026-10-12T08:00:00Z", registration_deadline: "2026-10-13T00:00:00Z" })
    ).toMatch(/截止/);
    expect(tourTimeProblem({ starts_at: "2026-10-12T00:00:00Z", ends_at: "2026-10-12T08:00:00Z" })).toBeNull();
  });
});

describe("QR 集章", () => {
  it("代碼格式：伺服器產生的一定合法，亂打的不行", () => {
    const token = generateStampToken();
    expect(token).toHaveLength(22);
    expect(isStampToken(token)).toBe(true);
    expect(generateStampToken()).not.toBe(token);
    expect(isStampToken("short")).toBe(false);
    expect(isStampToken("../../etc/passwd-xxxxxxxx")).toBe(false);
    expect(isStampToken(123)).toBe(false);
  });

  it("分享／QR 用正式網址；App 裡的 localhost 不能拿來分享", () => {
    expect(publicAppOrigin("https://nuan55.com/", "http://localhost")).toBe("https://nuan55.com");
    expect(publicAppOrigin(undefined, "https://preview.vercel.app/")).toBe("https://preview.vercel.app");
    expect(publicAppOrigin("nuan55.com", "http://localhost:3000")).toBe("http://localhost:3000");
    expect(tourShareUrl("https://nuan55.com", "t 1")).toBe("https://nuan55.com/?open=study-tours&tour=t%201");
  });

  it("集滿以目前站點為準（後台加站後要補蓋）", () => {
    const stop = (stamped: boolean) => ({ stamped_at: stamped ? "2026-10-12T01:00:00Z" : null });
    expect(isPassportComplete({ stops: [] } as never)).toBe(false);
    expect(isPassportComplete({ stops: [stop(true), stop(true)] } as never)).toBe(true);
    expect(isPassportComplete({ stops: [stop(true), stop(true), stop(false)] } as never)).toBe(false);
  });

  it("QR 網址", () => {
    expect(stampUrl("https://nuan55.com/", "abcDEF_-1234567890xyz")).toBe("https://nuan55.com/?stamp=abcDEF_-1234567890xyz");
  });

  it("SQL 錯誤代碼 → 中文訊息；其他錯誤 → 500", () => {
    expect(studyTourErrorFromDb("stamp_too_early")).toEqual({ status: 409, message: expect.stringContaining("出發當天") });
    expect(studyTourErrorFromDb("already_registered")?.status).toBe(409);
    expect(studyTourErrorFromDb("something else")).toBeNull();
    expect(studyTourDbError({ message: "connection reset" })).toEqual({ status: 500, message: "伺服器忙線中，請稍後再試" });
    expect(studyTourDbError({ message: "invalid_token" }).status).toBe(404);
  });

  it("SQL 函式回傳的 id 清單兩種格式都吃", () => {
    expect(rpcIdList(["a", "b"])).toEqual(["a", "b"]);
    expect(rpcIdList([{ study_tour_cancel: "a" }])).toEqual(["a"]);
    expect(rpcIdList(null)).toEqual([]);
  });
});

describe("表單驗證", () => {
  it("報名要有名字和電話，人數 1～4", () => {
    const ok = registerSchema.parse({ participant_name: " 王阿嬤 ", participant_phone: "0912-345-678", party_size: 2 });
    expect(ok).toMatchObject({ participant_name: "王阿嬤", note: "" });
    expect(registerSchema.safeParse({ participant_name: "王", participant_phone: "123", party_size: 1 }).success).toBe(false);
    expect(registerSchema.safeParse({ participant_name: "", participant_phone: "0912345678", party_size: 1 }).success).toBe(false);
    expect(registerSchema.safeParse({ participant_name: "王", participant_phone: "0912345678", party_size: 5 }).success).toBe(false);
    expect(registerSchema.safeParse({ participant_name: "王", participant_phone: "0912345678", party_size: 1, for_user_id: "x" }).success).toBe(false);
    expect(registerSchema.safeParse({ participant_name: "王", participant_phone: "0912345678", party_size: 1, for_user_id: MOM }).success).toBe(true);
  });

  it("建立活動要有標題與時間；封面網址擋 javascript:", () => {
    expect(tourCreateSchema.safeParse({ title: "x", starts_at: "2026-10-12T00:00:00Z", ends_at: "2026-10-12T08:00:00Z" }).success).toBe(true);
    expect(tourCreateSchema.safeParse({ title: "x", starts_at: "nope", ends_at: "2026-10-12T08:00:00Z" }).success).toBe(false);
    expect(
      tourCreateSchema.safeParse({ title: "x", starts_at: "2026-10-12T00:00:00Z", ends_at: "2026-10-12T08:00:00Z", cover_image_url: "javascript:alert(1)" }).success
    ).toBe(false);
  });

  it("只更新有送來的欄位；清空封面 → null", () => {
    const patch = buildTourPatch({ capacity: 30, cover_image_url: "" }, "NOW");
    expect(patch).toEqual({ updated_at: "NOW", capacity: 30, cover_image_url: null });
  });

  it("CSV 欄位：逗號、引號要包起來；公式開頭要加 '", () => {
    expect(csvCell("王阿嬤")).toBe("王阿嬤");
    expect(csvCell('吃素, 要"輪椅"')).toBe('"吃素, 要""輪椅"""');
    expect(csvCell("=HYPERLINK(1)")).toBe("'=HYPERLINK(1)");
    expect(csvCell(null)).toBe("");
  });

  it("走路量未知時當輕鬆", () => {
    expect(walkingLevelMeta(3).label).toBe("走路較多");
    expect(walkingLevelMeta(99).level).toBe(1);
  });
});

describe("長輩畫面資料", () => {
  const stops = [
    { id: "s2", tour_id: "t1", position: 2, name: "天后宮", description: "媽祖廟", fun_fact: "有三百多年歷史", stamp_emoji: "⛩️" },
    { id: "s1", tour_id: "t1", position: 1, name: "九曲巷", description: "彎彎的巷子", fun_fact: "彎曲是為了擋東北季風", stamp_emoji: "🏮" },
  ];

  it("站點依順序；小知識蓋章後才給看", () => {
    const view = buildStudyTourView({
      tour: tourRow(),
      stops,
      activeRegs: [],
      myRegs: [],
      myStamps: [{ tour_id: "t1", stop_id: "s1", user_id: ME, stamped_at: "2026-10-12T01:00:00Z" }],
      userId: ME,
      now: new Date("2026-10-12T01:00:00Z"),
    });
    expect(view.stops.map((s) => s.name)).toEqual(["九曲巷", "天后宮"]);
    expect(view.stops[0]).toMatchObject({ stamped_at: "2026-10-12T01:00:00Z", fun_fact: "彎曲是為了擋東北季風" });
    expect(view.stops[1]).toMatchObject({ stamped_at: null, fun_fact: null });
    expect(stampProgress(view)).toEqual({ stamped: 1, total: 2 });
    expect(view.registration_open).toBe(false); // 已經出發
    expect(JSON.stringify(view)).not.toContain("stamp_token");
  });

  it("我的報名：自己的排前面、候補順位、幫家人報的標示出來", () => {
    const mine = reg({ id: "r-me", status: "waitlisted", created_at: "2026-09-05T00:00:00Z" });
    const mom = reg({ id: "r-mom", user_id: MOM, participant_name: "媽媽", party_size: 2, created_at: "2026-09-01T00:00:00Z" });
    const view = buildStudyTourView({
      tour: tourRow({ capacity: 2 }),
      stops: [],
      activeRegs: [
        { id: "r-mom", status: "confirmed", party_size: 2, created_at: "2026-09-01T00:00:00Z" },
        { id: "other", status: "waitlisted", party_size: 1, created_at: "2026-09-02T00:00:00Z" },
        { id: "r-me", status: "waitlisted", party_size: 1, created_at: "2026-09-05T00:00:00Z" },
      ],
      myRegs: [mom, mine],
      myStamps: [],
      userId: ME,
      now: new Date("2026-10-01T00:00:00Z"),
    });
    expect(view.seats_left).toBe(0);
    expect(view.waitlist_count).toBe(2);
    expect(view.registrations.map((r) => [r.id, r.for_self, r.waitlist_position])).toEqual([
      ["r-me", true, 2],
      ["r-mom", false, null],
    ]);
    expect(ownRegistration(view)?.id).toBe("r-me");
    expect(view.registrations[1].participant_user_id).toBe(MOM);
  });
});

describe("研學團成就", () => {
  const base: UserStats = {
    total_meals: 0, meal_streak: 0, longest_meal_streak: 0, total_exercise_minutes: 0, total_exercises: 0,
    total_metrics: 0, bp_records_last_7days: 0, prescription_scans: 0, voice_sessions: 0, family_count: 0,
  };
  const find = (stats: UserStats, id: string) => computeAchievementProgress(stats).find((a) => a.achievement.id === id)!;

  it("舊資料沒有研學欄位時不會壞", () => {
    expect(find(base, "first_tour_stamp").unlocked).toBe(false);
  });

  it("蓋第一個章、結業一團、結業三團", () => {
    const s = { ...base, tour_stamps: 4, tours_completed: 1 };
    expect(find(s, "first_tour_stamp").unlocked).toBe(true);
    expect(find(s, "tour_graduate").unlocked).toBe(true);
    expect(find(s, "tour_graduate_3")).toMatchObject({ unlocked: false, progress_text: "1/3 團" });
  });
});

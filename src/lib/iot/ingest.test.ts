import { describe, it, expect, vi, beforeEach } from "vitest";

// 攔截寄信，避免測試真的送出 email
interface EmailArgs { to: string; subject: string; html: string }
const sendEmailMock = vi.fn(async (_args: EmailArgs) => ({ ok: true }));
vi.mock("@/lib/email/send", () => ({
  sendEmail: (args: EmailArgs) => sendEmailMock(args),
}));

import { ingestIoTEvent } from "./ingest";

interface Options {
  /** 已接受且開啟提醒的家人數 */
  familyWithAlerts?: number;
  /** 已接受但關閉提醒的家人數（不該收到通知） */
  familyWithoutAlerts?: number;
}

/** 記錄所有寫入，方便斷言 */
interface Captured {
  events: Record<string, unknown>[];
  alerts: Record<string, unknown>[];
  deviceUpdates: Record<string, unknown>[];
}

function fakeAdmin(opts: Options = {}) {
  const captured: Captured = { events: [], alerts: [], deviceUpdates: [] };
  const links = [
    ...Array.from({ length: opts.familyWithAlerts ?? 0 }, (_, i) => ({
      family_user_id: `fam-on-${i}`, family_name: `子女${i}`, permissions: { alerts: true },
    })),
    ...Array.from({ length: opts.familyWithoutAlerts ?? 0 }, (_, i) => ({
      family_user_id: `fam-off-${i}`, family_name: `親戚${i}`, permissions: { alerts: false },
    })),
  ];

  const supabase = {
    from(table: string) {
      const builder: Record<string, unknown> = {};
      let inserted: Record<string, unknown> | null = null;
      Object.assign(builder, {
        insert: (row: Record<string, unknown>) => {
          inserted = row;
          if (table === "iot_events") captured.events.push(row);
          if (table === "alerts") captured.alerts.push(row);
          return builder;
        },
        update: (row: Record<string, unknown>) => {
          if (table === "iot_devices") captured.deviceUpdates.push(row);
          return builder;
        },
        select: () => builder,
        eq: () => builder,
        single: () => builder,
        then: (resolve: (v: { data: unknown }) => void) => {
          if (table === "profiles") return resolve({ data: { display_name: "陳美玲" } });
          if (table === "family_links") return resolve({ data: links });
          if (table === "iot_events") return resolve({ data: { id: "evt-1", ...inserted } });
          return resolve({ data: null });
        },
      });
      return builder;
    },
    auth: {
      admin: {
        getUserById: async (id: string) => ({ data: { user: { email: `${id}@example.com` } } }),
      },
    },
  };

  return { supabase, captured };
}

const ingest = (
  eventKind: string,
  data: Record<string, unknown> = {},
  opts: Options = { familyWithAlerts: 1 }
) => {
  const { supabase, captured } = fakeAdmin(opts);
  return ingestIoTEvent(supabase as never, {
    userId: "elder-1",
    deviceId: "dev-1",
    eventKind: eventKind as never,
    data,
  }).then((res) => ({ res, captured }));
};

beforeEach(() => sendEmailMock.mockClear());

describe("ingestIoTEvent — 事件一律記錄", () => {
  it("即使是不需通知的事件也會寫入 iot_events", async () => {
    const { res, captured } = await ingest("activity");
    expect(captured.events).toHaveLength(1);
    expect(captured.events[0].event_kind).toBe("activity");
    expect(res.alerted).toBe(false);
  });

  it("有裝置 id 時同步更新裝置最後狀態", async () => {
    const { captured } = await ingest("activity");
    expect(captured.deviceUpdates).toHaveLength(1);
    expect(captured.deviceUpdates[0]).toHaveProperty("last_event_at");
  });
});

describe("緊急事件 → 通知家人", () => {
  it("跌倒：critical、寫入警報、寄信給家人", async () => {
    const { res, captured } = await ingest("fall");
    expect(res.alerted).toBe(true);
    expect(captured.alerts).toHaveLength(1);
    expect(captured.alerts[0].severity).toBe("critical");
    expect(captured.alerts[0].alert_type).toBe("fall");
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
  });

  it("SOS 求助：critical", async () => {
    const { captured } = await ingest("sos");
    expect(captured.alerts[0].severity).toBe("critical");
    expect(captured.alerts[0].title).toBe("緊急求助");
  });

  it("信件主旨帶長輩名字，家人一眼知道是誰", async () => {
    await ingest("fall");
    const arg = sendEmailMock.mock.calls[0][0];
    expect(arg.subject).toContain("陳美玲");
    expect(arg.to).toContain("@");
  });

  it("多位家人都會收到通知", async () => {
    const { captured } = await ingest("fall", {}, { familyWithAlerts: 3 });
    expect(sendEmailMock).toHaveBeenCalledTimes(3);
    expect((captured.alerts[0].notified_family as unknown[]).length).toBe(3);
  });
});

describe("隱私：只通知有授權的家人", () => {
  it("關閉健康提醒的家人不會收到信", async () => {
    await ingest("fall", {}, { familyWithAlerts: 1, familyWithoutAlerts: 2 });
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
  });

  it("沒有任何授權家人時，仍記錄警報但不寄信", async () => {
    const { captured } = await ingest("fall", {}, { familyWithAlerts: 0, familyWithoutAlerts: 1 });
    expect(captured.alerts).toHaveLength(1);
    expect(sendEmailMock).not.toHaveBeenCalled();
  });
});

describe("離床過久", () => {
  it("視為 warning 並帶入實際分鐘數", async () => {
    const { captured } = await ingest("leave_bed", { duration_min: 45 });
    expect(captured.alerts[0].severity).toBe("warning");
    expect(captured.alerts[0].message).toContain("45");
  });
});

describe("環境溫度", () => {
  it("過熱 → 提醒（中暑風險）", async () => {
    const { captured } = await ingest("environment", { temp: 31 });
    expect(captured.alerts[0].title).toBe("室內溫度過高");
  });

  it("過冷 → 提醒保暖", async () => {
    const { captured } = await ingest("environment", { temp: 10 });
    expect(captured.alerts[0].title).toBe("室內溫度過低");
  });

  it("舒適溫度不打擾家人", async () => {
    const { res, captured } = await ingest("environment", { temp: 25 });
    expect(res.alerted).toBe(false);
    expect(captured.alerts).toHaveLength(0);
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("沒有溫度資料時不誤判", async () => {
    const { res } = await ingest("environment", {});
    expect(res.alerted).toBe(false);
  });
});

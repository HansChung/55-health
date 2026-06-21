// ────────────────────────────────────────────────
// IoT 感測整合 — 共用型別（與來源無關）
// LifeSmart adapter 未來實作同一組型別即可無痛替換
// ────────────────────────────────────────────────

export type DeviceKind = "presence" | "bed" | "sos" | "env";

export type EventKind =
  | "activity" // 偵測到活動（正常作息）
  | "fall" // 跌倒
  | "sos" // 緊急求助鈕
  | "leave_bed" // 夜間離床過久
  | "in_bed" // 回到床上
  | "environment"; // 環境讀數（溫濕度 / 空氣品質）

export type Severity = "info" | "warning" | "critical";

export interface IoTDevice {
  id: string;
  user_id: string;
  external_id: string | null;
  kind: DeviceKind;
  name: string;
  room: string | null;
  source: "mock" | "lifesmart";
  last_state: Record<string, unknown>;
  last_event_at: string | null;
  created_at: string;
}

export interface IoTEvent {
  id: string;
  user_id: string;
  device_id: string | null;
  event_kind: EventKind;
  severity: Severity;
  data: Record<string, unknown>;
  occurred_at: string;
  source: string;
  created_at: string;
}

/** 串接來源的抽象介面 — 模擬器與 LifeSmart adapter 都實作這個 */
export interface IoTSource {
  readonly name: string;
  /** 取得某長輩目前的裝置清單 */
  listDevices(userId: string): Promise<Partial<IoTDevice>[]>;
}

export const DEVICE_META: Record<DeviceKind, { label: string; icon: string; defaultRoom: string }> = {
  presence: { label: "人體存在感測器", icon: "🚶", defaultRoom: "客廳" },
  bed: { label: "智慧床墊", icon: "🛏️", defaultRoom: "臥室" },
  sos: { label: "緊急求助鈕", icon: "🆘", defaultRoom: "浴室" },
  env: { label: "環境感測器", icon: "🌡️", defaultRoom: "客廳" },
};

export const EVENT_META: Record<EventKind, { label: string; icon: string }> = {
  activity: { label: "偵測到活動", icon: "🚶" },
  fall: { label: "偵測到跌倒", icon: "🚨" },
  sos: { label: "緊急求助", icon: "🆘" },
  leave_bed: { label: "夜間離床過久", icon: "🌙" },
  in_bed: { label: "回到床上", icon: "🛏️" },
  environment: { label: "環境讀數", icon: "🌡️" },
};

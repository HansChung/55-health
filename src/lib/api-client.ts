/**
 * 前端 API 客戶端 — 統一處理 fetch 邏輯
 * 在 Capacitor 環境用 NEXT_PUBLIC_API_URL 指向後端
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

interface FetchOptions extends RequestInit {
  json?: unknown;
  /** 逾時毫秒數，預設 15 秒。網路掛起時不會無限等待 */
  timeoutMs?: number;
  /** 額外重試次數（僅對 GET 生效），預設 GET=2、其他=0。重試只發生在網路錯誤/逾時/5xx，不重試 4xx */
  retries?: number;
}

export class ApiError extends Error {
  status: number;
  data: unknown;
  /** 是否為網路/逾時等「連線層」錯誤（非伺服器回應的業務錯誤） */
  isNetwork: boolean;
  constructor(message: string, opts: { status?: number; data?: unknown; isNetwork?: boolean } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = opts.status ?? 0;
    this.data = opts.data ?? null;
    this.isNetwork = opts.isNetwork ?? false;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { json, headers, timeoutMs = 15000, retries, ...rest } = options;
  const method = (rest.method ?? "GET").toUpperCase();
  // 預設：只有 GET 自動重試（POST/PATCH/DELETE 重試可能造成重複寫入，不安全）
  const maxRetries = retries ?? (method === "GET" ? 2 : 0);

  const init: RequestInit = {
    ...rest,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };
  if (json !== undefined) init.body = JSON.stringify(json);

  let lastError: ApiError | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(`${API_BASE}${path}`, { ...init, signal: controller.signal });
      clearTimeout(timer);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const apiErr = new ApiError(data?.error || `HTTP ${res.status}`, {
          status: res.status,
          data,
        });
        // 4xx 是用戶端錯誤（如未登入、配額用完），重試無意義 → 直接拋
        if (res.status < 500) throw apiErr;
        // 5xx 伺服器錯誤 → 記下來，可重試
        lastError = apiErr;
      } else {
        return data as T;
      }
    } catch (e) {
      clearTimeout(timer);
      // 已是業務錯誤（4xx）直接往外拋，不重試
      if (e instanceof ApiError && !e.isNetwork && e.status >= 400 && e.status < 500) {
        throw e;
      }
      // AbortError（逾時）或 fetch 連線失敗 → 視為網路錯誤，可重試
      const isTimeout = e instanceof DOMException && e.name === "AbortError";
      lastError = new ApiError(
        isTimeout ? "連線逾時" : "網路連線失敗",
        { isNetwork: true }
      );
    }

    // 還有重試機會 → 指數退避（0.5s、1s）後再試
    if (attempt < maxRetries) {
      await sleep(500 * Math.pow(2, attempt));
    }
  }

  throw lastError ?? new ApiError("網路連線失敗", { isNetwork: true });
}

export const api = {
  // AI
  analyzeFood: (imageBase64: string, mimeType?: string) =>
    apiFetch<{
      result: import("./ai/gemini").FoodAnalysisResult;
      quota: { used: number; limit: number; tier: string };
    }>("/api/ai/analyze-food", { method: "POST", json: { imageBase64, mimeType } }),

  createRealtimeSession: () =>
    apiFetch<{
      session: { client_secret: { value: string }; id: string; model?: string };
      quota: { used: number; limit: number; tier: string };
      max_seconds: number;
    }>("/api/ai/realtime-session", { method: "POST" }),

  trackRealtimeUsage: (input: { seconds: number; model?: string; session_id?: string; reason?: "manual" | "time_limit" | "close" | "unload" | "error" }) =>
    apiFetch<{ ok: true; id: string; seconds: number; cost_usd: number }>("/api/ai/realtime-usage", {
      method: "POST",
      json: input,
    }),

  getSuggestion: () =>
    apiFetch<{ suggestion: AiSuggestion }>("/api/ai/suggest"),

  // Family
  listFamily: () =>
    apiFetch<{ family: FamilyLink[] }>("/api/family"),

  inviteFamily: (input: { family_name: string; relationship: string; permissions?: FamilyPermissions }) =>
    apiFetch<{ link: FamilyLink }>("/api/family", { method: "POST", json: input }),

  updateFamily: (id: string, patch: { permissions?: FamilyPermissions; status?: "pending" | "accepted" | "revoked" }) =>
    apiFetch<{ link: FamilyLink }>(`/api/family/${id}`, { method: "PATCH", json: patch }),

  removeFamily: (id: string) =>
    apiFetch<{ ok: true }>(`/api/family/${id}`, { method: "DELETE" }),

  // Alerts（異常預警守護紀錄）
  listAlerts: (params?: { elderId?: string; unresolved?: boolean }) => {
    const q = new URLSearchParams();
    if (params?.elderId) q.set("elder", params.elderId);
    if (params?.unresolved) q.set("unresolved", "1");
    const qs = q.toString();
    return apiFetch<{ alerts: PersistedAlert[] }>(`/api/alerts${qs ? `?${qs}` : ""}`);
  },

  resolveAlert: (id: string) =>
    apiFetch<{ alert: PersistedAlert }>(`/api/alerts/${id}`, { method: "PATCH" }),

  // SMART RADAR / SHI 檢測
  listSmartAssessments: () =>
    apiFetch<{ assessments: SmartAssessment[] }>("/api/smart-assessment"),

  submitSmartAssessment: (answers: number[]) =>
    apiFetch<{ assessment: SmartAssessment; previous_shi: number | null; delta: number | null }>(
      "/api/smart-assessment",
      { method: "POST", json: { answers } }
    ),

  // 子女／家人儀表板
  familyOverview: () =>
    apiFetch<{ elders: ElderOverview[] }>("/api/family/overview"),

  // IoT 居家感測
  listIotDevices: () =>
    apiFetch<{ devices: IotDevice[] }>("/api/iot/devices"),

  listIotEvents: () =>
    apiFetch<{ events: IotEvent[] }>("/api/iot/events"),

  simulateIotEvent: (eventKind: string) =>
    apiFetch<{ ok: true; alerted: boolean; notified?: number }>("/api/iot/simulate", {
      method: "POST",
      json: { eventKind },
    }),

  // Conversations（語音對話記錄）
  listConversations: (params?: { sessionId?: string; days?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.sessionId) q.set("session_id", params.sessionId);
    if (params?.days) q.set("days", String(params.days));
    if (params?.limit) q.set("limit", String(params.limit));
    return apiFetch<{ messages: ConversationMessage[] }>(`/api/conversations?${q}`);
  },

  logConversation: (input: {
    role: "user" | "assistant" | "system";
    content: string;
    session_id?: string;
    audio_url?: string | null;
  }) =>
    apiFetch<{ message: { id: string; session_id: string | null; created_at: string } }>(
      "/api/conversations",
      { method: "POST", json: input }
    ),

  // Health metrics
  listMetrics: (type?: "weight" | "blood_pressure" | "blood_glucose", days = 30) => {
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    params.set("days", String(days));
    return apiFetch<{ metrics: HealthMetric[] }>(`/api/health-metrics?${params}`);
  },

  createMetric: (input: Partial<HealthMetric>) =>
    apiFetch<{ metric: HealthMetric }>("/api/health-metrics", { method: "POST", json: input }),

  deleteMetric: (id: string) =>
    apiFetch<{ ok: true }>(`/api/health-metrics/${id}`, { method: "DELETE" }),

  getWeeklyReport: () =>
    apiFetch<{ report: WeeklyReport }>("/api/reports/weekly"),

  analyzePrescription: (imageBase64: string, mimeType?: string) =>
    apiFetch<{ result: PrescriptionResult }>("/api/ai/analyze-prescription", {
      method: "POST",
      json: { imageBase64, mimeType },
    }),

  // Profile
  getProfile: () =>
    apiFetch<{ profile: ProfileData }>("/api/profile"),

  updateProfile: (patch: Partial<ProfileData>) =>
    apiFetch<{ profile: ProfileData }>("/api/profile", { method: "PATCH", json: patch }),

  // Meals
  listMeals: (days = 7) =>
    apiFetch<{ meals: MealRecord[] }>(`/api/meals?days=${days}`),

  createMeal: (meal: Partial<MealRecord>) =>
    apiFetch<{ meal: MealRecord }>("/api/meals", { method: "POST", json: meal }),

  deleteMeal: (id: string) =>
    apiFetch<{ ok: true }>(`/api/meals/${id}`, { method: "DELETE" }),

  // Exercises
  listExercises: (days = 7) =>
    apiFetch<{ exercises: ExerciseRecord[] }>(`/api/exercises?days=${days}`),

  createExercise: (ex: Partial<ExerciseRecord>) =>
    apiFetch<{ exercise: ExerciseRecord | null; duplicate?: boolean }>("/api/exercises", { method: "POST", json: ex }),

  // Admin
  adminUsageSummary: (days = 30) =>
    apiFetch<AdminUsageSummary>(`/api/admin/usage?days=${days}`),

  adminTelemetry: (days = 7) =>
    apiFetch<AdminTelemetry>(`/api/admin/telemetry?days=${days}`),

  adminListBrands: () =>
    apiFetch<{ brands: BrandRow[] }>("/api/admin/brands"),
  adminCreateBrand: (input: Partial<BrandRow> & { id: string; host: string; app_name: string }) =>
    apiFetch<{ brand: BrandRow }>("/api/admin/brands", { method: "POST", json: input }),
  adminUpdateBrand: (id: string, patch: Partial<BrandRow>) =>
    apiFetch<{ brand: BrandRow }>(`/api/admin/brands/${id}`, { method: "PATCH", json: patch }),
  adminDeleteBrand: (id: string) =>
    apiFetch<{ ok: true }>(`/api/admin/brands/${id}`, { method: "DELETE" }),

  adminListUsers: () =>
    apiFetch<{ users: AdminUserRow[] }>("/api/admin/users"),

  adminUpdateUser: (userId: string, patch: Partial<AdminUserRow>) =>
    apiFetch<{ user: AdminUserRow }>(`/api/admin/users/${userId}`, {
      method: "PATCH",
      json: patch,
    }),

  adminListApiConfigs: () =>
    apiFetch<{ configs: ApiConfigRow[] }>("/api/admin/api-configs"),

  // Admin: conversations
  adminListConversationSessions: (params?: { days?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.days) q.set("days", String(params.days));
    if (params?.limit) q.set("limit", String(params.limit));
    return apiFetch<{ sessions: AdminConversationSession[] }>(`/api/admin/conversations?${q}`);
  },

  adminGetConversationSession: (sessionId: string) =>
    apiFetch<{ messages: ConversationMessage[]; user_email: string | null; user_name: string | null }>(
      `/api/admin/conversations?session_id=${encodeURIComponent(sessionId)}`
    ),

  adminListPartnerCampaigns: () =>
    apiFetch<{ campaigns: AdminPartnerCampaign[] }>("/api/admin/partner-campaigns"),

  adminCreatePartnerCampaign: (input: Partial<AdminPartnerCampaign>) =>
    apiFetch<{ campaign: AdminPartnerCampaign }>("/api/admin/partner-campaigns", { method: "POST", json: input }),

  adminUpdatePartnerCampaign: (id: string, patch: Partial<AdminPartnerCampaign>) =>
    apiFetch<{ campaign: AdminPartnerCampaign }>(`/api/admin/partner-campaigns/${id}`, { method: "PATCH", json: patch }),

  adminDeletePartnerCampaign: (id: string) =>
    apiFetch<{ ok: true }>(`/api/admin/partner-campaigns/${id}`, { method: "DELETE" }),

  listPartnerCampaigns: () =>
    apiFetch<{ campaigns: PartnerCampaign[] }>("/api/partner-campaigns"),

  trackPartnerCampaign: (id: string, event_type: "impression" | "click") =>
    apiFetch<{ ok: true }>(`/api/partner-campaigns/${id}/track`, { method: "POST", json: { event_type } }),

  // Favorite meals
  listFavoriteMeals: () =>
    apiFetch<{ favorites: FavoriteMeal[] }>("/api/favorite-meals"),

  createFavoriteMeal: (input: Partial<FavoriteMeal>) =>
    apiFetch<{ favorite: FavoriteMeal }>("/api/favorite-meals", { method: "POST", json: input }),

  deleteFavoriteMeal: (id: string) =>
    apiFetch<{ ok: true }>(`/api/favorite-meals/${id}`, { method: "DELETE" }),

  // Achievements
  getAchievements: () =>
    apiFetch<AchievementsResponse>("/api/achievements"),
};

// ─────── Types ───────
export interface ProfileData {
  id: string;
  display_name: string | null;
  age: number | null;
  gender: "male" | "female" | "other" | null;
  height_cm: number | null;
  weight_kg: number | null;
  calorie_goal: number;
  voice_tone: "warm" | "strict" | "grandchild";
  font_scale: "base" | "lg";
  high_contrast: boolean;
  chronic_conditions: string[];
  medications: ProfileMedication[];
  notification_settings?: NotificationSettings;
  emergency_contact?: EmergencyContact | null;
  subscription_tier: "free" | "basic" | "pro";
  is_admin: boolean;
}

export interface EmergencyContact {
  name: string;
  phone: string;
}

export interface ProfileMedication {
  name: string;
  dose?: string;
  time?: string;
  english_name?: string;
  purpose?: string;
  warnings?: string[];
  side_effects?: string[];
  added_at?: string;
  photo_url?: string;
  reminder_enabled?: boolean;
  reminder_times?: string[];
  taken_today?: boolean;
  last_taken_at?: string;
}

export interface NotificationSettings {
  meal_breakfast?: { on: boolean; time: string };
  meal_lunch?: { on: boolean; time: string };
  meal_dinner?: { on: boolean; time: string };
  water?: { on: boolean; interval_hours: number };
  walk?: { on: boolean; time: string };
  blood_pressure?: { on: boolean; times: string[] };
  family_alerts?: { on: boolean };
}

export interface AiSuggestion {
  headline: string;
  reason: string;
  recommendations: { name: string; emoji: string; cal: number; color: string }[];
}

export interface FamilyPermissions {
  calories?: boolean;
  alerts?: boolean;
  diary?: boolean;
  voice?: boolean;
}

/** 子女儀表板：單一長輩狀態總覽 */
export interface ElderOverview {
  elder_id: string;
  name: string;
  relationship: string;
  permissions: Record<string, boolean>;
  overall: "normal" | "attention" | "alert";
  meals: { logged: number; lastAt: string | null } | null;
  meds: { total: number; taken: number } | null;
  bp: { systolic: number; diastolic: number; at: string } | null;
  glucose: { value: number; at: string } | null;
  alerts_unresolved: number;
  latest_alert: { title: string; severity: string; created_at: string } | null;
  iot: { lastActivityAt: string | null; temp: number | null; recentCritical: boolean } | null;
  shi: number | null;
}

/** 白標品牌（管理員） */
export interface BrandRow {
  id: string;
  host: string;
  app_name: string;
  tagline: string | null;
  primary_color: string;
  primary_deep: string;
  primary_soft: string;
  logo_emoji: string | null;
  active: boolean;
  created_at: string;
}

/** 管理員遙測總覽 */
export interface AdminTelemetry {
  days: number;
  total_events: number;
  active_users: number;
  error_count: number;
  usage: { name: string; count: number; users: number }[];
  top_errors: { message: string; count: number }[];
  recent_errors: { name: string; message: string; path: string | null; at: string }[];
}

/** IoT 居家感測裝置 */
export interface IotDevice {
  id: string;
  user_id: string;
  external_id: string | null;
  kind: "presence" | "bed" | "sos" | "env";
  name: string;
  room: string | null;
  source: "mock" | "lifesmart";
  last_state: Record<string, unknown>;
  last_event_at: string | null;
  created_at: string;
}

/** IoT 感測事件 */
export interface IotEvent {
  id: string;
  user_id: string;
  device_id: string | null;
  event_kind: "activity" | "fall" | "sos" | "leave_bed" | "in_bed" | "environment";
  severity: "info" | "warning" | "critical";
  data: Record<string, unknown>;
  occurred_at: string;
  source: string;
  created_at: string;
}

/** SMART RADAR / SHI 檢測記錄 */
export interface SmartAssessment {
  id: string;
  user_id: string;
  score_s: number;
  score_m: number;
  score_a: number;
  score_r: number;
  score_t: number;
  shi: number;
  answers: number[];
  created_at: string;
}

/** 後端 cron 偵測寫入的異常警報記錄（已通知家人） */
export interface PersistedAlert {
  id: string;
  elder_id: string;
  alert_type:
    | "inactivity"
    | "blood_pressure"
    | "blood_glucose"
    | "weight_change"
    | "missed_medication";
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  metadata: Record<string, unknown>;
  notified_family: { family_id: string; email: string; sent_at: string }[];
  resolved: boolean;
  resolved_at: string | null;
  created_at: string;
}

export interface PrescriptionResult {
  medications: {
    name: string;
    english_name?: string | null;
    dose?: string | null;
    frequency?: string | null;
    timing?: string | null;
    duration?: string | null;
    purpose?: string | null;
    warnings?: string[] | null;
    side_effects?: string[] | null;
  }[];
  summary?: string;
}

export interface HealthMetric {
  id: string;
  user_id: string;
  metric_type: "weight" | "blood_pressure" | "blood_glucose";
  measured_at: string;
  weight_kg: number | null;
  systolic: number | null;
  diastolic: number | null;
  pulse: number | null;
  glucose_mg_dl: number | null;
  glucose_context: "fasting" | "before_meal" | "after_meal" | "bedtime" | null;
  notes: string | null;
}

export interface WeeklyReport {
  range: { from: string; to: string };
  meals: {
    days_logged: number;
    meals_count: number;
    total_calories: number;
    avg_calories: number;
    protein_g: number;
    carb_g: number;
    fat_g: number;
  };
  exercise: {
    minutes: number;
    kcal_burned: number;
  };
  health: {
    weight: { latest: number | null; change: number | null } | null;
    blood_pressure: { systolic: number | null; diastolic: number | null; status: string } | null;
    blood_glucose: { value: number | null; status: string } | null;
  };
  tips: string[];
  family_summary?: string[];
}

export interface FamilyLink {
  id: string;
  owner_id: string;
  family_user_id: string | null;
  family_name: string;
  relationship: string;
  invite_code: string | null;
  invite_expires_at: string | null;
  permissions: FamilyPermissions;
  status: "pending" | "accepted" | "revoked";
  created_at: string;
}

export interface MealRecord {
  id: string;
  user_id: string;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  eaten_at: string;
  photo_url?: string | null;
  items: { name: string; amount?: string; cal: number; emoji?: string; color?: string }[];
  total_cal: number;
  protein_g: number;
  carb_g: number;
  fat_g: number;
  portion: number;
  notes: string | null;
}

export interface FavoriteMeal {
  id: string;
  user_id: string;
  name: string;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  items: { name: string; amount?: string; cal: number; emoji?: string; color?: string }[];
  total_cal: number;
  protein_g: number;
  carb_g: number;
  fat_g: number;
  created_at: string;
}

export interface ExerciseRecord {
  id: string;
  user_id: string;
  exercise_type: string;
  minutes: number;
  kcal_burned: number;
  performed_at: string;
  /** 資料來源：手動記錄 or 從 Apple 健康 / Health Connect 同步 */
  source?: "manual" | "health";
  /** 健康平台上的唯一 ID（去重用） */
  external_id?: string | null;
}

export interface AdminUsageSummary {
  totalCostUsd: number;
  byService: { service: string; count: number; cost: number; tokens: number }[];
  daily: { date: string; cost: number; count: number }[];
  topUsers: { user_id: string; email: string | null; cost: number; count: number }[];
}

export interface AdminUserRow {
  id: string;
  email: string | null;
  display_name: string | null;
  subscription_tier: "free" | "basic" | "pro";
  subscription_expires_at: string | null;
  is_admin: boolean;
  created_at: string;
  meals_count?: number;
  ai_cost_30d?: number;
}

export interface AdminConversationSession {
  session_id: string | null;
  user_id: string;
  user_email: string | null;
  user_name: string | null;
  started_at: string;
  latest_at: string;
  message_count: number;
  user_message_count: number;
  preview: string;
}

export interface ApiConfigRow {
  id: string;
  provider: "gemini" | "openai" | "anthropic";
  model_default: string | null;
  enabled: boolean;
  monthly_budget_usd: number | null;
  notes: string | null;
  updated_at: string;
}

export interface ConversationMessage {
  id: string;
  user_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  audio_url: string | null;
  ai_usage_id: string | null;
  session_id: string | null;
  created_at: string;
}

export interface AchievementsResponse {
  stats: import("./achievements").UserStats;
  achievements: import("./achievements").AchievementProgress[];
  unlocked_count: number;
  total_count: number;
}

export interface PartnerCampaign {
  id: string;
  title: string;
  description: string;
  partner_name: string;
  cta_label: string | null;
  cta_url: string | null;
  image_url: string | null;
  tags: string[];
  disclaimer: string | null;
}

export interface AdminPartnerCampaign extends PartnerCampaign {
  priority: number;
  starts_at: string;
  ends_at: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  metrics?: { impressions: number; clicks: number };
}

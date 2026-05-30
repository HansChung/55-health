/**
 * 前端 API 客戶端 — 統一處理 fetch 邏輯
 * 在 Capacitor 環境用 NEXT_PUBLIC_API_URL 指向後端
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

interface FetchOptions extends RequestInit {
  json?: unknown;
}

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { json, headers, ...rest } = options;
  const init: RequestInit = {
    ...rest,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };
  if (json !== undefined) init.body = JSON.stringify(json);

  const res = await fetch(`${API_BASE}${path}`, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.error || `HTTP ${res.status}`) as Error & {
      status: number;
      data: unknown;
    };
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data as T;
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
    apiFetch<{ exercise: ExerciseRecord }>("/api/exercises", { method: "POST", json: ex }),

  // Admin
  adminUsageSummary: (days = 30) =>
    apiFetch<AdminUsageSummary>(`/api/admin/usage?days=${days}`),

  adminListUsers: () =>
    apiFetch<{ users: AdminUserRow[] }>("/api/admin/users"),

  adminUpdateUser: (userId: string, patch: Partial<AdminUserRow>) =>
    apiFetch<{ user: AdminUserRow }>(`/api/admin/users/${userId}`, {
      method: "PATCH",
      json: patch,
    }),

  adminListApiConfigs: () =>
    apiFetch<{ configs: ApiConfigRow[] }>("/api/admin/api-configs"),

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
  subscription_tier: "free" | "basic" | "pro";
  is_admin: boolean;
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

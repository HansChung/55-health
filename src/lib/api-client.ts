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
      session: { client_secret: { value: string }; id: string };
      quota: { used: number; limit: number; tier: string };
    }>("/api/ai/realtime-session", { method: "POST" }),

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
  medications: { name: string; dose?: string; time?: string }[];
  subscription_tier: "free" | "basic" | "pro";
  is_admin: boolean;
}

export interface MealRecord {
  id: string;
  user_id: string;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  eaten_at: string;
  photo_url: string | null;
  items: { name: string; amount?: string; cal: number; emoji?: string; color?: string }[];
  total_cal: number;
  protein_g: number;
  carb_g: number;
  fat_g: number;
  portion: number;
  notes: string | null;
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

export interface Meal {
  name: string;
  time: string;
  items: string;
  cal: number;
  protein?: number;
  carb?: number;
  fat?: number;
  color: string;
  photo: string;        // emoji（fallback）
  photoUrl?: string | null; // 真實照片 URL
  logged: boolean;
  emoji?: string;
}

export interface FoodItem {
  name: string;
  amount: string;
  cal: number;
  color: string;
  emoji: string;
}

export interface FoodResult {
  cal: number;
  protein: number;
  carb: number;
  fat: number;
  items: FoodItem[];
  tip?: string;  // Gemini 給的健康提醒
}

export interface TranscriptMessage {
  role: "user" | "ai";
  text: string;
}

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export type Tab = "home" | "history" | "profile";
export type Modal = "camera" | "result" | "voice" | "suggestion" | "onboarding" | "login" | null;
export type Subpage = "chronic" | "family" | "notif" | "exercise" | "font" | "edit-profile" | "health-metrics" | "prescription" | "weekly-report" | "alerts-center" | null;
export type MascotMood = "happy" | "thinking" | "sleeping" | "excited";
export type FontScale = "base" | "lg";
export type VoiceTone = "warm" | "strict" | "grandchild";

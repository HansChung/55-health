export interface Meal {
  name: string;
  time: string;
  items: string;
  cal: number;
  color: string;
  photo: string;
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
}

export interface TranscriptMessage {
  role: "user" | "ai";
  text: string;
}

export type Tab = "home" | "history" | "profile";
export type Modal = "camera" | "result" | "voice" | "suggestion" | "onboarding" | "login" | null;
export type Subpage = "chronic" | "family" | "notif" | "exercise" | "font" | null;
export type MascotMood = "happy" | "thinking" | "sleeping" | "excited";
export type FontScale = "base" | "lg";
export type VoiceTone = "warm" | "strict" | "grandchild";

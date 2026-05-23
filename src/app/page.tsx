"use client";

import { useState, useEffect } from "react";
import { Tab, Modal, Subpage, FontScale, Meal, FoodResult } from "@/lib/types";
import { DEFAULT_MEALS, MOCK_RESULT } from "@/lib/mock-data";
import { BottomNav } from "@/components/bottom-nav";
import { HomeScreen } from "@/screens/home-screen";
import { HistoryScreen } from "@/screens/history-screen";
import { ProfileScreen } from "@/screens/profile-screen";
import { CameraScreen } from "@/screens/camera-screen";
import { ResultScreen } from "@/screens/result-screen";
import { VoiceScreen } from "@/screens/voice-screen";
import { SuggestionSheet } from "@/screens/suggestion-sheet";
import { LoginScreen } from "@/screens/login-screen";
import { OnboardingScreen } from "@/screens/onboarding-screen";
import { ChronicDiseaseScreen } from "@/screens/chronic-disease-screen";
import { FamilyShareScreen } from "@/screens/family-share-screen";
import { NotificationScreen } from "@/screens/notification-screen";
import { ExerciseScreen } from "@/screens/exercise-screen";
import { FontSizeScreen } from "@/screens/font-size-screen";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api-client";
import type { FoodAnalysisResult } from "@/lib/ai/gemini";

export default function Page() {
  const { user, profile, loading } = useAuth();

  const [fontScale, setFontScale] = useState<FontScale>("base");
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    if (profile?.font_scale) setFontScale(profile.font_scale);
    if (profile?.high_contrast !== undefined) setHighContrast(profile.high_contrast);
  }, [profile]);

  useEffect(() => {
    if (fontScale === "lg") document.documentElement.setAttribute("data-fs", "lg");
    else document.documentElement.removeAttribute("data-fs");
    if (highContrast) document.documentElement.setAttribute("data-contrast", "high");
    else document.documentElement.removeAttribute("data-contrast");
  }, [fontScale, highContrast]);

  const [tab, setTab] = useState<Tab>("home");
  const [modal, setModal] = useState<Modal>(null);
  const [subpage, setSubpage] = useState<Subpage>(null);

  const [meals, setMeals] = useState<Meal[]>(DEFAULT_MEALS);
  const [pendingResult, setPendingResult] = useState<FoodResult | null>(null);
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);

  const totalCal = meals.reduce((s, m) => s + (m.cal || 0), 0);
  const calorieGoal = profile?.calorie_goal ?? 1800;

  // 載入真實餐點
  useEffect(() => {
    if (!user) return;
    api.listMeals(1).then(({ meals: dbMeals }) => {
      if (dbMeals.length > 0) {
        setMeals(dbMeals.map((m) => ({
          name: ({ breakfast: "早餐", lunch: "午餐", dinner: "晚餐", snack: "點心" } as const)[m.meal_type],
          time: new Date(m.eaten_at).toTimeString().substring(0, 5),
          items: m.items.map((it) => it.name).join("、"),
          cal: m.total_cal,
          color: m.items[0]?.color ?? "#E8845A",
          photo: m.items[0]?.emoji ?? "🍱",
          logged: true,
        })));
      }
    }).catch(console.error);
  }, [user]);

  // 強制登入
  useEffect(() => {
    if (!loading && !user && modal !== "login") {
      setModal("login");
    }
  }, [loading, user, modal]);

  const handleCapture = (result: FoodAnalysisResult, photoDataUrl: string) => {
    const foodResult: FoodResult = {
      cal: result.total.cal,
      protein: result.total.protein,
      carb: result.total.carb,
      fat: result.total.fat,
      items: result.items.map((it) => ({
        name: it.name,
        amount: it.amount,
        cal: it.cal,
        emoji: it.emoji,
        color: it.color,
      })),
    };
    setPendingResult(foodResult);
    setPendingPhoto(photoDataUrl);
    setModal("result");
  };

  const handleSaveMeal = async (adj: { cal: number; protein: number; carb: number; fat: number }) => {
    if (pendingResult) {
      try {
        const now = new Date();
        const hour = now.getHours();
        const mealType =
          hour < 10 ? "breakfast" : hour < 14 ? "lunch" : hour < 17 ? "snack" : "dinner";
        await api.createMeal({
          meal_type: mealType,
          items: pendingResult.items,
          total_cal: adj.cal,
          protein_g: adj.protein,
          carb_g: adj.carb,
          fat_g: adj.fat,
          eaten_at: now.toISOString(),
        });
        // Reload from DB
        const { meals: fresh } = await api.listMeals(1);
        if (fresh.length > 0) {
          setMeals(fresh.map((m) => ({
            name: ({ breakfast: "早餐", lunch: "午餐", dinner: "晚餐", snack: "點心" } as const)[m.meal_type],
            time: new Date(m.eaten_at).toTimeString().substring(0, 5),
            items: m.items.map((it) => it.name).join("、"),
            cal: m.total_cal,
            color: m.items[0]?.color ?? "#E8845A",
            photo: m.items[0]?.emoji ?? "🍱",
            logged: true,
          })));
        }
      } catch (e) {
        console.error("Save meal failed:", e);
      }
    }
    setPendingResult(null);
    setPendingPhoto(null);
    setModal(null);
    setTab("home");
  };

  if (loading) {
    return (
      <div className="app-root" style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: "var(--fs-base)", color: "var(--ink-2)" }}>載入中…</div>
      </div>
    );
  }

  return (
    <div className="app-root">
      <div className="safe-top" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {tab === "home" && (
          <HomeScreen
            meals={meals}
            calories={totalCal}
            calorieGoal={calorieGoal}
            onCamera={() => setModal("camera")}
            onVoice={() => setModal("voice")}
            onMeal={() => setModal("result")}
            onSuggestion={() => setModal("suggestion")}
            onExercise={() => setSubpage("exercise")}
          />
        )}
        {tab === "history" && <HistoryScreen onMeal={() => setModal("result")} />}
        {tab === "profile" && <ProfileScreen onSubpage={setSubpage} />}
      </div>

      {!modal && !subpage && (
        <BottomNav tab={tab} setTab={setTab} onCamera={() => setModal("camera")} onVoice={() => setModal("voice")} />
      )}

      {subpage === "chronic" && <ChronicDiseaseScreen onBack={() => setSubpage(null)} />}
      {subpage === "family" && <FamilyShareScreen onBack={() => setSubpage(null)} />}
      {subpage === "notif" && <NotificationScreen onBack={() => setSubpage(null)} />}
      {subpage === "exercise" && <ExerciseScreen onBack={() => setSubpage(null)} />}
      {subpage === "font" && (
        <FontSizeScreen onBack={() => setSubpage(null)} fontScale={fontScale} setFontScale={setFontScale} />
      )}

      {modal === "login" && <LoginScreen onDone={() => setModal(null)} />}
      {modal === "onboarding" && (
        <div style={{ position: "absolute", inset: 0, zIndex: 60, background: "var(--bg)", display: "flex", flexDirection: "column" }}>
          <OnboardingScreen onDone={() => setModal(null)} />
        </div>
      )}
      {modal === "camera" && (
        <CameraScreen
          onClose={() => setModal(null)}
          onCapture={handleCapture}
        />
      )}
      {modal === "result" && (
        <ResultScreen
          result={pendingResult ?? MOCK_RESULT}
          onClose={() => { setModal(null); setPendingResult(null); }}
          onSave={handleSaveMeal}
        />
      )}
      {modal === "voice" && (
        <VoiceScreen
          onClose={() => setModal(null)}
          voiceTone={profile?.voice_tone ?? "warm"}
        />
      )}
      {modal === "suggestion" && <SuggestionSheet onClose={() => setModal(null)} />}
    </div>
  );
}

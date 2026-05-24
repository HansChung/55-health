"use client";

import { useState, useEffect } from "react";
import { Tab, Modal, Subpage, FontScale, Meal, FoodResult } from "@/lib/types";
import { MOCK_RESULT } from "@/lib/mock-data";
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
import { EditProfileScreen } from "@/screens/edit-profile-screen";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api-client";
import type { FoodAnalysisResult } from "@/lib/ai/gemini";
import { mergeMealsWithSlots, guessMealType } from "@/lib/meal-utils";

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

  // 預設空的 3 餐 slots（不要再用假資料）
  const [meals, setMeals] = useState<Meal[]>(() => mergeMealsWithSlots([]));
  const [pendingResult, setPendingResult] = useState<FoodResult | null>(null);

  const totalCal = meals.reduce((s, m) => s + (m.cal || 0), 0);
  const calorieGoal = profile?.calorie_goal ?? 1800;

  const reloadMeals = async () => {
    try {
      const { meals: dbMeals } = await api.listMeals(1);
      setMeals(mergeMealsWithSlots(dbMeals));
    } catch (e) {
      console.error("載入餐點失敗:", e);
    }
  };

  // 載入真實餐點（永遠覆蓋，空的就是空的）
  useEffect(() => {
    if (!user) return;
    reloadMeals();
  }, [user]);

  // 強制登入
  useEffect(() => {
    if (!loading && !user && modal !== "login") {
      setModal("login");
    }
  }, [loading, user, modal]);

  // 登入成功後關閉登入 modal
  useEffect(() => {
    if (user && modal === "login") {
      setModal(null);
    }
  }, [user, modal]);

  const handleCapture = (result: FoodAnalysisResult) => {
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
    setModal("result");
  };

  const handleSaveMeal = async (adj: { cal: number; protein: number; carb: number; fat: number }) => {
    if (pendingResult) {
      try {
        const now = new Date();
        await api.createMeal({
          meal_type: guessMealType(now),
          items: pendingResult.items,
          total_cal: adj.cal,
          protein_g: adj.protein,
          carb_g: adj.carb,
          fat_g: adj.fat,
          eaten_at: now.toISOString(),
        });
        await reloadMeals();
      } catch (e) {
        console.error("Save meal failed:", e);
        alert("儲存失敗，請再試一次");
      }
    }
    setPendingResult(null);
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
            displayName={profile?.display_name}
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

      {subpage === "edit-profile" && (
        <EditProfileScreen
          onBack={() => setSubpage(null)}
          profile={profile}
          onSaved={() => window.location.reload()}
        />
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

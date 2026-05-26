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
import { MealDetailSheet } from "@/screens/meal-detail-sheet";
import { PhotoSourceSheet } from "@/components/photo-source-sheet";
import type { MealRecord, AiSuggestion } from "@/lib/api-client";
import { useAuth, type AppProfile } from "@/hooks/use-auth";
import { api } from "@/lib/api-client";
import type { FoodAnalysisResult } from "@/lib/ai/gemini";
import { mergeMealsWithSlots, guessMealType } from "@/lib/meal-utils";
import { compressImage } from "@/lib/image-utils";
import type { FoodItem } from "@/lib/types";

export default function Page() {
  const { user, profile, loading, refreshProfile, setProfileDirectly } = useAuth();

  // 如果用戶被 OAuth provider 丟回 /?code=xxx，自動轉到 /auth/callback
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    if (code && window.location.pathname === "/") {
      window.location.replace(`/auth/callback?code=${code}`);
    }
  }, []);

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
  const [todayDbMeals, setTodayDbMeals] = useState<MealRecord[]>([]); // 真實 DB 紀錄，給 detail 用
  const [pendingResult, setPendingResult] = useState<FoodResult | null>(null);
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<MealRecord | null>(null);
  const [suggestion, setSuggestion] = useState<AiSuggestion | null>(null);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [showPhotoSource, setShowPhotoSource] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const totalCal = meals.reduce((s, m) => s + (m.cal || 0), 0);
  const calorieGoal = profile?.calorie_goal ?? 1800;

  const reloadMeals = async () => {
    try {
      const { meals: dbMeals } = await api.listMeals(1);
      setTodayDbMeals(dbMeals);
      setMeals(mergeMealsWithSlots(dbMeals));
    } catch (e) {
      console.error("載入餐點失敗:", e);
    }
  };

  const openMealDetail = (mealType: string) => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const found = todayDbMeals.find(
      (m) => m.meal_type === mealType && new Date(m.eaten_at) >= todayStart
    );
    if (found) setSelectedMeal(found);
  };

  const handleDeleteMeal = async () => {
    if (!selectedMeal) return;
    try {
      await api.deleteMeal(selectedMeal.id);
      setSelectedMeal(null);
      await reloadMeals();
    } catch (e) {
      alert("刪除失敗：" + (e as Error).message);
    }
  };

  // 載入真實餐點（永遠覆蓋，空的就是空的）
  useEffect(() => {
    if (!user) return;
    reloadMeals();
  }, [user]);

  // 載入 AI 建議（有 localStorage 快取，1 小時內不重複呼叫）
  const SUGGEST_CACHE_KEY = "nuannuan_suggestion_v1";
  const SUGGEST_CACHE_MS = 60 * 60 * 1000; // 1 小時

  const loadSuggestion = async (force = false) => {
    if (!user) return;

    // 先看 localStorage 快取
    if (!force && typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(SUGGEST_CACHE_KEY);
        if (cached) {
          const { suggestion, ts, userId } = JSON.parse(cached);
          if (userId === user.id && Date.now() - ts < SUGGEST_CACHE_MS) {
            setSuggestion(suggestion);
            return; // 用快取，不打 API
          }
        }
      } catch {}
    }

    setSuggestionLoading(true);
    try {
      const { suggestion } = await api.getSuggestion();
      setSuggestion(suggestion);
      if (typeof window !== "undefined") {
        localStorage.setItem(SUGGEST_CACHE_KEY, JSON.stringify({
          suggestion, ts: Date.now(), userId: user.id,
        }));
      }
    } catch (e) {
      console.warn("loadSuggestion failed (fallback to default):", (e as Error).message);
      // 不顯示錯誤給用戶，畫面會 fallback 到預設訊息
    }
    setSuggestionLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    loadSuggestion();
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

  // 從相簿選的檔案 → 直接呼叫 AI 分析（不開相機畫面）
  const handleFileUpload = async (file: File) => {
    setShowPhotoSource(false);
    setAnalyzing(true);
    try {
      // 壓縮成 1280px 邊長 + JPEG 85%（避免大圖造成 data URL 過大、無法顯示）
      const dataUrl = await compressImage(file, { maxSide: 1280, quality: 0.85 });
      console.log("[upload] compressed size:", Math.round(dataUrl.length / 1024), "KB");

      const base64 = dataUrl.split(",")[1];
      const { result } = await api.analyzeFood(base64, "image/jpeg");
      // 先關掉 analyzing overlay 再開 result 視窗
      setAnalyzing(false);
      handleCapture(result, dataUrl);
    } catch (err: unknown) {
      setAnalyzing(false);
      const status = (err as { status?: number })?.status;
      const msg = err instanceof Error ? err.message : "辨識失敗";
      if (status === 429) alert("本月拍照次數已用完，請升級方案");
      else if (status === 401) alert("請先登入");
      else alert("辨識失敗：" + msg);
    }
  };

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
      tip: result.tip,
    };
    setPendingResult(foodResult);
    setPendingPhoto(photoDataUrl);
    setModal("result");
  };

  const handleSaveMeal = async (adj: {
    cal: number; protein: number; carb: number; fat: number;
    items?: FoodItem[];
  }) => {
    if (!pendingResult) {
      setModal(null);
      return;
    }

    const now = new Date();
    const mealType = guessMealType(now);
    // 用編輯後的 items（fallback 到原始 AI 結果）
    const items = adj.items ?? pendingResult.items;

    // 1. 立刻關掉視窗 + 樂觀更新本地餐點（用戶不用等）
    const optimisticMeal: Meal = {
      name: ({ breakfast: "早餐", lunch: "午餐", dinner: "晚餐", snack: "點心" } as const)[mealType],
      time: now.toTimeString().substring(0, 5),
      items: items.map((it) => it.name).join("、"),
      cal: adj.cal,
      color: items[0]?.color ?? "#E8845A",
      photo: items[0]?.emoji ?? "🍱",
      logged: true,
    };
    setMeals((prev) => {
      const slotIdx = ({ breakfast: 0, lunch: 1, dinner: 2, snack: 2 } as const)[mealType];
      const next = [...prev];
      next[slotIdx] = optimisticMeal;
      return next;
    });
    setPendingResult(null);
    setPendingPhoto(null);
    setModal(null);
    setTab("home");

    // 2. 背景送 API（不擋 UI）
    try {
      await api.createMeal({
        meal_type: mealType,
        items,
        total_cal: adj.cal,
        protein_g: adj.protein,
        carb_g: adj.carb,
        fat_g: adj.fat,
        eaten_at: now.toISOString(),
      });
      // 3. 成功後背景重新載入（同步真實 ID 等）
      reloadMeals().catch(console.error);
    } catch (e) {
      console.error("Save meal failed:", e);
      alert("儲存失敗，請再試一次：" + (e as Error).message);
      // 失敗則重新載入回到真實狀態
      reloadMeals().catch(console.error);
    }
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
            suggestion={suggestion}
            suggestionLoading={suggestionLoading}
            onCamera={() => setShowPhotoSource(true)}
            onVoice={() => setModal("voice")}
            onMeal={(mealType) => openMealDetail(mealType)}
            onSuggestion={() => setModal("suggestion")}
            onExercise={() => setSubpage("exercise")}
          />
        )}
        {tab === "history" && <HistoryScreen onMeal={(meal) => setSelectedMeal(meal)} />}
        {tab === "profile" && <ProfileScreen onSubpage={setSubpage} />}
      </div>

      {!modal && !subpage && (
        <BottomNav tab={tab} setTab={setTab} onCamera={() => setShowPhotoSource(true)} onVoice={() => setModal("voice")} />
      )}

      {subpage === "edit-profile" && (
        <EditProfileScreen
          onBack={() => setSubpage(null)}
          profile={profile}
          onSaved={(updated) => {
            // 直接把 API 回傳的新 profile 塞進 state（不用等 refetch）
            if (updated) setProfileDirectly(updated as AppProfile);
            else refreshProfile();
          }}
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
      {modal === "result" && pendingResult && (
        <ResultScreen
          result={pendingResult}
          photoDataUrl={pendingPhoto}
          onClose={() => { setModal(null); setPendingResult(null); setPendingPhoto(null); }}
          onSave={handleSaveMeal}
        />
      )}
      {modal === "voice" && (
        <VoiceScreen
          onClose={() => setModal(null)}
          voiceTone={profile?.voice_tone ?? "warm"}
        />
      )}
      {modal === "suggestion" && (
        <SuggestionSheet onClose={() => setModal(null)} initial={suggestion} />
      )}

      {selectedMeal && (
        <MealDetailSheet
          meal={selectedMeal}
          onClose={() => setSelectedMeal(null)}
          onDelete={handleDeleteMeal}
        />
      )}

      {showPhotoSource && (
        <PhotoSourceSheet
          onClose={() => setShowPhotoSource(false)}
          onCamera={() => setModal("camera")}
          onFile={handleFileUpload}
        />
      )}

      {/* 只在 result modal 還沒開時才顯示 analyzing overlay */}
      {analyzing && modal !== "result" && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 80,
          background: "rgba(14,9,5,0.7)", backdropFilter: "blur(4px)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 24,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%",
            border: "4px solid rgba(255,255,255,0.3)",
            borderTopColor: "#fff",
            animation: "spin 0.8s linear infinite",
          }} />
          <div style={{ color: "#fff", fontSize: "var(--fs-base)", fontWeight: 600 }}>
            AI 正在看您吃了什麼…
          </div>
        </div>
      )}
    </div>
  );
}

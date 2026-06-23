"use client";

import { useState, useEffect, useMemo } from "react";
import { trackEvent } from "@/lib/telemetry";
import { Tab, Modal, Subpage, Meal, FoodResult, MealType } from "@/lib/types";
import { MOCK_RESULT } from "@/lib/mock-data";
import { BottomNav } from "@/components/bottom-nav";
import { SosButton } from "@/components/sos-button";
import { AchievementToast } from "@/components/achievement-toast";
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
import { HealthMetricsScreen } from "@/screens/health-metrics-screen";
import { PrescriptionScanScreen } from "@/screens/prescription-scan-screen";
import { WeeklyReportScreen } from "@/screens/weekly-report-screen";
import { AlertsCenterScreen } from "@/screens/alerts-center-screen";
import { AchievementsScreen } from "@/screens/achievements-screen";
import { SmartScreen } from "@/screens/smart-screen";
import { IotScreen } from "@/screens/iot-screen";
import { CaregiverScreen } from "@/screens/caregiver-screen";
import { MealDetailSheet } from "@/screens/meal-detail-sheet";
import { PhotoSourceSheet } from "@/components/photo-source-sheet";
import type { MealRecord, AiSuggestion, ProfileMedication, HealthMetric, FavoriteMeal, PartnerCampaign, AchievementsResponse } from "@/lib/api-client";
import type { AchievementProgress } from "@/lib/achievements";
import { useAuth, type AppProfile } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useDisplaySettings } from "@/hooks/use-display-settings";
import { api } from "@/lib/api-client";
import type { FoodAnalysisResult } from "@/lib/ai/gemini";
import { mergeMealsWithSlots, guessMealType } from "@/lib/meal-utils";
import { compressImage } from "@/lib/image-utils";
import { uploadMealPhoto } from "@/lib/upload-photo";
import type { FoodItem } from "@/lib/types";
import { getPendingMedicationReminders, isSameLocalDay } from "@/lib/medication-utils";
import { generateHealthAlerts } from "@/lib/health-alerts";
import { hasFeature, requiredTierLabel, type FeatureKey, type SubscriptionTier } from "@/lib/feature-gates";

export default function Page() {
  const { user, profile, loading, refreshProfile, setProfileDirectly } = useAuth();
  const toast = useToast();

  // 如果用戶被 OAuth provider 丟回 /?code=xxx，自動轉到 /auth/callback
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    if (code && window.location.pathname === "/") {
      window.location.replace(`/auth/callback?code=${code}`);
    }
  }, []);

  const { fontScale, setFontScale } = useDisplaySettings(profile);

  const [tab, setTab] = useState<Tab>("home");
  const [modal, setModal] = useState<Modal>(null);
  const [subpage, setSubpage] = useState<Subpage>(null);

  // 預設空的 3 餐 slots（不要再用假資料）
  const [meals, setMeals] = useState<Meal[]>(() => mergeMealsWithSlots([]));
  const [todayDbMeals, setTodayDbMeals] = useState<MealRecord[]>([]); // 真實 DB 紀錄，給 detail 用
  const [recentDbMeals, setRecentDbMeals] = useState<MealRecord[]>([]);
  const [recentMetrics, setRecentMetrics] = useState<HealthMetric[]>([]);
  const [favoriteMeals, setFavoriteMeals] = useState<FavoriteMeal[]>([]);
  const [favoritePickerMealType, setFavoritePickerMealType] = useState<MealType | null>(null);
  const [partnerCampaigns, setPartnerCampaigns] = useState<PartnerCampaign[]>([]);
  const [achievements, setAchievements] = useState<AchievementsResponse | null>(null);
  const [celebration, setCelebration] = useState<AchievementProgress[]>([]);
  const [smartShi, setSmartShi] = useState<number | null>(null);
  const [careElderCount, setCareElderCount] = useState(0);
  const [careNeedsAttention, setCareNeedsAttention] = useState(false);
  const [pendingResult, setPendingResult] = useState<FoodResult | null>(null);
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<MealRecord | null>(null);
  const [suggestion, setSuggestion] = useState<AiSuggestion | null>(null);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [showPhotoSource, setShowPhotoSource] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const totalCal = useMemo(() => meals.reduce((s, m) => s + (m.cal || 0), 0), [meals]);
  const calorieGoal = profile?.calorie_goal ?? 1800;
  const tier = (profile?.subscription_tier ?? "free") as SubscriptionTier;
  const medicationReminders = useMemo(
    () =>
      hasFeature(tier, "medication_reminders")
        ? getPendingMedicationReminders(profile?.medications ?? []).slice(0, 3)
        : [],
    [tier, profile?.medications]
  );
  const allHealthAlerts = useMemo(
    () =>
      generateHealthAlerts({
        meals: recentDbMeals,
        metrics: recentMetrics,
        medications: profile?.medications ?? [],
      }),
    [recentDbMeals, recentMetrics, profile?.medications]
  );
  const healthAlerts = useMemo(
    () => (hasFeature(tier, "health_alerts") ? allHealthAlerts.slice(0, 3) : []),
    [tier, allHealthAlerts]
  );

  const requireFeature = (feature: FeatureKey, action: () => void) => {
    if (hasFeature(tier, feature)) {
      action();
      return;
    }
    toast.info(`這是${requiredTierLabel(feature)}功能，升級後就可以使用。`);
    window.location.href = "/pricing";
  };

  const reloadMeals = async () => {
    try {
      const { meals: dbMeals } = await api.listMeals(7);
      const todayMeals = dbMeals.filter((m) => isSameLocalDay(new Date(m.eaten_at), new Date()));
      setRecentDbMeals(dbMeals);
      setTodayDbMeals(todayMeals);
      setMeals(mergeMealsWithSlots(dbMeals));
    } catch (e) {
      console.error("載入餐點失敗:", e);
    }
  };

  const reloadMetrics = async () => {
    try {
      const { metrics } = await api.listMetrics(undefined, 7);
      setRecentMetrics(metrics);
    } catch (e) {
      console.error("載入健康數值失敗:", e);
    }
  };

  const reloadFavoriteMeals = async () => {
    if (!hasFeature(tier, "favorite_meals")) {
      setFavoriteMeals([]);
      return;
    }
    try {
      const { favorites } = await api.listFavoriteMeals();
      setFavoriteMeals(favorites);
    } catch (e) {
      console.error("載入常吃餐點失敗:", e);
    }
  };

  const reloadPartnerCampaigns = async () => {
    if (!hasFeature(tier, "partner_offers")) {
      setPartnerCampaigns([]);
      return;
    }
    try {
      const { campaigns } = await api.listPartnerCampaigns();
      setPartnerCampaigns(campaigns);
      campaigns.forEach((campaign) => {
        api.trackPartnerCampaign(campaign.id, "impression").catch(console.error);
      });
    } catch (e) {
      console.error("載入合作活動失敗:", e);
    }
  };

  const ACHV_SEEN_KEY = "nuannuan_unlocked_v1";

  const reloadAchievements = async () => {
    if (!user) return;
    try {
      const data = await api.getAchievements();
      setAchievements(data);

      // 偵測「新解鎖」並跳慶祝（第一次載入只建立基準，不慶祝）
      const unlockedNow = data.achievements.filter((a) => a.unlocked);
      const unlockedIds = unlockedNow.map((a) => a.achievement.id);
      if (typeof window !== "undefined") {
        let seen: string[] | null = null;
        try {
          const raw = localStorage.getItem(ACHV_SEEN_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed.userId === user.id && Array.isArray(parsed.ids)) seen = parsed.ids;
          }
        } catch {}

        if (seen) {
          const fresh = unlockedNow.filter((a) => !seen!.includes(a.achievement.id));
          if (fresh.length > 0) setCelebration(fresh);
        }
        localStorage.setItem(ACHV_SEEN_KEY, JSON.stringify({ userId: user.id, ids: unlockedIds }));
      }
    } catch (e) {
      console.error("載入成就失敗:", e);
    }
  };

  const reloadSmart = async () => {
    if (!user) return;
    try {
      const { assessments } = await api.listSmartAssessments();
      setSmartShi(assessments[0]?.shi ?? null);
    } catch (e) {
      console.error("載入幸福指數失敗:", e);
    }
  };

  const reloadCaregiver = async () => {
    if (!user) return;
    try {
      const { elders } = await api.familyOverview();
      setCareElderCount(elders.length);
      setCareNeedsAttention(elders.some((e) => e.overall !== "normal"));
    } catch (e) {
      console.error("載入家人狀況失敗:", e);
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

  const yesterdayMealsByType = useMemo(
    () =>
      recentDbMeals.reduce((acc, meal) => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (isSameLocalDay(new Date(meal.eaten_at), yesterday)) {
          acc[meal.meal_type] = meal;
        }
        return acc;
      }, {} as Partial<Record<MealType, MealRecord>>),
    [recentDbMeals]
  );

  const handleRepeatYesterdayMeal = async (mealType: MealType) => {
    const source = yesterdayMealsByType[mealType];
    if (!source) return;

    const now = new Date();
    try {
      await api.createMeal({
        meal_type: mealType,
        items: source.items,
        total_cal: source.total_cal,
        protein_g: source.protein_g,
        carb_g: source.carb_g,
        fat_g: source.fat_g,
        portion: source.portion,
        notes: source.notes ?? undefined,
        photo_url: source.photo_url ?? undefined,
        eaten_at: now.toISOString(),
      });
      await reloadMeals();
      loadSuggestion(true).catch(console.error);
    } catch (e) {
      console.error("複製昨天餐點失敗:", e);
      toast.error("複製餐點沒成功，請再試一次。");
    }
  };

  const handleDeleteMeal = async () => {
    if (!selectedMeal) return;
    try {
      await api.deleteMeal(selectedMeal.id);
      setSelectedMeal(null);
      await reloadMeals();
      // 刪除後也重新生成建議（用戶今天吃的內容變了）
      loadSuggestion(true).catch(console.error);
    } catch (e) {
      console.error("刪除餐點失敗:", e);
      toast.error("刪除沒成功，請再試一次。");
    }
  };

  const handleTakeMedication = async (medication: ProfileMedication) => {
    if (!profile) return;
    const next = (profile.medications ?? []).map((med) =>
      med.name === medication.name && med.added_at === medication.added_at
        ? { ...med, taken_today: true, last_taken_at: new Date().toISOString() }
        : med
    );
    try {
      const { profile: updated } = await api.updateProfile({ medications: next });
      setProfileDirectly(updated as AppProfile);
    } catch (e) {
      console.error("更新用藥狀態失敗:", e);
      toast.error("用藥記錄沒存成功，網路不穩時請稍後再點一次。");
    }
  };

  // 載入真實餐點（永遠覆蓋，空的就是空的）
  useEffect(() => {
    if (!user) return;
    reloadMeals();
    reloadMetrics();
    reloadFavoriteMeals();
    reloadPartnerCampaigns();
  }, [user, tier]);

  // 成就：初次載入、餐點/指標/用藥改變、或關閉子頁面（運動/拍藥袋）時重新計算並偵測新解鎖
  useEffect(() => {
    if (!user) return;
    reloadAchievements();
    reloadSmart(); // 從智慧幸福檢測返回時刷新首頁 SHI
    reloadCaregiver(); // 家人狀況（子女視角）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, recentDbMeals.length, recentMetrics.length, profile?.medications?.length, subpage]);

  const handleSaveFavoriteMeal = async (meal: MealRecord) => {
    if (!hasFeature(tier, "favorite_meals")) {
      requireFeature("favorite_meals", () => {});
      return;
    }
    const name = meal.items.map((it) => it.name).join("、").slice(0, 80) || "常吃餐點";
    try {
      await api.createFavoriteMeal({
        name,
        meal_type: meal.meal_type,
        items: meal.items,
        total_cal: meal.total_cal,
        protein_g: meal.protein_g,
        carb_g: meal.carb_g,
        fat_g: meal.fat_g,
      });
      await reloadFavoriteMeals();
      toast.success("已存成常吃餐點，下次一鍵就能加。");
    } catch (e) {
      console.error("儲存常吃餐點失敗:", e);
      toast.error("存常吃餐點沒成功，請再試一次。");
    }
  };

  const handleUseFavoriteMeal = async (favorite: FavoriteMeal) => {
    if (!hasFeature(tier, "favorite_meals")) {
      requireFeature("favorite_meals", () => {});
      return;
    }
    try {
      await api.createMeal({
        meal_type: favoritePickerMealType ?? favorite.meal_type,
        items: favorite.items,
        total_cal: favorite.total_cal,
        protein_g: favorite.protein_g,
        carb_g: favorite.carb_g,
        fat_g: favorite.fat_g,
        eaten_at: new Date().toISOString(),
      });
      setFavoritePickerMealType(null);
      await reloadMeals();
      loadSuggestion(true).catch(console.error);
    } catch (e) {
      console.error("加入常吃餐點失敗:", e);
      toast.error("加入餐點沒成功，請再試一次。");
    }
  };

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
      trackEvent("photo_analyze", { items: result.items?.length ?? 0 });
      // 先關掉 analyzing overlay 再開 result 視窗
      setAnalyzing(false);
      handleCapture(result, dataUrl);
    } catch (err: unknown) {
      setAnalyzing(false);
      console.error("[handleFileUpload] error:", err);
      const status = (err as { status?: number })?.status;
      if (status === 429) toast.info("這個月的拍照次數用完了，升級方案就能繼續用。");
      else if (status === 401) toast.error("請先登入再使用喔。");
      else toast.error("照片看不太清楚，換一張光線好一點的再試試。");
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
    const items = adj.items ?? pendingResult.items;
    const photoToUpload = pendingPhoto; // 在 setPendingPhoto(null) 之前抓住

    // 1. 立刻關掉視窗 + 樂觀更新本地餐點（用戶不用等）
    const optimisticMeal: Meal = {
      name: ({ breakfast: "早餐", lunch: "午餐", dinner: "晚餐", snack: "點心" } as const)[mealType],
      time: now.toTimeString().substring(0, 5),
      items: items.map((it) => it.name).join("、"),
      cal: adj.cal,
      protein: adj.protein,
      carb: adj.carb,
      fat: adj.fat,
      color: items[0]?.color ?? "#E8845A",
      photo: items[0]?.emoji ?? "🍱",
      logged: true,
      mealType,
    };
    // 先保存送出前的快照，失敗時可真正還原（不是靠重抓）
    let mealsSnapshot: Meal[] = [];
    setMeals((prev) => {
      mealsSnapshot = prev;
      const next = [...prev];
      if (mealType === "snack") {
        // 點心：覆蓋既有點心卡，沒有就附加一張（不佔用晚餐格）
        const snackIdx = next.findIndex((m) => m.mealType === "snack");
        if (snackIdx >= 0) next[snackIdx] = optimisticMeal;
        else next.push(optimisticMeal);
      } else {
        const slotIdx = ({ breakfast: 0, lunch: 1, dinner: 2 } as const)[mealType];
        next[slotIdx] = optimisticMeal;
      }
      return next;
    });
    setPendingResult(null);
    setPendingPhoto(null);
    setModal(null);
    setTab("home");

    // 2. 背景：先上傳照片到 Storage → 再存餐點記錄
    try {
      let photoUrl: string | null = null;
      if (photoToUpload && user) {
        photoUrl = await uploadMealPhoto(user.id, photoToUpload);
      }
      await api.createMeal({
        meal_type: mealType,
        items,
        total_cal: adj.cal,
        protein_g: adj.protein,
        carb_g: adj.carb,
        fat_g: adj.fat,
        eaten_at: now.toISOString(),
        photo_url: photoUrl ?? undefined,
      });
      trackEvent("meal_saved", { meal_type: mealType });
      reloadMeals().catch(console.error);
      loadSuggestion(true).catch(console.error);
    } catch (e) {
      console.error("Save meal failed:", e);
      // 真 rollback：把樂觀更新的那張卡還原回送出前的狀態，
      // 避免長者以為已記錄成功（資料正確性）
      setMeals(mealsSnapshot);
      toast.error("餐點沒存成功，網路穩定後請再記錄一次。");
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
            subscriptionTier={tier}
            onCamera={() => requireFeature("ai_photo", () => setShowPhotoSource(true))}
            onVoice={() => requireFeature("ai_voice", () => setModal("voice"))}
            onMeal={(mealType) => openMealDetail(mealType)}
            onSuggestion={() => setModal("suggestion")}
            onExercise={() => setSubpage("exercise")}
            repeatMeals={yesterdayMealsByType}
            onRepeatMeal={handleRepeatYesterdayMeal}
            medicationReminders={medicationReminders}
            onTakeMedication={handleTakeMedication}
            healthAlerts={healthAlerts}
            onAlertsCenter={() => setSubpage("alerts-center")}
            favoriteMeals={favoriteMeals}
            onPickFavorite={(mealType) => setFavoritePickerMealType(mealType)}
            partnerCampaigns={partnerCampaigns}
            onPartnerClick={(campaign) => {
              api.trackPartnerCampaign(campaign.id, "click").catch(console.error);
              if (campaign.cta_url) window.open(campaign.cta_url, "_blank", "noopener,noreferrer");
            }}
            achievementsSummary={achievements ? {
              unlockedCount: achievements.unlocked_count,
              totalCount: achievements.total_count,
              latestEmoji: achievements.achievements.filter((a) => a.unlocked).slice(-1)[0]?.achievement.emoji,
              streak: achievements.stats.meal_streak,
            } : null}
            onAchievements={() => setSubpage("achievements")}
            smartSummary={{ shi: smartShi }}
            onSmart={() => setSubpage("smart")}
            onIot={() => setSubpage("iot")}
            caregiver={careElderCount > 0 ? { count: careElderCount, needsAttention: careNeedsAttention } : null}
            onCaregiver={() => setSubpage("caregiver")}
          />
        )}
        {tab === "history" && <HistoryScreen onMeal={(meal) => setSelectedMeal(meal)} />}
        {tab === "profile" && (
          <ProfileScreen
            onSubpage={(page) => {
              if (page === "weekly-report") return requireFeature("weekly_report", () => setSubpage(page));
              setSubpage(page);
            }}
            onOnboarding={() => setModal("onboarding")}
          />
        )}
      </div>

      {tab === "home" && !modal && !subpage && <SosButton />}

      {celebration.length > 0 && (
        <AchievementToast unlocked={celebration} onClose={() => setCelebration([])} />
      )}

      {!modal && !subpage && (
        <BottomNav
          tab={tab}
          setTab={setTab}
          onCamera={() => requireFeature("ai_photo", () => setShowPhotoSource(true))}
          onVoice={() => requireFeature("ai_voice", () => setModal("voice"))}
        />
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
      {subpage === "health-metrics" && <HealthMetricsScreen onBack={() => setSubpage(null)} />}
      {subpage === "weekly-report" && <WeeklyReportScreen tier={tier} onBack={() => setSubpage(null)} />}
      {subpage === "alerts-center" && <AlertsCenterScreen alerts={allHealthAlerts} tier={tier} onBack={() => setSubpage(null)} />}
      {subpage === "achievements" && <AchievementsScreen onBack={() => setSubpage(null)} />}
      {subpage === "smart" && <SmartScreen onBack={() => setSubpage(null)} />}
      {subpage === "iot" && <IotScreen onBack={() => setSubpage(null)} />}
      {subpage === "caregiver" && <CaregiverScreen onBack={() => setSubpage(null)} />}
      {subpage === "prescription" && <PrescriptionScanScreen onBack={() => setSubpage("chronic")} />}
      {subpage === "chronic" && (
        <ChronicDiseaseScreen
          onBack={() => setSubpage(null)}
          onScanPrescription={() => setSubpage("prescription")}
          tier={tier}
        />
      )}
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
          onSaveFavorite={handleSaveFavoriteMeal}
        />
      )}

      {favoritePickerMealType && (
        <FavoriteMealPicker
          mealType={favoritePickerMealType}
          favorites={favoriteMeals}
          onClose={() => setFavoritePickerMealType(null)}
          onSelect={handleUseFavoriteMeal}
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

function FavoriteMealPicker({ mealType, favorites, onClose, onSelect }: {
  mealType: MealType;
  favorites: FavoriteMeal[];
  onClose: () => void;
  onSelect: (favorite: FavoriteMeal) => void;
}) {
  const filtered = favorites.filter((favorite) => favorite.meal_type === mealType);
  return (
    <div
      onClick={onClose}
      style={{
        position: "absolute", inset: 0, zIndex: 55,
        background: "rgba(45, 28, 14, 0.5)",
        display: "flex", alignItems: "flex-end",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="fade-up"
        style={{
          width: "100%", background: "var(--bg)",
          borderRadius: "28px 28px 0 0",
          padding: "20px 24px 32px",
          maxHeight: "75%", overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: "var(--fs-xl)", margin: 0 }}>選常吃餐點</h2>
          <button onClick={onClose} aria-label="關閉" style={{ padding: 8 }}>
            <span style={{ fontSize: 24 }} aria-hidden="true">×</span>
          </button>
        </div>
        {filtered.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: "var(--ink-2)" }}>
            這個餐別還沒有常吃餐點，可以先從餐點詳情存一筆。
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map((favorite) => (
              <button
                key={favorite.id}
                onClick={() => onSelect(favorite)}
                style={{
                  padding: 16, borderRadius: 16,
                  background: "var(--surface)", border: "1px solid var(--line)",
                  textAlign: "left", display: "flex", justifyContent: "space-between", gap: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: "var(--fs-base)", fontWeight: 800 }}>{favorite.name}</div>
                  <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", marginTop: 2 }}>
                    {favorite.items.map((it) => it.name).join("、")}
                  </div>
                </div>
                <div style={{ fontSize: "var(--fs-base)", fontWeight: 800, color: "var(--primary-deep)" }}>
                  {favorite.total_cal} 卡
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


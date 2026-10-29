"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { EARLY_REFRESH_CHECK_MS, sessionNeedsEarlyRefresh } from "@/lib/auth-refresh";
import type { ProfileMedication, EmergencyContact, NotificationSettings } from "@/lib/api-client";

export interface AppProfile {
  id: string;
  display_name: string | null;
  age: number | null;
  gender: string | null;
  calorie_goal: number;
  voice_tone: "warm" | "strict" | "grandchild";
  font_scale: "base" | "lg";
  high_contrast: boolean;
  chronic_conditions: string[];
  medications: ProfileMedication[];
  emergency_contact?: EmergencyContact | null;
  notification_settings?: NotificationSettings | null;
  subscription_tier: "free" | "basic" | "pro";
  is_admin: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: AppProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  supabase: ReturnType<typeof createSupabaseBrowser>;
  refreshProfile: () => Promise<void>;
  setProfileDirectly: (p: AppProfile) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [supabase] = useState(() => createSupabaseBrowser());

  const fetchProfile = useCallback(async (_userId: string): Promise<AppProfile | null> => {
    // 改用 server API：繞過 client RLS 問題，更穩
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch("/api/profile", {
        credentials: "include",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) {
        console.error("[auth] fetchProfile HTTP", res.status);
        return null;
      }
      const json = await res.json();
      return json.profile as AppProfile;
    } catch (e) {
      console.error("[auth] fetchProfile threw:", e);
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const fresh = await fetchProfile(user.id);
    if (fresh) {
      console.log("[auth] refreshProfile:", fresh.display_name);
      setProfile(fresh);
    }
  }, [user, fetchProfile]);

  const setProfileDirectly = useCallback((p: AppProfile) => {
    console.log("[auth] setProfileDirectly:", p.display_name);
    setProfile(p);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadInitial() {
      try {
        // getSession 是 local 讀取，不會 hang
        const { data: { session } } = await supabase.auth.getSession();
        const u = session?.user ?? null;
        if (!mounted) return;
        setUser(u);
        if (u) {
          const p = await fetchProfile(u.id);
          if (mounted && p) setProfile(p);
        }
      } catch (e) {
        console.error("[auth] loadInitial threw:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    let loadedByEvent = false;
    loadInitial();

    const timeout = setTimeout(() => {
      // 如果 auth event 已成功載入就靜默結束，不再報警
      if (mounted && !loadedByEvent) {
        console.warn("[auth] loadInitial timeout - forcing loading=false");
        setLoading(false);
      }
    }, 8000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("[auth] event:", event, "user:", session?.user?.email);
        if (!mounted) return;
        setUser(session?.user ?? null);
        if (session?.user) {
          const p = await fetchProfile(session.user.id);
          if (mounted && p) setProfile(p);
        } else {
          setProfile(null);
        }
        setLoading(false);
        loadedByEvent = true;
      }
    );

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]);

  // 登入憑證提早在手機換新（原因見 auth-refresh.ts）：每分鐘、回到 App 時檢查一次
  const userId = user?.id;
  useEffect(() => {
    if (!userId) return;
    let busy = false;
    const check = async () => {
      if (busy || document.visibilityState !== "visible") return;
      busy = true;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && sessionNeedsEarlyRefresh(session, Date.now())) {
          const { error } = await supabase.auth.refreshSession();
          if (error) console.warn("[auth] early refresh failed:", error.message);
        }
      } catch (e) {
        console.warn("[auth] early refresh threw:", e);
      } finally {
        busy = false;
      }
    };
    void check();
    const timer = setInterval(check, EARLY_REFRESH_CHECK_MS);
    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("focus", check);
    };
  }, [supabase, userId]);

  const signOut = async () => {
    // 打字問暖暖的對話、書本帶來的問題只放在這個分頁：登出就清掉（同一支手機換人用時看不到）
    try {
      Object.keys(sessionStorage)
        .filter((k) => k.startsWith("nuannuan_ask") || k.startsWith("nuannuan_photo_ask"))
        .forEach((k) => sessionStorage.removeItem(k));
    } catch { /* ignore */ }
    // 這台裝置不再收這個人的通知（例如女兒在媽媽手機登入過；最多等 3 秒，失敗也照樣登出）
    await Promise.race([
      import("@/lib/push/client").then((m) => m.releaseWebPushSubscription()).catch(() => undefined),
      new Promise((r) => setTimeout(r, 3000)),
    ]);
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, signOut, supabase, refreshProfile, setProfileDirectly }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}

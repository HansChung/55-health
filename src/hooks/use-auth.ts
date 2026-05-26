"use client";

import { useEffect, useState, useCallback } from "react";
import type { User } from "@supabase/supabase-js";
import { createSupabaseBrowser } from "@/lib/supabase/client";

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
  subscription_tier: "free" | "basic" | "pro";
  is_admin: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createSupabaseBrowser();

  // 主動拉一次 profile（外部呼叫 refreshProfile 用）
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      if (error) {
        console.error("[useAuth] fetchProfile error:", error);
        return null;
      }
      return data as AppProfile;
    } catch (e) {
      console.error("[useAuth] fetchProfile threw:", e);
      return null;
    }
  }, [supabase]);

  // 外部呼叫：重新從 DB 拉 profile（不重 mount）
  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const fresh = await fetchProfile(user.id);
    if (fresh) {
      console.log("[useAuth] refreshProfile: got", fresh.display_name);
      setProfile(fresh);
    }
  }, [user, fetchProfile]);

  // 外部呼叫：直接設定 profile（編輯後立刻更新 UI）
  const setProfileDirectly = useCallback((p: AppProfile) => {
    console.log("[useAuth] setProfileDirectly:", p.display_name);
    setProfile(p);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadInitial() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) console.error("[useAuth] getUser error:", error);
        if (!mounted) return;
        setUser(user);
        if (user) {
          const p = await fetchProfile(user.id);
          if (mounted && p) setProfile(p);
        }
      } catch (e) {
        console.error("[useAuth] loadInitial threw:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadInitial();

    const timeout = setTimeout(() => {
      if (mounted) {
        console.warn("[useAuth] loadInitial timeout - forcing loading=false");
        setLoading(false);
      }
    }, 5000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("[useAuth] auth event:", event, "user:", session?.user?.email);
        if (!mounted) return;
        setUser(session?.user ?? null);
        if (session?.user) {
          const p = await fetchProfile(session.user.id);
          if (mounted && p) setProfile(p);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);  // ← 只跑一次，不依賴 refreshCounter

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return {
    user, profile, loading, signOut, supabase,
    refreshProfile,
    setProfileDirectly,
  };
}

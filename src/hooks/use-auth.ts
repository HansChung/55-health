"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    let mounted = true;

    async function loadProfile(userId: string) {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();
        if (error) {
          console.error("[useAuth] loadProfile error:", error);
          return;
        }
        if (mounted && data) setProfile(data as AppProfile);
      } catch (e) {
        console.error("[useAuth] loadProfile threw:", e);
      }
    }

    async function loadInitial() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) console.error("[useAuth] getUser error:", error);
        if (!mounted) return;
        setUser(user);
        if (user) await loadProfile(user.id);
      } catch (e) {
        console.error("[useAuth] loadInitial threw:", e);
      } finally {
        if (mounted) setLoading(false); // 不管成功失敗都要結束 loading
      }
    }

    loadInitial();

    // 5 秒後強制結束 loading（防呆，避免永遠卡住）
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
        if (session?.user) await loadProfile(session.user.id);
        else setProfile(null);
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return { user, profile, loading, signOut, supabase };
}

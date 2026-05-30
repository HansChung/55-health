"use client";

import { useEffect, useState } from "react";
import { SubPage } from "@/components/sub-page";
import { api, type AchievementsResponse } from "@/lib/api-client";
import type { AchievementProgress } from "@/lib/achievements";

interface AchievementsScreenProps {
  onBack: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  streak: "連續打卡",
  meal: "飲食記錄",
  exercise: "運動",
  metric: "健康指標",
  medication: "用藥",
  voice: "暖暖對話",
  family: "家人",
};

const CATEGORY_ORDER = ["streak", "meal", "exercise", "metric", "medication", "voice", "family"];

export function AchievementsScreen({ onBack }: AchievementsScreenProps) {
  const [data, setData] = useState<AchievementsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getAchievements()
      .then(setData)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  const grouped = groupByCategory(data?.achievements ?? []);

  return (
    <SubPage
      title="健康成就"
      onBack={onBack}
      accent="linear-gradient(180deg, #F7E6BD 0%, transparent 100%)"
    >
      {loading && (
        <div style={{ padding: 40, textAlign: "center", color: "var(--ink-2)" }}>整理您的成就中…</div>
      )}
      {error && (
        <div style={{ padding: 16, background: "var(--berry-soft)", borderRadius: 14, color: "var(--berry)" }}>
          載入失敗：{error}
        </div>
      )}

      {!loading && data && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card" style={{ padding: 22, background: "linear-gradient(135deg, #FFF9EF 0%, #FBE6D4 100%)", textAlign: "center" }}>
            <div style={{ fontSize: 44, fontWeight: 800, color: "var(--primary-deep)", lineHeight: 1 }}>
              {data.unlocked_count}<span style={{ fontSize: "var(--fs-lg)", color: "var(--ink-2)" }}> / {data.total_count}</span>
            </div>
            <div style={{ fontSize: "var(--fs-base)", color: "var(--ink-2)", marginTop: 8 }}>
              已解鎖徽章
            </div>
            {data.stats.longest_meal_streak > 0 && (
              <div style={{ fontSize: "var(--fs-sm)", color: "var(--primary-deep)", fontWeight: 700, marginTop: 8 }}>
                🔥 最長連續記錄 {data.stats.longest_meal_streak} 天
              </div>
            )}
          </div>

          {CATEGORY_ORDER.filter((cat) => grouped[cat]?.length).map((cat) => (
            <div key={cat}>
              <div style={{ fontSize: "var(--fs-sm)", fontWeight: 800, color: "var(--ink-2)", margin: "4px 4px 10px", letterSpacing: "0.5px" }}>
                {CATEGORY_LABELS[cat] ?? cat}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {grouped[cat].map((item) => (
                  <AchievementCard key={item.achievement.id} item={item} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </SubPage>
  );
}

function AchievementCard({ item }: { item: AchievementProgress }) {
  const { achievement, unlocked, progress, progress_text } = item;
  return (
    <div className="card" style={{
      padding: 16,
      display: "flex", alignItems: "center", gap: 14,
      border: unlocked ? "1px solid var(--gold-soft)" : "1px solid var(--line)",
      background: unlocked ? "linear-gradient(135deg, #FFF9EF 0%, #FFFFFF 100%)" : "var(--surface)",
      opacity: unlocked ? 1 : 0.85,
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 16,
        background: unlocked ? "var(--primary-soft)" : "var(--bg-deep)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 30, flexShrink: 0,
        filter: unlocked ? "none" : "grayscale(1)",
      }}>
        {unlocked ? achievement.emoji : "🔒"}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "var(--fs-base)", fontWeight: 800, color: unlocked ? "var(--ink-1)" : "var(--ink-2)" }}>
          {achievement.title}
        </div>
        <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", lineHeight: 1.4, marginTop: 2 }}>
          {achievement.description}
        </div>
        {!unlocked && (
          <div style={{ marginTop: 8 }}>
            <div style={{
              height: 8, borderRadius: 999,
              background: "var(--bg-deep)", overflow: "hidden",
            }}>
              <div style={{
                width: `${progress}%`, height: "100%",
                background: "linear-gradient(90deg, #F4B58E, #E8845A)",
                borderRadius: 999,
              }} />
            </div>
            {progress_text && (
              <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-3)", marginTop: 4 }}>
                {progress_text}
              </div>
            )}
          </div>
        )}
      </div>
      {unlocked && (
        <div style={{
          fontSize: "var(--fs-xs)", fontWeight: 800, color: "#4F7A4E",
          background: "var(--sage-soft)", border: "1px solid #B5D2B0",
          borderRadius: 999, padding: "4px 10px", flexShrink: 0,
        }}>
          已達成
        </div>
      )}
    </div>
  );
}

function groupByCategory(items: AchievementProgress[]): Record<string, AchievementProgress[]> {
  return items.reduce((acc, item) => {
    const cat = item.achievement.category;
    (acc[cat] ??= []).push(item);
    return acc;
  }, {} as Record<string, AchievementProgress[]>);
}

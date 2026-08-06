"use client";

import { BlueprintScreen } from "@/screens/blueprint-screen";
import { useRouter } from "next/navigation";

import type { SparkSource } from "@/lib/chapter-opening";

export function SmartDeepLinkShell({
  mode,
  sparkSource = "spark_card",
}: {
  mode: "home" | "spark" | "chapter3";
  sparkSource?: SparkSource;
}) {
  const router = useRouter();
  return (
    <div style={{
      minHeight: "100dvh",
      maxWidth: 480,
      margin: "0 auto",
      background: "var(--bg, #FAF5EC)",
    }}>
      <BlueprintScreen
        initialMode={mode}
        sparkSource={sparkSource}
        onBack={() => router.push("/")}
      />
    </div>
  );
}

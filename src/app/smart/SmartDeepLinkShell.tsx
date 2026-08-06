"use client";

import { BlueprintScreen } from "@/screens/blueprint-screen";
import { useRouter } from "next/navigation";

export function SmartDeepLinkShell({
  mode,
}: {
  mode: "home" | "spark" | "chapter3";
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
        onBack={() => router.push("/")}
      />
    </div>
  );
}

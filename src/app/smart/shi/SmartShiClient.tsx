"use client";

import { SmartScreen } from "@/screens/smart-screen";
import { useRouter } from "next/navigation";

export function SmartShiClient() {
  const router = useRouter();
  return (
    <div
      style={{
        minHeight: "100dvh",
        maxWidth: 480,
        margin: "0 auto",
        background: "var(--bg, #FAF5EC)",
      }}
    >
      <SmartScreen
        onBack={() => router.push("/")}
        onBlueprint={() => router.push("/smart/radar")}
      />
    </div>
  );
}

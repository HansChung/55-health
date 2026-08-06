"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SmartDeepLinkShell } from "../SmartDeepLinkShell";
import { isSparkSource } from "@/lib/chapter-opening";

function SparkPageInner() {
  const params = useSearchParams();
  const raw = params.get("source");
  const sparkSource = isSparkSource(raw) ? raw : "spark_card";
  return <SmartDeepLinkShell mode="spark" sparkSource={sparkSource} />;
}

export function SparkPageClient() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: "100dvh", display: "flex", alignItems: "center",
        justifyContent: "center", color: "var(--ink-2)",
      }}>
        載入中…
      </div>
    }>
      <SparkPageInner />
    </Suspense>
  );
}

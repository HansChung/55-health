import type { Metadata } from "next";
import { SparkPageClient } from "./SparkPageClient";

export const metadata: Metadata = {
  title: "我的第一個 SMART RADAR 光點｜暖暖",
  description: "記錄一件日常小事，點亮人生羅盤上的第一個光點。",
};

/** QR：我的第一個 SMART RADAR 光點互動卡 */
export default function SmartSparkPage() {
  return <SparkPageClient />;
}

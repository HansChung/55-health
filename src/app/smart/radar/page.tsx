import type { Metadata } from "next";
import { SmartDeepLinkShell } from "../SmartDeepLinkShell";

export const metadata: Metadata = {
  title: "SMART RADAR 圓夢藍圖｜暖暖",
  description: "看見方向，點亮日常光點。R＝安全。",
};

/** QR：SMART RADAR 圓夢藍圖主頁 */
export default function SmartRadarPage() {
  return <SmartDeepLinkShell mode="home" />;
}

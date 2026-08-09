import type { Metadata } from "next";
import { SmartShiClient } from "./SmartShiClient";

export const metadata: Metadata = {
  title: "智慧幸福檢測 SHI｜暖暖",
  description: "私人 SMART 五方向觀察；不排名、不公開。是否保存由您決定。",
};

/** QR／章節深連結：完整智慧幸福檢測 */
export default function SmartShiPage() {
  return <SmartShiClient />;
}

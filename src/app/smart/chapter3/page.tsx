import type { Metadata } from "next";
import { SmartDeepLinkShell } from "../SmartDeepLinkShell";

export const metadata: Metadata = {
  title: "Chapter 3｜啟動 SMART RADAR｜暖暖",
  description: "完成第五章打卡點：啟動 SMART RADAR，點亮第一個光點。",
};

/** QR：Chapter 3 第五個打卡點 */
export default function SmartChapter3Page() {
  return <SmartDeepLinkShell mode="chapter3" />;
}

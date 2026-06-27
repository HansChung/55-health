// iOS 一次性設定（在 Mac 上 `npx cap add ios` 之後跑一次）
//
// 自動完成兩件 HealthKit 必要設定：
//   1. Info.plist 加入 NSHealthShareUsageDescription（+ Update，避免外掛初始化時缺 key 崩潰）
//   2. Podfile 的 iOS 部署目標拉到 15.0（capacitor-health 的 podspec 需要）
//
// 仍需你在 Xcode 手動做（需 Apple Developer 帳號、無法用腳本代勞）：
//   Signing & Capabilities → + Capability → HealthKit
//
// 用法：npm run ios:setup

import { existsSync, readFileSync, writeFileSync } from "node:fs";

const PLIST = "ios/App/App/Info.plist";
const PODFILE = "ios/App/Podfile";

if (!existsSync(PLIST)) {
  console.error(`✗ 找不到 ${PLIST}\n  請先在 Mac 上執行：npx cap add ios`);
  process.exit(1);
}

// ── 1. Info.plist：HealthKit 用途說明 ──
let plist = readFileSync(PLIST, "utf8");
const KEYS = [
  ["NSHealthShareUsageDescription", "暖暖會讀取您的運動與步數，幫您自動記錄每日活動。"],
  // 我們目前只讀不寫；外掛仍可能初始化寫入型別，保留此鍵避免執行期崩潰。
  ["NSHealthUpdateUsageDescription", "暖暖目前僅讀取健康資料，不會寫入您的健康 App。"],
];
let plistChanged = false;
for (const [key, val] of KEYS) {
  if (plist.includes(`<key>${key}</key>`)) continue;
  const entry = `\t<key>${key}</key>\n\t<string>${val}</string>\n`;
  plist = plist.replace(/<\/dict>\s*<\/plist>\s*$/, `${entry}</dict>\n</plist>\n`);
  plistChanged = true;
}
if (plistChanged) {
  writeFileSync(PLIST, plist);
  console.log("✓ Info.plist 已加入 HealthKit 用途說明");
} else {
  console.log("• Info.plist 已含 HealthKit 用途說明，跳過");
}

// ── 2. Podfile：部署目標 → iOS 15.0 ──
if (existsSync(PODFILE)) {
  let pod = readFileSync(PODFILE, "utf8");
  const m = pod.match(/platform :ios, '([\d.]+)'/);
  if (m && parseFloat(m[1]) < 15) {
    pod = pod.replace(/platform :ios, '[\d.]+'/, "platform :ios, '15.0'");
    writeFileSync(PODFILE, pod);
    console.log(`✓ Podfile 部署目標 ${m[1]} → 15.0`);
  } else {
    console.log("• Podfile 部署目標已 ≥ 15.0，跳過");
  }
} else {
  console.log("• 尚無 Podfile（cap add ios 後才會產生），略過 Podfile 設定");
}

console.log("\n下一步（Xcode，需 Apple Developer 帳號）：");
console.log("  Signing & Capabilities → + Capability → HealthKit");
console.log("然後：npm run ios:open");

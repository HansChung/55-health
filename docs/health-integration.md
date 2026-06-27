# 健康平台串接（Apple HealthKit + Google Health Connect）

只讀資料，一份程式同時接 **iPhone（Apple HealthKit）** 與 **Android（Google Health Connect）**。
透過 [`capacitor-health`](https://github.com/mley/capacitor-health) 外掛（Capacitor 8 相容）。

> 此功能**只在原生 App 內有效**。Web / PWA 沒有 HealthKit / Health Connect，畫面會自動隱藏同步入口。

---

## Phase 1 範圍（目前已實作）

| 項目 | 行為 |
|------|------|
| 運動 / 訓練 workouts | 讀最近 7 天 → 寫進 `exercises` 表（去重，可重複同步） |
| 今日步數 steps | 即時讀取顯示在運動畫面，**不寫入 DB** |
| 卡路里 | 跟著 workout 一起帶入 `kcal_burned` |

之後可擴充（Phase 2）：體重 / 血壓 / 血糖 / 心率 → 寫進 `health_metrics`，步數持久化、背景同步。

---

## 程式架構

```
Apple 健康 / Health Connect（裝置）
  └─ capacitor-health 外掛（原生）
       └─ src/lib/health-sync.ts        ← 共用層：權限 / 讀運動 / 讀步數 / 去重
            └─ src/lib/api-client.ts     ← POST /api/exercises（source=health, external_id）
                 └─ /api/exercises        ← upsert ignore（DB 去重）
                      └─ exercises 表（+ source, external_id 欄位）
```

- 共用層：`src/lib/health-sync.ts`
- UI 入口：`src/screens/exercise-screen.tsx`（運動畫面上方「健康資料同步」卡）
- 去重：`exercises.external_id` + partial unique index（見 `supabase/add-exercise-source.sql`）

### 去重邏輯
每筆運動帶平台的唯一 `external_id`（拿不到時用 `來源:開始時間` 組合）。後端用
`upsert ... onConflict(user_id, external_id) ignoreDuplicates`，所以**重複按同步不會產生重複資料**。

---

## 上線前置作業

### 0. 套用 DB migration
把 `supabase/add-exercise-source.sql` 在 Supabase SQL Editor 跑一次（給 `exercises` 加 `source` / `external_id`）。

### 1. Android（Health Connect）

讀取權限已由外掛 `AndroidManifest.xml` 自動合併（READ_STEPS / READ_EXERCISE / READ_ACTIVE_CALORIES_BURNED…）。
App 端已補上 **權限說明 intent**（`android/app/src/main/AndroidManifest.xml`）：
- `androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE`
- Android 14+ 的 `ViewPermissionUsageActivity`（`VIEW_PERMISSION_USAGE` + `HEALTH_PERMISSIONS`）

建置：
```bash
npm run android:build      # next build + cap sync
npm run android:open       # Android Studio
```

測試需求：
- 實機或模擬器需安裝 **Health Connect** app（Android 14 以下需從 Play 商店裝；外掛的
  `showHealthConnectInPlayStore()` 可導去安裝）。
- Health Connect 內要先有資料（手錶 / Google Fit / 三星健康同步進來）才讀得到。

> ⚠️ 上 Google Play 時需在 Play Console 填寫 **Health Connect 資料使用聲明**，並提供隱私政策（本專案已有 `/privacy`）。

### 2. iOS（Apple HealthKit）— 需要 Mac

`@capacitor/ios` 已加入 package.json，iOS build 腳本（`ios:setup` / `ios:build` / `ios:open`）也已備好。
**第一次**在 Mac 上建立 iOS 平台：

```bash
npx cap add ios     # 一次性：產生 ios/ 原生專案（需 Mac + CocoaPods）
npm run ios:setup   # 自動補 Info.plist（HealthKit 用途說明）+ Podfile 部署目標拉到 15.0
npm run ios:open    # 靜態匯出 → cap sync ios → 開 Xcode
```

`npm run ios:setup` 由 `scripts/ios-setup.mjs` 完成，會自動寫入：
- `NSHealthShareUsageDescription`（讀取健康資料的用途說明，缺了會審查打回 / 執行期崩潰）
- `NSHealthUpdateUsageDescription`（目前只讀，但外掛可能初始化寫入型別，保留避免崩潰）
- Podfile `platform :ios, '15.0'`（`capacitor-health` podspec 要求）

**只剩一件 Xcode 手動步驟**（需 Apple Developer 帳號，無法腳本化）：
> **Signing & Capabilities → + Capability → HealthKit**

然後用**實體 iPhone** 測試（模擬器健康資料有限）。

> ⚠️ App Store 審查：健康資料不得用於廣告或轉售；需有隱私政策連結（本專案已有 `/privacy`）；App Privacy 要如實申報讀取 Health 資料。

---

## 帳號 / 硬體需求小抄

| 需求 | 必要性 |
|------|--------|
| Mac（Xcode 編譯 iOS） | iPhone 版必備 |
| Apple Developer 帳號（US$99/年） | 啟用 HealthKit capability、上架 App Store／TestFlight 必備（自測可用免費 Apple ID，7 天簽章） |
| Android Studio | Android 版編譯 |
| 裝置上的 Health Connect / 健康 app 有資料 | 測試讀取必備 |

---

## 手動驗證清單

- [ ] DB migration 已套用
- [ ] Android：安裝 Health Connect 並授權後，按「立即同步」→ 運動出現在列表、步數顯示
- [ ] 重複按「立即同步」→ 不產生重複運動（去重生效）
- [ ] Web：運動畫面**看不到**同步卡（feature 偵測正常）
- [ ] iOS：HealthKit 權限彈窗出現、授權後可同步

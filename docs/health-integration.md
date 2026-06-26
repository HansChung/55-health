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

專案目前還沒有 `ios/` 平台，第一次要先建立：
```bash
npm i @capacitor/ios
npx cap add ios
npm run android:build   # 或自行 BUILD_TARGET=mobile next build 後 npx cap sync ios
npx cap open ios        # Xcode
```

在 Xcode：
1. **Signing & Capabilities → + Capability → HealthKit**（需要 Apple Developer 帳號）。
2. `Info.plist` 加入用途說明（沒有會直接被審查打回）：
   ```xml
   <key>NSHealthShareUsageDescription</key>
   <string>暖暖會讀取您的運動與步數，幫您自動記錄每日活動。</string>
   ```
   （只讀資料**不需要** `NSHealthUpdateUsageDescription`。）
3. 用**實體 iPhone** 測試（模擬器的健康資料有限）。

> ⚠️ App Store 審查：健康資料不得用於廣告或轉售；需有隱私政策連結；App Privacy 要如實申報讀取 Health 資料。

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

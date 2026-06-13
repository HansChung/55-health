# 暖暖 55+ App — Cursor AI 接手筆記

> 給 Cursor AI（或下一個接手 AI）的完整背景說明
> 最後更新：2026-05-31
> **正式網域**：https://nuan55.com（已購買並接 Vercel；舊網址 vercel.app 仍可當備用）
> 最近幾輪由 Cursor 加了：用藥提醒、合作活動、語音控費、每週報告、方案分級、LINE 分享、提醒中心、後台 CTR、語音對話存 DB、管理後台對話記錄、刪餐後刷新建議、健康成就徽章、**緊急 SOS 按鈕**、**成就首頁入口 + 解鎖慶祝動畫**
> 最近修的 bug：語音 session_id 在無 crypto.randomUUID 時用合法 UUID v4 fallback、成就連續天數改用固定 UTC+8 計算（修正 Vercel UTC 伺服器跨日問題）

---

## 📋 專案一句話

**「暖暖」是給 55 歲以上長者用的 AI 飲食 / 健康追蹤 App**，已部署 production：
- 🌐 **正式網址**：https://nuan55.com
- 🌐 **Vercel 備用**：https://55-health-eisp.vercel.app（仍可用，建議對外只用 nuan55.com）
- 📦 **GitHub**：https://github.com/HansChung/55-health
- 🎨 **UI 風格**：暖橘色系、大字、簡潔；mascot 角色「暖暖」（橘子人）
- 🇹🇼 **語言**：繁體中文（台灣口語）

---

## 🔧 技術棧

```
Next.js 15 (App Router) + React 19 + TypeScript
↓
Supabase（DB + Auth + Storage）
↓
Gemini 2.5 Flash（拍照辨識、藥袋辨識、AI 建議）
OpenAI Realtime GA（語音對話）
↓
Vercel（部署，每次 git push 自動 redeploy）
Capacitor（Android 打包，未實測）
```

### 重要連結
| 服務 | URL | 帳號 |
|------|-----|------|
| **Production（正式）** | https://nuan55.com | — |
| Vercel 備用 | https://55-health-eisp.vercel.app | — |
| GitHub | https://github.com/HansChung/55-health | HansChung |
| Vercel | https://vercel.com/hanschungs-projects/55-health | sunboy1120@gmail.com |
| Supabase | https://supabase.com/dashboard/project/ydnvjqvstmprdciwkkyl | sunboy1120@gmail.com |
| Supabase Project ID | `ydnvjqvstmprdciwkkyl` | — |
| Google Cloud（Gemini）| gen-lang-client-0865704324 | **已綁定 billing** |
| OpenAI | platform.openai.com | 已綁 billing |
| Resend（SMTP）| resend.com | 程式已用 `noreply@nuan55.com`；需在 Resend 驗證 **nuan55.com** 才能對外寄信 |

---

## 📂 專案結構（**最新**）

```
src/
├── app/
│   ├── api/
│   │   ├── ai/
│   │   │   ├── analyze-food/route.ts         # POST: Gemini 拍照辨識
│   │   │   ├── analyze-prescription/route.ts  # POST: 拍藥袋辨識
│   │   │   ├── suggest/route.ts               # GET: AI 建議
│   │   │   ├── realtime-session/route.ts      # POST: 語音 session（含 max_seconds 控費）
│   │   │   └── realtime-sdp/route.ts          # POST: SDP proxy（避 CORS）
│   │   ├── admin/
│   │   │   ├── usage/route.ts                 # token 用量
│   │   │   ├── users/route.ts                 # 會員列表
│   │   │   ├── users/[id]/route.ts            # 修改會員
│   │   │   └── api-configs/route.ts           # API key 管理
│   │   ├── auth/callback/route.ts             # OAuth 回調
│   │   ├── meals/route.ts                     # GET/POST
│   │   ├── meals/[id]/route.ts                # DELETE
│   │   ├── exercises/route.ts                 # GET/POST
│   │   ├── profile/route.ts                   # GET/PATCH（含 medications jsonb）
│   │   ├── family/route.ts                    # GET/POST
│   │   ├── family/[id]/route.ts               # PATCH/DELETE
│   │   ├── health-metrics/route.ts            # 體重/血壓/血糖
│   │   ├── health-metrics/[id]/route.ts       # DELETE
│   │   ├── favorite-meals/route.ts            # ⭐ 常吃餐點 GET/POST
│   │   ├── favorite-meals/[id]/route.ts       # DELETE
│   │   ├── partner-campaigns/route.ts         # ⭐ 合作活動 GET (公開) + admin CRUD
│   │   ├── partner-campaigns/[id]/route.ts    # ⭐ PATCH/DELETE + 點擊追蹤
│   │   ├── reports/weekly/route.ts            # ⭐ 每週健康報告 GET
│   │   ├── achievements/route.ts              # ⭐ 健康成就 GET（即時計算，無 DB 表）
│   │   ├── conversations/route.ts             # 語音對話 GET/POST（存 DB）
│   │   ├── admin/conversations/route.ts       # 後台對話記錄 GET
│   │   └── stripe/
│   │       ├── checkout/route.ts
│   │       └── webhook/route.ts
│   ├── admin/                                 # 管理後台 UI
│   │   ├── page.tsx                           # 總覽
│   │   ├── usage/page.tsx                     # Token 用量
│   │   ├── users/page.tsx                     # 會員管理
│   │   ├── partner-campaigns/page.tsx         # ⭐ 合作活動管理 + CTR 統計
│   │   ├── api-configs/page.tsx               # API 設定
│   │   └── conversations/page.tsx             # 對話記錄（佔位）
│   ├── auth/callback/route.ts
│   ├── pricing/page.tsx
│   ├── privacy/page.tsx                       # 隱私政策（OAuth 審核用）
│   ├── terms/page.tsx                         # 服務條款
│   ├── page.tsx                               # ★ 主 App（state 集中管理 + 畫面路由）
│   └── layout.tsx                             # AuthProvider 包在 root
├── components/
│   ├── mascot.tsx                             # 暖暖 SVG 角色
│   ├── icons.tsx                              # Icon system（含 phone / sos）
│   ├── photo-source-sheet.tsx                 # 拍照/上傳選擇彈窗
│   ├── sos-button.tsx                         # ⭐ 緊急 SOS 浮動按鈕 + 求助視窗（自包含，讀 AuthContext）
│   ├── achievement-toast.tsx                  # ⭐ 解鎖成就慶祝動畫
│   └── calorie-ring.tsx, macro-bar.tsx, sub-page.tsx, toggle.tsx, ...
├── screens/                                   # 20 個畫面
│   ├── home-screen.tsx                        # 首頁（含真實 macro、用藥提醒、合作活動 CTA、成就入口、SOS 按鈕）
│   ├── camera-screen.tsx                      # 真實相機 (getUserMedia)
│   ├── result-screen.tsx                      # 拍照結果（可編輯食物）
│   ├── voice-screen.tsx                       # 語音對話（含 max_seconds 倒數）
│   ├── login-screen.tsx                       # **只有 Google 登入**（email OTP 隱藏）
│   ├── edit-profile-screen.tsx
│   ├── chronic-disease-screen.tsx             # 慢性病設定 + 拍藥袋入口
│   ├── prescription-scan-screen.tsx           # 拍藥袋（含 PrescriptionCamera + reminder times）
│   ├── health-metrics-screen.tsx              # 體重/血壓/血糖
│   ├── exercise-screen.tsx                    # 運動記錄
│   ├── family-share-screen.tsx                # 家人共享（含邀請碼）
│   ├── notification-screen.tsx                # 通知設定
│   ├── meal-detail-sheet.tsx                  # 餐點 detail（含「存成常吃」按鈕）
│   ├── history-screen.tsx                     # 飲食日記
│   ├── profile-screen.tsx                     # 我的
│   ├── suggestion-sheet.tsx                   # AI 建議
│   ├── weekly-report-screen.tsx               # ⭐ 每週健康報告
│   ├── alerts-center-screen.tsx               # ⭐ 提醒中心（用藥 + 健康警示）
│   ├── achievements-screen.tsx                # ⭐ 健康成就徽章牆
│   ├── font-size-screen.tsx
│   └── onboarding-screen.tsx
├── lib/
│   ├── ai/
│   │   ├── gemini.ts                          # Gemini 拍食物
│   │   ├── pricing.ts                         # 計費表
│   │   └── usage-tracker.ts                   # ★ token 計費 + 配額（含 admin bypass + remainingSeconds）
│   ├── supabase/
│   │   ├── client.ts                          # createBrowserClient
│   │   └── server.ts                          # createServerClient + admin client
│   ├── api-client.ts                          # ★ 前端 fetch wrapper + 17 個 interfaces
│   ├── admin-guard.ts                         # 管理員驗證
│   ├── meal-utils.ts                          # 餐點 slot merge
│   ├── realtime-client.ts                     # OpenAI WebRTC client（走 proxy）
│   ├── image-utils.ts                         # 圖片壓縮 + HEIC 轉檔
│   ├── upload-photo.ts                        # 上傳到 Supabase Storage
│   ├── medication-utils.ts                    # ⭐ 用藥提醒推斷時段
│   ├── health-alerts.ts                       # ⭐ 健康警示生成（血壓/血糖異常）
│   ├── feature-gates.ts                       # ⭐ 訂閱方案功能解鎖
│   ├── achievements.ts                        # ⭐ 成就定義 + streak 計算（即時算，無 DB 表）
│   ├── types.ts
│   └── mock-data.ts                           # 還有少量 mock
├── hooks/
│   └── use-auth.tsx                           # ⭐ AuthContext（全 App 共享）
supabase/
├── schema.sql                                 # 完整 8 表 schema
├── fix-trigger.sql                            # profile trigger 修正
├── add-notifications.sql                      # 通知設定欄位
├── bump-quota.sql                             # 配額調整 + 設 admin
├── setup-storage.sql                          # meal-photos bucket
├── add-health-metrics.sql                     # 健康指標表
├── add-favorite-meals.sql                     # ⭐ 常吃餐點表
├── add-partner-campaigns.sql                  # ⭐ 合作活動表（含 click 統計）
├── add-emergency-contact.sql                  # ⭐ 緊急聯絡人欄位（SOS 用）
└── update-voice-quotas.sql                    # ⭐ 語音控費表更新
android/                                       # Capacitor Android（未實測）
```

---

## ✅ 完整功能總覽

### 認證
- [x] Google OAuth 一鍵登入（**目前唯一可見登入方式**）
- [x] Email OTP（程式碼還在但 UI 隱藏，等買網域可恢復）
- [x] `/auth/callback` 處理 OAuth code
- [x] **React Context** 共享 auth state（不能每個 component 自己 useAuth）

### AI 整合
- [x] Gemini 2.5 Flash 拍照辨識（食物 + 藥袋）
- [x] OpenAI Realtime GA 語音對話（WebRTC + ephemeral key + **SDP proxy**）
- [x] AI 個性化建議（首頁卡片 + 詳細 sheet + 換個建議按鈕）
- [x] Token 用量追蹤 + 配額檢查
- [x] 管理員自動 bypass 配額
- [x] AI 建議快取 1 小時到 localStorage
- [x] **語音 max_seconds 倒數控費**（避免單次通話無限燒錢）

### 拍照 / 上傳
- [x] 真實相機 getUserMedia（前後鏡頭、翻轉）
- [x] 上傳照片 + HEIC 自動轉 JPEG（`heic2any`）
- [x] 圖片壓縮（長邊 1280px、JPEG 85%）
- [x] PhotoSourceSheet（拍照 OR 上傳，**用 `<label>` 包 input** 才能在 iOS Safari 穩定）
- [x] 照片存 Supabase Storage（meal-photos bucket）
- [x] 首頁/日記列表顯示真實照片縮圖
- [x] 餐點 detail sheet 顯示大圖

### 餐點 / 運動 / 常吃
- [x] 餐點 CRUD（樂觀更新 UI，不擋）
- [x] 餐點編輯（名稱 / 份量 / 卡路里 / 刪除）
- [x] 餐點 detail sheet（含完整營養 + 刪除）
- [x] ⭐ **「存成常吃餐點」** → favorite_meals 表 → 之後一鍵複製
- [x] 運動快速記錄 + 週圖表

### 健康追蹤
- [x] 體重 / 血壓 / 血糖（health_metrics 表）
- [x] 30 天趨勢圖
- [x] 狀態判斷（正常/偏高/偏低，內建血壓血糖標準）
- [x] 大字輸入 + 預填上次值
- [x] 血糖時段標記（空腹/餐前/餐後/睡前）
- [x] ⭐ **健康警示自動生成**（`lib/health-alerts.ts` 偵測異常）

### 拍藥袋 + 用藥提醒（⭐ 全新）
- [x] Gemini 解析藥袋 → 提取藥名/用法/注意/副作用
- [x] 結果頁完整資訊顯示
- [x] **自動推斷服藥時段**（`medication-utils.ts` 從用法文字推早/中/晚/睡前）
- [x] 一鍵加入用藥清單（含 reminder_enabled、reminder_times、taken_today）
- [x] **提醒中心** `/alerts-center` 顯示今天該吃的藥
- [x] 標記「已吃」記錄到 medications.last_taken_at
- [x] **PrescriptionCamera** 專用相機（不走 file input）

### 每週健康報告（⭐ 全新）
- [x] `/api/reports/weekly` 自動生成
  - 本週飲食總結（餐數、平均卡路里）
  - 運動天數
  - 健康指標趨勢
  - 規則式鼓勵 + 建議（不即時呼叫 AI，控成本）
- [x] `weekly-report-screen.tsx` 顯示報告
- [x] **LINE 分享給家人**（Web Share API + 剪貼簿 fallback，專業版）

### 健康成就徽章（⭐ 全新）
- [x] `lib/achievements.ts` 定義 15+ 成就（飲食/連續打卡/運動/指標/用藥/語音/家人）
- [x] `/api/achievements` 由現有資料**即時計算**（不需新 DB 表、零 AI 成本）
- [x] `computeStreaks()` 算最長 + 目前連續記錄天數
- [x] `achievements-screen.tsx` 徽章牆：總覽 + 分類顯示 + 未解鎖進度條
- [x] 入口在「我的 → 健康成就」**＋ 首頁徽章入口卡片**（顯示已解鎖數 + 最新徽章 + 連續天數）
- [x] **解鎖慶祝動畫**（`achievement-toast.tsx`）：達成新徽章跳彈跳視窗，可逐一播放多個
  - 用 localStorage `nuannuan_unlocked_v1` 比對已解鎖清單偵測「新解鎖」
  - **首次載入只建立基準、不誤報**（不會把既有成就全部慶祝一遍）
  - 餐點/指標/用藥改變或關閉子頁面時自動重算（`reloadAchievements`）

### 緊急 SOS 求助按鈕（⭐ 全新）
- [x] 首頁右下角紅色「求助」浮動按鈕（捲動時固定，position absolute 在 `.app-root` 內）
- [x] 求助視窗：①打電話給緊急聯絡人（`tel:`）②用 LINE 傳求助訊息 ③撥打 119
- [x] 首次使用引導設定緊急聯絡人（姓名 + 電話）→ 存 `profiles.emergency_contact` jsonb
- [x] `sos-button.tsx` 自包含、直接讀 `useAuth` context
- [x] **需先跑 `supabase/add-emergency-contact.sql`**（新增 emergency_contact 欄位）

### 個人資料
- [x] 編輯個資（姓名/年齡/性別/卡路里/AI 語氣）
- [x] 慢性病多選 + 手動加藥
- [x] 字級切換、登出

### 家人共享
- [x] 邀請碼產生（XXX-XXX，24 小時有效）
- [x] 權限切換（4 種：卡路里/警示/日記/語音）
- [x] 移除家人
- [x] **LINE 分享邀請碼**（一鍵打開 LINE 傳訊息）

### 通知設定
- [x] 7 種提醒 toggle（即時存 DB）
- [x] notification_settings jsonb 欄位

### 合作活動（⭐ 全新）
- [x] partner_campaigns 表（藥局、醫療、健身房等合作）
- [x] 首頁推薦 CTA（特定方案/條件顯示）
- [x] 點擊追蹤（CTR 統計）
- [x] **管理後台**：新增/編輯/停用活動，看 CTR

### 訂閱方案分級（⭐ 全新）
- [x] `lib/feature-gates.ts` 定義各方案功能
- [x] `hasFeature(profile, "feature_key")` 判斷是否解鎖
- [x] 鎖住功能會顯示「升級提示」+ 跳到 `/pricing`

### 管理後台（/admin）
- [x] 總覽（成本/次數/Top 用戶）
- [x] Token 用量（按服務、按天）
- [x] 會員管理（搜尋、改方案、設管理員）
- [x] **合作活動管理**（CTR 統計）
- [x] API key 管理介面
- [x] **對話記錄**（依 session 分組、可搜尋 email/姓名/內容、展開看訊息泡泡）

### 法律 / 商業
- [x] 隱私政策頁 `/privacy`
- [x] 服務條款頁 `/terms`
- [x] 訂閱方案頁 `/pricing`（3 方案）
- [x] Stripe Checkout + Webhook（**未啟用，需要 Stripe key**）

### Build / 品質
- [x] **TypeScript 錯誤已修完**（`next.config.ts` 已移除 `ignoreBuildErrors`）
- [x] 首頁 macro 數字用真實 DB 數據（不再是粗估）

---

## 🌐 網域 nuan55.com（2026-05-31 已設定）

### 已完成
- [x] 購買並在 Vercel 綁定 **nuan55.com**
- [x] 程式／Email 模板已以 `nuan55.com` 為對外網址（見 `src/lib/email/`、`supabase/email-templates/`）
- [x] 登入 `redirectTo` 用 `window.location.origin` → 在 nuan55.com 上會自動走正確 callback

### 請在後台確認（若還沒做，功能可能仍走舊網址或登入失敗）

| 位置 | 要做的事 |
|------|----------|
| **Vercel** → Project → Settings → Environment Variables | `NEXT_PUBLIC_APP_URL` = `https://nuan55.com` → **Save 後 Redeploy** |
| **Supabase** → Authentication → URL Configuration | Site URL = `https://nuan55.com`；Redirect URLs 加入 `https://nuan55.com/**` 與 `https://nuan55.com/auth/callback` |
| **Google Cloud** → OAuth 用戶端 | 已授權的 JavaScript 來源：`https://nuan55.com`；重新導向 URI：`https://ydnvjqvstmprdciwkkyl.supabase.co/auth/v1/callback`（Supabase 代轉，通常不用改） |
| **Google Cloud** → OAuth 同意畫面 | 應用程式首頁 `https://nuan55.com`；隱私權 `https://nuan55.com/privacy`；服務條款 `https://nuan55.com/terms` → 可 **Publish to Production** 或送審消除「未驗證」 |
| **Resend** → Domains | 新增 **nuan55.com**，依指示設 DNS，顯示 Verified 後 `noreply@nuan55.com` 才能寄給所有人 |
| **Stripe**（之後） | Webhook / Checkout 成功網址會讀 `NEXT_PUBLIC_APP_URL`，設好 env 即可 |

---

## 🐛 已知問題

### 高優先級
1. **Google OAuth 可能仍是「Testing」** — 若未 Publish，朋友 Gmail 仍要加測試白名單
   - 只用 email/基本 profile → 可直接 **Publish app**（不必完整送審）
   - 要消除「Google 尚未驗證此應用程式」→ 用 **nuan55.com** 填同意畫面後送審
   - Console：https://console.cloud.google.com/auth/audience（確認選對 OAuth 專案）

### 中優先級
2. **每週報告是手動觸發**（用戶開頁面才生成）— 沒有 Cron 自動寄 email
3. **PWA / 通知推播沒做** — 純 web 沒辦法做手機背景提醒（要 Capacitor 打包才行）

### ✅ 已修復（最近幾輪）
- ~~AI 建議改完餐點後不會自動更新~~ → `handleSaveMeal` / 刪餐 / 複製餐後都呼叫 `loadSuggestion(true)`
- ~~OpenAI Realtime 對話內容沒存 DB~~ → 語音 transcript 透過 `/api/conversations` 存入
- ~~管理後台「對話記錄」是佔位~~ → 已實作（分組、搜尋、展開訊息）
- ~~語音 session_id 無 crypto.randomUUID 時存檔失敗~~ → 改用合法 UUID v4 fallback（後端 `z.string().uuid()` 才不會擋）
- ~~成就連續天數用 UTC 算，Vercel(UTC) 伺服器上台灣半夜/早上記錄被歸前一天~~ → 改固定 UTC+8 計算

### 低優先級
7. **Stripe 訂閱付費未啟用** — 程式寫好了，需要 Stripe key 4 個
8. **Android 還沒實測** — Capacitor 設定好但沒在真機跑過
9. **Resend 網域驗證** — 程式已寫 `noreply@nuan55.com`，需在 Resend Dashboard 把 **nuan55.com** 驗證通過（DNS）
10. **Email OTP 登入 UI 隱藏** — 程式碼還在 `login-screen.tsx`

---

## ⚠️ 重要陷阱（踩過的雷，務必記住）

### AI 相關
1. **Gemini 2.5 Pro 免費額度 = 0** — 永遠用 `gemini-2.5-flash` 或 `flash-lite`
   - `src/lib/ai/gemini.ts` 有強制保險絲：env var 設 pro 也會被改回 flash
2. **OpenAI Realtime GA endpoint**：`/v1/realtime/client_secrets`（建立 session）
   - **WebRTC SDP exchange 必須走 server proxy**（`/api/ai/realtime-sdp`），OpenAI 不開放瀏覽器 CORS
   - 模型名稱：`gpt-realtime`（**沒有 `-2`**）
   - **每分鐘 ~NT$10**，必須有 `max_seconds` 控費
3. **Gemini 圖片大小** — 永遠先壓縮到 **1280px、JPEG 85%**（`lib/image-utils.ts`）
   - 大圖會讓 data URL 太長，瀏覽器拒絕渲染（顯示黑色）
   - iPhone HEIC 用 `heic2any` 自動轉 JPEG

### Auth 相關
4. **`useAuth` 必須用 Context**（不能每個 component 自己 `useAuth()`）
   - 已重構為 `AuthProvider` 包在 `layout.tsx`
   - 編輯 profile 後用 `setProfileDirectly()` 直接更新全域 state
5. **Supabase API key 是新格式**（`sb_publishable_...` / `sb_secret_...`，不是 JWT）
6. **`getSession()` 比 `getUser()` 快**（local 讀取，不打網路）

### iOS Safari 相關
7. **File input 必須用 `<label>` 包**（不能用 hidden input + .click()）— iOS Safari quirk
8. **完成 OAuth 登入** 後一定要到 `/auth/callback` 換 session

### 部署 / TypeScript
9. **env var 改了要重新部署才生效**（不會 hot reload）
10. **`.env.local` 變動需要重啟 dev server**
11. **TypeScript 現在會 strict 檢查**（`next.config.ts` 已不再跳過）— 寫新功能要型別正確
12. **`use-auth.ts` 含 JSX 必須是 `.tsx`**
13. **不要手動跑 `npm run build`** — 會撞死 dev server。直接 `git push` 讓 Vercel 跑

### React / UX
14. **樂觀更新原則**：先關 modal + 更新本地 state，API 在背景送（避免 UI 卡住）
15. **analyzing overlay 可能蓋住 result modal** — 用 `modal !== "result"` 條件擋
16. **多 component 共用資料用 props 或 Context，不要各自 useAuth**

---

## 🎯 接手建議的下一步

### 短期（差異化）
1. **每週報告 / 異常預警自動寄 email**
   - 已有 `vercel.json` cron → `/api/cron/check-anomalies`（每日 UTC 1:00）
   - 需在 Resend **驗證 nuan55.com** + Vercel 設 `RESEND_API_KEY`
   - 每週報告 cron 可再加（見 `docs/異常預警-上線清單.md`）

### ✅ 已完成（原本列在下一步）
- ~~AI 建議改完餐點後自動更新~~
- ~~語音對話內容存 DB~~
- ~~管理後台「對話記錄」實作~~
- ~~連續打卡 + 健康成就徽章~~ → 改為**即時計算**，不需 `user_streaks` 表
- ~~緊急 SOS 按鈕~~ → 已完成（首頁浮動按鈕 + 撥電話/LINE/119 + 緊急聯絡人設定）
- ~~成就解鎖通知 / 首頁徽章入口~~ → 已完成（首頁入口卡片 + 解鎖慶祝動畫）
- ~~買網域 + 接 Vercel~~ → **nuan55.com** 已購買並設定

### 中期（商業化）
7. **Stripe 接好** — 真的能收錢
   - env vars：STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_BASIC, STRIPE_PRICE_PRO
8. **Google OAuth 送審（可選）** — 網域已有，可填 `nuan55.com/privacy` `/terms` 消除「未驗證」警告
9. **Resend 驗證 nuan55.com** — 完成後 Email 可寄給所有用戶（異常預警、每週報告）
10. **合作活動實際接洽藥局/診所** — 已有後台，找廠商上架

### 🤖 陪伴機器人（已規劃，暫緩實作 — 等 App 上架後）
- **商業定位**：下一版 App 將與 ESP32-S3 陪伴機器人「綁售」，兩者要深度連動（共用同一 Supabase 帳號／資料）。
- **完整計畫**：見 `.cursor/plans/暖暖陪伴機器人_*.plan.md`（裝置認證、裝置 API、語音 provider 抽換、分階段 + 豆包）。
- **現在開發 App 要注意**：核心邏輯盡量放 server 端 API（不要只在前端 client 算），機器人之後才能直接重用。例如用藥提醒 [src/lib/medication-utils.ts](src/lib/medication-utils.ts)、健康警示 [src/lib/health-alerts.ts](src/lib/health-alerts.ts) 目前在 client，未來需搬一份到 server。

### 長期
11. **Android Capacitor 打包 + 上 Play Store**
12. **iOS 版本**（需 Apple Developer $99/年）
13. **拍冰箱食材推薦食譜**
14. **語音輸入飲食記錄**（Whisper API）
15. **健保處方箋 NHI 卡整合**（很難但很值）

---

## 📊 用戶資訊

- **GitHub**: HansChung
- **Admin email**: sunboy1120@gmail.com（自動為管理員，無 AI 配額限制）
- **語言偏好**：繁體中文（台灣）回應
- **技術背景**：**非工程師**，需要手把手指引
  - 不要說「跑 schema」，要說「到 Supabase 點 SQL Editor，貼上下面這段，按 Run」
  - 多用截圖引導他點哪個按鈕
- **目標市場**：台灣 55+ 銀髮族 + 他們的家人

---

## 💰 成本概況

| 項目 | 月成本（100 用戶）| 月成本（1000 用戶）|
|------|-----------------|-----------------|
| Vercel | $0（Hobby）| $0 或 $20 |
| Supabase | $0（Free）| $0 或 $25 |
| Gemini Flash 拍照（食物 + 藥袋）| ~NT$30 | ~NT$300 |
| Gemini Flash Lite 建議 | ~NT$5 | ~NT$50 |
| OpenAI Realtime 語音 | **~NT$10,000** ⚠️ | **~NT$100,000** ⚠️ |
| Resend email | $0 | $0 或 $20 |

**重點**：語音是最貴的。已有 `max_seconds` 控費機制，但訂閱制才能真正抵銷成本。

---

## 🆘 求救指南

| 問題 | 看哪裡 |
|------|-------|
| Build 失敗 | Vercel Deployments → Build Logs |
| API 500 錯誤 | Vercel Functions → Runtime Logs |
| Supabase query 錯誤 | Supabase Dashboard → Logs → Postgres |
| Auth 問題 | Supabase Dashboard → Logs → Auth |
| OpenAI 額度爆 | https://platform.openai.com/usage |
| Gemini 額度爆 | https://aistudio.google.com/usage |

---

## 🔑 環境變數清單

完整在 `.env.example`。重點：

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://ydnvjqvstmprdciwkkyl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...

# Gemini（強制 flash，別填 pro）
GEMINI_API_KEY=AIza...
GEMINI_MODEL=gemini-2.5-flash

# OpenAI Realtime
OPENAI_API_KEY=sk-proj-...
OPENAI_REALTIME_MODEL=gpt-realtime    # 沒有 -2

# App（正式環境用 nuan55.com）
NEXT_PUBLIC_APP_URL=https://nuan55.com

# Admin（自動 bypass 配額）
ADMIN_EMAILS=sunboy1120@gmail.com

# Stripe（未啟用）
# STRIPE_SECRET_KEY=
# STRIPE_WEBHOOK_SECRET=
# STRIPE_PRICE_BASIC=
# STRIPE_PRICE_PRO=
```

---

## 🚀 部署工作流程

```bash
# 1. 本地開發
npm run dev

# 2. 改 code
# ...

# 3. push 即部署
git add .
git commit -m "..."
git push

# 4. ☕ 等 1-2 分鐘
# Vercel 自動部署到 https://nuan55.com（舊 vercel.app 網址仍可用）
```

**不要手動跑 `npm run build` 部署，會撞死 dev server。直接 `git push` 讓 Vercel 跑就好。**

---

## 📊 還沒跑的 SQL（如果接手環境是新的）

按順序跑（在 Supabase SQL Editor）：

1. `supabase/schema.sql` — 主 schema
2. `supabase/fix-trigger.sql` — profile auto-create
3. `supabase/add-notifications.sql` — 通知設定欄位
4. `supabase/bump-quota.sql` — 配額調整 + 設 admin
5. `supabase/setup-storage.sql` — meal-photos bucket
6. `supabase/add-health-metrics.sql` — 體重/血壓/血糖表
7. `supabase/add-favorite-meals.sql` — 常吃餐點表
8. `supabase/add-partner-campaigns.sql` — 合作活動表
9. `supabase/update-voice-quotas.sql` — 語音控費更新
10. `supabase/add-emergency-contact.sql` — 緊急聯絡人欄位（SOS 用）

如果是接手既有環境，**通常不用再跑**，只在新增表時補。

---

## 📝 給 Cursor AI 的話

你好！這專案：
1. **已經 95% 功能完成**，請先讀完這份 NOTES 再動手
2. **用戶非工程師** — 解釋每一步在做什麼，避免術語
3. **每改一塊就 push** — 用戶習慣立刻看到效果
4. **照片用 Supabase Storage** — 不要存 base64 到 DB
5. **AI 都用 Gemini Flash** — 不要用 Pro（沒額度）
6. **多用樂觀更新** — 用戶最討厭等 loading
7. **TypeScript 現在 strict** — 寫新 code 要顧型別

### 常用 commit message 風格（用戶喜歡的）
```
[功能] 簡短描述

✅ 做了什麼
✅ 解決什麼問題
✅ 影響到哪些檔案

需要先跑 supabase/xxx.sql（如果有）
```

### 如果遇到用戶說「我做完了」
**不要假設**，問他：
- ☐ 跑 SQL 看到 "Success" 嗎？
- ☐ Vercel 部署是綠色 Ready 嗎？
- ☐ 在手機測有沒有問題？

### 開始任何大改動前，先看：
1. **`src/app/page.tsx`** — 主 App，所有 state 與路由在這
2. **`src/lib/api-client.ts`** — 所有 API 入口 + 型別
3. **`src/hooks/use-auth.tsx`** — Auth state
4. **這份 NOTES**

### 用戶常踩的雷
- 改 env var 後忘記 redeploy
- 在 Supabase SQL Editor 沒貼到 SQL（剪貼簿被覆蓋）
- 開 Safari 時看舊版（要清 cache）
- 拿 iPhone HEIC 給瀏覽器（已自動轉但要等 2-3 秒）

---

## 🍊 最後

Hans Chung 是個非常願意嘗試新東西的用戶，會踩很多坑但都很有耐心。對他要：
- ✅ 友善
- ✅ 給選項
- ✅ 直接動手寫 code
- ✅ 看到 bug 就快修

祝接手順利 🚀

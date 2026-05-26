# 暖暖 55+ App — Cursor AI 接手筆記

> 這份文件給 Cursor AI 接手工作用
> 最後更新：2026-05-26
> 上個 AI 已完成大部分功能，請接續優化與新增

---

## 📋 專案一句話

**「暖暖」是給 55 歲以上長者用的 AI 飲食 / 健康追蹤 App**，已部署 production：
- 🌐 **網址**：https://55-health-eisp.vercel.app
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
```

### 重要連結
| 服務 | URL | 帳號 |
|------|-----|------|
| Production | https://55-health-eisp.vercel.app | — |
| GitHub | https://github.com/HansChung/55-health | HansChung |
| Vercel | https://vercel.com/hanschungs-projects/55-health | sunboy1120@gmail.com |
| Supabase | https://supabase.com/dashboard/project/ydnvjqvstmprdciwkkyl | sunboy1120@gmail.com |
| Supabase Project ID | `ydnvjqvstmprdciwkkyl` | — |
| Google Cloud（Gemini）| gen-lang-client-0865704324 | 已綁定 billing |
| OpenAI | platform.openai.com | 有付費額度 |
| Resend（SMTP）| resend.com | onboarding@resend.dev（test domain）|

---

## 📂 專案結構

```
src/
├── app/
│   ├── api/
│   │   ├── ai/
│   │   │   ├── analyze-food/route.ts        # POST: Gemini 拍照辨識
│   │   │   ├── analyze-prescription/route.ts # POST: 拍藥袋辨識 ⭐ 新
│   │   │   ├── suggest/route.ts              # GET: AI 建議
│   │   │   ├── realtime-session/route.ts     # POST: OpenAI 語音 session
│   │   │   └── realtime-sdp/route.ts         # POST: SDP proxy（避 CORS）⭐ 重要
│   │   ├── admin/
│   │   │   ├── usage/route.ts                # token 用量
│   │   │   ├── users/route.ts                # 會員列表
│   │   │   ├── users/[id]/route.ts           # 修改會員
│   │   │   └── api-configs/route.ts          # API key 管理
│   │   ├── auth/callback/route.ts            # OAuth 回調 ⭐ Google 登入用
│   │   ├── meals/route.ts                    # GET/POST 餐點
│   │   ├── meals/[id]/route.ts               # DELETE 餐點
│   │   ├── exercises/route.ts                # GET/POST 運動
│   │   ├── profile/route.ts                  # GET/PATCH 個資
│   │   ├── family/route.ts                   # GET/POST 家人邀請
│   │   ├── family/[id]/route.ts              # PATCH/DELETE 家人
│   │   ├── health-metrics/route.ts           # ⭐ 新 體重/血壓/血糖
│   │   ├── health-metrics/[id]/route.ts      # DELETE
│   │   └── stripe/
│   │       ├── checkout/route.ts
│   │       └── webhook/route.ts
│   ├── admin/                                # 管理後台 UI
│   ├── auth/callback/route.ts                # OAuth callback handler
│   ├── pricing/page.tsx
│   ├── privacy/page.tsx                      # 隱私政策（OAuth 審核用）
│   ├── terms/page.tsx                        # 服務條款
│   ├── page.tsx                              # ★ 主 App（state 管理 + 畫面路由）
│   └── layout.tsx                            # AuthProvider 包在 root
├── components/
│   ├── mascot.tsx                            # 暖暖 SVG 角色
│   ├── icons.tsx                             # Icon system
│   ├── photo-source-sheet.tsx                # ⭐ 拍照/上傳選擇彈窗
│   ├── calorie-ring.tsx, macro-bar.tsx, ...
├── screens/                                  # 15+ 個畫面
│   ├── home-screen.tsx                       # 首頁
│   ├── camera-screen.tsx                     # 真實相機（getUserMedia）
│   ├── result-screen.tsx                     # 拍照辨識結果（可編輯食物）
│   ├── voice-screen.tsx                      # 語音對話（WebRTC）
│   ├── login-screen.tsx                      # 只有 Google 登入（email OTP 已隱藏）
│   ├── edit-profile-screen.tsx               # 編輯個資
│   ├── chronic-disease-screen.tsx            # 慢性病設定 + 拍藥袋入口
│   ├── prescription-scan-screen.tsx          # ⭐ 新 拍藥袋
│   ├── health-metrics-screen.tsx             # ⭐ 新 體重/血壓/血糖
│   ├── exercise-screen.tsx                   # 運動記錄
│   ├── family-share-screen.tsx               # 家人共享（含邀請碼）
│   ├── notification-screen.tsx               # 通知設定
│   ├── meal-detail-sheet.tsx                 # 餐點 detail（可刪除）
│   ├── history-screen.tsx                    # 飲食日記
│   ├── profile-screen.tsx                    # 我的
│   ├── suggestion-sheet.tsx                  # AI 建議 + 「換個建議」
│   ├── font-size-screen.tsx
│   └── onboarding-screen.tsx
├── lib/
│   ├── ai/
│   │   ├── gemini.ts                         # Gemini 拍食物
│   │   ├── pricing.ts                        # 計費表（多家模型）
│   │   └── usage-tracker.ts                  # ★ token 計費 + 配額（含 admin bypass）
│   ├── supabase/
│   │   ├── client.ts                         # createBrowserClient
│   │   └── server.ts                         # createServerClient + admin client
│   ├── api-client.ts                         # ★ 前端 fetch wrapper + types
│   ├── admin-guard.ts                        # 管理員驗證
│   ├── meal-utils.ts                         # 餐點 slot merge 邏輯
│   ├── realtime-client.ts                    # OpenAI WebRTC client（走 proxy）
│   ├── image-utils.ts                        # ⭐ 圖片壓縮 + HEIC 轉檔
│   ├── upload-photo.ts                       # ⭐ 上傳到 Supabase Storage
│   ├── types.ts
│   └── mock-data.ts                          # 還有少量 mock（已逐步移除）
├── hooks/
│   └── use-auth.tsx                          # ⭐ AuthContext（全 App 共享）
supabase/
├── schema.sql                                # 完整 8 表 schema
├── fix-trigger.sql                           # profile trigger 修正
├── add-notifications.sql                     # 通知設定欄位
├── bump-quota.sql                            # 配額調整 + 設 admin
├── setup-storage.sql                         # ⭐ meal-photos bucket
└── add-health-metrics.sql                    # ⭐ 健康指標表
android/                                      # Capacitor Android（未實測）
```

---

## ✅ 已完成功能總覽

### 認證
- [x] Google OAuth 一鍵登入（**目前主要登入方式**）
- [x] Email OTP（程式留著但 UI 隱藏，等買網域才能正式用）
- [x] `/auth/callback` route 處理 OAuth code
- [x] React Context 共享 auth state

### AI 整合
- [x] **Gemini 2.5 Flash 拍照辨識**（食物 + 藥袋）
- [x] **OpenAI Realtime GA 語音對話**（WebRTC + ephemeral key）
- [x] **AI 個性化建議**（首頁卡片 + 詳細 sheet，含「換個建議」）
- [x] Token 用量追蹤 + 配額檢查
- [x] 管理員自動 bypass 配額
- [x] AI 建議快取 1 小時到 localStorage
- [x] 拍照結果含 Gemini 給的 `tip`（健康提醒）

### 拍照 / 上傳
- [x] 真實相機 `getUserMedia`（前後鏡頭、翻轉）
- [x] 上傳照片（含 HEIC 自動轉 JPEG）
- [x] 圖片壓縮（長邊 1280px、JPEG 85%）
- [x] PhotoSourceSheet 讓用戶選拍照 OR 上傳
- [x] 照片存 Supabase Storage（meal-photos bucket）
- [x] 首頁/日記列表顯示真實照片縮圖
- [x] 餐點 detail sheet 顯示大圖

### 餐點 / 運動
- [x] 餐點 CRUD（樂觀更新 UI，不擋）
- [x] 餐點編輯（名稱 / 份量 / 卡路里 / 刪除）
- [x] 餐點 detail sheet（含完整營養 + 刪除）
- [x] 運動快速記錄 + 週圖表

### 健康追蹤（NEW）
- [x] **體重 / 血壓 / 血糖**（health_metrics 表）
- [x] 30 天趨勢圖
- [x] 狀態判斷（正常/偏高/偏低）
- [x] 大字輸入 + 預填上次值
- [x] 血糖時段標記（空腹/餐前/餐後/睡前）

### 拍藥袋（NEW）
- [x] Gemini 解析藥袋 → 提取藥名/用法/注意/副作用
- [x] 結果頁完整資訊顯示
- [x] 一鍵加入用藥清單
- [x] 醫療免責聲明

### 個人資料
- [x] 編輯個資（姓名/年齡/性別/卡路里/AI 語氣）
- [x] 慢性病多選 + 手動加藥
- [x] 字級切換、登出

### 家人共享
- [x] 邀請碼產生（XXX-XXX，24 小時有效）
- [x] 權限切換（4 種：卡路里/警示/日記/語音）
- [x] 移除家人

### 通知設定
- [x] 7 種提醒 toggle（即時存 DB）
- [x] notification_settings jsonb 欄位

### 管理後台（/admin）
- [x] 總覽（成本/次數/Top 用戶）
- [x] Token 用量（按服務、按天）
- [x] 會員管理（搜尋、改方案、設管理員）
- [x] API key 管理介面
- [x] 對話記錄（佔位）

### 法律 / 商業
- [x] 隱私政策頁 `/privacy`
- [x] 服務條款頁 `/terms`
- [x] 訂閱方案頁 `/pricing`（3 方案）
- [x] Stripe Checkout + Webhook（**未啟用，需要 Stripe key**）

---

## 🐛 已知問題

### 高優先級
1. **TypeScript 錯誤未修** — `next.config.ts` 跳過 type-check，需逐個修
2. **AI 建議改完餐點後不會自動更新** — 要等 1 小時快取過期或用戶手動「換個建議」
3. **Google OAuth 還是「Testing」模式** — 朋友的 Gmail 要先加到測試清單才能登入
   - 改 Production：https://console.cloud.google.com/auth/audience?project=gen-lang-client-0140487937

### 中優先級
4. **首頁 macro 數字粗估** — `home-screen.tsx` 用 calories * 比例算，應從 DB 真實 protein_g 等加總
5. **OpenAI Realtime 對話內容沒存 DB** — 雖然 `conversations` 表有，但語音對話沒寫入
6. **管理後台「對話記錄」是佔位** — 沒實作

### 低優先級
7. **Stripe 訂閱付費未啟用** — 程式寫好了，需要 Stripe key 4 個
8. **Android 還沒實測** — Capacitor 設定好但沒在真機跑過
9. **Resend sender domain** — `onboarding@resend.dev` 只能寄給自己（要買網域才能解）
10. **Email OTP 登入 UI 已隱藏** — 程式碼還在 `login-screen.tsx`，要恢復把 `step === "email"` 那段下方的 button 加回來

---

## ⚠️ 重要陷阱（踩過的雷，請記住）

### AI 相關
1. **Gemini 2.5 Pro 免費額度 = 0**
   - **永遠用 `gemini-2.5-flash`**（食物/藥袋辨識）
   - `gemini-2.5-flash-lite`（文字建議）
   - 程式裡有強制保險絲：env var 設 pro 也會被改回 flash（`src/lib/ai/gemini.ts`）

2. **OpenAI Realtime API**
   - GA endpoint：`/v1/realtime/client_secrets`（建立 session）
   - **WebRTC SDP exchange 必須走 server proxy**（`/api/ai/realtime-sdp`），OpenAI 不開放瀏覽器 CORS
   - 模型名稱：`gpt-realtime`（**沒有 `-2`**）
   - 每分鐘 ~NT$10，需要設預算上限

3. **Gemini 圖片大小**
   - 永遠先壓縮到 **1280px、JPEG 85%**（`lib/image-utils.ts`）
   - 大圖會讓 data URL 太長，瀏覽器拒絕渲染（顯示黑色）
   - iPhone HEIC 用 `heic2any` 自動轉 JPEG

### Auth 相關
4. **`useAuth` 必須用 Context**（不能每個 component 自己 `useAuth()`）
   - 已重構為 `AuthProvider` 包在 `layout.tsx`
   - 編輯 profile 後用 `setProfileDirectly()` 直接更新全域 state

5. **Supabase API key 是新格式**（`sb_publishable_...` / `sb_secret_...`，不是 JWT）

6. **Magic Link vs OTP 模板**
   - `signInWithOtp` 預設寄連結，需到 Auth → Email Templates 改用 `{{ .Token }}` 顯示 6-8 位數字
   - 目前隱藏 Email 登入因為 Resend 是 test domain

### 部署相關
7. **env var 改了要重新部署才生效**（不會 hot reload）
8. **Vercel preview URL 會變** — 一定要用 production domain
9. **`.env.local` 變動需要重啟 dev server**
10. **Capacitor 跟 API routes 衝突** — 用 `BUILD_TARGET=mobile` 切換靜態輸出

### React 相關
11. **`use-auth.ts` 含 JSX 必須是 `.tsx`**（已修）
12. **handleSaveMeal 樂觀更新**：先關 modal + 更新本地 state，API 在背景送（避免 UI 卡住）
13. **getSession() 比 getUser() 快**（local 讀取，不打網路）

---

## 🎯 接手建議的下一步

### 立即（修小 bug）
1. **首頁 macro 數字用真實 DB 數據**
   - 修 `src/screens/home-screen.tsx` 的 protein/carb/fat 計算
   - 應從 `meals` API 拿真實值加總
   - `mergeMealsWithSlots` 已經帶有 photo_url，可以再加 macro 欄位

2. **AI 建議在儲存餐點後自動重新生成**
   - `handleSaveMeal` 完成後呼叫 `loadSuggestion(true)`（force=true 略過快取）

3. **修真實 TS 錯誤**
   - 拿掉 `next.config.ts` 的 `ignoreBuildErrors: true`
   - 跑 `npm run build` 看完整錯誤清單，逐個修

### 短期（差異化）
4. **語音對話內容存 DB**
   - `RealtimeClient` 的 `onUserTranscript` / `onAssistantTranscript` 寫入 `conversations` 表
   - 管理後台「對話記錄」頁可以實作

5. **首頁加「快速記錄相同餐點」按鈕**
   - 已有 `meals` 表，撈昨天同 meal_type 的記錄，點一下複製
   - 適合長者「每天差不多吃一樣」

6. **每週健康報告 email**
   - 用 Vercel Cron + Resend
   - 每週日寄送：本週飲食 / 運動 / 健康指標趨勢
   - 同步寄給家人（family_links 表）

7. **管理後台「對話記錄」實作**
   - 從 `conversations` 表抓資料
   - 可以看到 AI 跟用戶聊了什麼

### 中期（商業化）
8. **Stripe 接好** — 真的能收錢
   - env vars：STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_BASIC, STRIPE_PRICE_PRO
9. **Google OAuth 提交審核** — 消除「未驗證」警告（需要自訂網域）
10. **買網域 + 接 Vercel + 設 Resend 自訂 sender** — 解決 Email 寄信限制

### 長期
11. **Android Capacitor 打包 + 上 Play Store**
12. **iOS 版本**（需 Apple Developer $99/年）
13. **PWA install prompt**

---

## 📊 用戶資訊

- **GitHub**: HansChung
- **Admin email**: sunboy1120@gmail.com（自動為管理員，無 AI 配額限制）
- **語言偏好**：繁體中文（台灣）回應
- **技術背景**：**非工程師**，需要手把手指引，避免術語
  - 例如不要說「跑 schema」，要說「到 Supabase 點 SQL Editor，貼上下面這段，按 Run」
  - 截圖很重要，引導他點哪個按鈕
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

**重點**：語音是最貴的，必須有訂閱制 OR 嚴格配額。其他都很便宜。

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
| Cloudflare tunnel 連不上 | 不用了，現在跑在 Vercel |

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

# App
NEXT_PUBLIC_APP_URL=https://55-health-eisp.vercel.app

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
# Vercel 自動部署到 https://55-health-eisp.vercel.app
```

**不要手動跑 `npm run build` 部署，會撞死 dev server。直接 git push 讓 Vercel 跑就好。**

---

## 📝 給 Cursor AI 的話

你好！這專案：
1. **不是從零開始** — 已經 95% 功能完成，請先讀完這份 NOTES 再動手
2. **用戶非工程師** — 解釋每一步在做什麼，避免「跑這個 command」之類的話
3. **每改一塊就 push** — 用戶習慣立刻看到效果
4. **照片用 Supabase Storage** — 不要存 base64 到 DB
5. **AI 都用 Gemini Flash** — 不要用 Pro（沒額度）
6. **多用樂觀更新** — 用戶最討厭等 loading

### 常用 commit message 風格（用戶喜歡的）
```
[功能] 簡短描述

✅ 做了什麼
✅ 解決什麼問題
✅ 影響到哪些檔案

需要先跑 supabase/xxx.sql（如果有）
```

### 如果遇到用戶說「我做完了」
代表他剛跑完 SQL 或設定。**不要假設**，問他結果：
- ☐ 跑 SQL 看到 "Success" 嗎？
- ☐ Vercel 部署是綠色 Ready 嗎？
- ☐ 在手機測有沒有問題？

---

祝接手順利 🍊

Human Chung 是個非常願意嘗試新東西的用戶，會踩很多坑但都很有耐心。對他要友善 + 給選項 + 直接動手。

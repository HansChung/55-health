# 暖暖 55+ 飲食記錄 App 🧡

專為 55 歲以上長者設計的 AI 飲食追蹤 App。拍張照就能辨識食物、計算營養；按一下就能跟 AI 助理「暖暖」語音對話。

## ✨ 功能

- 📸 **AI 拍照辨識** — Gemini Pro Vision 自動分析食物熱量、營養
- 🎙 **語音對話** — OpenAI Realtime API 即時雙向對話
- 📊 **每日營養追蹤** — 卡路里圈、三大營養素進度條
- 👨‍👩‍👧 **家人共享** — 讓兒女遠端關心長輩飲食狀況
- 💊 **慢性病提醒** — 高血壓、糖尿病等個人化建議
- 🚶 **運動記錄** — 整合飲食 + 運動雙向追蹤
- 📲 **健康平台同步** — 串接 Apple 健康 / Google Health Connect 自動帶入運動、步數（見 [`docs/health-integration.md`](docs/health-integration.md)）
- 👑 **管理後台** — Token 用量、會員管理、API 設定
- 💳 **訂閱付費** — Stripe 整合（免費 / NT$199 / NT$399）

## 🛠 技術架構

- **前端**：Next.js 15 + React 19 + TypeScript
- **資料庫**：Supabase（PostgreSQL + Auth + Storage）
- **AI**：Google Gemini 2.5/3.1 Pro + OpenAI Realtime
- **付款**：Stripe Checkout + Webhook
- **手機 App**：Capacitor（Android）
- **部署**：Vercel

## 🚀 本地開發

```bash
# 1. 安裝依賴
npm install

# 2. 複製環境變數範本
cp .env.example .env.local
# 編輯 .env.local 填入你的 API keys

# 3. 啟動 dev server
npm run dev
```

開啟 [http://localhost:3000](http://localhost:3000)

## 📦 部署

### Web 部署到 Vercel
1. Push 此 repo 到 GitHub
2. 到 [vercel.com](https://vercel.com) 點 "Import Project"
3. 把 `.env.local` 的環境變數複製到 Vercel Settings
4. 按 Deploy

### Android App
```bash
npm run android:open  # 用 Android Studio 開啟
```

## 📋 環境變數

請參考 [`.env.example`](.env.example)

| 變數 | 必填 | 用途 |
|------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase 專案 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase 公開金鑰 |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase 管理員金鑰 |
| `GEMINI_API_KEY` | ✅ | Google AI Studio API key |
| `OPENAI_API_KEY` | ✅ | OpenAI API key |
| `ADMIN_EMAILS` | ✅ | 管理員 email（逗號分隔）|
| `STRIPE_SECRET_KEY` | 訂閱才需要 | Stripe secret key |

## 📂 專案結構

```
src/
├── app/
│   ├── api/           # API routes (Next.js Route Handlers)
│   │   ├── ai/        # Gemini / OpenAI 代理
│   │   ├── admin/     # 管理員 API
│   │   ├── meals/     # 餐點 CRUD
│   │   └── stripe/    # 訂閱付款
│   ├── admin/         # 管理後台 UI
│   └── pricing/       # 訂閱方案頁
├── components/        # 共用 UI
├── screens/           # 14 個 App 畫面
├── lib/
│   ├── ai/            # AI 服務封裝（Gemini, 計費, 配額）
│   ├── supabase/      # Supabase clients
│   └── api-client.ts  # 前端 API 客戶端
└── hooks/             # React hooks
```

## 📝 License

私有專案 — © 2025

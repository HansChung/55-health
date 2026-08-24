# Production SQL／環境變數檢查清單

> 給正式站 `nuan55.com`（Vercel 專案 `55-health`、Supabase `ydnvjqvstmprdciwkkyl`）。  
> SQL 一律在 [SQL Editor](https://supabase.com/dashboard/project/ydnvjqvstmprdciwkkyl/sql/new) 執行。  
> 環境變數在 Vercel → Project → Settings → Environment Variables，改完後 **Redeploy**。

本文件**不寫真實密鑰**。產生方式見各列「怎麼取得」。

---

## 0. 目前已知缺口（2026-08-24 抽樣）

| 項目 | 現況 | 要做 |
|------|------|------|
| 網站／章節頁 | `https://nuan55.com`、`/smart/chapter/0900` 回 200 | 無需動作 |
| Rate limit middleware | API 已回 `X-RateLimit-*` | 正式站仍建議設 Upstash（否則多實例不共享計數） |
| Web Push | `GET /api/push/vapid-public-key` → `{"configured":false}` | **立刻設 VAPID + 跑兩段 SQL** |
| `CRON_SECRET` | 曾寫進公開 repo 的上線文件 | **立刻輪替**（舊值已進 git 歷史，刪文件不夠） |
| 近期 SQL | 無法從外部確認是否已跑 | 用下方驗證查詢勾選 |

未關閉的草稿（刻意保留、不是過期取代）：[#1](https://github.com/HansChung/55-health/pull/1) 陪伴機器人、[#2](https://github.com/HansChung/55-health/pull/2) SHI 雷達、[#3](https://github.com/HansChung/55-health/pull/3) Health Connect。

---

## 1. 請先跑／確認的 SQL（近期功能）

依序貼上 repo 檔案全文 → Run。`create table if not exists` / `add column if not exists` 可重跑。

| 順序 | 檔案 | 功能 | 沒跑會怎樣 |
|------|------|------|------------|
| 1 | `supabase/add-smart-sparks.sql` | 圓夢藍圖光點表 | 存光點回「光點功能尚未啟用」 |
| 2 | `supabase/fix-smart-sparks-source-check.sql` | 允許全部章節 QR + `chapterp4-open` | 掃碼存光點可能「source 不符」 |
| 3 | `supabase/add-chapter-drafts.sql` | 0207／1201 私人草稿 | 「私人保存這張卡」失敗 |
| 4 | `supabase/add-alerts.sql` | 異常預警紀錄 | 守護紀錄／cron 寫入失敗 |
| 5 | `supabase/add-push-subscriptions.sql` | Web Push 訂閱 | 開推播開關失敗 |
| 6 | `supabase/add-alert-thresholds.sql` | `profiles.alert_thresholds` | 健康狀況無法存個人化閾值 |

**不要**在已上線的庫再跑這些（會把約束改窄或改配額）：

- `add-chapter0100-source.sql`（只允許 `chapter0100`，會弄壞其他章節）
- `add-chapter-opening-sources.sql`（沒有 `chapterp4-open`；請用第 2 項）
- `bump-quota.sql`、`update-voice-quotas.sql`（會改訂閱配額數字）

### 驗證（SQL Editor 一次貼上）

```sql
-- 表是否存在
select
  to_regclass('public.smart_sparks') as smart_sparks,
  to_regclass('public.chapter_drafts') as chapter_drafts,
  to_regclass('public.alerts') as alerts,
  to_regclass('public.push_subscriptions') as push_subscriptions;

-- 光點 source 約束（應含 chapterp4-open 與 chapter[0-9]{4}）
select pg_get_constraintdef(oid) as smart_sparks_source_check
from pg_constraint
where conname = 'smart_sparks_source_check';

-- 個人化閾值欄位
select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'profiles'
  and column_name = 'alert_thresholds';
```

通過條件：四個 `to_regclass` 都不是 `null`；約束字串含 `chapterp4-open` 與 `chapter[0-9]{4}`；有 `alert_thresholds` 列。

---

## 2. 較早功能：沒有再確認一次

正式站若飲食／家人／檢測已在用，多半已跑過。缺哪個表，再跑對應檔（均可重跑）。

| 檔案 | 檢查 |
|------|------|
| `schema.sql` + `fix-trigger.sql` | 核心：`profiles` `meals` `exercises` `family_links`…；新用戶沒 profile 才重跑 trigger |
| `setup-storage.sql` | Storage 有 `meal-photos` bucket |
| `add-health-metrics.sql` | 表 `health_metrics` |
| `add-notifications.sql` | `profiles.notification_settings` |
| `add-emergency-contact.sql` | `profiles.emergency_contact` |
| `add-smart-assessments.sql` | 表 `smart_assessments` |
| `add-favorite-meals.sql` | 表 `favorite_meals` |
| `add-telemetry.sql` | 表 `app_events` |
| `add-iot.sql` | IoT 模擬／裝置（未用可暫緩） |
| `add-brands.sql` | 白標（未用可暫緩） |
| `add-partner-campaigns.sql` | 合作活動（未用可暫緩） |
| `add-stripe-customer.sql` | `profiles.stripe_customer_id`（開 Stripe 前必跑） |

```sql
select c.relname
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by 1;

select column_name
from information_schema.columns
where table_schema = 'public' and table_name = 'profiles'
order by 1;
```

---

## 3. Vercel 環境變數

Production / Preview / Development 都勾，改完 **Redeploy**。

### 3a. 核心（沒有就登不了／AI 不能用）

| 變數 | 怎麼取得 | 沒設 |
|------|----------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API | 整站打不開後端 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 同上 | 同上 |
| `SUPABASE_SERVICE_ROLE_KEY` | 同上（secret） | cron、管理、部分寫入失敗 |
| `NEXT_PUBLIC_APP_URL` | 固定 `https://nuan55.com` | Email／OAuth／Checkout 連錯網域 |
| `GEMINI_API_KEY` | Google AI Studio | 拍照辨識失敗 |
| `GEMINI_MODEL` | 建議 `gemini-2.5-flash` | 未設則程式預設 flash |
| `OPENAI_API_KEY` | OpenAI | 語音失敗 |
| `OPENAI_REALTIME_MODEL` | 必須 `gpt-realtime`（沒有 `-2`） | 語音會壞 |
| `ADMIN_EMAILS` | 管理員 email，逗號分隔 | 管理員仍吃 AI 配額 |

### 3b. 建議立刻補（功能已上線、正式站仍缺或密鑰已外洩）

| 變數 | 怎麼取得 | 沒設 | 怎麼確認 |
|------|----------|------|----------|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | `npx web-push generate-vapid-keys` | 推播開關無效 | `curl -s https://nuan55.com/api/push/vapid-public-key` 應為 `"configured":true` |
| `VAPID_PRIVATE_KEY` | 同上（只放 Vercel，勿進 git） | 同上 | 同上 |
| `VAPID_SUBJECT` | 可選，例如 `mailto:noreply@nuan55.com` | 用程式預設 subject | — |
| `RESEND_API_KEY` | Resend → API Keys（網域 `nuan55.com` 需 Verified） | 警報信／週報不寄 | 測 cron 後看信箱 |
| `CRON_SECRET` | `openssl rand -hex 16`，**不要**寫進 git | cron 回 Unauthorized | 見下方輪替步驟 |
| `UPSTASH_REDIS_REST_URL` | [Upstash Console](https://console.upstash.com) Redis REST | 多實例 rate limit 不共享 | API 仍有 `X-RateLimit-*`（有無 Upstash 從外難分） |
| `UPSTASH_REDIS_REST_TOKEN` | 同上 | 同上 | — |

**不要**在正式站設 `RATE_LIMIT_DISABLED=1`。

### 3c. 可選（訂閱還沒開可留空）

| 變數 | 用途 |
|------|------|
| `STRIPE_SECRET_KEY` | Checkout |
| `STRIPE_WEBHOOK_SECRET` | Webhook |
| `STRIPE_PRICE_BASIC` / `STRIPE_PRICE_PRO` | 方案 Price ID |

開訂閱前加跑 `supabase/add-stripe-customer.sql`。

---

## 4. `CRON_SECRET` 輪替

Vercel Cron（`vercel.json`）會帶 `Authorization: Bearer <CRON_SECRET>` 打這三條：

- 每天 01:00 UTC → `/api/cron/check-anomalies`（台灣 09:00 異常預警）
- 每週一 01:00 UTC → `/api/cron/weekly-report`
- 每天 23:00 UTC → `/api/cron/daily-care`（台灣隔日 07:00 關懷）

步驟：

1. `openssl rand -hex 16` 產生新值  
2. Vercel 更新 `CRON_SECRET`（Production／Preview／Development）  
3. Redeploy  
4. 手動測（把 `新密鑰` 換成步驟 1 的值，**不要 commit**）：

```bash
curl -s https://nuan55.com/api/cron/check-anomalies \
  -H "Authorization: Bearer 新密鑰"
```

未授權應為 Unauthorized；正確密鑰應為 JSON（例如含 `ok`）。

---

## 5. 建議操作順序

1. 輪替 `CRON_SECRET` 並 Redeploy  
2. SQL Editor 跑第 1 節驗證查詢；缺什麼就跑對應檔  
3. `npx web-push generate-vapid-keys` → 寫入 VAPID → Redeploy  
4. `curl -s https://nuan55.com/api/push/vapid-public-key` 確認 `configured: true`  
5. 家人帳號 → 提醒通知 → 開「瀏覽器即時推播」  
6. （可選）Upstash 兩項寫入 Vercel 再 Redeploy  

---

## 6. 相關文件

- 書本 QR／光點：`docs/圓夢藍圖-上線清單.md`
- 異常預警操作：`docs/異常預警-上線清單.md`
- 變數範本：`.env.example`

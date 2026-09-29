# AGENTS.md

## Cursor Cloud specific instructions

### What this repo is
Single **Next.js 15 (App Router) + React 19 + TypeScript** web app ("暖暖 55+", a Traditional-Chinese
diet-tracking app for seniors). There is no separate backend service in this repo — the "backend" is
**Supabase** (Postgres + Auth + Storage) plus external AI providers (Google Gemini, OpenAI Realtime)
and Stripe. Capacitor/Android is only a packaging target and is not needed for web development.

### Standard commands (see `package.json` scripts and `.github/workflows/ci.yml`)
- Dev server: `npm run dev` → http://localhost:3000
- Tests: `npm test` (Vitest, `src/**/*.test.ts`)
- Type check: `npx tsc --noEmit` — **this is the "lint"**; there is no ESLint config/script. CI runs
  type check + tests + build.
- Build: `npm run build`. `next build` needs `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  and `NEXT_PUBLIC_APP_URL` present (CI passes dummy values); a build with no env can fail.

### Environment / secrets
- Copy `.env.example` → `.env.local` (gitignored). The dev server reads env **only at startup**, so
  **restart `npm run dev` after editing `.env.local`**.
- Full product features need real credentials (add them as Cursor Secrets if you have them):
  `GEMINI_API_KEY` (photo food analysis), `OPENAI_API_KEY` (voice), `STRIPE_SECRET_KEY` (subscriptions),
  `LK888_API_KEY` (邁笙 lk888 aggregator: 出遊回憶影片 `minimax-h3`, and — when set — every Gemini call
  goes through its Gemini-compatible endpoint: food/prescription photos `gem-3.8-flash`, AI 建議
  `gem-3.5-flash-lite`; `GEMINI_PROVIDER=google` forces Google direct with `GEMINI_API_KEY`), and a real
  Supabase project. Provider/model selection lives in `resolveGeminiConfig` (`src/lib/ai/gemini.ts`). There is **no mock/offline fallback** for the AI routes — the camera
  ("拍照辨識") and voice flows return errors without valid keys.
- **API rate limit** (`src/middleware.ts`): covers `/api/*` by IP. Cron + Stripe webhook are skipped.
  Production should set `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`; without them a
  process-local memory fallback is used (fine for `npm run dev`, not reliable across Vercel instances).
  Set `RATE_LIMIT_DISABLED=1` only for local tests that must bypass limits.
- **Web Push + alert thresholds**: VAPID keys (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`);
  SQL `add-push-subscriptions.sql` + `add-alert-thresholds.sql`. Family enables push under 提醒通知;
  elder thresholds under 健康狀況. Cron `check-anomalies` emails and pushes.

### Running a real backend locally (no cloud Supabase needed)
The app requires a live Supabase API to do anything past the login screen (auth is forced). A local
stack works well for auth + meal/diary CRUD:
1. Requires **Docker** and the **Supabase CLI** (neither is preinstalled; not part of the update
   script). With Docker running, `supabase start` boots Postgres/Auth/PostgREST/Storage/Mailpit.
2. This repo is **not** a linked Supabase project (no `supabase/config.toml`); the `supabase/` folder is
   just raw SQL. Run `supabase init` (e.g. in a scratch dir) then apply the SQL to the local DB:
   `schema.sql` first, then `fix-trigger.sql`, `setup-storage.sql`, and the `add-*.sql` / `bump-*.sql`
   files.
3. **Non-obvious gotcha:** hosted Supabase auto-grants table privileges to the `anon`/`authenticated`
   roles, but a local DB seeded via `psql` as `postgres` does **not**. After applying the schema you
   must `GRANT ... ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role` (+ default
   privileges), otherwise every API insert fails with `permission denied for table ...`.
4. Point `.env.local` at the local stack (`NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321`, and the
   ANON / SERVICE_ROLE keys printed by `supabase start`) and restart the dev server.
5. **Login:** the UI uses email 6-digit OTP (`verifyOtp` type `email`). The default local `magic_link`
   email template only contains a link — customize it to include `{{ .Token }}` (via
   `[auth.email.template.magic_link]` in `config.toml`) to expose the code, then read it from the local
   Mailpit inbox at http://127.0.0.1:54324. Create a pre-confirmed test user with the Auth admin API
   (`POST /auth/v1/admin/users` with `email_confirm: true`) using the service-role key.

### 出遊回憶影片（travel video）
- Home 「出遊回憶影片」→ subpage `travel-video`（basic+）. Photo → `POST /api/ai/travel-video` → lk888
  `POST /v1/media/generate`（`minimax-h3`, `mode=shouweizhen`, 10s, 768P）. Async: the screen polls
  `GET /api/ai/travel-video` every 10s, which queries `/v1/skills/task-status` and, on success, copies
  the mp4 into the public `travel-videos` bucket. Videos commonly take 5–60 min; >2h = failed (not counted).
- lk888 success is `body.code === 200` (not 0); `data.task_id` is a number. Failed tasks are auto-refunded.
- Optional 口白＋字幕: the screen previews narration via `POST /api/ai/travel-video/narration` (lk888
  `gem-3.1-tts`, voices Sulafat=female / Achird=male, WAV stored at `travel-videos/{user}/narrations/{id}.wav`);
  `/api/ai/travel-video/script` lets AI write the line from the photo. The video length follows the
  narration (`videoSecondsForNarration`, 4–15 s). When H3 finishes, `syncTravelVideo` runs ffmpeg
  (`ffmpeg-static`, traced into the functions via `outputFileTracingIncludes` in `next.config.ts`) to mix the
  narration over H3's ambient audio and burn Traditional Chinese subtitles (Noto Sans TC subset fetched
  from Google Fonts at runtime). Needs `supabase/add-travel-video-narration.sql`.
- H3 is unreliable at speaking a given line or drawing subtitles itself (tested), and may cut to an
  invented shot when the prompt gets complex — every prompt now demands a single continuous shot.
- Done/failed → Web Push to the elder (`/?open=travel-video` deep link). Background delivery needs
  `LK888_WEBHOOK_SECRET` + public https `NEXT_PUBLIC_APP_URL`: tasks are created with
  `notify_url=/api/webhooks/lk888/<secret>`; the webhook is unsigned, so it only triggers a re-query of
  `/v1/skills/task-status` by task_id. Without it, completion is only detected while the screen polls.
- Needs `supabase/add-travel-videos.sql` (table, bucket, `ai_usage` service `minimax_video`,
  `subscription_plans.ai_video_quota`). Quota counts non-failed rows incl. soft-deleted ones.
  "One pending video per user" is enforced by the partial unique index
  `travel_videos_one_pending_per_user` (insert → 23505 → 409), so concurrent POSTs can't double-charge.

### Book × App light coupling（書本／App）
- Chapter openings live at `/smart/chapter/[id]` (public, printable). Shared rhythm: **一拍、二問、三記下**.
- Optional save: 「把這句話點成光點」→ `/smart/spark?source=chapterXXXX` (sessionStorage seed).
- Home 「書本練習」→ `/smart/guide`. Deep links `/?open=voice|camera&from=chapterXXXX` show intent tips.
- Production DB may need `supabase/add-chapter-opening-sources.sql` if the old source check is still in place.

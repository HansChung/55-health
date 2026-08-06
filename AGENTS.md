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
  and a real Supabase project. There is **no mock/offline fallback** for the AI routes — the camera
  ("拍照辨識") and voice flows return errors without valid keys.

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

### Book × App light coupling（書本／App）
- Chapter openings live at `/smart/chapter/[id]` (public, printable). Shared rhythm: **一拍、二問、三記下**.
- Optional save: 「把這句話點成光點」→ `/smart/spark?source=chapterXXXX` (sessionStorage seed).
- Home 「書本練習」→ `/smart/guide`. Deep links `/?open=voice|camera&from=chapterXXXX` show intent tips.
- Production DB may need `supabase/add-chapter-opening-sources.sql` if the old source check is still in place.

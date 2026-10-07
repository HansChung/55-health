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
- **每天早上天氣＋健康提醒** (needs `CWA_API_KEY` + VAPID + `supabase/add-daily-weather.sql`): the setting lives
  in `notification_settings.daily_weather = { on, county }` (no new settings column). The home card
  (`DailyWeatherCard`) asks for the county once — only when `GET /api/daily-weather` says it's available and the
  browser can receive push; choosing a county enables push on that device; 「不用了」 stores `on:false`.
  提醒通知 → 每天早上 toggles it / changes the county (county kept when off). Cron `/api/cron/daily-weather`
  (`0 23 * * *` = 07:00 Taipei; **Hobby crons fire somewhere within that hour**) fetches all counties in one CWA
  request (`countiesForecast`), and for each subscribed user claims `profiles.daily_weather_sent_on = today`
  before pushing, so reruns never double-send. Text: `buildDailyWeatherPush` (today's period + tonight's low) with
  one weather-based health tip (`weatherHealthTip`; `chronic_conditions` holds the 慢性病 page's English ids —
  `hypertension` + cold → 量血壓, `diabetes`/`prediabetes` + hot → 白開水, `kidney` + hot → never "多喝水"
  (fluid limits), …; Chinese words are matched too).
  Local test: `CWA_API_BASE` pointed at a fake F-C0032-001 server.

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
- **The Linux ffmpeg-static build used on Vercel (johnvansickle 7.0.2) has no `drawtext`** — subtitles are
  rendered from an ASS file with the `ass` filter (libass), with a private `fonts.conf` via
  `FONTCONFIG_FILE` (Amazon Linux 2023 has no `/etc/fonts`). Don't reintroduce drawtext; verify Linux
  behaviour by running that binary in `docker --platform linux/amd64 amazonlinux:2023` (`FFMPEG_BIN`).
- H3 is unreliable at speaking a given line or drawing subtitles itself (tested), and may cut to an
  invented shot when the prompt gets complex — every prompt now demands a single continuous shot.
- Done/failed → Web Push to the elder (`/?open=travel-video` deep link). Background delivery needs
  `LK888_WEBHOOK_SECRET` + public https `NEXT_PUBLIC_APP_URL`: tasks are created with
  `notify_url=/api/webhooks/lk888/<secret>`; the webhook is unsigned, so it only triggers a re-query of
  `/v1/skills/task-status` by task_id. Without it, completion is only detected while the screen polls.
- **多張照片遊記（montage, `kind='montage'`）** is rendered entirely on our server — no video platform:
  `POST /api/ai/travel-video/montage` stores 3–5 photos + one line each (AI can write them via
  `/montage/script`, one multi-image Gemini call) and `syncMontage` (`travel-montage-server.ts`) advances it
  on every list poll: ① all lines TTS'd in parallel → ② one Ken Burns clip per photo (`montage-compose.ts`:
  blurred fill + `zoompan` + fades + ASS subtitle, video only) → ③ clips concatenated with `-c copy` +
  narrations `adelay`ed/`amix`ed → `video.mp4`. Progress lives in `travel_videos.montage` (jsonb); a
  `lease_until` lease (conditional update) stops overlapping polls from double-processing. Each step is
  budgeted to fit the 60 s function. Whoever actually did work (held the lease) and left it unfinished
  calls `POST /api/cron/montage-step` (Bearer `CRON_SECRET`, answers 202 and works in `after()`), so the
  montage finishes and pushes even after the elder leaves the page; without `CRON_SECRET` it only advances
  while the screen polls. **Cloud is much slower than a Mac** (a 9 s 720p clip ≈ 20–25 s on a Vercel vCPU,
  2026-10-05), so steps routinely run out of time between clips. Rules learned the hard way: (1) on
  `ComposeBudgetError` only **release the lease** (`releaseLease`) — never write the step's starting state back,
  it erases the clips saved during that step (that bug left two production MVs at 0 clips until timeout);
  (2) a step only starts the next clip if the time left ≥ the last clip's time + 3 s (`clipBudgetNeededMs`), and
  ffmpeg killed at the step deadline counts as "out of time", not a failure; (3) Vercel answers a self-call
  chain with **508 Loop Detected** after ~4 hops, so `montage-step` runs `maxDuration = 300` (Hobby + Fluid
  max) with a 240 s budget and a matching lease (`leaseMsFor`) — an MV finishes in 2–3 hops. Needs
  `supabase/add-travel-video-montage.sql`. Separate monthly quota (`DEFAULT_MONTAGE_QUOTA`), costs only TTS
  (~0.01 算力 per line). The Linux ffmpeg has every filter used (verified in Docker amazonlinux).
- **口音與「我的聲音」** (needs `supabase/add-narration-voices.sql`): the four AI voices take an accent
  (`NARRATION_ACCENTS`: 台灣口音 default / 台灣國語 / 客家腔 / 廣東腔 / 四川腔 / 山東腔) — still Mandarin, just
  accented, via the gem-3.1-tts prompt (`buildTtsPrompt`); the default prompt is the original tested one, the
  others demand "exact words only" (the model otherwise adds 齁／捏／啊 and the burned subtitle stops matching).
  Tested 2026-09-30: an AI judge couldn't reliably tell these accents apart — they need human ears.
  `voice="mine"` (Pro, `voice_clone` feature) uses the elder's own cloned voice: `/api/ai/voice-clone` takes an
  in-app recording (MediaRecorder webm/mp4 → ffmpeg → WAV, ≥12 s, not silent, consent checkbox), calls lk888
  `POST /v1/skills/voices/clone` (0.1 算力; returns a demo mp3 on a ~2-day signed URL, which we copy into
  Storage as WAV) and stores `voice_clones` (one active per user, 2 recordings / 30 days; the raw recording
  is not kept; there is no provider delete API, so "delete" = soft delete). Synthesis uses `speech-2.8`
  (`quality: "hd"`; turbo is unavailable) and may return mp3 → `toWav`. **The first synthesis with a new
  voice costs a one-time 18.8 算力 activation** and an unused voice expires after 7 days — `claimFirstUse`
  (`activating_until`) makes sure only one request does that first synthesis, and montages TTS only the first
  line on first use.
- **分享頁 `/v/<video id>`** (`src/app/v/[id]/page.tsx`): 「分享給家人」 now shares this page instead of the raw
  mp4 URL, so LINE shows the photo + title (`openGraph` from `videoShareMeta`; no elder name — links get
  forwarded; `robots: noindex`). Anyone with the link can watch (same exposure as the old public mp4 link);
  only the owner / family who can see videos (logged in) get reactions & comments, everyone else gets an
  「打開暖暖」 button (`/?open=caregiver`). Deleted or unfinished videos show a "deleted" message.
- **說話變文字** (`DictationButton` / `useDictation`): 「🗣️ 用說的」 on video comments, the single-video narration
  and each montage line, using the browser's own `SpeechRecognition`/`webkitSpeechRecognition` (`zh-TW`,
  one sentence per tap, free; Chrome sends audio to Google, Safari to Apple). It only renders when the API
  exists — not in the Capacitor Android WebView or Firefox, where people just type. Newer Chrome exposes the
  unprefixed `SpeechRecognition`, so mocks in tests must replace both names.
- **遊記 MV** (`kind='mv'`, Pro only, 6/month via `mvQuota`; needs `supabase/add-travel-video-mv.sql`): from a
  finished 遊記, `POST /api/ai/travel-video/[id]/mv/lyrics` has Gemini write title + lyrics (國語 or 台語 — the 台語
  prompt needs the 華語→台語 word list or the model just echoes the Mandarin trip lines), the elder edits, then
  `POST …/mv` copies the montage photos, inserts the row (one pending MV per user via the kind index) and starts
  lk888 **Suno v4.5** (`lk888-music.ts`, custom lyrics in `params.lyrics`, ~0.54 算力 per call, two versions,
  ~1–3 min). `travel-mv-server.ts` reuses the montage lease/continuation machinery (`montage-step` dispatches
  on kind): song → both mp3s converted to stereo m4a (bucket has no audio/mpeg) → ~9 s Ken Burns segments
  cycling the photos for the song length (≤180 s; first segment shows 《歌名》 — the subtitle font has no emoji)
  → concat + song with fades. Only background steps wait for Suno (`waitForSong`); list polls check once. Suno
  returns no lyric timestamps, so lyrics are shown under the video instead of as subtitles. Tested 2026-10-03:
  a 台語 MV took ~2 min end to end locally and a listening check rated it Taiwanese Hokkien.
  Entry points: the 「🎵 做 MV」 tab on the travel-video screen (lists finished 遊記; with none it sends the
  elder to the 遊記 tab) and the button under each finished 遊記.
- **MV 換另一個版本** (free, not counted): Suno's second song (`mv.alt_song_path`) becomes a separate MV —
  `POST …/[mvId]/mv/alt` copies the photos + second song into a new row with `mv.variant_of` (the original
  stays) and starts at the clips stage, so no lk888 call. Once per MV (any non-failed variant blocks it, **even a
  deleted one** — otherwise delete + redo is unlimited free ffmpeg work; the list GET hides the button with the
  same rule), variants can't be varied again, `usage-tracker` skips rows with `variant_of`. Older
  MVs lack `alt_song_seconds`, so the route measures the second song with ffmpeg (traced for that route).
- **遊記配樂**: `montage.music` picks a track from `MONTAGE_MUSIC` (`public/music/<id>.m4a`, also used for the
  in-app preview). Tracks were generated once (2026-09-30) with Suno v4.5 via lk888 (instrumental), then cut to
  90 s, normalized to -28 LUFS with two-pass `loudnorm`, 4 s fade-out, AAC 96k — keep new tracks at that level.
  `buildMuxArgs` loops the track, fades it in/out and ducks it under the narration (`sidechaincompress`); the
  mono narration is copied to both channels with `pan` (not `aformat`, which is −3 dB). The final mux reads the
  file from `process.cwd()/public/music`, so every route that can advance a montage lists `./public/music/*.m4a`
  in `outputFileTracingIncludes`; a missing file only logs a warning and the video is made without music.
  Single-photo (H3) videos have their own ambient audio and get no music.
- **家人按讚、留言** (needs `supabase/add-travel-video-comments.sql`): accepted family members see the
  elder's finished videos in 家人狀況 (`GET /api/family/videos`, `FamilyVideos`) unless the elder turned off
  `family_links.permissions.videos` (missing key = visible). Reactions (❤️👍😂🥹👏, toggle) and ≤100-char
  comments live in `travel_video_comments` (server-only RLS; `POST/DELETE /api/ai/travel-video/[id]/comments`).
  Family activity pushes to the elder (`/?open=travel-video`); an elder's comment pushes to the family who
  interacted with that video; a finished video pushes to all family who can see it (`notifyFamilyNewVideo`,
  called from `notifyOwner`). `video-comments-server.ts` must not import `travel-video-server.ts` (cycle).
  **念給我聽**: text comments have 🔊 (one) and 「全部念給我聽」 using the browser's speechSynthesis
  (`speakGuideParagraphs`, free). **語音留言** (needs `supabase/add-video-voice-comments.sql`): owner and family
  can record ≤60 s (`useVoiceRecorder`); `POST …/comments {audio}` converts webm/mp4 → WAV (length/silence
  check) → AAC m4a (`wavToM4a`, plays on iOS too) stored at `{owner}/{video}/comments/{id}.m4a`; counts toward
  the 30-per-author limit; deleting the comment or the video removes the file. The comments route needs ffmpeg
  in `outputFileTracingIncludes`.
- **家人看過了** (needs `supabase/add-travel-video-views.sql`; display only, no push): when a family member who
  can see the video presses play (家人狀況 or the share page while logged in), `markVideoViewed` →
  `POST /api/ai/travel-video/[id]/view` upserts `travel_video_views` (one row per viewer, `last_viewed_at`;
  the owner's own plays aren't recorded). `loadCommentsViews` attaches `viewers` **only to the owner's own
  videos**, so the elder sees 「👀 王小美（女兒）看過了」 under the reactions and family never see who else
  watched. Unlinked family are dropped (not in `authorDirectory`). Missing table → treated as no views.
- Needs `supabase/add-travel-videos.sql` (table, bucket, `ai_usage` service `minimax_video`,
  `subscription_plans.ai_video_quota`). Quota counts non-failed rows incl. soft-deleted ones.
  "One pending video per user" is enforced by the partial unique index
  `travel_videos_one_pending_per_user` (insert → 23505 → 409), so concurrent POSTs can't double-charge.

### 後台（/admin）手機版
- Admin pages keep their desktop styles inline; below 768px `src/app/admin/admin.css` overrides them via
  `adm-*` classes (with `!important`, since inline styles win otherwise): `adm-header`, `adm-grid-2`
  (2-col form → 1 col, `span 2` children reset), `adm-stats` (→ 2 per row), `adm-split`, `adm-card` /
  `adm-card-row` / `adm-card-thumb` / `adm-card-actions`, `adm-row-wrap` + `adm-row-tools`, and every
  `<table>` is wrapped in `.adm-table-scroll` (scrolls sideways). The layout swaps the sidebar for a
  sticky top bar + ☰ drawer. New admin pages should reuse these classes.

### 研學團（study tours）
- Home 「研學團」/ 我的 → 「研學護照」→ subpages `study-tours` / `study-passport` (free for all tiers).
  Registration only — no payment (`fee_text` is display-only). Admin at `/admin/study-tours`
  (tours, stops, registrations list + CSV) and `/admin/study-tours/[id]/qr` (one printable A4 QR per stop).
- All rules live in SQL functions in `supabase/add-study-tours.sql` (`study_tour_register`,
  `study_tour_cancel`, `study_tour_refill`, `study_tour_stamp`), each of which locks the tour row
  (`select … for update`), so capacity can't be oversold. Registering inserts `waitlisted` and then runs
  first-fit promotion; cancelling/raising capacity promotes the waitlist (API pushes a notification).
  Functions are `service_role`-only; `study_tours` / `study_tour_stops` have RLS with **no** client
  policies because `stamp_token` (printed in the QR) must stay secret.
- QR = `${NEXT_PUBLIC_APP_URL}/?stamp=<token>`. `page.tsx` moves the token to sessionStorage (so it
  survives the login screen), strips it from the URL, then calls `POST /api/study-tours/stamp`.
  Stamping works from 3h before start to 12h after end (admins bypass the window for testing); a person
  who never registered gets an `onsite` registration, a waitlisted one is confirmed (they showed up).
  All stops stamped → `completed_at` → 結業證書 (printable via `body.printing-certificate` print CSS).
  Adding/deleting a stop calls `study_tour_sync_completion` (un-completes / completes as needed); the UI
  also derives 集滿 from the current stops, never from `completed_at` alone.
- Share links and QR codes use `NEXT_PUBLIC_APP_URL` (`publicAppOrigin`): inside the Capacitor app
  `window.location.origin` is `http://localhost`.
- Family members can register a linked elder (`family_links` accepted): the row's `user_id` is the elder,
  `registered_by` is the family member. Share/push deep link: `/?open=study-tours&tour=<id>`.
- Local e2e: SQL scenario + 20-way concurrency tests were run against the Supabase CLI stack; remember
  the local rate limit for OTP emails (`[auth.rate_limit] email_sent`, default 2/h).
- 出發當天（needs `supabase/add-study-tour-day-ops.sql`）:
  - **行前提醒**: Vercel cron `/api/cron/study-tour-reminders?kind=day_before` (12:00 UTC = 20:00 Taipei,
    tours starting tomorrow) and `?kind=same_day` (22:00 UTC = 06:00 Taipei, tours starting that Taipei day).
    Needs `CRON_SECRET`. Each registration is claimed by setting `reminded_*_at` **before** pushing, so a
    re-run never double-sends. Confirmed → elder (+ the family member who registered them); waitlisted
    only gets the day-before "still on the waitlist" note.
  - **集合廣播**: admin `POST /api/admin/study-tours/[id]/broadcast` (≤120 chars) pushes to confirmed
    participants + `registered_by`, and stores a row in `study_tour_broadcasts` (server-only RLS); the
    elder's tour page / passport card shows the latest ones, so people without push still see them.
  - **報到名單**: `checked_in_at` is set by the `study_tour_stamps_checkin` trigger on the first stamp;
    elders without phones are checked in manually (`PATCH …/registrations/[regId]` `{checked_in}`).
  - **天氣** (`CWA_API_KEY`, 中央氣象署 open data, free; optional `supabase/add-study-tour-weather.sql`):
    reminders append the forecast for the tour's start period (F-C0032-001, county level, next 36 h) and the
    elder's tour page shows a weather card for tours starting within 36 h. County = `study_tours.weather_county`
    (admin select) or `guessCounty(meeting_point, title)`. Forecasts are cached 30 min per county per instance;
    any failure just omits the weather. `CWA_API_BASE` exists only to point local tests at a fake server.
  - **家人抵達通知** is opt-in by the elder: `family_links.permissions.trips` (default off; asked once on
    the tour page after registering, toggle in 家人共享). Sent from `after()` in the stamp route only when
    a stamp is new. `family_links` has only select/insert RLS policies, so `PATCH`/`DELETE /api/family/[id]`
    write with the service role filtered by `owner_id = user.id`.

### 拍照問暖暖（photo ask）
- Home 「拍照問暖暖」, and a button on 研學團 pages (prefills the tour title as the place) → subpage
  `photo-ask` (gated by `ai_photo`, i.e. basic+). Deep link `/?open=photo-ask`.
- `POST /api/ai/photo-ask` → `askAboutPhoto` (`src/lib/ai/photo-ask.ts`, vision model via
  `getGeminiModel`) → JSON normalised by `normalizePhotoAskResult`. Tracked as `gemini_vision`, so it
  shares the monthly photo quota with meal photos. Photos are not stored.
- The prompt forbids guessing specific place names/dates when unsure (tested: the model otherwise names
  the wrong pier and invents history) and always tells elders not to pick/eat wild plants.
- Read-aloud uses the browser's speechSynthesis (`speakGuideParagraphs`, zh-TW) — free, no server TTS.

### Book × App light coupling（書本／App）
- Chapter openings live at `/smart/chapter/[id]` (public, printable). Shared rhythm: **一拍、二問、三記下**.
- Optional save: 「把這句話點成光點」→ `/smart/spark?source=chapterXXXX` (sessionStorage seed).
- Home 「書本練習」→ `/smart/guide`. Deep links `/?open=voice|camera&from=chapterXXXX` show intent tips.
- Production DB may need `supabase/add-chapter-opening-sources.sql` if the old source check is still in place.
- **No external AI in the book** (owner's decision, 2026-10-07): examples never send people to Gemini／ChatGPT／Siri;
  `external-ai.ts` is gone. Text examples use 「✍️ 打字問暖暖」 (`AskNuannuanRow` / the `example` block's
  `onTryAsk`) → `saveAskSeed` (sessionStorage, survives login) → `/?open=ask&from=chapterXXXX`. Photo examples
  are being moved to 拍照問暖暖. 0102 teaches only how to open 暖暖.

### 打字問暖暖（text chat, `subpage "ask"`）
- Home 「問暖暖」, the voice screen's 「改用打字問暖暖」 and book examples open `AskScreen`. Typed or dictated
  (`DictationButton`), follow-ups allowed, answers read aloud with speechSynthesis. **Everyone can use it**
  (free tier too) with a daily limit per Taipei day (`ASK_DAILY_LIMITS`: free 20 / basic 50 / pro 100 messages;
  counted from successful `ai_usage` rows with endpoint `/api/ai/chat`).
- `POST /api/ai/chat` is stateless: the client sends the recent history (`trimAskHistory`, ≤40 messages) and the
  server adds 暖暖's instructions (`buildAskSystemPrompt`: Traditional Chinese, short, no Markdown, no diagnosis,
  no invented live info, anti-fraud, never recommends other AI products, describes 暖暖's real features) via
  Gemini `systemInstruction`; text model = `gem-3.5-flash-lite` through lk888 (~0.004 算力 per reply).
- Book context: `chapterTitle`, plus the user's own guide from browser storage (`buildGuideContext`: 0407←0406
  日常飲食指南, 0607←0606 動能指南, 0707←0706 活動參與指南). `mode: "guided"` (0801, 0805) makes 暖暖 ask one
  question at a time; `mode: "summary"` summarises the thread, which is saved to
  `localStorage nuannuan_chapter{id}_ask_summary` and shown on the chapter page (can become a 光點).

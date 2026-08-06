/** 章節開篇 QR 深連結（例：0100 → /smart/chapter/0100） */
export type ChapterLayout = "routes" | "ai-entry" | "question-rewrite";

export type ChapterEntryId = "ask" | "snap" | "photo" | "note";

export type SparkSource = "spark_card" | "chapter3" | "chapter0100";

export interface ChapterEntry {
  id: ChapterEntryId;
  label: string;
  hint: string;
  emoji: string;
  open?: "voice" | "camera" | "photo";
  href?: string;
}

/** 各品牌手機找 AI 入口的文字路徑（0102 等章節用） */
export interface PhoneEntryPath {
  id: string;
  label: string;
  emoji: string;
  steps: string[];
}

/** 關鍵字 → 自然提問示範（0103 等章節用） */
export interface QuestionRewriteDemo {
  id: string;
  label: string;
  keywords: [string, string, string];
  naturalQuestion: string;
}

/** 補背景選項（0103 回望用） */
export interface QuestionBackgroundOption {
  id: string;
  label: string;
  hint: string;
}

export interface ChapterOpening {
  id: string;
  qrCode: string;
  title: string;
  subtitle: string;
  layout?: ChapterLayout;
  headerEmoji?: string;
  accentGradient?: string;
  /** 選填；無則不顯示「先帶走這一句」 */
  quote?: string;
  atAGlance?: string;
  tryPrompt: string;
  /** ai-entry：可複製的試用語句 */
  samplePrompt?: string;
  reflectPrompt: string;
  reflectPlaceholder?: string;
  continueTitle: string;
  continueBody: string;
  printCardTitle: string;
  printCardDescription?: string;
  printButtonLabel?: string;
  guideTitle: string;
  guideDuration?: string;
  guideParagraphs: string[];
  guideFooterNote?: string;
  footerGuideLabel?: string;
  /** routes 版型：四入口啟航路線 */
  entries?: ChapterEntry[];
  /** ai-entry 版型：常見手機入口路徑 */
  phonePaths?: PhoneEntryPath[];
  /** question-rewrite 版型：三組示範 + 背景選項 */
  rewriteDemos?: QuestionRewriteDemo[];
  backgroundOptions?: QuestionBackgroundOption[];
}

export const CHAPTER_0100: ChapterOpening = {
  id: "0100",
  qrCode: "0100",
  title: "風起了，調整風帆",
  subtitle: "章節開篇",
  layout: "routes",
  headerEmoji: "⛵",
  quote: "AI 時代不必從焦慮開始，可以從自己的節奏開始。",
  atAGlance:
    "這一章不問您會不會用 AI，只問：今天想從哪一個小入口開始——問一句、拍一下、找照片，或記下一句話。選一條路，暖暖陪您慢慢走。",
  tryPrompt:
    "從本章入口中，圈出一個最想先試的：問一句、拍一下、找照片，或記下一句話。",
  reflectPrompt: "哪一個入口，最接近我現在的生活？",
  reflectPlaceholder: "例如：我比較想先試「問一句」，因為最近有很多想問的事…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "掃碼進入暖暖，聽 2 分鐘章首導讀，再選一條最適合您的啟航路線。",
  printCardTitle: "智慧啟航路線卡",
  printCardDescription: "沒有手機掃碼時，可列印下方路線卡，勾選今天想試的入口。",
  printButtonLabel: "列印啟航路線卡",
  guideTitle: "章首導讀",
  guideDuration: "約 2 分鐘",
  guideParagraphs: [
    "親愛的領航者，歡迎來到這一章。",
    "風起了，不必急著把帆拉滿。人生下半場，重要的不是跟上所有人的步調，而是找到屬於自己的節奏。",
    "暖暖不是來考您會多少科技，而是陪您用「問一句、拍一下、找照片、記下一句話」這四種日常方式，慢慢熟悉 AI 時代的生活。",
    "請先選一個最想試的入口。沒有標準答案，只有最適合您現在狀態的那一條路。",
  ],
  guideFooterNote: "語音版導讀即將推出；目前請先閱讀以上文字（約 2 分鐘）。",
  footerGuideLabel: "聽／讀 2 分鐘章首導讀",
  entries: [
    {
      id: "ask",
      label: "問一句",
      hint: "跟暖暖語音聊一下，不用打字",
      emoji: "🎙",
      open: "voice",
    },
    {
      id: "snap",
      label: "拍一下",
      hint: "打開相機，拍餐點或生活瞬間",
      emoji: "📸",
      open: "camera",
    },
    {
      id: "photo",
      label: "找照片",
      hint: "從相簿選一張已有的照片",
      emoji: "🖼",
      open: "photo",
    },
    {
      id: "note",
      label: "記下一句話",
      hint: "寫下一件小事，點亮 SMART 光點",
      emoji: "✨",
      href: "/smart/spark?source=chapter0100",
    },
  ],
};

export const CHAPTER_0102: ChapterOpening = {
  id: "0102",
  qrCode: "0102",
  title: "先找得到，再慢慢用",
  subtitle: "章節開篇",
  layout: "ai-entry",
  headerEmoji: "📱",
  accentGradient: "linear-gradient(180deg, #F0E8FF 0%, transparent 55%)",
  atAGlance:
    "這一章只做一件事：在手機裡找到可以跟 AI 說話的入口，並試問第一句。不同品牌路徑不太一樣，下面有文字版指引。",
  tryPrompt:
    "在手機中找一個 AI 對話入口，輸入或說出下面這句話（可以複製）：",
  samplePrompt: "請用簡單中文告訴我，你可以怎麼幫助生活。",
  reflectPrompt: "我最希望 AI 先協助生活中的哪一件小事？",
  reflectPlaceholder: "例如：幫我記得吃藥、幫我辨識食物熱量、陪我聊天解悶…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "掃碼進入暖暖，觀看 30 秒「找到手機 AI 入口」示範；不同手機也提供文字版路徑。",
  printCardTitle: "常見入口辨識卡",
  printCardDescription:
    "沒有手機掃碼時，可列印這張卡，對照自己的手機品牌找入口。",
  printButtonLabel: "列印入口辨識卡",
  guideTitle: "找到手機 AI 入口",
  guideDuration: "約 30 秒",
  guideParagraphs: [
    "先確認手機已連上網路，並把音量打開。",
    "對照下方「常見入口」找到 AI 或語音助理，點進去後說出或貼上試用語句。",
    "若找不到，可以先在暖暖 App 底部按「對話」，用同一句話試試看。",
  ],
  guideFooterNote: "示範影片即將推出；目前請先閱讀文字版路徑（約 30 秒）。",
  footerGuideLabel: "觀看／閱讀 30 秒入口示範",
  phonePaths: [
    {
      id: "iphone",
      label: "iPhone（Siri）",
      emoji: "🍎",
      steps: [
        "長按側邊鍵（或 Home 鍵）喚醒 Siri",
        "看到 Siri 畫面後，說出試用語句",
        "也可到「設定 → Siri」確認已開啟",
      ],
    },
    {
      id: "samsung",
      label: "Samsung（Galaxy AI / Bixby）",
      emoji: "📲",
      steps: [
        "長按側邊鍵喚醒 Bixby 或 Galaxy AI",
        "在對話框輸入或說出試用語句",
        "部分機型可在設定搜尋「Galaxy AI」",
      ],
    },
    {
      id: "google",
      label: "Google 手機 / 原生 Android",
      emoji: "🤖",
      steps: [
        "長按電源鍵喚醒 Google 助理",
        "點麥克風或鍵盤，說出或輸入試用語句",
        "可到「設定 → Google → 助理」確認已啟用",
      ],
    },
    {
      id: "xiaomi",
      label: "小米（小愛同學）",
      emoji: "🔶",
      steps: [
        "長按電源鍵或說「小愛同學」",
        "在對話畫面說出試用語句",
        "可在設定搜尋「小愛同學」確認已開啟",
      ],
    },
    {
      id: "oppo",
      label: "OPPO / realme（小布）",
      emoji: "🟢",
      steps: [
        "長按電源鍵喚醒小布助手",
        "輸入或說出試用語句",
        "可在設定搜尋「小布」",
      ],
    },
    {
      id: "nuannuan",
      label: "暖暖 App",
      emoji: "🧡",
      steps: [
        "打開暖暖，登入後到首頁",
        "點底部「對話」或語音按鈕",
        "說出或輸入試用語句即可",
      ],
    },
  ],
};

export const CHAPTER_0103: ChapterOpening = {
  id: "0103",
  qrCode: "0103",
  title: "把關鍵字丟掉：用人話對話",
  subtitle: "章節開篇",
  layout: "question-rewrite",
  headerEmoji: "💬",
  accentGradient: "linear-gradient(180deg, #FFF0E8 0%, transparent 55%)",
  quote: "好問題不必像口令；把真實需要說清楚，AI 才能真正幫上忙。",
  atAGlance:
    "很多人習慣只丟三個關鍵字給 AI，像在下口令。這一章練習把關鍵字改寫成完整的生活提問，並補上一點背景，讓回答更貼近您真正需要。",
  tryPrompt:
    "挑一個最近想查的問題，先寫三個關鍵字，再把它改成一段完整的生活提問。",
  reflectPrompt: "補上哪一項背景後，AI 的回應最接近我的需要？",
  reflectPlaceholder: "例如：補上「健康背景」和「想達成的目的」後，回答就具體多了…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "掃碼進入暖暖，聽三組「關鍵字變自然提問」示範，再完成一次改寫。",
  printCardTitle: "自然提問四格卡",
  printCardDescription:
    "可列印四格卡：關鍵字、補背景、自然提問、回望。填完可帶在身邊練習。",
  printButtonLabel: "列印四格卡",
  guideTitle: "關鍵字變自然提問",
  guideDuration: "三組示範",
  guideParagraphs: [
    "口令式問法：「血壓 高 吃藥」— AI 往往只能猜您要什麼。",
    "自然提問：說清楚誰、什麼狀況、想達成什麼，回答才會貼近生活。",
    "下面三組示範可以對照著改寫您自己的問題；改完可在暖暖語音試問。",
  ],
  guideFooterNote: "語音示範即將推出；目前請先閱讀三組文字示範。",
  footerGuideLabel: "看三組「關鍵字→自然提問」示範",
  rewriteDemos: [
    {
      id: "bp",
      label: "示範 1｜健康飲食",
      keywords: ["血壓", "偏高", "飲食"],
      naturalQuestion:
        "我有在吃血壓藥，最近量起來偏高，請用簡單中文告訴我，飲食上要注意什麼？",
    },
    {
      id: "video",
      label: "示範 2｜跟家人視訊",
      keywords: ["孫子", "視訊", "教"],
      naturalQuestion:
        "孫子下週要跟我視訊，我想學怎麼接視訊電話，可以一步一步慢慢教嗎？",
    },
    {
      id: "knee",
      label: "示範 3｜運動與身體",
      keywords: ["膝蓋", "走路", "痛"],
      naturalQuestion:
        "我走路時膝蓋會痛，想問有什麼適合的運動，或該注意什麼？",
    },
  ],
  backgroundOptions: [
    { id: "health", label: "健康或慢性病背景", hint: "例如高血壓、糖尿病" },
    { id: "when", label: "時間、頻率或情境", hint: "例如最近一週、早上起床" },
    { id: "goal", label: "想達成的目的", hint: "例如想知道該怎麼做" },
    { id: "who", label: "跟誰有關", hint: "例如自己、家人、醫生" },
    { id: "limit", label: "我的限制", hint: "例如只用語音、不太會打字" },
  ],
};

const CHAPTERS: Record<string, ChapterOpening> = {
  "0100": CHAPTER_0100,
  "0102": CHAPTER_0102,
  "0103": CHAPTER_0103,
};

export function getChapterOpening(id: string): ChapterOpening | null {
  return CHAPTERS[id] ?? null;
}

export function chapterPickKey(chapterId: string): string {
  return `nuannuan_chapter${chapterId}_pick`;
}

export function chapterDraftKey(chapterId: string): string {
  return `nuannuan_chapter${chapterId}_draft`;
}

export interface ChapterRewriteDraft {
  keywords: [string, string, string];
  naturalQuestion: string;
  reflectNote: string;
  backgrounds: string[];
}

export function chapterEntryHref(
  chapterId: string,
  entry: ChapterEntry
): string {
  if (entry.href) return entry.href;
  if (!entry.open) return "/";
  const params = new URLSearchParams({ open: entry.open, from: `chapter${chapterId}` });
  return `/?${params.toString()}`;
}

/** 0102：在暖暖用同一句話試語音 */
export function chapterVoiceTryHref(chapterId: string): string {
  const params = new URLSearchParams({ open: "voice", from: `chapter${chapterId}` });
  return `/?${params.toString()}`;
}

export function isSparkSource(value: string | null | undefined): value is SparkSource {
  return value === "spark_card" || value === "chapter3" || value === "chapter0100";
}

/** @deprecated 請改用 chapterPickKey(id) */
export const PICKED_ENTRY_KEY = chapterPickKey("0100");

/** 章節開篇 QR 深連結（例：0100 → /smart/chapter/0100） */
import { CHAPTER_2_OPENINGS } from "./chapter-opening-ch2";

export type ChapterLayout =
  | "routes"
  | "ai-entry"
  | "question-rewrite"
  | "organize-decide"
  | "vision-identify"
  | "photo-search"
  | "note-capture"
  | "smart-flow"
  | "menu-translate"
  | "product-compare"
  | "curiosity-ask"
  | "recipe-card"
  | "photo-edit-safe"
  | "photo-curate"
  | "sensory-habit";

export type VisionTrustLevel = "enjoy" | "verify";

export type ChapterEntryId = string;

export type SparkSource = "spark_card" | "chapter3" | `chapter${string}`;

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

/** 影像辨識：可直接欣賞 vs 需要查證（0105 用） */
export interface VisionIdentifyDemo {
  id: string;
  label: string;
  itemLabel: string;
  askPrompt: string;
  aiAnswerSummary: string;
  trustLevel: VisionTrustLevel;
  verifyNote: string;
}

/** 拍照安全提醒（0105 用） */
export interface VisionSafetyTip {
  id: string;
  label: string;
  items: string[];
}

/** 相簿搜尋示範（0106 用） */
export interface PhotoSearchDemo {
  id: string;
  label: string;
  searchKeyword: string;
  memoryNote: string;
  reflectNote: string;
}

/** 數位便條標籤（0107 用） */
export interface NoteTagOption {
  id: string;
  label: string;
}

/** 數位便條示範（0107 用） */
export interface NoteCaptureDemo {
  id: string;
  label: string;
  noteTitle: string;
  noteContent: string;
  tagId: string;
  reflectNote: string;
}

/** 一拍二問三記下示範（0108 用） */
export interface SmartFlowDemo {
  id: string;
  label: string;
  snapNote: string;
  askQuestion: string;
  askAnswer: string;
  savedLine: string;
  reflectNote: string;
}

/** 外文菜單翻譯示範（0203 用） */
export interface MenuTranslateDemo {
  id: string;
  label: string;
  menuSnippet: string;
  dietaryNeed: string;
  translationSummary: string;
  confirmWithStaff: string;
}

/** 商品比較示範（0204 用） */
export interface ProductCompareDemo {
  id: string;
  label: string;
  productA: string;
  productB: string;
  threeDiffs: [string, string, string];
  verifyItem: string;
  decisionFactor: string;
}

/** 好奇心提問示範（0205 用） */
export interface CuriosityAskDemo {
  id: string;
  label: string;
  question: string;
  aiAnswer: string;
  insight: string;
}

/** 料理卡示範（0207 用） */
export interface RecipeCardDemo {
  id: string;
  label: string;
  dishName: string;
  colors: string;
  fiberSource: string;
  feeling: string;
}

/** 安全修圖示範（0209 用） */
export interface PhotoEditSafeDemo {
  id: string;
  label: string;
  backupNote: string;
  editAction: string;
  compareNote: string;
}

/** 照片策展示範（0210 用） */
export interface PhotoCurateDemo {
  id: string;
  label: string;
  theme: string;
  captions: [string, string, string];
  reflectNote: string;
}

/** 感官習慣場景（0211 用） */
export interface HabitSceneOption {
  id: string;
  label: string;
  hint: string;
}

export interface SensoryHabitDemo {
  id: string;
  label: string;
  pickedScenes: string[];
  planNote: string;
  reflectNote: string;
}

/** 「整理三點，不替我決定」生活案例（0104 用） */
export interface OrganizeDecideDemo {
  id: string;
  label: string;
  messyTask: string;
  askPrompt: string;
  threePoints: [string, string, string];
  nextStep: string;
  userDecision: string;
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
  /** organize-decide 版型：生活案例示範 */
  organizeDemos?: OrganizeDecideDemo[];
  /** vision-identify 版型：影像辨識示範 + 安全提醒 */
  visionDemos?: VisionIdentifyDemo[];
  visionSafetyTips?: VisionSafetyTip[];
  /** photo-search 版型：有溫度的搜尋詞建議 */
  warmKeywordSuggestions?: string[];
  photoSearchDemos?: PhotoSearchDemo[];
  /** note-capture 版型：便條標籤與示範 */
  defaultNoteTitle?: string;
  noteTagOptions?: NoteTagOption[];
  noteCaptureDemos?: NoteCaptureDemo[];
  /** smart-flow 版型：三拍示範 */
  smartFlowDemos?: SmartFlowDemo[];
  /** menu-translate 版型 */
  menuDemos?: MenuTranslateDemo[];
  /** product-compare 版型 */
  productCompareDemos?: ProductCompareDemo[];
  /** curiosity-ask 版型 */
  curiosityDemos?: CuriosityAskDemo[];
  /** recipe-card 版型 */
  recipeCardDemos?: RecipeCardDemo[];
  /** photo-edit-safe 版型 */
  photoEditDemos?: PhotoEditSafeDemo[];
  /** photo-curate 版型 */
  photoCurateDemos?: PhotoCurateDemo[];
  /** sensory-habit 版型：生活場景選項 */
  habitSceneOptions?: HabitSceneOption[];
  habitDemos?: SensoryHabitDemo[];
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

export const CHAPTER_0104: ChapterOpening = {
  id: "0104",
  qrCode: "0104",
  title: "第二個大腦：把繁雜交給 AI",
  subtitle: "章節開篇",
  layout: "organize-decide",
  headerEmoji: "🧠",
  accentGradient: "linear-gradient(180deg, #E8F5EE 0%, transparent 55%)",
  quote: "AI 可以整理資訊；方向、價值與最後決定，仍然由您掌握。",
  atAGlance:
    "這一章練習把「覺得繁雜」的事交給 AI 整理成三個重點與一個小步驟——但決定權留在您手上。請選不含敏感資料的生活小事來試。",
  tryPrompt:
    "拿一件最近覺得繁雜、但不含敏感資料的事，請 AI 整理成三個重點與一個可先做的下一步。",
  reflectPrompt: "整理之後，我真正需要決定的是什麼？",
  reflectPlaceholder: "例如：要不要改變作息可以我自己想，但調藥必須問醫生…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "掃碼進入暖暖，跟著一個生活案例練習「整理三點，不替我決定」。",
  printCardTitle: "三點一決定整理卡",
  printCardDescription:
    "可列印：繁雜的事、三個重點、可先做的下一步、我真正要決定的。",
  printButtonLabel: "列印整理卡",
  guideTitle: "整理三點，不替我決定",
  guideDuration: "一則生活案例",
  guideParagraphs: [
    "請 AI 整理，不是請 AI 替您選。整理完，您仍要問：這件事最後誰來決定？",
    "對照下方案例，看 AI 怎麼幫忙「變清楚」，而決定權如何留在您手上。",
    "改完可在暖暖語音用同樣方式試一件您自己的小事。",
  ],
  guideFooterNote: "互動案例影片即將推出；目前請先閱讀文字案例。",
  footerGuideLabel: "看生活案例：整理三點，不替我決定",
  organizeDemos: [
    {
      id: "handout",
      label: "案例｜回診衛教單太多",
      messyTask: "回診拿回家一疊衛教單和用藥說明，紙張多、字又小，不知道先看什麼。",
      askPrompt:
        "請幫我把下面這件事整理成三個重點，和一個今天可以先做的小步驟。請用簡單中文，不要替我決定，只要整理資訊：回診拿回家一疊衛教單和用藥說明，不知道先看什麼。",
      threePoints: [
        "先找出跟「今天就要做」有關的部分（例如用藥時間）",
        "其次看飲食或運動建議，可以週末再細讀",
        "其餘資料先收好，下次回診可問醫師",
      ],
      nextStep: "今晚先把用藥時間抄在一張大卡上，貼在藥盒旁。",
      userDecision: "要不要調整用藥時間——這必須問醫師，不能自己改。",
    },
    {
      id: "trip",
      label: "案例｜出門要帶什麼",
      messyTask: "下週要跟朋友出遊，要帶的東西越想越亂，怕漏帶藥又怕冷。",
      askPrompt:
        "請幫我把下面這件事整理成三個重點，和一個今天可以先做的小步驟。請用簡單中文，不要替我決定，只要整理資訊：下週出遊要帶什麼，怕漏帶藥又怕冷。",
      threePoints: [
        "必帶：日常藥物、健保卡、一件外套",
        "可選：雨具、備用鞋襪（看天氣再決定）",
        "出發前夜再檢查一次清單即可",
      ],
      nextStep: "今天先寫一張「必帶三樣」小卡放錢包。",
      userDecision: "要不要多帶一件厚外套——看我自己對冷暖的感覺。",
    },
  ],
};

export const CHAPTER_0105: ChapterOpening = {
  id: "0105",
  qrCode: "0105",
  title: "為手機裝上眼睛：萬物皆可問",
  subtitle: "章節開篇",
  layout: "vision-identify",
  headerEmoji: "👁",
  accentGradient: "linear-gradient(180deg, #E8F0FA 0%, transparent 55%)",
  quote: "手機多一雙眼睛，生活就多一個理解世界的入口。",
  atAGlance:
    "這一章練習用手機拍照，請 AI 用簡單中文說明「看得見、但叫不出名字」的低風險物品——並學會分辨：哪些回答可以直接欣賞，哪些還需要查證。",
  tryPrompt:
    "選一樣看得見、但叫不出名字的低風險物品，拍下來請 AI 用簡單中文說明。",
  reflectPrompt: "AI 的回答中，哪一點值得我再查證？",
  reflectPlaceholder: "例如：AI 說這是某種草藥，但能不能吃還要問藥師…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "掃碼進入暖暖，看 30 秒影像辨識示範，並練習分辨「可直接欣賞」與「需要查證」。",
  printCardTitle: "影像辨識安全卡",
  printCardDescription:
    "可列印：拍的物品、AI 說了什麼、可直接欣賞或需查證、值得再查證的一點。",
  printButtonLabel: "列印安全卡",
  guideTitle: "影像辨識：欣賞 vs 查證",
  guideDuration: "約 30 秒",
  guideParagraphs: [
    "拍照問 AI 很方便，但不是每個答案都能直接相信。先問：這件事「聽聽就好」，還是「會影響健康或安全」？",
    "可直接欣賞：認識路邊花草、看包裝上的外文說明——錯了頂多有趣，傷害不大。",
    "需要查證：跟吃、用藥、過敏、投資、詐騙有關——請再問專業人士或官方來源。",
  ],
  guideFooterNote: "示範影片即將推出；目前請先閱讀下方文字案例。",
  footerGuideLabel: "看 30 秒影像辨識示範",
  visionSafetyTips: [
    {
      id: "ok",
      label: "適合試拍（低風險）",
      items: ["路邊花草、公園樹木", "包裝上的外文或圖示", "不認識的日用品外觀"],
    },
    {
      id: "avoid",
      label: "請勿拍攝（含敏感資料）",
      items: ["身分證、健保卡、信用卡", "完整處方或病歷", "他人臉部特寫未經同意"],
    },
  ],
  visionDemos: [
    {
      id: "flower",
      label: "案例｜路邊不知名小花",
      itemLabel: "公園長椅旁的小白花",
      askPrompt:
        "請用簡單中文告訴我，照片裡這是什麼花、大概什麼季節開、能不能隨便摘。如果不確定，請說明不確定的部分。",
      aiAnswerSummary:
        "可能是某種菊科或十字花科的野花，春天常見；觀賞即可，不建議隨意採摘。",
      trustLevel: "enjoy",
      verifyNote: "認識花草純屬欣賞，錯了也無妨；不必為此特別查證。",
    },
    {
      id: "label",
      label: "案例｜食品包裝英文成分",
      itemLabel: "點心包裝背面的英文成分表",
      askPrompt:
        "請用簡單中文告訴我，照片裡這段英文成分大概寫什麼、有沒有常見過敏原。如果不確定，請說明不確定的部分。",
      aiAnswerSummary:
        "可能含有小麥、牛奶、堅果等字樣；但過敏與否必須對照完整標示。",
      trustLevel: "verify",
      verifyNote: "跟過敏、能不能吃有關——要對照包裝原文或問藥師，不能只信 AI。",
    },
  ],
};

export const CHAPTER_0106: ChapterOpening = {
  id: "0106",
  qrCode: "0106",
  title: "為手機裝上相簿：照片可以搜尋",
  subtitle: "章節開篇",
  layout: "photo-search",
  headerEmoji: "🖼",
  accentGradient: "linear-gradient(180deg, #F5EEF8 0%, transparent 55%)",
  quote: "照片不只是檔案；一個有溫度的詞，可以喚回一段記憶。",
  atAGlance:
    "這一章練習用「有溫度的詞」在相簿裡搜尋——海邊、生日、台南、咖啡、朋友——讓被淹沒的回憶重新浮上來。搜尋結果可能受備份設定與辨識準確度影響，私人照片請先確認雲端同步與分享權限。",
  tryPrompt:
    "打開自己的相簿搜尋一個有溫度的詞，選出最觸動的一張，寫下一句回憶。",
  reflectPrompt: "這張照片讓我想起了誰、哪裡，或哪一段人生？",
  reflectPlaceholder: "例如：想起在台南和老朋友一起喝咖啡的那個下午…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "掃碼進入暖暖，觀看「一個詞找回照片」微短劇，再完成一張私人回憶卡。",
  printCardTitle: "相簿搜尋關鍵字卡",
  printCardDescription: "可列印：搜尋詞、觸動的一張、一句回憶、這張照片讓我想起…",
  printButtonLabel: "列印關鍵字卡",
  guideTitle: "一個詞找回照片",
  guideDuration: "微短劇",
  guideParagraphs: [
    "以前照片不多，每一張都伴著說得出來的故事；現在手機裡照片越來越多，回憶反而越難找。",
    "具有搜尋功能的數位相簿，可以依日期、地點或影像內容提出候選，再由您找出真正想念的那一張。",
    "一個有溫度的詞，便可能讓一段回憶重新走回來。",
  ],
  guideFooterNote: "微短劇即將推出；目前請先閱讀文字示範。",
  footerGuideLabel: "觀看「一個詞找回照片」微短劇",
  warmKeywordSuggestions: ["海邊", "生日", "台南", "咖啡", "朋友"],
  photoSearchDemos: [
    {
      id: "coffee",
      label: "案例｜搜尋「咖啡」",
      searchKeyword: "咖啡",
      memoryNote: "和老朋友在巷口小店，第一次用新手機拍的那杯 latte。",
      reflectNote: "想起那位多年未見、仍記得我口味的朋友。",
    },
    {
      id: "tainan",
      label: "案例｜搜尋「台南」",
      searchKeyword: "台南",
      memoryNote: "赤崁樓前，孫子第一次自己按下快門。",
      reflectNote: "那一段三代同遊的旅程，以及他興奮的表情。",
    },
  ],
};

export const CHAPTER_0107: ChapterOpening = {
  id: "0107",
  qrCode: "0107",
  title: "為它準備便條紙：靈感被收藏",
  subtitle: "章節開篇",
  layout: "note-capture",
  headerEmoji: "📝",
  accentGradient: "linear-gradient(180deg, #FFF8E8 0%, transparent 55%)",
  quote: "靈感不必靠硬記；留下一句、加一個標籤，日後就找得到。",
  atAGlance:
    "這一章練習把稍縱即逝的靈感，用最小單位存進數位便條：一個標題、一句話、一個簡單標籤。請避免把密碼、驗證碼或完整敏感資料放進一般筆記。",
  tryPrompt:
    "建立一則最簡單的筆記：標題「今天的小發現」，內容只寫一句真正想留下的話。",
  reflectPrompt: "這句話為什麼值得送給未來的自己？",
  reflectPlaceholder: "例如：下次看到類似的花，我就能叫出名字了…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "掃碼進入暖暖，跟著 30 秒示範完成第一張數位便條，保存與否由您決定。",
  printCardTitle: "一句話便條模板",
  printCardDescription: "可列印：標題、一句話、標籤、送給未來的自己。",
  printButtonLabel: "列印便條模板",
  guideTitle: "第一張數位便條",
  guideDuration: "約 30 秒",
  guideParagraphs: [
    "散步時知道一朵花的名字、翻相簿找到老照片、讀到想提醒自己的話——這些片刻很珍貴，也很容易消失。",
    "不必一次建立複雜分類；最小的保存單位，可以只是一個標題、一句話與一個簡單標籤。",
    "先留下，再慢慢整理，比期待自己永遠記得更可靠。",
  ],
  guideFooterNote: "30 秒示範影片即將推出；目前請先閱讀文字案例。",
  footerGuideLabel: "看 30 秒數位便條示範",
  defaultNoteTitle: "今天的小發現",
  noteTagOptions: [
    { id: "discovery", label: "今天的小發現" },
    { id: "try", label: "想試試看" },
    { id: "share", label: "和家人分享" },
  ],
  noteCaptureDemos: [
    {
      id: "flower",
      label: "案例｜花的名字",
      noteTitle: "今天的小發現",
      noteContent: "路邊那朵小白花可能叫「阿拉伯婆婆納」，春天常見。",
      tagId: "discovery",
      reflectNote: "下次散步看到，可以叫出名字，跟孙子分享。",
    },
    {
      id: "quote",
      label: "案例｜想記住的一句話",
      noteTitle: "今天的小發現",
      noteContent: "「慢下來，不是落後，是留給自己聽見生活的空隙。」",
      tagId: "share",
      reflectNote: "下次心裡急躁時，提醒自己這句話。",
    },
  ],
};

export const CHAPTER_0108: ChapterOpening = {
  id: "0108",
  qrCode: "0108",
  title: "預備起飛：一拍、二問、三記下",
  subtitle: "章節開篇",
  layout: "smart-flow",
  headerEmoji: "🚀",
  accentGradient: "linear-gradient(180deg, #E8F4FA 0%, #FFF8EE 100%)",
  quote: "一拍、二問、三記下：看見、理解、保存，完成第一個 AI 生活流程。",
  atAGlance:
    "這一章把「一拍、二問、三記下」串成第一條可重複的生活流線：先拍下低風險事物，用自然的話問 AI，再把最有用的一句存進便條。「二問」是第二步的名稱，不是規定一定要問兩次。",
  tryPrompt:
    "完整做一次：拍下一樣低風險事物，問 AI 一個簡單問題，再把最有用的一句存進筆記。",
  reflectPrompt: "這一次，我真正帶走了什麼？",
  reflectPlaceholder: "例如：不只認識了那朵花，還留下一句可以跟家人分享的話…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "掃碼進入暖暖，看 30 秒三拍示範，跟著完成一次；可以直接離開，也可以選擇保存成果。",
  printCardTitle: "數位華爾滋隨身卡",
  printCardDescription: "可列印：一拍、二問、三記下，以及這一次我帶走了什麼。",
  printButtonLabel: "列印隨身卡",
  guideTitle: "一拍、二問、三記下",
  guideDuration: "約 30 秒",
  guideParagraphs: [
    "真正重要的，不是記住全部工具名稱，而是把幾個簡單動作串成一條自己用得上的生活流線。",
    "一拍：看到想了解的，先拍下來。二問：用自然的話問一句。三記下：從回答裡選出最有用的一句，存進便條。",
    "當您完成一次「看見、理解、保存」，就親手完成了一個可重複的生活流程。",
  ],
  guideFooterNote: "30 秒三拍示範即將推出；目前請先閱讀文字案例。",
  footerGuideLabel: "看 30 秒三拍示範",
  smartFlowDemos: [
    {
      id: "flower",
      label: "案例｜路邊小花完整流程",
      snapNote: "公園長椅旁不知名小白花",
      askQuestion: "這是什麼？請用簡單中文說明。",
      askAnswer: "可能是十字花科的野花，春天常見，觀賞即可。",
      savedLine: "那朵小白花可能叫「阿拉伯婆婆納」，春天公园常見。",
      reflectNote: "我完成了第一次「看見→理解→保存」，可以跟家人分享这句话。",
    },
  ],
};

const CHAPTERS: Record<string, ChapterOpening> = {
  "0100": CHAPTER_0100,
  "0102": CHAPTER_0102,
  "0103": CHAPTER_0103,
  "0104": CHAPTER_0104,
  "0105": CHAPTER_0105,
  "0106": CHAPTER_0106,
  "0107": CHAPTER_0107,
  "0108": CHAPTER_0108,
  ...CHAPTER_2_OPENINGS,
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

export interface ChapterOrganizeDraft {
  messyTask: string;
  threePoints: [string, string, string];
  nextStep: string;
  userDecision: string;
  reflectNote: string;
}

export interface ChapterVisionDraft {
  itemLabel: string;
  aiAnswerNote: string;
  trustLevel: VisionTrustLevel | "";
  reflectNote: string;
}

export interface ChapterPhotoSearchDraft {
  searchKeyword: string;
  memoryNote: string;
  reflectNote: string;
}

export interface ChapterNoteCaptureDraft {
  noteTitle: string;
  noteContent: string;
  tagId: string;
  reflectNote: string;
}

export interface ChapterSmartFlowDraft {
  snapNote: string;
  askQuestion: string;
  askAnswer: string;
  savedLine: string;
  reflectNote: string;
}

export interface ChapterMenuDraft {
  menuSnippet: string;
  dietaryNeed: string;
  translationSummary: string;
  confirmWithStaff: string;
  reflectNote: string;
}

export interface ChapterProductCompareDraft {
  productA: string;
  productB: string;
  threeDiffs: [string, string, string];
  verifyItem: string;
  reflectNote: string;
}

export interface ChapterCuriosityDraft {
  question: string;
  aiAnswer: string;
  insight: string;
  reflectNote: string;
}

export interface ChapterRecipeDraft {
  dishName: string;
  colors: string;
  fiberSource: string;
  feeling: string;
  reflectNote: string;
}

export interface ChapterPhotoEditDraft {
  backupDone: boolean;
  editAction: string;
  compareNote: string;
  reflectNote: string;
}

export interface ChapterPhotoCurateDraft {
  theme: string;
  captions: [string, string, string];
  reflectNote: string;
}

export interface ChapterSensoryHabitDraft {
  pickedScenes: string[];
  planNote: string;
  reflectNote: string;
}

/** 0202：植物辨識提問句 */
export function buildPlantAskPrompt(): string {
  return "這可能是什麼植物？請說明特徵。如果不確定，請說明不確定的部分。";
}

/** 0203：菜單翻譯提問句 */
export function buildMenuTranslatePrompt(dietaryNeed?: string): string {
  const base =
    "請翻譯照片裡這段菜單的菜名與主要食材，用簡單中文。如果不確定，請說明不確定的部分。";
  const need = dietaryNeed?.trim();
  if (!need) return base;
  return `${base} 我的飲食需要：${need}`;
}

/** 0204：商品比較提問句 */
export function buildProductComparePrompt(productA?: string, productB?: string): string {
  const a = productA?.trim() || "商品 A";
  const b = productB?.trim() || "商品 B";
  return `請整理「${a}」與「${b}」的三項差異，以及一項我需要再向標示或店員確認的資訊。請用簡單中文，不要替我決定買哪一個。`;
}

/** 0205：好奇心提問句 */
export function buildCuriosityPrompt(question?: string): string {
  const q = question?.trim();
  if (!q) return "請用簡單中文解釋，並舉一個日常生活例子。";
  return `${q} 請用簡單中文解釋，並舉一個日常生活例子。`;
}

/** 0206：餐點觀察提問句 */
export function buildFoodObservePrompt(): string {
  return "請整理這道餐點可能的主要食材、烹調特色，以及一項溫和的飲食觀察。請用簡單中文，這不是醫療或營養診斷。";
}

/** 0108：二問用的自然提問句 */
export function buildSmartFlowAskPrompt(subject?: string): string {
  const base = "這是什麼？請用簡單中文說明。";
  const hint = subject?.trim();
  if (!hint) return base;
  return `${base}（我拍的是：${hint}）`;
}

/** 0105：拍照後請 AI 說明用的提問句 */
export function buildVisionAskPrompt(itemHint?: string): string {
  const base =
    "請用簡單中文告訴我，照片裡這是什麼、有什麼用途或特色。如果不確定，請說明您不確定的部分。";
  const hint = itemHint?.trim();
  if (!hint) return base;
  return `${base}（我拍的是：${hint}）`;
}

/** 0104：請 AI 整理用的提問句（不含敏感資料） */
export function buildOrganizeAskPrompt(task: string): string {
  const t = task.trim();
  if (!t) {
    return "請幫我把下面這件事整理成三個重點，和一個今天可以先做的小步驟。請用簡單中文，不要替我決定，只要整理資訊：";
  }
  return `請幫我把下面這件事整理成三個重點，和一個今天可以先做的小步驟。請用簡單中文，不要替我決定，只要整理資訊：${t}`;
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

/** 0105：在暖暖開相機拍照辨識 */
export function chapterCameraTryHref(chapterId: string): string {
  const params = new URLSearchParams({ open: "camera", from: `chapter${chapterId}` });
  return `/?${params.toString()}`;
}

/** 0105：在暖暖從相簿選照片 */
export function chapterPhotoTryHref(chapterId: string): string {
  const params = new URLSearchParams({ open: "photo", from: `chapter${chapterId}` });
  return `/?${params.toString()}`;
}

/** 章節練習 → 光點來源（例：0104 → chapter0104） */
export function chapterSparkSource(chapterId: string): SparkSource {
  return `chapter${chapterId}`;
}

export function chapterSparkHref(chapterId: string): string {
  return `/smart/spark?source=${chapterSparkSource(chapterId)}`;
}

export function isSparkSource(value: string | null | undefined): value is SparkSource {
  if (!value) return false;
  return value === "spark_card" || value === "chapter3" || /^chapter\d{4}$/.test(value);
}

export function sparkFormTitle(source: SparkSource): string {
  if (source === "chapter3") return "Chapter 3 打卡";
  if (source === "chapter0100") return "記下一句話";
  if (/^chapter\d{4}$/.test(source)) return "把這句話點成光點";
  return "點亮光點";
}

/** 深連結意圖提示（相機／語音上方顯示） */
export const CHAPTER_INTENT_KEY = "nuannuan_chapter_intent";

export interface ChapterIntentHint {
  from: string;
  chapterId: string;
  label: string;
  tips: string[];
}

export function getChapterDeepLinkHint(from: string | null | undefined): ChapterIntentHint | null {
  if (!from?.startsWith("chapter")) return null;
  const chapterId = from.replace(/^chapter/, "");
  const known: Record<string, { label: string; tips: string[] }> = {
    "0105": {
      label: "萬物皆可問",
      tips: ["拍低風險物品", "請 AI 用簡單中文說明", "牽涉安全請再查證"],
    },
    "0108": {
      label: "一拍、二問、三記下",
      tips: ["一拍：先拍下來", "二問：用自然的話問一句", "三記下：留下最有用的一句"],
    },
    "0201": {
      label: "數位華爾滋",
      tips: ["一拍：先拍下來", "二問：用自然的話問一句", "三記下：留下最有用的一句"],
    },
    "0202": {
      label: "自然篇｜識花",
      tips: ["拍花朵與葉片", "問：這可能是什麼植物？", "食用／藥用請再查證"],
    },
    "0203": {
      label: "旅行篇｜菜單",
      tips: ["拍清楚一小段菜單", "補上自己的飲食需要", "點餐前向店家確認"],
    },
    "0204": {
      label: "消費篇｜比較",
      tips: ["拍公開標籤即可", "勿拍收據個資", "需要／適合／值得由您判斷"],
    },
    "0205": {
      label: "知識篇｜好奇",
      tips: ["用自己的話問", "請舉一個生活例子", "重要資訊再查可靠來源"],
    },
    "0206": {
      label: "美食篇｜觀察",
      tips: ["拍一道餐點", "請整理可能食材與溫和觀察", "這不是醫療或營養診斷"],
    },
  };
  const hit = known[chapterId] ?? {
    label: "書本練習",
    tips: ["一拍：先拍下來", "二問：用自然的話問一句", "三記下：留下有用的一句"],
  };
  return { from, chapterId, ...hit };
}

/** 章節練習預填光點（跨頁帶到 /smart/spark） */
export const CHAPTER_SPARK_SEED_KEY = "nuannuan_spark_seed";

export interface ChapterSparkSeed {
  source: SparkSource;
  action_text: string;
  feeling_text: string;
  chapterId: string;
  chapterTitle: string;
}

export function saveChapterSparkSeed(seed: ChapterSparkSeed): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(CHAPTER_SPARK_SEED_KEY, JSON.stringify(seed));
}

export function consumeChapterSparkSeed(expectedSource?: SparkSource): ChapterSparkSeed | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CHAPTER_SPARK_SEED_KEY);
    if (!raw) return null;
    const seed = JSON.parse(raw) as ChapterSparkSeed;
    if (expectedSource && seed.source !== expectedSource) return null;
    sessionStorage.removeItem(CHAPTER_SPARK_SEED_KEY);
    return seed;
  } catch {
    return null;
  }
}

/** @deprecated 請改用 chapterPickKey(id) */
export const PICKED_ENTRY_KEY = chapterPickKey("0100");

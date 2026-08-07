import type { ChapterOpening } from "./chapter-opening";

const CH10_ACCENT = "linear-gradient(180deg, #E8F1F6 0%, #FFF8EE 55%)";
const CH10_DISCLAIMER =
  "交通、票價、開放時間、天候與入境規則會變動；重要資訊請在出發前回到最新官方來源重查。不輸入護照、票券碼、付款資料、完整地址或不必要的健康細節。";

export const CHAPTER_1000: ChapterOpening = {
  id: "1000",
  qrCode: "1000",
  title: "旅遊研學｜把一次出發策展成有意義的旅程",
  subtitle: "第十章｜章節開篇",
  layout: "travel-start",
  headerEmoji: "🧭",
  accentGradient: CH10_ACCENT,
  quote: "先決定為何值得，再安排去哪裡；先守住旅程主線，再為驚艷留下空間。",
  atAGlance:
    "本章路線：從排行程到旅遊研學策展。十個小步把意義、基線、來源、同行價值、取捨、七段節奏、備援與地方閱讀線收進《55+ 旅遊研學策展書》。" +
    CH10_DISCLAIMER,
  tryPrompt:
    "先留下此行真正值得的理由：想理解／完成／共同經歷的事、不能犧牲的價值，以及希望帶回的成果。",
  reflectPrompt: "我是在蒐集景點，還是在策展一段值得記住與分享的生活？",
  reflectPlaceholder: "例如：我比較像在塞滿景點，而不是守住想陪家人好好吃飯的主線…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "暖暖會從「為何出發」開始，一次只問一題；只整理意義、界線與成果期待，不替您決定去哪裡。" +
    CH10_DISCLAIMER,
  practiceWhere: "mixed",
  capabilityNote:
    "問題卡與路線可在本頁完成；提問可進暖暖。暖暖不替您決定去哪裡，也不輸入護照、票券或付款資料。",
  printCardTitle: "我的旅遊研學理由卡",
  printCardDescription: "可列印：為何值得、不能犧牲的價值，以及希望帶回的成果。",
  printButtonLabel: "列印理由卡",
  guideTitle: "章首導讀｜旅遊研學",
  guideDuration: "約 2 分鐘",
  guideParagraphs: [
    "行程看起來豐富，真正想完成的事反而逐漸模糊。旅行也可以是重新讀懂一條河、一座城，以及自己下一個黃金十年的生活半徑。",
    "先由自己界定為何出發、什麼不能犧牲，以及誰擁有最後決定；AI 協助搜尋、比較、模擬與整理。",
    "動態資訊仍在出發前回到最新官方頁面確認。策展書不是塞滿景點的行程表，而是遇到變化仍能走得更穩的知識型旅程。",
  ],
  guideFooterNote: "語音導讀之後再補；請先留下此行真正值得的理由，再選路線。",
  footerGuideLabel: "閱讀 2 分鐘章首導讀",
  entries: [
    {
      id: "meaning",
      label: "意義種子",
      hint: "先決定為何值得",
      emoji: "🌱",
      href: "/smart/chapter/1001",
    },
    {
      id: "baseline",
      label: "現況基線",
      hint: "固定、可調與未知",
      emoji: "📋",
      href: "/smart/chapter/1002",
    },
    {
      id: "rhythm",
      label: "七段節奏",
      hint: "留白與備援",
      emoji: "⏱",
      href: "/smart/chapter/1006",
    },
    {
      id: "portfolio",
      label: "策展書",
      hint: "可修改、可共編",
      emoji: "📔",
      href: "/smart/chapter/1010",
    },
  ],
  travelStartDemos: [
    {
      id: "river",
      label: "案例｜三天兩夜",
      whyGo: "陪家人重新讀懂一條河，並留一頓好好說話的飯",
      mustKeep: "不要太趕；每天只留一個真正高潮",
      bringBack: "一頁可分享的地方閱讀短記與共同回憶",
      reflectNote: "我比較像在蒐集景點；真正想策展的是同行與理解。",
    },
  ],
};

export const CHAPTER_1001: ChapterOpening = {
  id: "1001",
  qrCode: "1001",
  title: "從排行程到生活策展",
  subtitle: "第十章",
  layout: "travel-meaning",
  headerEmoji: "🌱",
  accentGradient: CH10_ACCENT,
  quote: "先決定這段時間為何值得，再決定去哪裡。",
  atAGlance:
    "先收束三個問題：為何出發、希望帶回什麼、什麼不能犧牲。把答案收成一則意義種子句；少去一個熱門景點後仍要成立。" +
    CH10_DISCLAIMER,
  tryPrompt: "完成一則意義種子句：真正想完成、共同經歷或重新理解，以及希望帶回的成果。",
  reflectPrompt: "少去一個熱門景點後，這句意義是否仍然成立？",
  reflectPlaceholder: "例如：少去一個名店後，陪家人好好吃飯仍然成立…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "暖暖可依序詢問「意義、期待、不能犧牲、希望留下的成果」，只整理您的語句，不替您選擇主題。" +
    CH10_DISCLAIMER,
  practiceWhere: "mixed",
  capabilityNote: "意義種子句可在本頁完成。暖暖不替您選擇主題或決定去哪裡。",
  printCardTitle: "我的意義種子句",
  printCardDescription: "可列印：想完成、共同經歷與帶回的成果。",
  printButtonLabel: "列印種子句",
  guideTitle: "意義打開生活半徑",
  guideDuration: "心法",
  guideParagraphs: [
    "行程愈完整，卻可能愈難回答：這趟出發，真正想帶回來的是什麼？",
    "55+ 不是縮小生活半徑，而是更知道時間值得留給什麼。",
    "意義先清楚，景點才有角色，備案也不再像失敗。",
  ],
  guideFooterNote: "請先完成一則意義種子句。",
  footerGuideLabel: "閱讀生活策展說明",
  samplePrompt:
    "請一次只問一題，幫我寫出旅遊研學的意義種子句。請依序問：這次真正想完成什麼？希望共同經歷或重新理解什麼？希望帶回哪一項可留下成果？什麼不能犧牲？請不要替我決定去哪裡，也不要推薦必須去的景點。",
  travelMeaningDemos: [
    {
      id: "seed",
      label: "案例｜意義種子",
      wantDone: "陪家人完成一趟不趕的河邊漫遊",
      shareLive: "重新理解這條河與今日生活的關係",
      bringBack: "一頁地方閱讀短記，可回家後再改",
      reflectNote: "少去一個熱門景點後，這句意義仍然成立。",
    },
  ],
};

export const CHAPTER_1002: ChapterOpening = {
  id: "1002",
  qrCode: "1002",
  title: "先寫下現況基線",
  subtitle: "第十章",
  layout: "ground-baseline",
  headerEmoji: "📋",
  accentGradient: CH10_ACCENT,
  quote: "先把真實條件說清楚，人工智慧的建議才有可用的地面。",
  atAGlance:
    "把條件分成固定、可調與未知。後續每項建議都必須回到這張現況基線卡接受檢驗。" +
    CH10_DISCLAIMER,
  tryPrompt: "完成現況基線三欄卡：固定、可調與未知。",
  reflectPrompt: "哪些條件是本人說出的，哪些只是我或人工智慧的推測？",
  reflectPlaceholder: "例如：日期是固定；體力推測不應寫進固定欄…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "暖暖可逐項整理「固定／可調／未知」，不補造答案，也不要求輸入證件、付款或完整健康資料。" +
    CH10_DISCLAIMER,
  practiceWhere: "mixed",
  capabilityNote:
    "基線卡可在本頁完成。不輸入護照、票券碼、付款資料、完整地址或不必要健康細節；不能因年齡推測體力。",
  printCardTitle: "我的現況基線卡",
  printCardDescription: "可列印：固定、可調與未知三欄。",
  printButtonLabel: "列印基線卡",
  guideTitle: "現況基線三欄",
  guideDuration: "整理",
  guideParagraphs: [
    "畫面愈完整，愈容易忽略真正影響執行的生活條件。",
    "固定是不能移動的任務、日期或價值；可調是地點與順序；未知需查證。",
    "條件變動就更新卡片，而不是勉強追上失效行程。",
  ],
  guideFooterNote: "請先完成三欄基線卡。",
  footerGuideLabel: "閱讀現況基線說明",
  groundBaselineDemos: [
    {
      id: "baseline",
      label: "案例｜三欄基線",
      fixed: "週五晚出發、週日晚回家；每天不超過一個真正高潮",
      flexible: "午餐地點、午後順序、是否進館",
      unknown: "週六午後天候、一處場館是否臨時休館、同行者回覆",
      reflectNote: "固定是我們說出的；天候不應被猜成確定答案。",
    },
  ],
};

export const CHAPTER_1003: ChapterOpening = {
  id: "1003",
  qrCode: "1003",
  title: "建立可回查的來源地圖",
  subtitle: "第十章",
  layout: "source-map",
  headerEmoji: "🗺",
  accentGradient: CH10_ACCENT,
  quote: "可信不等於永遠有效；來源與重查日期同樣重要。",
  atAGlance:
    "建立官方、文化與經驗三張來源卡：留下日期、適用範圍、限制與重查點。衝突只並列，不猜誰正確。" +
    CH10_DISCLAIMER,
  tryPrompt: "建立三張來源卡：官方、文化、經驗，並標明重查點。",
  reflectPrompt: "我能否在一分鐘內回到每個重要說法的原始來源？",
  reflectPlaceholder: "例如：交通說法可回到官方頁；貼文不能取代開放時間…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "暖暖可整理來源名稱、日期、適用範圍與重查點；來源衝突只並列，不替您判定真偽或時效。" +
    CH10_DISCLAIMER,
  practiceWhere: "mixed",
  capabilityNote:
    "來源卡可在本頁完成；Google Notebook 請在手機或電腦使用。動態資訊出發前必須重查最新官方頁面。",
  printCardTitle: "我的來源地圖卡",
  printCardDescription: "可列印：官方、文化與經驗三張來源卡。",
  printButtonLabel: "列印來源卡",
  guideTitle: "官方、文化與經驗",
  guideDuration: "查證",
  guideParagraphs: [
    "來源地圖不追求更多連結，而是分清用途。",
    "官方回答現在能不能做；文化資料回答為何值得理解；經驗補充感受。",
    "重要資訊仍要回到原頁核對。",
  ],
  guideFooterNote: "請先建立三張來源卡。",
  footerGuideLabel: "閱讀來源地圖說明",
  sourceMapDemos: [
    {
      id: "map",
      label: "案例｜三來源",
      official: "交通局／場館官方頁｜查證日：出發前一週｜重查：出發當日清晨",
      culture: "地方館舍簡介與可信地方史摘要｜附原頁與適用範圍",
      experience: "朋友步行經驗｜標明不能取代官方開放時間",
      reflectNote: "每個重要說法都能在一分鐘內回到原頁。",
    },
  ],
};

export const CHAPTER_1004: ChapterOpening = {
  id: "1004",
  qrCode: "1004",
  title: "讓感受與價值進入策展桌",
  subtitle: "第十章",
  layout: "feeling-table",
  headerEmoji: "🪑",
  accentGradient: CH10_ACCENT,
  quote: "最好的路線不只走得通，也要讓同行者願意一起走。",
  atAGlance:
    "完成感受與價值四句：最期待、最擔心、最值得保留的體驗，以及希望保留的留白或私人界線。" +
    CH10_DISCLAIMER,
  tryPrompt: "完成感受與價值四句對話；每個人可分開回答。",
  reflectPrompt: "我是否真正聽見同行者，而不是替對方解釋？",
  reflectPlaceholder: "例如：我聽見對方怕趕車，而不是替他說「其實沒關係」…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "暖暖可用「已知／未知＋期待／擔心」依序提問，只整理每位同行者的回答，不替任何人下結論。" +
    CH10_DISCLAIMER,
  practiceWhere: "mixed",
  capabilityNote: "四句對話可在本頁完成。暖暖不把沉默當成同意，也不公開私人回答。",
  printCardTitle: "我的感受與價值卡",
  printCardDescription: "可列印：期待、擔心、共同價值與留白。",
  printButtonLabel: "列印策展桌卡",
  guideTitle: "感受與價值策展桌",
  guideDuration: "同行",
  guideParagraphs: [
    "若只看距離與評分，很容易排出合理卻不屬於這群人的行程。",
    "感受不是軟弱，也不是直接否決，它是策展條件的一部分。",
    "保留一定想經歷的時刻、希望避免的壓力，與一段留白。",
  ],
  guideFooterNote: "請先完成四句對話。",
  footerGuideLabel: "閱讀策展桌說明",
  feelingTableDemos: [
    {
      id: "table",
      label: "案例｜四句",
      expect: "河邊慢走與一頓好好說話的飯",
      worry: "轉乘太趕、午後沒有休息",
      keepValue: "每天一個真正高潮，其餘可取消",
      blankBound: "不想公開行程細節與照片",
      reflectNote: "我聽見同行者的擔心，而不是替對方解釋。",
    },
  ],
};

export const CHAPTER_1005: ChapterOpening = {
  id: "1005",
  qrCode: "1005",
  title: "看清價值、代價與風險",
  subtitle: "第十章",
  layout: "value-cost",
  headerEmoji: "⚖",
  accentGradient: CH10_ACCENT,
  quote: "每加入一個安排，都要知道它會拿走哪一段時間與餘裕。",
  atAGlance:
    "比較三項候選：支持哪個核心價值、最大代價與依賴、取消後主線如何繼續。只保留能支持意義且有停止條件的安排。" +
    CH10_DISCLAIMER,
  tryPrompt: "比較三項候選安排：價值、代價／停止條件、取消後如何繼續。",
  reflectPrompt: "我是在保護旅程主線，還是在保護一張塞滿的清單？",
  reflectPlaceholder: "例如：刪掉一個熱門餐廳後，主線仍成立…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "暖暖可把三項安排放在同一把尺上比較價值、代價與替代；最後保留或刪除仍由您決定。" +
    CH10_DISCLAIMER,
  practiceWhere: "mixed",
  capabilityNote: "取捨卡可在本頁完成。暖暖不誇大風險，也不替您決定什麼值得。",
  printCardTitle: "我的價值與代價取捨卡",
  printCardDescription: "可列印：價值、代價與替代。",
  printButtonLabel: "列印取捨卡",
  guideTitle: "價值與代價天平",
  guideDuration: "取捨",
  guideParagraphs: [
    "問題不在景點好不好，而是它會拿走什麼。",
    "被刪除的安排不是失敗，而是替真正重要的體驗騰出空間。",
    "動態資訊仍需回到來源卡重查。",
  ],
  guideFooterNote: "請先比較三項候選。",
  footerGuideLabel: "閱讀取捨說明",
  valueCostDemos: [
    {
      id: "tradeoff",
      label: "案例｜三題取捨",
      value: "支持「好好吃飯與慢走」的核心意義",
      costStop: "兩次轉乘＋固定入場；若緩衝少於 30 分就停止",
      continueHow: "改為同主題河岸散步，主線仍成立",
      reflectNote: "我在保護主線，而不是保護塞滿的清單。",
    },
  ],
};

export const CHAPTER_1006: ChapterOpening = {
  id: "1006",
  qrCode: "1006",
  title: "設計七段有呼吸的研學節奏",
  subtitle: "第十章",
  layout: "seven-rhythm",
  headerEmoji: "⏱",
  accentGradient: CH10_ACCENT,
  quote: "留白不是沒有安排，而是把選擇權留在現場。",
  atAGlance:
    "把一天整理成七段：安頓、定位、閱讀、探索、補給、回看、收束。每天只保留一個真正高潮，並標出休息灣、緩衝與可取消段。" +
    CH10_DISCLAIMER,
  tryPrompt: "畫出一日或多日七段節奏：核心閱讀、自由探索、休息灣、緩衝與可取消段。",
  reflectPrompt: "這張節奏圖是否讓人走得更穩，也仍有臨場選擇？",
  reflectPlaceholder: "例如：午後可取消段讓我們有餘裕臨時停留…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "暖暖可依序整理七段節奏與可取消段，不依年齡推測體力，也不替您排滿所有空白。" +
    CH10_DISCLAIMER,
  practiceWhere: "mixed",
  capabilityNote: "節奏圖可在本頁完成。不能把 55+ 預設為衰弱或只能放慢。",
  printCardTitle: "我的七段研學節奏",
  printCardDescription: "可列印：七段功能、高潮、休息灣與可取消段。",
  printButtonLabel: "列印節奏圖",
  guideTitle: "七段研學節奏",
  guideDuration: "節奏",
  guideParagraphs: [
    "七段不是七個景點，而是七種節奏功能。",
    "轉乘、找路、喝水與一場好談話都需要時間。",
    "走得更穩，是讓理解、關係與驚艷真正發生。",
  ],
  guideFooterNote: "請先畫出七段節奏。",
  footerGuideLabel: "閱讀七段節奏說明",
  sevenRhythmDemos: [
    {
      id: "rhythm",
      label: "案例｜一日七段",
      rhythmNote: "安頓→河岸定位→館舍閱讀→自由探索→休息補給→共同回看→從容收束",
      peakRest: "真正高潮：午後河岸閱讀；休息灣：咖啡店坐 30 分",
      cancelable: "晚間加點可取消；若下雨改備援",
      reflectNote: "節奏讓人走得更穩，也仍有臨場選擇。",
    },
  ],
};

export const CHAPTER_1007: ChapterOpening = {
  id: "1007",
  qrCode: "1007",
  title: "建立真正的備援方案",
  subtitle: "第十章",
  layout: "travel-plan-b",
  headerEmoji: "🔀",
  accentGradient: CH10_ACCENT,
  quote: "好的備援方案保留旅程意義，不必保留原來每個景點。",
  atAGlance:
    "完成備援轉向卡：啟動條件與共同確認、轉向後仍保留的核心價值、需重查／取消／通知的項目。" +
    CH10_DISCLAIMER,
  tryPrompt: "完成一張備援方案轉向卡：觸發、保留價值與重查項目。",
  reflectPrompt: "轉向後，我們仍知道為何出發嗎？",
  reflectPlaceholder: "例如：換地點後仍是「讀懂這條河與好好吃飯」…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "暖暖可依序整理觸發條件、保留價值與轉向選項，只呈現選擇，不替您啟動或決定備援方案。" +
    CH10_DISCLAIMER,
  practiceWhere: "mixed",
  capabilityNote: "備援卡可在本頁完成。暖暖不替您啟動備援，也不補造官方資訊。",
  printCardTitle: "我的備援方案轉向卡",
  printCardDescription: "可列印：觸發、保留價值與重查項目。",
  printButtonLabel: "列印備援卡",
  guideTitle: "三條優雅轉向",
  guideDuration: "備援",
  guideParagraphs: [
    "備案不是另一張塞滿清單，而是守住意義的第二條好路。",
    "可換地點、換形式或縮短範圍。",
    "來源卡重查點與取捨卡停止條件要一起帶入。",
  ],
  guideFooterNote: "請先完成轉向卡。",
  footerGuideLabel: "閱讀備援方案說明",
  travelPlanBDemos: [
    {
      id: "planb",
      label: "案例｜轉向卡",
      trigger: "場館臨時休館或午後大雨；任一人可提出，兩人確認後轉向",
      keepValue: "仍保留河岸理解與一頓好好說話的飯",
      recheck: "重查天候與替代場館開放；取消原預約並通知同行",
      reflectNote: "轉向後，我們仍知道為何出發。",
    },
  ],
};

export const CHAPTER_1008: ChapterOpening = {
  id: "1008",
  qrCode: "1008",
  title: "建立地方閱讀線",
  subtitle: "第十章",
  layout: "place-reading",
  headerEmoji: "📖",
  accentGradient: CH10_ACCENT,
  quote: "真正的旅遊研學，不只抵達一個地方，也讀懂它如何成為今天的樣子。",
  atAGlance:
    "完成三至五站地方閱讀線：每站一個核心問題、可信來源、現場觀察與回看問題。衝突並列，重要句子回原頁。" +
    CH10_DISCLAIMER,
  tryPrompt: "完成三至五站地方閱讀線：問題、來源、現場觀察與回看。",
  reflectPrompt: "這條閱讀線是在增加知識，還是幫我重新理解地方與自己的關係？",
  reflectPlaceholder: "例如：它幫我看見河流與今日生活的關係，而不只是知識點…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "暖暖可把核准來源整理成三至五站閱讀線，保留引用與衝突，不替地方歷史下唯一結論。" +
    CH10_DISCLAIMER,
  practiceWhere: "mixed",
  capabilityNote:
    "閱讀線可在本頁完成；Google Notebook 請在手機或電腦使用。不把搜尋摘要冒充原文。",
  printCardTitle: "我的地方閱讀線",
  printCardDescription: "可列印：問題、各站來源、觀察與回看。",
  printButtonLabel: "列印閱讀線",
  guideTitle: "河流文明閱讀線",
  guideDuration: "閱讀",
  guideParagraphs: [
    "看過景點介紹，不等於讀懂地方。",
    "遇到來源衝突，並列差異與適用範圍。",
    "不是增加更多知識點，而是讓抵達變成理解。",
  ],
  guideFooterNote: "請先寫一個真正想理解的地方問題。",
  footerGuideLabel: "閱讀地方閱讀線說明",
  placeReadingDemos: [
    {
      id: "line",
      label: "案例｜三站",
      placeQ: "這條河如何成為今天人們散步與生活的地方？",
      stations: "記憶碑→舊碼頭→河岸修復段；每站一來源與一觀察",
      lookBack: "現場與來源是否互相補足？何處仍待確認？",
      reflectNote: "閱讀線幫我重新理解地方與自己的關係。",
    },
  ],
};

export const CHAPTER_1009: ChapterOpening = {
  id: "1009",
  qrCode: "1009",
  title: "把第二支筆交給同行者",
  subtitle: "第十章",
  layout: "coauthor-pen",
  headerEmoji: "✍️",
  accentGradient: CH10_ACCENT,
  quote: "分享企劃的目的，不是展示用心，而是把第二支筆真正留給同行者。",
  atAGlance:
    "完成同行者共編摘要：最期待、想修改、保持私人；保留確認／待決定／不參與／保持私人／撤回五種狀態。" +
    CH10_DISCLAIMER,
  tryPrompt: "完成同行者共編摘要，並逐項確認照片、聲音、姓名、路線與故事的分享。",
  reflectPrompt: "企劃是否真的容許對方說不、分流或稍後再決定？",
  reflectPlaceholder: "例如：對方可以只參加半天，或撤回照片分享…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "暖暖可分別整理同行者的期待、擔心與分享界線；沉默不視為同意，任何人都可修改或撤回。" +
    CH10_DISCLAIMER,
  practiceWhere: "mixed",
  capabilityNote: "共編摘要可在本頁完成。沉默、已讀或家人關係不得視為同意。",
  printCardTitle: "我的同行者共編摘要",
  printCardDescription: "可列印：期待、修改、私人界線與五種狀態。",
  printButtonLabel: "列印共編摘要",
  guideTitle: "同行者共同執筆",
  guideDuration: "共編",
  guideParagraphs: [
    "用心安排不等於對方已經同意。",
    "同意分享某一項，不等於同意全部公開。",
    "只分享一頁草案，第二支筆仍在同行者手中。",
  ],
  guideFooterNote: "請先完成共編摘要。",
  footerGuideLabel: "閱讀共編說明",
  coauthorPenDemos: [
    {
      id: "coauthor",
      label: "案例｜共編",
      expectEdit: "最期待河邊慢走；想修改午後節奏，改為更多留白",
      privateBound: "照片與完整路線保持私人；故事可口述不公開",
      statusNote: "狀態：確認主線／午後待決定／夜間不參與",
      reflectNote: "企劃容許對方說不、分流或稍後再決定。",
    },
  ],
};

export const CHAPTER_1010: ChapterOpening = {
  id: "1010",
  qrCode: "1010",
  title: "完成《55+ 旅遊研學策展書》",
  subtitle: "第十章",
  layout: "travel-portfolio",
  headerEmoji: "📔",
  accentGradient: CH10_ACCENT,
  quote: "真正可執行，不是全部確定，而是意義清楚、來源可查、遇到變化仍有下一步。",
  atAGlance:
    "整合意義、現況基線、來源、七段節奏與備援方案；標示已確認、待確認、來源衝突與重查日期。由您與同行者確認、修改、決定分享並親自署名。" +
    CH10_DISCLAIMER,
  tryPrompt: "整理策展書草案後親自署名：意義、基線、來源、節奏、備援與分享界線。",
  reflectPrompt: "這份成果是否仍屬於我與同行者，而不是屬於工具？",
  reflectPlaceholder: "例如：最後重查日期與署名是我親自寫下的…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "暖暖可把本章回答整理成可編輯策展書草案；不補造資料，最後版本與分享範圍仍由您和同行者確認。" +
    CH10_DISCLAIMER,
  practiceWhere: "mixed",
  capabilityNote:
    "策展書草案可在本頁完成並點成光點。動態資料出發前須重查；不輸入護照、票券碼或付款資料。",
  printCardTitle: "我的 55+ 旅遊研學策展書",
  printCardDescription: "可列印：意義、基線、來源、節奏、備援與重查日期。",
  printButtonLabel: "列印策展書",
  guideTitle: "一頁策展書",
  guideDuration: "章末",
  guideParagraphs: [
    "真正的躍升，是收束成可執行、可共編，也能持續更新的策展書。",
    "每個未知都有下一步，每位同行者保有修改與撤回權，就可以啟用。",
    "策展書屬於自己與同行者，不屬於工具。",
  ],
  guideFooterNote: "請整理草案後，親自核對並署名。",
  footerGuideLabel: "閱讀策展書說明",
  travelPortfolioDemos: [
    {
      id: "portfolio",
      label: "案例｜策展書",
      meaningBase: "意義：讀懂一條河並好好吃飯；基線：週末兩天、每天一個高潮",
      sourceRhythm: "來源三卡已建；七段節奏含休息灣與可取消段",
      planBShare: "備援：雨天改河岸散步；分享界線：照片需另行同意",
      reflectNote: "這份成果屬於我與同行者，並由我親自署名。",
    },
  ],
  appDeepLink: {
    href: "/smart/radar",
    label: "打開圓夢藍圖，留下旅遊研學光點 →",
  },
};

export const CHAPTER_10_OPENINGS: Record<string, ChapterOpening> = {
  "1000": CHAPTER_1000,
  "1001": CHAPTER_1001,
  "1002": CHAPTER_1002,
  "1003": CHAPTER_1003,
  "1004": CHAPTER_1004,
  "1005": CHAPTER_1005,
  "1006": CHAPTER_1006,
  "1007": CHAPTER_1007,
  "1008": CHAPTER_1008,
  "1009": CHAPTER_1009,
  "1010": CHAPTER_1010,
};

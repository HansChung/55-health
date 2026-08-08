import type { ChapterOpening } from "./chapter-opening";

const CH6_ACCENT = "linear-gradient(180deg, #E8F4F0 0%, #FFF8EE 55%)";

export const CHAPTER_0600: ChapterOpening = {
  id: "0600",
  qrCode: "0600",
  title: "運動健身｜動能維修的數據真相",
  subtitle: "第六章｜章節開篇",
  layout: "routes",
  headerEmoji: "🏃",
  accentGradient: CH6_ACCENT,
  quote: "身體穩了，生活半徑也會慢慢打開。",
  atAGlance:
    "從數據導航、Mode A、Mode B 到身體會議，點亮自主、信賴與韌性。AI 是冷靜的數據翻譯者，不是醫師、監工，也不替您打分數。",
  tryPrompt:
    "本章路線：數據導航｜一拍聽懂訊號｜一問產生週報｜週日身體會議。圈出今天想先走的一小步。",
  reflectPrompt: "哪一條路線，最接近我現在照顧身體的方式？",
  reflectPlaceholder: "例如：我想先從「一拍聽懂訊號」開始，因為數字常常看一眼就過去了…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "可先讀章首導讀並選路線。準備一張近期的運動或步數畫面——先看見，不急著評分。",
  practiceWhere: "mixed",
  capabilityNote:
    "路線與練習卡可在本頁完成；拍照／提問可進暖暖。暖暖不是健身教練或醫療診斷工具。",
  printCardTitle: "動能導航路線卡",
  printCardDescription: "可列印：今天想先走的路線與回望。",
  printButtonLabel: "列印路線卡",
  guideTitle: "章首導讀｜動能維修",
  guideDuration: "約 2 分鐘",
  guideParagraphs: [
    "走過 Chapter 5，我們學會：面對陌生訊息，不急著相信；面對風險，先停一下，先驗證，再行動。現在，這份能力要回到更靠近自己的地方：身體。",
    "55+ 之後，運動常常變得有點矛盾。一方面知道身體需要活動，另一方面又擔心膝蓋、心臟、血壓、疲勞，或不知道什麼強度才剛剛好。",
    "運動不是懲罰身體，也不是拿來和別人比較的成績單。運動，是精準保養。身體透過步數、心率、睡眠、疲勞感與活動時間提醒我們節奏。",
    "少一點硬撐。多一點看見。讓身體動能，穩定續航。",
  ],
  guideFooterNote: "章首導讀請先閱讀以上文字，再選一條練習路線。",
  footerGuideLabel: "閱讀 2 分鐘章首導讀",
  entries: [
    {
      id: "nav",
      label: "數據導航",
      hint: "不靠感覺硬撐",
      emoji: "🧭",
      href: "/smart/chapter/0601",
    },
    {
      id: "mode-a",
      label: "Mode A",
      hint: "一拍聽懂訊號",
      emoji: "📸",
      href: "/smart/chapter/0603",
    },
    {
      id: "mode-b",
      label: "Mode B",
      hint: "一問產生週報",
      emoji: "🗒",
      href: "/smart/chapter/0606",
    },
    {
      id: "meeting",
      label: "身體會議",
      hint: "點亮動能三角",
      emoji: "🍵",
      href: "/smart/chapter/0609",
    },
  ],
};

export const CHAPTER_0601: ChapterOpening = {
  id: "0601",
  qrCode: "0601",
  title: "運動不是拚命，是精準保養",
  subtitle: "第六章｜第一節",
  layout: "mindset-shift",
  headerEmoji: "🌱",
  accentGradient: CH6_ACCENT,
  quote: "真正的運動不是硬撐，而是用更聰明的方式，讓身體穩定續航。",
  atAGlance:
    "運動從硬撐、流汗、比較，轉向穩定、理解與長期保養。數據不是壓力分數，只是身體留下的小提醒。",
  tryPrompt:
    "寫下我的運動轉念：我不想再只用「＿＿＿＿」判斷運動有沒有效；我想改成「＿＿＿＿」。",
  reflectPrompt: "我知道運動不是一定要很累才有效嗎？",
  reflectPlaceholder: "例如：我知道數據是提醒，不是人生分數…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "本頁完成運動轉念卡即可。Chapter 打卡點｜動能光點 1：我開始用自己的節奏，照顧身體動能。",
  practiceWhere: "paper",
  capabilityNote: "轉念卡在本頁／紙本完成。暖暖不是健身教練，也不替您評分。",
  printCardTitle: "我的運動轉念卡",
  printCardDescription: "可列印：把一句運動壓力，改寫成一句身體保養提醒。",
  printButtonLabel: "列印轉念卡",
  guideTitle: "精準保養",
  guideDuration: "心法",
  guideParagraphs: [
    "年輕時，我們常以為運動就是要流很多汗、很喘、很痠，才算有效。",
    "到了人生下半場，身體需要的不是硬撐，而是更成熟的理解。",
    "這一站先不急著學工具，只先留下一個轉念：我不再用硬撐證明自己。",
  ],
  guideFooterNote: "請先完成「壓力句 → 保養句」改寫。",
  footerGuideLabel: "閱讀精準保養說明",
  mindsetShiftDemos: [
    {
      id: "sweat",
      label: "案例｜流汗才算數",
      pressurePhrase: "一定要流很多汗、很喘，才算有運動",
      carePhrase: "身體是否更穩、更舒服、更能持續",
      reflectNote: "我知道運動不是一定要很累才有效。",
    },
  ],
};

export const CHAPTER_0602: ChapterOpening = {
  id: "0602",
  qrCode: "0602",
  title: "感覺會騙人，數據會提醒",
  subtitle: "第六章｜第一節",
  layout: "dual-signal",
  headerEmoji: "⚖",
  accentGradient: CH6_ACCENT,
  quote: "感覺很重要，但數據能提醒我們，看見感覺沒說完的地方。",
  atAGlance:
    "感覺與數據不是互相否定，而是彼此補充。流汗、痠痛、喘或不喘，都真實，但不一定完整。",
  tryPrompt:
    "寫下我的雙軌判斷：我平常最常用「＿＿＿＿」判斷運動有沒有效；從今天開始，我願意多看一個訊號：「＿＿＿＿」。",
  reflectPrompt: "我願意多看一個身體訊號嗎？",
  reflectPlaceholder: "例如：我願意多看睡眠與運動後的疲勞感…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "本頁完成雙軌判斷卡。Chapter 打卡點｜信賴光點 1：我願意把感覺和數據一起看。",
  practiceWhere: "paper",
  capabilityNote:
    "雙軌判斷卡在本頁完成。AI 可協助整理訊號，不是醫師，不替您下診斷。",
  printCardTitle: "我的雙軌判斷卡",
  printCardDescription: "可列印：最常依賴的感覺，與願意多看的一個身體訊號。",
  printButtonLabel: "列印雙軌卡",
  guideTitle: "感覺與數據",
  guideDuration: "心法",
  guideParagraphs: [
    "有時候，流汗只是天氣熱；痠痛只是身體還不熟悉；不太喘，反而表示節奏剛剛好。",
    "到了 55+，我們可以練習：不要只靠一種感覺下判斷，而是把感覺和數據放在一起看。",
    "數據不是命令，也不是壓力。它只是一盞小燈。",
  ],
  guideFooterNote: "請先寫下最常依賴的感覺，並選一個願意多看的訊號。",
  footerGuideLabel: "閱讀雙軌對照說明",
  dualSignalDemos: [
    {
      id: "sweat-sleep",
      label: "案例｜流汗 × 睡眠",
      feelingSignal: "今天有沒有流很多汗",
      dataSignal: "昨晚睡眠與運動後的疲勞感",
      reflectNote: "我知道感覺很重要，但不一定完整。",
    },
  ],
};

export const CHAPTER_0603: ChapterOpening = {
  id: "0603",
  qrCode: "0603",
  title: "一拍：捕捉 Ground Truth",
  subtitle: "第六章｜第二節 Mode A",
  layout: "ground-snap",
  headerEmoji: "📷",
  accentGradient: CH6_ACCENT,
  quote: "不用先懂所有數據，先把身體留下的訊號保存下來。",
  atAGlance:
    "一個簡單動作，就能把身體當下的訊號留下來。跑步機、血壓計、健康 App——先拍下來，訊號才不會悄悄消失。",
  tryPrompt:
    "完成我的第一拍：今天我拍下的是＿＿＿＿。我想提醒自己：這只是提醒，不是分數。",
  reflectPrompt: "我知道這張照片不需要公開嗎？",
  reflectPlaceholder: "例如：這張照片只是留給自己看的身體訊號…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "可在暖暖開相機拍下螢幕，或用手機截圖。操作小卡｜我的第一筆 Ground Truth：記下來源與一句低敏感提醒。",
  practiceWhere: "mixed",
  capabilityNote:
    "拍照可在暖暖或手機完成。請先遮蔽個資與過細健康細節；暖暖不自動同步穿戴裝置。",
  printCardTitle: "我的第一筆 Ground Truth",
  printCardDescription: "可列印：今天拍下的來源，與一句低敏感提醒。",
  printButtonLabel: "列印 Ground Truth 卡",
  guideTitle: "先留下來",
  guideDuration: "約 30 秒文字版",
  guideParagraphs: [
    "過去，我們常常看一眼就讓數字過去。走下機器，數字消失；關掉畫面，提醒也消失。",
    "身體的改變，不是一天決定的。如果能先把訊號留下來，日後才有機會慢慢看懂。",
    "這張照片是給自己看的。不是拿來公開，不是拿來比較，也不是拿來打分數。",
  ],
  guideFooterNote: "請先完成第一拍；也可進暖暖拍照練習。",
  footerGuideLabel: "閱讀一拍說明",
  groundSnapDemos: [
    {
      id: "walk",
      label: "案例｜健走後螢幕",
      snapSource: "健走後的步數與時間",
      softReminder: "這只是提醒，不是分數",
      reflectNote: "我知道「拍下來」只是為了保留身體訊號。",
    },
  ],
};

export const CHAPTER_0604: ChapterOpening = {
  id: "0604",
  qrCode: "0604",
  title: "二問：聽懂身體的語言",
  subtitle: "第六章｜第二節 Mode A",
  layout: "curiosity-ask",
  headerEmoji: "💬",
  accentGradient: CH6_ACCENT,
  quote: "數字本身不是答案；被理解之後，才會成為方向。",
  atAGlance:
    "冷冰冰的數據，可以轉成自己聽得懂的身體提醒。AI 是冷靜的數據翻譯者，不是醫師，也不是監工。",
  tryPrompt:
    "問出我的第一個身體提醒：請用簡單語言幫我看懂這些數字，給我一個安全、溫和、可執行的下次微調建議。請不要做醫療診斷，也不要用分數評價我。",
  reflectPrompt: "我知道 AI 可以協助解讀，但不是醫師嗎？",
  reflectPlaceholder: "例如：AI 提醒我下次先維持同樣時間，不急著加強度…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "可複製安全提問句，把照片給 AI 翻譯成生活提醒。最後決定的人，仍然是您。",
  practiceWhere: "mixed",
  capabilityNote:
    "提問可在暖暖語音／相機完成；這不是醫療診斷或運動處方。牽涉不適請尋求專業建議。",
  printCardTitle: "我的第一個數據解讀卡",
  printCardDescription: "可列印：我問了什麼、AI 的一句提醒、自己的下一步。",
  printButtonLabel: "列印解讀卡",
  guideTitle: "從數字到提醒",
  guideDuration: "二問",
  guideParagraphs: [
    "數字看見了，卻不一定看懂。這時候，AI 可以幫上一點忙。",
    "請它用簡單語言看懂數字，給一個安全、溫和的下次微調建議；不要做醫療診斷，不要用分數評價。",
    "看見、提問、理解、決定——這就是重新聽懂身體的開始。",
  ],
  guideFooterNote: "請保存「不診斷、不評分、只給溫和提醒」的提問句。",
  footerGuideLabel: "閱讀二問說明",
  samplePrompt:
    "請用簡單語言幫我看懂這些數字，給我一個安全、溫和、可執行的下次微調建議。請不要做醫療診斷，也不要用分數評價我。",
  curiosityDemos: [
    {
      id: "walk-read",
      label: "案例｜健走 30 分鐘",
      question:
        "請用簡單語言幫我看懂這些數字，給我一個安全、溫和、可執行的下次微調建議。請不要做醫療診斷，也不要用分數評價我。",
      aiAnswer: "今天比較像穩定快走；下次可先維持同樣時間，不急著加強度。",
      insight: "AI 給我的一個提醒是：先維持同樣時間。",
    },
  ],
};

export const CHAPTER_0605: ChapterOpening = {
  id: "0605",
  qrCode: "0605",
  title: "從單點解讀到長期追蹤",
  subtitle: "第六章｜第二節 Mode A",
  layout: "week-rhythm",
  headerEmoji: "📅",
  accentGradient: CH6_ACCENT,
  quote: "一次數據是提醒，一段趨勢才會慢慢形成方向。",
  atAGlance:
    "單日數字不用急著下結論，放進一週才看得出節奏。不需要每天填表，週末留下幾句話就夠。",
  tryPrompt:
    "寫下我的一週身體提醒：這週身體提醒我＿＿＿＿；比較穩的時候是＿＿＿＿；下週只想微調＿＿＿＿。",
  reflectPrompt: "我願意用一句話記錄身體提醒嗎？",
  reflectPlaceholder: "例如：一天的數字，不代表全部身體狀態…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "本頁完成一週身體提醒卡。私人週記請留給自己，不公開、不比較。",
  practiceWhere: "paper",
  capabilityNote:
    "一週節奏卡在本頁完成。暖暖沒有自動穿戴同步或完整運動週報引擎。",
  printCardTitle: "我的一週身體提醒卡",
  printCardDescription: "可列印：一個身體提醒、一個穩定時刻、一個小微調。",
  printButtonLabel: "列印一週提醒卡",
  guideTitle: "從一張照片到一週節奏",
  guideDuration: "回顧",
  guideParagraphs: [
    "今天走得比較少，不一定代表退步；今天覺得比較累，也不一定代表不夠努力。",
    "一張照片是一個瞬間；一句 AI 提醒是一次對話；一週的紀錄，才開始讓我們看見身體的節奏。",
    "一次數據是提醒。一段趨勢，才會慢慢形成方向。",
  ],
  guideFooterNote: "請完成三句一週身體提醒。",
  footerGuideLabel: "閱讀長期追蹤說明",
  weekRhythmLabels: [
    "這週，身體提醒我",
    "我覺得比較穩的時候是",
    "下週，我只想微調一件小事",
  ],
  weekRhythmPlaceholders: [
    "例如：天氣熱時要放慢…",
    "例如：週三早上散步之後…",
    "例如：睡前提早 15 分鐘上床…",
  ],
  weekRhythmDemos: [
    {
      id: "week",
      label: "案例｜一週三句",
      lines: [
        "熱天快走後比較喘，要記得放慢",
        "週三早晨散步後感覺清爽",
        "下週只把散步維持同樣時間",
      ],
      reflectNote: "一天的數字，不代表全部身體狀態。",
    },
  ],
};

export const CHAPTER_0606: ChapterOpening = {
  id: "0606",
  qrCode: "0606",
  title: "建立我的動能指南",
  subtitle: "第六章｜第三節 Mode B",
  layout: "kinetic-guide",
  headerEmoji: "📘",
  accentGradient: CH6_ACCENT,
  quote: "真正的智慧陪伴，不是每次重新解釋自己，而是先把自己的節奏寫進指南裡。",
  atAGlance:
    "動能指南是默契書，不是病歷。先把目標、節奏與邊界說清楚，AI 的回應才會更貼近自己。",
  tryPrompt:
    "寫下我的動能默契書：運動目標、希望 AI 提醒、希望避免、安全邊界。",
  reflectPrompt: "我知道動能指南不是病歷嗎？",
  reflectPlaceholder: "例如：我寫下自己的運動目標與提醒重點…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "把指南放在 Keep、Docs 或本頁草稿裡。下次不用重新說；不需寫入疾病、用藥、診斷或過多健康細節。",
  practiceWhere: "paper",
  capabilityNote:
    "動能指南在本頁／紙本完成並自行保存。這不是病歷、訓練菜單或健康分數表。",
  printCardTitle: "我的 55+ 動能指南",
  printCardDescription: "可列印：目標、語氣、安全邊界小指南。",
  printButtonLabel: "列印動能指南",
  guideTitle: "默契書",
  guideDuration: "建立",
  guideParagraphs: [
    "如果每一次都要重新告訴 AI「我不是要練比賽」「請不要用分數評價我」，久了也會累。",
    "這份指南讓 AI 知道：我的目標是穩定續航；建議要簡單、低壓力、可執行。",
    "先說清楚自己的節奏，工具才會成為陪伴。",
  ],
  guideFooterNote: "請完成目標、提醒、避免與安全邊界四欄。",
  footerGuideLabel: "閱讀動能指南說明",
  kineticGuideDemos: [
    {
      id: "steady",
      label: "案例｜穩定續航",
      goal: "穩定活動、舒服續航，不追求比賽強度",
      prefer: "簡單、溫和、可執行的下次微調",
      avoid: "命令式語氣、分數評價、與別人比較",
      boundary: "不診斷、不用藥細節；不適時停止並尋求專業建議",
      reflectNote: "動能指南不是病歷。",
    },
  ],
};

export const CHAPTER_0607: ChapterOpening = {
  id: "0607",
  qrCode: "0607",
  title: "一句話，喚醒 AI Coach",
  subtitle: "第六章｜第三節 Mode B",
  layout: "curiosity-ask",
  headerEmoji: "✨",
  accentGradient: CH6_ACCENT,
  quote: "好的 AI 陪伴，不是工具替您決定，而是它開始懂得配合您的節奏。",
  atAGlance:
    "清楚的啟動句，可以讓 AI 根據您的指南整理提醒。重點不是工具多厲害，而是您知道怎麼讓工具配合自己。",
  tryPrompt:
    "寫下我的 AI Coach 啟動句：請依照我的 55+ 動能指南，幫我整理＿＿＿＿，並給我一個安全、低壓力、可持續的下週微調建議。",
  reflectPrompt: "我知道 AI Coach 要依照我的動能指南回應嗎？",
  reflectPlaceholder: "例如：啟動句不需要很複雜…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "可複製啟動句重複使用。工具不順時，用照片、截圖或一週身體提醒，把 AI 拉回自己的節奏。",
  practiceWhere: "mixed",
  capabilityNote:
    "啟動句可在暖暖語音試用。暖暖沒有自動讀取穿戴資料的健身教練；需您貼上照片或一週提醒。",
  printCardTitle: "我的 AI Coach 啟動句",
  printCardDescription: "可列印：可重複使用的啟動句與 Plan B 提醒。",
  printButtonLabel: "列印啟動句卡",
  guideTitle: "一句話喚醒",
  guideDuration: "約 30 秒文字版",
  guideParagraphs: [
    "動能指南是您和 AI 之間的默契。現在，用一句話喚醒適合自己的 AI Coach。",
    "如果 AI 不能自動讀取資料，也沒關係。您可以貼上照片、截圖，或一週身體提醒。",
    "一句話，不是魔法。它是讓陪伴變簡單的開始。",
  ],
  guideFooterNote: "請保存一則可重複使用的啟動句。",
  footerGuideLabel: "閱讀啟動句說明",
  samplePrompt:
    "請依照我的 55+ 動能指南，幫我整理這週的身體提醒，並給我一個安全、低壓力、可持續的下週微調建議。如果無法讀取資料，請提醒我貼上照片、截圖或一週身體提醒。",
  curiosityDemos: [
    {
      id: "wake",
      label: "案例｜喚醒句",
      question:
        "請依照我的 55+ 動能指南，幫我整理這週的身體提醒，並給我一個安全、低壓力、可持續的下週微調建議。如果無法讀取資料，請提醒我貼上照片、截圖或一週身體提醒。",
      aiAnswer: "已依指南整理：本週節奏偏穩；下週只維持相同散步時間，不加強度。",
      insight: "啟動句讓 AI 配合我的節奏，而不是推著我走。",
    },
  ],
};

export const CHAPTER_0608: ChapterOpening = {
  id: "0608",
  qrCode: "0608",
  title: "產生我的動能週報",
  subtitle: "第六章｜第三節 Mode B",
  layout: "week-rhythm",
  headerEmoji: "📊",
  accentGradient: CH6_ACCENT,
  quote: "動能週報不是成績單，而是幫我們看見：身體這週如何陪我們走過來。",
  atAGlance:
    "零散身體訊號，可以整理成一份溫柔回顧：亮點、需要留意的提醒、下週一個安全低壓力的小微調。",
  tryPrompt:
    "產生我的動能週報：這週身體亮點＿＿＿＿；需要留意＿＿＿＿；下週只想微調＿＿＿＿。",
  reflectPrompt: "我願意看見這週的身體亮點嗎？",
  reflectPlaceholder: "例如：動能週報不是成績單…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "本頁完成一週動能週報卡。私人週記請留給自己，不公開、不比較。",
  practiceWhere: "paper",
  capabilityNote:
    "動能週報是手動溫柔回顧，不是自動成績單或健康評分系統。",
  printCardTitle: "我的一週動能週報",
  printCardDescription: "可列印：本週亮點、需要留意的提醒、下週一個微調。",
  printButtonLabel: "列印動能週報",
  guideTitle: "看見節奏",
  guideDuration: "回顧",
  guideParagraphs: [
    "55+ 的身體照顧，不適合每天被數字追著跑。真正有幫助的，是把一週放在一起看。",
    "您可以把照片、截圖、步數摘要或一週身體提醒交給 AI，請它整理成三段。",
    "看見節奏，比追求完美更重要。",
  ],
  guideFooterNote: "請完成亮點、提醒與小微調三段。",
  footerGuideLabel: "閱讀動能週報說明",
  weekRhythmLabels: [
    "這週我的身體亮點是",
    "這週需要留意的提醒是",
    "下週我只想微調一件小事",
  ],
  weekRhythmPlaceholders: [
    "例如：週三散步後感覺清爽…",
    "例如：熱天快走後比較喘…",
    "例如：只維持同樣時間，不加強度…",
  ],
  weekRhythmDemos: [
    {
      id: "report",
      label: "案例｜三段週報",
      lines: [
        "三次穩定散步，心情也比較開",
        "兩天睡不好後，隔天容易想硬撐",
        "下週只維持同樣散步時間",
      ],
      reflectNote: "動能週報不是成績單。",
    },
  ],
};

export const CHAPTER_0609: ChapterOpening = {
  id: "0609",
  qrCode: "0609",
  title: "週日早晨的身體會議",
  subtitle: "第六章｜第四節",
  layout: "week-rhythm",
  headerEmoji: "🍵",
  accentGradient: CH6_ACCENT,
  quote: "身體會議不是檢討自己，而是聽見身體後，做出下一週更溫和的決定。",
  atAGlance:
    "一個安靜的週末時刻，可以重新聽見身體。謝謝你這週陪我走過來——下週只調整一點點就好。",
  tryPrompt:
    "開一場我的身體會議：這週身體提醒我＿＿＿＿；我想感謝身體＿＿＿＿；下週只想微調＿＿＿＿。",
  reflectPrompt: "我願意聽見身體的疲累，而不是責備自己嗎？",
  reflectPlaceholder: "例如：身體會議不是檢討會…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "本頁完成週日身體會議卡。用感謝，而不是壓力，和身體重新合作。",
  practiceWhere: "paper",
  capabilityNote: "身體會議在本頁／紙本完成。真正決定下週節奏的人，仍然是您。",
  printCardTitle: "我的週日身體會議卡",
  printCardDescription: "可列印：本週身體提醒、感謝身體的一句話、下週一個微調。",
  printButtonLabel: "列印身體會議卡",
  guideTitle: "聽見身體",
  guideDuration: "會議",
  guideParagraphs: [
    "動能週報是一面溫柔的鏡子。接下來，不急著立刻改變——先開一場小小的身體會議。",
    "時間可以是週日早晨。泡一杯茶，坐下來，問自己幾個簡單問題。",
    "當您願意聽身體說話，運動就不再只是任務，而會慢慢變成一種成熟的照顧。",
  ],
  guideFooterNote: "請用感謝，而不是壓力，完成這場小會。",
  footerGuideLabel: "閱讀身體會議說明",
  weekRhythmLabels: [
    "這週，身體提醒我",
    "我想感謝身體的是",
    "下週，我只想微調一件小事",
  ],
  weekRhythmPlaceholders: [
    "例如：睡不好的隔天要放慢…",
    "例如：謝謝你陪我走完三天散步…",
    "例如：熱天改成陰涼時段出門…",
  ],
  weekRhythmDemos: [
    {
      id: "meeting",
      label: "案例｜感謝與微調",
      lines: [
        "兩天比較累時，我仍想硬撐",
        "謝謝身體仍願意陪我慢慢動",
        "下週熱天改短一點的散步",
      ],
      reflectNote: "身體會議不是檢討會。",
    },
  ],
};

export const CHAPTER_0610: ChapterOpening = {
  id: "0610",
  qrCode: "0610",
  title: "點亮動能黃金三角",
  subtitle: "第六章｜第四節",
  layout: "atr-light",
  headerEmoji: "🔺",
  accentGradient: CH6_ACCENT,
  quote: "真正的動能，不是一天拚到極限，而是能長久照顧自己、信任身體、穩定回來。",
  atAGlance:
    "從硬撐運動，走向更成熟的身體動能管理。A 自主、T 信賴、R 韌性——本章的動能黃金三角。",
  tryPrompt:
    "完成我的動能黃金三角：A｜自主光點、T｜信賴光點、R｜韌性光點。",
  reflectPrompt: "我知道感覺與數據可以一起看嗎？",
  reflectPlaceholder: "例如：我願意看數據，但不把數字當成分數…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "完成本頁點燈卡後，可到圓夢藍圖點亮相關光點。章節勳章｜動能守門員：我開始用更成熟的方式照顧身體動能。下一章，我們要帶著這份穩定，重新走進城市。",
  practiceWhere: "mixed",
  capabilityNote:
    "點燈卡在本頁完成；可持續累積請用暖暖圓夢藍圖（不排名、不公開）。AI 不是醫師、裁判或監工。",
  printCardTitle: "動能黃金三角點燈卡",
  printCardDescription: "可列印：A／T／R 三個光點與想帶進日常的一句話。",
  printButtonLabel: "列印點燈卡",
  guideTitle: "動能黃金三角",
  guideDuration: "章末",
  guideParagraphs: [
    "A｜自主：我知道身體節奏要由自己決定。",
    "T｜信賴：我願意看見數據，但不盲目服從數字。",
    "R｜韌性：我不靠一天硬撐，而是靠長期穩定回來。",
    "身體穩了，生活半徑也會慢慢打開。",
  ],
  guideFooterNote: "請完成 A／T／R 點燈卡。",
  footerGuideLabel: "閱讀點燈說明",
  atrLightDemos: [
    {
      id: "triangle",
      label: "案例｜三盞燈",
      autonomyAction: "節奏由我決定，不跟別人比流汗",
      trustAction: "願意看數據，但不把數字當成分數",
      resilienceAction: "不靠一天硬撐，用一週節奏穩定回來",
      reflectNote: "運動不是拚命，而是精準保養。",
    },
  ],
  appDeepLink: {
    href: "/smart/radar",
    label: "打開圓夢藍圖，點亮動能光點 →",
  },
};

export const CHAPTER_6_OPENINGS: Record<string, ChapterOpening> = {
  "0600": CHAPTER_0600,
  "0601": CHAPTER_0601,
  "0602": CHAPTER_0602,
  "0603": CHAPTER_0603,
  "0604": CHAPTER_0604,
  "0605": CHAPTER_0605,
  "0606": CHAPTER_0606,
  "0607": CHAPTER_0607,
  "0608": CHAPTER_0608,
  "0609": CHAPTER_0609,
  "0610": CHAPTER_0610,
};

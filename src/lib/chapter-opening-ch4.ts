import type { ChapterOpening } from "./chapter-opening";

const CH4_ACCENT = "linear-gradient(180deg, #F7EDE3 0%, #FFF8EE 55%)";

export const CHAPTER_0400: ChapterOpening = {
  id: "0400",
  qrCode: "0400",
  title: "飲食文化：日常的自主與韌性",
  subtitle: "第四章｜章節開篇",
  layout: "routes",
  headerEmoji: "🍽",
  accentGradient: CH4_ACCENT,
  quote: "吃得更自主，也知道偏離後如何回到平衡。",
  atAGlance:
    "把 SMART RADAR 帶到餐桌。本章不是飲食管制，也不把 AI 當成營養裁判；練習知道身體有底線，同時保有生活滋味。",
  tryPrompt: "圈出一個最想改善的餐桌場景：日常、外食、聚餐或市場採買。",
  reflectPrompt: "我最想拿回哪一種飲食選擇權？",
  reflectPlaceholder: "例如：我想先拿回「外食點菜時不必完全依賴別人」的選擇權…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "掃碼進入暖暖，可先讀章首導讀文字，再選一條餐桌自主路線。真正的養生不是苦行，而是有底線的自由。",
  practiceWhere: "mixed",
  capabilityNote:
    "路線選擇可在本頁完成；拍照／提問請用暖暖相機或語音。涉及疾病、過敏、用藥仍以醫療專業為準。",
  printCardTitle: "餐桌導航卡",
  printCardDescription: "可列印：圈選最想改善的餐桌場景與想拿回的選擇權。",
  printButtonLabel: "列印餐桌導航卡",
  guideTitle: "章首導讀｜飲食文化",
  guideDuration: "約 2 分鐘",
  guideParagraphs: [
    "進入第四章，我們把 SMART RADAR 從概念帶到每天最熟悉的地方：餐桌。",
    "AI 可以是茶友、二廚與整理助手；真正的養生不是苦行，而是有底線的自由。",
    "餐桌不是限制人生的地方，而是練習自主與韌性的地方。",
  ],
  guideFooterNote: "章首導讀請先閱讀以上文字，再選一條練習路線。",
  footerGuideLabel: "閱讀 2 分鐘章首導讀",
  entries: [
    { id: "daily", label: "日常", hint: "茶、咖啡、家常飯", emoji: "🍵", href: "/smart/chapter/0402" },
    { id: "eatout", label: "外食", hint: "標示、風味、點餐", emoji: "🍜", href: "/smart/chapter/0403" },
    { id: "gather", label: "聚餐", hint: "底線與 Plan B", emoji: "🎉", href: "/smart/chapter/0405" },
    { id: "market", label: "市場採買", hint: "Ground Truth", emoji: "🥬", href: "/smart/chapter/0404" },
  ],
};

export const CHAPTER_0401: ChapterOpening = {
  id: "0401",
  qrCode: "0401",
  title: "做自己餐桌的主人",
  subtitle: "第四章",
  layout: "boundary-choose",
  headerEmoji: "🕊",
  accentGradient: CH4_ACCENT,
  quote: "真正的養生不是苦行，而是有底線的自由。",
  atAGlance:
    "自主不是什麼都吃，也不是什麼都不吃，而是知道自己正在選什麼、為什麼選，以及享受後如何回來。",
  tryPrompt: "把一句「不能吃」改寫成「我可以有底線地選擇＿＿」。",
  reflectPrompt: "我的一項重要底線是什麼？",
  reflectPlaceholder: "例如：血糖不穩時，甜點我選擇小份並搭配散步…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "本頁完成私人餐桌自主句即可。也可進暖暖語音，把改寫後的句子說出來；或點成光點保存。",
  practiceWhere: "mixed",
  capabilityNote:
    "改寫練習在本頁完成。AI 不能替您判斷個人病況；有醫囑、過敏、用藥請以專業意見為準。",
  printCardTitle: "餐桌自主句卡",
  printCardDescription: "可列印：原本的「不能吃」、改寫後的自主句、我的底線。",
  printButtonLabel: "列印自主句卡",
  guideTitle: "餐桌自主心法",
  guideDuration: "一則心法",
  guideParagraphs: [
    "很多人談到健康飲食，先想到的是限制；當所有選擇只剩下不能，餐桌容易變得緊繃。",
    "紅字是提醒，不是命令；身體有底線，生活也可以有滋味。",
    "餐桌的主人不是規定，也不是 AI。",
  ],
  guideFooterNote: "請先完成本頁改寫；也可進暖暖一次一題練習。",
  footerGuideLabel: "閱讀餐桌自主說明",
  boundaryChooseDemos: [
    {
      id: "dessert",
      label: "案例｜甜點",
      cannotLine: "我不能吃甜的",
      canChooseLine: "我可以有底線地選擇一小塊，並決定吃完後散步十分鐘",
      reflectNote: "我的底線是：不空腹連吃兩份甜點。",
    },
  ],
};

export const CHAPTER_0402: ChapterOpening = {
  id: "0402",
  qrCode: "0402",
  title: "日常才是飲食修煉場",
  subtitle: "第四章",
  layout: "curiosity-ask",
  headerEmoji: "🌾",
  accentGradient: CH4_ACCENT,
  quote: "真正陪伴人生的飲食文化，藏在每天的一杯與一餐。",
  atAGlance:
    "飲食文化不只存在於名店與旅行。每天那杯茶、那碗飯、那趟市場與家常菜，才是最長久的修煉場。",
  tryPrompt: "選一樣每天常吃或常喝的東西，問一個與風土或做法有關的問題。",
  reflectPrompt: "哪一個日常細節讓我重新感到有趣？",
  reflectPlaceholder: "例如：原來我家常喝的烏龍，焙火深淺會改變香氣…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "本頁可完成今日風味卡。也可進暖暖語音提問；來源、標示與實際感受仍需自己確認。",
  practiceWhere: "mixed",
  capabilityNote:
    "提問可在暖暖語音完成；這是探索入口，不是品質認證或健康診斷。",
  printCardTitle: "日常風味卡",
  printCardDescription: "可列印：我的日常飲食、風土／做法問題、新發現。",
  printButtonLabel: "列印風味卡",
  guideTitle: "日常修煉",
  guideDuration: "心法",
  guideParagraphs: [
    "米其林是大餐，好好喝茶才是日子。",
    "AI 的價值不是把日子變複雜，而是陪您把熟悉事物看細一點。",
    "願意重新看見日常，就是飲食文化最穩定的修煉。",
  ],
  guideFooterNote: "請先選一樣日常飲食並寫下一個問題。",
  footerGuideLabel: "閱讀日常修煉說明",
  samplePrompt: "我家每天喝的這杯茶，可能有什麼產地或做法特色？請用簡單中文說明。",
  curiosityDemos: [
    {
      id: "tea",
      label: "案例｜每天那杯茶",
      question: "我常喝的台式烏龍，焙火深淺會怎樣影響香氣與口感？",
      aiAnswer: "焙火較深常帶來焙香與厚實口感；較輕則偏花香清爽。實際仍以您的感受為準。",
      insight: "明天泡茶時，我要專心聞一次香氣。",
    },
  ],
};

export const CHAPTER_0403: ChapterOpening = {
  id: "0403",
  qrCode: "0403",
  title: "一杯茶裡的數位風土",
  subtitle: "第四章",
  layout: "smart-flow",
  headerEmoji: "☕",
  accentGradient: CH4_ACCENT,
  quote: "AI 說明風味；真正的味道，仍由自己的感官確認。",
  atAGlance:
    "拍下公開包裝或菜單，請 AI 整理陌生詞語與可能風味；再寫下自己的真實感受。咖啡因與成分以正式標示為準。",
  tryPrompt: "拍一份飲品標示，請 AI 簡單解釋，再寫下自己的真實感受。",
  reflectPrompt: "AI 的描述與我的感受哪裡相同、哪裡不同？",
  reflectPlaceholder: "例如：AI 說有花香，我覺得比較像焙香…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "在暖暖可一拍、二問；三記下可寫在本頁或點成光點。AI 可以描述風味，不能替您感受。",
  practiceWhere: "mixed",
  capabilityNote:
    "拍照與提問可在暖暖完成；品嚐感受與正式標示仍由您確認。",
  printCardTitle: "數位風土品味卡",
  printCardDescription: "可列印：一拍所見、二問摘要、自己的風味筆記。",
  printButtonLabel: "列印品味卡",
  guideTitle: "數位風土練習",
  guideDuration: "一拍二問三記下",
  guideParagraphs: [
    "一杯茶或咖啡，藏著產地、品種、烘焙、沖泡與個人偏好。",
    "提問時可加入生活情境：偏清淡、怕苦、希望少咖啡因。",
    "最後留下一句自己的風味筆記。",
  ],
  guideFooterNote: "請先完成一輪一拍、二問、三記下。",
  footerGuideLabel: "閱讀數位風土說明",
  smartFlowDemos: [
    {
      id: "coffee",
      label: "案例｜咖啡標示",
      snapNote: "包裝上寫著「中焙／花香／中美洲」",
      askQuestion: "請用簡單中文解釋這幾個詞，並提醒咖啡因仍以標示與個人狀況為準。",
      askAnswer: "中焙口感較平衡；花香是風味描述，不是加了花。是否適合仍看您身體反應。",
      savedLine: "我喝起來偏堅果，比標示的花香更明顯。",
      reflectNote: "AI 說花香，我自己感受到堅果——兩者都留下。",
    },
  ],
};

export const CHAPTER_0404: ChapterOpening = {
  id: "0404",
  qrCode: "0404",
  title: "菜市場的 Ground Truth",
  subtitle: "第四章",
  layout: "vision-identify",
  headerEmoji: "🛒",
  accentGradient: CH4_ACCENT,
  quote: "AI 提出可能答案；現場標示、攤商與實物完成確認。",
  atAGlance:
    "看到陌生食材，可先拍照請 AI 提出可能名稱與一般做法；最可靠的 Ground Truth 在現場：標示、攤商與實物。",
  tryPrompt: "選一樣市場食材，先問 AI，再向現場資訊確認一點。",
  reflectPrompt: "哪一項現場資訊修正或補充了 AI？",
  reflectPlaceholder: "例如：攤商說這是當季地瓜葉，不是地瓜芽…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "在暖暖可先拍照提問；確認請在市場現場完成。野生菇類、藥草或不明植物，未確認前不要食用。",
  practiceWhere: "mixed",
  capabilityNote:
    "暖暖協助提出可能答案；Ground Truth 在現場。這不是可食性保證。",
  printCardTitle: "市場查證卡",
  printCardDescription: "可列印：AI 可能答案、現場確認、我學到的一點。",
  printButtonLabel: "列印查證卡",
  guideTitle: "市場 Ground Truth",
  guideDuration: "示範說明",
  guideParagraphs: [
    "菜市場充滿真實世界的資訊：季節、產地、成熟度、價格與料理方式。",
    "可以把 AI 的答案變成下一個好問題，再向攤商確認。",
    "科技與在地經驗不是競爭。",
  ],
  guideFooterNote: "請先完成本頁查證練習。",
  footerGuideLabel: "閱讀市場查證說明",
  visionDemos: [
    {
      id: "greens",
      label: "案例｜陌生青菜",
      itemLabel: "攤上不認識的綠葉菜",
      askPrompt: "這可能是什麼青菜？一般怎麼挑、怎麼煮？請說明不確定處。",
      aiAnswerSummary: "可能是地瓜葉或類似葉菜；炒食常見。請向攤商確認名稱與產季。",
      trustLevel: "verify",
      verifyNote: "請看標示／問攤商／確認實物特徵後再決定是否購買與食用。",
    },
  ],
  visionSafetyTips: [
    {
      id: "market-safe",
      label: "市場安全提醒",
      items: [
        "名稱與可食性不能只靠照片決定",
        "野生菇類、藥草、不明植物未確認前不要食用",
        "價格、產地與料理方式可再問攤商",
      ],
    },
  ],
};

export const CHAPTER_0405: ChapterOpening = {
  id: "0405",
  qrCode: "0405",
  title: "放縱的韌性管理",
  subtitle: "第四章",
  layout: "plan-b",
  headerEmoji: "⚖️",
  accentGradient: CH4_ACCENT,
  quote: "韌性不是永不偏離，而是偏離後知道如何回來。",
  atAGlance:
    "參加之前決定一項底線與一項想享受的事；結束後不以罪惡感懲罰自己，而是回到可持續的節奏。",
  tryPrompt: "為下一次聚餐寫下一條底線與一個回歸小動作。",
  reflectPrompt: "什麼做法能讓我享受後仍感到自在？",
  reflectPlaceholder: "例如：先吃菜再喝酒，隔天恢復平常散步…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "本頁完成聚餐 Plan B 卡即可。酒精、血糖、血壓、藥物交互作用請依醫囑或專業意見處理。",
  practiceWhere: "paper",
  capabilityNote:
    "Plan B 卡在本頁／紙本完成。AI 可提一般替代做法，不能取代醫囑。",
  printCardTitle: "有底線享受卡",
  printCardDescription: "可列印：聚餐場景、我的底線、回歸小動作。",
  printButtonLabel: "列印享受卡",
  guideTitle: "有底線的享受",
  guideDuration: "心法",
  guideParagraphs: [
    "聚餐、甜點與慶祝是生活的一部分。",
    "過程中慢一點、留意身體感受；結束後回到原本節奏。",
    "韌性不是完美紀錄，而是知道如何回來。",
  ],
  guideFooterNote: "請先寫下一條底線與一個回歸小動作。",
  footerGuideLabel: "閱讀韌性管理說明",
  planBDemos: [
    {
      id: "reunion",
      label: "案例｜家族聚餐",
      scene: "週末家族聚餐，一定會有甜點與敬酒",
      boundary: "甜點只吃一小塊；酒精最多一小杯",
      returnAction: "隔天早上恢復平常散步與清淡早餐",
      reflectNote: "先吃菜再喝酒，讓我比較自在。",
    },
  ],
};

export const CHAPTER_0406: ChapterOpening = {
  id: "0406",
  qrCode: "0406",
  title: "建立 55+ 日常飲食指南",
  subtitle: "第四章",
  layout: "dual-track",
  headerEmoji: "📘",
  accentGradient: CH4_ACCENT,
  quote: "身體有底線，靈魂有故事；指南讓兩條路一起被看見。",
  atAGlance:
    "身體軌記錄醫囑、過敏、明確禁忌；靈魂軌記錄喜歡的味道、文化記憶與想保留的享受。不是醫療處方。",
  tryPrompt: "各寫一項身體底線與靈魂偏好，形成指南第一版。",
  reflectPrompt: "哪一項資訊最能幫助 AI 不越界？",
  reflectPlaceholder: "例如：清楚寫出「花生過敏」比寫很多喜好更重要…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "本頁完成雙軌指南第一版。只放必要資訊，不上傳完整病歷或敏感資料；個人健康需求由專業人員確認。",
  practiceWhere: "paper",
  capabilityNote:
    "指南模板在本頁／紙本；暖暖之後可依您提供的安全摘要協助整理一般選項。",
  printCardTitle: "55+ 日常飲食指南",
  printCardDescription: "可列印：身體軌、靈魂軌、給 AI 的安全摘要一句。",
  printButtonLabel: "列印飲食指南",
  guideTitle: "雙軌指南",
  guideDuration: "模板說明",
  guideParagraphs: [
    "指南不是通用菜單，而是讓 AI 理解您的偏好、底線與希望得到的協助。",
    "Smart Inside, Simple Outside：內部有原則，外部仍能從容吃飯。",
    "一份好的指南能反覆使用、隨生活更新。",
  ],
  guideFooterNote: "請先各寫一項身體底線與靈魂偏好。",
  footerGuideLabel: "閱讀雙軌指南說明",
  dualTrackDemos: [
    {
      id: "guide",
      label: "案例｜指南第一版",
      bodyTrack: "醫生提醒少油炸；花生過敏",
      soulTrack: "喜歡家常湯品與和孫子一起吃下午點心",
      reflectNote: "最重要的是先寫清楚「花生過敏」。",
    },
  ],
};

export const CHAPTER_0407: ChapterOpening = {
  id: "0407",
  qrCode: "0407",
  title: "一句「55+ 日常」喚醒雙軌輸出",
  subtitle: "第四章",
  layout: "curiosity-ask",
  headerEmoji: "✨",
  accentGradient: CH4_ACCENT,
  quote: "一句自然開場，讓身體底線與生活滋味同時被看見。",
  atAGlance:
    "用一句簡單開場請 AI 提供身體軌與靈魂軌兩種建議。兩軌並列，不讓健康吞沒生活，也不讓享受忽略安全。",
  tryPrompt: "用一句話請 AI 針對同一道餐點提供身體軌與靈魂軌。",
  reflectPrompt: "兩軌並列後，我的選擇是否更完整？",
  reflectPlaceholder: "例如：我看見可以改清蒸，也保留想和家人分享的喜悅…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "可複製下方開場句到暖暖語音試用。每次使用前仍要確認 AI 是否理解正確；涉及醫療判斷請停止推測。",
  practiceWhere: "mixed",
  capabilityNote:
    "開場句可在暖暖語音試用；雙軌示範目前為文字版。AI 不是醫師或營養裁判。",
  printCardTitle: "雙軌提問句卡",
  printCardDescription: "可列印：開場句、身體軌摘要、靈魂軌摘要。",
  printButtonLabel: "列印提問句卡",
  guideTitle: "雙軌輸出示範",
  guideDuration: "約 30 秒文字版",
  guideParagraphs: [
    "複雜原則放在內部，表面只需一句自然的話。",
    "身體軌聚焦底線與需專業確認處；靈魂軌保留風味、文化與享受。",
    "這就是 Smart Inside, Simple Outside 的生活版本。",
  ],
  guideFooterNote: "請先用一句話試一次；也可進暖暖語音練習。",
  footerGuideLabel: "閱讀雙軌輸出說明",
  samplePrompt:
    "請依我的 55+ 日常指南，針對這道餐點提供身體軌與靈魂軌兩種建議。身體軌請標明需專業確認處；靈魂軌請保留風味與享受。",
  curiosityDemos: [
    {
      id: "dual",
      label: "案例｜同一道紅燒肉",
      question:
        "請依我的 55+ 日常指南，針對紅燒肉提供身體軌與靈魂軌兩種建議。",
      aiAnswer:
        "身體軌：油與糖較高，可改小份或搭配大量青菜；若有醫囑請再確認。靈魂軌：這道菜承載家庭味道，可與家人共享並慢慢品嚐。",
      insight: "兩軌並列後，我選擇小份＋多菜，仍保有家的味道。",
    },
  ],
};

export const CHAPTER_0408: ChapterOpening = {
  id: "0408",
  qrCode: "0408",
  title: "韌性除錯：Plan B",
  subtitle: "第四章",
  layout: "organize-decide",
  headerEmoji: "🛠",
  accentGradient: CH4_ACCENT,
  quote: "工具失準不等於我失敗；停、補、查、換，就是 Plan B。",
  atAGlance:
    "AI 偶爾會答非所問或認錯食材。先停一下，再補背景、要求說明不確定處；仍不可靠就改用正式標示或詢問專業。",
  tryPrompt: "把一個不滿意的 AI 回答，用停、補、查、換重新處理一次。",
  reflectPrompt: "哪一步最能幫我重新拿回掌控感？",
  reflectPlaceholder: "例如：停下來不急著採信，最能讓我重新穩住…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "本頁完成韌性除錯卡。涉及食用安全、過敏、藥物與疾病時，不進行猜測，也不以多問幾次取代專業確認。",
  practiceWhere: "paper",
  capabilityNote:
    "除錯卡在本頁完成；能夠停止，是韌性的一部分。",
  printCardTitle: "Plan B 四步卡",
  printCardDescription: "可列印：失準場景、停／補／查、換的下一步。",
  printButtonLabel: "列印除錯卡",
  guideTitle: "韌性除錯",
  guideDuration: "四步",
  guideParagraphs: [
    "這不代表您做錯，也不需要因此放棄工具。",
    "停 → 補上一項必要背景 → 查不確定處 → 換可信來源。",
    "真正的數位自信是知道系統失準時，自己仍有下一步。",
  ],
  guideFooterNote: "請用停、補、查、換處理一次不滿意的回答。",
  footerGuideLabel: "閱讀 Plan B 說明",
  organizeDemos: [
    {
      id: "wrong-veg",
      label: "案例｜認錯青菜",
      messyTask: "AI 把地瓜葉認成別種菜，還直接說可以生食",
      askPrompt: "請停下來重看照片，說明不確定處，並告訴我該向現場確認什麼。",
      threePoints: [
        "停：先不採信「可生食」",
        "補：告訴 AI 這是市場攤上的葉菜、光線偏暗",
        "查：要求列出不確定點與該問攤商的問題",
      ],
      nextStep: "換：改問攤商名稱與煮法，不以 AI 決定是否生食",
      userDecision: "停下來最能讓我重新拿回掌控感。",
    },
  ],
};

export const CHAPTER_0409: ChapterOpening = {
  id: "0409",
  qrCode: "0409",
  title: "55+ 品味週記",
  subtitle: "第四章",
  layout: "taste-journal",
  headerEmoji: "🗒",
  accentGradient: CH4_ACCENT,
  quote: "品味週記不評分；只看見一週的滋味、底線與回歸。",
  atAGlance:
    "回看：我看懂了什麼、享受了什麼、守住哪一條底線、偏離後如何回來。再選一個下週想保留的小做法。",
  tryPrompt: "用四句話完成本週回顧，再選一項下週想保留的做法。",
  reflectPrompt: "這週哪一刻最能代表我的自主或韌性？",
  reflectPlaceholder: "例如：聚餐後隔天恢復散步，讓我感到自在…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "本頁完成私人週記；不排名、不公開，也可選擇不保存。若出現持續不適或進食困擾，請尋求專業協助。",
  practiceWhere: "paper",
  capabilityNote:
    "週記在本頁／紙本完成；不用 AI 自行診斷健康問題。",
  printCardTitle: "55+ 品味週記",
  printCardDescription: "可列印：四句回顧、下週想保留的做法。",
  printButtonLabel: "列印週記",
  guideTitle: "溫柔回顧",
  guideDuration: "幾分鐘",
  guideParagraphs: [
    "不需要計算完美飲食分數。",
    "溫柔回顧不是檢討，而是看見自主與韌性已經如何發生。",
    "少量、真實、可持續，比完整卻有壓力更重要。",
  ],
  guideFooterNote: "請用四句話完成本週回顧即可。",
  footerGuideLabel: "閱讀品味週記說明",
  tasteJournalDemos: [
    {
      id: "week",
      label: "案例｜一週回看",
      lines: [
        "看懂：烏龍焙火會改變香氣",
        "享受：和孫子分享一小塊蛋糕",
        "底線：甜點只吃一小塊",
        "回歸：隔天恢復平常散步",
      ],
      keepPractice: "下週繼續「先吃菜再享用」",
      reflectNote: "聚餐後仍能回來，最能代表我的韌性。",
    },
  ],
};

export const CHAPTER_0410: ChapterOpening = {
  id: "0410",
  qrCode: "0410",
  title: "點亮自主與韌性",
  subtitle: "第四章",
  layout: "ar-light",
  headerEmoji: "💡",
  accentGradient: CH4_ACCENT,
  quote: "自主讓我知道怎麼選；韌性讓我知道如何回來。",
  atAGlance:
    "A 的光是我開始知道自己怎麼選；R 的光是變數發生後仍能回來。各寫下一個可重複的生活小動作即可。",
  tryPrompt: "各寫下一個代表自主與韌性的生活小動作。",
  reflectPrompt: "哪一盞燈已經亮起？下一步想支持哪一盞？",
  reflectPlaceholder: "例如：A 已亮起；下一步想多練習偏離後的回歸…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "完成本頁 A／R 點燈卡後，可把小動作點成光點，或開啟圓夢藍圖。下一章會把同一份自主與韌性帶到金錢與防詐。",
  practiceWhere: "mixed",
  capabilityNote:
    "點燈卡在本頁完成；可持續累積請用暖暖圓夢藍圖光點（不排名、不公開）。",
  printCardTitle: "自主與韌性點燈卡",
  printCardDescription: "可列印：自主小動作、韌性小動作、下一步想支持哪一盞。",
  printButtonLabel: "列印點燈卡",
  guideTitle: "點亮 A／R",
  guideDuration: "章末",
  guideParagraphs: [
    "我們把餐桌從限制清單重新變成選擇現場。",
    "AI 是茶友與二廚，不是監工、醫師或營養裁判。",
    "餐桌上的練習，正是面對複雜資訊時保持清楚判斷的開始。",
  ],
  guideFooterNote: "請各寫下一個代表 A 與 R 的小動作。",
  footerGuideLabel: "閱讀點燈說明",
  arLightDemos: [
    {
      id: "lights",
      label: "案例｜兩盞小燈",
      agencyAction: "點菜前先問自己：我想要的滋味是什麼？",
      resilienceAction: "偏離後隔天恢復一個平常小習慣（如散步）",
      reflectNote: "A 已亮起；下一步想把回歸動作做得更穩。",
    },
  ],
  appDeepLink: { href: "/smart/radar", label: "打開圓夢藍圖，點亮 A／R 光點 →" },
};

export const CHAPTER_4_OPENINGS: Record<string, ChapterOpening> = {
  "0400": CHAPTER_0400,
  "0401": CHAPTER_0401,
  "0402": CHAPTER_0402,
  "0403": CHAPTER_0403,
  "0404": CHAPTER_0404,
  "0405": CHAPTER_0405,
  "0406": CHAPTER_0406,
  "0407": CHAPTER_0407,
  "0408": CHAPTER_0408,
  "0409": CHAPTER_0409,
  "0410": CHAPTER_0410,
};

import type { ChapterOpening } from "./chapter-opening";

const CH2_ACCENT = "linear-gradient(180deg, #E8F5EE 0%, #FFF8EE 55%)";

export const CHAPTER_0200: ChapterOpening = {
  id: "0200",
  qrCode: "0200",
  title: "感官覺醒",
  subtitle: "第二章｜章節開篇",
  layout: "routes",
  headerEmoji: "🌿",
  accentGradient: CH2_ACCENT,
  quote: "看見世界、問問世界、記下世界，AI 才會成為可重複的生活節奏。",
  atAGlance:
    "這一章用一個簡單節奏，重新打開與世界相遇的方式：拍下不懂的事物、用自然的話問一句、留下真正有用的一句。牽涉食用、安全、健康或重要決定時，仍要查看可靠來源。",
  tryPrompt:
    "從花、菜單、商品、料理或照片中，圈出一個最想重新看懂的生活場景。",
  reflectPrompt: "哪一個場景，最能喚醒我現在的好奇心？",
  reflectPlaceholder: "例如：最近常經過的路邊花，我想知道名字…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "掃碼進入暖暖，可先讀章首導讀文字，再選一條感官覺醒路線。各課會標明：請在暖暖、手機或紙本完成。",
  practiceWhere: "mixed",
  capabilityNote:
    "本章有的在暖暖（拍／問）、有的在手機相簿或紙本完成；進入各課會清楚標示。",
  printCardTitle: "感官覺醒路線卡",
  printCardDescription: "可列印：圈選最想重新看懂的場景與回望。",
  printButtonLabel: "列印路線卡",
  guideTitle: "感官覺醒章首導讀",
  guideDuration: "約 2 分鐘",
  guideParagraphs: [
    "上一章我們完成智慧啟航；這一章不急著學很多工具，而是用「看見、理解、保存」重新與世界相遇。",
    "看到不懂的花、外文菜單、商品標籤、一道料理或一張老照片，都可以先停一下、拍下來，再用自然的話問一句。",
    "本章從自然、旅行、消費與飲食，走到相簿、修圖與人生策展。每一步都可以選擇做或不做，也可以隨時重來。",
  ],
  guideFooterNote: "章首導讀請先閱讀以上文字；讀完即可開始練習。",
  footerGuideLabel: "閱讀 2 分鐘章首導讀",
  entries: [
    { id: "flower", label: "自然｜花", hint: "路邊小花、植物", emoji: "🌸", href: "/smart/chapter/0202" },
    { id: "menu", label: "旅行｜菜單", hint: "外文菜單、點餐", emoji: "🍽", href: "/smart/chapter/0203" },
    { id: "product", label: "消費｜商品", hint: "標籤、規格比較", emoji: "🏷", href: "/smart/chapter/0204" },
    { id: "dish", label: "飲食｜料理", hint: "一道餐點、食材", emoji: "🥗", href: "/smart/chapter/0206" },
    { id: "album", label: "相簿｜照片", hint: "搜尋請用手機相簿", emoji: "🖼", href: "/smart/chapter/0208" },
  ],
};

export const CHAPTER_0201: ChapterOpening = {
  id: "0201",
  qrCode: "0201",
  title: "數位華爾滋：一拍、二問、三記下",
  subtitle: "第二章",
  layout: "smart-flow",
  headerEmoji: "💃",
  accentGradient: CH2_ACCENT,
  quote: "一拍、二問、三記下，讓 AI 成為新的生活直覺。",
  atAGlance:
    "「二問」是第二個步驟的名稱，不是規定問兩次。拍下、理解、保存串成一條可重複的流程，好奇心就變成日常動作。",
  tryPrompt:
    "拍下一個今天看到但不了解的東西，請 AI 簡單說明，再留下最有用的一句話。",
  reflectPrompt: "我今天留下了哪一句真正有用的話？",
  reflectPlaceholder: "例如：今天認識了○○，我注意到○○…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "掃碼進入暖暖，可依序「拍一下→問一句」；「三記下」請寫在本頁或手機備忘錄，也可點成光點。",
  practiceWhere: "mixed",
  capabilityNote:
    "一拍、二問可在暖暖完成；三記下用本頁欄位、手機備忘錄，或點成光點即可。",
  printCardTitle: "數位華爾滋隨身卡",
  printCardDescription: "可列印：一拍、二問、三記下，以及今天留下的那句話。",
  printButtonLabel: "列印隨身卡",
  guideTitle: "數位華爾滋",
  guideDuration: "約 30 秒",
  guideParagraphs: [
    "人本來就是透過看見、提問與記憶來認識世界。數位華爾滋把這份自然找回來。",
    "一拍：把眼前不懂的事物拍下來。二問：用自己的話問 AI 一句。三記下：選出真正有用的一句保存。",
    "若答案牽涉安全、健康或重要選擇，可加問：「我還需要向哪裡確認？」",
  ],
  guideFooterNote: "請先跟著本頁三步驟做一次；完成後可進暖暖再練。",
  footerGuideLabel: "閱讀三拍示範",
  smartFlowDemos: [
    {
      id: "waltz",
      label: "案例｜今天的小發現",
      snapNote: "市場裡不認識的綠色蔬菜",
      askQuestion: "這是什麼？請用簡單方式說明。",
      askAnswer: "可能是某種瓜類或根莖類蔬菜；食用前請確認。",
      savedLine: "今天認識了○○，我注意到葉片邊緣有鋸齒。",
      reflectNote: "完成了第一支數位華爾滋，可以明天再試另一個場景。",
    },
  ],
};

export const CHAPTER_0202: ChapterOpening = {
  id: "0202",
  qrCode: "0202",
  title: "自然篇：路邊小花都有身世",
  subtitle: "第二章",
  layout: "vision-identify",
  headerEmoji: "🌸",
  accentGradient: "linear-gradient(180deg, #E8F5EE 0%, transparent 55%)",
  quote: "當花有了名字，世界就多了一位朋友；重要用途仍要再查證。",
  atAGlance:
    "在不影響植物與環境的距離拍下花朵，請 AI 說明可能名稱與特徵。若牽涉食用、藥用或寵物風險，請查閱可靠圖鑑或詢問專業人員。",
  tryPrompt: "拍一朵低風險植物，請 AI 說明可能名稱與可辨認特徵。",
  reflectPrompt: "AI 的哪一點回答，需要我再查證？",
  reflectPlaceholder: "例如：能不能觸碰或採摘，需要查圖鑑…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "掃碼進入暖暖，可拍一下請通用 AI 說明。這不是專用識花 App；食用、藥用、寵物安全請再查證。",
  practiceWhere: "mixed",
  capabilityNote:
    "暖暖可陪您拍照提問；結果僅供參考，不等於植物學鑑定。",
  printCardTitle: "植物辨識查證卡",
  printCardDescription: "可列印：拍的植物、AI 摘要、需查證的一點、今天認識了…",
  printButtonLabel: "列印查證卡",
  guideTitle: "識花微示範",
  guideDuration: "一則案例",
  guideParagraphs: [
    "散步時看到漂亮小花，現在可以用手機為好奇打開第一扇門。",
    "AI 依影像提出可能答案，不等於植物學鑑定；欣賞名稱可以，食用藥用要查證。",
    "留下一句：「今天認識了＿＿，我注意到＿＿。」",
  ],
  guideFooterNote: "請先用本頁案例練習。",
  footerGuideLabel: "閱讀識花示範",
  visionSafetyTips: [
    {
      id: "ok",
      label: "適合試拍",
      items: ["路邊常見花草", "公園標示植物", "不採摘、不碰觸"],
    },
    {
      id: "avoid",
      label: "請勿只靠 AI 判斷",
      items: ["能否食用或藥用", "寵物是否安全", "是否為保護植物"],
    },
  ],
  visionDemos: [
    {
      id: "flower",
      label: "案例｜路邊小白花",
      itemLabel: "公園長椅旁的小白五瓣花",
      askPrompt: "這可能是什麼植物？請說明特徵。",
      aiAnswerSummary: "可能是十字花科或菊科的野花，春天常見。",
      trustLevel: "enjoy",
      verifyNote: "欣賞名稱即可；能否採摘或食用需查圖鑑。",
    },
  ],
};

export const CHAPTER_0203: ChapterOpening = {
  id: "0203",
  qrCode: "0203",
  title: "旅行篇：點菜的勇氣，就是自由的滋味",
  subtitle: "第二章",
  layout: "menu-translate",
  headerEmoji: "🍽",
  accentGradient: "linear-gradient(180deg, #FFF0E8 0%, transparent 55%)",
  quote: "先翻譯、再問需要、現場確認，陌生菜單就能變成安心選擇。",
  atAGlance:
    "拍清楚菜單一小段，請 AI 翻譯菜名與食材，再補上清淡、少辣、過敏等需要。真正點餐前，請向現場人員確認。",
  tryPrompt: "找一張外文菜單，請 AI 翻譯兩道菜，再加入一項自己的飲食需要。",
  reflectPrompt: "哪一項資訊一定要向店家確認？",
  reflectPlaceholder: "例如：是否含堅果、能否做少辣…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "掃碼進入暖暖，可拍照或語音請 AI 協助翻譯。暖暖沒有專用翻譯功能；點餐前請務必向店家確認。",
  practiceWhere: "mixed",
  capabilityNote:
    "暖暖可陪您翻譯與整理選項；過敏與實際菜色請向現場人員確認。",
  printCardTitle: "安心點餐確認卡",
  printCardDescription: "可列印：菜單摘要、飲食需要、需向店家確認的事項。",
  printButtonLabel: "列印點菜卡",
  guideTitle: "點餐情境",
  guideDuration: "一則案例",
  guideParagraphs: [
    "外文菜單的緊張，常來自缺少一點看得懂的安心感。",
    "AI 整理可能選項，但菜名與食材仍可能因店家而不同。",
    "若有嚴重過敏，應使用過敏翻譯卡或尋求專業協助。",
  ],
  guideFooterNote: "請先用本頁完成翻譯與確認欄位。",
  footerGuideLabel: "閱讀點餐情境",
  menuDemos: [
    {
      id: "jp",
      label: "案例｜日式菜單兩道菜",
      menuSnippet: "焼き鳥定食、野菜サラダ",
      dietaryNeed: "少油、不要太辣",
      translationSummary: "烤雞定食、蔬菜沙拉；醬料可能含醬油與糖。",
      confirmWithStaff: "定食是否含白飯、醬料能否另放。",
    },
  ],
};

export const CHAPTER_0204: ChapterOpening = {
  id: "0204",
  qrCode: "0204",
  title: "消費篇：精明消費不是省錢，是懂得價值",
  subtitle: "第二章",
  layout: "product-compare",
  headerEmoji: "🏷",
  accentGradient: CH2_ACCENT,
  quote: "AI 幫忙整理差異；需要、適合與值得，仍由您判斷。",
  atAGlance:
    "拍下公開的商品標籤或規格，請 AI 整理用途、差異與待確認事項。請勿上傳收據個資、會員或付款資訊。",
  tryPrompt: "挑兩件不含個資的商品標示，請 AI 整理三項差異與一項待確認資訊。",
  reflectPrompt: "哪一個條件最影響我的最後決定？",
  reflectPlaceholder: "例如：使用頻率、收納空間、保固…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "掃碼進入暖暖，可拍照或語音請 AI 協助整理差異。購買決定請您自己做；本頁也可先填完三問卡。",
  practiceWhere: "mixed",
  capabilityNote:
    "暖暖可整理差異與待確認事項；需要、適合、值得，仍由您判斷。",
  printCardTitle: "需要、適合、值得三問卡",
  printCardDescription: "可列印：兩件商品、三項差異、待確認、最影響決定的一項。",
  printButtonLabel: "列印三問卡",
  guideTitle: "價值比較案例",
  guideDuration: "一則案例",
  guideParagraphs: [
    "精明消費不是永遠選最便宜，而是把資訊看清楚後，做出適合自己的決定。",
    "AI 比較可能不完整；購買前仍要查看正式標示、保固與可靠評價。",
    "回到使用頻率、預算、收納空間與真正需求。",
  ],
  guideFooterNote: "請先用本頁完成比較練習。",
  footerGuideLabel: "閱讀價值比較案例",
  productCompareDemos: [
    {
      id: "kettle",
      label: "案例｜兩款電熱壺",
      productA: "A 牌 1.7L 快煮壺",
      productB: "B 牌 1.5L 保溫壺",
      threeDiffs: ["容量與是否保溫", "內膽材質標示", "保固年限"],
      verifyItem: "實際耗電量與退換貨條件需看盒裝標示",
      decisionFactor: "我每天早上只煮一次，容量 1.5L 就夠。",
    },
  ],
};

export const CHAPTER_0205: ChapterOpening = {
  id: "0205",
  qrCode: "0205",
  title: "知識篇：好奇心讓心持續明亮",
  subtitle: "第二章",
  layout: "curiosity-ask",
  headerEmoji: "✨",
  accentGradient: "linear-gradient(180deg, #E8F0FA 0%, transparent 55%)",
  quote: "每天保留一個真心想問的問題，世界就會持續打開。",
  atAGlance:
    "把問題用自己的話說出來，請 AI 用簡單中文解釋，再追問與生活的關係。遇到歷史、科學、法律、醫療或最新消息，應再查看可靠來源。",
  tryPrompt: "問 AI 一個今天真正好奇的問題，請它用生活例子簡單說明。",
  reflectPrompt: "哪一個新理解，讓我想繼續探索？",
  reflectPlaceholder: "例如：原來雲的顏色跟水滴大小有關…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "掃碼進入暖暖，可用語音問出您的好奇心問題；本頁也可先寫好再列印問題卡。",
  practiceWhere: "nuannuan",
  capabilityNote: "好奇提問很適合用語音；重要資訊仍請再查可靠來源。",
  printCardTitle: "每日好奇問題卡",
  printCardDescription: "可列印：今天的問題、新理解、想繼續探索的一點。",
  printButtonLabel: "列印問題卡",
  guideTitle: "好奇心導讀",
  guideDuration: "約 2 分鐘",
  guideParagraphs: [
    "生活裡常有一閃而過的疑問；願意問，就是學習的開始。",
    "可以追問：「這和我的生活有什麼關係？」或「可以舉一個日常例子嗎？」",
    "學習的目的不是收集所有答案，而是知道哪些事情值得再走一步。",
  ],
  guideFooterNote: "請先閱讀文字導讀並完成今日問題。",
  footerGuideLabel: "閱讀好奇心導讀",
  curiosityDemos: [
    {
      id: "cloud",
      label: "案例｜為什麼雲會變色",
      question: "傍晚的雲為什麼有時特別紅？",
      aiAnswer: "光線穿過大氣時，較長波長的紅光更容易被看見。",
      insight: "以後看夕陽時，可以留意雲層厚薄與顏色變化。",
    },
  ],
};

export const CHAPTER_0206: ChapterOpening = {
  id: "0206",
  qrCode: "0206",
  title: "美食篇：舌尖下的秘密",
  subtitle: "第二章",
  layout: "vision-identify",
  headerEmoji: "🥗",
  accentGradient: "linear-gradient(180deg, #FFF8E8 0%, transparent 55%)",
  quote: "先看懂一道菜，再做適合自己的選擇；AI 不是醫療或營養診斷。",
  atAGlance:
    "拍下餐點請 AI 整理可能食材與烹調特色。若有過敏、慢性病或特殊飲食需求，請查看標示並諮詢合格專業人員。",
  tryPrompt: "拍一道餐點，請 AI 整理可能食材與一項溫和觀察。",
  reflectPrompt: "今天哪一項觀察最貼近我的生活？",
  reflectPlaceholder: "例如：這道菜蔬菜顏色很豐富…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "掃碼進入暖暖，可拍餐點做溫和觀察。這不是營養診斷；有過敏或特殊飲食請查標示或問專業人員。",
  practiceWhere: "nuannuan",
  capabilityNote:
    "暖暖相機適合餐點觀察練習；請把結果當參考，不是醫療建議。",
  printCardTitle: "一道菜觀察卡",
  printCardDescription: "可列印：餐點、可能食材、溫和觀察、最貼近生活的一項。",
  printButtonLabel: "列印觀察卡",
  guideTitle: "餐桌示範",
  guideDuration: "一則案例",
  guideParagraphs: [
    "一道熟悉料理裡，藏著食材、烹調與文化。",
    "不必把每一餐變成考試；可以只觀察顏色、蔬菜與蛋白質來源。",
    "身體感受與實際需要仍由您掌握。",
  ],
  guideFooterNote: "請先用本頁完成觀察練習。",
  footerGuideLabel: "閱讀餐桌示範",
  visionSafetyTips: [
    {
      id: "ok",
      label: "適合觀察",
      items: ["日常餐點、顏色與食材", "烹調方式特色", "一般性飲食提醒"],
    },
    {
      id: "avoid",
      label: "請勿只靠 AI",
      items: ["過敏與用藥飲食", "精確營養計算", "疾病診斷"],
    },
  ],
  visionDemos: [
    {
      id: "lunch",
      label: "案例｜便當一份",
      itemLabel: "外食雞腿便當",
      askPrompt: "請整理可能的主要食材、烹調特色，以及一項溫和觀察。",
      aiAnswerSummary: "可能有米飯、雞腿、滷蛋與燙青菜；油鹽可能偏高。",
      trustLevel: "verify",
      verifyNote: "過敏或控糖需看實際配料與店家說明。",
    },
  ],
};

export const CHAPTER_0207: ChapterOpening = {
  id: "0207",
  qrCode: "0207",
  title: "五色高纖食譜庫",
  subtitle: "第二章",
  layout: "recipe-card",
  headerEmoji: "🌈",
  accentGradient: CH2_ACCENT,
  quote: "少量、可回看的記錄，比一次精密卻難持續的計算更有用。",
  atAGlance:
    "用容易完成的格式記下一道料理：名稱、主要顏色、可能的蔬菜或全穀來源、一句感受。這不是健康評分，也不需要每天打卡。",
  tryPrompt: "完成一張料理卡，只記名稱、顏色、纖維來源與一句感受。",
  reflectPrompt: "一週後，我願意保留哪一個小變化？",
  reflectPlaceholder: "例如：午餐多選一份綠色蔬菜…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "請直接在本頁填寫並可列印。暖暖尚無「食譜庫回看」功能；想留下痕跡可點成光點。",
  practiceWhere: "paper",
  capabilityNote:
    "本頁即可完成食譜卡；沒有雲端食譜庫，請用列印或光點保存重點。",
  printCardTitle: "五色高纖食譜卡",
  printCardDescription: "可列印：料理名稱、顏色、纖維來源、一句感受。",
  printButtonLabel: "列印食譜卡",
  guideTitle: "食譜卡範例",
  guideDuration: "一張卡",
  guideParagraphs: [
    "一次看懂餐點很有趣；持續留下簡單記錄，才會看見自己的生活節奏。",
    "AI 可協助整理文字，但照片辨識與營養推估都可能不準確。",
    "一週後回看三到五張卡，找出一個願意保留的小變化。",
  ],
  guideFooterNote: "請先使用下方欄位完成一張卡；完成後可列印或點成光點保存。",
  footerGuideLabel: "看食譜卡範例",
  recipeCardDemos: [
    {
      id: "salad",
      label: "案例｜蔬菜沙拉",
      dishName: "綜合蔬菜沙拉",
      colors: "綠、紅、黃",
      fiberSource: "葉菜、番茄、玉米",
      feeling: "清爽，但醬料可以少一點。",
    },
  ],
};

export const CHAPTER_0208: ChapterOpening = {
  id: "0208",
  qrCode: "0208",
  title: "照片搜尋：回憶不必被埋沒",
  subtitle: "第二章",
  layout: "photo-search",
  headerEmoji: "🔍",
  accentGradient: "linear-gradient(180deg, #F5EEF8 0%, transparent 55%)",
  quote: "一個有溫度的詞，可以讓被埋沒的回憶重新浮現。",
  atAGlance:
    "請在手機「照片／相簿」App 搜尋海邊、生日、台南、朋友等詞。暖暖尚無相簿搜尋；回來後可在本頁寫回憶與列印。",
  tryPrompt:
    "打開手機相簿，搜尋一個有溫度的詞，選一張照片，回到本頁寫下一句回憶。",
  reflectPrompt: "這張照片讓我想起誰、哪裡或哪段人生？",
  reflectPlaceholder: "例如：想起在台南與老朋友散步的那個黃昏…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "搜尋請在您的手機相簿完成。回本頁寫下回憶、列印卡片，或把這句話點成光點。",
  practiceWhere: "phone",
  capabilityNote:
    "請用手機系統相簿搜尋；暖暖幫您留下回憶與光點，不取代相簿功能。",
  printCardTitle: "相簿搜尋關鍵字卡",
  printCardDescription: "可列印：搜尋詞、一句回憶、這張照片讓我想起…",
  printButtonLabel: "列印關鍵字卡",
  guideTitle: "相簿搜尋示範",
  guideDuration: "文字案例",
  guideParagraphs: [
    "手機裡有很多照片，真正想找時卻常滑不到。",
    "搜尋讓相簿從堆疊檔案，變成會回應的記憶花園。",
    "選出一張最有感覺的照片，寫下一句回憶。",
  ],
  guideFooterNote: "請先在手機相簿試搜尋，再回本頁書寫。",
  footerGuideLabel: "閱讀相簿搜尋示範",
  warmKeywordSuggestions: ["海邊", "生日", "台南", "咖啡", "朋友"],
  photoSearchDemos: [
    {
      id: "sea",
      label: "案例｜搜尋「海邊」",
      searchKeyword: "海邊",
      memoryNote: "七十歲生日，全家在東北角拍的第一張合照。",
      reflectNote: "想起孩子們扶著我走向海堤的那一段路。",
    },
  ],
};

export const CHAPTER_0209: ChapterOpening = {
  id: "0209",
  qrCode: "0209",
  title: "魔法橡皮擦：修復遺憾",
  subtitle: "第二章",
  layout: "photo-edit-safe",
  headerEmoji: "✨",
  accentGradient: CH2_ACCENT,
  quote: "先備份原檔，再移除干擾；修圖可以整理回憶，不應改寫事實。",
  atAGlance:
    "請用手機系統的照片編輯功能練習。開始前先複製一份或確認原檔仍在。證件、新聞、交易或需真實性的照片，不應誤導。",
  tryPrompt:
    "挑一張非重要紀錄照片，在手機相簿先備份，再移除一個小干擾並比較前後；回本頁勾選檢查清單。",
  reflectPrompt: "修改後更接近我想留下的感受嗎？",
  reflectPlaceholder: "例如：路人走開後，焦點回到孫子的笑容…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "修圖請在手機照片編輯完成（暖暖尚無橡皮擦功能）。本頁幫您完成「先備份、再比較」的安全檢查。",
  practiceWhere: "phone",
  capabilityNote:
    "請用手機系統修圖；暖暖提供安全檢查卡與回望，不提供生成式擦除。",
  printCardTitle: "安全修圖檢查卡",
  printCardDescription: "可列印：已備份原檔、移除項目、前後感受比較。",
  printButtonLabel: "列印檢查卡",
  guideTitle: "安全修圖示範",
  guideDuration: "約 30 秒",
  guideParagraphs: [
    "喜歡的照片有時被路人或雜物搶走注意力；編修可以讓焦點回到想保存的人與景。",
    "開始前先複製一份；結果不理想可以撤回或保留原貌。",
    "修圖是整理回憶，不是改寫事實。",
  ],
  guideFooterNote: "請先在手機完成修圖，再回本頁填寫檢查卡。",
  footerGuideLabel: "閱讀安全修圖要點",
  photoEditDemos: [
    {
      id: "passerby",
      label: "案例｜移除背景路人",
      backupNote: "已複製原檔到「修圖備份」相簿",
      editAction: "移除右側一半的路人剪影",
      compareNote: "焦點回到孫子與海浪，邊緣略需放大檢查。",
    },
  ],
};

export const CHAPTER_0210: ChapterOpening = {
  id: "0210",
  qrCode: "0210",
  title: "人生策展：照片不是雜亂，是人生作品集",
  subtitle: "第二章",
  layout: "photo-curate",
  headerEmoji: "🖼",
  accentGradient: "linear-gradient(180deg, #E8F0FA 0%, transparent 55%)",
  quote: "三張照片、一個主題，就能把零散記錄變成自己的生活作品。",
  atAGlance:
    "在手機相簿選三張照片，回到本頁取一個主題、為每張寫一句說明。不需要公開，也不必上傳照片到暖暖。",
  tryPrompt: "在手機相簿選三張照片，取一個主題，為每張寫一句說明。",
  reflectPrompt: "這組照片最想替我保留什麼？",
  reflectPlaceholder: "例如：這一段時間我們常一起出門散步…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "選照片請在手機相簿完成；策展卡請在本頁填寫或列印。暖暖尚無作品集相簿功能。",
  practiceWhere: "paper",
  capabilityNote:
    "照片留在您的手機；暖暖幫您整理主題與說明，並可點成光點。",
  printCardTitle: "三張照片策展卡",
  printCardDescription: "可列印：主題、三張照片各一句說明、最想保留的意義。",
  printButtonLabel: "列印策展卡",
  guideTitle: "微型作品集",
  guideDuration: "範例",
  guideParagraphs: [
    "相簿裡的照片看似零散，用主題重新觀看，便開始變成作品集。",
    "例如「我走過的海邊」「家裡的味道」「和朋友的好時光」。",
    "策展不是包裝得完美，而是重新看見自己走過的路。",
  ],
  guideFooterNote: "請先用本頁完成私人策展卡。",
  footerGuideLabel: "閱讀微型作品集範例",
  photoCurateDemos: [
    {
      id: "sea",
      label: "案例｜我走過的海邊",
      theme: "我走過的海邊",
      captions: [
        "第一次帶孫子看海，他撿了好多貝殼。",
        "黃昏時分，老伴與我並肩看夕陽。",
        "冬天北海岸，風很大但心很暖。",
      ],
      reflectNote: "想保留的是家人一起出門的時光。",
    },
  ],
};

export const CHAPTER_0211: ChapterOpening = {
  id: "0211",
  qrCode: "0211",
  title: "感官全開：把好奇變成生活反射",
  subtitle: "第二章",
  layout: "sensory-habit",
  headerEmoji: "🌟",
  accentGradient: CH2_ACCENT,
  quote: "感官全開不是每天打卡，而是隨時能重新開始看見、提問與保存。",
  atAGlance:
    "走過全章，練習的是共同節奏：看見、提問、保存。未來七天任選三天各完成一次即可，不需連續；中斷後隨時可再開始。",
  tryPrompt: "未來七天任選三天，各完成一次看見、提問與保存；不需連續。",
  reflectPrompt: "哪一種生活場景，最容易讓我自然重新開始？",
  reflectPlaceholder: "例如：散步時看到花、吃外食時看菜單…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "請在本頁規劃三天並可列印七天卡。暖暖尚無連續打卡；沒有紀錄也不會失敗，隨時能重新開始。",
  practiceWhere: "paper",
  capabilityNote:
    "這是溫和計劃，不是打卡競賽；本頁／紙本即可完成，也可把一句話點成光點。",
  printCardTitle: "七天感官覺醒卡",
  printCardDescription: "可列印：選三天、各場景打勾、最容易重新開始的場景。",
  printButtonLabel: "列印七天卡",
  guideTitle: "七天溫和挑戰",
  guideDuration: "七天",
  guideParagraphs: [
    "今天辨認一朵花，明天翻譯一小段文字，週末找回一張照片——節奏可以很小。",
    "AI 的回答需要判斷；重要資訊要查證，私人內容要保護。",
    "當看見、提問、保存成為生活反射，感官便重新打開。",
  ],
  guideFooterNote: "沒有連續紀錄功能；請用下方欄位或紙本卡自己規劃即可。",
  footerGuideLabel: "閱讀七天溫和挑戰說明",
  habitSceneOptions: [
    { id: "nature", label: "自然｜看見一朵花", hint: "0202 識花" },
    { id: "menu", label: "旅行｜看懂菜單", hint: "0203 點餐" },
    { id: "shop", label: "消費｜比較商品", hint: "0204 價值" },
    { id: "ask", label: "知識｜問一個問題", hint: "0205 好奇" },
    { id: "food", label: "飲食｜觀察一道菜", hint: "0206 餐桌" },
    { id: "album", label: "相簿｜找回照片", hint: "0208 搜尋（手機相簿）" },
  ],
  habitDemos: [
    {
      id: "week",
      label: "案例｜溫和三天計畫",
      pickedScenes: ["nature", "food", "album"],
      planNote: "週二散步識花、週四午餐觀察、週日在手機相簿搜尋「朋友」。",
      reflectNote: "散步時最容易自然停下來看見新事物。",
    },
  ],
};

export const CHAPTER_2_OPENINGS: Record<string, ChapterOpening> = {
  "0200": CHAPTER_0200,
  "0201": CHAPTER_0201,
  "0202": CHAPTER_0202,
  "0203": CHAPTER_0203,
  "0204": CHAPTER_0204,
  "0205": CHAPTER_0205,
  "0206": CHAPTER_0206,
  "0207": CHAPTER_0207,
  "0208": CHAPTER_0208,
  "0209": CHAPTER_0209,
  "0210": CHAPTER_0210,
  "0211": CHAPTER_0211,
};

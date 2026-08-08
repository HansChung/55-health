import type { ChapterOpening, SmartDirectionOption } from "./chapter-opening";

const CH3_ACCENT = "linear-gradient(180deg, #E8F0FA 0%, #FFF8EE 55%)";

/** Chapter 3 書本 SMART 五方向（與 App 雷達語意對齊，文案依書） */
export const CH3_SMART_DIRECTIONS: SmartDirectionOption[] = [
  { id: "S", letter: "S", label: "分享與連結", hint: "關心、陪伴、智慧流動" },
  { id: "M", letter: "M", label: "意義與價值", hint: "故事、傳承、值得留下的事" },
  { id: "A", letter: "A", label: "自主與掌控", hint: "選擇盡量回到自己手中" },
  { id: "R", letter: "R", label: "韌性與安全", hint: "站穩、查證、保護自己" },
  { id: "T", letter: "T", label: "信賴與科技", hint: "用科技安頓生活、保存重要事" },
];

export const CHAPTER_0300: ChapterOpening = {
  id: "0300",
  qrCode: "0300",
  title: "優雅導航",
  subtitle: "第三章｜章節開篇",
  layout: "routes",
  headerEmoji: "🧭",
  accentGradient: CH3_ACCENT,
  quote: "優雅導航不是做更多，而是知道自己要往哪裡走。",
  atAGlance:
    "這一章先用「AI 電梯」降低重新學習的焦慮，再認識 SMART 五個方向與生活羅盤。不必一次學會所有工具，只要知道方向已經出現。",
  tryPrompt: "先圈出現在最想改善的方向：分享、意義、自主、韌性或信賴科技。",
  reflectPrompt: "哪一個方向，最值得我先得到一點支持？",
  reflectPlaceholder: "例如：我想先在「自主」上多一點掌控感…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "掃碼進入暖暖，可先讀章首導讀文字，再選一條導航路線。SMART RADAR 與光點可在 App 內持續使用。",
  practiceWhere: "mixed",
  capabilityNote:
    "導航練習可在本頁完成；正式羅盤請用暖暖「圓夢藍圖／SMART RADAR」，不排名、不公開。",
  printCardTitle: "優雅導航路線卡",
  printCardDescription: "可列印：圈選最想先支持的方向與回望。",
  printButtonLabel: "列印路線卡",
  guideTitle: "優雅導航章首導讀",
  guideDuration: "約 2 分鐘",
  guideParagraphs: [
    "走過第一部的驚艷，接下來真正重要的不是學更多工具，而是找到方向。",
    "AI 電梯降低門檻；SMART 五方向形成生活羅盤；SHI 每週溫柔回看。",
    "這一章結束時，不必學會所有工具。只要羅盤在手上，下一步可以從一件生活小事開始。",
  ],
  guideFooterNote: "章首導讀請先閱讀以上文字；讀完即可開始練習。",
  footerGuideLabel: "閱讀 2 分鐘章首導讀",
  entries: [
    { id: "S", label: "S｜分享", hint: "連結與關心", emoji: "🤝", href: "/smart/chapter/0302" },
    { id: "M", label: "M｜意義", hint: "故事與傳承", emoji: "✨", href: "/smart/chapter/0302" },
    { id: "A", label: "A｜自主", hint: "選擇回到自己", emoji: "🕊", href: "/smart/chapter/0302" },
    { id: "R", label: "R｜安全", hint: "韌性與查證", emoji: "🛡", href: "/smart/chapter/0302" },
    { id: "T", label: "T｜科技", hint: "信賴與工具", emoji: "📱", href: "/smart/chapter/0302" },
  ],
};

export const CHAPTER_0301: ChapterOpening = {
  id: "0301",
  qrCode: "0301",
  title: "AI 電梯：不再辛苦爬樓梯",
  subtitle: "第三章",
  layout: "elevator-wish",
  headerEmoji: "🛗",
  accentGradient: CH3_ACCENT,
  quote: "AI 降低門檻；您決定方向。",
  atAGlance:
    "AI 更像一部電梯，協助跨過繁瑣門檻，把已經擁有的智慧帶到新樓層。電梯不替您選樓層——方向仍由您決定。",
  tryPrompt: "完成三句：我想要＿＿；我卡在＿＿；希望 AI 先幫我＿＿。",
  reflectPrompt: "如果門檻降低，我最想先前往哪一個生活方向？",
  reflectPlaceholder: "例如：整理家族照片、規劃一趟說走就走的小旅行…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "本頁完成願望卡即可。也可進暖暖語音，把三句話說出來；或把最想做的一句點成光點。",
  practiceWhere: "mixed",
  capabilityNote:
    "願望卡在本頁完成；想說出口可用語音。AI 降低門檻，方向仍由您決定。",
  printCardTitle: "AI 電梯願望卡",
  printCardDescription: "可列印：我想要、我卡在、希望 AI 先幫我、我想前往的方向。",
  printButtonLabel: "列印願望卡",
  guideTitle: "AI 電梯引導",
  guideDuration: "一則心法",
  guideParagraphs: [
    "人生上半場像長長樓梯；55+ 身上已有豐富經驗，不必把這些歸零。",
    "想整理照片、規劃旅行、看懂資訊或留下故事，都不必一次學完所有功能。",
    "先說清楚三句話，比追逐工具名稱更接近真正需要。",
  ],
  guideFooterNote: "請先完成本頁三句話；也可進暖暖語音練習。",
  footerGuideLabel: "閱讀 AI 電梯引導",
  elevatorDemos: [
    {
      id: "photos",
      label: "案例｜整理家族照片",
      want: "把旅行與孫子的照片整理成一本小冊",
      stuck: "相簿太多，不知道從哪裡開始",
      aiHelp: "先幫我訂一個「只選 10 張」的簡單步驟",
      reflectNote: "我想先往「意義」方向走一小步。",
    },
  ],
};

export const CHAPTER_0302: ChapterOpening = {
  id: "0302",
  qrCode: "0302",
  title: "S.M.A.R.T. 核心定義",
  subtitle: "第三章",
  layout: "five-reflect",
  headerEmoji: "🔤",
  accentGradient: CH3_ACCENT,
  quote: "SMART 是五個人生方向，不是五項必須滿分的考試。",
  atAGlance:
    "S 分享、M 意義、A 自主、R 韌性與安全、T 信賴與科技。五個方向像羅盤方位，不需要同時完美。",
  tryPrompt: "從五個方向中，選一個最接近現在生活需要的字母。",
  reflectPrompt: "這個方向若得到一點支持，生活會有什麼不同？",
  reflectPlaceholder: "例如：若「自主」多一點，出門會比較安心…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "本頁選好方向即可。想看生活羅盤，可開啟暖暖「圓夢藍圖／SMART RADAR」（不排名、不公開）。",
  practiceWhere: "mixed",
  capabilityNote:
    "方向選擇在本頁完成；持續累積請用暖暖圓夢藍圖點光點。",
  printCardTitle: "SMART 五方向卡",
  printCardDescription: "可列印：五方向簡述、我選的字母、若得到支持會有什麼不同。",
  printButtonLabel: "列印方向卡",
  guideTitle: "五方向導覽",
  guideDuration: "文字導覽",
  guideParagraphs: [
    "對 55+ 而言，SMART 是一套人生導航語言：內在完整，外在簡單。",
    "Smart Inside, Simple Outside：內部有系統，外部保留簡單生活。",
    "這就是 SMART 55+ 所說的優雅。",
  ],
  guideFooterNote: "請先選一個方向，再繼續本章練習。",
  footerGuideLabel: "閱讀五方向導覽",
  fiveReflectMode: "pick",
  smartDirections: CH3_SMART_DIRECTIONS,
  fiveReflectDemos: [
    {
      id: "autonomy",
      label: "案例｜先支持「自主」",
      focusId: "A",
      statuses: {
        S: "中｜家人常聯絡",
        M: "低｜故事還沒整理",
        A: "低｜出門常依賴別人安排",
        R: "中｜會查證可疑訊息",
        T: "中｜會用基本 App",
      },
      nextStep: "這週自己用導航去一趟熟悉的診所",
      reflectNote: "自主多一點，會比較有掌控感。",
    },
  ],
  appDeepLink: { href: "/smart/radar", label: "打開 SMART RADAR 圓夢藍圖 →" },
};

export const CHAPTER_0303: ChapterOpening = {
  id: "0303",
  qrCode: "0303",
  title: "Google 12 金童：生活安頓隊伍",
  subtitle: "第三章",
  layout: "life-match",
  headerEmoji: "🧰",
  accentGradient: CH3_ACCENT,
  quote: "不要先背 App；先說生活卡點，再找一位能幫忙的夥伴。",
  atAGlance:
    "把搜尋、地圖、行事曆、相簿、文件看成生活安頓隊伍。工具可能改名，生活任務仍然清楚：找路、整理、提醒、保存或查證。",
  tryPrompt: "選一個生活卡點，寫下它需要的是找路、整理、提醒、保存或查證。",
  reflectPrompt: "我最希望先被安頓的是哪一件事？",
  reflectPlaceholder: "例如：下次回診的交通與時間提醒…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "配對在本頁完成。實際工具請在您的手機裡使用（地圖、行事曆、相簿等）；暖暖可用語音幫您拆步驟。",
  practiceWhere: "phone",
  capabilityNote:
    "「金童」是理解方式，不是暖暖內建的 App 清單；請在手機找對應工具，暖暖陪您說清楚卡點。",
  printCardTitle: "生活安頓配對卡",
  printCardDescription: "可列印：生活卡點、需要的角色、希望先安頓的事。",
  printButtonLabel: "列印配對卡",
  guideTitle: "生活安頓隊伍",
  guideDuration: "一則說明",
  guideParagraphs: [
    "面對許多 App 名稱，最容易產生的感覺是混亂。",
    "先說問題，再找角色；選一位夥伴完成一件小事即可。",
    "生活先安頓，才有餘裕向前。",
  ],
  guideFooterNote: "請先完成本頁配對；不必一次學會整隊。",
  footerGuideLabel: "閱讀生活安頓說明",
  lifeRoleOptions: [
    { id: "nav", label: "找路", hint: "地圖、交通、陌生地方" },
    { id: "sort", label: "整理", hint: "文件、照片、資料歸類" },
    { id: "remind", label: "提醒", hint: "行程、吃藥、約會" },
    { id: "save", label: "保存", hint: "雲端、備份、重要檔案" },
    { id: "verify", label: "查證", hint: "可疑訊息、不明連結" },
  ],
  lifeMatchDemos: [
    {
      id: "clinic",
      label: "案例｜回診交通",
      painPoint: "下週回診，怕搞錯時間又怕找不到路",
      roleId: "remind",
      reflectNote: "先被安頓的是「時間提醒」，再處理找路。",
    },
  ],
};

export const CHAPTER_0304: ChapterOpening = {
  id: "0304",
  qrCode: "0304",
  title: "Google 12 金釵：智慧創作隊伍",
  subtitle: "第三章",
  layout: "meaning-seed",
  headerEmoji: "🎨",
  accentGradient: CH3_ACCENT,
  quote: "AI 可以協助形式；真正值得留下的內容，來自您的人生。",
  atAGlance:
    "口述可整理成文字，照片可編成小冊，旅行記憶可成簡報或短片。本課只打開 Meaning 的門，不要求現在完成作品。",
  tryPrompt: "選一段經驗或一張照片，寫下它可能成為哪一種作品。",
  reflectPrompt: "哪一段人生最值得我慢慢留下？",
  reflectPlaceholder: "例如：和老伴第一次出國的那段日子…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "意向卡在本頁完成。創作工具在您的手機或電腦；暖暖可幫您起稿一句話，或點成光點保存意向。",
  practiceWhere: "paper",
  capabilityNote:
    "「金釵」是創作夥伴的理解方式；暖暖不提供完整作品編輯器，故事仍屬於您。",
  printCardTitle: "生命素材轉化卡",
  printCardDescription: "可列印：生命素材、可能的作品形式、我想留下它因為…",
  printButtonLabel: "列印轉化卡",
  guideTitle: "微型作品範例",
  guideDuration: "三種可能",
  guideParagraphs: [
    "當生活慢慢安頓，另一扇門會打開：照片、經驗與願望能否成為作品？",
    "AI 協助起稿與整理，但涉及家人朋友要尊重隱私；生成內容也需要校對。",
    "先看見「我的人生可以成為素材」，創作就已開始。",
  ],
  guideFooterNote: "請先完成本頁意向卡。",
  footerGuideLabel: "閱讀微型作品說明",
  meaningSeedDemos: [
    {
      id: "trip",
      label: "案例｜旅行記憶",
      material: "十年前第一次全家出國的照片",
      formHint: "做成一本 10 頁小冊或一段口述文字",
      because: "想讓孫子知道我們走過哪些地方",
      reflectNote: "最值得慢慢留下的是「一家人一起出發」的感覺。",
    },
  ],
};

export const CHAPTER_0305: ChapterOpening = {
  id: "0305",
  qrCode: "0305",
  title: "SMART RADAR 圓夢藍圖",
  subtitle: "第三章",
  layout: "five-reflect",
  headerEmoji: "📡",
  accentGradient: CH3_ACCENT,
  quote: "SMART RADAR 是生活羅盤，不是分數表；只需看見一個下一步。",
  atAGlance:
    "RADAR 不是成績單。它讓您看見哪裡穩定、哪裡需要支持。不必公開，也不必與人比較。",
  tryPrompt: "為五個方向各寫一句現況，再圈出最想先支持的一個方向。",
  reflectPrompt: "我願意為這個方向做哪一個最小步驟？",
  reflectPlaceholder: "例如：這週打一通電話給老朋友…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "本頁可先寫現況。正式、可回看的私人羅盤請用暖暖「SMART RADAR 圓夢藍圖」；日常小事可點成光點。",
  practiceWhere: "nuannuan",
  capabilityNote:
    "暖暖已有不排名、不公開的 SMART RADAR／光點；本頁是書本練習入口。",
  printCardTitle: "SMART RADAR 生活羅盤",
  printCardDescription: "可列印：五方向現況、最想先支持的方向、最小步驟。",
  printButtonLabel: "列印羅盤卡",
  guideTitle: "生活羅盤說明",
  guideDuration: "心法",
  guideParagraphs: [
    "前面已建立 AI 電梯、SMART 五方向與生活／創作夥伴。",
    "現在把它們放進同一張可回看的生活羅盤。",
    "最後只選一個方向與一個小步驟。",
  ],
  guideFooterNote: "請先在本頁寫一輪，再到 App 開啟正式羅盤。",
  footerGuideLabel: "閱讀羅盤說明",
  fiveReflectMode: "status",
  smartDirections: CH3_SMART_DIRECTIONS,
  statusChoices: ["低", "中", "高"],
  fiveReflectDemos: [
    {
      id: "radar",
      label: "案例｜先支持「連結」",
      focusId: "S",
      statuses: {
        S: "低",
        M: "中",
        A: "中",
        R: "高",
        T: "中",
      },
      nextStep: "這週傳一張近況照片給家人",
      reflectNote: "最小步驟就夠，不必一次補齊五個方向。",
    },
  ],
  appDeepLink: { href: "/smart/radar", label: "打開私人 SMART RADAR →" },
};

export const CHAPTER_0306: ChapterOpening = {
  id: "0306",
  qrCode: "0306",
  title: "SHI 每週 SMART 回顧",
  subtitle: "第三章",
  layout: "five-reflect",
  headerEmoji: "📅",
  accentGradient: CH3_ACCENT,
  quote: "SHI 是每週溫柔回顧，不排名、不公開，也不追求滿分。",
  atAGlance:
    "每週花幾分鐘，以低、中、高或短句回看五方向。同一週只選一件願意做的小事。持續困擾請尋求專業協助。",
  tryPrompt: "用低、中、高或一句話回看五方向，只選一項下週想支持的事。",
  reflectPrompt: "下週，我最想溫柔支持自己的哪一處？",
  reflectPlaceholder: "例如：下週想多一點休息與安全節奏…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "本頁可完成一輪私人回顧。App 內「智慧幸福檢測」可做較完整的 SHI 觀察；是否保存由您決定。",
  practiceWhere: "mixed",
  capabilityNote:
    "本頁是低壓書本回顧；App 另有智慧幸福檢測。兩者都不排名、不公開分數競賽。",
  printCardTitle: "SHI 每週回顧卡",
  printCardDescription: "可列印：五方向回看、下週想支持的一項、溫柔下一步。",
  printButtonLabel: "列印回顧卡",
  guideTitle: "每週回顧說明",
  guideDuration: "幾分鐘",
  guideParagraphs: [
    "SMART RADAR 看見方向，SHI 陪您每週溫柔回看。",
    "沒有標準答案，也不需要追求總分變高。",
    "看見自己，再選一個下一步，就已足夠。",
  ],
  guideFooterNote: "若情緒或健康困擾持續，請尋求專業協助；SHI 不能取代評估。",
  footerGuideLabel: "閱讀每週回顧說明",
  fiveReflectMode: "weekly",
  smartDirections: CH3_SMART_DIRECTIONS,
  statusChoices: ["低", "中", "高"],
  fiveReflectDemos: [
    {
      id: "week",
      label: "案例｜本週回看",
      focusId: "R",
      statuses: { S: "中", M: "中", A: "高", R: "低", T: "中" },
      nextStep: "遇到可疑訊息先截圖問家人，不急著點連結",
      reflectNote: "下週最想溫柔支持的是「安全」。",
    },
  ],
};

export const CHAPTER_0307: ChapterOpening = {
  id: "0307",
  qrCode: "0307",
  title: "先把日子過順",
  subtitle: "第三章",
  layout: "three-steps",
  headerEmoji: "🌿",
  accentGradient: CH3_ACCENT,
  quote: "日子先順一點，夢想才有地方安穩落腳。",
  atAGlance:
    "選一個最貼近生活的小任務，請 AI 拆成三個不費力步驟。不必同時改變很多。",
  tryPrompt: "選一件本週想過順的小事，請 AI 拆成三個不費力步驟。",
  reflectPrompt: "完成哪一步，會讓我最有餘裕？",
  reflectPlaceholder: "例如：只要先把回診時間寫進行事曆…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "本頁可完成生活賦能卡。也可進暖暖語音，請它幫您拆成三步；再把最關鍵一步點成光點。",
  practiceWhere: "mixed",
  capabilityNote:
    "拆步驟可用語音；真正過順日子仍在您的生活節奏裡，由您決定做多少。",
  printCardTitle: "日子過順三步卡",
  printCardDescription: "可列印：想過順的小事、三個步驟、最有餘裕的一步。",
  printButtonLabel: "列印三步卡",
  guideTitle: "生活賦能",
  guideDuration: "心法",
  guideParagraphs: [
    "圓夢不一定先從遠方開始。",
    "當作息、飲食、移動與日常安排稍微順一點，心裡才有餘裕。",
    "先把日子過順，不是把夢想縮小，而是替夢想準備站穩的地面。",
  ],
  guideFooterNote: "請先選一件小事並拆成三步。",
  footerGuideLabel: "閱讀生活賦能說明",
  threeStepsDemos: [
    {
      id: "meal",
      label: "案例｜一週採買",
      task: "這週想讓晚餐準備不那麼亂",
      steps: ["先寫三道會做的菜", "只採買這三道的材料", "把其中一天設成「剩菜日」"],
      reflectNote: "寫出三道菜就會最有餘裕。",
    },
  ],
};

export const CHAPTER_0308: ChapterOpening = {
  id: "0308",
  qrCode: "0308",
  title: "再把靈魂點亮",
  subtitle: "第三章",
  layout: "meaning-seed",
  headerEmoji: "🌱",
  accentGradient: CH3_ACCENT,
  quote: "圓夢可以從一份小素材開始，不必等到準備完全。",
  atAGlance:
    "從一張照片、一段口述、一份食譜或未完成願望開始。先替素材取名，寫下「我想留下它，因為＿＿」。",
  tryPrompt: "選一份生命素材，完成一句「我想留下它，因為＿＿」。",
  reflectPrompt: "這份素材想替未來的誰留下一點什麼？",
  reflectPlaceholder: "例如：想留給孫子，讓他知道阿嬤也曾勇敢出發…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "Meaning 種子卡在本頁完成，可列印或點成光點。不需要現在完成長篇作品，也不必公開。",
  practiceWhere: "paper",
  capabilityNote:
    "本頁保存創作種子；完整作品之後在適合的工具慢慢做即可。",
  printCardTitle: "Meaning 種子卡",
  printCardDescription: "可列印：生命素材、我想留下它因為、想留給誰。",
  printButtonLabel: "列印種子卡",
  guideTitle: "Meaning 入口",
  guideDuration: "心法",
  guideParagraphs: [
    "當日子稍微安頓，心裡常會浮出：我還想留下什麼？",
    "作品的價值不在技術，而在承接了您的經驗與關係。",
    "先把日子過順，再把靈魂點亮——兩者彼此支撐。",
  ],
  guideFooterNote: "請先種下一顆種子，不必一次長大。",
  footerGuideLabel: "閱讀 Meaning 說明",
  meaningSeedDemos: [
    {
      id: "recipe",
      label: "案例｜家傳味道",
      material: "媽媽的紅燒獅子頭做法（只記得大概）",
      formHint: "先寫成一頁「家庭食譜卡」",
      because: "想留下家的味道與故事",
      reflectNote: "想留給孩子，讓他們也能煮出記憶中的味道。",
    },
  ],
};

export const CHAPTER_0309: ChapterOpening = {
  id: "0309",
  qrCode: "0309",
  title: "從個人羅盤到共好羅盤",
  subtitle: "第三章",
  layout: "share-intent",
  headerEmoji: "🌏",
  accentGradient: CH3_ACCENT,
  quote: "共好從自願分享開始；私人羅盤不公開、不排名。",
  atAGlance:
    "可以只分享一個方法、一段故事或一次陪伴。SMART RADAR 與 SHI 的私人記錄不應被默認上傳。",
  tryPrompt: "想一件願意分享、又不涉及隱私的小經驗或方法。",
  reflectPrompt: "我希望這份分享為誰帶來什麼幫助？",
  reflectPlaceholder: "例如：希望剛開始用手機的朋友少走一點冤枉路…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "意向卡在本頁完成。目前以私人意向為主；是否參與與分享，永遠由您決定。",
  practiceWhere: "paper",
  capabilityNote:
    "目前以私人意向為主；暖暖不會默認公開您的羅盤或 SHI 分數。",
  printCardTitle: "共好分享意向卡",
  printCardDescription: "可列印：願意分享的經驗、希望幫助誰、我仍想保留的隱私。",
  printButtonLabel: "列印意向卡",
  guideTitle: "共好願景",
  guideDuration: "心法",
  guideParagraphs: [
    "一個人的羅盤先幫助自己站穩；願意分享時，方向也可能連成共好。",
    "參與始終自願，權限與退出方式必須清楚。",
    "科技服務關係，而不是反過來管理人。",
  ],
  guideFooterNote: "請先寫下不涉及隱私的分享意向。",
  footerGuideLabel: "閱讀共好說明",
  shareIntentDemos: [
    {
      id: "tip",
      label: "案例｜分享一個小方法",
      shareWhat: "如何用相簿搜尋找到孫子生日那天的照片",
      forWhom: "剛開始學手機的朋友",
      privacyNote: "不公開家人照片，只分享「怎麼搜尋」的步驟",
      reflectNote: "希望對方少一點挫折、多一點成就感。",
    },
  ],
};

export const CHAPTER_0310: ChapterOpening = {
  id: "0310",
  qrCode: "0310",
  title: "羅盤已定標，從容出發",
  subtitle: "第三章",
  layout: "embark-card",
  headerEmoji: "🚀",
  accentGradient: CH3_ACCENT,
  quote: "羅盤在手，不必一次走完全程；選一個方向，從一小步出發。",
  atAGlance:
    "章末不增加新系統，也不公開分數。完成啟程卡：方向、第一小步、希望 AI 如何陪伴。",
  tryPrompt: "完成啟程卡：我的方向、第一小步、希望 AI 協助的方式。",
  reflectPrompt: "我準備從哪一件可完成的小事出發？",
  reflectPlaceholder: "例如：明天先打一通電話／先整理 5 張照片…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "啟程卡在本頁完成，可列印或點成光點。也可開啟 SMART RADAR，把第一小步放進圓夢藍圖。",
  practiceWhere: "mixed",
  capabilityNote:
    "啟程不公開、不排名；下一週沒前進也不算失敗，隨時可回到羅盤重選。",
  printCardTitle: "Part 2 優雅啟程卡",
  printCardDescription: "可列印：我的方向、第一小步、希望 AI 協助的方式、出發的小事。",
  printButtonLabel: "列印啟程卡",
  guideTitle: "從容出發",
  guideDuration: "章末",
  guideParagraphs: [
    "AI 電梯、SMART、生活／創作夥伴、RADAR、SHI——已連成一條路。",
    "選擇可以改變，路線也可以重選。",
    "Part 2 從這裡啟程：下一步從一件可完成的生活小事開始。",
  ],
  guideFooterNote: "請完成本頁啟程卡，不必一次走完全程。",
  footerGuideLabel: "閱讀從容出發說明",
  embarkDemos: [
    {
      id: "start",
      label: "案例｜從連結出發",
      direction: "S｜分享與連結",
      firstStep: "這週傳一張近況照片給一位老朋友",
      aiHelp: "幫我想一句簡單、溫暖的傳訊開頭",
      reflectNote: "明天就傳，不等到「準備好」。",
    },
  ],
  appDeepLink: { href: "/smart/radar", label: "打開圓夢藍圖，點亮第一個光點 →" },
};

export const CHAPTER_3_OPENINGS: Record<string, ChapterOpening> = {
  "0300": CHAPTER_0300,
  "0301": CHAPTER_0301,
  "0302": CHAPTER_0302,
  "0303": CHAPTER_0303,
  "0304": CHAPTER_0304,
  "0305": CHAPTER_0305,
  "0306": CHAPTER_0306,
  "0307": CHAPTER_0307,
  "0308": CHAPTER_0308,
  "0309": CHAPTER_0309,
  "0310": CHAPTER_0310,
};

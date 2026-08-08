import type { ChapterOpening } from "./chapter-opening";

const CH5_ACCENT = "linear-gradient(180deg, #E8F0FA 0%, #FFF8EE 55%)";

export const CHAPTER_0500: ChapterOpening = {
  id: "0500",
  qrCode: "0500",
  title: "理財防詐：數位叢林的安心保鑣",
  subtitle: "第五章｜章節開篇",
  layout: "routes",
  headerEmoji: "🛡",
  accentGradient: CH5_ACCENT,
  quote: "防詐不是把世界關起來，而是讓信任有根據。",
  atAGlance:
    "本章練習優雅過濾：先暫停，後查證；先驗證，再信任。AI 是冷靜參謀，不是投資顧問，也不是身分驗證工具。",
  tryPrompt: "圈出一個最容易讓自己緊張的數位情境：電話、簡訊、親友求助或投資邀約。",
  reflectPrompt: "我最需要在哪一種情境先慢一秒？",
  reflectPlaceholder: "例如：接到自稱銀行的電話時，我最需要先慢一秒…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "可先讀章首導讀並選路線；也可開啟「安心保鑣」練習先暫停與查證。真正可信的確認，要回到官方或自己原本保存的管道。",
  practiceWhere: "mixed",
  capabilityNote:
    "路線與練習卡可在本頁完成；暖暖另有「安心保鑣」私密練習（非自動偵測詐騙）。",
  printCardTitle: "安心保鑣路線卡",
  printCardDescription: "可列印：最容易緊張的情境與想先慢一秒的地方。",
  printButtonLabel: "列印路線卡",
  guideTitle: "章首導讀｜理財防詐",
  guideDuration: "約 2 分鐘",
  guideParagraphs: [
    "到了 55+，財富不只是帳戶數字，也代表不想再被打亂的心。",
    "詐騙利用急迫、恐懼或期待推動立刻行動；我們練習先暫停、後查證。",
    "真正的安全，是帶著判斷力穩穩走進數位叢林。",
  ],
  guideFooterNote: "章首導讀請先閱讀以上文字，再選一條練習路線。",
  footerGuideLabel: "閱讀 2 分鐘章首導讀",
  entries: [
    { id: "phone", label: "電話", hint: "假客服／假官方", emoji: "📞", href: "/smart/chapter/0504" },
    { id: "sms", label: "簡訊", hint: "先停、不點連結", emoji: "💬", href: "/smart/chapter/0502" },
    { id: "family", label: "親友求助", hint: "打原本電話確認", emoji: "👨‍👩‍👧", href: "/smart/chapter/0504" },
    { id: "invest", label: "投資邀約", hint: "保證獲利先煞車", emoji: "📈", href: "/smart/chapter/0503" },
  ],
  appDeepLink: { href: "/smart/fraud", label: "打開安心保鑣練習 →" },
};

export const CHAPTER_0501: ChapterOpening = {
  id: "0501",
  qrCode: "0501",
  title: "從恐懼躲避到優雅過濾",
  subtitle: "第五章",
  layout: "verify-first",
  headerEmoji: "🕊",
  accentGradient: CH5_ACCENT,
  quote: "防詐不是不信任世界，而是先驗證，再信任。",
  atAGlance:
    "更成熟的信任方式，不是立刻相信，也不是懷疑一切，而是先驗證，再信任。慢一秒是把主導權拿回來。",
  tryPrompt: "完成一句：我願意先＿＿＿＿，再＿＿＿＿。",
  reflectPrompt: "哪一種情境最容易讓我忘記先查證？",
  reflectPlaceholder: "例如：聽到「保證獲利」時最容易忘記先查證…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "本頁完成防詐心法改寫即可。AI 可協助拆解一般話術，不能替您確認對方身分或做投資決定。",
  practiceWhere: "paper",
  capabilityNote:
    "心法卡在本頁／紙本完成。暖暖不是官方驗證或投資顧問。",
  printCardTitle: "我的防詐心法卡",
  printCardDescription: "可列印：我願意先…再…、容易忘記查證的情境。",
  printButtonLabel: "列印心法卡",
  guideTitle: "優雅過濾",
  guideDuration: "心法",
  guideParagraphs: [
    "謹慎可以理解；但若把整個世界關起來，生活也會縮小。",
    "當訊息讓心跳加快，先慢一秒；當話術讓人不安，先回到可信管道。",
    "經過查證後仍能安心前進，才是真正的信任。",
  ],
  guideFooterNote: "請先完成「我願意先…再…」。",
  footerGuideLabel: "閱讀優雅過濾說明",
  verifyFirstDemos: [
    {
      id: "pause",
      label: "案例｜先暫停再查證",
      firstAction: "暫停、不點連結",
      thenAction: "用自己保存的官方電話查證",
      reflectNote: "接到自稱銀行的電話時，最容易忘記先查證。",
    },
  ],
};

export const CHAPTER_0502: ChapterOpening = {
  id: "0502",
  qrCode: "0502",
  title: "先暫停，後查證",
  subtitle: "第五章",
  layout: "pause-reflex",
  headerEmoji: "✋",
  accentGradient: CH5_ACCENT,
  quote: "防詐第一步不是判斷真假，而是先暫停。",
  atAGlance:
    "可疑訊息出現時：先不要點、不要回、不要輸入帳密或驗證碼。真正的機會不怕查證。",
  tryPrompt: "記住：先截圖，後提問；沒確認前，絕不點擊。圈出最需要練習的一項。",
  reflectPrompt: "我最需要練習的是不點、不回，還是不輸入？",
  reflectPlaceholder: "例如：我最需要練習「不點連結」…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "本頁完成第一反射練習；也可進「安心保鑣」複習先暫停。真實截圖請先遮蔽個資。",
  practiceWhere: "mixed",
  capabilityNote:
    "練習用模擬訊息即可。暖暖不自動判斷簡訊真偽；真實截圖請先遮蔽個資、金額與網址。",
  printCardTitle: "防詐第一反射卡",
  printCardDescription: "可列印：不點／不回／不輸入、我最需要練習的一項。",
  printButtonLabel: "列印第一反射卡",
  guideTitle: "手指停住的一秒",
  guideDuration: "約 30 秒文字版",
  guideParagraphs: [
    "詐騙常讓人來不及想：帳戶即將凍結、今天不處理就罰款、親友急需用錢。",
    "只要跟著對方節奏走，主導權就不在自己手上。",
    "防詐不是比誰反應快，而是願意慢一秒。",
  ],
  guideFooterNote: "請先圈出最需要練習的一項；也可進「安心保鑣」複習。",
  footerGuideLabel: "閱讀先暫停說明",
  pauseReflexOptions: [
    { id: "no-click", label: "不點", hint: "不點陌生連結、不掃不明 QR" },
    { id: "no-reply", label: "不回", hint: "不回覆要求個資或匯款的訊息" },
    { id: "no-input", label: "不輸入", hint: "不輸入帳密、驗證碼、身分資料" },
  ],
  pauseReflexDemos: [
    {
      id: "freeze",
      label: "案例｜帳戶即將凍結",
      focusId: "no-click",
      reflectNote: "最需要練習的是不點連結，先打原本銀行電話。",
    },
  ],
  appDeepLink: { href: "/smart/fraud", label: "打開安心保鑣｜先暫停練習 →" },
};

export const CHAPTER_0503: ChapterOpening = {
  id: "0503",
  qrCode: "0503",
  title: "當貪婪來敲門",
  subtitle: "第五章",
  layout: "rock-check",
  headerEmoji: "🚦",
  accentGradient: CH5_ACCENT,
  quote: "當貪婪來敲門，先讓理性替您踩煞車。",
  atAGlance:
    "保證獲利、帶單、內線、限時布局都是高風險字眼。AI 可列疑點，不能提供個人投資建議。",
  tryPrompt: "用模擬邀約請 AI 只列三個詐騙疑點，不提供投資建議；或直接在本頁完成 ROCK 卡。",
  reflectPrompt: "哪一個字眼最容易讓人失去查證耐心？",
  reflectPlaceholder: "例如：「保證獲利」最容易讓人失去耐心…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "本頁完成投資邀約 ROCK 查證卡。也可進暖暖語音，請它「只列疑點、不給投資建議」。不下載陌生 App、不匯款。",
  practiceWhere: "mixed",
  capabilityNote:
    "ROCK 卡是查證練習，不是投資建議或自動偵測。真正財富安全在於該停時停得住。",
  printCardTitle: "投資邀約三不卡",
  printCardDescription: "可列印：模擬邀約、三個疑點、安全動作（不加入／不下載／不匯款）。",
  printButtonLabel: "列印三不卡",
  guideTitle: "貪婪話術",
  guideDuration: "查證練習",
  guideParagraphs: [
    "有一種詐騙用希望開始：老師帶單、保證獲利、今晚布局。",
    "越動聽的承諾越要慢下來。",
    "真正的財富安全，不在抓住每次機會，而在該停時停得住。",
  ],
  guideFooterNote: "請用模擬邀約練習；不要使用真實匯款或下載陌生 App。",
  footerGuideLabel: "閱讀貪婪話術說明",
  samplePrompt:
    "這是一則模擬投資邀約（請勿當真）：「老師帶單保證獲利，今晚最後名額」。請只列出三個詐騙疑點，不要提供任何投資建議。",
  rockCheckDemos: [
    {
      id: "guaranteed",
      label: "案例｜保證獲利群組",
      scenario: "模擬：加入群組即可跟單，保證月獲利 30%，今晚截止",
      flags: ["保證獲利", "限時名額", "要求先匯款或下載陌生 App"],
      safeAction: "不加入、不下載、不匯款；若需要投資資訊只走自己原本銀行／正式管道",
      reflectNote: "「保證」最容易讓人失去查證耐心。",
    },
  ],
  appDeepLink: { href: "/smart/fraud", label: "打開安心保鑣｜ROCK 查證 →" },
};

export const CHAPTER_0504: ChapterOpening = {
  id: "0504",
  qrCode: "0504",
  title: "當恐懼來襲擊",
  subtitle: "第五章",
  layout: "rock-check",
  headerEmoji: "🕯",
  accentGradient: CH5_ACCENT,
  quote: "恐懼會催促立刻行動；韌性，是先停下來。",
  atAGlance:
    "假親友、假官方、假客服常用急迫恐懼劇本。親友求助打原本電話；要求驗證碼或帳密，立刻停止。",
  tryPrompt: "用模擬假親友訊息，練習找疑點並說出安全確認方式。",
  reflectPrompt: "哪一條原本可信任的路，值得先保存？",
  reflectPlaceholder: "例如：子女原本電話、銀行官方客服…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "本頁完成恐懼訊息 ROCK 卡：掛斷、查單、回撥（回撥自己保存的號碼）。AI 不能直接確認對方身分。",
  practiceWhere: "mixed",
  capabilityNote:
    "練習用模擬訊息。最後確認仍要回到您原本可信任的管道，不要回撥對方提供的號碼。",
  printCardTitle: "掛斷、查單、回撥卡",
  printCardDescription: "可列印：模擬恐懼訊息、疑點、安全確認方式。",
  printButtonLabel: "列印回撥卡",
  guideTitle: "恐懼劇本",
  guideDuration: "查證練習",
  guideParagraphs: [
    "恐懼一來，大腦容易只想立刻解決問題。",
    "越急，越要停。",
    "AI 可看語氣、找漏洞，不能直接確認對方身分。",
  ],
  guideFooterNote: "請用模擬訊息練習；不要輸入真實驗證碼。",
  footerGuideLabel: "閱讀恐懼劇本說明",
  samplePrompt:
    "這是一則模擬假親友訊息（請勿當真）：「媽，我換號了，急用三萬，先轉到這個帳號」。請只列出疑點，並告訴我安全確認方式。不要要求我提供任何個資。",
  rockCheckDemos: [
    {
      id: "fake-family",
      label: "案例｜假親友換號",
      scenario: "模擬：子女換號急需用錢，要求立刻轉帳",
      flags: ["突然換號", "急迫匯款", "不願意視訊或打原本電話"],
      safeAction: "掛斷／不回；打原本保存的電話確認；不轉帳到陌生帳號",
      reflectNote: "值得先保存的是子女原本電話。",
    },
  ],
  appDeepLink: { href: "/smart/fraud", label: "打開安心保鑣｜恐懼訊息查證 →" },
};

export const CHAPTER_0505: ChapterOpening = {
  id: "0505",
  qrCode: "0505",
  title: "練出防詐肌肉",
  subtitle: "第五章",
  layout: "muscle-record",
  headerEmoji: "💪",
  accentGradient: CH5_ACCENT,
  quote: "AI 是陪練教練；真正要長出的是自己的判斷力。",
  atAGlance:
    "貪婪劇本與恐懼劇本都有相似模式。每一次沒有急著點擊、加入或匯款，都是主導權的累積。",
  tryPrompt: "寫下一種已經能辨識的詐騙話術與自己的安全動作。",
  reflectPrompt: "哪一個警訊，我現在已經能一眼認出？",
  reflectPlaceholder: "例如：一看到「保證獲利」我就會停下來…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "本頁完成防詐肌肉紀錄。可把「我停下來查證」點成圓夢藍圖 R（安全）光點。",
  practiceWhere: "paper",
  capabilityNote:
    "紀錄卡在本頁完成；可持續累積請用圓夢藍圖點亮 R＝安全。",
  printCardTitle: "防詐肌肉紀錄卡",
  printCardDescription: "可列印：已能辨識的話術、我的安全動作、一眼認出的警訊。",
  printButtonLabel: "列印肌肉卡",
  guideTitle: "從陪練到直覺",
  guideDuration: "心法",
  guideParagraphs: [
    "一開始需要 AI 指出疑點很正常。",
    "AI 的角色是陪練，不是讓人永遠依賴答案。",
    "把看懂的模式留下來，就能練出自己的識讀直覺。",
  ],
  guideFooterNote: "請寫下一種已能辨識的話術與安全動作。",
  footerGuideLabel: "閱讀防詐肌肉說明",
  muscleRecordDemos: [
    {
      id: "muscle",
      label: "案例｜已能辨識",
      scamPattern: "保證獲利／老師帶單／限時布局",
      safeAction: "不加入群組、不匯款、先跟家人討論",
      reflectNote: "一看到「保證」就能一眼認出要煞車。",
    },
  ],
  appDeepLink: { href: "/smart/radar", label: "打開圓夢藍圖，點亮 R＝安全 →" },
};

export const CHAPTER_0506: ChapterOpening = {
  id: "0506",
  qrCode: "0506",
  title: "建立信任資料庫",
  subtitle: "第五章",
  layout: "trust-lists",
  headerEmoji: "🗂",
  accentGradient: CH5_ACCENT,
  quote: "防詐靠清單；信任靠驗證。",
  atAGlance:
    "黑名單記可疑話術與風險特徵；白名單記親自確認過的官方電話與可信管道。不要記錄密碼、驗證碼或完整金融帳號。",
  tryPrompt: "建立兩則私密筆記：防詐黑名單與信任白名單（低敏感摘要即可）。",
  reflectPrompt: "哪一項資料適合保存，哪一項絕不能寫進去？",
  reflectPlaceholder: "例如：可記官方客服電話；絕不能記密碼與驗證碼…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "本頁可先寫摘要；完整私密清單請用「安心保鑣」（僅存在您的裝置瀏覽器，不上傳）。",
  practiceWhere: "mixed",
  capabilityNote:
    "清單不是密碼本。安心保鑣的黑白名單預設只存在本機，不作自動偵測或雲端封鎖。",
  printCardTitle: "黑白名單雙卡",
  printCardDescription: "可列印：黑名單摘要、白名單摘要、絕不能寫進去的項目。",
  printButtonLabel: "列印雙卡",
  guideTitle: "信任資料庫",
  guideDuration: "說明",
  guideParagraphs: [
    "查完就忘，下次仍要重新開始。",
    "黑名單提醒避開哪種劇本，白名單提醒真正可信的路。",
    "防詐不靠運氣，信任不靠感覺。",
  ],
  guideFooterNote: "請先寫兩則低敏感摘要，再到安心保鑣建立清單。",
  footerGuideLabel: "閱讀信任資料庫說明",
  trustListsDemos: [
    {
      id: "lists",
      label: "案例｜兩則摘要",
      blackSummary: "保證獲利群組、假銀行凍結簡訊",
      whiteSummary: "子女原電話、A 銀行官網查到的客服電話",
      reflectNote: "可記官方電話；絕不能記密碼與驗證碼。",
    },
  ],
  appDeepLink: { href: "/smart/fraud", label: "打開安心保鑣｜建立黑白名單 →" },
};

export const CHAPTER_0507: ChapterOpening = {
  id: "0507",
  qrCode: "0507",
  title: "防詐黑名單：看過一次，就增加免疫力",
  subtitle: "第五章",
  layout: "list-entry",
  headerEmoji: "🚫",
  accentGradient: CH5_ACCENT,
  quote: "記下騙術模式，讓一次查證變成下一次的免疫力。",
  atAGlance:
    "黑名單記錄劇本類型、可疑特徵與安全動作，不是危險連結或完整個資。提醒家人時只分享風險特徵。",
  tryPrompt: "新增一筆低敏感黑名單：類型、特徵、安全行動。",
  reflectPrompt: "如何提醒家人，又不把危險內容傳出去？",
  reflectPlaceholder: "例如：只說「親友換號借錢要打原本電話」，不傳連結…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "本頁完成一筆後，可同步寫進安心保鑣黑名單（本機保存）。不要轉傳可疑連結或未遮蔽截圖。",
  practiceWhere: "mixed",
  capabilityNote:
    "低敏感模式摘要即可。暖暖不會幫您封鎖號碼或自動抓詐騙。",
  printCardTitle: "低敏感黑名單卡",
  printCardDescription: "可列印：類型、特徵、安全行動、如何低風險提醒家人。",
  printButtonLabel: "列印黑名單卡",
  guideTitle: "數位標本牆",
  guideDuration: "實作",
  guideParagraphs: [
    "刪除與封鎖可以讓今天安靜；記下模式才能增加免疫力。",
    "投資詐騙常用保證與限時；假親友常用換號與急需用錢。",
    "記錄是為了未來警覺。",
  ],
  guideFooterNote: "請新增一筆低敏感黑名單。",
  footerGuideLabel: "閱讀黑名單說明",
  listEntryMode: "blacklist",
  listEntryDemos: [
    {
      id: "black",
      label: "案例｜假客服",
      entryType: "假官方／假客服",
      features: "帳戶異常、要求立即驗證、提供對方電話要你回撥",
      safeAction: "不回撥對方號碼；自己查官網客服",
      reflectNote: "提醒家人時只說特徵，不傳對方號碼或連結。",
    },
  ],
  appDeepLink: { href: "/smart/fraud", label: "打開安心保鑣｜新增黑名單 →" },
};

export const CHAPTER_0508: ChapterOpening = {
  id: "0508",
  qrCode: "0508",
  title: "信任白名單：只走確認過的安全路",
  subtitle: "第五章",
  layout: "list-entry",
  headerEmoji: "✅",
  accentGradient: CH5_ACCENT,
  quote: "對方自稱不算；您驗證過，才算。",
  atAGlance:
    "白名單保存親自確認過的路：親友原本電話、銀行官方客服、正式網站。可疑來電先掛斷，再用白名單主動查證。",
  tryPrompt: "新增一筆可信對象、確認方式與聯絡摘要。",
  reflectPrompt: "我有哪些重要管道還沒有親自確認？",
  reflectPlaceholder: "例如：常用銀行的官方客服電話還沒親自查過…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "本頁完成一筆後，可寫進安心保鑣白名單。不要回撥對方提供的號碼；白名單不是密碼本。",
  practiceWhere: "mixed",
  capabilityNote:
    "只記您親自確認過的低敏感摘要。不要記錄密碼、驗證碼或完整金融帳號。",
  printCardTitle: "白名單安全路卡",
  printCardDescription: "可列印：可信對象、確認方式、聯絡摘要。",
  printButtonLabel: "列印白名單卡",
  guideTitle: "主動回撥習慣",
  guideDuration: "實作",
  guideParagraphs: [
    "聽起來像、Logo 像、號碼像，都不代表真的。",
    "可疑電話先掛斷，可疑訊息先不回，再打開白名單主動查證。",
    "真正的信任，要由自己的驗證決定。",
  ],
  guideFooterNote: "請新增一筆親自確認過的白名單。",
  footerGuideLabel: "閱讀白名單說明",
  listEntryMode: "whitelist",
  listEntryDemos: [
    {
      id: "white",
      label: "案例｜銀行客服",
      entryType: "A 銀行官方客服",
      features: "從銀行官網／信用卡背面親自查到的電話",
      safeAction: "可疑來電先掛斷，再用此號碼回撥",
      reflectNote: "另一家常用銀行的客服電話也要親自確認。",
    },
  ],
  appDeepLink: { href: "/smart/fraud", label: "打開安心保鑣｜新增白名單 →" },
};

export const CHAPTER_0509: ChapterOpening = {
  id: "0509",
  qrCode: "0509",
  title: "家族資安週報",
  subtitle: "第五章",
  layout: "family-weekly",
  headerEmoji: "☂",
  accentGradient: CH5_ACCENT,
  quote: "防詐可以成為家族之間的互信與照顧。",
  atAGlance:
    "週末只回看三件事：新騙術、更新的安全紀錄、想提醒家人的一句話。不放電話、帳號、網址、金額或個資。",
  tryPrompt: "完成三句低風險週報，不放電話、帳號、網址、金額或個資。",
  reflectPrompt: "怎樣的提醒能保護家人，而不增加恐懼？",
  reflectPlaceholder: "例如：溫和提醒「換號借錢先打原本電話」比轉傳截圖更好…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "本頁完成私人週報卡。分享給家人時只送低風險提醒句；這不是健康週報，也不公開截圖。",
  practiceWhere: "paper",
  capabilityNote:
    "家族資安週報是手動低風險提醒，不是自動監控家人裝置。",
  printCardTitle: "家族安全傘週報",
  printCardDescription: "可列印：三句週報、溫和提醒方式。",
  printButtonLabel: "列印週報卡",
  guideTitle: "互信與照顧",
  guideDuration: "檢核",
  guideParagraphs: [
    "這些小動作都在建立信任。",
    "週報不統計金額、不比較成果。",
    "當您能以低風險方式分享經驗，您就是家族的資安守門員。",
  ],
  guideFooterNote: "請完成三句低風險週報。",
  footerGuideLabel: "閱讀家族週報說明",
  familyWeeklyDemos: [
    {
      id: "week",
      label: "案例｜一週三句",
      lines: [
        "看見：保證獲利的投資群組話術",
        "更新：把子女原電話寫進白名單",
        "提醒家人：親友換號借錢，先打原本電話確認",
      ],
      reflectNote: "溫和提醒比轉傳可怕截圖更能保護家人。",
    },
  ],
};

export const CHAPTER_0510: ChapterOpening = {
  id: "0510",
  qrCode: "0510",
  title: "點亮信賴與韌性",
  subtitle: "第五章",
  layout: "tr-light",
  headerEmoji: "💡",
  accentGradient: CH5_ACCENT,
  quote: "守住信任，不是把世界關起來，而是安全地走出去。",
  atAGlance:
    "T 的光是先驗證再信任；R 的光是風險來時能停下來，回到可信任管道。AI 始終只是冷靜參謀。",
  tryPrompt: "完成點燈卡：我的信賴光點、韌性光點與下一步。",
  reflectPrompt: "哪一句防詐心法，我最想帶進日常？",
  reflectPlaceholder: "例如：先暫停，後查證…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "完成本頁點燈卡後，可到圓夢藍圖點亮 T（信賴科技）與 R（安全）。下一章會把同一份穩定帶到身體照顧。",
  practiceWhere: "mixed",
  capabilityNote:
    "點燈卡在本頁完成；可持續累積請用暖暖圓夢藍圖（不排名、不公開）。",
  printCardTitle: "信賴與韌性點燈卡",
  printCardDescription: "可列印：T 光點、R 光點、下一步與想帶進日常的心法。",
  printButtonLabel: "列印點燈卡",
  guideTitle: "信任防線",
  guideDuration: "章末",
  guideParagraphs: [
    "看到可疑訊息先停，投資邀約先查，親友求助打原本電話。",
    "看過的騙術進黑名單，可信的路進白名單。",
    "守住財富，也是守住一顆安定的心。",
  ],
  guideFooterNote: "請完成 T／R 點燈卡。",
  footerGuideLabel: "閱讀點燈說明",
  trLightDemos: [
    {
      id: "lights",
      label: "案例｜兩盞燈",
      trustAction: "重要通知只走白名單裡自己確認過的管道",
      resilienceAction: "心跳加快時先暫停，不點、不回、不輸入",
      reflectNote: "最想帶進日常的是：先暫停，後查證。",
    },
  ],
  appDeepLink: { href: "/smart/radar", label: "打開圓夢藍圖，點亮 T／R 光點 →" },
};

export const CHAPTER_5_OPENINGS: Record<string, ChapterOpening> = {
  "0500": CHAPTER_0500,
  "0501": CHAPTER_0501,
  "0502": CHAPTER_0502,
  "0503": CHAPTER_0503,
  "0504": CHAPTER_0504,
  "0505": CHAPTER_0505,
  "0506": CHAPTER_0506,
  "0507": CHAPTER_0507,
  "0508": CHAPTER_0508,
  "0509": CHAPTER_0509,
  "0510": CHAPTER_0510,
};

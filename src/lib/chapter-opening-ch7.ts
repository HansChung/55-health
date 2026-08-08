import type { ChapterOpening } from "./chapter-opening";

const CH7_ACCENT = "linear-gradient(180deg, #EAF2F8 0%, #FFF8EE 55%)";

export const CHAPTER_0700: ChapterOpening = {
  id: "0700",
  qrCode: "0700",
  title: "城市漫遊｜一日生活圈的數位優雅",
  subtitle: "第七章｜章節開篇",
  layout: "routes",
  headerEmoji: "🏙",
  accentGradient: CH7_ACCENT,
  quote: "安心，比效率更重要；餘裕，比塞滿更珍貴。",
  atAGlance:
    "本章路線：彩排一天 → 安放時間與票券 → 找到安心路線 → 優雅重排 → 留下見聞。AI 是行前參謀，不是替您決定生活的人。",
  tryPrompt:
    "從一個熟悉或想念的地方開始，圈出今天想先走的一小步。不必一次走很遠。",
  reflectPrompt: "我想先重新走近哪一個城市角落？",
  reflectPlaceholder: "例如：想去很久的那間書店，或熟悉又有點陌生的街區…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "可先讀章首導讀並選路線。Calendar、Wallet、Maps 是安放工具，不是炫技；實際資訊以官方與現場為準。",
  practiceWhere: "mixed",
  capabilityNote:
    "路線與練習卡可在本頁完成；提問可進暖暖。暖暖不是旅遊規劃 App，也不自動同步 Calendar／Wallet／Maps。",
  printCardTitle: "城市漫遊路線卡",
  printCardDescription: "可列印：想先走近的城市角落與今天路線。",
  printButtonLabel: "列印路線卡",
  guideTitle: "章首導讀｜城市漫遊",
  guideDuration: "約 2 分鐘",
  guideParagraphs: [
    "上一章，我們學會用更溫柔的方式照顧身體動能。當身體比較穩了，下一個問題自然出現：這份穩定，可以帶我走向哪裡？",
    "城市不一定是遠方。很多時候，它只是被我們暫時收進生活半徑之外——不是不想去，而是出門多了幾層阻力。",
    "Chapter 7 要做的，不是把出門變成任務，而是讓城市重新變得可親近。一日生活圈不必塞滿行程。有呼吸、有選擇、有餘裕，就很好。",
  ],
  guideFooterNote: "章首導讀請先閱讀以上文字，再選一條練習路線。",
  footerGuideLabel: "閱讀 2 分鐘章首導讀",
  entries: [
    {
      id: "rehearse",
      label: "行前彩排",
      hint: "先看清楚一天",
      emoji: "🎭",
      href: "/smart/chapter/0701",
    },
    {
      id: "settle",
      label: "時間票券",
      hint: "安放與通行",
      emoji: "🗓",
      href: "/smart/chapter/0703",
    },
    {
      id: "circle",
      label: "一日生活圈",
      hint: "指南與重排",
      emoji: "🛤",
      href: "/smart/chapter/0706",
    },
    {
      id: "keep",
      label: "數位見聞",
      hint: "溫柔留下來",
      emoji: "📔",
      href: "/smart/chapter/0709",
    },
  ],
};

export const CHAPTER_0701: ChapterOpening = {
  id: "0701",
  qrCode: "0701",
  title: "城市不是遠方，是重新打開的生活圈",
  subtitle: "第七章｜第一節",
  layout: "city-radius",
  headerEmoji: "🚪",
  accentGradient: CH7_ACCENT,
  quote: "城市不是遠方，而是可以一步一步重新打開的生活圈。",
  atAGlance:
    "當出門阻力被整理，世界就會重新靠近。一日生活圈不一定要很多行程；重點是重新感覺到：我還可以和城市連上線。",
  tryPrompt: "寫下我的生活半徑起點：我想重新打開的城市角落是＿＿＿＿。",
  reflectPrompt: "我知道城市漫遊不是旅行比賽嗎？",
  reflectPlaceholder: "例如：重點不是走多遠，而是重新和城市連上線…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "本頁完成生活半徑起點卡。AI 是行前參謀，真正選擇的人，仍然是您。",
  practiceWhere: "paper",
  capabilityNote: "起點卡在本頁／紙本完成。暖暖不替您決定去哪裡。",
  printCardTitle: "我的生活半徑起點卡",
  printCardDescription: "可列印：想重新走近的地方，以及它對自己的生活意義。",
  printButtonLabel: "列印起點卡",
  guideTitle: "重新打開",
  guideDuration: "心法",
  guideParagraphs: [
    "有時候，我們不是不想出門，而是出門變得比以前多了幾層阻力。",
    "原本熟悉的城市，慢慢變得像遠方。也許只是我們需要一種新的方式，把生活半徑重新打開。",
    "這一站先不急著規劃完整行程，只先問：我想重新打開哪一個生活角落？",
  ],
  guideFooterNote: "請先寫下一個想重新走近的地方。",
  footerGuideLabel: "閱讀生活半徑說明",
  cityRadiusDemos: [
    {
      id: "bookstore",
      label: "案例｜想念的書店",
      place: "巷口那間好久沒去的書店",
      meaning: "想慢慢翻書、坐一下，重新感覺城市還能連上線",
      reflectNote: "城市漫遊不是旅行比賽。",
    },
  ],
};

export const CHAPTER_0702: ChapterOpening = {
  id: "0702",
  qrCode: "0702",
  title: "出發前，先讓 AI 幫您彩排一天",
  subtitle: "第七章｜第一節",
  layout: "day-rehearsal",
  headerEmoji: "🎬",
  accentGradient: CH7_ACCENT,
  quote: "出門前先彩排一天，不是為了控制行程，而是讓自己多一份安心與餘裕。",
  atAGlance:
    "彩排不是把行程塞滿，而是讓心裡先有畫面：出發、交通、休息點、備案，以及什麼情況下可以放慢或改期。",
  tryPrompt:
    "寫下我的一日彩排句：我想請 AI 幫我彩排「從＿＿＿＿到＿＿＿＿」的一日生活圈。",
  reflectPrompt: "我知道彩排不是把行程塞滿嗎？",
  reflectPlaceholder: "例如：實際交通與開放時間仍要以官方為準…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "可複製彩排提問句到暖暖。實際交通、開放時間與活動資訊，仍要以官方 App、主辦單位與現場公告為準。",
  practiceWhere: "mixed",
  capabilityNote:
    "彩排卡可在本頁完成；提問可進暖暖。暖暖不保證資訊正確，也不自動查票或導航。",
  printCardTitle: "我的一日彩排卡",
  printCardDescription: "可列印：目的地、出發節奏、休息點、備案與官方確認事項。",
  printButtonLabel: "列印彩排卡",
  guideTitle: "先看清楚",
  guideDuration: "流程",
  guideParagraphs: [
    "想出門，最累的常常不是走路，而是出門前腦中那一串問題。",
    "AI 可以成為溫和的行前參謀：幫您把一天先彩排一遍，但不替您決定去哪裡。",
    "當您知道大概怎麼去、累了可以在哪裡停、變數來了還有第二種安排，出門就比較像生活選擇。",
  ],
  guideFooterNote: "請完成目的地、休息點、備案與官方確認。",
  footerGuideLabel: "閱讀一日彩排說明",
  samplePrompt:
    "請幫我彩排一個有餘裕的一日生活圈：從家附近到目的地。請整理出發時間建議、交通方式、停留節奏、休息點、一個備案，以及什麼情況下可以放慢或改期。請用簡單中文，不要把行程塞滿，也不要替我決定一定要去。實際資訊請提醒我向官方確認。",
  dayRehearsalDemos: [
    {
      id: "museum",
      label: "案例｜展覽半日",
      fromPlace: "住家附近",
      toPlace: "市中心展覽館",
      restPoint: "館內咖啡座或附近公園長椅",
      backup: "人太多就改去附近書店坐一下",
      officialCheck: "開館時間、交通轉乘、是否需預約票",
      reflectNote: "彩排不是把行程塞滿。",
    },
  ],
};

export const CHAPTER_0703: ChapterOpening = {
  id: "0703",
  qrCode: "0703",
  title: "Calendar：把重要時刻安放好",
  subtitle: "第七章｜第二節",
  layout: "moment-place",
  headerEmoji: "📅",
  accentGradient: CH7_ACCENT,
  quote: "Calendar 不是把一天塞滿，而是讓重要時刻有地方安放。",
  atAGlance:
    "優雅不是慢慢來，而是不再被時間追著跑。出門、抵達、活動、休息與回程，都可以先放進一天的節奏裡。",
  tryPrompt: "安放我的重要時刻：我想安放的活動是＿＿＿＿。",
  reflectPrompt: "我知道 Calendar 不是用來把一天塞滿嗎？",
  reflectPlaceholder: "例如：時間被安放好，出門就少了一層慌張…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "本頁完成重要時刻安放卡。請自行寫進手機 Calendar；實際開放與交通時間仍以官方為準。",
  practiceWhere: "mixed",
  capabilityNote:
    "安放卡在本頁完成；請用手機系統 Calendar 自行建立行程。暖暖不會自動寫入日曆。",
  printCardTitle: "我的重要時刻安放卡",
  printCardDescription: "可列印：活動、出門、抵達、休息與回程時間。",
  printButtonLabel: "列印安放卡",
  guideTitle: "時間容器",
  guideDuration: "安放",
  guideParagraphs: [
    "很多出門的不安，並不是來自目的地，而是來自「時間沒有被安放好」。",
    "一場展覽不只是開始時間，還包括準備、交通、緩衝、喝茶的餘裕，以及不急不趕的回家路。",
    "這一站練習的不是塞滿，而是讓重要時刻被妥善安放。",
  ],
  guideFooterNote: "請寫下活動與幾個關鍵時間點。",
  footerGuideLabel: "閱讀 Calendar 說明",
  momentPlaceDemos: [
    {
      id: "show",
      label: "案例｜下午展覽",
      activity: "市立美術館特展",
      departAt: "13:00 出門",
      arriveAt: "14:00 前抵達（含緩衝）",
      restAt: "15:30 館內坐一下喝茶",
      returnAt: "17:00 前從容回家",
      reflectNote: "Calendar 不是用來把一天塞滿。",
    },
  ],
};

export const CHAPTER_0704: ChapterOpening = {
  id: "0704",
  qrCode: "0704",
  title: "Wallet：讓票券與通行更從容",
  subtitle: "第七章｜第二節",
  layout: "pass-prep",
  headerEmoji: "🎫",
  accentGradient: CH7_ACCENT,
  quote: "票券先安放好，入口那一刻，就少一點慌張，多一點從容。",
  atAGlance:
    "不是所有票券都能放進 Wallet。出門前先確認：票在哪裡？開得出來嗎？是否需要網路？是否要備截圖或紙本？",
  tryPrompt: "整理我的通行準備：我的票券或通行資訊在＿＿＿＿。",
  reflectPrompt: "我知道 Wallet 不是所有票券都能使用嗎？",
  reflectPlaceholder: "例如：含 QR／付款資訊的截圖，只留在自己可信任的裝置…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "本頁完成通行準備卡。請勿把票券 QR Code、付款資訊或證件交給 AI；以主辦單位規定為準。",
  practiceWhere: "phone",
  capabilityNote:
    "票券整理請在手機 Wallet／主辦 App／截圖完成。暖暖不存放票券，也不處理付款資訊。",
  printCardTitle: "我的通行準備卡",
  printCardDescription: "可列印：票券位置、開啟方式、官方來源與備案（勿寫入完整 QR）。",
  printButtonLabel: "列印通行卡",
  guideTitle: "從容通行",
  guideDuration: "準備",
  guideParagraphs: [
    "出門時最慌張的瞬間，常常不是路遠，而是到了入口才開始找票。",
    "Wallet 的價值是讓通行更從容；但不是所有票券都能放進 Wallet。",
    "練習的不是科技感，而是出門前先確認票在哪、開不開得出來、要不要備案。",
  ],
  guideFooterNote: "請完成票券位置、開啟方式與備案；勿抄寫完整 QR。",
  footerGuideLabel: "閱讀 Wallet 說明",
  passPrepDemos: [
    {
      id: "ticket",
      label: "案例｜展覽票",
      ticketWhere: "主辦 App／Email 票券頁",
      openHow: "入場前先開啟並確認可離線顯示",
      officialSource: "主辦單位官網與票務信",
      backup: "預先截圖（遮蔽多餘個資）或紙本備援",
      reflectNote: "Wallet 不是所有票券都能使用。",
    },
  ],
};

export const CHAPTER_0705: ChapterOpening = {
  id: "0705",
  qrCode: "0705",
  title: "Maps：在陌生城市找到安心角落",
  subtitle: "第七章｜第二節",
  layout: "safe-corner",
  headerEmoji: "🗺",
  accentGradient: CH7_ACCENT,
  quote: "好的路線不只是最快到達，而是途中知道哪裡可以安心停下來。",
  atAGlance:
    "對 55+ 來說，好的城市漫遊不是一路衝到底，而是知道哪裡可以慢下來：座位、咖啡館、公園、明亮出口。",
  tryPrompt: "找到我的安心角落：我想去的地方是＿＿＿＿。",
  reflectPrompt: "我知道最快路線不一定最適合我嗎？",
  reflectPlaceholder: "例如：實際道路與營業時間仍以現場與官方為準…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "本頁完成安心角落地圖卡。請用手機 Maps 自行查看；地點可寫大範圍，不必輸入精確住址。",
  practiceWhere: "mixed",
  capabilityNote:
    "安心角落卡在本頁完成；實際導航請用手機 Maps。暖暖不提供即時路況或自動導航。",
  printCardTitle: "我的安心角落地圖卡",
  printCardDescription: "可列印：目的地、路線、出口、休息點與一個備案。",
  printButtonLabel: "列印安心地圖卡",
  guideTitle: "最安心",
  guideDuration: "地圖",
  guideParagraphs: [
    "城市讓人卻步的原因，有時不是距離，而是不知道到了那裡之後，能不能安心停下來。",
    "Maps 更像一張安心地圖：路線、出口、步行距離、休息點，以及可以調整的備案。",
    "我們不追求最短或最快，只練習找到一條比較安心、有餘裕的路。",
  ],
  guideFooterNote: "請寫下目的地、休息點與一個備案。",
  footerGuideLabel: "閱讀 Maps 說明",
  safeCornerDemos: [
    {
      id: "cafe",
      label: "案例｜展覽附近",
      destination: "市中心展覽館（大範圍即可）",
      routeNote: "捷運出口較近的那一側，少走地下街",
      restSpot: "館外公園長椅／附近咖啡館",
      backup: "下雨就改去騎樓連通的書店",
      reflectNote: "最快路線不一定最適合我。",
    },
  ],
};

export const CHAPTER_0706: ChapterOpening = {
  id: "0706",
  qrCode: "0706",
  title: "建立我的 55+ 活動參與指南",
  subtitle: "第七章｜第三節",
  layout: "activity-guide",
  headerEmoji: "📘",
  accentGradient: CH7_ACCENT,
  quote: "好的活動參與，不是勉強自己跟上，而是先知道什麼節奏適合自己。",
  atAGlance:
    "活動不是任務，是生活選擇。先寫下類型、時長、休息、交通與同行偏好，選擇才會更清楚。",
  tryPrompt: "寫下我的活動參與指南：我喜歡的活動類型是＿＿＿＿。",
  reflectPrompt: "我知道活動參與不是越多越好嗎？",
  reflectPlaceholder: "例如：懂得選擇，就是城市漫遊裡最成熟的自由…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "把指南放在自己找得到的地方。活動資訊、票券與現場規定，仍以主辦單位與官方公告為準。",
  practiceWhere: "paper",
  capabilityNote:
    "活動參與指南在本頁／紙本完成。這不是票務系統，也不自動推薦收費活動。",
  printCardTitle: "我的 55+ 活動參與指南",
  printCardDescription: "可列印：活動類型、時間長度、休息方式、交通偏好與備案。",
  printButtonLabel: "列印活動指南",
  guideTitle: "懂得選擇",
  guideDuration: "指南",
  guideParagraphs: [
    "下一個問題不是「我要去多少地方」，而是：什麼樣的活動，真正適合現在的我？",
    "55+ 的活動參與，不需要勉強自己跟上別人的節奏。",
    "這份指南不是限制，而是讓選擇更清楚。",
  ],
  guideFooterNote: "請完成類型、時長、休息、交通與同行偏好。",
  footerGuideLabel: "閱讀活動指南說明",
  activityGuideDemos: [
    {
      id: "quiet",
      label: "案例｜安靜半日",
      activityType: "展覽、書店、小型講座",
      duration: "單場約 1.5–2 小時，一天不超過兩站",
      restStyle: "中途一定要有座位休息與喝水時間",
      transitPref: "交通簡單、少轉乘；能走就慢慢走",
      companion: "可一人或一位朋友同行",
      reflectNote: "活動參與不是越多越好。",
    },
  ],
};

export const CHAPTER_0707: ChapterOpening = {
  id: "0707",
  qrCode: "0707",
  title: "一句話，生成我的一日生活圈",
  subtitle: "第七章｜第三節",
  layout: "curiosity-ask",
  headerEmoji: "✨",
  accentGradient: CH7_ACCENT,
  quote: "一日生活圈不是把行程塞滿，而是安排一個走得出去、也能從容回來的生活節奏。",
  atAGlance:
    "讓 AI 依照您的活動參與指南整理草案；節奏仍由您決定。地點可寫大範圍，不必輸入精確住址。",
  tryPrompt:
    "生成我的一日生活圈：請依照我的 55+ 活動參與指南，幫我安排一個從＿＿＿＿到＿＿＿＿的一日生活圈。",
  reflectPrompt: "我知道一日生活圈不是行程挑戰嗎？",
  reflectPlaceholder: "例如：能舒服地走出去，再從容地回來，就很好…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "可複製啟動句到暖暖。實際交通、營業時間、票券與活動資訊，仍要以官方來源為準。",
  practiceWhere: "mixed",
  capabilityNote:
    "啟動句可在暖暖語音試用。暖暖產出的是草案，不是即時行程訂票或導航。",
  printCardTitle: "我的一日生活圈生成卡",
  printCardDescription: "可列印：出發範圍、目的地、休息時間、備案與官方確認事項。",
  printButtonLabel: "列印生活圈卡",
  guideTitle: "有餘裕的草案",
  guideDuration: "一句話",
  guideParagraphs: [
    "把前面的準備收成一句話：請幫我安排一個有餘裕的一日生活圈。",
    "最重要的不是去了幾個地方，而是整天走下來，心裡還有餘裕，身體也覺得可以承受。",
    "生活半徑不必一下子打開很大。",
  ],
  guideFooterNote: "請保存一則可重複使用的一日生活圈啟動句。",
  footerGuideLabel: "閱讀一日生活圈說明",
  samplePrompt:
    "請依照我的 55+ 活動參與指南，幫我安排一個有餘裕的一日生活圈。上午不要太早出門，中午附近找個能坐下來的地方，下午安排一個展覽或書店，回程不要太晚，途中保留休息與備案。請用簡單中文，不要把行程塞滿，也不要替我決定。實際交通與開放時間請提醒我向官方確認。地點請用大範圍描述即可。",
  curiosityDemos: [
    {
      id: "day",
      label: "案例｜有餘裕的半日",
      question:
        "請依照我的 55+ 活動參與指南，幫我安排一個從住家附近到市中心書店／展覽的一日生活圈。請保留休息與備案，不要塞滿。",
      aiAnswer:
        "草案：近午出門→捷運到大範圍市中心→書店坐一下→下午短看展覽→傍晚前回。人多就改咖啡館休息。",
      insight: "一日生活圈是走得出去、也能從容回來的節奏。",
    },
  ],
};

export const CHAPTER_0708: ChapterOpening = {
  id: "0708",
  qrCode: "0708",
  title: "變數來了，也能優雅重排",
  subtitle: "第七章｜第三節",
  layout: "elegant-replan",
  headerEmoji: "🌦",
  accentGradient: CH7_ACCENT,
  quote: "優雅重排不是放棄，而是在變數出現時，為自己保留更好的選擇。",
  atAGlance:
    "能改變，不是退縮，是韌性。天氣、交通、人潮或身體提醒出現時，可以縮短、改道，甚至優雅地改天再來。",
  tryPrompt: "寫下我的優雅重排句：如果＿＿＿＿發生，我可以改成＿＿＿＿。",
  reflectPrompt: "我知道行程改變不代表失敗嗎？",
  reflectPlaceholder: "例如：不是取消生活，而是重新安排生活…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "本頁完成優雅重排卡。實際交通、天氣、票券與現場狀況，仍以官方資訊和自己的判斷為準。",
  practiceWhere: "paper",
  capabilityNote:
    "重排卡在本頁完成。暖暖可協助改寫較輕鬆版本，但不監控天氣或現場狀況。",
  printCardTitle: "我的優雅重排卡",
  printCardDescription: "可列印：一個可能變數、兩個備案，以及一句不硬撐提醒。",
  printButtonLabel: "列印重排卡",
  guideTitle: "保留彈性",
  guideDuration: "流程",
  guideParagraphs: [
    "再好的行前彩排，也不可能把所有變數都先排除。",
    "55+ 最成熟的能力，不是照表操課到底，而是知道什麼時候可以調整。",
    "能改變，不是退縮。是讓生活走得更久的韌性。",
  ],
  guideFooterNote: "請寫下一個變數、兩個備案與一句不硬撐提醒。",
  footerGuideLabel: "閱讀優雅重排說明",
  elegantReplanDemos: [
    {
      id: "rain",
      label: "案例｜下雨與人潮",
      trigger: "忽然下雨或展覽人太多",
      planA: "縮短停留，改去附近有座位的咖啡館",
      planB: "把活動優雅改到下一週同一時段",
      softReminder: "今天不適合再硬撐，從容回來也很好",
      reflectNote: "行程改變不代表失敗。",
    },
  ],
};

export const CHAPTER_0709: ChapterOpening = {
  id: "0709",
  qrCode: "0709",
  title: "把一日經歷變成數位見聞錄",
  subtitle: "第七章｜第四節",
  layout: "three-sight",
  headerEmoji: "🖼",
  accentGradient: CH7_ACCENT,
  quote: "數位見聞錄不是社群打卡，而是把一次走出去的生活感，溫柔保存下來。",
  atAGlance:
    "不是炫耀，而是保存：今天看見什麼？哪一刻讓城市又親近一點？想帶回生活裡的是什麼？",
  tryPrompt: "完成我的一日三格見聞：今天我看見的是＿＿＿＿。",
  reflectPrompt: "我知道數位見聞錄不是社群打卡任務嗎？",
  reflectPlaceholder: "例如：保存一次重新走進城市的勇氣…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "本頁完成一日三格見聞卡。請勿公開即時位置、票券 QR、支付資訊或他人清楚臉孔；必要時先模糊或裁切。",
  practiceWhere: "mixed",
  capabilityNote:
    "見聞卡在本頁完成；照片整理請在手機相簿。暖暖不是社群發文工具。",
  printCardTitle: "我的一日三格見聞卡",
  printCardDescription: "可列印：今天看見、今天感受，以及想帶回生活裡的一件小事。",
  printButtonLabel: "列印見聞卡",
  guideTitle: "溫柔保存",
  guideDuration: "沉澱",
  guideParagraphs: [
    "一日生活圈走完之後，城市並不會立刻結束。",
    "每一次願意走出去，都值得被溫柔保存——不是發表，而是留給自己。",
    "城市走過了，也可以被溫柔地留下來。",
  ],
  guideFooterNote: "請完成看見、感受與帶回生活的三格。",
  footerGuideLabel: "閱讀數位見聞說明",
  threeSightDemos: [
    {
      id: "day",
      label: "案例｜三格見聞",
      saw: "書店窗邊那一小片午後光",
      felt: "原來城市還可以這樣慢慢靠近",
      bringHome: "下次出門前，先幫自己安放一個休息點",
      reflectNote: "數位見聞錄不是社群打卡任務。",
    },
  ],
};

export const CHAPTER_0710: ChapterOpening = {
  id: "0710",
  qrCode: "0710",
  title: "點亮城市通行光點，完成 Part 2 賦能",
  subtitle: "第七章｜第四節",
  layout: "city-lights",
  headerEmoji: "🌟",
  accentGradient: CH7_ACCENT,
  quote: "城市通行感，不是走得多遠，而是能安心安排、從容移動、溫柔回來。",
  atAGlance:
    "我可以安排、查證、選擇、重排，也可以留下。AI 仍是行前參謀；真正決定的人，始終是您。",
  tryPrompt: "完成我的城市通行光點：我現在比較能安排的是＿＿＿＿。",
  reflectPrompt: "我知道城市漫遊不是行程挑戰嗎？",
  reflectPlaceholder: "例如：Part 2 到這裡，是多了一份能走出去也能從容回來的力量…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "完成本頁點燈卡後，可到圓夢藍圖點亮相關光點。Part 2 到這裡不是結束，而是賦能的收束。",
  practiceWhere: "mixed",
  capabilityNote:
    "點燈卡在本頁完成；可持續累積請用暖暖圓夢藍圖（不排名、不公開）。",
  printCardTitle: "城市通行光點點燈卡",
  printCardDescription: "可列印：安排、查證、重排、留下四個光點。",
  printButtonLabel: "列印點燈卡",
  guideTitle: "城市通行感",
  guideDuration: "章末／Part 2",
  guideParagraphs: [
    "先彩排一天，安放時間與票券，找到安心角落，再依自己的節奏選擇活動。",
    "變數來了可以優雅重排；城市走過也可以整理成數位見聞錄。",
    "這些合在一起，是一種新的城市通行感：我可以安排、查證、選擇、放慢，也可以把經歷留下來。",
  ],
  guideFooterNote: "請完成安排、查證、重排、留下四個光點。",
  footerGuideLabel: "閱讀城市通行說明",
  cityLightsDemos: [
    {
      id: "lights",
      label: "案例｜四盞燈",
      arrange: "出門前先彩排一天，並安放出發與回程時間",
      verify: "票券、開放時間與路線會向官方來源確認",
      replan: "變數來了可以縮短、改道或改天，不硬撐",
      keep: "用三格見聞溫柔保存走出去的感覺",
      reflectNote: "城市漫遊不是行程挑戰。",
    },
  ],
  appDeepLink: {
    href: "/smart/radar",
    label: "打開圓夢藍圖，點亮城市通行光點 →",
  },
};

export const CHAPTER_7_OPENINGS: Record<string, ChapterOpening> = {
  "0700": CHAPTER_0700,
  "0701": CHAPTER_0701,
  "0702": CHAPTER_0702,
  "0703": CHAPTER_0703,
  "0704": CHAPTER_0704,
  "0705": CHAPTER_0705,
  "0706": CHAPTER_0706,
  "0707": CHAPTER_0707,
  "0708": CHAPTER_0708,
  "0709": CHAPTER_0709,
  "0710": CHAPTER_0710,
};

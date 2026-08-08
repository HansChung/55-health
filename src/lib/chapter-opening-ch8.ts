import type { ChapterOpening } from "./chapter-opening";

const CH8_ACCENT = "linear-gradient(180deg, #F3EEE4 0%, #FFF8EE 55%)";
const CH8_DISCLAIMER =
  "本章提供一般性資訊整理與決策學習，不構成投資、法律、稅務或其他專業建議；不推薦商品、不預測報酬。";

export const CHAPTER_0800: ChapterOpening = {
  id: "0800",
  qrCode: "0800",
  title: "財富智囊｜把複雜選擇放上自己的決策桌",
  subtitle: "第八章｜章節開篇",
  layout: "decision-start",
  headerEmoji: "🧭",
  accentGradient: CH8_ACCENT,
  quote: "資訊可以由人工智慧整理；生活的答案，不能外包。",
  atAGlance:
    "本章路線：從真正問題、可信來源與生活底線出發，經過比較、壓力測試與專業確認，最後留下一頁可以重看的決策備忘錄。" +
    CH8_DISCLAIMER,
  tryPrompt:
    "先留下一個真實問題：我最近反覆思考的重要選擇、它真正影響的生活，以及今天最想先看清楚的事。",
  reflectPrompt: "資料變多時，我是更踏實，還是更容易被催促？",
  reflectPlaceholder: "例如：資料愈多，我愈容易被「現在不做就來不及」推動…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "暖暖將從這個真實問題開始，一次只問一題；紙本閱讀時，也可以直接把答案留在本頁。" +
    CH8_DISCLAIMER,
  practiceWhere: "mixed",
  capabilityNote:
    "問題卡與路線可在本頁完成；提問可進暖暖。暖暖不推薦商品、不預測報酬，也不替您做財務決定。",
  printCardTitle: "我的真實問題卡",
  printCardDescription: "可列印：重要選擇、真正影響的生活，以及今天最想先看清楚的事。",
  printButtonLabel: "列印問題卡",
  guideTitle: "章首導讀｜財富智囊",
  guideDuration: "約 2 分鐘",
  guideParagraphs: [
    "真正讓人猶豫的，往往不只是費用或期限，而是幾年後的生活：想陪家人旅行時是否仍有餘裕？臨時需要支援家人時能否從容？情況改變後，是否還保有退出與重新選擇的空間？",
    "重要的財務決定，表面上在比較方案，實際上是在安排未來的自由。AI 可以整理資料、標出差異、協助提出問題；它不知道哪些日常最值得守住，也不能替任何人承擔決定後的生活。",
    "本章不推薦商品、不預測報酬，也不要求立刻做出結論。十個小步會陪您走到一頁可以重看的決策備忘錄。",
  ],
  guideFooterNote: "章首導讀請先閱讀以上文字；留下一個真實問題後，再選路線。",
  footerGuideLabel: "閱讀 2 分鐘章首導讀",
  entries: [
    {
      id: "seat",
      label: "問題主位",
      hint: "先說清楚要守住什麼",
      emoji: "🪑",
      href: "/smart/chapter/0801",
    },
    {
      id: "source",
      label: "來源條款",
      hint: "誰寫、為何寫、何時更新",
      emoji: "📚",
      href: "/smart/chapter/0802",
    },
    {
      id: "board",
      label: "底線比較",
      hint: "羅盤、六帽與同尺",
      emoji: "⚖",
      href: "/smart/chapter/0804",
    },
    {
      id: "memo",
      label: "決策備忘錄",
      hint: "留下可重看的一頁",
      emoji: "📝",
      href: "/smart/chapter/0810",
    },
  ],
  decisionStartDemos: [
    {
      id: "family",
      label: "案例｜餘裕與家人",
      choice: "是否接受一項期限緊、看起來機會難得的安排",
      lifeImpact: "未來陪家人旅行的餘裕，以及臨時支援家人時的從容",
      wantClear: "退出與重新選擇的空間到底有多大",
      reflectNote: "資料變多時，我更容易被催促，而不是更踏實。",
    },
  ],
};

export const CHAPTER_0801: ChapterOpening = {
  id: "0801",
  qrCode: "0801",
  title: "坐回決策主位",
  subtitle: "第八章",
  layout: "decision-seat",
  headerEmoji: "🪑",
  accentGradient: CH8_ACCENT,
  quote: "真正的主導權，從重新說出自己的問題開始。",
  atAGlance:
    "先別急著問哪個最好；先說清楚，這個決定要替生活守住什麼。先分開已知／未知與期待／擔心，再用自己的語言改寫問題。" +
    CH8_DISCLAIMER,
  tryPrompt: "五分鐘問題改寫：表面上在問什麼、已知／未知、期待／擔心、真正想解決的，以及最不能犧牲的。",
  reflectPrompt: "改寫後，這個問題是否更像「我的問題」？",
  reflectPlaceholder: "例如：改寫後，我發現真正想守住的是調整生活的自由…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "暖暖可用「已知／未知＋期待／擔心」依序提問，只整理您的回答，不替您下結論。" +
    CH8_DISCLAIMER,
  practiceWhere: "mixed",
  capabilityNote:
    "問題改寫可在本頁完成；提問可進暖暖。暖暖不替您決定，也不推薦方案。",
  printCardTitle: "我的問題改寫卡",
  printCardDescription: "可列印：表面問題、已知／未知、期待／擔心、真正問題與底線。",
  printButtonLabel: "列印改寫卡",
  guideTitle: "坐回主位",
  guideDuration: "心法",
  guideParagraphs: [
    "問題可能不在於缺少答案，而是問題還沒有真正屬於自己。",
    "次序可以更穩：先由自己定義問題，再讓資料、工具與專業意見進場。",
    "決策主位不是一張孤單的椅子，而是一個清楚知道誰負責最後選擇的位置。",
  ],
  guideFooterNote: "請先完成五分鐘問題改寫。",
  footerGuideLabel: "閱讀決策主位說明",
  samplePrompt:
    "請一次只問一題，幫我把決策問題說清楚。請依序問：我表面上在問什麼？目前已知與仍未知是什麼？我真正期待與最擔心的是什麼？最後請用我的語言整理：我真正想解決的是什麼，以及最不能犧牲的是什麼。請不要替我下結論，也不要推薦商品。",
  decisionSeatDemos: [
    {
      id: "rewrite",
      label: "案例｜機會催促",
      surfaceQ: "這個安排好不好、現在要不要做",
      knownUnknown: "已知期限與大概費用；未知退出條件與生活影響",
      expectWorry: "期待抓住機會；擔心失去陪家人與調整生活的餘裕",
      realQ: "這個選擇能否守住我未來幾年的從容與重新選擇空間",
      mustKeep: "照顧家人與臨時支援時仍保有餘裕",
      reflectNote: "改寫後，這個問題更像我的問題。",
    },
  ],
};

export const CHAPTER_0802: ChapterOpening = {
  id: "0802",
  qrCode: "0802",
  title: "建立可信來源階梯",
  subtitle: "第八章",
  layout: "source-ladder",
  headerEmoji: "🪜",
  accentGradient: CH8_ACCENT,
  quote: "先看誰寫、為何寫、何時更新，再看它說了什麼。",
  atAGlance:
    "四層來源：官方／原始文件 → 提供者說明 → 有作者依據的解讀 → 找不到完整出處的轉述。找不到時標示「待補查」。" +
    CH8_DISCLAIMER,
  tryPrompt: "先查一份最重要的資料：名稱／發布者／日期、層級、可確認事項、不能單獨證明的事、還要補查什麼。",
  reflectPrompt: "我是否曾因一句話說得肯定，就忘了追問來源？",
  reflectPlaceholder: "例如：群組截圖說「可以隨時處理」，我就忘了追問出處…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "暖暖可帶您完成「來源五問」，並把缺少的正式資料留下來；找不到來源時直接標示待補查。" +
    CH8_DISCLAIMER,
  practiceWhere: "paper",
  capabilityNote:
    "來源卡在本頁完成。暖暖可協助分類，但不能替沒有出處的句子補上來源。",
  printCardTitle: "我的來源階梯卡",
  printCardDescription: "可列印：資料名稱、層級、可確認、不能證明、待補查。",
  printButtonLabel: "列印來源卡",
  guideTitle: "可信來源",
  guideDuration: "查證",
  guideParagraphs: [
    "同一句「可以隨時處理」，若出現在正式文件、提供者說明或群組截圖，能回答的問題並不相同。",
    "判斷來源，先看發布者、目的、日期與完整程度。",
    "可信不是「看起來很專業」，而是知道這句話從哪裡來，也知道它不能單獨證明什麼。",
  ],
  guideFooterNote: "請先完成一份最重要資料的來源五問。",
  footerGuideLabel: "閱讀來源階梯說明",
  sourceLadderDemos: [
    {
      id: "official",
      label: "案例｜正式說明",
      sourceMeta: "官方產品說明／發布單位：○○／更新日期：2026-03",
      layer: "第 1 層｜官方或原始文件",
      confirms: "費用項目名稱與申請流程文字",
      cannotProve: "是否適合我的生活底線與風險承受",
      toCheck: "提前終止條件的完整段落與例外",
      reflectNote: "說過肯定的句子，仍要追問來源。",
    },
  ],
};

export const CHAPTER_0803: ChapterOpening = {
  id: "0803",
  qrCode: "0803",
  title: "把條款翻成生活語言",
  subtitle: "第八章",
  layout: "clause-translate",
  headerEmoji: "🔎",
  accentGradient: CH8_ACCENT,
  quote: "好的白話摘要，不只容易懂，也知道每一句從哪裡來。",
  atAGlance:
    "只選一小段條款，翻成四個生活問題：要付什麼、何時受限制、生活可能受到什麼影響、還有哪些未知。每一句都要能回到原文。" +
    CH8_DISCLAIMER,
  tryPrompt: "只選一小段條款：它在說什麼（含頁碼）、要付什麼／何時受限制、生活後果與仍待確認。",
  reflectPrompt: "哪個原本簡單的名詞，翻成生活後才發現需要追問？",
  reflectPlaceholder: "例如：「可以提前終止」其實還要問何時、費用與例外…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "暖暖可提供「四欄白話摘要」；使用來源工具時，請逐項保留引用，文件未說明就寫「待確認」。" +
    CH8_DISCLAIMER,
  practiceWhere: "mixed",
  capabilityNote:
    "白話摘要在本頁完成。請勿上傳含完整帳號、證件或不必要資產細節的文件；重要句子請自行回原文核對。",
  printCardTitle: "我的條款白話摘要卡",
  printCardDescription: "可列印：條款要旨、頁碼、費用／限制、生活後果與待確認。",
  printButtonLabel: "列印白話摘要卡",
  guideTitle: "生活語言",
  guideDuration: "轉譯",
  guideParagraphs: [
    "白話必須忠於原文，不能把限制、例外與未知一起刪掉。",
    "每一句摘要也要能回到頁碼、段落或原始連結。",
    "白話不是把小字刪短，而是讓費用、限制與未知都能回到生活，也能回到原文。",
  ],
  guideFooterNote: "請只挑一段真正影響決定的條款。",
  footerGuideLabel: "閱讀條款轉譯說明",
  clauseTranslateDemos: [
    {
      id: "exit",
      label: "案例｜提前終止",
      clauseSummary: "文件稱可提前終止（第 12 頁第 3 段）",
      payLimit: "可能需支付手續費；特定期間內限制取回",
      lifeUnknown: "臨時需要用錢時可能無法立即取回；例外條件仍待確認",
      reflectNote: "「可以提前終止」翻成生活後，才發現要追問例外。",
    },
  ],
};

export const CHAPTER_0804: ChapterOpening = {
  id: "0804",
  qrCode: "0804",
  title: "守住三項生活底線",
  subtitle: "第八章",
  layout: "life-baselines",
  headerEmoji: "🧭",
  accentGradient: CH8_ACCENT,
  quote: "看懂方案不等於適合生活；底線要在比較與推薦之前先被看見。",
  atAGlance:
    "安全底線、生活底線、關係底線——表格告訴您有哪些路；三項生活底線，提醒哪些方向不能偏離。" +
    CH8_DISCLAIMER,
  tryPrompt: "寫下三項不能偏離的條件：安全、生活、關係底線。",
  reflectPrompt: "哪項底線最容易在漂亮數字或限時壓力下被放到後面？",
  reflectPlaceholder: "例如：關係底線最容易被「現在不做就錯過」放到後面…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "暖暖可把三項底線整理成一張卡，並在後續比較時固定放在最前面。" +
    CH8_DISCLAIMER,
  practiceWhere: "paper",
  capabilityNote: "底線卡在本頁／紙本完成。底線由您定義，暖暖不評分、不排序方案。",
  printCardTitle: "我的三項生活底線卡",
  printCardDescription: "可列印：安全、生活、關係三項底線。",
  printButtonLabel: "列印底線卡",
  guideTitle: "生活羅盤",
  guideDuration: "底線",
  guideParagraphs: [
    "資料變整齊後，人很容易把「看懂」誤認為「適合」。",
    "感受與風險都不是阻止選擇的理由，而是讓資料擁有一只生活羅盤。",
    "能做決定，不是因為掌握所有資訊，而是沒有把自己從決策裡拿掉。",
  ],
  guideFooterNote: "請先寫下三項不能偏離的條件。",
  footerGuideLabel: "閱讀生活底線說明",
  lifeBaselinesDemos: [
    {
      id: "three",
      label: "案例｜三項底線",
      safety: "如果臨時需要一筆緊急支援卻無法取用，我就暫停或重新評估",
      life: "這個選擇不能讓我失去每年與家人短旅行的餘裕",
      relationship: "決定前，我要先和配偶說清楚退出條件與影響",
      reflectNote: "限時壓力下，關係底線最容易被放到後面。",
    },
  ],
};

export const CHAPTER_0805: ChapterOpening = {
  id: "0805",
  qrCode: "0805",
  title: "召開一人董事會",
  subtitle: "第八章",
  layout: "six-hats",
  headerEmoji: "🎩",
  accentGradient: CH8_ACCENT,
  quote: "成熟的決定，不讓最大聲的意見勝出，而讓重要角度各自說完。",
  atAGlance:
    "白帽事實、紅帽感受、黃帽價值、黑帽風險、綠帽替代、藍帽下一步。您是主持人；AI 只是會議整理者，不投票、不打分。" +
    CH8_DISCLAIMER,
  tryPrompt: "完成一次十二分鐘會議：先說問題與三項底線，再依序過六個角度；最後留下待查事項、下一小步與重看日。",
  reflectPrompt: "哪個角度帶來了原本沒有看見的內容？",
  reflectPlaceholder: "例如：黑帽讓我看見退出時間比想像久…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "暖暖可主持可暫停的六帽會議，完成後只整理摘要，不投票、不打分，也不替您決定。" +
    CH8_DISCLAIMER,
  practiceWhere: "mixed",
  capabilityNote:
    "六帽會議可在本頁記錄；暖暖可一次一題協助整理。暖暖不投票、不打分、不替您決定。",
  printCardTitle: "我的一人董事會摘要卡",
  printCardDescription: "可列印：待查事項、下一小步與重看日。",
  printButtonLabel: "列印董事會卡",
  guideTitle: "六帽決策桌",
  guideDuration: "約 12 分鐘",
  guideParagraphs: [
    "如果聲音混在一起，最後很容易只剩「做」或「不做」。",
    "六帽把思考工作分開；重要角度都亮過，才更容易看清要走的路。",
    "這是本章唯一一次完整六帽會議，往後只使用最需要的角度。",
  ],
  guideFooterNote: "一次只回答一題；事實、感受與推測分開。",
  footerGuideLabel: "閱讀一人董事會說明",
  samplePrompt:
    "請主持一次可暫停的一人董事會。先確認我的問題與三項生活底線，再依序只問一題：白帽（事實與未知）、紅帽（期待與擔心）、黃帽（可能價值）、黑帽（風險與底線）、綠帽（替代方案）、藍帽（下一步與重看時間）。完成後只整理摘要，不投票、不打分，也不替我決定。請勿要求帳號、證件或不必要的完整資產資料。",
  sixHatsDemos: [
    {
      id: "board",
      label: "案例｜會議收束",
      toCheck: "提前終止費用與例外條件的正式文件頁碼",
      nextStep: "先完成條款白話摘要，再做同尺比較",
      reviewDate: "兩週後重看：正式文件是否補齊",
      reflectNote: "黑帽帶來了原本沒看見的退出限制。",
    },
  ],
};

export const CHAPTER_0806: ChapterOpening = {
  id: "0806",
  qrCode: "0806",
  title: "用同一把生活尺度比較",
  subtitle: "第八章",
  layout: "same-scale",
  headerEmoji: "📏",
  accentGradient: CH8_ACCENT,
  quote: "不打分、不加總、不推薦；先讓每條路的代價與未知清楚出現。",
  atAGlance:
    "把方案 A、方案 B 與維持現況放在一起。共同尺度：費用、彈性、最不利生活影響、目前未知。不足處標示待補查，不排名。" +
    CH8_DISCLAIMER,
  tryPrompt: "先比較四項核心尺度，並寫下原先忽略的代價或未知。",
  reflectPrompt: "同尺比較後，我看見了哪項原先忽略的代價？",
  reflectPlaceholder: "例如：維持現況也有代價——猶豫本身消耗心力…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "暖暖可建立一張不評分的同尺比較表，並把資料不足處送回查證清單。" +
    CH8_DISCLAIMER,
  practiceWhere: "paper",
  capabilityNote:
    "同尺比較在本頁完成。暖暖可協助列表，但不打總分、不選冠軍、不推薦商品。",
  printCardTitle: "我的同尺比較卡",
  printCardDescription: "可列印：方案與維持現況、四項尺度、待補查與看見的代價。",
  printButtonLabel: "列印比較卡",
  guideTitle: "同一把尺",
  guideDuration: "比較",
  guideParagraphs: [
    "公平比較不是請工具算出第一名，而是讓每條路都接受同一把生活尺度。",
    "別忘了把「維持現況」放進來，它同樣有好處、代價與風險。",
    "重點不是預測哪條路會贏，而是看清每條路真正要求您付出什麼。",
  ],
  guideFooterNote: "只用已確認資料；不足處標示待補查，不排名。",
  footerGuideLabel: "閱讀同尺比較說明",
  sameScaleDemos: [
    {
      id: "three-ways",
      label: "案例｜三條路",
      optionsNote: "方案 A／方案 B／維持現況",
      scalesNote: "費用清楚度、彈性、最不利生活影響、目前未知",
      ignoredCost: "方案 A 的退出時間可能打亂臨時支援家人的能力",
      reflectNote: "同尺後才看見彈性這項原先被忽略的代價。",
    },
  ],
};

export const CHAPTER_0807: ChapterOpening = {
  id: "0807",
  qrCode: "0807",
  title: "進行最壞情境壓力測試",
  subtitle: "第八章",
  layout: "stress-test",
  headerEmoji: "🌉",
  accentGradient: CH8_ACCENT,
  quote: "韌性不是相信不會出事，而是在決定前看見承重、出口與求助。",
  atAGlance:
    "承重：最不利時生活能承受到什麼程度？出口：出現哪些訊號就暫停？求助：哪些未知必須交給合格專業人士確認？" +
    CH8_DISCLAIMER,
  tryPrompt: "寫下一個停止條件：最不利情況、出現什麼就暫停／退出、仍需向專業確認什麼。",
  reflectPrompt: "知道出口後，我的擔心是否變得更清楚、也更可承擔？",
  reflectPlaceholder: "例如：知道出口後，擔心變得更具體，也比較可討論…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "暖暖可整理承重、出口與求助三項標記；請勿輸入帳號、證件或不必要的完整資產資料。" +
    CH8_DISCLAIMER,
  practiceWhere: "paper",
  capabilityNote:
    "壓力測試卡在本頁完成。請勿輸入帳號、證件或不必要的完整資產資料。",
  printCardTitle: "我的壓力測試卡",
  printCardDescription: "可列印：最不利情況、停止條件、專業確認事項。",
  printButtonLabel: "列印壓力測試卡",
  guideTitle: "三個安全標記",
  guideDuration: "測試",
  guideParagraphs: [
    "把這些情況先說出來，不是預測悲觀未來，而是了解自己能承受什麼。",
    "風險檢查要冷靜、不誇大，也不假裝風險能被完全消除。",
    "真正的韌性，是知道出現變化時仍有出口，也知道可以向誰求助。",
  ],
  guideFooterNote: "請寫下一個清楚的停止條件。",
  footerGuideLabel: "閱讀壓力測試說明",
  stressTestDemos: [
    {
      id: "bridge",
      label: "案例｜出口訊號",
      worstCase: "資金暫時不能取用超過三個月，影響臨時支援家人",
      stopSignal: "出現無法在約定時間內取用、或費用持續不明時，就暫停重看",
      proCheck: "退出程序時程與費用計算方式，需向合格專業人士確認",
      reflectNote: "知道出口後，擔心變得更清楚，也更可承擔。",
    },
  ],
};

export const CHAPTER_0808: ChapterOpening = {
  id: "0808",
  qrCode: "0808",
  title: "打開第三條路",
  subtitle: "第八章",
  layout: "third-path",
  headerEmoji: "🚪",
  accentGradient: CH8_ACCENT,
  quote: "成熟的選擇，不只接受現成答案；也可以重新設計下一步。",
  atAGlance:
    "做與不做之間，往往還有一條可以重新設計的路。五個旋鈕：時間、範圍、條件、資料、目標。" +
    CH8_DISCLAIMER,
  tryPrompt: "只轉動一個旋鈕：寫下目前僵局、先調整哪一項，以及新的小方案／重看條件。",
  reflectPrompt: "哪個旋鈕一轉動，我就不再覺得只能被迫選邊？",
  reflectPlaceholder: "例如：先把時間延後並設定重看日，就不再覺得只能二選一…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "暖暖可從五個旋鈕各提出一個問題，再由您選一個最值得繼續評估的替代方案。" +
    CH8_DISCLAIMER,
  practiceWhere: "mixed",
  capabilityNote:
    "第三條路卡在本頁完成。延後、縮小或加條件都是可由您主持的成熟選擇，不是失敗。",
  printCardTitle: "我的第三條路卡",
  printCardDescription: "可列印：僵局、調整的旋鈕、新的小方案與重看條件。",
  printButtonLabel: "列印第三條路卡",
  guideTitle: "五個旋鈕",
  guideDuration: "重設計",
  guideParagraphs: [
    "眼前常像只剩兩個極端：現在立刻做，或完全放棄。",
    "時間可以延後，範圍可以縮小，條件可以加上前提，資料可以退回補查，目標也可以重新改寫。",
    "第三條路不是一定要折衷，而是讓選擇重新擁有時間、條件與餘裕。",
  ],
  guideFooterNote: "請只先轉動一個最有幫助的旋鈕。",
  footerGuideLabel: "閱讀第三條路說明",
  thirdPathDemos: [
    {
      id: "delay",
      label: "案例｜延後重看",
      stalemate: "現在立刻做 vs 完全放棄，兩邊都不踏實",
      knob: "時間",
      newPlan: "先補齊正式文件與退出條件，兩週後重看再決定是否試一小步",
      reflectNote: "時間旋鈕一轉，就不再覺得只能被迫選邊。",
    },
  ],
};

export const CHAPTER_0809: ChapterOpening = {
  id: "0809",
  qrCode: "0809",
  title: "決定前完成專業確認",
  subtitle: "第八章",
  layout: "pro-confirm",
  headerEmoji: "🖊",
  accentGradient: CH8_ACCENT,
  quote: "專業確認要把事實問清楚，而不是把決定交出去。",
  atAGlance:
    "帶三個問題去確認：依據在哪、限制與例外、屬於事實／判斷／假設以及是否有利益關係。會後分成：已確認、待確認、不同觀點、利益揭露。" +
    CH8_DISCLAIMER,
  tryPrompt: "寫下要帶去確認的三個問題，以及會後想記錄的重點欄位。",
  reflectPrompt: "我是在確認事實，還是不知不覺請對方替我做生活決定？",
  reflectPlaceholder: "例如：我要確認文件依據，而不是問「您覺得我該怎麼做」…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "暖暖可整理會前提問與會後四欄紀錄；不同問題可能需要不同資格與服務範圍的專業人士。" +
    CH8_DISCLAIMER,
  practiceWhere: "paper",
  capabilityNote:
    "提問卡在本頁完成。暖暖不是律師、會計師或投資顧問，也不安排專業預約。",
  printCardTitle: "我的專業確認提問卡",
  printCardDescription: "可列印：三個會前問題與會後四欄紀錄空格。",
  printButtonLabel: "列印確認卡",
  guideTitle: "兩支筆",
  guideDuration: "確認",
  guideParagraphs: [
    "專業確認的目的，不是請對方替方案蓋章，而是讓關鍵問題得到可回查的回答。",
    "專業人士負責其範圍內的事實與意見；您負責把這些內容放回自己的生活底線。",
    "帶著清楚問題求助，得到的是更可靠的事實，而不是把生活選擇權交出去。",
  ],
  guideFooterNote: "請先寫好三個會前問題。",
  footerGuideLabel: "閱讀專業確認說明",
  proConfirmDemos: [
    {
      id: "three-q",
      label: "案例｜三問",
      q1: "正式文件或依據在哪一頁、哪一條？",
      q2: "適用哪些情況？有哪些限制與例外？",
      q3: "這是事實、專業判斷或假設？是否有佣酬／轉介等利益關係？",
      reflectNote: "我要確認事實，而不是請對方替我做生活決定。",
    },
  ],
};

export const CHAPTER_0810: ChapterOpening = {
  id: "0810",
  qrCode: "0810",
  title: "完成私人決策備忘錄",
  subtitle: "第八章",
  layout: "decision-memo",
  headerEmoji: "📝",
  accentGradient: CH8_ACCENT,
  quote: "決定可以改變；清楚留下理由，讓未來的自己有路可回。",
  atAGlance:
    "目前狀態可以是：繼續查證、暫停、停止、設定重看日，或條件清楚後執行。真正值得簽下的，是理由、底線、未知與重新選擇的權利。" +
    CH8_DISCLAIMER,
  tryPrompt: "整理草案：目前狀態、理由與不能犧牲的底線、仍待確認與重看條件；再由自己完成最後一筆。",
  reflectPrompt: "哪一句必須由我親自修改，才真正代表我的生活？",
  reflectPlaceholder: "例如：最後狀態必須由我改成「設定重看日」，才代表我的節奏…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "暖暖可把本章回答整理成可編輯草案；不保存帳號、證件號碼或不必要的完整資產資料。最後文字請親自修改。" +
    CH8_DISCLAIMER,
  practiceWhere: "mixed",
  capabilityNote:
    "備忘錄草案可在本頁完成並點成光點。暖暖不保存帳號、證件或不必要完整資產資料，也不替您做最終決定。",
  printCardTitle: "我的私人決策備忘錄",
  printCardDescription: "可列印：目前狀態、理由／底線、待確認與重看條件。",
  printButtonLabel: "列印決策備忘錄",
  guideTitle: "可重看的一頁",
  guideDuration: "章末",
  guideParagraphs: [
    "成熟的收束，不一定是「現在立刻做」。繼續查證、暫停、停止、設定重看日，都是可以被正式寫下的決策狀態。",
    "所謂「簽下」，不是法律簽名，也不是保證結果一定正確。",
    "它只是清楚留下：當時根據什麼做決定、什麼不能犧牲、哪些仍不知道，以及什麼情況出現時，有權重新打開這一頁。",
  ],
  guideFooterNote: "請整理草案後，親自改成代表自己生活的最後一筆。",
  footerGuideLabel: "閱讀決策備忘錄說明",
  decisionMemoDemos: [
    {
      id: "memo",
      label: "案例｜設定重看日",
      status: "設定重看日",
      reasonBaseline: "在退出條件未確認前，不執行；守住臨時支援家人的餘裕",
      pendingReview: "待確認退出費用與例外；兩週後重看正式文件是否補齊",
      reflectNote: "最後狀態必須由我親自改成「設定重看日」。",
    },
  ],
  appDeepLink: {
    href: "/smart/radar",
    label: "打開圓夢藍圖，留下決策光點 →",
  },
};

export const CHAPTER_8_OPENINGS: Record<string, ChapterOpening> = {
  "0800": CHAPTER_0800,
  "0801": CHAPTER_0801,
  "0802": CHAPTER_0802,
  "0803": CHAPTER_0803,
  "0804": CHAPTER_0804,
  "0805": CHAPTER_0805,
  "0806": CHAPTER_0806,
  "0807": CHAPTER_0807,
  "0808": CHAPTER_0808,
  "0809": CHAPTER_0809,
  "0810": CHAPTER_0810,
};

import type { ChapterOpening } from "./chapter-opening";

const CH9_ACCENT = "linear-gradient(180deg, #EAF3F0 0%, #FFF8EE 55%)";
const CH9_DISCLAIMER =
  "本章提供一般性的生活觀察與對話準備，不構成診斷、病因判斷、治療或藥物建議。";

export const CHAPTER_0900: ChapterOpening = {
  id: "0900",
  qrCode: "0900",
  title: "全人健康｜從生活線索到健康對話",
  subtitle: "第九章｜章節開篇",
  layout: "health-start",
  headerEmoji: "🌿",
  accentGradient: CH9_ACCENT,
  quote: "資料是線索，不是判決；先理解一段生活，再準備一場健康對話。",
  atAGlance:
    "本章路線：看見線索 → 整理脈絡 → 設計微調 → 準備對話。十個小步陪您走到一頁《55+ 全人健康戰略白皮書》。" +
    CH9_DISCLAIMER,
  tryPrompt:
    "先留下一個真正問題：最近最關心的生活訊號、它可能牽動的面向，以及不急著下結論時最想看清楚的事。",
  reflectPrompt: "我是在追逐一個分數，還是在理解一整段生活？",
  reflectPlaceholder: "例如：我比較像在追逐睡眠分數，而不是理解這幾天的作息變化…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "暖暖會從這個真實問題開始，一次只問一題；只整理線索、例外與未知，不診斷，也不替您下結論。" +
    CH9_DISCLAIMER,
  practiceWhere: "mixed",
  capabilityNote:
    "問題卡與路線可在本頁完成；提問可進暖暖。暖暖不診斷、不建議改藥，也不替您下結論。",
  printCardTitle: "我的生活訊號問題卡",
  printCardDescription: "可列印：關心的訊號、牽動面向，以及最想看清楚的事。",
  printButtonLabel: "列印問題卡",
  guideTitle: "章首導讀｜全人健康",
  guideDuration: "約 2 分鐘",
  guideParagraphs: [
    "一個數字、一晚沒睡好，或幾天和平常不同，很容易從值得留意的線索，變成對自己的判決。",
    "本章不要求追蹤所有數據，也不把 AI 當成診斷者。先由自己決定想理解的生活問題、願意整理的材料與安全底線。",
    "重要症狀、藥物、治療與檢驗仍交由合格專業人員判斷；不能等待的危險，直接使用所在地緊急服務。",
  ],
  guideFooterNote: "語音導讀之後再補；請先留下一個真正問題，再選路線。",
  footerGuideLabel: "閱讀 2 分鐘章首導讀",
  entries: [
    {
      id: "clue",
      label: "看見線索",
      hint: "把判決改成觀察問題",
      emoji: "🔎",
      href: "/smart/chapter/0901",
    },
    {
      id: "context",
      label: "整理脈絡",
      hint: "七日線索與時間軸",
      emoji: "🗓",
      href: "/smart/chapter/0902",
    },
    {
      id: "tweak",
      label: "設計微調",
      hint: "可承受、可停止的一小步",
      emoji: "🌱",
      href: "/smart/chapter/0907",
    },
    {
      id: "dialogue",
      label: "準備對話",
      hint: "問題單與白皮書",
      emoji: "💬",
      href: "/smart/chapter/0909",
    },
  ],
  healthStartDemos: [
    {
      id: "sleep",
      label: "案例｜睡眠分數",
      signal: "手錶顯示睡眠分數偏低，連續兩晚比較晚睡",
      lifeArea: "睡眠與隔天的疲倦感",
      wantClear: "這是偶發作息改變，還是需要繼續觀察的重複模式",
      reflectNote: "我比較像在追逐分數，而不是理解這幾天的生活變化。",
    },
  ],
};

export const CHAPTER_0901: ChapterOpening = {
  id: "0901",
  qrCode: "0901",
  title: "把判決句改成可觀察問題",
  subtitle: "第九章",
  layout: "judgment-rewrite",
  headerEmoji: "🪟",
  accentGradient: CH9_ACCENT,
  quote: "一個數字可以提醒您觀察，不能替您評價自己。",
  atAGlance:
    "先用紅帽承認感受，再用白帽分開已知與未知，最後把「我是不是變差了」改寫成有時間範圍、可繼續觀察的問題。" +
    CH9_DISCLAIMER,
  tryPrompt: "三分鐘判決句改寫：真實感受、已知／未知，以及接下來可以觀察的問題。",
  reflectPrompt: "改寫後，我是否從自責回到好奇，也保留了求助界線？",
  reflectPlaceholder: "例如：改寫後，我比較好奇這幾天晚睡後隔天的狀態…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "暖暖可依序詢問「感受、已知、未知、可觀察問題」，只整理您的回答，不把數字解讀成診斷。" +
    CH9_DISCLAIMER,
  practiceWhere: "mixed",
  capabilityNote: "問題改寫可在本頁完成；提問可進暖暖。暖暖不診斷，也不建議改藥。",
  printCardTitle: "我的可觀察問題卡",
  printCardDescription: "可列印：感受、已知／未知，與可觀察問題。",
  printButtonLabel: "列印改寫卡",
  guideTitle: "成績單轉觀察窗",
  guideDuration: "心法",
  guideParagraphs: [
    "身體不是成績單；數字是線索，不是對您的評價。",
    "放下成績單，不是忽略健康，而是用更穩、更尊重自己的方式開始觀察。",
    "AI 可以協助整理時間與問題，不能診斷，也不能替您決定是否改藥、延後就醫。",
  ],
  guideFooterNote: "請先完成三分鐘判決句改寫。",
  footerGuideLabel: "閱讀判決句改寫說明",
  samplePrompt:
    "請一次只問一題，幫我把判決句改成可觀察問題。請依序問：看到這個數字，我真實的感受是什麼？目前確定知道什麼、仍不知道什麼？最後請用我的語言整理成一個有時間範圍、可以繼續觀察的問題。請不要診斷，也不要建議改藥。",
  judgmentRewriteDemos: [
    {
      id: "score",
      label: "案例｜睡眠分數",
      feel: "擔心是不是身體變差了",
      knownUnknown: "已知：連續兩晚較晚睡；未知：是否重複、白天感受如何",
      observeQ: "最近七天，晚睡後隔天的疲倦感是否重複出現？",
      reflectNote: "改寫後，我從自責回到好奇，也記得必要時要請助專業。",
    },
  ],
};

export const CHAPTER_0902: ChapterOpening = {
  id: "0902",
  qrCode: "0902",
  title: "先整理，不急著歸因",
  subtitle: "第九章",
  layout: "seven-day-clues",
  headerEmoji: "📋",
  accentGradient: CH9_ACCENT,
  quote: "先整理發生過什麼，再討論可能原因。",
  atAGlance:
    "選最近七天，分開觀察事實、生活事件、感受與未知；標出一個例外與一個仍不知道的地方。不把「接著發生」寫成「因此造成」。" +
    CH9_DISCLAIMER,
  tryPrompt: "完成七日生活線索表：每天只留時間、事件、感受、行動與後續；再標例外、未知與兩個待確認問題。",
  reflectPrompt: "這份紀錄夠簡單，讓我願意持續，也沒有為了完整而猜答案嗎？",
  reflectPlaceholder: "例如：每天兩分鐘就夠；例外那天其實睡得還不錯…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "暖暖可提供每天約兩分鐘的七日低敏線索紀錄；內容由您決定保留、修改或刪除。" +
    CH9_DISCLAIMER,
  practiceWhere: "mixed",
  capabilityNote: "七日線索表可在本頁完成。暖暖只協助排序與提問，不歸因、不診斷。",
  printCardTitle: "我的七日生活線索表",
  printCardDescription: "可列印：七日摘要、例外、未知與待確認問題。",
  printButtonLabel: "列印線索表",
  guideTitle: "並排線索",
  guideDuration: "整理",
  guideParagraphs: [
    "時間先後很容易被誤認為因果。",
    "可靠的第一步，是把觀察事實、生活事件、感受與未知先分開。",
    "完成後留下的是可觀察、可修正，也能帶去專業對話的七日生活線索表，不是病因結論。",
  ],
  guideFooterNote: "請先完成七日線索表。",
  footerGuideLabel: "閱讀七日整理說明",
  sevenDayCluesDemos: [
    {
      id: "week",
      label: "案例｜七日疲倦",
      weekNote: "週一晚睡；週三午後疲倦；週五恢復平常；其餘日子大致穩定",
      exceptionNote: "週五雖忙，卻睡得較好",
      unknownNote: "還不知道咖啡與晚睡是否同時出現",
      pendingQs: "晚睡是否重複？疲倦是否只在忙碌日出現？",
      reflectNote: "紀錄夠簡單；我沒有為了完整去猜原因。",
    },
  ],
};

export const CHAPTER_0903: ChapterOpening = {
  id: "0903",
  qrCode: "0903",
  title: "把零散線索排成時間軸",
  subtitle: "第九章",
  layout: "timeline-nodes",
  headerEmoji: "⏳",
  accentGradient: CH9_ACCENT,
  quote: "時間軸的價值在順序與空白，不在填滿或證明原因。",
  atAGlance:
    "從最近七天選三至五個節點，放回大約時間；每點只留事件、感受、行動與後續。不確定就寫「約略／待確認」。" +
    CH9_DISCLAIMER,
  tryPrompt: "排出一條可回看的時間軸：三至五個節點、保留空白，並留下一個繼續觀察的問題。",
  reflectPrompt: "時間軸是否幫我看見先後與空白，而不是更急著證明原因？",
  reflectPlaceholder: "例如：我看見週三特別累，但週五其實恢復了…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "暖暖可把既有筆記依時間排序；所有日期與內容仍由您確認，空白不會被自動補造。" +
    CH9_DISCLAIMER,
  practiceWhere: "mixed",
  capabilityNote: "時間軸可在本頁完成。暖暖可協助排序，但不補造日期或歸因。",
  printCardTitle: "我的七日時間軸",
  printCardDescription: "可列印：節點、空白與繼續觀察的問題。",
  printButtonLabel: "列印時間軸",
  guideTitle: "順序與空白",
  guideDuration: "排序",
  guideParagraphs: [
    "沒有時間順序，線索就很難被自己或專業人員重新理解。",
    "時間軸不是用箭頭證明原因；它只是讓重要片段回到正確位置。",
    "即使有空白，也比一個急著下出的原因更有用。",
  ],
  guideFooterNote: "請先排出三至五個節點。",
  footerGuideLabel: "閱讀時間軸說明",
  timelineNodesDemos: [
    {
      id: "nodes",
      label: "案例｜三節點",
      nodesNote: "週一晚睡；週三午後疲倦；週五恢復平常",
      blankNote: "週二、週四細節約略，待確認",
      openQ: "疲倦是否只出現在晚睡隔天？",
      reflectNote: "時間軸讓我看見先後與空白，而不是急著證明原因。",
    },
  ],
};

export const CHAPTER_0904: ChapterOpening = {
  id: "0904",
  qrCode: "0904",
  title: "看見重複、例外與變化",
  subtitle: "第九章",
  layout: "cross-observe",
  headerEmoji: "🕸",
  accentGradient: CH9_ACCENT,
  quote: "全人健康不是找一條唯一原因，而是看見多條線索如何靠近、分開與留下空白。",
  atAGlance:
    "飲食、活動、睡眠與身心各留一條可回查線索；標出同步片段、相反例／不同步、資料缺口，並寫「目前不能證明什麼」。" +
    CH9_DISCLAIMER,
  tryPrompt: "完成全人交叉觀察卡：四面向線索、一個同步、一個相反例、一個缺口與一句不能證明什麼。",
  reflectPrompt: "看見例外時，我能否把它當成身體的彈性，而不是急著排除？",
  reflectPlaceholder: "例如：週五的例外提醒我，忙碌日不一定等於睡不好…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "暖暖可引導建立全人交叉觀察卡，只呈現重複、例外與缺口，不推論病因。" +
    CH9_DISCLAIMER,
  practiceWhere: "mixed",
  capabilityNote: "交叉觀察卡可在本頁完成。暖暖不把共現寫成病因。",
  printCardTitle: "我的全人交叉觀察卡",
  printCardDescription: "可列印：四面向、同步、相反例、缺口與限制句。",
  printButtonLabel: "列印觀察卡",
  guideTitle: "觀察網",
  guideDuration: "交叉",
  guideParagraphs: [
    "這張觀察網不是因果圖；它只讓四個生活面向一起被看見。",
    "候選模式仍只是一個值得繼續觀察的問題，不是身體已經給出的答案。",
    "身體的彈性與未知也應留在畫面裡。",
  ],
  guideFooterNote: "請完成全人交叉觀察卡。",
  footerGuideLabel: "閱讀交叉觀察說明",
  crossObserveDemos: [
    {
      id: "net",
      label: "案例｜四面向",
      fourClues: "飲食：晚餐偏晚；活動：少散步；睡眠：兩晚較短；身心：忙碌日較緊",
      syncNote: "晚睡與隔天疲倦曾同時出現",
      exceptionNote: "週五忙碌卻睡得較好",
      gapNote: "缺少白天心情的紀錄",
      cannotProve: "目前不能證明晚睡造成疲倦",
      reflectNote: "例外讓我看見身體的彈性，而不是急著排除。",
    },
  ],
};

export const CHAPTER_0905: ChapterOpening = {
  id: "0905",
  qrCode: "0905",
  title: "分清四種訊息",
  subtitle: "第九章",
  layout: "four-signals",
  headerEmoji: "🫙",
  accentGradient: CH9_ACCENT,
  quote: "四種訊息各有位置；分開後，健康對話才不會從猜測開始。",
  atAGlance:
    "把一句混雜說法拆成事實、感受、猜測與待確認。事實要能回查；猜測加上「可能」；未知改成可詢問的問題。" +
    CH9_DISCLAIMER,
  tryPrompt: "拆開一句混雜的健康說法：事實、感受、猜測（加不確定語氣）、待確認問題。",
  reflectPrompt: "分類後，我是否保留了感受，也沒有把猜測寫成結論？",
  reflectPlaceholder: "例如：我保留了胸口不舒服的感受，也把「壓力造成」改成可能…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "暖暖可把一段敘述整理成四欄；若內容涉及急性或令人擔心的症狀，會先提醒直接求助。" +
    CH9_DISCLAIMER,
  practiceWhere: "mixed",
  capabilityNote:
    "四欄整理可在本頁完成。若症狀突然出現、快速惡化或令人擔心，請直接尋求專業或緊急協助。",
  printCardTitle: "我的四種訊息卡",
  printCardDescription: "可列印：事實、感受、猜測與待確認。",
  printButtonLabel: "列印訊息卡",
  guideTitle: "四只整理瓶",
  guideDuration: "分類",
  guideParagraphs: [
    "人會把事實、感受、猜測與待確認連成一句，是因為大腦急著找原因。",
    "把四種訊息分開，不是否定直覺，而是讓每一種線索回到它能回答的位置。",
    "若症狀突然出現、快速惡化或令人擔心，應直接尋求專業或緊急協助。",
  ],
  guideFooterNote: "請先拆開一句混雜說法。",
  footerGuideLabel: "閱讀四種訊息說明",
  fourSignalsDemos: [
    {
      id: "split",
      label: "案例｜四欄拆開",
      fact: "昨晚大約睡了四小時（可回看紀錄）",
      feeling: "今天胸口不舒服，讓人擔心",
      guess: "可能和最近壓力有關，仍需證實",
      pending: "什麼情況需要進一步處理或提早求助？",
      reflectNote: "我保留了感受，也沒有把猜測寫成結論。",
    },
  ],
};

export const CHAPTER_0906: ChapterOpening = {
  id: "0906",
  qrCode: "0906",
  title: "用來源筆記工具回看長期資料",
  subtitle: "第九章",
  layout: "source-review",
  headerEmoji: "📓",
  accentGradient: CH9_ACCENT,
  quote: "來源筆記工具整理已選定的材料，不替身體歸因。",
  atAGlance:
    "資料累積到數週或數月時，才讓來源筆記工具協助跨期回看。只放入低敏材料，逐句回查；不足時可以寫「目前看不出穩定趨勢」。" +
    CH9_DISCLAIMER,
  tryPrompt: "完成一頁全人跨期回看：選定來源、比較同步／不同步／反例／缺口，並逐句回查。",
  reflectPrompt: "我能回到來源確認重要句子，也允許資料不足時沒有答案嗎？",
  reflectPlaceholder: "例如：有一句找不到來源，我刪掉了；資料不足就寫未見穩定趨勢…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "暖暖可示範來源筆記工具的低敏整理流程；重要句子仍由您逐項回查與確認。" +
    CH9_DISCLAIMER,
  practiceWhere: "mixed",
  capabilityNote:
    "跨期回看清單可在本頁完成；實際來源筆記工具請在手機或電腦使用。勿放入證件、帳號或完整醫療文件。",
  printCardTitle: "我的跨期回看摘要",
  printCardDescription: "可列印：選定來源、跨期比較與回查結果。",
  printButtonLabel: "列印回看摘要",
  guideTitle: "同一本來源筆記",
  guideDuration: "跨期",
  guideParagraphs: [
    "七天可用紙筆；數週或數月才需要來源筆記工具出場。",
    "工具整理已放入的來源，不是自動歸因或宣布哪項調整有效。",
    "重要句子必須回到原頁、日期及適用範圍核對。",
  ],
  guideFooterNote: "請先選定低敏材料再比較。",
  footerGuideLabel: "閱讀來源筆記說明",
  sourceReviewDemos: [
    {
      id: "notebook",
      label: "案例｜數週回看",
      sources: "七日線索表、三週睡眠摘要、一則可信衛教資料（已標日期）",
      compareNote: "忙碌週與睡眠摘要曾同步偏低；也有忙碌卻睡得較好的反例",
      checkNote: "刪除「一定有效」句；資料不足處寫「目前看不出穩定趨勢」",
      reflectNote: "我能回到來源確認，也允許沒有答案。",
    },
  ],
};

export const CHAPTER_0907: ChapterOpening = {
  id: "0907",
  qrCode: "0907",
  title: "設計可承受的生活微調",
  subtitle: "第九章",
  layout: "gentle-tweak",
  headerEmoji: "🌱",
  accentGradient: CH9_ACCENT,
  quote: "好的微調不是更用力，而是有價值、能承受、可停止、可重看。",
  atAGlance:
    "只選一個非治療、負擔低、可以停止的微調；寫下價值、負擔／停止／求助、第三條路與重看日期。不確定就改為先問專業。" +
    CH9_DISCLAIMER,
  tryPrompt: "設計一個可承受的微調：黃帽價值、黑帽負擔與停止、綠帽第三條路、藍帽選擇與重看日。",
  reflectPrompt: "這一步是否非治療、負擔低、可撤回？若不確定，是否改為先問專業？",
  reflectPlaceholder: "例如：這一步只是提早半小時關螢幕，可停止；若不適就先問專業…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "暖暖可依黃、黑、綠、藍帽順序主持微調對話；不評分，也不替您決定。" +
    CH9_DISCLAIMER,
  practiceWhere: "mixed",
  capabilityNote:
    "微調卡可在本頁完成。涉及藥物、治療、復健、補充品或情況惡化時，請先詢問合格專業人員；急性危險請用緊急服務。",
  printCardTitle: "我的可承受微調卡",
  printCardDescription: "可列印：價值、負擔／停止、第三條路與重看日。",
  printButtonLabel: "列印微調卡",
  guideTitle: "一小步照亮日常",
  guideDuration: "微調",
  guideParagraphs: [
    "真正的躍升不是立刻找出原因，而是把觀察轉成生活能承受的一小步。",
    "若涉及藥物、治療或情況惡化，下一步不是自行試做，而是先詢問專業。",
    "若可能危及生命或出現急性危險，立即使用所在地緊急服務。",
  ],
  guideFooterNote: "請先設計一個可承受、可停止的微調。",
  footerGuideLabel: "閱讀微調說明",
  samplePrompt:
    "請依黃、黑、綠、藍帽順序，一次只問一題，幫我設計一個可承受的生活微調。請確認它是非治療、負擔低、可停止的；若不適合就改問「是否先詢問專業」。請不要診斷、不要建議改藥，也不替我決定。",
  gentleTweakDemos: [
    {
      id: "screen",
      label: "案例｜提早關螢幕",
      value: "支持隔天較從容的生活節奏",
      burdenStop: "負擔低；若更焦慮或影響既有治療就停止並先問專業",
      thirdPath: "可改成只提前 15 分鐘，或先問專業再決定",
      choiceReview: "先試一週；下週日重看是否可承受",
      reflectNote: "這一步非治療、可撤回；不確定時我會先問專業。",
    },
  ],
};

export const CHAPTER_0908: ChapterOpening = {
  id: "0908",
  qrCode: "0908",
  title: "完成非因果趨勢摘要",
  subtitle: "第九章",
  layout: "noncausal-summary",
  headerEmoji: "🌊",
  accentGradient: CH9_ACCENT,
  quote: "把線索放在一起，是為了看得完整，不是為了更快下診斷。",
  atAGlance:
    "寫三至五句非因果摘要：同步片段、不同步／反例／空白、限制句；刪除「造成、證明、一定、有效」等越界語句。" +
    CH9_DISCLAIMER,
  tryPrompt: "寫出三至五句非因果摘要，同步、反例與限制同時留下。",
  reflectPrompt: "我能接受「目前未見穩定趨勢」也是可靠的觀察結果嗎？",
  reflectPlaceholder: "例如：目前未見穩定趨勢，也是我可以帶去對話的觀察…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "暖暖可提供非因果語言檢核，只標示越界詞與缺少的反例，不替您改成結論。" +
    CH9_DISCLAIMER,
  practiceWhere: "mixed",
  capabilityNote: "非因果摘要可在本頁完成。暖暖只檢核語言，不診斷、不歸因。",
  printCardTitle: "我的非因果趨勢摘要",
  printCardDescription: "可列印：同步、反例、限制與摘要句。",
  printButtonLabel: "列印趨勢摘要",
  guideTitle: "並行的河流",
  guideDuration: "摘要",
  guideParagraphs: [
    "兩條線靠近不代表彼此造成。",
    "找不到穩定趨勢，可以直接寫「目前未見穩定趨勢」。",
    "摘要不是診斷，而是更容易帶進專業對話的生活說明。",
  ],
  guideFooterNote: "請寫出有反例與限制的摘要。",
  footerGuideLabel: "閱讀非因果摘要說明",
  noncausalSummaryDemos: [
    {
      id: "summary",
      label: "案例｜三句摘要",
      syncNote: "有幾個忙碌日與較短睡眠同時出現",
      exceptionNote: "也有忙碌卻睡得較好的日子",
      limitNote: "觀察期尚短；裝置分數與本人感受不完全一致",
      summaryText: "最近兩週，忙碌與睡眠長度有時靠近、有時分開；目前未見穩定趨勢。",
      reflectNote: "「目前未見穩定趨勢」也是可靠的觀察結果。",
    },
  ],
};

export const CHAPTER_0909: ChapterOpening = {
  id: "0909",
  qrCode: "0909",
  title: "把觀察變成好問題",
  subtitle: "第九章",
  layout: "health-questions",
  headerEmoji: "💬",
  accentGradient: CH9_ACCENT,
  quote: "把觀察說清楚，比急著猜答案更有力量；真正重要的問題，三至五題就夠。",
  atAGlance:
    "準備三十秒開場與三至五個問題；標出必問、有時間再問、可帶回觀察。至少詢問一個資訊缺口，以及何時需提早求助或重看。" +
    CH9_DISCLAIMER,
  tryPrompt: "準備開場與三至五個問題，並標出優先層次與分享範圍。",
  reflectPrompt: "我帶去的是可討論的觀察與問題，而不是藏著答案的問句嗎？",
  reflectPlaceholder: "例如：我改成問「還缺什麼資訊」，而不是「我是不是得了什麼」…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "暖暖可整理成可列印或手機出示的低敏問題單；分享哪些內容，仍由您決定。" +
    CH9_DISCLAIMER,
  practiceWhere: "mixed",
  capabilityNote: "問題單可在本頁完成並列印。暖暖不替專業人員回答，也不改寫成診斷。",
  printCardTitle: "我的健康對話問題單",
  printCardDescription: "可列印：開場、問題優先層與分享範圍。",
  printButtonLabel: "列印問題單",
  guideTitle: "有光的對話",
  guideDuration: "提問",
  guideParagraphs: [
    "好問題不把答案藏進問句，而是讓對方快速看見觀察、例外、生活影響與未知。",
    "至少有一題詢問還缺少什麼資訊，一題詢問何時需要提早求助或重看。",
    "您決定必問順序、分享範圍與最後說法。",
  ],
  guideFooterNote: "請先寫好開場與三至五題。",
  footerGuideLabel: "閱讀好問題說明",
  samplePrompt:
    "請幫我把觀察整理成三十秒開場，再提出三至五個可帶進健康對話的問題。請標出必問／有時間再問／可帶回觀察，並包含一個資訊缺口與一個求助或重看時機問題。請不要診斷，也不要把猜測寫成結論。",
  healthQuestionsDemos: [
    {
      id: "ask",
      label: "案例｜問題單",
      opening: "最近兩週我觀察到晚睡後有時隔天較疲倦，也有例外；最影響的是午後專注。",
      mustAsk: "還缺少哪些資訊？什麼情況需要提早求助或重看？",
      laterAsk: "裝置分數與感受不一致時，該如何解讀？",
      shareScope: "可口述時間軸摘要；暫不分享完整醫療文件",
      reflectNote: "我帶去的是觀察與問題，不是藏著答案的問句。",
    },
  ],
};

export const CHAPTER_0910: ChapterOpening = {
  id: "0910",
  qrCode: "0910",
  title: "完成全人健康戰略白皮書",
  subtitle: "第九章",
  layout: "health-whitepaper",
  headerEmoji: "📄",
  accentGradient: CH9_ACCENT,
  quote: "真正的戰略不是知道所有答案，而是把線索、未知、行動與求助整理成一頁。",
  atAGlance:
    "白皮書至少保留生活問題、四面向線索、來源與反例、非因果摘要、可承受行動、停止與求助、專業問題與重看日期。由您確認、修改、決定分享並親自署名。" +
    CH9_DISCLAIMER,
  tryPrompt: "整理草案後親自署名：生活問題、線索與反例、安全界線、可承受行動與重看計畫。",
  reflectPrompt: "最後版本是否由我確認、修改、決定分享並親自署名？",
  reflectPlaceholder: "例如：最後一筆「重看日期」是我親自寫下的…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "暖暖可把本章回答整理成可編輯白皮書草案；不診斷，也不保存不必要的完整健康或身分資料。" +
    CH9_DISCLAIMER,
  practiceWhere: "mixed",
  capabilityNote:
    "白皮書草案可在本頁完成並點成光點。暖暖不診斷、不評分、不監控，也不保存不必要完整健康或身分資料。",
  printCardTitle: "我的 55+ 全人健康戰略白皮書",
  printCardDescription: "可列印：生活問題、線索、安全界線、行動與重看計畫。",
  printButtonLabel: "列印白皮書",
  guideTitle: "一頁戰略",
  guideDuration: "章末",
  guideParagraphs: [
    "真正的躍升，是把材料收進一頁，讓未來的自己與專業人員都能看懂當時根據什麼思考。",
    "沒有答案的地方可以寫「待確認」；不必為了完整把推測補成事實。",
    "工具只協助回看，不評分、不診斷、不監控。",
  ],
  guideFooterNote: "請整理草案後，親自署名並決定分享範圍。",
  footerGuideLabel: "閱讀白皮書說明",
  healthWhitepaperDemos: [
    {
      id: "paper",
      label: "案例｜一頁白皮書",
      lifeQ: "最近兩週晚睡與疲倦是否形成可觀察模式？",
      cluesAntiEx: "四面向線索與一個忙碌卻睡得較好的反例",
      safety: "若症狀突然加重或令人擔心，立即求助；不自行改藥",
      actionReview: "先試提早關螢幕一週；下週日重看；專業問題已備好",
      reflectNote: "最後版本由我確認、修改並親自署名。",
    },
  ],
  appDeepLink: {
    href: "/smart/radar",
    label: "打開圓夢藍圖，留下健康對話光點 →",
  },
};

export const CHAPTER_9_OPENINGS: Record<string, ChapterOpening> = {
  "0900": CHAPTER_0900,
  "0901": CHAPTER_0901,
  "0902": CHAPTER_0902,
  "0903": CHAPTER_0903,
  "0904": CHAPTER_0904,
  "0905": CHAPTER_0905,
  "0906": CHAPTER_0906,
  "0907": CHAPTER_0907,
  "0908": CHAPTER_0908,
  "0909": CHAPTER_0909,
  "0910": CHAPTER_0910,
};

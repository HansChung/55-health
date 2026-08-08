import type { ChapterOpening } from "./chapter-opening";

const CH12_ACCENT = "linear-gradient(180deg, #EAF0F4 0%, #FFF8EE 55%)";
const CH12_DISCLAIMER =
  "作品先由自己看見；私人版本也是完整成果；展示副本與私人主檔分開，分享距離可前進、可停留、也可返回。Google 與人工智慧工具只協助整理、建館、檢查與排練，不替您定義作品，也不替您發布。";

export const CHAPTER_1200: ChapterOpening = {
  id: "1200",
  qrCode: "1200",
  title: "世界舞台｜讓作品在合適的距離被看見",
  subtitle: "第十二章｜章節開篇",
  layout: "stage-start",
  headerEmoji: "🌍",
  accentGradient: CH12_ACCENT,
  quote: "世界舞台不是把自己推到人群中央，而是讓值得留下的成果，在合適的距離被看見。",
  atAGlance:
    "本章路線：找回散落的生命資產、點亮數位故事館、回望 SMART 成長、選擇分享距離，完成一次線上與現場的相遇，並留下九十日續航的小步。" +
    CH12_DISCLAIMER,
  tryPrompt:
    "點亮一件想留下的作品：它值得留下的理由，以及目前希望保持的距離（只給自己／家人／同行者／社區／公共）。",
  reflectPrompt: "即使沒有人按讚或評論，這件作品仍為生命留下了什麼？",
  reflectPlaceholder: "例如：即使沒有掌聲，這件作品仍讓我看見自己完成過的選擇…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "掃碼進入暖暖。暖暖會先用「已知／未知＋期待／擔心」依序提問，只整理成《世界舞台意向卡》，不搬檔、不下結論，也不公開。" +
    CH12_DISCLAIMER,
  practiceWhere: "mixed",
  capabilityNote:
    "意向卡與路線可在本頁完成；提問可進暖暖。掃碼進入本頁即可練習；需要提問時可進暖暖語音一次一題。",
  printCardTitle: "世界舞台意向卡",
  printCardDescription: "可列印：想點亮的作品、值得留下的理由，以及目前分享距離。",
  printButtonLabel: "列印世界舞台意向卡",
  guideTitle: "章首導讀｜世界舞台",
  guideDuration: "約 2 分鐘",
  guideParagraphs: [
    "手機與雲端裡，已經留下不少成果：一道重新整理的拿手菜、一份健康對話摘要、一趟旅遊研學行程、幾張有故事的照片、一段自己的聲音，以及「數位傳家寶五件套」與「作品分享護照」。它們散落時看似只是檔案；放回生活脈絡後，卻是「我學會了、我完成了、我願意留下」的證明。",
    "世界舞台不必等於公開網站、很多觀眾或熱鬧發表。舞台可以只給自己，也可以邀請家人、朋友或一小群同行者。私人展館不是較小的成果，而是一座由本人決定入口、距離、節奏與界線的完整作品。",
    "健康延壽讓人生擁有更長的創作時間；快樂圓夢，讓這段時間有作品、有同行，也有新的方向。作品先被自己看見，再由自己決定：珍藏、邀請同行，或走向更大的世界。",
  ],
  guideFooterNote: "章首導讀請先閱讀以上文字；點亮一件想留下的作品後，再選路線。",
  footerGuideLabel: "閱讀 2 分鐘章首導讀",
  entries: [
    {
      id: "assets",
      label: "生命資產",
      hint: "找回三至五件",
      emoji: "🗺",
      href: "/smart/chapter/1201",
    },
    {
      id: "gallery",
      label: "故事館",
      hint: "私人入口先亮起",
      emoji: "🏛",
      href: "/smart/chapter/1202",
    },
    {
      id: "distance",
      label: "五種距離",
      hint: "可進也可退",
      emoji: "📏",
      href: "/smart/chapter/1207",
    },
    {
      id: "lighthouse",
      label: "數位燈塔",
      hint: "九十日小步",
      emoji: "🕯️",
      href: "/smart/chapter/1210",
    },
  ],
  stageStartDemos: [
    {
      id: "story-card",
      label: "案例｜故事卡",
      lightWork: "母親的三張照片故事卡",
      whyKeep: "把她常說的那句話留下來，給手足看見",
      distance: "家人",
      reflectNote: "即使沒有人按讚，這件作品仍讓我更踏實。",
    },
  ],
};

export const CHAPTER_1201: ChapterOpening = {
  id: "1201",
  qrCode: "1201",
  title: "找回散落的生命資產",
  subtitle: "第十二章",
  layout: "life-assets",
  headerEmoji: "🗺",
  accentGradient: CH12_ACCENT,
  quote: "散落的檔案重新回到生活脈絡，就成為一張屬於自己的生命資產地圖。",
  atAGlance:
    "一次只找三至五件，分進「好好生活」「走向更大的世界」「留下生命的光」三區，再圈出最想先進館的一至三件。" +
    CH12_DISCLAIMER,
  tryPrompt:
    "完成第一張生命資產清單：找出三至五件候選與位置，補上為何重要／目前只給誰看，並圈出先進館的一至三件。",
  reflectPrompt: "哪一件不是最精美，卻最有生命重量？",
  reflectPlaceholder: "例如：那張模糊合照不是最精美，卻最有重量…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "掃碼進入暖暖。暖暖會先用「已知／未知＋期待／擔心」依序提問，只整理成《生命資產清單》，不讀取雲端、不搬檔，也不替您排序。" +
    CH12_DISCLAIMER,
  practiceWhere: "mixed",
  capabilityNote: "清單可在本頁完成；共同照片與聲音先標記待確認，健康／金融／身分資料保留私人原件。",
  printCardTitle: "生命資產清單",
  printCardDescription: "可列印：候選作品、位置、為何重要，以及先進館圈選。",
  printButtonLabel: "列印生命資產清單",
  guideTitle: "資產地圖三步",
  guideDuration: "練習",
  guideParagraphs: [
    "盤點不是清空手機，也不是把所有雲端檔案重新命名。一次只找三至五件即可。",
    "重要的是找回脈絡，不是建立最完整的資料庫。",
    "少量而清楚，已足以開始。",
  ],
  guideFooterNote: "請先完成三區盤點，再圈選先進館作品。",
  footerGuideLabel: "閱讀資產地圖說明",
  lifeAssetsDemos: [
    {
      id: "assets",
      label: "案例｜三件資產",
      candidates: "故事卡｜手機相簿；旅遊研學短記｜Drive；拿手菜食譜｜備忘錄",
      whyWho: "故事卡先給手足；短記只給自己；食譜可給家人",
      enterPick: "故事卡、拿手菜食譜；合照標記待確認",
      reflectNote: "故事卡不是最精美，卻最有生命重量。",
    },
  ],
};

export const CHAPTER_1202: ChapterOpening = {
  id: "1202",
  qrCode: "1202",
  title: "點亮我的數位故事館",
  subtitle: "第十二章",
  layout: "story-gallery",
  headerEmoji: "🏛",
  accentGradient: CH12_ACCENT,
  quote: "一個館名、一句本人導覽、三個空展區，已經點亮第一座故事館。",
  atAGlance:
    "第一座數位故事館只需要一頁首頁：館名、一句導覽、三個展區，以及能安全回來修改的私人入口。新展館先維持私人或未發布。" +
    CH12_DISCLAIMER,
  tryPrompt: "完成私人首頁草稿：館名與本人導覽、三個展區（可先空白），並用外部視角確認只有自己能看見。",
  reflectPrompt: "館名像自己的聲音，還是像平台範本？",
  reflectPlaceholder: "例如：館名讀起來像我會說的話，不像範本…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "掃碼進入暖暖。暖暖會先用「已知／未知＋期待／擔心」依序提問，只整理成《展館首頁草稿》，不登入網站、不代做，也不發布。" +
    CH12_DISCLAIMER,
  practiceWhere: "mixed",
  capabilityNote: "首頁草稿可在本頁完成；紙本展板、簡報或相簿也同樣完整。",
  printCardTitle: "展館首頁草稿",
  printCardDescription: "可列印：館名、導覽句與三個展區。",
  printButtonLabel: "列印展館首頁草稿",
  guideTitle: "私人入口",
  guideDuration: "練習",
  guideParagraphs: [
    "想到建立網站，容易先被版型、按鈕、網址與公開設定困住。",
    "版面先求清楚，不必追求華麗；展區暫時空著，也不影響完成。",
    "能控制入口，比選到完美版型更重要。",
  ],
  guideFooterNote: "完成後確認能打開、能回到編輯、能找到權限設定。",
  footerGuideLabel: "閱讀展館說明",
  storyGalleryDemos: [
    {
      id: "gallery",
      label: "案例｜私人館",
      galleryName: "慢慢來的故事館",
      guideLine: "這裡放我願意留下、也願意慢慢看的作品",
      zones: "好好生活｜走向更大的世界｜留下生命的光（今日先空白）",
      reflectNote: "館名像自己的聲音，不是平台範本。",
    },
  ],
};

export const CHAPTER_1203: ChapterOpening = {
  id: "1203",
  qrCode: "1203",
  title: "讓作品走進展館",
  subtitle: "第十二章",
  layout: "work-enter",
  headerEmoji: "🖼",
  accentGradient: CH12_ACCENT,
  quote: "少而清楚的代表作，在同一個入口裡會彼此照亮。",
  atAGlance:
    "挑一至三件代表作安排展區與導覽；原始檔另建展示副本，從受邀者角度實測權限。" +
    CH12_DISCLAIMER,
  tryPrompt: "完成一至三件作品進館：安排展區與名稱、補上本人導覽、建立必要展示副本並測試權限。",
  reflectPrompt: "少了哪一件，展館反而更清楚？",
  reflectPlaceholder: "例如：少了第三件，展館反而更清楚…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "掃碼進入暖暖。暖暖會先用「已知／未知＋期待／擔心」依序提問，只整理成《作品進館卡》，不接收原始檔、不改權限，也不發布。" +
    CH12_DISCLAIMER,
  practiceWhere: "mixed",
  capabilityNote: "進館卡可在本頁完成；健康、金融、住址與即時定位不直接放進展館。",
  printCardTitle: "作品進館卡",
  printCardDescription: "可列印：作品、展區、導覽與展示副本／權限實測。",
  printButtonLabel: "列印作品進館卡",
  guideTitle: "少量策展",
  guideDuration: "練習",
  guideParagraphs: [
    "展館有了骨架，下一步不是把所有檔案搬上去，而是挑一至三件最能代表自己的作品。",
    "私人主檔與展示版分開，日後調整或撤回更從容。",
    "嵌入檔案不等於權限正確；放入前後都要從受邀者角度實測。",
  ],
  guideFooterNote: "請完成進館安排後，再實測一次權限。",
  footerGuideLabel: "閱讀進館說明",
  workEnterDemos: [
    {
      id: "enter",
      label: "案例｜進館",
      worksZones: "故事卡→留下生命的光；食譜卡→好好生活",
      guideLines: "故事卡：那句「慢慢來」仍陪著我；食譜：家的味道可以傳下去",
      copyTest: "已建展示副本（去個資）；另一帳號可開、外人看不見",
      reflectNote: "少了第三件，展館反而更清楚。",
    },
  ],
};

export const CHAPTER_1204: ChapterOpening = {
  id: "1204",
  qrCode: "1204",
  title: "回到起點，看見現在",
  subtitle: "第十二章",
  layout: "smart-before-after",
  headerEmoji: "🔁",
  accentGradient: CH12_ACCENT,
  quote: "從以前、證據到現在，成長不再只是模糊感覺。",
  atAGlance:
    "SMART 成長回望不從分數開始，而從作品與生活證據開始。每一維只回答：以前常怎麼做、現在多了什麼選擇、哪件作品能證明。" +
    CH12_DISCLAIMER,
  tryPrompt: "完成一項前後證據：選一個 SMART 面向，寫下以前、現在與一項作品或生活證據。",
  reflectPrompt: "哪一項變化最出乎意料？哪一維不是更高，而是走得更穩？",
  reflectPlaceholder: "例如：最出乎意料的是我更敢暫停；R 不是更高，而是更穩…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "掃碼進入暖暖。暖暖會先用「已知／未知＋期待／擔心」依序提問，只整理成《SMART 前後證據表》，不評分、不排名，也不替您判定成長。" +
    CH12_DISCLAIMER,
  practiceWhere: "mixed",
  capabilityNote: "證據表可在本頁完成；某一維保持不變、暫時退回或想跳過，都可以如實留下。",
  printCardTitle: "SMART 前後證據表",
  printCardDescription: "可列印：面向、以前、現在與作品證據。",
  printButtonLabel: "列印前後證據表",
  guideTitle: "以前・證據・現在",
  guideDuration: "回望",
  guideParagraphs: [
    "一路完成許多章節後，最容易記得做過哪些任務，卻不一定看見自己現在多了什麼選擇。",
    "人工智慧只能協助分類，不替您判定成長。",
    "作品成為證據後，成長就成為一份可以被自己相信的生活改變。",
  ],
  guideFooterNote: "其餘面向可繼續，也可以先留白。",
  footerGuideLabel: "閱讀成長回望說明",
  samplePrompt:
    "請一次只問一題，幫我整理 SMART 前後證據。請依序問：我想先看哪個面向（S／M／A／R／T）？以前常怎麼做？現在多了什麼選擇？哪件作品或經驗能證明？請不要評分、排名或替我判定成長。",
  smartBeforeAfterDemos: [
    {
      id: "evidence",
      label: "案例｜A 自主",
      smartFace: "A 自主",
      beforeNow: "以前等別人安排；現在會先寫自己的問題與底線",
      evidence: "決策備忘錄與故事核心句",
      reflectNote: "最出乎意料的是我更敢自己開始；不是更高，而是更穩。",
    },
  ],
};

export const CHAPTER_1205: ChapterOpening = {
  id: "1205",
  qrCode: "1205",
  title: "我的 SMART 成長曲線",
  subtitle: "第十二章",
  layout: "smart-curve",
  headerEmoji: "🕸",
  accentGradient: CH12_ACCENT,
  quote: "五個方向同樣重要；輪廓幫助回望，不提供總分，也不把人生排成名次。",
  atAGlance:
    "把前後證據畫成 SMART RADAR 或五張成長卡。每一維可自選：起步、正在形成、已能運用、願意帶人。數字只是位置，真正支撐的是生活證據。" +
    CH12_DISCLAIMER,
  tryPrompt: "完成自己的 SMART 成長卡：依作品證據選出起點與現在，完成五維輪廓或五張卡，並寫下「我看見自己＿＿＿＿。」",
  reflectPrompt: "哪一維最想感謝自己？哪一維不需要更高，只需要更穩？",
  reflectPlaceholder: "例如：最想感謝 A；T 不需要更高，只需要更穩…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "掃碼進入暖暖。暖暖會先用「已知／未知＋期待／擔心」依序提問，只整理成《SMART 成長卡》，不自動計算總分，也不比較他人。" +
    CH12_DISCLAIMER,
  practiceWhere: "mixed",
  capabilityNote: "成長卡可在本頁完成；不必為了圖形漂亮而填得更高。",
  printCardTitle: "SMART 成長卡",
  printCardDescription: "可列印：五維起點／現在與「我看見自己＿＿＿＿」。",
  printButtonLabel: "列印 SMART 成長卡",
  guideTitle: "成長輪廓",
  guideDuration: "回望",
  guideParagraphs: [
    "這張圖不回答「我有多好」，只幫助看見哪些已展開、哪些正在形成、哪些值得繼續照顧。",
    "保持不變可能代表原本就很穩；暫時退回，也可能是生活正在重新調整。",
    "能看見自己的形狀，知道下一步想照顧哪一處，已是一份成熟的自我理解。",
  ],
  guideFooterNote: "完成後確認每個位置是否找得到證據。",
  footerGuideLabel: "閱讀成長曲線說明",
  smartCurveDemos: [
    {
      id: "curve",
      label: "案例｜輪廓",
      oneDim: "A：起步→已能運用（有決策備忘錄為證）",
      fiveOutline: "S 正在形成｜M 已能運用｜A 已能運用｜R 正在形成｜T 起步",
      seeMyself: "我看見自己更能自己開始，也更願意慢慢來",
      reflectNote: "最想感謝 A；T 不需要更高，只需要更穩。",
    },
  ],
};

export const CHAPTER_1206: ChapterOpening = {
  id: "1206",
  qrCode: "1206",
  title: "把成長說成一段故事",
  subtitle: "第十二章",
  layout: "growth-story",
  headerEmoji: "🎙",
  accentGradient: CH12_ACCENT,
  quote: "一件作品、一個轉折、一個現在與一個下一步，讓成長回到本人聲音。",
  atAGlance:
    "選一件代表作，依「從哪裡開始／途中學會／現在更能／接下來想」口述六十至九十秒，整理成仍像自己的導覽詞。" +
    CH12_DISCLAIMER,
  tryPrompt: "完成六十至九十秒成長故事：依四個節點口述，整理成九十至一百五十字導覽詞，並朗讀刪修。",
  reflectPrompt: "哪一句最像自己？刪去哪一句，故事反而更真？",
  reflectPlaceholder: "例如：「慢慢來」最像自己；刪去像宣傳的那句反而更真…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "掃碼進入暖暖。暖暖會先用「已知／未知＋期待／擔心」依序提問，只整理成《展館導覽詞》草稿，保留原聲、不代寫，也不發布。" +
    CH12_DISCLAIMER,
  practiceWhere: "mixed",
  capabilityNote: "導覽詞可在本頁完成；AI 補入的細節必須逐句確認，共同記憶沿用三色核可。",
  printCardTitle: "展館導覽詞",
  printCardDescription: "可列印：四段式成長導覽詞。",
  printButtonLabel: "列印展館導覽詞",
  guideTitle: "四段式導覽",
  guideDuration: "練習",
  guideParagraphs: [
    "真正有力量的導覽，常從一件作品開始。",
    "不必把五個 SMART 字母全部說完，只要讓一項成長回到具體生活。",
    "一段好的導覽詞不必毫無缺口；讀起來仍像自己，就值得放在展館入口。",
  ],
  guideFooterNote: "請朗讀一遍，刪去不像自己或未經確認的句子。",
  footerGuideLabel: "閱讀導覽詞說明",
  samplePrompt:
    "請一次只問一題，幫我整理展館導覽詞。請依序問：代表作是什麼？我從哪裡開始？途中學會什麼？現在更能什麼？接下來想什麼？請用我的語言整理成九十至一百五十字，保留原聲用語，不要寫成宣傳文案，也不要發布。",
  growthStoryDemos: [
    {
      id: "story",
      label: "案例｜導覽詞",
      fourNodes: "從故事卡開始｜途中學會界線｜現在更能自己決定距離｜接下來想邀請手足一起看",
      guideDraft: "我從母親的故事卡開始。途中學會：私人也是完整。現在更能自己決定距離。接下來想先邀請手足一起看。",
      trimNote: "已刪去「完美人生」那句；保留「慢慢來」",
      reflectNote: "「慢慢來」最像自己；刪去宣傳句後更真。",
    },
  ],
};

export const CHAPTER_1207: ChapterOpening = {
  id: "1207",
  qrCode: "1207",
  title: "五種距離，我來決定",
  subtitle: "第十二章",
  layout: "five-distance",
  headerEmoji: "📏",
  accentGradient: CH12_ACCENT,
  quote: "五種距離同樣完整，可以前進、停留，也可以返回。",
  atAGlance:
    "分享有五種可切換距離：D1 只給自己、D2 親近家人、D3 同行夥伴、D4 社區舞台、D5 公共世界。先問願意給誰看，再處理權限，並準備返回的路。" +
    CH12_DISCLAIMER,
  tryPrompt: "完成五距離分享卡：選出目前距離，寫下給誰看、如何開啟、何時停止與如何撤回，並用外部視角測試權限。",
  reflectPrompt: "這個距離讓自己安心嗎？若明天改變心意，是否真的能退回？",
  reflectPlaceholder: "例如：D2 讓我安心；連結可關閉，真的能退回…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "掃碼進入暖暖。暖暖會先用「已知／未知＋期待／擔心」依序提問，只整理成《五距離分享卡》，不建立連結、不改權限，也不發布。" +
    CH12_DISCLAIMER,
  practiceWhere: "mixed",
  capabilityNote: "分享卡可在本頁完成；住址、即時定位、證件、金融與不必要健康細節先從展示版移除。",
  printCardTitle: "五距離分享卡",
  printCardDescription: "可列印：距離、對象、開啟／停止與撤回方式。",
  printButtonLabel: "列印五距離分享卡",
  guideTitle: "五種距離",
  guideDuration: "心法",
  guideParagraphs: [
    "五種距離不是由低到高的成就階梯。私人展館已是完整成果。",
    "涉及家人照片、聲音或共同記憶時，回看《作品分享護照》。",
    "能前進，也能回來，才是真正屬於自己的舞台。",
  ],
  guideFooterNote: "請用另一個帳號或外部視角測試實際權限。",
  footerGuideLabel: "閱讀五距離說明",
  fiveDistanceDemos: [
    {
      id: "distance",
      label: "案例｜D2",
      distance: "D2 親近家人",
      whoOpenStop: "給手足看｜指定連結｜一季後關閉",
      withdraw: "關閉連結；必要時改回只給自己",
      reflectNote: "這個距離讓我安心，也真的能退回。",
    },
  ],
};

export const CHAPTER_1208: ChapterOpening = {
  id: "1208",
  qrCode: "1208",
  title: "邀請合適的人同行",
  subtitle: "第十二章",
  layout: "invite-peer",
  headerEmoji: "🤝",
  accentGradient: CH12_ACCENT,
  quote: "邀請從合適的人與合適距離開始；人不必多，心意要說清楚。",
  atAGlance:
    "選一至五位合適對象，寫清楚為何想到他、希望一起看什麼、分享距離與不轉傳提醒；最後由本人決定是否發送。" +
    CH12_DISCLAIMER,
  tryPrompt: "完成一張同行邀請單：對象與理由、距離／回覆方式／期限／不轉傳提醒，再決定是否由本人發送。",
  reflectPrompt: "這次邀請是為了連結，還是為了證明？對方是否能輕鬆說不？",
  reflectPlaceholder: "例如：是為了連結；對方可以輕鬆說不方便…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "掃碼進入暖暖。暖暖會先用「已知／未知＋期待／擔心」依序提問，只整理成《同行邀請單》，不讀取聯絡人、不替您選人，也不發送。" +
    CH12_DISCLAIMER,
  practiceWhere: "mixed",
  capabilityNote: "邀請單可在本頁完成；人工智慧不讀取通訊錄、不替您選人，更不能代按發送。",
  printCardTitle: "同行邀請單",
  printCardDescription: "可列印：對象、心意、距離與自由回應空間。",
  printButtonLabel: "列印同行邀請單",
  guideTitle: "合適同行",
  guideDuration: "練習",
  guideParagraphs: [
    "被看見不等於被理解。人不必多，關係對了，作品才有機會抵達。",
    "邀請不只是一串網址，而是一句「這件作品讓我想起您，也想和您一起看看」。",
    "未回覆也不表示作品不重要。",
  ],
  guideFooterNote: "共同記憶當事人若尚未確認，就先不放進邀請版。",
  footerGuideLabel: "閱讀邀請說明",
  invitePeerDemos: [
    {
      id: "invite",
      label: "案例｜手足",
      whoWhy: "妹妹｜想起我們一起聽母親說「慢慢來」",
      inviteNote: "D2｜可回一句話或不回都好｜連結兩週後關閉｜請先不要轉傳",
      sendChoice: "今天先存草稿，週末再親自傳送",
      reflectNote: "這次是為了連結；她可以輕鬆說不。",
    },
  ],
};

export const CHAPTER_1209: ChapterOpening = {
  id: "1209",
  qrCode: "1209",
  title: "一場 OMO 華爾滋",
  subtitle: "第十二章",
  layout: "omo-waltz",
  headerEmoji: "💃",
  accentGradient: CH12_ACCENT,
  quote: "技術退到邊緣，作品、本人的聲音與真實相遇留在中央。",
  atAGlance:
    "線上入口與現場相遇彼此補充。準備三至五分鐘導覽：一件作品、一項成長、一個希望，並備好 Plan B；結束後只邀請一項簡單回應。" +
    CH12_DISCLAIMER,
  tryPrompt: "完成一次小而真實的分享：選形式，準備一件作品／一項成長／一個希望與備案，並記下被理解處與下一版修正。",
  reflectPrompt: "哪一刻最有「作品真的抵達了」的感覺？",
  reflectPlaceholder: "例如：妹妹說出那句「慢慢來」時，作品真的抵達了…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "掃碼進入暖暖。暖暖會先用「已知／未知＋期待／擔心」依序提問，只整理成《OMO 發表紀錄》，不錄製活動、不評分，也不公開。" +
    CH12_DISCLAIMER,
  practiceWhere: "mixed",
  capabilityNote: "發表紀錄可在本頁完成；若需要錄音錄影，必須先取得在場者同意。",
  printCardTitle: "OMO 發表紀錄",
  printCardDescription: "可列印：形式、導覽重點、備案與回應筆記。",
  printButtonLabel: "列印 OMO 發表紀錄",
  guideTitle: "OMO 相遇",
  guideDuration: "練習",
  guideParagraphs: [
    "發表可以很小：在家與一位家人看一頁展館，或透過視訊與遠方朋友相聚。",
    "網路不穩時，可改用簡報、PDF、紙本故事卡或直接口述。",
    "不以人數、掌聲或留言量評分。",
  ],
  guideFooterNote: "作品、本人的聲音與合適的人真正相遇，就是圓夢最真實的掌聲。",
  footerGuideLabel: "閱讀 OMO 說明",
  omoWaltzDemos: [
    {
      id: "omo",
      label: "案例｜一對一",
      formPrep: "一對一｜故事卡＋三分鐘導覽＋紙本備案",
      arrivedNote: "她記得「慢慢來」，也說想再看食譜卡",
      nextFix: "下一版只加一句圖說，讓照片更清楚",
      reflectNote: "她說出那句話時，作品真的抵達了。",
    },
  ],
};

export const CHAPTER_1210: ChapterOpening = {
  id: "1210",
  qrCode: "1210",
  title: "成為數位燈塔",
  subtitle: "第十二章",
  layout: "lighthouse",
  headerEmoji: "🕯️",
  accentGradient: CH12_ACCENT,
  quote: "燈塔不必照得最遠；小而持續的光，也能陪自己與他人走得更穩。",
  atAGlance:
    "寫下燈塔宣言與九十天內能完成的一件小事，並準備備案。下一個黃金十年，已從一件真實作品、一段溫暖連結與一個穩穩的小步開始。" +
    CH12_DISCLAIMER,
  tryPrompt: "完成燈塔宣言與九十日小步：願意留下什麼、照亮誰、九十天小事，以及開始日／回看日／備案。",
  reflectPrompt: "如果只照亮一小段路，最希望是哪一段？什麼節奏能讓自己走得更穩？",
  reflectPlaceholder: "例如：最希望照亮家人重新說故事的那段；每週一小步的節奏更穩…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "掃碼進入暖暖。暖暖會先用「已知／未知＋期待／擔心」依序提問，只整理成《九十日續航卡》，不排名、不催促，也不公開。" +
    CH12_DISCLAIMER,
  practiceWhere: "mixed",
  capabilityNote: "續航卡可在本頁完成並點成光點。提醒只服務自己，不形成打卡壓力。",
  printCardTitle: "九十日續航卡",
  printCardDescription: "可列印：燈塔宣言、九十日小事與備案。",
  printButtonLabel: "列印九十日續航卡",
  guideTitle: "數位燈塔",
  guideDuration: "章末",
  guideParagraphs: [
    "終章不是把自己推向更大的曝光，而是確認哪些經驗值得繼續留下。",
    "數位燈塔的力量來自穩定與真實，不來自站得最高或照得最遠。",
    "也為行動準備備案：縮小、改期、離線、換一位同行者，或暫時休息。",
  ],
  guideFooterNote: "下一個黃金十年，已從一個穩穩的小步開始。",
  footerGuideLabel: "閱讀燈塔說明",
  lighthouseDemos: [
    {
      id: "light",
      label: "案例｜九十日",
      manifesto: "我願意留下家族故事卡；在合適時候照亮手足與未來的自己",
      ninetyStep: "九十天內帶妹妹完成一張故事卡",
      datesPlanB: "開始：下週日｜回看：九十天後｜備案：改為線上口述三十分鐘",
      reflectNote: "最希望照亮重新說故事的那段；每週一小步更穩。",
    },
  ],
  appDeepLink: {
    href: "/smart/radar",
    label: "打開圓夢藍圖，留下世界舞台光點 →",
  },
};

export const CHAPTER_12_OPENINGS: Record<string, ChapterOpening> = {
  "1200": CHAPTER_1200,
  "1201": CHAPTER_1201,
  "1202": CHAPTER_1202,
  "1203": CHAPTER_1203,
  "1204": CHAPTER_1204,
  "1205": CHAPTER_1205,
  "1206": CHAPTER_1206,
  "1207": CHAPTER_1207,
  "1208": CHAPTER_1208,
  "1209": CHAPTER_1209,
  "1210": CHAPTER_1210,
};

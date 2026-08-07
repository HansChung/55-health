import type { ChapterOpening } from "./chapter-opening";

const CH11_ACCENT = "linear-gradient(180deg, #F2EDE6 0%, #FFF8EE 55%)";
const CH11_DISCLAIMER =
  "作品由本人核可；共同記憶、姓名、照片與聲音需另行確認；私人版本也是完整成果。人工智慧可協助口述轉寫、整理與比較版本，不補造記憶，也不替任何人同意或公開。";

export const CHAPTER_P4_OPEN: ChapterOpening = {
  id: "p4-open",
  qrCode: "P4-OPEN",
  title: "從一件作品，到一座自己的世界",
  subtitle: "第四部｜部開篇｜實踐頁",
  layout: "part4-start",
  headerEmoji: "✨",
  accentGradient: CH11_ACCENT,
  quote: "圓夢不是把自己推向更大的舞台，而是完成一件真正的作品，讓生命智慧在合適的距離繼續流動。",
  atAGlance:
    "第四部〈圓夢〉：把一路累積的經驗、選擇與智慧，完成為一件屬於自己的作品。作品不必公開才算完成；由自己決定保存、分享與前進的距離。" +
    CH11_DISCLAIMER,
  tryPrompt:
    "寫下圓夢起點：我想完成什麼、它對生命代表什麼，以及目前想先讓誰看見、分享距離在哪。",
  reflectPrompt: "即使沒有掌聲、沒有公開，完成這件作品仍會為我帶來什麼？",
  reflectPlaceholder: "例如：即使只留給自己，我也會更清楚自己走過的路…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "暖暖可依序詢問「想完成的作品、生命意義、目前分享距離」，只整理成《第四部圓夢起點卡》，不替您選作品，也不自動公開。" +
    CH11_DISCLAIMER,
  practiceWhere: "mixed",
  capabilityNote:
    "起點卡可在本頁完成；提問可進暖暖。正式連結完成後置入 QR；目前為預留位置，不可掃描。",
  printCardTitle: "第四部圓夢起點卡",
  printCardDescription: "可列印：想完成的作品、生命意義、分享對象與距離。",
  printButtonLabel: "列印圓夢起點卡",
  guideTitle: "第四部｜圓夢",
  guideDuration: "部開篇",
  guideParagraphs: [
    "走過前面的學習，您已練習照顧生活、打開好奇，也能在變化中做出更成熟的判斷。來到第四部，我們不急著再學更多；而是把一路累積的經驗、選擇與智慧，完成為一件屬於自己的作品。",
    "許多人不是沒有故事，而是照片散在手機裡、聲音留在記憶裡，想做的事總等著「有空再說」。先珍藏，是完整；分享給家人，是完整；願意再向外一步，也同樣完整。",
    "人在前面，工具在後面。作品的意義、真實、語氣、界線與分享對象，都由本人決定；人工智慧與數位工具只協助口述轉寫、整理素材、比較版本、編排圖文與準備分享。",
  ],
  guideFooterNote: "找到生命故事的意義 → 完成一件真正的作品 → 感受創作成就 → 讓喜悅與價值繼續流動。",
  footerGuideLabel: "閱讀第四部部開篇",
  entries: [
    {
      id: "story",
      label: "故事傳承",
      hint: "進入第十一章",
      emoji: "📖",
      href: "/smart/chapter/1100",
    },
    {
      id: "theme",
      label: "主題界線",
      hint: "想留下／珍藏／不碰",
      emoji: "🚪",
      href: "/smart/chapter/1101",
    },
    {
      id: "form",
      label: "作品形式",
      hint: "選一種能完成的",
      emoji: "🎨",
      href: "/smart/chapter/1106",
    },
    {
      id: "share",
      label: "分享護照",
      hint: "先珍藏再決定距離",
      emoji: "🛂",
      href: "/smart/chapter/1110",
    },
  ],
  part4StartDemos: [
    {
      id: "family-story",
      label: "案例｜家庭故事卡",
      wantComplete: "為母親做一張三張照片的故事卡",
      lifeMeaning: "把她常說的那句話留下來，給子女看見",
      shareWho: "先給手足看",
      shareDistance: "指定分享",
      reflectNote: "即使沒有公開，完成這張卡也會讓我更踏實。",
    },
  ],
};

export const CHAPTER_1100: ChapterOpening = {
  id: "1100",
  qrCode: "1100",
  title: "故事傳承｜讓生命經驗成為可珍藏的作品",
  subtitle: "第十一章｜章節開篇",
  layout: "story-start",
  headerEmoji: "📖",
  accentGradient: CH11_ACCENT,
  quote: "故事的價值，不在於多完整，而在於是否留下了只有自己能說出的眼光。",
  atAGlance:
    "本章路線：從主題與界線、三件線索、三色核可、故事核心與原聲開始，選擇一種能完成的形式，經過共編與同意，完成「數位傳家寶五件套」和「作品分享護照」。" +
    CH11_DISCLAIMER,
  tryPrompt:
    "寫下一件想留下的事：希望後來的人感受到什麼，以及今天先標記為只給自己／可與特定人共編／待確認。",
  reflectPrompt: "讀完這幾句，是否仍像自己的聲音，也讓我願意開始？",
  reflectPlaceholder: "例如：這幾句讀起來仍像我平時會說的話…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "暖暖可依序詢問「想留下的事、希望他人感受到什麼、目前保存狀態」，只整理成《作品意向卡》，不補寫、不公開。" +
    CH11_DISCLAIMER,
  practiceWhere: "mixed",
  capabilityNote:
    "意向卡與路線可在本頁完成；提問可進暖暖。正式連結完成後置入 QR；目前為預留位置，不可掃描。",
  printCardTitle: "我的作品意向卡",
  printCardDescription: "可列印：想留下的事、希望他人感受到什麼、目前保存狀態。",
  printButtonLabel: "列印作品意向卡",
  guideTitle: "章首導讀｜故事傳承",
  guideDuration: "約 2 分鐘",
  guideParagraphs: [
    "手機裡存著多年的照片，抽屜裡還有幾張老卡片；談起往事時，也常想起某個人、某個選擇，或一句至今仍受用的話。這些看似零散的片段，不是等待清理的舊資料，而是只有自己能解讀的生命線索。",
    "故事傳承不等於從出生寫到現在，也不必先學會剪片、排版或架網站。可以從一張照片、一件物品、一段聲音，甚至一道家常菜開始。真正要留下的，不只是事情順序，而是當時如何看、如何選、如何走過。",
    "人工智慧可以協助口述轉寫、整理時間線、比較版本，或提醒哪些地方仍需確認；故事中心始終在本人手中。作品不必宏大；願意開始，就是把生命厚度化成作品。",
  ],
  guideFooterNote: "語音導讀之後再補；請先留下一件想留下的事，再選路線。",
  footerGuideLabel: "閱讀 2 分鐘章首導讀",
  entries: [
    {
      id: "boundary",
      label: "主題界線",
      hint: "想留下／珍藏／不碰",
      emoji: "🚪",
      href: "/smart/chapter/1101",
    },
    {
      id: "clues",
      label: "三件線索",
      hint: "不必先整理完",
      emoji: "🗺",
      href: "/smart/chapter/1102",
    },
    {
      id: "form",
      label: "作品形式",
      hint: "選一種能完成的",
      emoji: "🎨",
      href: "/smart/chapter/1106",
    },
    {
      id: "passport",
      label: "分享護照",
      hint: "先珍藏再決定距離",
      emoji: "🛂",
      href: "/smart/chapter/1110",
    },
  ],
  storyStartDemos: [
    {
      id: "recipe",
      label: "案例｜家常菜",
      leaveWhat: "外婆的滷肉飯做法與那句「慢慢燉」",
      hopeFeel: "家的味道與不趕的節奏",
      saveStatus: "可與特定人共編",
      reflectNote: "這幾句仍像自己的聲音，也讓我願意開始。",
    },
  ],
};

export const CHAPTER_1101: ChapterOpening = {
  id: "1101",
  qrCode: "1101",
  title: "留下什麼，由您決定",
  subtitle: "第十一章",
  layout: "theme-boundary",
  headerEmoji: "🚪",
  accentGradient: CH11_ACCENT,
  quote: "故事的門把一直在自己手中；開始、暫停與改變方向都可以。",
  atAGlance:
    "先把主題分成三區：「想留下」「只供自己珍藏」「暫時不碰」。今天的選擇不是永久承諾，以後可以修改。決定不留下什麼，也是一種創作主權。" +
    CH11_DISCLAIMER,
  tryPrompt: "完成主題與界線三區卡，並標出今天最願意開始的一項。",
  reflectPrompt: "這個主題是自己真心想留下，還是因為別人的期待？",
  reflectPlaceholder: "例如：這是我真心想留下的，不是為了應付別人…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "暖暖可依序詢問「想留下／只供珍藏／暫時不碰」，只整理成《主題與界線卡》，不追問原因，也不替您排序。" +
    CH11_DISCLAIMER,
  practiceWhere: "mixed",
  capabilityNote: "三區卡可在本頁完成；暖暖不替您判定哪一段更重要。",
  printCardTitle: "主題與界線三區卡",
  printCardDescription: "可列印：想留下、只供珍藏、暫時不碰，以及今天最願意開始的。",
  printButtonLabel: "列印三區卡",
  guideTitle: "主題與界線",
  guideDuration: "心法",
  guideParagraphs: [
    "面對一箱照片或一長串往事，最容易出現的壓力，是覺得每件都重要、每段都該交代。結果不是開始，而是遲遲不敢動手。",
    "故事傳承不需要一次整理完一生。每一區先放一件，再問：想到它時，我感到有力量，還是只感到被催促？",
    "若某段記憶帶來強烈不適，也可以停下來，改選較有力量的故事。傳承先從選擇開始。",
  ],
  guideFooterNote: "請先完成三區卡，再選今天最願意開始的主題。",
  footerGuideLabel: "閱讀主題界線說明",
  themeBoundaryDemos: [
    {
      id: "three-zones",
      label: "案例｜三區",
      wantKeep: "第一次搬家那天的選擇",
      privateOnly: "與某段關係有關的信件",
      notTouch: "仍會刺痛的爭執",
      startToday: "第一次搬家那天的選擇",
      reflectNote: "這個主題是自己真心想留下的。",
    },
  ],
};

export const CHAPTER_1102: ChapterOpening = {
  id: "1102",
  qrCode: "1102",
  title: "記憶不是檔案櫃",
  subtitle: "第十一章",
  layout: "three-clues",
  headerEmoji: "🗺",
  accentGradient: CH11_ACCENT,
  quote: "三件找得到、說得出意義的線索，已足以讓故事開始。",
  atAGlance:
    "先選三件線索就好。對每件回答：它是什麼？為什麼今天仍重要？放在哪裡？還需要問誰？不必立刻搬移或上傳。" +
    CH11_DISCLAIMER,
  tryPrompt: "完成三件故事線索盤點：線索與位置、它讓我想起什麼，以及是否需要詢問他人。",
  reflectPrompt: "哪一件最能喚回故事，而不只是增加資料量？",
  reflectPlaceholder: "例如：那張模糊照片最能喚回那天的決定…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "暖暖可逐一整理三件線索、位置與待詢問的人，只形成《故事線索盤點》，不掃描原件，也不推論記憶。" +
    CH11_DISCLAIMER,
  practiceWhere: "mixed",
  capabilityNote: "線索盤點可在本頁完成；請勿把敏感原件交給不熟悉的服務。",
  printCardTitle: "故事線索盤點",
  printCardDescription: "可列印：三件線索、位置、意義與待詢問的人。",
  printButtonLabel: "列印線索盤點",
  guideTitle: "三件線索",
  guideDuration: "練習",
  guideParagraphs: [
    "照片、信件、獎牌、食譜與聲音檔，看似是故事全部，其實只是入口。",
    "若一開始就想把數十年的資料掃描、命名與分類，很容易把圓夢變成漫長的檔案工程。",
    "三件線索已足以形成第一張故事地圖，也保留日後繼續探索與補充的空間。",
  ],
  guideFooterNote: "請先記下位置，不必立刻搬移或上傳。",
  footerGuideLabel: "閱讀線索盤點說明",
  threeCluesDemos: [
    {
      id: "clues",
      label: "案例｜三件線索",
      clue1: "舊相簿第 3 頁合照｜抽屜｜想起搬家前的最後一頓飯",
      clue2: "錄音裡的笑聲｜手機語音備忘｜想起母親勸我慢慢來",
      clue3: "手寫食譜｜廚房抽屜｜還想問妹妹當時的細節",
      reflectNote: "那張合照最能喚回故事，而不只是增加資料。",
    },
  ],
};

export const CHAPTER_1103: ChapterOpening = {
  id: "1103",
  qrCode: "1103",
  title: "先辨真，再動筆",
  subtitle: "第十一章",
  layout: "three-color-check",
  headerEmoji: "🚦",
  accentGradient: CH11_ACCENT,
  quote: "先查紅、再問黃、保留綠；不確定可以誠實留下。",
  atAGlance:
    "三色核可不是打分：紅標查證或標記不確定；黃標確認共同記憶是否尊重；綠標保留自己的原話與語調。" +
    CH11_DISCLAIMER,
  tryPrompt: "完成一張三色核可卡：一處紅標、一處黃標、一句綠標。",
  reflectPrompt: "紅標誠實嗎？黃標尊重嗎？綠標仍像自己的聲音嗎？",
  reflectPlaceholder: "例如：紅標我已標「大約」；綠標仍像我平時說的話…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "暖暖可整理一處紅標、一處黃標與一句綠標，只形成《三色核可卡》，不替您判真，也不替任何人同意。" +
    CH11_DISCLAIMER,
  practiceWhere: "mixed",
  capabilityNote: "核可卡可在本頁完成；動人的句子不一定是真實的句子。",
  printCardTitle: "三色核可卡",
  printCardDescription: "可列印：紅標查證、黃標尊重、綠標原話。",
  printButtonLabel: "列印三色核可卡",
  guideTitle: "三色核可",
  guideDuration: "心法",
  guideParagraphs: [
    "人工智慧能協助整理，也可能把模糊處補成完整句子，甚至增加沒有說過的時間、地點、因果或情緒。",
    "不同版本可以並列，不必把不確定處硬補成答案。",
    "三色不是三個等級，而是三條清楚的處理路徑。",
  ],
  guideFooterNote: "請先完成一張三色核可卡。",
  footerGuideLabel: "閱讀三色核可說明",
  threeColorCheckDemos: [
    {
      id: "colors",
      label: "案例｜三色",
      redMark: "搬家年份仍待確認（大約是那一年）",
      yellowMark: "合照中妹妹是否同意被寫進故事",
      greenMark: "「那時候我選了留下，而不是趕著證明自己。」",
      reflectNote: "紅標誠實、黃標待問、綠標仍像自己。",
    },
  ],
};

export const CHAPTER_1104: ChapterOpening = {
  id: "1104",
  qrCode: "1104",
  title: "找到故事的核心",
  subtitle: "第十一章",
  layout: "story-core",
  headerEmoji: "◎",
  accentGradient: CH11_ACCENT,
  quote: "零散記憶聚成一句自己的話，作品就開始有了方向。",
  atAGlance:
    "用一句話找核心：「那時我面對……，我選擇……，今天我想留下的是……。」故事核心不在事件有多大，而在自己當時如何回應。" +
    CH11_DISCLAIMER,
  tryPrompt: "完成並朗讀故事核心句：面對、選擇、今天留下。",
  reflectPrompt: "這句話說出真實選擇了嗎？朗讀起來仍像自己嗎？",
  reflectPlaceholder: "例如：朗讀時不太像標語，比較像我會說的話…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "暖暖可一次只問一題，依序整理「面對／選擇／留下」，只形成《故事核心句》，不替您升華或總結人生。" +
    CH11_DISCLAIMER,
  practiceWhere: "mixed",
  capabilityNote: "核心句可在本頁完成；避免直接套用漂亮口號。",
  printCardTitle: "故事核心句",
  printCardDescription: "可列印：當時面對、關鍵選擇、今天留下。",
  printButtonLabel: "列印故事核心句",
  guideTitle: "故事核心",
  guideDuration: "練習",
  guideParagraphs: [
    "好故事不一定有驚天動地的情節。一次搬家、一份工作、一頓飯或一句道歉，都可能因為其中的選擇而留下力量。",
    "先暫時放下完整時間線，只看三個位置：事情發生前、關鍵時刻、事情過後。",
    "若朗讀起來太像標語、太不像自己，就換回平常會說的字。",
  ],
  guideFooterNote: "請完成核心句並朗讀一次。",
  footerGuideLabel: "閱讀故事核心說明",
  samplePrompt:
    "請一次只問一題，幫我寫出故事核心句。請依序問：那時我面對什麼？我做了什麼選擇？今天我想留下的是什麼？請用我的語言整理成一句可朗讀的話，不要替我升華或總結人生。",
  storyCoreDemos: [
    {
      id: "core",
      label: "案例｜核心句",
      faced: "要不要離開熟悉的城市",
      chose: "先安頓家人，再慢慢找下一步",
      leaveToday: "緩慢也是一種負責任的選擇",
      reflectNote: "這句話說出真實選擇，朗讀起來仍像自己。",
    },
  ],
};

export const CHAPTER_1105: ChapterOpening = {
  id: "1105",
  qrCode: "1105",
  title: "讓聲音留下來",
  subtitle: "第十一章",
  layout: "voice-draft",
  headerEmoji: "🎙",
  accentGradient: CH11_ACCENT,
  quote: "原聲、停頓與節奏，都由本人決定保留多少。",
  atAGlance:
    "先用手機錄音三分鐘：事情怎麼開始？哪一刻改變了？今天想留下什麼？轉寫稿不是最終故事；不要急著把口語全部磨平。" +
    CH11_DISCLAIMER,
  tryPrompt: "完成三分鐘口述重點：事情怎麼開始、哪一刻改變了，以及三個原聲詞語。",
  reflectPrompt: "轉寫稿保留自己的用字與節奏嗎？是否有他人聲音需要同意？",
  reflectPlaceholder: "例如：我保留了「慢慢來」這句口頭禪；沒有他人聲音…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "暖暖可接收一次語音口述並整理成《口述初稿》，不複製聲音、不製作仿聲，也不自動分享。" +
    CH11_DISCLAIMER,
  practiceWhere: "mixed",
  capabilityNote:
    "口述重點可在本頁完成；含他人聲音時，未取得同意不得公開或製作仿聲。",
  printCardTitle: "口述初稿卡",
  printCardDescription: "可列印：開始、改變時刻與三個原聲詞語。",
  printButtonLabel: "列印口述初稿卡",
  guideTitle: "原聲口述",
  guideDuration: "練習",
  guideParagraphs: [
    "有些故事寫不下來，說起來卻自然流動。說錯可以重來，也可以保留停頓。",
    "先找出人名、地名、方言與容易聽錯的詞，再調整段落。",
    "說到不想保留的地方，可以直接說「這段刪掉」。只有文字最自在，也是一件完整作品的起點。",
  ],
  guideFooterNote: "原始錄音放在自己決定的私人位置。",
  footerGuideLabel: "閱讀原聲口述說明",
  voiceDraftDemos: [
    {
      id: "voice",
      label: "案例｜口述",
      startHow: "先說搬家前那頓飯怎麼開始",
      changeMoment: "母親說「慢慢來」的那一刻",
      voiceWords: "慢慢來｜先安頓｜不必證明",
      reflectNote: "轉寫稿保留了我的用字；沒有他人聲音需另同意。",
    },
  ],
};

export const CHAPTER_1106: ChapterOpening = {
  id: "1106",
  qrCode: "1106",
  title: "創藝工坊：選一種形式",
  subtitle: "第十一章",
  layout: "form-blueprint",
  headerEmoji: "🎨",
  accentGradient: CH11_ACCENT,
  quote: "只選一種能完成的形式，先讓作品真正誕生。",
  atAGlance:
    "故事卡、圖文小冊、聲音故事或微影音，都能成為完整作品。先定義最小完成版：一張卡、四頁小冊、三分鐘音檔或六十秒影片。" +
    CH11_DISCLAIMER,
  tryPrompt: "完成作品形式藍圖：形式與受眾、已有材料／還缺一項、最小完成版與今天第一步。",
  reflectPrompt: "這個形式適合故事，也適合目前的時間、精力與材料嗎？",
  reflectPlaceholder: "例如：故事卡最適合；我這週只能做一張…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "暖暖可依序詢問「想給誰、有何材料、願意投入多少時間」，只整理成《作品形式藍圖》，不替您選工具。" +
    CH11_DISCLAIMER,
  practiceWhere: "mixed",
  capabilityNote: "形式藍圖可在本頁完成；也能完全用紙本或熟悉工具完成。",
  printCardTitle: "作品形式藍圖",
  printCardDescription: "可列印：形式、受眾、材料與最小完成版。",
  printButtonLabel: "列印形式藍圖",
  guideTitle: "四種形式",
  guideDuration: "工坊",
  guideParagraphs: [
    "最好的形式，不是最華麗，而是最能讓故事被完整感受。",
    "若作品有聲音或影像，預留字幕、逐字稿或圖像說明，讓不同需要的人都能理解。",
    "完成後若有餘力，可以擴充；沒有擴充也已是一件完整作品。",
  ],
  guideFooterNote: "請只選一種能完成的形式。",
  footerGuideLabel: "閱讀形式藍圖說明",
  formBlueprintDemos: [
    {
      id: "card",
      label: "案例｜故事卡",
      formAudience: "故事卡｜給手足",
      materials: "三張照片、一句核心句；還缺字幕以外的圖說一句",
      minDone: "一張完成；今天先選三張照片",
      reflectNote: "這個形式適合故事，也適合我目前的時間。",
    },
  ],
};

export const CHAPTER_1107: ChapterOpening = {
  id: "1107",
  qrCode: "1107",
  title: "與人工智慧共編，不失真",
  subtitle: "第十一章",
  layout: "coedit-truth",
  headerEmoji: "🤝",
  accentGradient: CH11_ACCENT,
  quote: "同一份稿，查紅、問黃、留綠，最後由本人朗讀核可。",
  atAGlance:
    "真正的共編不是比較多層稿件，而是回到同一份草稿，以三色核可守住作者聲音。工具退到後方，作品的意義與作者聲音回到前景。" +
    CH11_DISCLAIMER,
  tryPrompt: "完成三色核可稿：查紅、問黃、留綠，最後朗讀並核可。",
  reflectPrompt: "這篇作品真實、尊重他人，也仍像自己的聲音嗎？",
  reflectPlaceholder: "例如：我刪掉 AI 補上的情緒句，綠標仍像自己…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "暖暖可整理「一處要查證、一處要尊重、一句要保留的原話」，只形成《三色核可稿》，不替您做最後決定。" +
    CH11_DISCLAIMER,
  practiceWhere: "mixed",
  capabilityNote: "核可稿可在本頁完成；最後核可仍由作者完成。",
  printCardTitle: "三色核可稿",
  printCardDescription: "可列印：查紅、問黃、留綠與朗讀核可。",
  printButtonLabel: "列印三色核可稿",
  guideTitle: "共編不失真",
  guideDuration: "心法",
  guideParagraphs: [
    "把一段口述交給人工智慧，很快就能得到流暢、完整，甚至頗為感人的文字。",
    "紅標處查證或改回誠實的不確定；黃標處調整、詢問或先留在私人版；綠標處原則上直接保留。",
    "不必留下多套版本給讀者。保留一份原始材料與一份本人核可稿即可。",
  ],
  guideFooterNote: "當三色都處理完，再朗讀一次：「這仍是我的故事嗎？」",
  footerGuideLabel: "閱讀共編說明",
  coeditTruthDemos: [
    {
      id: "coedit",
      label: "案例｜核可稿",
      checkRed: "刪掉 AI 補上的正確日期，改回「大約那年夏天」",
      askYellow: "合照說明先改為「家人」，待妹妹確認",
      keepGreen: "保留原句「我選了留下」",
      reflectNote: "這篇真實、尊重他人，也仍像自己的聲音。",
    },
  ],
};

export const CHAPTER_1108: ChapterOpening = {
  id: "1108",
  qrCode: "1108",
  title: "共同記憶，彼此尊重",
  subtitle: "第十一章",
  layout: "shared-memory",
  headerEmoji: "💛",
  accentGradient: CH11_ACCENT,
  quote: "每個人都能控制自己的呈現方式，也能日後調整或撤回。",
  atAGlance:
    "相關人物可以接受、調整、暫不談，也可以日後改變心意。同意可以很細：願意放進家庭群組，不代表願意公開網路。" +
    CH11_DISCLAIMER,
  tryPrompt: "完成共同記憶確認卡：故事裡有誰、如何呈現、給誰看，以及調整或撤回方式。",
  reflectPrompt: "故事裡的人是否感到被尊重？這份確認也讓自己安心嗎？",
  reflectPlaceholder: "例如：妹妹可接受家庭群組，但不願公開姓名…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "暖暖可依序整理「故事裡有誰、希望如何呈現、給誰看、如何調整或撤回」，不替任何人同意。" +
    CH11_DISCLAIMER,
  practiceWhere: "mixed",
  capabilityNote: "確認卡可在本頁完成；人工智慧不能替任何人表態。",
  printCardTitle: "共同記憶確認卡",
  printCardDescription: "可列印：人物、呈現方式、受眾與撤回方式。",
  printButtonLabel: "列印確認卡",
  guideTitle: "彼此尊重",
  guideDuration: "心法",
  guideParagraphs: [
    "一張合照、一段往事或一則家族故事，常同時連著幾個人的感受。",
    "若一時無法確認，就先留在私人版，或改用自己的描述。",
    "當故事裡的人感到被尊重，作者也能更安心地欣賞成果。",
  ],
  guideFooterNote: "請先完成共同記憶確認卡。",
  footerGuideLabel: "閱讀共同記憶說明",
  sharedMemoryDemos: [
    {
      id: "shared",
      label: "案例｜確認",
      whoSee: "故事裡有妹妹；想給手足看",
      presentHow: "可用合照，姓名改稱「妹妹」",
      adjustHow: "若她改心意，改匿名或移除照片",
      reflectNote: "這份確認讓妹妹與我都比較安心。",
    },
  ],
};

export const CHAPTER_1109: ChapterOpening = {
  id: "1109",
  qrCode: "1109",
  title: "完成數位傳家寶",
  subtitle: "第十一章",
  layout: "heirloom-kit",
  headerEmoji: "🎁",
  accentGradient: CH11_ACCENT,
  quote: "五件套讓作品有內容、有來路、有界線，也能被未來的人理解。",
  atAGlance:
    "主作品加上來源註記、分享說明、可及性（字幕／逐字稿／圖說）與兩地備份，構成「數位傳家寶五件套」。最後用另一台裝置真正打開一次。" +
    CH11_DISCLAIMER,
  tryPrompt: "核對數位傳家寶五件套，用另一台裝置開啟，並留下一句喝采。",
  reflectPrompt: "未來的自己或家人能否找得到、打得開、看得懂？",
  reflectPlaceholder: "例如：家人知道資料夾位置，也能打開 PDF…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "暖暖可依序核對五件套並記下「我完成了什麼」，只整理成《數位傳家寶完成卡》，不讀取檔案，也不替您上傳。" +
    CH11_DISCLAIMER,
  practiceWhere: "mixed",
  capabilityNote: "完成卡可在本頁勾選；請勿把帳號密碼交給他人。",
  printCardTitle: "數位傳家寶完成卡",
  printCardDescription: "可列印：五件套核對與完成喝采。",
  printButtonLabel: "列印完成卡",
  guideTitle: "五件套",
  guideDuration: "完成",
  guideParagraphs: [
    "主作品可輸出為常見格式，如 PDF、MP3 或 MP4；原始材料與可編輯檔另存。",
    "兩地備份可以是一份雲端、一份個人電腦或加密外接裝置。不要只依賴單一帳號。",
    "當作品有主檔、有來路、有分享說明、有可及性與備份，就值得停下來為自己喝采。",
  ],
  guideFooterNote: "請實際開啟一次後，再寫下喝采句。",
  footerGuideLabel: "閱讀傳家寶說明",
  heirloomKitDemos: [
    {
      id: "kit",
      label: "案例｜五件套",
      kitCheck: "主作品 PDF／來源註記／分享說明／圖說／雲端＋外接備份",
      openTest: "已用平板開啟並可閱讀",
      cheer: "我完成了母親的故事卡",
      reflectNote: "未來的家人找得到、打得開、看得懂。",
    },
  ],
};

export const CHAPTER_1110: ChapterOpening = {
  id: "1110",
  qrCode: "1110",
  title: "先珍藏，再選擇分享",
  subtitle: "第十一章",
  layout: "share-passport",
  headerEmoji: "🛂",
  accentGradient: CH11_ACCENT,
  quote: "先欣賞成果，再由自己決定作品要停留在哪一個距離。",
  atAGlance:
    "私人、指定分享與公開沒有高低，也可以隨時改變。《作品分享護照》記錄作者、作品心意、素材來源、相關人物意願、目前分享方式與日後調整方法。" +
    CH11_DISCLAIMER,
  tryPrompt: "完成作品分享護照：目前狀態、分享心意與期限，以及調整或撤回方式。",
  reflectPrompt: "目前最想珍藏，還是分享給合適的人？這個距離讓我自在嗎？",
  reflectPlaceholder: "例如：今天只想珍藏，這個距離讓我自在…",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "暖暖會先邀請您說出一件最有成就感的事，再整理「私人／指定分享／受邀社群／公開」選擇；不建立連結，也不自動分享。" +
    CH11_DISCLAIMER,
  practiceWhere: "mixed",
  capabilityNote:
    "分享護照可在本頁完成並點成光點。今天只想珍藏，不是尚未完成，而是完整且成熟的選擇。",
  printCardTitle: "作品分享護照",
  printCardDescription: "可列印：目前狀態、心意、受眾、期限與撤回方式。",
  printButtonLabel: "列印分享護照",
  guideTitle: "分享距離",
  guideDuration: "章末",
  guideParagraphs: [
    "數位傳家寶完成後，第一個狀態可以是「只供自己珍藏」。",
    "若選擇分享，先寫清楚目的、受眾、管道、期限與撤回方式；指定對象連結最好用另一個帳號測試權限。",
    "帶著作品與分享護照走進第十二章，世界舞台才會是自己選擇的舞台。",
  ],
  guideFooterNote: "先欣賞作品，再選擇距離。",
  footerGuideLabel: "閱讀分享護照說明",
  sharePassportDemos: [
    {
      id: "passport",
      label: "案例｜護照",
      status: "只給自己",
      intent: "先自己珍藏一季；之後再給手足",
      withdraw: "若要分享，改為指定連結並可隨時關閉",
      reflectNote: "今天只想珍藏，這個距離讓我自在。",
    },
  ],
  appDeepLink: {
    href: "/smart/radar",
    label: "打開圓夢藍圖，留下故事傳承光點 →",
  },
};

export const CHAPTER_11_OPENINGS: Record<string, ChapterOpening> = {
  "p4-open": CHAPTER_P4_OPEN,
  "1100": CHAPTER_1100,
  "1101": CHAPTER_1101,
  "1102": CHAPTER_1102,
  "1103": CHAPTER_1103,
  "1104": CHAPTER_1104,
  "1105": CHAPTER_1105,
  "1106": CHAPTER_1106,
  "1107": CHAPTER_1107,
  "1108": CHAPTER_1108,
  "1109": CHAPTER_1109,
  "1110": CHAPTER_1110,
};

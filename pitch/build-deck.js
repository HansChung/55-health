// 暖暖 NuanNuan 5 分鐘通路招商 PPT 生成器
const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9"; // 10" x 5.625"
pres.author = "Hans Chung";
pres.title = "暖暖 NuanNuan - 通路招商簡報";

// 暖暖品牌色
const C = {
  primary: "E8845A",      // 溫暖橘
  deep: "C95E36",         // 深橘
  cream: "FAF5EC",        // 奶油底
  creamDeep: "F2E8D5",    // 深奶油
  ink1: "3D2E20",         // 深咖啡（主文字）
  ink2: "6B5848",         // 淺咖啡
  ink3: "A89580",         // 灰咖啡（小字）
  sage: "7AA779",         // 鼠尾草綠
  berry: "C95B6E",        // 莓紅（警示）
  gold: "D9A441",         // 金（成就）
  white: "FFFFFF",
  line: "EDE3D0",         // 分隔線
  shadow: "000000",
};

const FONT = {
  header: "PingFang TC",
  body: "PingFang TC",
};

// 工具函式：圓角卡片
function addCard(slide, opts) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: opts.x, y: opts.y, w: opts.w, h: opts.h,
    fill: { color: opts.fill || C.white },
    line: { color: opts.line || C.line, width: 1 },
    rectRadius: opts.r || 0.15,
    shadow: { type: "outer", color: C.shadow, blur: 8, offset: 2, angle: 90, opacity: 0.06 },
  });
}

// 工具函式：emoji icon 在圓圈裡
function addIconCircle(slide, x, y, size, emoji, bgColor) {
  slide.addShape(pres.shapes.OVAL, {
    x, y, w: size, h: size,
    fill: { color: bgColor || C.creamDeep },
    line: { color: bgColor || C.creamDeep, width: 0 },
  });
  slide.addText(emoji, {
    x, y, w: size, h: size,
    fontSize: size * 28, fontFace: FONT.body,
    align: "center", valign: "middle",
    margin: 0,
  });
}

// ============================================================
// SLIDE 1: 封面
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: C.cream };

  // 右上角裝飾大圓
  s.addShape(pres.shapes.OVAL, {
    x: 7.5, y: -2, w: 5, h: 5,
    fill: { color: C.primary, transparency: 70 },
    line: { color: C.primary, width: 0 },
  });
  s.addShape(pres.shapes.OVAL, {
    x: 8.2, y: -1, w: 3, h: 3,
    fill: { color: C.deep, transparency: 60 },
    line: { color: C.deep, width: 0 },
  });

  // 左下角裝飾小圓
  s.addShape(pres.shapes.OVAL, {
    x: -1, y: 4.5, w: 2.5, h: 2.5,
    fill: { color: C.creamDeep },
    line: { color: C.creamDeep, width: 0 },
  });

  // 熊 emoji
  s.addText("🐻", {
    x: 0.6, y: 0.6, w: 1.2, h: 1.2,
    fontSize: 80, align: "center", valign: "middle", margin: 0,
  });

  // 主標
  s.addText("暖暖", {
    x: 0.6, y: 1.8, w: 6, h: 1.2,
    fontSize: 80, fontFace: FONT.header, bold: true,
    color: C.deep, margin: 0,
  });

  // Slogan
  s.addText("陪 55+ 健康變老的 AI 管家", {
    x: 0.6, y: 3.0, w: 7, h: 0.6,
    fontSize: 24, fontFace: FONT.body,
    color: C.ink1, margin: 0,
  });

  // 副 slogan
  s.addText("拍照記錄．拍藥袋．AI 語音陪伴．家人共享", {
    x: 0.6, y: 3.55, w: 8, h: 0.4,
    fontSize: 14, fontFace: FONT.body,
    color: C.ink2, italic: true, margin: 0,
  });

  // 底部資訊條
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 5.05, w: 10, h: 0.575,
    fill: { color: C.deep }, line: { color: C.deep, width: 0 },
  });
  s.addText([
    { text: "🌐 nuan55.com", options: { fontSize: 14, color: C.white, bold: true } },
    { text: "     |     ", options: { fontSize: 14, color: C.white } },
    { text: "鍾志鴻 Hans Chung", options: { fontSize: 14, color: C.white } },
    { text: "     |     ", options: { fontSize: 14, color: C.white } },
    { text: "創辦人 Founder", options: { fontSize: 14, color: C.white, italic: true } },
  ], {
    x: 0.6, y: 5.05, w: 9, h: 0.575,
    fontFace: FONT.body, valign: "middle", margin: 0,
  });

  // 右下角 Date
  s.addText("通路招商簡報   |   2026", {
    x: 6, y: 4.6, w: 3.5, h: 0.3,
    fontSize: 11, fontFace: FONT.body,
    color: C.ink3, align: "right", margin: 0,
  });
}

// ============================================================
// SLIDE 2: 痛點 - 3 個大數字
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: C.cream };

  // 頂部小標
  s.addText("PROBLEM   |   為什麼台灣需要暖暖", {
    x: 0.6, y: 0.35, w: 9, h: 0.3,
    fontSize: 11, fontFace: FONT.body, charSpacing: 4,
    color: C.deep, bold: true, margin: 0,
  });

  // 主標
  s.addText("台灣老化來得又快又猛，但工具沒跟上", {
    x: 0.6, y: 0.7, w: 9, h: 0.7,
    fontSize: 30, fontFace: FONT.header, bold: true,
    color: C.ink1, margin: 0,
  });

  // 三張數字卡
  const cards = [
    {
      x: 0.6, big: "20.8%", label: "2025 台灣 65+ 人口占比",
      sub: "正式進入「超高齡社會」",
      color: C.deep, icon: "📊", iconBg: "FCE4D5",
    },
    {
      x: 3.7, big: "78%", label: "子女最擔心爸媽「亂吃藥」",
      sub: "想關心卻幫不上忙",
      color: C.berry, icon: "💊", iconBg: "F4D7DC",
    },
    {
      x: 6.8, big: "< 5%", label: "現有健康 App 七日留存率",
      sub: "字太小、難用、長輩棄用",
      color: C.gold, icon: "📱", iconBg: "F6E8C2",
    },
  ];

  cards.forEach((c) => {
    addCard(s, { x: c.x, y: 1.6, w: 2.85, h: 3.0 });

    // icon 圈
    addIconCircle(s, c.x + 1.075, 1.85, 0.7, c.icon, c.iconBg);

    // 大數字
    s.addText(c.big, {
      x: c.x, y: 2.7, w: 2.85, h: 0.9,
      fontSize: 54, fontFace: FONT.header, bold: true,
      color: c.color, align: "center", valign: "middle", margin: 0,
    });

    // 主 label
    s.addText(c.label, {
      x: c.x + 0.2, y: 3.65, w: 2.45, h: 0.4,
      fontSize: 13, fontFace: FONT.body, bold: true,
      color: C.ink1, align: "center", margin: 0,
    });

    // 子 label
    s.addText(c.sub, {
      x: c.x + 0.2, y: 4.05, w: 2.45, h: 0.4,
      fontSize: 11, fontFace: FONT.body,
      color: C.ink2, align: "center", italic: true, margin: 0,
    });
  });

  // 底部結論條
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.6, y: 4.85, w: 8.8, h: 0.55,
    fill: { color: C.ink1 }, line: { color: C.ink1, width: 0 },
    rectRadius: 0.1,
  });
  s.addText("有需求、有錢、但沒有對的工具 — 這就是暖暖的市場機會", {
    x: 0.6, y: 4.85, w: 8.8, h: 0.55,
    fontSize: 14, fontFace: FONT.body, bold: true,
    color: C.white, align: "center", valign: "middle", margin: 0,
  });
}

// ============================================================
// SLIDE 3: 解決方案
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: C.cream };

  // 頂部小標
  s.addText("SOLUTION   |   暖暖如何解決", {
    x: 0.6, y: 0.35, w: 9, h: 0.3,
    fontSize: 11, fontFace: FONT.body, charSpacing: 4,
    color: C.deep, bold: true, margin: 0,
  });

  // 主標
  s.addText("一台手機．三個動作．長輩自己就能用", {
    x: 0.6, y: 0.7, w: 9, h: 0.7,
    fontSize: 30, fontFace: FONT.header, bold: true,
    color: C.ink1, margin: 0,
  });

  // 三個功能卡片
  const features = [
    {
      x: 0.6, icon: "📷", iconBg: "FCE4D5",
      title: "拍照記錄",
      desc: "拍一張菜 → AI 自動算熱量、營養、提醒少鹽",
      time: "操作時間 < 5 秒",
    },
    {
      x: 3.7, icon: "💊", iconBg: "F4D7DC",
      title: "拍藥袋",
      desc: "拍藥袋 → 自動讀出藥名、用法、設定提醒",
      time: "省下找眼鏡時間",
    },
    {
      x: 6.8, icon: "🎙️", iconBg: "E5EFE2",
      title: "AI 語音陪伴",
      desc: "中文語音對話，心情陪伴 + 健康問答",
      time: "像跟孫子聊天",
    },
  ];

  features.forEach((f) => {
    addCard(s, { x: f.x, y: 1.6, w: 2.85, h: 2.3 });

    addIconCircle(s, f.x + 1.075, 1.8, 0.7, f.icon, f.iconBg);

    s.addText(f.title, {
      x: f.x + 0.15, y: 2.6, w: 2.55, h: 0.4,
      fontSize: 20, fontFace: FONT.header, bold: true,
      color: C.deep, align: "center", margin: 0,
    });

    s.addText(f.desc, {
      x: f.x + 0.2, y: 3.0, w: 2.45, h: 0.6,
      fontSize: 12, fontFace: FONT.body,
      color: C.ink1, align: "center", margin: 0,
    });

    s.addText(f.time, {
      x: f.x + 0.2, y: 3.55, w: 2.45, h: 0.3,
      fontSize: 10, fontFace: FONT.body,
      color: C.ink3, align: "center", italic: true, margin: 0,
    });
  });

  // 四大特色 chip 列
  s.addText("為長輩量身設計", {
    x: 0.6, y: 4.1, w: 9, h: 0.35,
    fontSize: 13, fontFace: FONT.body, bold: true,
    color: C.ink1, margin: 0,
  });

  const chips = [
    { text: "字超大 26pt", x: 0.6 },
    { text: "一鍵操作", x: 2.5 },
    { text: "免下載 App", x: 4.1 },
    { text: "家人共享", x: 6.0 },
    { text: "中文語音", x: 7.7 },
  ];

  chips.forEach((c) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: c.x, y: 4.55, w: 1.7, h: 0.45,
      fill: { color: C.primary }, line: { color: C.primary, width: 0 },
      rectRadius: 0.22,
    });
    s.addText(c.text, {
      x: c.x, y: 4.55, w: 1.7, h: 0.45,
      fontSize: 12, fontFace: FONT.body, bold: true,
      color: C.white, align: "center", valign: "middle", margin: 0,
    });
  });

  // 底部 tag
  s.addText("✨ 已上線運作 · nuan55.com 立即可試用", {
    x: 0.6, y: 5.15, w: 9, h: 0.35,
    fontSize: 13, fontFace: FONT.body, bold: true,
    color: C.sage, align: "center", margin: 0,
  });
}

// ============================================================
// SLIDE 4: Live Demo（純視覺過場頁）
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: C.ink1 };

  // 大暈染圓
  s.addShape(pres.shapes.OVAL, {
    x: -2, y: -2, w: 8, h: 8,
    fill: { color: C.primary, transparency: 80 },
    line: { color: C.primary, width: 0 },
  });
  s.addShape(pres.shapes.OVAL, {
    x: 5, y: 1, w: 7, h: 7,
    fill: { color: C.deep, transparency: 75 },
    line: { color: C.deep, width: 0 },
  });

  // 中間大字
  s.addText("LIVE DEMO", {
    x: 0, y: 1.6, w: 10, h: 0.6,
    fontSize: 18, fontFace: FONT.body, charSpacing: 8,
    color: C.primary, bold: true,
    align: "center", margin: 0,
  });

  s.addText("90 秒", {
    x: 0, y: 2.2, w: 10, h: 1.5,
    fontSize: 110, fontFace: FONT.header, bold: true,
    color: C.white, align: "center", margin: 0,
  });

  s.addText("實機操作 — 看長輩怎麼用", {
    x: 0, y: 3.7, w: 10, h: 0.6,
    fontSize: 24, fontFace: FONT.body,
    color: C.creamDeep, align: "center", margin: 0,
  });

  // 流程指示
  s.addText("📷 拍照記錄  →  💊 拍藥袋  →  🎙️ 語音對話", {
    x: 0, y: 4.5, w: 10, h: 0.4,
    fontSize: 16, fontFace: FONT.body,
    color: C.cream, align: "center", margin: 0,
  });

  // 底部 URL
  s.addText("nuan55.com", {
    x: 0, y: 5.0, w: 10, h: 0.4,
    fontSize: 14, fontFace: FONT.body, italic: true,
    color: C.ink3, align: "center", margin: 0,
  });
}

// ============================================================
// SLIDE 5: 合作模式 - 3 種方案對照
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: C.cream };

  // 頂部小標
  s.addText("PARTNERSHIP   |   三種彈性合作模式", {
    x: 0.6, y: 0.35, w: 9, h: 0.3,
    fontSize: 11, fontFace: FONT.body, charSpacing: 4,
    color: C.deep, bold: true, margin: 0,
  });

  // 主標
  s.addText("依您的需求三選一．可混搭", {
    x: 0.6, y: 0.7, w: 9, h: 0.65,
    fontSize: 30, fontFace: FONT.header, bold: true,
    color: C.ink1, margin: 0,
  });

  // 三個方案直立卡（不同顏色 header）
  const plans = [
    {
      x: 0.6, header: C.primary, badge: "最簡單",
      icon: "🤝", title: "聯名推廣",
      contrib: "您：在通路曝光 / 推薦",
      revenue: "30%",
      revenueLabel: "訂閱分潤",
      time: "1 週上線",
    },
    {
      x: 3.7, header: C.deep, badge: "做自有品牌",
      icon: "🏷️", title: "白標客製",
      contrib: "您：定義品牌與通路",
      revenue: "月費 + 分潤",
      revenueLabel: "雙重收入",
      time: "1 個月上線",
    },
    {
      x: 6.8, header: C.ink1, badge: "適合大型通路",
      icon: "🔌", title: "API/SDK 整合",
      contrib: "您：嵌入既有 App",
      revenue: "省成本",
      revenueLabel: "按用量計費",
      time: "2 個月上線",
    },
  ];

  plans.forEach((p) => {
    // 卡片主體
    addCard(s, { x: p.x, y: 1.55, w: 2.85, h: 3.4 });

    // 頂部色條
    s.addShape(pres.shapes.RECTANGLE, {
      x: p.x, y: 1.55, w: 2.85, h: 0.5,
      fill: { color: p.header }, line: { color: p.header, width: 0 },
    });

    // Badge（在色條上）
    s.addText(p.badge, {
      x: p.x + 0.2, y: 1.6, w: 2.45, h: 0.4,
      fontSize: 11, fontFace: FONT.body, bold: true,
      color: C.white, valign: "middle", margin: 0,
    });

    // Icon
    s.addText(p.icon, {
      x: p.x + 0.2, y: 2.2, w: 2.45, h: 0.6,
      fontSize: 40, align: "center", valign: "middle", margin: 0,
    });

    // Title
    s.addText(p.title, {
      x: p.x + 0.2, y: 2.85, w: 2.45, h: 0.4,
      fontSize: 22, fontFace: FONT.header, bold: true,
      color: C.ink1, align: "center", margin: 0,
    });

    // 分隔線
    s.addShape(pres.shapes.LINE, {
      x: p.x + 0.6, y: 3.3, w: 1.65, h: 0,
      line: { color: C.line, width: 1 },
    });

    // 角色說明
    s.addText(p.contrib, {
      x: p.x + 0.2, y: 3.4, w: 2.45, h: 0.35,
      fontSize: 11, fontFace: FONT.body,
      color: C.ink2, align: "center", margin: 0,
    });

    // 大數字 / 收入
    s.addText(p.revenue, {
      x: p.x + 0.2, y: 3.8, w: 2.45, h: 0.5,
      fontSize: 24, fontFace: FONT.header, bold: true,
      color: p.header, align: "center", margin: 0,
    });

    s.addText(p.revenueLabel, {
      x: p.x + 0.2, y: 4.3, w: 2.45, h: 0.3,
      fontSize: 11, fontFace: FONT.body,
      color: C.ink3, align: "center", margin: 0,
    });

    // 上線時間 chip
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: p.x + 0.55, y: 4.6, w: 1.75, h: 0.3,
      fill: { color: C.creamDeep }, line: { color: C.creamDeep, width: 0 },
      rectRadius: 0.15,
    });
    s.addText("⏱  " + p.time, {
      x: p.x + 0.55, y: 4.6, w: 1.75, h: 0.3,
      fontSize: 10, fontFace: FONT.body, bold: true,
      color: C.ink1, align: "center", valign: "middle", margin: 0,
    });
  });

  // 底部提示
  s.addText("👉  具體合約條款與細節價格，留待下週深度會議討論", {
    x: 0.6, y: 5.15, w: 8.8, h: 0.35,
    fontSize: 12, fontFace: FONT.body, italic: true,
    color: C.ink2, align: "center", margin: 0,
  });
}

// ============================================================
// SLIDE 6: 對你的好處 + Next Step
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: C.cream };

  // 頂部小標
  s.addText("WHY US   |   為什麼選擇暖暖", {
    x: 0.6, y: 0.35, w: 9, h: 0.3,
    fontSize: 11, fontFace: FONT.body, charSpacing: 4,
    color: C.deep, bold: true, margin: 0,
  });

  // 主標
  s.addText("4 個對通路夥伴的具體好處", {
    x: 0.6, y: 0.7, w: 9, h: 0.65,
    fontSize: 28, fontFace: FONT.header, bold: true,
    color: C.ink1, margin: 0,
  });

  // 2x2 好處 grid
  const benefits = [
    { x: 0.6, y: 1.55, icon: "💰", title: "新增訂閱分潤", desc: "客戶持續訂閱、您持續拿分潤", color: C.sage },
    { x: 5.05, y: 1.55, icon: "🔒", title: "提升客戶黏著", desc: "每天打開 = 持續品牌觸及", color: C.primary },
    { x: 0.6, y: 2.95, icon: "📊", title: "合法健康數據", desc: "用於行銷再優化，符合個資法", color: C.gold },
    { x: 5.05, y: 2.95, icon: "🎁", title: "您完全不用開發", desc: "產品 + 技術 + 客服我們全包", color: C.berry },
  ];

  benefits.forEach((b) => {
    addCard(s, { x: b.x, y: b.y, w: 4.35, h: 1.3 });

    // 左側色條
    s.addShape(pres.shapes.RECTANGLE, {
      x: b.x, y: b.y, w: 0.08, h: 1.3,
      fill: { color: b.color }, line: { color: b.color, width: 0 },
    });

    // Icon
    s.addText(b.icon, {
      x: b.x + 0.25, y: b.y + 0.3, w: 0.7, h: 0.7,
      fontSize: 32, align: "center", valign: "middle", margin: 0,
    });

    // Title
    s.addText(b.title, {
      x: b.x + 1.0, y: b.y + 0.2, w: 3.2, h: 0.45,
      fontSize: 18, fontFace: FONT.header, bold: true,
      color: C.ink1, valign: "middle", margin: 0,
    });

    // Desc
    s.addText(b.desc, {
      x: b.x + 1.0, y: b.y + 0.7, w: 3.2, h: 0.45,
      fontSize: 12, fontFace: FONT.body,
      color: C.ink2, valign: "middle", margin: 0,
    });
  });

  // 底部 CTA 大色塊
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.6, y: 4.45, w: 8.8, h: 0.95,
    fill: { color: C.deep }, line: { color: C.deep, width: 0 },
    rectRadius: 0.18,
  });

  s.addText("換名片  →  下週深度會議  →  給您試用帳號", {
    x: 0.6, y: 4.45, w: 8.8, h: 0.55,
    fontSize: 22, fontFace: FONT.header, bold: true,
    color: C.white, align: "center", valign: "middle", margin: 0,
  });

  s.addText("🌐  nuan55.com    |    📧  sunboy1120@gmail.com    |    🐻  鍾志鴻 Hans Chung", {
    x: 0.6, y: 4.95, w: 8.8, h: 0.4,
    fontSize: 12, fontFace: FONT.body,
    color: C.cream, align: "center", valign: "middle", margin: 0,
  });
}

// ============================================================
// 儲存
// ============================================================
pres.writeFile({ fileName: "/Users/hanschung/Desktop/55/pitch/暖暖-通路招商-5min.pptx" })
  .then((fileName) => console.log("✅ 簡報已生成: " + fileName));

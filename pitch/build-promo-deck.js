// 暖暖 NuanNuan 宣傳簡報（品牌版）生成器
// 視覺語言：暖陽子午線 — 奶油底、同心弧、品牌橘、大量留白
const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9"; // 10" x 5.625"
pres.author = "NuanNuan";
pres.title = "暖暖 NuanNuan - 宣傳簡報";

const C = {
  primary: "E8845A", deep: "C95E36", cream: "FAF5EC", creamDeep: "F2E8D5",
  ink1: "3D2E20", ink2: "6B5848", ink3: "A89580", sage: "7AA779",
  gold: "D9A441", berry: "C95B6E", white: "FFFFFF", line: "E3D6C0",
  arc: "E8B694",
};
const FONT = { h: "PingFang TC", b: "PingFang TC" };
const LOGO = "/Users/hanschung/Desktop/55/public/icon-maskable-512.png"; // 1024 奶油底品牌臉

// ── 共用元件 ──────────────────────────────
function bgArcs(s, cx, cy, radii, opacity = 60) {
  // 同心弧：用無填色 OVAL 疊出（pptx 沒有弧，圓超出頁面即成弧）
  radii.forEach((r, i) => {
    s.addShape(pres.shapes.OVAL, {
      x: cx - r, y: cy - r, w: r * 2, h: r * 2,
      fill: { type: "none" },
      line: { color: C.arc, width: 1, transparency: Math.min(92, opacity + i * 8) },
    });
  });
}

function kicker(s, text) {
  s.addText(text, {
    x: 0.6, y: 0.38, w: 8.8, h: 0.3,
    fontSize: 11, fontFace: FONT.b, charSpacing: 4,
    color: C.deep, bold: true, margin: 0,
  });
}

function bigTitle(s, text, y = 0.72) {
  s.addText(text, {
    x: 0.6, y, w: 8.8, h: 0.65,
    fontSize: 30, fontFace: FONT.h, bold: true, color: C.ink1, margin: 0,
  });
}

function pageFoot(s, n) {
  s.addText(`nuan55.com　·　${n}`, {
    x: 7.6, y: 5.22, w: 1.9, h: 0.3, align: "right",
    fontSize: 9, fontFace: FONT.b, color: C.ink3, margin: 0,
  });
}

// ════════════════════════════════════════════
// S1 封面 — 暖陽升起
// ════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.cream };
  bgArcs(s, 5, 3.4, [1.3, 1.9, 2.6, 3.4, 4.3, 5.3], 55);

  // 品牌臉（奶油底 PNG 融入背景）
  s.addImage({ path: LOGO, x: 3.95, y: 1.05, w: 2.1, h: 2.1 });

  s.addText("暖暖", {
    x: 0, y: 3.15, w: 10, h: 1.05, align: "center",
    fontSize: 64, fontFace: FONT.h, bold: false, color: C.deep,
    charSpacing: 20, margin: 0,
  });
  s.addText("N U A N N U A N", {
    x: 0, y: 4.12, w: 10, h: 0.35, align: "center",
    fontSize: 13, fontFace: FONT.b, color: C.ink3, charSpacing: 6, margin: 0,
  });
  s.addText("陪 55+ 健康變老的 AI 管家", {
    x: 0, y: 4.5, w: 10, h: 0.45, align: "center",
    fontSize: 20, fontFace: FONT.b, color: C.ink2, margin: 0,
  });
  s.addText("nuan55.com", {
    x: 0, y: 5.08, w: 10, h: 0.35, align: "center",
    fontSize: 13, fontFace: FONT.b, bold: true, color: C.primary,
    charSpacing: 2, margin: 0,
  });
}

// ════════════════════════════════════════════
// S2 為什麼需要暖暖
// ════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.cream };
  kicker(s, "WHY　·　為什麼需要暖暖");
  bigTitle(s, "台灣已進入超高齡社會，但工具沒跟上");

  const stats = [
    { x: 0.6, big: "20.8%", t: "65 歲以上人口占比", d: "每 5 人就有 1 位長輩", c: C.deep, e: "📊" },
    { x: 3.75, big: "78%", t: "子女最擔心的事", d: "爸媽亂吃藥、飲食不均", c: C.berry, e: "💊" },
    { x: 6.9, big: "< 5%", t: "健康 App 長輩留存率", d: "字太小、太複雜、學不會", c: C.gold, e: "📱" },
  ];
  stats.forEach((st) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: st.x, y: 1.65, w: 2.5, h: 2.9, rectRadius: 0.14,
      fill: { color: C.white }, line: { color: C.line, width: 1 },
      shadow: { type: "outer", color: "000000", blur: 8, offset: 2, angle: 90, opacity: 0.06 },
    });
    s.addText(st.e, { x: st.x, y: 1.95, w: 2.5, h: 0.5, align: "center", fontSize: 28, margin: 0 });
    s.addText(st.big, {
      x: st.x, y: 2.5, w: 2.5, h: 0.85, align: "center",
      fontSize: 44, fontFace: FONT.h, bold: true, color: st.c, margin: 0,
    });
    s.addText(st.t, {
      x: st.x + 0.15, y: 3.42, w: 2.2, h: 0.4, align: "center",
      fontSize: 13, fontFace: FONT.b, bold: true, color: C.ink1, margin: 0,
    });
    s.addText(st.d, {
      x: st.x + 0.15, y: 3.82, w: 2.2, h: 0.5, align: "center",
      fontSize: 11, fontFace: FONT.b, color: C.ink2, margin: 0,
    });
  });

  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.6, y: 4.82, w: 8.8, h: 0.52, rectRadius: 0.1,
    fill: { color: C.ink1 }, line: { color: C.ink1, width: 0 },
  });
  s.addText("長輩需要的不是更多功能，是「不用學就會用」的陪伴", {
    x: 0.6, y: 4.82, w: 8.8, h: 0.52, align: "center", valign: "middle",
    fontSize: 14, fontFace: FONT.b, bold: true, color: C.white, margin: 0,
  });
  pageFoot(s, "02");
}

// ════════════════════════════════════════════
// S3 暖暖是什麼
// ════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.cream };
  bgArcs(s, 8.6, 2.8, [1.2, 1.9, 2.7, 3.6], 60);

  kicker(s, "WHAT　·　暖暖是什麼");
  s.addText("一位住在手機裡的\n貼心健康管家", {
    x: 0.6, y: 1.1, w: 5.4, h: 1.7,
    fontSize: 34, fontFace: FONT.h, bold: true, color: C.ink1,
    lineSpacing: 44, margin: 0,
  });
  s.addText("不用下載、不用打字、不用學。\n打開網頁，拍張照片，暖暖就開始照顧您。", {
    x: 0.6, y: 2.9, w: 5.2, h: 0.9,
    fontSize: 15, fontFace: FONT.b, color: C.ink2, lineSpacing: 24, margin: 0,
  });

  s.addImage({ path: LOGO, x: 7.35, y: 1.55, w: 2.5, h: 2.5 });

  const chips = [
    { t: "字超大　好閱讀", x: 0.6 }, { t: "一鍵操作", x: 2.75 },
    { t: "免下載 App", x: 4.45 }, { t: "台語式親切中文", x: 6.3 },
  ];
  chips.forEach((c) => {
    const w = c.t.length * 0.22 + 0.5;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: c.x, y: 4.15, w, h: 0.48, rectRadius: 0.24,
      fill: { color: C.primary }, line: { color: C.primary, width: 0 },
    });
    s.addText(c.t, {
      x: c.x, y: 4.15, w, h: 0.48, align: "center", valign: "middle",
      fontSize: 13, fontFace: FONT.b, bold: true, color: C.white, margin: 0,
    });
  });

  s.addText("🌐 用瀏覽器打開 nuan55.com 就能開始", {
    x: 0.6, y: 4.9, w: 8.8, h: 0.4,
    fontSize: 14, fontFace: FONT.b, bold: true, color: C.sage, margin: 0,
  });
  pageFoot(s, "03");
}

// ════════════════════════════════════════════
// S4 三大核心功能
// ════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.cream };
  kicker(s, "HOW　·　三個動作，全部搞定");
  bigTitle(s, "拍一下，暖暖就懂");

  const feats = [
    { x: 0.6, e: "📷", t: "拍照記錄飲食", d: "拍一張菜，AI 自動算出熱量與營養，貼心提醒少鹽少油", tag: "5 秒完成", bg: "FCE4D5" },
    { x: 3.75, e: "💊", t: "拍藥袋管用藥", d: "藥袋一拍，自動讀出藥名用法，時間到提醒吃藥", tag: "不怕忘記", bg: "F4D7DC" },
    { x: 6.9, e: "🎙️", t: "跟暖暖聊聊天", d: "真人般的語音對話，陪伴解悶、回答健康問題", tag: "像孫子陪聊", bg: "E5EFE2" },
  ];
  feats.forEach((f) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: f.x, y: 1.6, w: 2.5, h: 3.15, rectRadius: 0.14,
      fill: { color: C.white }, line: { color: C.line, width: 1 },
      shadow: { type: "outer", color: "000000", blur: 8, offset: 2, angle: 90, opacity: 0.06 },
    });
    s.addShape(pres.shapes.OVAL, {
      x: f.x + 0.9, y: 1.85, w: 0.7, h: 0.7,
      fill: { color: f.bg }, line: { color: f.bg, width: 0 },
    });
    s.addText(f.e, { x: f.x + 0.9, y: 1.85, w: 0.7, h: 0.7, align: "center", valign: "middle", fontSize: 24, margin: 0 });
    s.addText(f.t, {
      x: f.x + 0.1, y: 2.72, w: 2.3, h: 0.42, align: "center",
      fontSize: 17, fontFace: FONT.h, bold: true, color: C.deep, margin: 0,
    });
    s.addText(f.d, {
      x: f.x + 0.22, y: 3.18, w: 2.06, h: 1.0, align: "center",
      fontSize: 11.5, fontFace: FONT.b, color: C.ink2, lineSpacing: 17, margin: 0,
    });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: f.x + 0.62, y: 4.22, w: 1.26, h: 0.36, rectRadius: 0.18,
      fill: { color: C.creamDeep }, line: { color: C.creamDeep, width: 0 },
    });
    s.addText(f.tag, {
      x: f.x + 0.62, y: 4.22, w: 1.26, h: 0.36, align: "center", valign: "middle",
      fontSize: 10.5, fontFace: FONT.b, bold: true, color: C.ink1, margin: 0,
    });
  });

  s.addText("全程不用打字　·　60 歲以上長輩實測 3 分鐘上手", {
    x: 0.6, y: 5.0, w: 8.8, h: 0.35, align: "center",
    fontSize: 12.5, fontFace: FONT.b, color: C.ink3, italic: true, margin: 0,
  });
  pageFoot(s, "04");
}

// ════════════════════════════════════════════
// S5 主動守護（差異化）
// ════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.ink1 };

  s.addShape(pres.shapes.OVAL, { x: -1.6, y: 2.4, w: 5, h: 5, fill: { color: C.deep, transparency: 78 }, line: { color: C.deep, width: 0 } });
  s.addShape(pres.shapes.OVAL, { x: 7, y: -1.8, w: 4.5, h: 4.5, fill: { color: C.primary, transparency: 80 }, line: { color: C.primary, width: 0 } });

  s.addText("GUARDIAN　·　不只記錄，更會主動守護", {
    x: 0.6, y: 0.4, w: 8.8, h: 0.3,
    fontSize: 11, fontFace: FONT.b, charSpacing: 4, color: C.primary, bold: true, margin: 0,
  });
  s.addText("長輩不說，暖暖也會替他說", {
    x: 0.6, y: 0.78, w: 8.8, h: 0.65,
    fontSize: 30, fontFace: FONT.h, bold: true, color: C.white, margin: 0,
  });

  const steps = [
    { x: 0.6, e: "👀", t: "暖暖天天觀察", d: "血壓、吃藥、活動\n每天自動巡邏" },
    { x: 3.06, e: "⚡", t: "發現不對勁", d: "血壓飆高、三天沒動靜\n跌倒、忘記吃藥" },
    { x: 5.52, e: "📨", t: "立刻通知家人", d: "子女手機馬上收到\n完整狀況說明" },
    { x: 7.98, e: "🤝", t: "家人及時關心", d: "一通電話\n就能化解危機" },
  ];
  steps.forEach((st, i) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: st.x, y: 1.85, w: 2.1, h: 2.5, rectRadius: 0.13,
      fill: { color: C.cream }, line: { color: C.cream, width: 0 },
      shadow: { type: "outer", color: "000000", blur: 10, offset: 3, angle: 90, opacity: 0.28 },
    });
    s.addText(st.e, { x: st.x, y: 2.05, w: 2.1, h: 0.55, align: "center", fontSize: 30, margin: 0 });
    s.addText(st.t, {
      x: st.x + 0.08, y: 2.72, w: 1.94, h: 0.4, align: "center",
      fontSize: 15, fontFace: FONT.h, bold: true, color: C.ink1, margin: 0,
    });
    s.addText(st.d, {
      x: st.x + 0.12, y: 3.15, w: 1.86, h: 0.95, align: "center",
      fontSize: 10.5, fontFace: FONT.b, color: C.ink2, lineSpacing: 15, margin: 0,
    });
    if (i < 3) {
      s.addText("→", {
        x: st.x + 2.08, y: 2.85, w: 0.42, h: 0.5, align: "center",
        fontSize: 22, bold: true, color: C.primary, margin: 0,
      });
    }
  });

  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.6, y: 4.72, w: 8.8, h: 0.55, rectRadius: 0.1,
    fill: { color: C.primary }, line: { color: C.primary, width: 0 },
  });
  s.addText("跌倒偵測 · 居家感測 · 異常預警 —— 已實際上線運作", {
    x: 0.6, y: 4.72, w: 8.8, h: 0.55, align: "center", valign: "middle",
    fontSize: 14, fontFace: FONT.b, bold: true, color: C.white, margin: 0,
  });
}

// ════════════════════════════════════════════
// S6 家人安心
// ════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.cream };
  kicker(s, "FAMILY　·　給子女的一顆定心丸");
  bigTitle(s, "爸媽今天好嗎？打開手機就知道");

  // 左：模擬子女儀表板卡
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.6, y: 1.62, w: 4.1, h: 3.35, rectRadius: 0.14,
    fill: { color: C.white }, line: { color: C.line, width: 1 },
    shadow: { type: "outer", color: "000000", blur: 8, offset: 2, angle: 90, opacity: 0.07 },
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.6, y: 1.62, w: 4.1, h: 0.62,
    fill: { color: "EAF3E7" }, line: { color: "EAF3E7", width: 0 },
  });
  s.addText([
    { text: "👵 陳美玲　", options: { fontSize: 14, bold: true, color: C.ink1 } },
    { text: "● 今天正常", options: { fontSize: 11, bold: true, color: C.sage } },
  ], { x: 0.85, y: 1.62, w: 3.7, h: 0.62, valign: "middle", fontFace: FONT.b, margin: 0 });

  const rows = [
    ["🍽️", "飲食", "已記錄 3 餐"], ["💊", "用藥", "2/2 已服用 ✓"],
    ["🩺", "血壓", "125 / 80 穩定"], ["🏠", "居家", "客廳有活動 · 26°C"],
    ["🧭", "幸福指數", "78 分（↑3）"],
  ];
  rows.forEach((r, i) => {
    const y = 2.38 + i * 0.5;
    s.addText([
      { text: `${r[0]}  `, options: { fontSize: 12 } },
      { text: `${r[1]}　`, options: { fontSize: 11.5, color: C.ink3 } },
      { text: r[2], options: { fontSize: 12, bold: true, color: C.ink1 } },
    ], { x: 0.85, y, w: 3.6, h: 0.42, valign: "middle", fontFace: FONT.b, margin: 0 });
    if (i < 4) s.addShape(pres.shapes.LINE, { x: 0.85, y: y + 0.46, w: 3.6, h: 0, line: { color: C.line, width: 0.75 } });
  });

  // 右：三個安心點
  const pts = [
    { t: "遠端就能看", d: "子女在自己手機上，隨時看到爸媽的飲食、用藥、血壓與居家狀況" },
    { t: "異常主動報", d: "有狀況第一時間通知，不用天天奪命連環 call" },
    { t: "隱私長輩管", d: "看得到什麼，由長輩自己決定；尊重是關懷的前提" },
  ];
  pts.forEach((p, i) => {
    const y = 1.75 + i * 1.08;
    s.addShape(pres.shapes.OVAL, {
      x: 5.1, y: y + 0.02, w: 0.42, h: 0.42,
      fill: { color: C.primary }, line: { color: C.primary, width: 0 },
    });
    s.addText(String(i + 1), {
      x: 5.1, y: y + 0.02, w: 0.42, h: 0.42, align: "center", valign: "middle",
      fontSize: 15, fontFace: FONT.h, bold: true, color: C.white, margin: 0,
    });
    s.addText(p.t, {
      x: 5.68, y, w: 3.7, h: 0.4,
      fontSize: 16, fontFace: FONT.h, bold: true, color: C.ink1, margin: 0,
    });
    s.addText(p.d, {
      x: 5.68, y: y + 0.4, w: 3.7, h: 0.62,
      fontSize: 11.5, fontFace: FONT.b, color: C.ink2, lineSpacing: 16, margin: 0,
    });
  });

  s.addText("「不是監視，是讓關心剛剛好。」", {
    x: 5.1, y: 4.98, w: 4.3, h: 0.4,
    fontSize: 13, fontFace: FONT.b, italic: true, color: C.deep, margin: 0,
  });
  pageFoot(s, "06");
}

// ════════════════════════════════════════════
// S7 三步驟開始
// ════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.cream };
  bgArcs(s, 5, 6.6, [2.2, 3.1, 4.1, 5.2], 58);

  kicker(s, "START　·　今天就開始");
  bigTitle(s, "三步驟，馬上開始");

  const steps = [
    { x: 0.6, n: "1", t: "打開網址", d: "手機瀏覽器輸入\nnuan55.com", e: "🌐" },
    { x: 3.75, n: "2", t: "簡單登入", d: "Google 或 Email\n免記密碼", e: "🔑" },
    { x: 6.9, n: "3", t: "拍第一張照", d: "拍下這一餐\n暖暖開始陪伴", e: "📷" },
  ];
  steps.forEach((st, i) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: st.x, y: 1.7, w: 2.5, h: 2.6, rectRadius: 0.14,
      fill: { color: C.white }, line: { color: C.line, width: 1 },
      shadow: { type: "outer", color: "000000", blur: 8, offset: 2, angle: 90, opacity: 0.06 },
    });
    s.addShape(pres.shapes.OVAL, {
      x: st.x + 0.95, y: 1.42, w: 0.6, h: 0.6,
      fill: { color: C.deep }, line: { color: C.cream, width: 2.5 },
    });
    s.addText(st.n, {
      x: st.x + 0.95, y: 1.42, w: 0.6, h: 0.6, align: "center", valign: "middle",
      fontSize: 20, fontFace: FONT.h, bold: true, color: C.white, margin: 0,
    });
    s.addText(st.e, { x: st.x, y: 2.25, w: 2.5, h: 0.55, align: "center", fontSize: 30, margin: 0 });
    s.addText(st.t, {
      x: st.x + 0.1, y: 2.95, w: 2.3, h: 0.42, align: "center",
      fontSize: 17, fontFace: FONT.h, bold: true, color: C.ink1, margin: 0,
    });
    s.addText(st.d, {
      x: st.x + 0.2, y: 3.4, w: 2.1, h: 0.75, align: "center",
      fontSize: 12, fontFace: FONT.b, color: C.ink2, lineSpacing: 17, margin: 0,
    });
    if (i < 2) {
      s.addText("→", {
        x: st.x + 2.5, y: 2.7, w: 0.65, h: 0.5, align: "center",
        fontSize: 24, bold: true, color: C.primary, margin: 0,
      });
    }
  });

  s.addText([
    { text: "💡 子女幫爸媽設定一次，", options: { color: C.ink2 } },
    { text: "之後長輩自己就會用", options: { color: C.deep, bold: true } },
  ], {
    x: 0.6, y: 4.62, w: 8.8, h: 0.4, align: "center",
    fontSize: 14, fontFace: FONT.b, margin: 0,
  });
  s.addText("免費開始使用　·　不需信用卡", {
    x: 0.6, y: 5.05, w: 8.8, h: 0.35, align: "center",
    fontSize: 12, fontFace: FONT.b, color: C.ink3, margin: 0,
  });
}

// ════════════════════════════════════════════
// S8 封底 CTA
// ════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.cream };
  bgArcs(s, 5, 2.5, [1.5, 2.2, 3.0, 3.9, 4.9], 52);

  s.addImage({ path: LOGO, x: 4.1, y: 0.75, w: 1.8, h: 1.8 });

  s.addText("讓關心，剛剛好", {
    x: 0, y: 2.72, w: 10, h: 0.8, align: "center",
    fontSize: 40, fontFace: FONT.h, bold: true, color: C.ink1, charSpacing: 6, margin: 0,
  });
  s.addText("暖暖 NuanNuan　·　陪 55+ 健康變老的 AI 管家", {
    x: 0, y: 3.62, w: 10, h: 0.4, align: "center",
    fontSize: 15, fontFace: FONT.b, color: C.ink2, margin: 0,
  });

  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 3.4, y: 4.25, w: 3.2, h: 0.62, rectRadius: 0.31,
    fill: { color: C.primary }, line: { color: C.primary, width: 0 },
    shadow: { type: "outer", color: "C95E36", blur: 10, offset: 3, angle: 90, opacity: 0.3 },
  });
  s.addText("nuan55.com", {
    x: 3.4, y: 4.25, w: 3.2, h: 0.62, align: "center", valign: "middle",
    fontSize: 20, fontFace: FONT.b, bold: true, color: C.white, charSpacing: 1, margin: 0,
  });

  s.addText("合作洽詢　sunboy1120@gmail.com", {
    x: 0, y: 5.12, w: 10, h: 0.32, align: "center",
    fontSize: 11, fontFace: FONT.b, color: C.ink3, margin: 0,
  });
}

pres.writeFile({ fileName: "/Users/hanschung/Desktop/55/pitch/暖暖-宣傳簡報.pptx" })
  .then((f) => console.log("✅ 宣傳簡報已生成: " + f));

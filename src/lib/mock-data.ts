import { Meal, FoodResult, TranscriptMessage } from "./types";

export const DEFAULT_MEALS: Meal[] = [
  { name: "早餐", time: "07:20", items: "白粥、蛋、青菜", cal: 380, color: "#E8845A", photo: "🍚 粥+蛋", logged: true },
  { name: "午餐", time: "12:30", items: "雞肉飯、蔬菜湯", cal: 620, color: "#D9A441", photo: "🍱 雞肉飯", logged: true },
  { name: "晚餐", time: "", items: "", cal: 0, color: "#7AA779", photo: "", logged: false },
];

export const MOCK_RESULT: FoodResult = {
  cal: 540,
  protein: 24,
  carb: 68,
  fat: 16,
  items: [
    { name: "白飯", amount: "1 碗 (150 克)", cal: 210, color: "#FBE6D4", emoji: "🍚" },
    { name: "紅燒肉", amount: "3 塊", cal: 220, color: "#F7DDE0", emoji: "🍖" },
    { name: "青江菜", amount: "半盤", cal: 30, color: "#DCEBD8", emoji: "🥬" },
    { name: "玉米", amount: "半根", cal: 80, color: "#F7E6BD", emoji: "🌽" },
  ],
};

export const VOICE_SCRIPT: TranscriptMessage[] = [
  { role: "user", text: "我今天可以吃水餃嗎？" },
  { role: "ai", text: "可以喔！您今天還有 520 大卡的空間，吃 10 顆豬肉水餃剛剛好。記得配個青菜湯，少沾醬油。" },
  { role: "user", text: "那血糖會不會太高？" },
  { role: "ai", text: "水餃皮是澱粉，吃完可以散步 15 分鐘幫助消化。我建議您先量血糖確認，目標是飯後 2 小時 140 以下。" },
];

export const HISTORY_DAYS = [
  {
    date: "今天 · 5/19", cal: 1280, goal: 1800,
    meals: [
      { name: "早餐", time: "07:20", items: "白粥、蛋、青菜", cal: 380, color: "#E8845A", emoji: "🍚" },
      { name: "午餐", time: "12:30", items: "雞肉飯、湯", cal: 620, color: "#D9A441", emoji: "🍱" },
      { name: "點心", time: "15:00", items: "香蕉、豆漿", cal: 280, color: "#7AA779", emoji: "🍌" },
    ],
  },
  {
    date: "昨天 · 5/18", cal: 1650, goal: 1800,
    meals: [
      { name: "早餐", time: "07:00", items: "吐司、牛奶", cal: 420, color: "#D9A441", emoji: "🍞" },
      { name: "午餐", time: "12:15", items: "魚湯麵", cal: 680, color: "#7AA779", emoji: "🍜" },
      { name: "晚餐", time: "18:30", items: "蒸蛋、青菜、糙米飯", cal: 550, color: "#E8845A", emoji: "🥗" },
    ],
  },
  {
    date: "5/17 · 星期六", cal: 1420, goal: 1800,
    meals: [
      { name: "早午餐", time: "10:00", items: "蛋餅、豆漿", cal: 480, color: "#D9A441", emoji: "🥞" },
      { name: "晚餐", time: "18:00", items: "清蒸魚、白飯、湯", cal: 720, color: "#7AA779", emoji: "🐟" },
    ],
  },
];

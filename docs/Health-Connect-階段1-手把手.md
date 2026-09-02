# Health Connect 階段 1 — 手把手測試（給 Hans）

> 目標：在 **Android 手機上的暖暖 App** 看到「今日步數」。  
> **不會改到** https://nuan55.com 網頁的既有功能。  
> 這階段**不會**把步數存進資料庫。

---

## 一、你需要準備

1. 一台 Windows / Mac 電腦  
2. 安裝 [Android Studio](https://developer.android.com/studio)（照預設下一步即可）  
3. 一支 **Android 8 以上**手機 + USB 線  
4. 手機開啟「開發人員選項」→ 打開 **USB 偵錯**  
   - 設定 → 關於手機 → 連點「版本號碼」7 次 → 回設定找開發人員選項  
5. 手機安裝 **Health Connect**（Android 14 多半已內建；較舊請到 Play 商店搜尋安裝）  
6. 建議手機有 Google Fit 或系統計步，並在 Health Connect 裡允許它寫入「步數」

---

## 二、為什麼 App 要連「網站」？

暖暖的大腦（登入、API）在 Vercel 網站上。  
Android App 是外殼：裡面用瀏覽器元件打開網站，**另外**用原生能力讀 Health Connect。

所以測試步驟是：

1. 先把本分支的程式部署到 Vercel（Preview 或合進 main）  
2. App 指向那個網址  
3. 在手機 App 裡按同步  

若 App 還指向舊的正式站、但正式站還沒部署這次更新，就**看不到**「同步今日步數」按鈕。

---

## 三、在電腦打開專案（第一次）

用終端機（Terminal）進入專案資料夾後執行：

```bash
git checkout cursor/health-connect-phase1-d5cf
git pull
npm install
```

---

## 四、部署這次程式（二選一）

### 方式 A（推薦）：合併 PR 後用正式站
1. 把 PR 合進 `main`，等 Vercel 部署完成  
2. App 預設就連 https://nuan55.com  

### 方式 B：用 Vercel Preview 網址測試（還不合 main）
1. 在 GitHub PR 頁找到 **Preview** 網址（像 `55-health-xxx.vercel.app`）  
2. 開 App 時指定該網址（見下一節）

---

## 五、打包並開 Android Studio

### 連正式站（合 main 之後）

```bash
npm run android:open
```

### 連 Preview 網址（把下面換成你的 Preview）

```bash
CAPACITOR_SERVER_URL=https://你的-preview.vercel.app npm run android:open
```

這會同步原生插件並打開 Android Studio。  
若第一次開專案，等右下角 Gradle Sync 跑完。

---

## 六、裝到手機

1. 手機用 USB 接電腦，允許「USB 偵錯」  
2. 在 Android Studio 上方裝置清單選你的手機  
3. 按綠色 ▶ **Run**  
4. 手機應會出現「暖暖」App  

若失敗：把 Android Studio 下方紅色錯誤文字複製給我。

---

## 七、在 App 裡測同步

1. 用你的帳號登入暖暖  
2. 打開 **健康紀錄**（體重／血壓／血糖那頁）  
3. 最上方應看到區塊：**手機健康資料**  
4. 按 **同步今日步數**  
5. 系統跳出 Health Connect 權限 → 勾選 **步數（Steps）** → 允許  
6. 成功時會顯示今天的步數大數字  

### 常見狀況

| 畫面訊息 | 你要做的事 |
|----------|------------|
| 完全沒有「手機健康資料」區塊 | App 連到的網站還沒部署這版；檢查 CAPACITOR_SERVER_URL／是否已部署 |
| 請安裝 Health Connect | Play 商店安裝後重試 |
| 還沒允許讀取步數 | 按「開啟 Health Connect 設定」勾選步數 |
| 今天還沒有步數資料 | 手機走幾步、等 Google Fit 同步後再按 |
| 用電腦瀏覽器看不到這區塊 | 正常！只有 Android App 才有 |

---

## 六、確認網頁沒壞（安心用）

用電腦瀏覽器開 https://nuan55.com （或本地 `npm run dev`）：

- **不應**出現「同步今日步數」按鈕  
- 飲食、語音、登入照常  

---

## 七、測完回報我

請回覆這三點：

1. 有沒有看到步數數字？是多少？  
2. 若失敗，完整錯誤訊息（或截圖描述）  
3. 手機品牌／Android 版本（設定 → 關於手機）

成功後我們再做 **階段 2：把步數存進暖暖**。

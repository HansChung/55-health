# 暖暖 Android 上架 Google Play 指南

> 架構：Android App 是一個「殼」，啟動後載入線上的 nuan55.com（前端不打包、不用改）。
> 建置：用 GitHub Actions 雲端建出簽章好的 `.aab`，**不需要本機 Android Studio**。
> 所有 Android 設定都在 `android-build` 分支，**不影響 main / 線上網站**。

---

## ✅ 已完成（我做好的）

- Capacitor 設定 → 載入 nuan55.com（`capacitor.config.ts`）
- 啟動／離線畫面（`android-shell/index.html`）
- 簽章設定（`android/app/build.gradle`，金鑰由 CI 注入、不入庫）
- 雲端建置流程（`.github/workflows/android-build.yml`）

---

## 📋 你要做的步驟

### Step 1：產生「上傳金鑰」（keystore）— 在你的 Mac 跑一次

打開終端機，貼這行（會問你一些密碼與資料，**密碼請記下來**）：

```bash
keytool -genkey -v -keystore ~/Desktop/nuannuan-upload-key.jks \
  -keyalg RSA -keysize 2048 -validity 10000 -alias nuannuan
```

- 問「金鑰庫密碼」→ 自己設一組，記下來（= KEYSTORE_PASSWORD）
- 問姓名/組織等 → 隨意填（可都按 Enter 用預設）
- 最後問金鑰密碼 → 直接 Enter 用同一組即可（= KEY_PASSWORD）

⚠️ **這個 .jks 檔要永久保存**！弄丟了以後就無法更新 App。建議備份到雲端硬碟。

### Step 2：把金鑰轉成文字（base64）

```bash
base64 -i ~/Desktop/nuannuan-upload-key.jks | pbcopy
```

（已複製到剪貼簿，等下貼到 GitHub）

### Step 3：到 GitHub 設定 4 個 Secret

開 https://github.com/HansChung/55-health/settings/secrets/actions → **New repository secret**，新增 4 個：

| Secret 名稱 | 值 |
|------------|-----|
| `ANDROID_KEYSTORE_BASE64` | 剛剛 base64 複製的那一大串 |
| `ANDROID_KEYSTORE_PASSWORD` | 你設的金鑰庫密碼 |
| `ANDROID_KEY_ALIAS` | `nuannuan` |
| `ANDROID_KEY_PASSWORD` | 你設的金鑰密碼（同上） |

### Step 4：觸發雲端建置

推送 `android-build` 分支就會自動建；或到
https://github.com/HansChung/55-health/actions → 「Android 建置（.aab）」→ **Run workflow**。

建完後在該次執行頁面下方 **Artifacts** 下載 `nuannuan-release-aab` → 解壓得到 `app-release.aab`。

---

## 🏪 Google Play 上架

### Step 5：註冊開發者帳號（US$25 一次性）
https://play.google.com/console/signup
- 個人帳號需身分驗證，審核約 2–14 天
- 建議用 sunboy1120@gmail.com

### Step 6：建立應用程式
Play Console → 建立應用程式：
- 名稱：暖暖（NuanNuan）
- 語言：繁體中文
- 類型：應用程式、免費

### Step 7：填必填項目（Console 會列清單）
- **隱私權政策網址**：https://nuan55.com/privacy ✅（你已有）
- **資料安全表**：見下方「資料安全填答」
- **內容分級問卷**：醫療/健康類，無暴力色情 → 普遍級
- **目標對象**：成人（非兒童導向）
- **商店資訊**：見下方「商店文案」
- **截圖**：至少 2 張手機截圖（用 nuan55.com 開手機版截）

### Step 8：上傳 .aab → 測試軌道
- 先放「**封閉測試**」軌道，加自己的 Gmail 當測試人員，裝起來實測
- 沒問題 → 推「正式版」送審（首次審核常要幾天，可能來回補件）

---

## 📝 商店文案（可直接用）

**簡短說明（80 字內）**
> 專為 55+ 設計的 AI 健康管家：拍照記錄飲食、拍藥袋、語音陪伴、家人遠端關懷。

**完整說明**
> 暖暖是專為 55 歲以上長輩設計的 AI 健康管家，字大、好操作：
>
> 📷 拍照記錄飲食，AI 自動分析熱量與營養
> 💊 拍藥袋自動辨識，提醒按時吃藥
> 🎙️ 跟 AI 暖暖語音聊天，陪伴與健康問答
> 🩺 記錄血壓、血糖、體重，掌握健康趨勢
> 👨‍👩‍👧 家人共享：子女可遠端關心、異常自動通知
> 🏠 智慧守護：偵測異常即時提醒家人
>
> 讓長輩健康有人陪、子女安心。

---

## 🔒 資料安全填答（重點）

- 有蒐集資料：是（健康資訊、電子郵件）
- 用途：App 功能（記錄與分析健康）
- 傳輸是否加密：是（HTTPS）
- 使用者可否要求刪除：是（提供聯絡信箱 sunboy1120@gmail.com）
- 健康資料：說明用於使用者本人健康記錄與經授權的家人查看

---

## ⚠️ 已知注意事項

1. **Google 登入**：App 內建瀏覽器可能擋 Google OAuth。**先主推 Email 驗證碼登入**（已支援）。日後再加原生 Google 登入。
2. **需要網路**：App 載入線上版，離線時顯示重連畫面。
3. **更新內容免重新送審**：因為內容跑 nuan55.com，網站更新 = App 內容即時更新；只有改原生殼/版本才需重新出 .aab。
4. **版本號**：下次更新前，把 `android/app/build.gradle` 的 `versionCode` +1、`versionName` 改新版號。

---

## 🆘 卡住時

把 GitHub Actions 的錯誤訊息、或 Play Console 的提示貼給我，我幫你解。

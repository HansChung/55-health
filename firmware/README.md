# 暖暖陪伴機器人 — ESP32-S3 韌體（第一階段原型）

按一下按鈕跟暖暖說話、時間到語音提醒吃藥、彩色螢幕顯示暖暖表情。
這份說明寫給「會插線、會照步驟做」的人（可以交給 maker 朋友），不需要寫程式。

---

## 1. 需要的零件

| 零件 | 建議型號 | 用途 |
|---|---|---|
| 開發板 | ESP32-S3 DevKitC-1（**要有 PSRAM**，型號含 N16R8 較佳） | 主控 |
| 麥克風 | INMP441（I2S 數位麥克風） | 收音 |
| 功放 + 喇叭 | MAX98357A + 4Ω 3W 小喇叭 | 播音 |
| 螢幕 | 1.54" / 2" ST7789 彩色 TFT（240x240，SPI） | 暖暖的臉 |
| 按鈕 | 任意大顆按鈕（長輩好按） | 說話鍵 |
| 其他 | 麵包板、杜邦線、USB-C 線 | — |

## 2. 接線表

> 板子腳位若不同，可在 `nuannuan-companion.ino` 最上面的「腳位設定」區改。

### INMP441 麥克風（I2S0 RX）

| INMP441 | ESP32-S3 |
|---|---|
| VDD | 3V3 |
| GND | GND |
| SCK | GPIO 4 |
| WS  | GPIO 5 |
| SD  | GPIO 6 |
| L/R | GND（左聲道） |

### MAX98357A 功放（I2S1 TX）

| MAX98357A | ESP32-S3 |
|---|---|
| VIN | 5V（或 3V3，音量較小） |
| GND | GND |
| BCLK | GPIO 15 |
| LRC  | GPIO 16 |
| DIN  | GPIO 7 |
| 喇叭 | 接功放的 + / − |

### ST7789 TFT 螢幕（SPI）

| TFT | ESP32-S3 |
|---|---|
| VCC | 3V3 |
| GND | GND |
| SCL(SCK) | GPIO 12 |
| SDA(MOSI) | GPIO 11 |
| RES | GPIO 9 |
| DC  | GPIO 8 |
| CS  | GPIO 10 |
| BLK | 3V3（常亮） |

### 按鈕

| 按鈕 | ESP32-S3 |
|---|---|
| 一腳 | GPIO 2 |
| 另一腳 | GND |

（程式用內建上拉，按下 = LOW）

## 3. 電腦環境（一次性）

1. 安裝 [Arduino IDE 2.x](https://www.arduino.cc/en/software)
2. `File → Preferences → Additional boards manager URLs` 貼上：
   `https://espressif.github.io/arduino-esp32/package_esp32_index.json`
3. `Tools → Board → Boards Manager` 搜 **esp32**（by Espressif）安裝 3.x 版
4. `Sketch → Include Library → Manage Libraries` 安裝：
   - **TFT_eSPI**（by Bodmer）
   - **ArduinoJson**（by Benoît Blanchon，7.x）
5. 設定 TFT_eSPI 腳位：打開
   `Arduino/libraries/TFT_eSPI/User_Setup.h`，整檔換成本資料夾附的
   [`User_Setup_NuanNuan.h`](User_Setup_NuanNuan.h) 內容（已照上面的接線寫好）。

## 4. 燒錄

1. 打開 `firmware/nuannuan-companion/nuannuan-companion.ino`
2. 把最上面的 `API_HOST` 確認是 `nuan55.com`（或你的測試網址）
3. `Tools` 選單：
   - Board：**ESP32S3 Dev Module**
   - PSRAM：**OPI PSRAM**（N16R8 板）或 QSPI PSRAM
   - Flash Size：16MB（依板子）
   - USB CDC On Boot：**Enabled**
4. USB 接上，按 **Upload**。若卡在 Connecting：按住板上 **BOOT** 鍵再點 Upload。

## 5. 第一次開機（配對）

1. 機器人通電 → 螢幕顯示「請用手機設定」
2. 在 App：`我的 → 陪伴機器人 → 新增 / 配對機器人` → 拿到 **6 位數配對碼**
3. 手機 Wi-Fi 連到「**NuanNuan-Setup**」熱點 → 瀏覽器自動彈出設定頁
   （沒彈出就打開瀏覽器輸入 `192.168.4.1`）
4. 選家裡 Wi-Fi、輸入密碼、輸入配對碼 → 送出
5. 機器人自己重開 → 連上網 → 換 token 成功 → 螢幕出現暖暖笑臉 → App 顯示「在線上」

之後配對資訊都存在板子裡（NVS），斷電重開不用重設。
想重設：**按住說話鍵開機 5 秒** → 清除設定回到第 1 步。

## 6. 日常使用

- **按一下按鈕**：嗶一聲後說話（最長 8 秒）→ 暖暖思考臉 → 語音回答
- **用藥提醒**：機器人每分鐘問一次伺服器，到提醒時間會自動開口
- 表情：待機 😊 / 聆聽 👂 / 思考 🤔 / 說話 💬 / 關心 🥰 / 注意 ⚠️

## 7. 疑難排解

| 症狀 | 可能原因 |
|---|---|
| 螢幕全白 | TFT_eSPI 的 User_Setup 沒換、或 DC/RES 接反 |
| 沒聲音 | MAX98357A 的 DIN/BCLK/LRC 順序接錯；喇叭沒鎖緊 |
| 錄不到音 | INMP441 的 L/R 沒接 GND；SCK/WS/SD 接錯 |
| 一直連不上 Wi-Fi | 只支援 2.4GHz，5GHz 連不上 |
| 回答 401 | App 端已解除綁定 → 重新配對 |
| 回答 429 | 這個月的語音分鐘配額用完了（App 可升級方案） |

## 8. 成本備註

一次問答 ≈ Whisper 語音辨識（按秒）+ Gemini 文字（很便宜）+ TTS（按字）。
比 App 的即時語音對話便宜一個數量級；秒數同樣計入帳號的「語音分鐘」月配額，
不怕小朋友狂按爆卡。

第二階段（即時對談、喚醒詞、豆包）見 [PHASE2.md](PHASE2.md)。

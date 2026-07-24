# 第二階段：即時對談 + 喚醒詞 + 豆包

第一階段（按鈕問答）穩定後再做這些。後端該有的端點都已備好。

---

## 1. 即時對談（跟 App 語音對話同等體驗）

後端已提供 **`POST /api/device/realtime-session`**（裝置 token 認證）：

```
POST https://nuan55.com/api/device/realtime-session
Authorization: Bearer <裝置 token>

→ { "client_secret": "ek_...", "session_id": "...", "model": "gpt-realtime", "max_seconds": 180, "quota": {...} }
```

拿到 `client_secret` 後機器人直連 OpenAI Realtime（不經過我們的伺服器），
沿用同一個「語音分鐘」月配額 + 單次 180 秒上限，成本不會失控。

韌體端兩條路：

| 路線 | 作法 | 備註 |
|---|---|---|
| A. WebRTC（推薦） | 用 Espressif 官方範例 [openai_realtime_embedded](https://github.com/openai/openai-realtime-embedded-sdk)（esp_webrtc） | 需轉 **ESP-IDF**（非 Arduino），S3 + PSRAM 可跑 |
| B. WebSocket 橋接 | 機器人 ↔ 我們的 server ↔ OpenAI WS | 延遲較高、伺服器要長連線（Vercel 不合適，需另起小 VM），除非 A 不可行否則不建議 |

## 2. 喚醒詞「暖暖」

- 用 **ESP-SR / WakeNet**（ESP32-S3 有向量指令，本地就能跑喚醒詞）
- 需轉 ESP-IDF + ESP-ADF 工程（跟路線 A 剛好同一套）
- 內建喚醒詞先用「Hi 樂鑫 / Hi ESP」驗證流程；
  自訂「暖暖」需向 Espressif 申請訓練或用社群工具（wakenet 自訂模型）
- 流程：WakeNet 喚醒 → 亮「聆聽臉」→ 走第一階段的錄音上傳（省錢），
  或開 realtime session（體驗好）— 可以做成 App 內的設定

## 3. 換豆包（火山引擎）降成本

後端已做成**可抽換**，改一個環境變數即可，韌體完全不用動：

```
# Vercel 環境變數
VOICE_PROVIDER=doubao
DOUBAO_APP_ID=xxxx
DOUBAO_ACCESS_TOKEN=xxxx
# 可選
DOUBAO_TTS_VOICE=zh_female_wanwanxiaohe_moon_bigtts
DOUBAO_TTS_CLUSTER=volcano_tts
```

實作位置：`src/lib/ai/voice-provider.ts`
- `doubao.transcribe`：大模型錄音檔識別（極速版，HTTP 一次來回）
- `doubao.synthesize`：TTS v1 HTTP（回 base64 WAV）

注意事項（上線前要確認）：
- 豆包是中國大陸服務：台灣連線延遲與可用性要實測；資料落地/法遵要評估
- 需要火山引擎實名帳號 + 開通語音技術服務
- 隨時可設回 `VOICE_PROVIDER=openai`，一鍵切換
- 豆包計價尚未加進 `src/lib/ai/pricing.ts`（目前記 0 元），接上後記得補

## 4. 建議順序

1. 路線 A 的 ESP-IDF 工程跑通 OpenAI 官方 embedded 範例（先用他們的 demo key 流程）
2. 把 key 來源改成我們的 `/api/device/realtime-session`
3. 加 WakeNet 喚醒詞
4. 申請火山引擎帳號 → 填 env 實測豆包（先在測試環境）

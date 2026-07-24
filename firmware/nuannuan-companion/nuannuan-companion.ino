/*
 * ────────────────────────────────────────────────
 * 暖暖陪伴機器人 — ESP32-S3 第一階段韌體
 *
 * 功能：
 *   1. 首次開機開 SoftAP「NuanNuan-Setup」→ 手機設定 Wi-Fi + 6 位數配對碼
 *   2. 用配對碼跟 https://<API_HOST>/api/devices/pair 換長期裝置 token（存 NVS）
 *   3. 按一下按鈕 → 嗶聲 → 錄音（說完自動停，最長 8 秒）→ 上傳 /api/device/ask
 *      → 播放暖暖的語音回答，TFT 依表情標籤換臉
 *   4. 每 60 秒打 /api/device/heartbeat，有用藥提醒就呼叫 /api/device/speak 播報
 *   5. 按住按鈕開機 5 秒 = 清除設定（回到步驟 1）
 *
 * 開發板：ESP32-S3 DevKitC-1（需 PSRAM），Arduino-ESP32 core 3.x
 * 函式庫：TFT_eSPI（User_Setup 用 firmware/User_Setup_NuanNuan.h）、ArduinoJson 7.x
 * 接線：見 firmware/README.md
 * ────────────────────────────────────────────────
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <WebServer.h>
#include <DNSServer.h>
#include <Preferences.h>
#include <ArduinoJson.h>
#include <TFT_eSPI.h>
#include "ESP_I2S.h"

// ───────── 設定區（照自己環境改這裡就好） ─────────
static const char *API_HOST = "nuan55.com"; // 不含 https://
static const char *FW_VERSION = "1.0.0";

// 腳位（對應 README 接線表）
#define PIN_BTN 2
// INMP441 麥克風（I2S RX）
#define PIN_MIC_SCK 4
#define PIN_MIC_WS 5
#define PIN_MIC_SD 6
// MAX98357A 功放（I2S TX）
#define PIN_SPK_BCLK 15
#define PIN_SPK_LRC 16
#define PIN_SPK_DIN 7

// 錄音參數
static const uint32_t REC_RATE = 16000;    // 16kHz，/api/device/ask 假設值
static const uint32_t REC_MAX_SEC = 8;     // 單次最長錄音
static const uint32_t REC_MIN_SEC = 1;     // 太短不送
static const uint16_t SILENCE_LEVEL = 600; // 能量低於此值視為安靜（依麥克風調）
static const uint32_t SILENCE_STOP_MS = 1200; // 連續安靜多久自動停

static const uint32_t TTS_RATE = 24000; // OpenAI tts-1 wav = 24kHz 16-bit mono
static const uint32_t HEARTBEAT_MS = 60 * 1000;

// ───────── 全域 ─────────
Preferences prefs;
TFT_eSPI tft;
WebServer server(80);
DNSServer dns;
I2SClass i2sMic;
I2SClass i2sSpk;

String wifiSsid, wifiPass, pairingCode, deviceToken;
bool portalMode = false;
unsigned long lastHeartbeat = 0;
String announcedIds[8]; // 已播報提醒 id（環形，避免重複唸）
uint8_t announcedPos = 0;

enum Mood { IDLE, LISTEN, THINK, SPEAK, CARE, ALERT_ };

// ───────── 表情臉（240x240 ST7789） ─────────
void drawFace(Mood mood, const char *caption = nullptr) {
  const uint16_t BG = tft.color565(0xFD, 0xF6, 0xEC);   // 米白
  const uint16_t INK = tft.color565(0x5A, 0x43, 0x32);  // 深棕
  const uint16_t ROSE = tft.color565(0xE8, 0x84, 0x5A); // 主色橘
  tft.fillScreen(BG);

  int cx = 120, eyeY = 100, mouthY = 158;
  switch (mood) {
    case IDLE: // 彎彎笑眼
      tft.fillCircle(cx - 45, eyeY, 10, INK);
      tft.fillCircle(cx + 45, eyeY, 10, INK);
      tft.drawSmoothArc(cx, mouthY - 20, 34, 30, 210, 330, INK, BG, true);
      break;
    case LISTEN: // 大圓眼
      tft.fillCircle(cx - 45, eyeY, 16, INK);
      tft.fillCircle(cx + 45, eyeY, 16, INK);
      tft.fillCircle(cx - 41, eyeY - 5, 5, BG);
      tft.fillCircle(cx + 49, eyeY - 5, 5, BG);
      tft.fillCircle(cx, mouthY, 12, INK);
      break;
    case THINK: // 瞇眼 + 小點嘴
      tft.fillRoundRect(cx - 58, eyeY - 4, 26, 8, 4, INK);
      tft.fillRoundRect(cx + 32, eyeY - 4, 26, 8, 4, INK);
      tft.fillCircle(cx + 20, mouthY, 7, INK);
      tft.fillCircle(cx + 78, 60, 8, ROSE);
      tft.fillCircle(cx + 95, 42, 5, ROSE);
      break;
    case SPEAK: // 張嘴說話
      tft.fillCircle(cx - 45, eyeY, 10, INK);
      tft.fillCircle(cx + 45, eyeY, 10, INK);
      tft.fillSmoothCircle(cx, mouthY, 22, INK, BG);
      tft.fillSmoothCircle(cx, mouthY + 6, 12, ROSE, INK);
      break;
    case CARE: // 愛心眼
      for (int s = -1; s <= 1; s += 2) {
        int ex = cx + s * 45;
        tft.fillCircle(ex - 6, eyeY - 4, 7, ROSE);
        tft.fillCircle(ex + 6, eyeY - 4, 7, ROSE);
        tft.fillTriangle(ex - 12, eyeY, ex + 12, eyeY, ex, eyeY + 14, ROSE);
      }
      tft.drawSmoothArc(cx, mouthY - 20, 34, 30, 210, 330, INK, BG, true);
      break;
    case ALERT_: // 驚訝
      tft.fillCircle(cx - 45, eyeY, 14, INK);
      tft.fillCircle(cx + 45, eyeY, 14, INK);
      tft.drawSmoothArc(cx, mouthY + 26, 30, 26, 30, 150, INK, BG, true);
      break;
  }

  // 腮紅
  tft.fillCircle(cx - 82, 130, 12, tft.color565(0xF5, 0xC0, 0xA8));
  tft.fillCircle(cx + 82, 130, 12, tft.color565(0xF5, 0xC0, 0xA8));

  if (caption) {
    tft.setTextDatum(BC_DATUM);
    tft.setTextColor(INK, BG);
    tft.drawString(caption, cx, 232, 4);
  }
}

Mood moodFromTag(const String &tag) {
  if (tag == "care") return CARE;
  if (tag == "alert") return ALERT_;
  if (tag == "thinking") return THINK;
  return IDLE;
}

// ───────── 喇叭 ─────────
void spkBegin(uint32_t rate) {
  i2sSpk.end();
  i2sSpk.setPins(PIN_SPK_BCLK, PIN_SPK_LRC, PIN_SPK_DIN, -1, -1);
  i2sSpk.begin(I2S_MODE_STD, rate, I2S_DATA_BIT_WIDTH_16BIT, I2S_SLOT_MODE_MONO);
}

void beep(uint16_t freqHz, uint16_t ms) {
  spkBegin(16000);
  const int n = 16000 * ms / 1000;
  int16_t sample;
  for (int i = 0; i < n; i++) {
    float amp = (i < 200) ? i / 200.0f : (i > n - 200 ? (n - i) / 200.0f : 1.0f);
    sample = (int16_t)(9000.0f * amp * sinf(2.0f * PI * freqHz * i / 16000.0f));
    i2sSpk.write((uint8_t *)&sample, 2);
  }
  i2sSpk.end();
}

/** 播放 HTTP 串流回來的 WAV（跳過 44-byte 表頭，邊收邊播） */
void playWavStream(Stream &stream, int totalLen) {
  spkBegin(TTS_RATE);
  uint8_t buf[1024];
  int remaining = totalLen, skipped = 0;
  unsigned long lastData = millis();
  while ((remaining > 0 || totalLen < 0) && millis() - lastData < 4000) {
    size_t avail = stream.available();
    if (!avail) { delay(5); continue; }
    int n = stream.readBytes(buf, min(avail, sizeof(buf)));
    if (n <= 0) continue;
    lastData = millis();
    if (remaining > 0) remaining -= n;
    int offset = 0;
    if (skipped < 44) { // WAV header
      offset = min(44 - skipped, n);
      skipped += offset;
    }
    if (n - offset > 0) i2sSpk.write(buf + offset, n - offset);
  }
  delay(150); // 讓 DMA 播完
  i2sSpk.end();
}

// ───────── 麥克風錄音（32-bit 讀入 → 16-bit WAV，說完自動停） ─────────
void writeWavHeader(uint8_t *h, uint32_t dataLen, uint32_t rate) {
  uint32_t byteRate = rate * 2;
  uint32_t riffLen = dataLen + 36;
  memcpy(h, "RIFF", 4); memcpy(h + 4, &riffLen, 4);
  memcpy(h + 8, "WAVEfmt ", 8);
  uint32_t fmtLen = 16; memcpy(h + 16, &fmtLen, 4);
  uint16_t fmt = 1, ch = 1, bits = 16, align = 2;
  memcpy(h + 20, &fmt, 2); memcpy(h + 22, &ch, 2);
  memcpy(h + 24, &rate, 4); memcpy(h + 28, &byteRate, 4);
  memcpy(h + 32, &align, 2); memcpy(h + 34, &bits, 2);
  memcpy(h + 36, "data", 4); memcpy(h + 40, &dataLen, 4);
}

/** 回傳 WAV 總長（含表頭），失敗回 0。buf 需可放 44 + REC_MAX_SEC*rate*2 */
uint32_t recordWav(uint8_t *buf) {
  i2sMic.setPins(PIN_MIC_SCK, PIN_MIC_WS, -1, PIN_MIC_SD, -1);
  if (!i2sMic.begin(I2S_MODE_STD, REC_RATE, I2S_DATA_BIT_WIDTH_32BIT, I2S_SLOT_MODE_MONO)) {
    return 0;
  }

  const uint32_t maxSamples = REC_RATE * REC_MAX_SEC;
  int16_t *pcm = (int16_t *)(buf + 44);
  uint32_t written = 0;
  unsigned long lastLoud = millis(), start = millis();
  int32_t raw[256];

  while (written < maxSamples) {
    int n = i2sMic.readBytes((char *)raw, sizeof(raw)) / 4;
    uint32_t energy = 0;
    for (int i = 0; i < n && written < maxSamples; i++) {
      int16_t s = (int16_t)(raw[i] >> 14); // INMP441 24-bit 靠左 → 取高位 + 增益
      pcm[written++] = s;
      energy += abs(s);
    }
    if (n > 0 && energy / n > SILENCE_LEVEL) lastLoud = millis();
    // 至少錄滿 1 秒後，安靜 SILENCE_STOP_MS 就自動停
    if (millis() - start > REC_MIN_SEC * 1000 && millis() - lastLoud > SILENCE_STOP_MS) break;
  }
  i2sMic.end();

  if (written < REC_RATE * REC_MIN_SEC) return 0; // 太短（可能誤按）
  writeWavHeader(buf, written * 2, REC_RATE);
  return 44 + written * 2;
}

// ───────── HTTP ─────────
String apiUrl(const char *path) { return String("https://") + API_HOST + path; }

/** 按鈕問答：錄音 → /api/device/ask → 播回答 */
void askNuanNuan() {
  const uint32_t bufSize = 44 + REC_RATE * REC_MAX_SEC * 2;
  uint8_t *wav = (uint8_t *)ps_malloc(bufSize);
  if (!wav) wav = (uint8_t *)malloc(bufSize);
  if (!wav) { drawFace(ALERT_, "記憶體不足"); return; }

  drawFace(LISTEN, "請說話");
  beep(1200, 120);
  uint32_t wavLen = recordWav(wav);
  if (!wavLen) { free(wav); drawFace(IDLE); return; }

  drawFace(THINK, "暖暖想想");

  WiFiClientSecure client;
  client.setInsecure(); // 原型：不驗憑證。量產改用 setCACert 固定根憑證
  HTTPClient https;
  https.setTimeout(45000);
  if (!https.begin(client, apiUrl("/api/device/ask"))) { free(wav); drawFace(ALERT_, "連線失敗"); return; }
  https.addHeader("Authorization", "Bearer " + deviceToken);
  https.addHeader("Content-Type", "audio/wav");
  https.addHeader("X-Audio-Seconds", String((wavLen - 44) / (REC_RATE * 2)));
  const char *keys[] = {"X-Mood", "Content-Type"};
  https.collectHeaders(keys, 2);

  int code = https.POST(wav, wavLen);
  free(wav);

  if (code == 200 && https.header("Content-Type").startsWith("audio")) {
    drawFace(moodFromTag(https.header("X-Mood")) == IDLE ? SPEAK : moodFromTag(https.header("X-Mood")), "");
    playWavStream(https.getStream(), https.getSize());
    drawFace(moodFromTag(https.header("X-Mood")));
  } else if (code == 429) {
    drawFace(ALERT_, "本月額度用完了");
    delay(3000); drawFace(IDLE);
  } else if (code == 401) {
    drawFace(ALERT_, "請重新配對");
  } else {
    drawFace(ALERT_, "怪怪的 再試一次");
    delay(2500); drawFace(IDLE);
  }
  https.end();
}

/** 心跳 + 用藥提醒播報 */
void heartbeat() {
  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient https;
  https.setTimeout(15000);
  if (!https.begin(client, apiUrl("/api/device/heartbeat"))) return;
  https.addHeader("Authorization", "Bearer " + deviceToken);
  https.addHeader("Content-Type", "application/json");
  int code = https.POST(String("{\"fw_version\":\"") + FW_VERSION + "\"}");
  if (code != 200) { https.end(); return; }

  JsonDocument doc;
  if (deserializeJson(doc, https.getString())) { https.end(); return; }
  https.end();

  for (JsonObject a : doc["announcements"].as<JsonArray>()) {
    String id = a["id"].as<String>();
    String text = a["speech_text"].as<String>();
    bool done = false;
    for (auto &seen : announcedIds) if (seen == id) done = true;
    if (done || !text.length()) continue;

    announcedIds[announcedPos] = id;
    announcedPos = (announcedPos + 1) % 8;
    speakText(text);
  }
}

/** 文字 → /api/device/speak → 播放（提醒播報用） */
void speakText(const String &text) {
  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient https;
  https.setTimeout(30000);
  if (!https.begin(client, apiUrl("/api/device/speak"))) return;
  https.addHeader("Authorization", "Bearer " + deviceToken);
  https.addHeader("Content-Type", "application/json");

  JsonDocument doc;
  doc["text"] = text;
  String body;
  serializeJson(doc, body);

  drawFace(CARE, "吃藥時間到囉");
  beep(900, 150); delay(80); beep(1200, 150);
  if (https.POST(body) == 200) playWavStream(https.getStream(), https.getSize());
  https.end();
  drawFace(IDLE);
}

/** 用配對碼換長期 token */
bool pairDevice() {
  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient https;
  https.setTimeout(15000);
  if (!https.begin(client, apiUrl("/api/devices/pair"))) return false;
  https.addHeader("Content-Type", "application/json");

  JsonDocument doc;
  doc["pairing_code"] = pairingCode;
  doc["fw_version"] = FW_VERSION;
  String body;
  serializeJson(doc, body);

  int code = https.POST(body);
  if (code != 200) { https.end(); return false; }

  JsonDocument res;
  if (deserializeJson(res, https.getString())) { https.end(); return false; }
  https.end();

  deviceToken = res["device_token"].as<String>();
  if (!deviceToken.length()) return false;

  prefs.putString("token", deviceToken);
  prefs.remove("code");
  return true;
}

// ───────── SoftAP 設定入口（captive portal） ─────────
static const char PORTAL_HTML[] PROGMEM = R"html(
<!DOCTYPE html><html lang="zh-Hant"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>暖暖機器人設定</title><style>
body{font-family:sans-serif;background:#FDF6EC;margin:0;padding:24px;color:#5A4332}
h1{font-size:22px}label{display:block;margin:14px 0 4px;font-weight:700}
input{width:100%;padding:12px;font-size:18px;border:1px solid #D9C6B0;border-radius:10px;box-sizing:border-box}
button{margin-top:20px;width:100%;padding:14px;font-size:18px;font-weight:700;color:#fff;background:#E8845A;border:0;border-radius:12px}
</style></head><body><h1>🤖 暖暖機器人設定</h1>
<form method="POST" action="/save">
<label>家裡 Wi-Fi 名稱（2.4GHz）</label><input name="ssid" required>
<label>Wi-Fi 密碼</label><input name="pass" type="password">
<label>App 的 6 位數配對碼</label><input name="code" inputmode="numeric" pattern="\d{6}" required>
<button>完成設定</button></form></body></html>
)html";

void startPortal() {
  portalMode = true;
  WiFi.mode(WIFI_AP);
  WiFi.softAP("NuanNuan-Setup");
  dns.start(53, "*", WiFi.softAPIP());

  server.on("/save", HTTP_POST, []() {
    prefs.putString("ssid", server.arg("ssid"));
    prefs.putString("pass", server.arg("pass"));
    prefs.putString("code", server.arg("code"));
    server.send(200, "text/html; charset=utf-8",
                "<h1 style='font-family:sans-serif'>設定完成，機器人重新啟動中…</h1>");
    delay(1500);
    ESP.restart();
  });
  server.onNotFound([]() { server.send(200, "text/html; charset=utf-8", PORTAL_HTML); });
  server.begin();
  drawFace(THINK, "請用手機設定");
}

// ───────── 主流程 ─────────
void setup() {
  Serial.begin(115200);
  pinMode(PIN_BTN, INPUT_PULLUP);
  tft.init();
  tft.setRotation(0);
  prefs.begin("nuannuan");

  // 按住按鈕開機 5 秒 → 清除設定
  if (digitalRead(PIN_BTN) == LOW) {
    drawFace(ALERT_, "再按住 5 秒清除設定");
    unsigned long t0 = millis();
    while (digitalRead(PIN_BTN) == LOW) {
      if (millis() - t0 > 5000) {
        prefs.clear();
        drawFace(CARE, "已清除 重新啟動");
        delay(1200);
        ESP.restart();
      }
      delay(50);
    }
  }

  wifiSsid = prefs.getString("ssid", "");
  wifiPass = prefs.getString("pass", "");
  pairingCode = prefs.getString("code", "");
  deviceToken = prefs.getString("token", "");

  if (!wifiSsid.length()) { startPortal(); return; }

  drawFace(THINK, "連線中");
  WiFi.mode(WIFI_STA);
  WiFi.begin(wifiSsid.c_str(), wifiPass.c_str());
  unsigned long t0 = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - t0 < 20000) delay(200);
  if (WiFi.status() != WL_CONNECTED) { startPortal(); return; }

  if (!deviceToken.length()) {
    if (!pairingCode.length() || !pairDevice()) {
      drawFace(ALERT_, "配對失敗 請重設");
      prefs.remove("code");
      delay(3000);
      startPortal();
      return;
    }
    drawFace(CARE, "配對成功！");
    beep(900, 120); delay(60); beep(1200, 120); delay(60); beep(1500, 200);
    delay(1200);
  }

  drawFace(IDLE);
  heartbeat();
  lastHeartbeat = millis();
}

void loop() {
  if (portalMode) {
    dns.processNextRequest();
    server.handleClient();
    return;
  }

  if (WiFi.status() != WL_CONNECTED) {
    drawFace(THINK, "重新連線中");
    WiFi.reconnect();
    delay(3000);
    if (WiFi.status() == WL_CONNECTED) drawFace(IDLE);
    return;
  }

  if (digitalRead(PIN_BTN) == LOW) {
    delay(30); // 防彈跳
    if (digitalRead(PIN_BTN) == LOW) {
      askNuanNuan();
      while (digitalRead(PIN_BTN) == LOW) delay(20); // 等放開
    }
  }

  if (millis() - lastHeartbeat > HEARTBEAT_MS) {
    lastHeartbeat = millis();
    heartbeat();
  }

  delay(20);
}

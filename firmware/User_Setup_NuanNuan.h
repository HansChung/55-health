// ────────────────────────────────────────────────
// TFT_eSPI 設定檔 — 暖暖陪伴機器人（ESP32-S3 + ST7789 240x240）
// 用法：把這整份內容覆蓋到 Arduino/libraries/TFT_eSPI/User_Setup.h
// ────────────────────────────────────────────────

#define USER_SETUP_INFO "NuanNuan Companion ST7789"

#define ST7789_DRIVER
#define TFT_WIDTH  240
#define TFT_HEIGHT 240

// 腳位（對應 firmware/README.md 的接線表）
#define TFT_MISO -1
#define TFT_MOSI 11
#define TFT_SCLK 12
#define TFT_CS   10
#define TFT_DC    8
#define TFT_RST   9

#define LOAD_GLCD
#define LOAD_FONT2
#define LOAD_FONT4
#define LOAD_GFXFF
#define SMOOTH_FONT

#define SPI_FREQUENCY 40000000

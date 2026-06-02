# 暖暖 Email 模板 - 安裝指南

繁體中文 Email 模板，使用暖暖品牌色（橘 #E8845A、奶油 #FAF5EC）

## 📋 4 個模板

| 檔案 | 用途 | Supabase 對應 |
|------|------|---------------|
| `magic-link.html` | Email OTP 登入驗證碼 | Magic Link |
| `confirm-signup.html` | 第一次註冊確認 | Confirm signup |
| `invite.html` | 邀請新使用者 | Invite user |
| `reset-password.html` | 重設密碼 | Reset password |

## 🚀 安裝方式

1. 開啟 Supabase Dashboard：
   https://supabase.com/dashboard/project/ydnvjqvstmprdciwkkyl/auth/templates

2. 對每個模板：
   - 點開對應的 Template
   - **Subject heading**：填下方表格的主旨
   - **Message body**：刪掉原本英文，貼上 HTML 全部內容
   - 按 **Save**

## 📝 各模板對應的 Subject

| Template | Subject |
|----------|---------|
| Magic Link | `【暖暖】您的登入驗證碼是 {{ .Token }}` |
| Confirm signup | `【暖暖】歡迎加入！您的註冊驗證碼是 {{ .Token }}` |
| Invite user | `【暖暖】有人邀請您加入暖暖` |
| Reset Password | `【暖暖】重設您的登入密碼` |

## ⚠️ 注意事項

- Magic Link 和 Confirm signup 使用 `{{ .Token }}` 顯示 6 位數驗證碼
- Invite 和 Reset Password 使用 `{{ .ConfirmationURL }}` 顯示連結
- **千萬不要改 `{{ .Token }}` 或 `{{ .ConfirmationURL }}` 大小寫**，Supabase 會抓不到

## 🧪 測試方法

存檔後到 Supabase Authentication → Users → Add user → Send invitation 寄一封給自己測試

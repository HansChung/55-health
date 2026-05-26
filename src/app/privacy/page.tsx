export const metadata = {
  title: "隱私權政策 · 暖暖",
  description: "暖暖 App 隱私權政策",
};

export default function PrivacyPage() {
  const updated = "2026 年 5 月 26 日";

  return (
    <div style={{
      minHeight: "100vh", background: "#FAF5EC",
      padding: "60px 24px", fontFamily: "Noto Sans TC, system-ui, sans-serif",
      color: "#3D2E20",
    }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, margin: "0 0 8px", letterSpacing: "-1px" }}>
          隱私權政策
        </h1>
        <p style={{ color: "#6B5848", fontSize: 14, margin: "0 0 32px" }}>
          最後更新：{updated}
        </p>

        <Section title="1. 收集的資訊">
          <p>暖暖（以下簡稱「本服務」）為了提供飲食追蹤、AI 健康建議等功能，會收集以下資訊：</p>
          <ul>
            <li><strong>帳號資訊</strong>：透過 Google OAuth 登入時取得您的 email、姓名、頭像。</li>
            <li><strong>健康資料</strong>：您自行輸入的年齡、性別、慢性病、目標卡路里等。</li>
            <li><strong>飲食記錄</strong>：您拍攝的食物照片、辨識結果、用餐時間。</li>
            <li><strong>運動記錄</strong>：您手動記錄的運動類型與時間。</li>
            <li><strong>AI 對話內容</strong>：您與「暖暖」AI 助理的語音/文字對話。</li>
            <li><strong>使用記錄</strong>：登入時間、功能使用頻率等匿名統計資料。</li>
          </ul>
        </Section>

        <Section title="2. 資訊使用方式">
          <p>我們僅在以下用途使用您的資訊：</p>
          <ul>
            <li>提供飲食辨識、營養計算、健康建議等核心功能。</li>
            <li>讓您經授權的家人查看您的健康狀況（需您主動邀請並設定權限）。</li>
            <li>改善服務品質與 AI 模型表現（採用匿名化資料）。</li>
          </ul>
          <p><strong>我們不會將您的個人資料販售給第三方，亦不會用於廣告投放。</strong></p>
        </Section>

        <Section title="3. 第三方服務">
          <p>本服務使用以下第三方供應商處理資料：</p>
          <ul>
            <li><strong>Supabase</strong>：資料庫與認證服務（資料儲存於亞洲區域）。</li>
            <li><strong>Google Gemini</strong>：食物照片 AI 辨識（照片不會被 Google 儲存或用於訓練）。</li>
            <li><strong>OpenAI</strong>：語音對話功能（依 OpenAI API Data Policy，輸入不用於模型訓練）。</li>
            <li><strong>Vercel</strong>：網站託管。</li>
            <li><strong>Resend</strong>：電子郵件寄送（如使用 Email 登入）。</li>
            <li><strong>Stripe</strong>：訂閱付款處理（如訂閱付費方案）。</li>
          </ul>
        </Section>

        <Section title="4. 資料保留與刪除">
          <p>
            您可以隨時登入後在「我的 → 編輯個人資料」中查看或修改您的資料。
            如需刪除帳號與所有資料，請寄信至 <a href="mailto:sunboy1120@gmail.com">sunboy1120@gmail.com</a>，
            我們會在 7 天內完成刪除。
          </p>
        </Section>

        <Section title="5. Cookies 與本地儲存">
          <p>
            本服務使用 cookies 維持您的登入狀態，並使用瀏覽器本地儲存（localStorage）
            保存您的偏好設定（如字級大小）。這些資料不會被傳送至第三方。
          </p>
        </Section>

        <Section title="6. 兒童隱私">
          <p>
            本服務不針對 13 歲以下兒童設計，亦不會故意收集兒童的個人資料。
            如您發現有兒童使用本服務並提供資料，請聯絡我們，我們會立即刪除。
          </p>
        </Section>

        <Section title="7. 政策變更">
          <p>
            本政策如有變更，我們會在此頁面公告，並透過 Email 或 App 內通知告知您。
            繼續使用本服務即代表您同意變更後的政策。
          </p>
        </Section>

        <Section title="8. 聯絡方式">
          <p>
            如有任何隱私相關問題，請寄信至 <a href="mailto:sunboy1120@gmail.com">sunboy1120@gmail.com</a>，
            我們會在 3 個工作日內回覆。
          </p>
        </Section>

        <div style={{ marginTop: 48, padding: "24px 0", borderTop: "1px solid #ECDFC8", textAlign: "center" }}>
          <a href="/" style={{ color: "#C95E36", textDecoration: "none", fontWeight: 600 }}>
            ← 返回暖暖
          </a>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 32, fontSize: 16, lineHeight: 1.7 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 12px", color: "#3D2E20" }}>
        {title}
      </h2>
      <div style={{ color: "#3D2E20" }}>{children}</div>
    </section>
  );
}

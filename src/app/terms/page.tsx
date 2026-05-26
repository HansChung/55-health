export const metadata = {
  title: "服務條款 · 暖暖",
  description: "暖暖 App 服務條款",
};

export default function TermsPage() {
  const updated = "2026 年 5 月 26 日";

  return (
    <div style={{
      minHeight: "100vh", background: "#FAF5EC",
      padding: "60px 24px", fontFamily: "Noto Sans TC, system-ui, sans-serif",
      color: "#3D2E20",
    }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, margin: "0 0 8px", letterSpacing: "-1px" }}>
          服務條款
        </h1>
        <p style={{ color: "#6B5848", fontSize: 14, margin: "0 0 32px" }}>
          最後更新：{updated}
        </p>

        <Section title="1. 接受條款">
          <p>
            歡迎使用暖暖（以下簡稱「本服務」）。當您註冊或使用本服務，即表示您同意本服務條款
            以及我們的<a href="/privacy">隱私權政策</a>。
          </p>
        </Section>

        <Section title="2. 服務說明">
          <p>本服務為一款提供以下功能的健康追蹤應用：</p>
          <ul>
            <li>透過拍攝照片進行 AI 食物辨識與營養分析</li>
            <li>與 AI 助理進行語音對話，獲得健康建議</li>
            <li>記錄每日飲食、運動、慢性病資訊</li>
            <li>家人共享功能，讓家人關心您的健康</li>
          </ul>
          <p>
            <strong>重要免責聲明：</strong>本服務提供之 AI 建議與營養資訊
            <strong>不能取代專業醫療諮詢</strong>。如有任何健康問題，請諮詢合格的醫師或營養師。
          </p>
        </Section>

        <Section title="3. 使用者責任">
          <ul>
            <li>您必須年滿 13 歲才能使用本服務。</li>
            <li>您必須提供真實且準確的個人資料。</li>
            <li>您必須妥善保管您的登入憑證，不得轉讓給他人。</li>
            <li>您不得利用本服務從事違法、騷擾、侵權等行為。</li>
            <li>您不得嘗試破壞、攻擊本服務或繞過安全機制。</li>
          </ul>
        </Section>

        <Section title="4. 智慧財產權">
          <p>
            本服務之介面設計、文字內容、商標、Logo 等智慧財產權屬於暖暖開發團隊所有。
            您僅有使用本服務的權利，不擁有任何複製、修改、散布的權利。
          </p>
          <p>
            您上傳的照片、文字等內容仍屬於您，但您授權本服務在提供功能所需之範圍內處理該等內容。
          </p>
        </Section>

        <Section title="5. 訂閱與付款">
          <p>
            本服務提供免費版與付費訂閱版（標準版 NT$199/月、專業版 NT$399/月）。
            付費內容由 Stripe 處理。訂閱者可隨時取消，取消後本期結束前仍可使用付費功能。
          </p>
          <p>
            <strong>退款政策：</strong>由於數位服務性質，付款後一律不退費。
            如有特殊情況請來信討論。
          </p>
        </Section>

        <Section title="6. 服務變更與中止">
          <p>
            我們保留隨時修改、暫停、終止本服務任何部分的權利。重大變更會透過 Email 或
            App 內通知事先告知您。如本服務終止，我們會提供您匯出個人資料的合理時間。
          </p>
        </Section>

        <Section title="7. 免責聲明與責任限制">
          <p>
            本服務以「現狀」提供，不保證 100% 無錯誤或永不中斷。AI 辨識結果可能有誤差，
            請以您自身判斷為準。在法律允許的最大範圍內，本服務開發團隊不對因使用本服務
            產生之任何直接或間接損失負責。
          </p>
        </Section>

        <Section title="8. 帳號終止">
          <p>
            如您違反本條款，我們有權暫停或終止您的帳號。您也可以隨時透過 Email 申請刪除帳號。
          </p>
        </Section>

        <Section title="9. 準據法與管轄">
          <p>
            本條款依中華民國法律解釋及適用。如有爭議，雙方同意以台灣台北地方法院為第一審管轄法院。
          </p>
        </Section>

        <Section title="10. 聯絡方式">
          <p>
            如有任何問題，請寄信至 <a href="mailto:sunboy1120@gmail.com">sunboy1120@gmail.com</a>。
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

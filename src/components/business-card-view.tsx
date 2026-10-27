// ────────────────────────────────────────────────
// 數位名片的樣子：分享頁 /c/<slug> 和 App 裡的預覽共用（預覽看到的＝別人看到的）
// 只顯示公開的聯絡方式（PublicBusinessCard 裡沒公開的是 null）
// ────────────────────────────────────────────────

import { cardSharePath, cardTitle, lineAddHref, telHref, type PublicBusinessCard } from "@/lib/business-card";

const contactBtn: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 14,
  minHeight: 64, padding: "10px 20px", borderRadius: "var(--r-lg)",
  fontSize: "var(--fs-lg)", fontWeight: 800, textDecoration: "none", textAlign: "left",
  border: "2px solid var(--line-strong)", background: "var(--surface)", color: "var(--ink-1)",
};

/** 聯絡按鈕：左邊圖示，右邊「做什麼」＋號碼／ID（分兩行，長號碼不會斷在中間） */
function ContactText({ action, value }: { action: string; value?: string }) {
  return (
    <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.3, minWidth: 0 }}>
      <span>{action}</span>
      {value && <span style={{ fontSize: "var(--fs-base)", fontWeight: 700, opacity: 0.85, wordBreak: "break-all" }}>{value}</span>}
    </span>
  );
}

export function BusinessCardView({ card, preview }: { card: PublicBusinessCard; preview?: boolean }) {
  const name = cardTitle(card);
  const interests = card.interests.split(/[、,，/／]+/).map((s) => s.trim()).filter(Boolean);
  const hasContact = Boolean(card.phone || card.line_id || card.email);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ height: 72, background: "linear-gradient(135deg, #F6C7A6 0%, #F3DDB5 60%, #DDE8CF 100%)" }} />
        <div style={{ padding: "0 20px 22px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 8 }}>
          <div style={{
            width: 128, height: 128, marginTop: -64, borderRadius: "50%", overflow: "hidden",
            border: "5px solid var(--surface)", background: "var(--primary-soft, #FBE6D4)", boxShadow: "var(--shadow-sm)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 60,
          }}>
            {card.photo_url
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={card.photo_url} alt={`${name}的照片`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span aria-hidden="true">🙂</span>}
          </div>
          <h1 style={{ margin: "4px 0 0", fontSize: "var(--fs-2xl, 28px)", fontWeight: 900, lineHeight: 1.3, color: "var(--ink-1)" }}>
            {card.display_name || card.nickname || "還沒填名字"}
          </h1>
          {card.display_name && card.nickname && card.nickname !== card.display_name && (
            <div style={{ fontSize: "var(--fs-lg)", fontWeight: 700, color: "var(--primary-deep, #B5532E)" }}>大家叫我「{card.nickname}」</div>
          )}
          {card.intro && (
            <p style={{ margin: "6px 0 0", fontSize: "var(--fs-lg)", lineHeight: 1.7, color: "var(--ink-2)" }}>{card.intro}</p>
          )}
          {interests.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8, marginTop: 6 }} aria-label="興趣">
              {interests.map((t) => (
                <span key={t} style={{
                  padding: "6px 14px", borderRadius: "var(--r-pill)", background: "var(--sage-soft, #E6EFDC)",
                  fontSize: "var(--fs-base)", fontWeight: 700, color: "var(--ink-1)",
                }}>❤️ {t}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {hasContact && (
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: "var(--fs-base)", fontWeight: 800, color: "var(--ink-2)" }}>聯絡我</div>
          {card.phone && (
            <a href={telHref(card.phone)} style={contactBtn}><span aria-hidden="true" style={{ fontSize: 28 }}>📞</span><ContactText action="打電話給我" value={card.phone} /></a>
          )}
          {card.line_id && (
            <a href={lineAddHref(card.line_id)} target="_blank" rel="noopener noreferrer" style={{ ...contactBtn, background: "#06C755", borderColor: "#06C755", color: "#fff" }}>
              <span aria-hidden="true" style={{ fontSize: 28 }}>💬</span><ContactText action="加我 LINE" value={/^https:/.test(card.line_id) ? undefined : `ID：${card.line_id}`} />
            </a>
          )}
          {card.email && (
            <a href={`mailto:${card.email}`} style={contactBtn}><span aria-hidden="true" style={{ fontSize: 28 }}>✉️</span><ContactText action="寄 Email 給我" value={card.email} /></a>
          )}
          {!preview && (
            <a href={`${cardSharePath(card.slug)}/vcard`} style={{ ...contactBtn, fontSize: "var(--fs-base)", borderStyle: "dashed" }}>
              <span aria-hidden="true" style={{ fontSize: 28 }}>📇</span><ContactText action="存到手機通訊錄" />
            </a>
          )}
        </div>
      )}

      {card.works.length > 0 && (
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: "var(--fs-base)", fontWeight: 800, color: "var(--ink-2)" }}>我的作品</div>
          {card.works.map((w) => w.kind === "video" ? (
            <a key={`v:${w.id}`} href={w.href ?? "#"} target={preview ? "_blank" : undefined} rel="noopener" style={{
              display: "flex", gap: 12, alignItems: "center", textDecoration: "none", color: "var(--ink-1)",
              padding: 10, borderRadius: "var(--r-md)", border: "1px solid var(--line)", background: "var(--bg)",
            }}>
              <div style={{ width: 96, height: 72, borderRadius: 10, overflow: "hidden", background: "#000", flexShrink: 0, position: "relative" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {w.photo_url && <img src={w.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }} />}
                <span aria-hidden="true" style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, color: "#fff" }}>▶</span>
              </div>
              <div style={{ fontSize: "var(--fs-base)", fontWeight: 800, lineHeight: 1.4 }}>{w.title}<div style={{ fontSize: "var(--fs-sm)", fontWeight: 600, color: "var(--ink-3)" }}>點一下看影片</div></div>
            </a>
          ) : (
            <details key={`s:${w.id}`} style={{ padding: 12, borderRadius: "var(--r-md)", border: "1px solid var(--line)", background: "var(--bg)" }}>
              <summary style={{ cursor: "pointer", fontSize: "var(--fs-base)", fontWeight: 800, lineHeight: 1.5 }}>
                📖 {w.title}{w.era ? `（${w.era}）` : ""}
                <div style={{ fontSize: "var(--fs-sm)", fontWeight: 600, color: "var(--ink-3)" }}>點一下看我的故事</div>
              </summary>
              <div style={{ whiteSpace: "pre-wrap", fontSize: "var(--fs-base)", lineHeight: 1.8, marginTop: 8, color: "var(--ink-1)" }}>{w.body}</div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}

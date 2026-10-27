// ────────────────────────────────────────────────
// 數位名片的樣子：分享頁 /c/<slug> 和 App 裡的預覽共用（預覽看到的＝別人看到的）
// 只顯示公開的聯絡方式（PublicBusinessCard 裡沒公開的是 null）
// 樣子：配色（CARD_THEMES）× 直式／橫式（橫式像紙本名片：照片在左、字在右）
// ────────────────────────────────────────────────

import { cardSharePath, cardTheme, cardTitle, lineAddHref, telHref, type CardTheme, type PublicBusinessCard } from "@/lib/business-card";

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

function Photo({ card, name, theme, size, round }: { card: PublicBusinessCard; name: string; theme: CardTheme; size: number; round: boolean }) {
  return (
    <div style={{
      width: size, height: size, flexShrink: 0, borderRadius: round ? "50%" : 18, overflow: "hidden",
      border: `${round ? 5 : 3}px solid ${round ? "var(--surface)" : theme.soft}`, background: theme.soft, boxShadow: "var(--shadow-sm)",
      display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.46,
    }}>
      {card.photo_url
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={card.photo_url} alt={`${name}的照片`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : <span aria-hidden="true">🙂</span>}
    </div>
  );
}

function Interests({ items, theme, center }: { items: string[]; theme: CardTheme; center: boolean }) {
  if (items.length === 0) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: center ? "center" : "flex-start", gap: 8, marginTop: 6 }} aria-label="興趣">
      {items.map((t) => (
        <span key={t} style={{
          padding: "6px 14px", borderRadius: "var(--r-pill)", background: theme.chip,
          fontSize: "var(--fs-base)", fontWeight: 700, color: "var(--ink-1)",
        }}>❤️ {t}</span>
      ))}
    </div>
  );
}

/** 名片最上面那張（照片、名字、介紹、興趣）；編輯畫面選樣子時也只預覽這張 */
export function BusinessCardFace({ card }: { card: PublicBusinessCard }) {
  const name = cardTitle(card);
  const theme = cardTheme(card.theme);
  const interests = card.interests.split(/[、,，/／]+/).map((s) => s.trim()).filter(Boolean);
  const displayName = card.display_name || card.nickname || "還沒填名字";
  const showNick = Boolean(card.display_name && card.nickname && card.nickname !== card.display_name);

  if (card.layout === "horizontal") {
    return (
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ height: 14, background: theme.band }} />
        <div style={{ padding: "18px 18px 20px" }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <Photo card={card} name={name} theme={theme} size={96} round={false} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{ margin: 0, fontSize: "var(--fs-xl, 24px)", fontWeight: 900, lineHeight: 1.3, color: "var(--ink-1)", wordBreak: "break-word" }}>
                {displayName}
              </h1>
              {showNick && (
                <div style={{ marginTop: 2, fontSize: "var(--fs-base)", fontWeight: 700, lineHeight: 1.4, color: theme.deep }}>大家叫我「{card.nickname}」</div>
              )}
            </div>
          </div>
          {(card.intro || interests.length > 0) && (
            <div aria-hidden="true" style={{ height: 3, borderRadius: 2, background: theme.band, margin: "14px 0 10px" }} />
          )}
          {card.intro && (
            <p style={{ margin: 0, fontSize: "var(--fs-base)", lineHeight: 1.7, color: "var(--ink-2)" }}>{card.intro}</p>
          )}
          <Interests items={interests} theme={theme} center={false} />
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ height: 72, background: theme.band }} />
      <div style={{ padding: "0 20px 22px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 8 }}>
        <div style={{ marginTop: -64 }}>
          <Photo card={card} name={name} theme={theme} size={128} round />
        </div>
        <h1 style={{ margin: "4px 0 0", fontSize: "var(--fs-2xl, 28px)", fontWeight: 900, lineHeight: 1.3, color: "var(--ink-1)" }}>
          {displayName}
        </h1>
        {showNick && (
          <div style={{ fontSize: "var(--fs-lg)", fontWeight: 700, color: theme.deep }}>大家叫我「{card.nickname}」</div>
        )}
        {card.intro && (
          <p style={{ margin: "6px 0 0", fontSize: "var(--fs-lg)", lineHeight: 1.7, color: "var(--ink-2)" }}>{card.intro}</p>
        )}
        <Interests items={interests} theme={theme} center />
      </div>
    </div>
  );
}

export function BusinessCardView({ card, preview }: { card: PublicBusinessCard; preview?: boolean }) {
  const theme = cardTheme(card.theme);
  const hasContact = Boolean(card.phone || card.line_id || card.email);
  const heading: React.CSSProperties = { fontSize: "var(--fs-base)", fontWeight: 800, color: theme.deep };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <BusinessCardFace card={card} />

      {hasContact && (
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={heading}>聯絡我</div>
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
          <div style={heading}>我的作品</div>
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

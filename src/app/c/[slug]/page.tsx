import type { Metadata } from "next";
import { loadPublicCard } from "@/lib/business-card-server";
import { cardShareMeta, cardSharePath, cardTheme } from "@/lib/business-card";
import { BusinessCardView } from "@/components/business-card-view";

type Props = { params: Promise<{ slug: string }> };

/** 名片分享頁：每次都看最新的（停止分享、換新連結就馬上看不到） */
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const card = await loadPublicCard(slug);
  // 不給搜尋引擎收錄：名片只給拿到連結的人看
  const robots = { index: false, follow: false };
  if (!card) return { title: "名片不存在｜暖暖", robots };
  const { title, description } = cardShareMeta(card);
  const image = card.photo_url;
  return {
    title: `${title}｜暖暖`,
    description,
    robots,
    alternates: { canonical: cardSharePath(slug) },
    openGraph: {
      type: "profile",
      title,
      description,
      url: cardSharePath(slug),
      ...(image ? { images: [{ url: image, alt: title }] } : {}),
    },
    twitter: { card: "summary", title, description, ...(image ? { images: [image] } : {}) },
  };
}

export default async function BusinessCardPage({ params }: Props) {
  const { slug } = await params;
  const card = await loadPublicCard(slug);
  return (
    <main style={{ minHeight: "100dvh", background: card ? cardTheme(card.theme).paper : "var(--bg, #FAF5EC)", padding: "20px 16px 40px" }}>
      <div style={{ maxWidth: 520, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "var(--ink-2)", fontWeight: 800 }}>
          <span aria-hidden="true" style={{ fontSize: 22 }}>🧡</span> 暖暖 55+
        </a>
        {card ? (
          <>
            <BusinessCardView card={card} />
            <a href="/?open=business-card" className="btn-ghost" style={{ textDecoration: "none" }}>📇 我也想做一張數位名片</a>
          </>
        ) : (
          <div className="card" style={{ padding: 24, textAlign: "center", lineHeight: 1.7 }}>
            <div style={{ fontSize: 44 }} aria-hidden="true">📇</div>
            <div style={{ fontSize: "var(--fs-lg)", fontWeight: 800 }}>這張名片現在不公開，或連結不對</div>
            <div style={{ color: "var(--ink-2)" }}>請對方再分享一次給你</div>
          </div>
        )}
      </div>
    </main>
  );
}

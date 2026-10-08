// ────────────────────────────────────────────────
// 我的故事集：印成一本小書（封面、目錄、每篇一頁起；照片網址 1 小時有效）
// 只給本人看（要登入）；按「列印／存成 PDF」用瀏覽器列印
// ────────────────────────────────────────────────
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { signStoryPhotos, type StoryRow } from "@/lib/life-stories-server";
import { PrintButton } from "./print-button";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "我的故事集｜暖暖", robots: { index: false, follow: false } };

function day(iso: string) {
  return new Date(iso).toLocaleDateString("zh-TW", { timeZone: "Asia/Taipei", year: "numeric", month: "long", day: "numeric" });
}

export default async function StoryBookPage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/?open=stories");

  const admin = createSupabaseAdmin();
  const [{ data: profile }, { data }] = await Promise.all([
    admin.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
    admin.from("life_stories").select("*").eq("user_id", user.id).is("deleted_at", null).order("created_at", { ascending: true }).limit(200),
  ]);
  const name = (profile as { display_name: string | null } | null)?.display_name?.trim() || "我";
  const stories = (data ?? []) as StoryRow[];
  const urls = await signStoryPhotos(admin, stories);

  return (
    <main className="story-book" style={{ background: "#fff", color: "#2b2118", minHeight: "100dvh" }}>
      <style>{`
        .story-book { font-family: "Noto Serif TC", "Noto Sans TC", serif; }
        .story-book .sheet { max-width: 720px; margin: 0 auto; padding: 40px 28px; }
        .story-book .story { break-before: page; page-break-before: always; }
        .story-book p { font-size: 19px; line-height: 2; margin: 0 0 1em; text-indent: 2em; }
        .story-book img { width: 100%; max-height: 420px; object-fit: contain; margin: 8px 0 18px; border-radius: 6px; }
        @page { size: A4; margin: 18mm 16mm; }
        @media print {
          .no-print { display: none !important; }
          .story-book .sheet { padding: 0; max-width: none; }
          .story-book img { break-inside: avoid; }
        }
      `}</style>

      <div className="no-print" style={{ position: "sticky", top: 0, background: "#FFF8EE", borderBottom: "1px solid #eadbc6", padding: "12px 16px", display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between", zIndex: 1 }}>
        <a href="/?open=stories" style={{ color: "#8a5a2b", fontWeight: 700, textDecoration: "none" }}>← 回到故事集</a>
        {stories.length > 0 && <PrintButton />}
      </div>

      {stories.length === 0 ? (
        <div className="sheet" style={{ textAlign: "center", fontSize: 20 }}>還沒有故事。先回到故事集，說一個故事給暖暖聽吧。</div>
      ) : (
        <>
          <section className="sheet" style={{ minHeight: "80vh", display: "flex", flexDirection: "column", justifyContent: "center", textAlign: "center", gap: 18 }}>
            <div style={{ fontSize: 22, letterSpacing: 4, color: "#8a5a2b" }}>回憶錄</div>
            <h1 style={{ fontSize: 44, margin: 0, lineHeight: 1.4 }}>{name}的故事</h1>
            <div style={{ fontSize: 18, color: "#6b5a4a" }}>
              共 {stories.length} 篇・{day(stories[0].created_at)}{stories.length > 1 ? ` ～ ${day(stories[stories.length - 1].created_at)}` : ""}
            </div>
            <div style={{ fontSize: 15, color: "#9a8a7a", marginTop: 40 }}>暖暖 55+・我的故事集</div>
          </section>

          <section className="sheet story">
            <h2 style={{ fontSize: 28, borderBottom: "2px solid #eadbc6", paddingBottom: 8 }}>目錄</h2>
            <ol style={{ fontSize: 20, lineHeight: 2.1, paddingLeft: 28 }}>
              {stories.map((s) => (
                <li key={s.id}>
                  {s.title}
                  {s.era ? <span style={{ color: "#8a7a6a", fontSize: 16 }}>（{s.era}）</span> : null}
                </li>
              ))}
            </ol>
          </section>

          {stories.map((s, i) => (
            <article key={s.id} className="sheet story">
              <div style={{ color: "#8a5a2b", fontSize: 16, letterSpacing: 2 }}>第 {i + 1} 篇</div>
              <h2 style={{ fontSize: 30, margin: "6px 0 4px", lineHeight: 1.4 }}>{s.title}</h2>
              <div style={{ color: "#8a7a6a", fontSize: 16, marginBottom: 18 }}>
                {s.era ? `${s.era}・` : ""}記於 {day(s.created_at)}
              </div>
              {(s.photos ?? []).map((p) => (urls.get(p.path) ? <img key={p.path} src={urls.get(p.path)} alt="" /> : null))}
              {s.body.split(/\n+/).filter(Boolean).map((para, j) => (
                <p key={j}>{para}</p>
              ))}
            </article>
          ))}
        </>
      )}
    </main>
  );
}

"use client";

// 後台外框：桌機左側選單；手機（< 768px）改成頂部列＋「☰」抽屜選單（樣式在 admin.css）
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import "./admin.css";

const navItems = [
  { href: "/admin", label: "總覽", icon: "📊" },
  { href: "/admin/usage", label: "Token 用量", icon: "💰" },
  { href: "/admin/users", label: "會員管理", icon: "👥" },
  { href: "/admin/partner-campaigns", label: "合作活動", icon: "🤝" },
  { href: "/admin/study-tours", label: "研學團", icon: "🧭" },
  { href: "/admin/api-configs", label: "API 設定", icon: "🔑" },
  { href: "/admin/conversations", label: "對話記錄", icon: "💬" },
  { href: "/admin/telemetry", label: "使用與錯誤", icon: "📈" },
  { href: "/admin/brands", label: "白標品牌", icon: "🏷️" },
  { href: "/admin/chapters", label: "書本練習內容", icon: "📖" },
];

function isActive(pathname: string, href: string) {
  return pathname === href || (href !== "/admin" && pathname.startsWith(href));
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createSupabaseBrowser();
  const [checking, setChecking] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
        return;
      }
      setUserEmail(user.email ?? "");
      setChecking(false);
    })();
  }, []);

  // 換頁就收起手機選單
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  if (checking) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a", color: "#fff" }}>
        驗證中…
      </div>
    );
  }

  const current = navItems.find((it) => isActive(pathname, it.href));

  return (
    <div className="admin-root">
      {/* 手機才看得到：頂部列 */}
      <header className="admin-topbar">
        <button
          className="admin-menu-button"
          onClick={() => setMenuOpen(true)}
          aria-label="打開選單"
          aria-expanded={menuOpen}
        >
          ☰
        </button>
        <div className="admin-topbar-title">
          {current ? `${current.icon} ${current.label}` : "🧡 暖暖 Admin"}
        </div>
      </header>

      {menuOpen && <div className="admin-backdrop" onClick={() => setMenuOpen(false)} aria-hidden="true" />}

      <aside className={`admin-nav${menuOpen ? " open" : ""}`}>
        <div className="admin-brand">
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>🧡 暖暖 Admin</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 4, wordBreak: "break-all" }}>{userEmail}</div>
          </div>
          <button className="admin-menu-close" onClick={() => setMenuOpen(false)} aria-label="關閉選單">✕</button>
        </div>
        {navItems.map((it) => {
          const active = isActive(pathname, it.href);
          return (
            <Link key={it.href} href={it.href} className={`admin-nav-link${active ? " active" : ""}`}>
              <span style={{ fontSize: 18 }}>{it.icon}</span>
              {it.label}
            </Link>
          );
        })}
        <div style={{ marginTop: "auto" }}>
          <Link href="/" className="admin-nav-link muted">← 回到 App</Link>
          <button
            onClick={async () => { await supabase.auth.signOut(); router.push("/"); }}
            className="admin-nav-link danger"
          >
            登出
          </button>
        </div>
      </aside>

      <main className="admin-main">
        {children}
      </main>
    </div>
  );
}

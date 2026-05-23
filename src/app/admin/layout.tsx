"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";

const navItems = [
  { href: "/admin", label: "總覽", icon: "📊" },
  { href: "/admin/usage", label: "Token 用量", icon: "💰" },
  { href: "/admin/users", label: "會員管理", icon: "👥" },
  { href: "/admin/api-configs", label: "API 設定", icon: "🔑" },
  { href: "/admin/conversations", label: "對話記錄", icon: "💬" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createSupabaseBrowser();
  const [checking, setChecking] = useState(true);
  const [userEmail, setUserEmail] = useState("");

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

  if (checking) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a", color: "#fff" }}>
        驗證中…
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "#0f172a", color: "#e2e8f0", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <aside style={{
        width: 240,
        background: "#1e293b",
        borderRight: "1px solid #334155",
        padding: "24px 16px",
        display: "flex", flexDirection: "column", gap: 4,
      }}>
        <div style={{ padding: "0 12px 24px", borderBottom: "1px solid #334155", marginBottom: 16 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>🧡 暖暖 Admin</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{userEmail}</div>
        </div>
        {navItems.map((it) => {
          const active = pathname === it.href || (it.href !== "/admin" && pathname.startsWith(it.href));
          return (
            <Link key={it.href} href={it.href} style={{
              padding: "10px 14px",
              borderRadius: 8,
              background: active ? "#334155" : "transparent",
              color: active ? "#fff" : "#cbd5e1",
              fontSize: 14,
              display: "flex", alignItems: "center", gap: 10,
              textDecoration: "none",
            }}>
              <span style={{ fontSize: 18 }}>{it.icon}</span>
              {it.label}
            </Link>
          );
        })}
        <div style={{ marginTop: "auto" }}>
          <Link href="/" style={{
            padding: "10px 14px", borderRadius: 8, color: "#94a3b8",
            fontSize: 14, display: "flex", alignItems: "center", gap: 10,
            textDecoration: "none",
          }}>← 回到 App</Link>
          <button
            onClick={async () => { await supabase.auth.signOut(); router.push("/"); }}
            style={{
              width: "100%", padding: "10px 14px", borderRadius: 8,
              background: "transparent", color: "#ef4444",
              fontSize: 14, textAlign: "left", border: "none", cursor: "pointer",
            }}
          >登出</button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: 32, overflow: "auto" }}>
        {children}
      </main>
    </div>
  );
}

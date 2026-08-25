"use client";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Bell, PanelLeft, Sun, Moon } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useSidebarStore } from "@/store/sidebar-store";

interface TopbarProps { title?: string; description?: string; actions?: ReactNode; }

export function Topbar({ title, description, actions }: TopbarProps) {
  const user = useAuthStore((s) => s.user);
  const { collapsed, expand } = useSidebarStore();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("admin_dark_mode");
    const isDark = stored === "true";
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  function toggleDark() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("admin_dark_mode", String(next));
  }

  return (
    <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "64px", padding: "0 24px", background: "var(--topbar-bg)", borderBottom: "1px solid var(--topbar-border)", flexShrink: 0, gap: "12px", transition: "background 0.2s, border-color 0.2s" }}>
      {collapsed && (
        <button
          aria-label="Expand sidebar"
          title="Expand sidebar"
          onClick={expand}
          style={{ width: "32px", height: "32px", borderRadius: "8px", border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted-foreground)", flexShrink: 0, transition: "background 0.15s" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "var(--accent)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "transparent")}
        >
          <PanelLeft style={{ width: "16px", height: "16px" }} />
        </button>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && <h1 style={{ fontSize: "16px", fontWeight: 600, color: "var(--foreground)", margin: 0, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</h1>}
        {description && <p style={{ fontSize: "12px", color: "var(--muted-foreground)", margin: "1px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{description}</p>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
        {actions}

        {/* Dark mode toggle */}
        <button
          aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
          title={dark ? "Light mode" : "Dark mode"}
          onClick={toggleDark}
          style={{ width: "32px", height: "32px", borderRadius: "8px", border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted-foreground)", transition: "background 0.15s" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "var(--accent)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "transparent")}
        >
          {dark
            ? <Sun style={{ width: "16px", height: "16px" }} />
            : <Moon style={{ width: "16px", height: "16px" }} />}
        </button>

        <button aria-label="Notifications" title="Notifications" style={{ width: "32px", height: "32px", borderRadius: "8px", border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted-foreground)", transition: "background 0.15s" }} onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "var(--accent)")} onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "transparent")}><Bell style={{ width: "16px", height: "16px" }} /></button>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingLeft: "8px", borderLeft: "1px solid var(--border)" }}>
          <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#2563eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, flexShrink: 0 }}>{user?.name?.[0]?.toUpperCase() ?? "A"}</div>
        </div>
      </div>
    </header>
  );
}

"use client";

import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  loading?: boolean;
}

function StatSkeleton() {
  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "16px 18px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div style={{ height: "12px", width: "80px", background: "var(--secondary)", borderRadius: "4px", marginBottom: "8px", animation: "pulse 1.5s ease-in-out infinite" }} />
          <div style={{ height: "24px", width: "48px", background: "var(--secondary)", borderRadius: "4px", animation: "pulse 1.5s ease-in-out infinite" }} />
        </div>
        <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "var(--secondary)", animation: "pulse 1.5s ease-in-out infinite" }} />
      </div>
    </div>
  );
}

export function StatCard({ label, value, sub, icon: Icon, iconColor = "#2563eb", iconBg = "#eff6ff", loading }: StatCardProps) {
  if (loading) return <StatSkeleton />;
  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "16px 18px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--muted-foreground)", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            {label}
          </p>
          <p style={{ fontSize: "22px", fontWeight: 700, color: "var(--foreground)", margin: 0, lineHeight: 1.1 }}>
            {value}
          </p>
          {sub && (
            <p style={{ fontSize: "11px", color: "var(--muted-foreground)", margin: "3px 0 0" }}>{sub}</p>
          )}
        </div>
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "8px",
            background: iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon style={{ width: "16px", height: "16px", color: iconColor }} />
        </div>
      </div>
    </div>
  );
}

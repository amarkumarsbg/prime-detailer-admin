"use client";

import type { ReactNode } from "react";

// ─── Table container ──────────────────────────────────────────────────────────

export function AdminTable({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        overflow: "hidden",
      }}
    >
      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          {children}
        </table>
      </div>
    </div>
  );
}

// ─── Table header ─────────────────────────────────────────────────────────────

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead style={{ background: "var(--secondary)", borderBottom: "1px solid var(--border)" }}>
      {children}
    </thead>
  );
}

// ─── Header cell ─────────────────────────────────────────────────────────────

interface ThProps {
  children?: ReactNode;
  align?: "left" | "right" | "center";
  width?: string;
}

export function Th({ children, align = "left", width }: ThProps) {
  return (
    <th
      style={{
        padding: "10px 16px",
        textAlign: align,
        fontWeight: 600,
        fontSize: "11px",
        color: "var(--muted-foreground)",
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        whiteSpace: "nowrap",
        width,
      }}
    >
      {children}
    </th>
  );
}

// ─── Table body ───────────────────────────────────────────────────────────────

export function TBody({ children }: { children: ReactNode }) {
  return <tbody style={{ color: "var(--foreground)" }}>{children}</tbody>;
}

// ─── Table row ────────────────────────────────────────────────────────────────

interface TrProps {
  children: ReactNode;
  onClick?: () => void;
}

export function Tr({ children, onClick }: TrProps) {
  return (
    <tr
      onClick={onClick}
      style={{
        borderBottom: "1px solid var(--border)",
        cursor: onClick ? "pointer" : undefined,
        transition: "background 0.1s",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "var(--secondary)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = ""; }}
    >
      {children}
    </tr>
  );
}

// ─── Table cell ───────────────────────────────────────────────────────────────

interface TdProps {
  children?: ReactNode;
  align?: "left" | "right" | "center";
  muted?: boolean;
  mono?: boolean;
  nowrap?: boolean;
  bold?: boolean;
  style?: React.CSSProperties;
}

export function Td({ children, align = "left", muted, mono, nowrap, bold, style }: TdProps) {
  return (
    <td
      style={{
        padding: "11px 16px",
        textAlign: align,
        color: muted ? "var(--muted-foreground)" : "var(--foreground)",
        fontFamily: mono ? "ui-monospace, monospace" : undefined,
        fontSize: mono ? "12px" : "13px",
        whiteSpace: nowrap ? "nowrap" : undefined,
        fontWeight: bold ? 600 : undefined,
        verticalAlign: "middle",
        ...style,
      }}
    >
      {children}
    </td>
  );
}

// ─── Table footer (row count) ─────────────────────────────────────────────────

export function TableFooter({ showing, total, label = "rows" }: { showing: number; total: number; label?: string }) {
  return (
    <div
      style={{
        padding: "10px 16px",
        borderTop: "1px solid var(--border)",
        background: "var(--secondary)",
        fontSize: "12px",
        color: "var(--muted-foreground)",
      }}
    >
      Showing {showing} of {total} {label}
    </div>
  );
}

// ─── Table skeleton ───────────────────────────────────────────────────────────

export function AdminTableSkeleton({ rows = 6, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
      <div style={{ background: "var(--secondary)", borderBottom: "1px solid var(--border)", padding: "10px 16px", display: "flex", gap: "12px" }}>
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} style={{ flex: 1, height: "12px", background: "var(--border)", borderRadius: "4px", animation: "pulse 1.5s ease-in-out infinite" }} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", gap: "12px" }}>
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} style={{ flex: 1, height: "14px", background: "var(--secondary)", borderRadius: "4px", animation: "pulse 1.5s ease-in-out infinite" }} />
          ))}
        </div>
      ))}
    </div>
  );
}

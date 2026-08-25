"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  CreditCard,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { Topbar } from "@/components/layout/topbar";
import { ErrorBanner } from "@/components/shared/error-banner";
import { RefreshingBar } from "@/components/shared/loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  SubscriptionStatusBadge,
  PaymentStatusBadge,
  PlanBadge,
  GraceStatusBadge,
} from "@/components/shared/status-badges";
import {
  getOrganization,
  patchOrganizationSubscription,
  verifyPayment,
  markPaid,
} from "@/api/organizations";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  daysRemainingLabel,
  termLabel,
} from "@/lib/utils";
import type {
  OrgDetail,
  PlanCode,
  SubscriptionPaymentRow,
  SubscriptionBillRow,
} from "@/types";

// ─── Design constants ─────────────────────────────────────────────────────────

const CARD_STYLE: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 2px 6px rgba(0,0,0,0.04)",
  overflow: "hidden",
};

// ─── Card building blocks ─────────────────────────────────────────────────────

function OrgCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ ...CARD_STYLE, ...style }}>{children}</div>;
}

function OrgCardHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <div style={{ padding: "20px 24px 0" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#0f172a", letterSpacing: "-0.1px" }}>
            {title}
          </h3>
          {subtitle && <p style={{ margin: "3px 0 0", fontSize: 12, color: "#94a3b8" }}>{subtitle}</p>}
        </div>
        {right && <div style={{ flexShrink: 0 }}>{right}</div>}
      </div>
    </div>
  );
}

function OrgCardBody({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ padding: "16px 24px 24px", ...style }}>{children}</div>;
}

// ─── Field components ─────────────────────────────────────────────────────────

function InfoField({ label, children }: { label: string; children?: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>
        {label}
      </div>
      <div style={{ fontSize: 14, fontWeight: 500, color: "#0f172a", lineHeight: 1.4 }}>
        {children ?? "—"}
      </div>
    </div>
  );
}

function UsageField({ label, used, limit }: { label: string; used: number; limit: number | null | undefined }) {
  const isOver = limit != null && used > limit;
  const pct = limit != null && limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 7 }}>
        <span style={{ fontSize: 14, fontWeight: 500, color: isOver ? "#d97706" : "#0f172a" }}>
          {used} / {limit ?? "∞"}
        </span>
        {isOver && <AlertTriangle style={{ width: 13, height: 13, color: "#f59e0b", flexShrink: 0 }} />}
      </div>
      {limit != null && (
        <div style={{ height: 3, borderRadius: 2, background: "#f1f5f9", overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 2, width: `${pct}%`, background: isOver ? "#f59e0b" : "#3b82f6", transition: "width 0.3s ease" }} />
        </div>
      )}
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function SelectInput({ value, onChange, options, disabled }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((p) => !p)}
        style={{
          width: "100%",
          height: 36,
          padding: "0 10px 0 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          border: open ? "1px solid #3b82f6" : "1px solid #e2e8f0",
          borderRadius: 8,
          background: disabled ? "#f8fafc" : "#ffffff",
          fontSize: 13,
          color: "#0f172a",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.6 : 1,
          outline: "none",
          boxShadow: open ? "0 0 0 3px rgba(59,130,246,0.12)" : "none",
          transition: "border-color 0.15s, box-shadow 0.15s",
        }}
      >
        <span style={{ fontWeight: 500 }}>{selected?.label ?? value}</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          style={{
            flexShrink: 0,
            color: "#94a3b8",
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.15s",
          }}
        >
          <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 10,
            boxShadow: "0 4px 16px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)",
            zIndex: 100,
            padding: "4px",
            overflow: "hidden",
          }}
        >
          {options.map((o) => {
            const isActive = o.value === value;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => { onChange(o.value); setOpen(false); }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 10px",
                  borderRadius: 6,
                  border: "none",
                  background: isActive ? "#eff6ff" : "transparent",
                  color: isActive ? "#1d4ed8" : "#0f172a",
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "#f8fafc"; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
              >
                {isActive && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
                    <path d="M2 6l3 3 5-5" stroke="#1d4ed8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                <span style={{ marginLeft: isActive ? 0 : 20 }}>{o.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Table helpers ────────────────────────────────────────────────────────────

function InlineTable({ heads, children }: { heads: { label: string; align?: "left" | "right" }[]; children: React.ReactNode }) {
  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
            <tr>
              {heads.map((h, i) => (
                <th key={i} style={{ padding: "9px 12px", textAlign: h.align ?? "left", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}

function InlineRow({ children, idx }: { children: React.ReactNode; idx: number }) {
  return (
    <tr
      style={{ borderTop: idx === 0 ? "none" : "1px solid #f1f5f9" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(248,250,252,0.9)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "")}
    >
      {children}
    </tr>
  );
}

function InlineTd({ children, align = "left", muted, bold }: { children?: React.ReactNode; align?: "left" | "right"; muted?: boolean; bold?: boolean }) {
  return (
    <td style={{ padding: "10px 12px", textAlign: align, color: muted ? "#64748b" : "#0f172a", fontWeight: bold ? 600 : undefined, fontSize: muted ? 12 : 13 }}>
      {children ?? "—"}
    </td>
  );
}

// ─── Skeleton + Empty ─────────────────────────────────────────────────────────

function Skel({ h, w = "100%" }: { h: number | string; w?: string }) {
  return <div style={{ height: h, width: w, background: "#f1f5f9", borderRadius: 6 }} />;
}

function EmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "24px 0" }}>
      <Icon style={{ width: 28, height: 28, color: "#cbd5e1" }} />
      <span style={{ fontSize: 13, color: "#94a3b8" }}>{message}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OrgDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [org, setOrg] = useState<OrgDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [patching, setPatching] = useState(false);
  const [patchStatus, setPatchStatus] = useState<string>("");
  const [patchPlan, setPatchPlan] = useState<PlanCode>("STARTER");
  const [patchNotes, setPatchNotes] = useState("");

  const [markPaidOpen, setMarkPaidOpen] = useState(false);
  const [markPaidAmount, setMarkPaidAmount] = useState("");
  const [markPaidTxn, setMarkPaidTxn] = useState("");
  const [markPaidNotes, setMarkPaidNotes] = useState("");
  const [markPaidLoading, setMarkPaidLoading] = useState(false);

  async function load(silent = false) {
    if (!silent) setLoading(true); else setRefreshing(true);
    setError(null);
    try {
      const data = await getOrganization(id);
      setOrg(data);
      setPatchStatus(data.subscription.status);
      setPatchPlan(data.subscription.planCode);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load organization");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handlePatchSubscription() {
    if (!org) return;
    setPatching(true);
    try {
      const updated = await patchOrganizationSubscription(org.organization.id, {
        status: patchStatus as OrgDetail["subscription"]["status"],
        planCode: patchPlan,
        notes: patchNotes || undefined,
      });
      setOrg(updated);
      toast.success("Subscription updated successfully.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Update failed.");
    } finally {
      setPatching(false);
    }
  }

  async function handleMarkPaid() {
    if (!org) return;
    setMarkPaidLoading(true);
    try {
      await markPaid(org.organization.id, {
        amount: markPaidAmount ? Number(markPaidAmount) : undefined,
        txnReference: markPaidTxn || null,
        notes: markPaidNotes || null,
      });
      toast.success("Subscription marked as paid and activated.");
      setMarkPaidOpen(false);
      setMarkPaidAmount(""); setMarkPaidTxn(""); setMarkPaidNotes("");
      await load(true);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to mark as paid.");
    } finally {
      setMarkPaidLoading(false);
    }
  }

  async function handleVerifyPayment(payment: SubscriptionPaymentRow, outcome: "PAID" | "FAILED") {
    if (!org) return;
    try {
      await verifyPayment(org.organization.id, { paymentId: payment.id, outcome, txnReference: payment.txnReference });
      toast.success(`Payment marked as ${outcome}.`);
      await load(true);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Verification failed.");
    }
  }

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Topbar />
      <div style={{ flex: 1, overflowY: "auto", background: "#f8fafc", padding: "24px" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
          <OrgCard>
            <OrgCardBody>
              <Skel h={14} w="160px" />
              <div style={{ height: 16 }} />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "20px 24px" }}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i}><Skel h={10} w="50px" /><div style={{ height: 6 }} /><Skel h={14} /></div>
                ))}
              </div>
            </OrgCardBody>
          </OrgCard>
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 20 }}>
            {[0, 1].map((i) => (
              <OrgCard key={i}>
                <OrgCardBody>
                  <Skel h={14} w="140px" />
                  <div style={{ height: 16 }} />
                  {[0, 1, 2].map((j) => (
                    <div key={j} style={{ marginBottom: 14 }}><Skel h={10} w="60px" /><div style={{ height: 6 }} /><Skel h={36} /></div>
                  ))}
                </OrgCardBody>
              </OrgCard>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 20 }}>
            {[0, 1].map((i) => (
              <OrgCard key={i}>
                <OrgCardBody>
                  <Skel h={14} w="100px" />
                  <div style={{ height: 24 }} />
                  <div style={{ display: "flex", justifyContent: "center" }}><Skel h={56} w="50%" /></div>
                </OrgCardBody>
              </OrgCard>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (error || !org) return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Topbar />
      <div style={{ padding: "24px" }}>
        <ErrorBanner message={error ?? "Organization not found."} onRetry={() => load()} />
      </div>
    </div>
  );

  const sub = org.subscription;
  const branchLimit = sub.effectiveMaxBranches ?? null;
  const staffLimit = sub.limits.maxStaff ?? null;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <RefreshingBar show={refreshing} />

      <Topbar
        title={org.organization.name}
        description={`ID: ${org.organization.id}`}
        actions={
          <div style={{ display: "flex", gap: 6 }}>
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button variant="outline" size="sm" onClick={() => load(true)} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4${refreshing ? " animate-spin" : ""}`} />
              {refreshing ? "Refreshing…" : "Refresh"}
            </Button>
          </div>
        }
      />

      <div style={{ flex: 1, overflowY: "auto", background: "#f8fafc", padding: "24px" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Row 1 – Subscription overview */}
          <OrgCard>
            <OrgCardHeader
              title="Subscription"
              subtitle="Current subscription details"
              right={
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "flex-end" }}>
                  <PlanBadge planCode={sub.planCode} />
                  <SubscriptionStatusBadge status={sub.status} />
                  <PaymentStatusBadge status={sub.paymentStatus} />
                  <GraceStatusBadge status={sub.graceOrLock} />
                  {sub.exportLocked && <Badge variant="destructive">Export Locked</Badge>}
                </div>
              }
            />
            <OrgCardBody>
              <dl className="grid grid-cols-2 sm:grid-cols-4" style={{ gap: "20px 32px" }}>
                <InfoField label="Plan">{sub.planName}</InfoField>
                <InfoField label="Term">{termLabel(sub.termMonths)}</InfoField>
                <InfoField label="Start Date">{formatDate(sub.startsAt)}</InfoField>
                <InfoField label="Expiry Date">{formatDate(sub.expiresAt)}</InfoField>
                <InfoField label="Days Remaining">{daysRemainingLabel(sub.daysRemaining)}</InfoField>
                <UsageField label="Branches" used={org.usage.branchesUsed} limit={branchLimit} />
                <UsageField label="Users" used={org.usage.usersUsed} limit={staffLimit} />
                <InfoField label="Payment Status"><PaymentStatusBadge status={sub.paymentStatus} /></InfoField>
              </dl>
            </OrgCardBody>
          </OrgCard>

          {/* Row 2 – Management */}
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 20 }}>
            {/* Manage Subscription */}
            <OrgCard>
              <OrgCardHeader title="Manage Subscription" subtitle="Update the organization's subscription." />
              <OrgCardBody style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <FormField label="Plan">
                  <SelectInput
                    value={patchPlan}
                    onChange={(v) => setPatchPlan(v as PlanCode)}
                    disabled={patching}
                    options={["STARTER","GROWTH","BUSINESS","ENTERPRISE","CUSTOM"].map((p) => ({ value: p, label: p }))}
                  />
                </FormField>
                <FormField label="Status">
                  <SelectInput
                    value={patchStatus}
                    onChange={setPatchStatus}
                    disabled={patching}
                    options={["ACTIVE","PAST_DUE","EXPIRED","CANCELLED"].map((s) => ({ value: s, label: s }))}
                  />
                </FormField>
                <FormField label="Notes (optional)">
                  <Input placeholder="Internal note…" value={patchNotes} onChange={(e) => setPatchNotes(e.target.value)} disabled={patching} />
                </FormField>
                <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 4 }}>
                  <Button onClick={handlePatchSubscription} disabled={patching} className="min-w-30">
                    {patching ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : "Save Changes"}
                  </Button>
                </div>
              </OrgCardBody>
            </OrgCard>

            {/* Quick Actions */}
            <OrgCard>
              <OrgCardHeader title="Quick Actions" subtitle="Perform administrative actions on this organization." />
              <OrgCardBody>
                <button
                  type="button"
                  onClick={() => setMarkPaidOpen(true)}
                  disabled={markPaidLoading}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, cursor: markPaidLoading ? "not-allowed" : "pointer", opacity: markPaidLoading ? 0.7 : 1, textAlign: "left", transition: "background 0.12s" }}
                  onMouseEnter={(e) => { if (!markPaidLoading) e.currentTarget.style.background = "#f1f5f9"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#f8fafc"; }}
                >
                  <span style={{ flexShrink: 0, width: 34, height: 34, background: "#eff6ff", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <CreditCard style={{ width: 16, height: 16, color: "#3b82f6" }} />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
                      {markPaidLoading ? "Processing…" : "Mark as Paid"}
                    </span>
                    <span style={{ display: "block", fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                      Activate subscription and record payment
                    </span>
                  </span>
                  {markPaidLoading && <Loader2 className="animate-spin" style={{ width: 14, height: 14, color: "#94a3b8", flexShrink: 0 }} />}
                </button>
              </OrgCardBody>
            </OrgCard>
          </div>

          {/* Row 3 – Payments + Bills */}
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 20 }}>
            {/* Payments */}
            <OrgCard>
              <OrgCardHeader title="Payments" subtitle={`${org.payments.length} record${org.payments.length !== 1 ? "s" : ""}`} />
              <OrgCardBody>
                {org.payments.length === 0 ? (
                  <EmptyState icon={CreditCard} message="No payments recorded yet." />
                ) : (
                  <InlineTable heads={[{ label: "Amount" }, { label: "Method" }, { label: "Status" }, { label: "Date" }, { label: "" }]}>
                    {org.payments.map((p: SubscriptionPaymentRow, idx: number) => (
                      <InlineRow key={p.id} idx={idx}>
                        <InlineTd bold>{p.amount != null ? formatCurrency(p.amount, p.currency) : "—"}</InlineTd>
                        <InlineTd muted>{p.method ?? "—"}</InlineTd>
                        <InlineTd><PaymentStatusBadge status={p.status} /></InlineTd>
                        <InlineTd muted>{formatDateTime(p.createdAt)}</InlineTd>
                        <InlineTd>
                          {(p.status === "PENDING" || p.status === "PROCESSING") && (
                            <div style={{ display: "flex", gap: 6 }}>
                              <Button size="sm" variant="outline" onClick={() => handleVerifyPayment(p, "PAID")} className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 h-7 px-2.5 text-xs">
                                <CheckCircle2 className="h-3 w-3" /> Paid
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleVerifyPayment(p, "FAILED")} className="text-red-600 border-red-200 hover:bg-red-50 h-7 px-2.5 text-xs">
                                <XCircle className="h-3 w-3" /> Failed
                              </Button>
                            </div>
                          )}
                        </InlineTd>
                      </InlineRow>
                    ))}
                  </InlineTable>
                )}
              </OrgCardBody>
            </OrgCard>

            {/* Bills */}
            <OrgCard>
              <OrgCardHeader title="Bills" subtitle={`${org.bills.length} record${org.bills.length !== 1 ? "s" : ""}`} />
              <OrgCardBody>
                {org.bills.length === 0 ? (
                  <EmptyState icon={FileText} message="No bills generated yet." />
                ) : (
                  <InlineTable heads={[{ label: "Bill #" }, { label: "Plan" }, { label: "Term" }, { label: "Base", align: "right" }, { label: "GST", align: "right" }, { label: "Total", align: "right" }, { label: "Payment" }]}>
                    {org.bills.map((b: SubscriptionBillRow, idx: number) => (
                      <InlineRow key={b.id} idx={idx}>
                        <InlineTd bold>{b.billNumber}</InlineTd>
                        <InlineTd muted>{b.planName}</InlineTd>
                        <InlineTd muted>{b.termLabel}</InlineTd>
                        <InlineTd align="right">{formatCurrency(b.baseAmount, b.currency)}</InlineTd>
                        <InlineTd align="right" muted>{formatCurrency(b.gstAmount, b.currency)}</InlineTd>
                        <InlineTd align="right" bold>{formatCurrency(b.totalAmount, b.currency)}</InlineTd>
                        <InlineTd><PaymentStatusBadge status={b.paymentStatus} /></InlineTd>
                      </InlineRow>
                    ))}
                  </InlineTable>
                )}
              </OrgCardBody>
            </OrgCard>
          </div>

        </div>
      </div>

      {/* Mark Paid Modal */}
      {markPaidOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 20px 60px rgba(0,0,0,0.18)", width: "100%", maxWidth: 440, overflow: "hidden" }}>
            <div style={{ padding: "24px 24px 0" }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#0f172a" }}>Mark Subscription Paid</h2>
              <p style={{ margin: "6px 0 0", fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>
                This will immediately activate the subscription for{" "}
                <strong style={{ color: "#0f172a" }}>{org.organization.name}</strong>.
                A renewal record and bill will be generated.
              </p>
            </div>
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
              <FormField label="Amount Received (optional)">
                <Input type="number" placeholder=" e.g. 9999" value={markPaidAmount} onChange={(e) => setMarkPaidAmount(e.target.value)} disabled={markPaidLoading} />
              </FormField>
              <FormField label="Transaction Reference">
                <Input placeholder=" e.g. UTR123456789" value={markPaidTxn} onChange={(e) => setMarkPaidTxn(e.target.value)} disabled={markPaidLoading} />
              </FormField>
              <FormField label="Admin Notes">
                <Input placeholder=" e.g. Cash payment received" value={markPaidNotes} onChange={(e) => setMarkPaidNotes(e.target.value)} disabled={markPaidLoading} />
              </FormField>
            </div>
            <div style={{ padding: "12px 24px 20px", display: "flex", justifyContent: "flex-end", gap: 8, borderTop: "1px solid #f1f5f9" }}>
              <Button variant="outline" onClick={() => setMarkPaidOpen(false)} disabled={markPaidLoading}>Cancel</Button>
              <Button onClick={handleMarkPaid} disabled={markPaidLoading} className="min-w-35">
                {markPaidLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Confirming…</> : "Confirm Mark Paid"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

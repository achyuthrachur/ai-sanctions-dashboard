"use client";

// Aesthetic: Risk alarm — this tab should feel like a live breach surface.
// Sticky red banner. Pulsing KPI cards. Type A rows draw the eye immediately.
// The Type A row expansion is the demo centerpiece — tell the story clearly.

import { useState, useMemo } from "react";
import {
  AlertTriangle, ChevronDown, ChevronUp, ChevronRight,
  Lock, Circle, ArrowRight, Clock, DollarSign,
  Shield, AlertCircle, CheckCircle2, TrendingUp,
  Calendar, FileWarning, Zap,
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { AnimatePresence, motion } from "framer-motion";
import { REAPPLY_TRANSACTIONS, REAPPLY_SUMMARY } from "../../../data/synthetic/reapply";
import type { FilterState, ReapplyTransaction } from "../../../types/index";
import { REL_COLOR, TRX_COLOR, reapplyAlertType } from "@/lib/alertTypeHelpers";
import { cn, formatCurrency, formatCurrencyFull, formatDate, formatDateShort, monthsBetween, TODAY } from "@/lib/utils";

// ─── Derived data ─────────────────────────────────────────────────────────────

const SORTED_INVENTORY = [...REAPPLY_TRANSACTIONS]
  .filter((r) => r.reapplyType !== "D") // show A/B/C + a slice of D would flood — per PRD: show all but D by default? Actually PRD says default sort by exposure DESC
  // PRD: default sort estimated exposure DESC — so Type A surfaces first
  .sort((a, b) => b.estimatedExposure - a.estimatedExposure);

// Actually show all 340 but sort so A/B/C surface, D buried
const ALL_SORTED = [...REAPPLY_TRANSACTIONS].sort((a, b) => b.estimatedExposure - a.estimatedExposure);

const TYPE_A_TOTAL_EXPOSURE = REAPPLY_TRANSACTIONS.filter((r) => r.reapplyType === "A")
  .reduce((s, r) => s + r.estimatedExposure, 0);

const PIE_DATA = [
  { name: "Type A — Counterparty Hit", value: REAPPLY_SUMMARY.typeA,  color: "#E61030" },
  { name: "Type B — Corridor Risk",    value: REAPPLY_SUMMARY.typeB,  color: "#F97316" },
  { name: "Type C — Stale Review",     value: REAPPLY_SUMMARY.typeC,  color: "#D97706" },
  { name: "Type D — Clean",            value: REAPPLY_SUMMARY.typeD,  color: "#16A34A" },
];

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function RiskKpiCard({
  label, value, sub, icon: Icon, variant, escalation,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType;
  variant: "neutral" | "red" | "orange" | "amber" | "green";
  escalation?: { protocol: string; trigger: string; contacts: string };
}) {
  const [showEsc, setShowEsc] = useState(false);

  const styles = {
    neutral: { wrap: "border-gray-200",             val: "text-text-primary",  icon: "bg-gray-100 text-text-muted"            },
    red:     { wrap: "border-[#E61030]/50 animate-pulse-border", val: "text-[#E61030]", icon: "bg-[#FDEAED] text-[#E61030]"   },
    orange:  { wrap: "border-orange-300/60 animate-pulse-border", val: "text-orange-700",icon: "bg-orange-50 text-orange-600"  },
    amber:   { wrap: "border-amber-300/60",          val: "text-amber-700",     icon: "bg-amber-50 text-amber-600"             },
    green:   { wrap: "border-green-200",             val: "text-green-700",     icon: "bg-green-50 text-green-600"             },
  }[variant];

  return (
    <div
      className={cn(
        "relative bg-white rounded-lg border p-4 shadow-card flex flex-col gap-2 cursor-default",
        styles.wrap,
        (variant === "red" || variant === "orange") && "shadow-red-glow"
      )}
      onMouseEnter={() => escalation && setShowEsc(true)}
      onMouseLeave={() => setShowEsc(false)}
    >
      <div className="flex items-start justify-between">
        <span className="text-[11px] font-medium text-text-muted uppercase tracking-wider leading-tight max-w-[130px]">
          {label}
        </span>
        <div className={cn("p-1.5 rounded-md shrink-0", styles.icon.split(" ").slice(1).join(" "))}>
          <Icon size={14} className={styles.icon.split(" ")[0]} />
        </div>
      </div>
      <div className={cn("text-2xl font-bold font-condensed", styles.val)}>{value}</div>
      {sub && <div className="text-[11px] text-text-muted leading-tight">{sub}</div>}
      {escalation && <Lock size={10} className="absolute top-2.5 right-2.5 text-text-muted opacity-40" />}

      {escalation && showEsc && (
        <div className="absolute top-full left-0 z-50 mt-2 w-[280px] rounded-lg border border-gray-200 bg-white p-4 shadow-card-md animate-fade-in-down pointer-events-none">
          <div className="flex items-center gap-1.5 mb-2">
            <Lock size={11} className="text-text-muted" />
            <span className="text-[10px] uppercase tracking-wider text-text-muted">Escalation Protocol — Future Feature</span>
          </div>
          <div className="text-xs font-semibold text-text-primary mb-1">{escalation.protocol}</div>
          <p className="text-xs text-text-secondary mb-2">{escalation.trigger}</p>
          <div className="text-xs text-text-muted">Contacts: <span className="text-text-secondary">{escalation.contacts}</span></div>
        </div>
      )}
    </div>
  );
}

// ─── Risk type badge ──────────────────────────────────────────────────────────

function RiskTypeBadge({ type }: { type: string }) {
  if (type === "A") return <span className="badge-type-a">A</span>;
  if (type === "B") return <span className="badge-type-b">B</span>;
  if (type === "C") return <span className="badge-type-c">C</span>;
  return <span className="badge-type-d">D</span>;
}

function StatusBadge({ status }: { status: ReapplyTransaction["currentStatus"] }) {
  if (status === "active_risk")  return <span className="badge-overdue">Active Risk</span>;
  if (status === "under_review") return <span className="badge-pending">Under Review</span>;
  return <span className="badge-filed">Clean</span>;
}

// ─── Type A Expansion Panel ───────────────────────────────────────────────────

function TypeAExpansion({ record }: { record: ReapplyTransaction }) {
  const approvalDate   = record.reapplyApprovalDate;
  const flagDate       = record.riskFlagDate!;
  const monthsLag      = monthsBetween(approvalDate, flagDate);
  const monthsExposed  = monthsBetween(flagDate, TODAY);
  const txCount        = Math.round(record.frequency * monthsExposed);

  // Timeline nodes
  const nodes = [
    {
      date:  formatDate(approvalDate),
      label: "Reapply Approved",
      sub:   `${record.originator} · ${record.lob}`,
      color: "bg-gray-400",
      line:  "bg-gray-200",
    },
    {
      date:  formatDate(flagDate),
      label: "Counterparty Designated on OFAC SDN",
      sub:   `${monthsLag} months after approval`,
      color: "bg-[#E61030]",
      line:  "bg-[#E61030]/30",
    },
    {
      date:  formatDate(TODAY),
      label: "Transactions Continue — Undetected",
      sub:   `${txCount} transactions · ${formatCurrencyFull(record.estimatedExposure)} estimated exposure`,
      color: "bg-[#E61030]",
      line:  null,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="bg-[#FDEAED] border-l-4 border-[#E61030] shadow-red-glow mx-0"
    >
      <div className="px-6 py-5">

        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <Zap size={14} className="text-[#E61030]" />
          <span className="text-sm font-semibold text-[#B00D26]">Active Sanctions Exposure — Type A Detail</span>
          <span className="ml-auto text-[11px] text-[#E61030]/70 font-mono">{record.transactionId}</span>
        </div>

        {/* Timeline */}
        <div className="mb-5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#B00D26] mb-3">
            Exposure Timeline
          </div>
          <div className="flex items-start gap-0">
            {nodes.map((node, i) => (
              <div key={i} className="flex items-start flex-1 min-w-0">
                <div className="flex flex-col items-center mr-3 shrink-0">
                  <div className={cn("w-3 h-3 rounded-full border-2 border-white shadow-sm", node.color)} />
                  {node.line && <div className={cn("w-0.5 flex-1 mt-1", node.line)} style={{ height: "40px" }} />}
                </div>
                <div className="flex-1 min-w-0 pb-4">
                  <div className="text-[10px] font-mono text-text-secondary mb-0.5">{node.date}</div>
                  <div className={cn(
                    "text-xs font-semibold leading-tight",
                    i === 0 ? "text-text-secondary" : "text-[#B00D26]"
                  )}>
                    {node.label}
                  </div>
                  <div className="text-[11px] text-text-muted mt-0.5">{node.sub}</div>
                </div>
                {i < nodes.length - 1 && (
                  <div className="flex items-center self-start mt-1 mr-2">
                    <ArrowRight size={12} className="text-[#E61030]/40" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Risk detail */}
        <div className="mb-4 bg-white/70 rounded-lg border border-[#E61030]/15 p-3.5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#B00D26] mb-1.5">
            Designation Risk Detail
          </div>
          <p className="text-xs text-text-primary leading-relaxed">{record.riskFlagDetail}</p>
        </div>

        {/* Exposure summary row */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { label: "Transaction Amount", value: formatCurrencyFull(record.transactionAmount), icon: DollarSign },
            { label: "Frequency",          value: `${record.frequency}×/month`,                icon: Clock },
            { label: "Months Exposed",     value: `${monthsExposed} months`,                   icon: Calendar },
            { label: "Est. Total Exposure", value: formatCurrencyFull(record.estimatedExposure), icon: AlertTriangle },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-white/70 rounded border border-[#E61030]/10 p-2.5">
              <div className="text-[10px] text-text-muted mb-1 flex items-center gap-1">
                <Icon size={10} /> {label}
              </div>
              <div className="text-sm font-semibold text-[#B00D26]">{value}</div>
            </div>
          ))}
        </div>

        {/* Escalation block — locked visual */}
        <div className="flex items-start gap-2.5 bg-white/50 rounded border border-[#E61030]/10 p-3 opacity-60 pointer-events-none">
          <Lock size={13} className="text-text-muted mt-0.5 shrink-0" />
          <div>
            <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-0.5">
              Escalation Protocol ESC-003 — Future Feature
            </div>
            <div className="text-xs text-text-secondary">
              Active sanctions exposure exceeding $100,000 triggers escalation to SSCOE and Legal for
              immediate exposure assessment and potential transaction blocking.
              Notify: SSCOE, Legal.
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type SortField = "estimatedExposure" | "riskFlagDate" | "reapplyApprovalDate" | "reapplyType";
type SortDir   = "asc" | "desc";
type TypeFilter = "all" | "A" | "B" | "C" | "D";

const SORT_KEY: Record<SortField, (r: ReapplyTransaction) => number | string> = {
  estimatedExposure:   (r) => r.estimatedExposure,
  riskFlagDate:        (r) => r.riskFlagDate ?? "",
  reapplyApprovalDate: (r) => r.reapplyApprovalDate,
  reapplyType:         (r) => r.reapplyType,
};

interface ReapplyRiskProps {
  filter: FilterState;
}

export default function ReapplyRisk({ filter }: ReapplyRiskProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("estimatedExposure");
  const [sortDir,   setSortDir]   = useState<SortDir>("desc");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 25;

  const handleSort = (f: SortField) => {
    if (sortField === f) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(f); setSortDir("desc"); }
    setPage(0);
  };

  const filtered = useMemo(() => {
    let rows = REAPPLY_TRANSACTIONS as ReapplyTransaction[];
    if (filter.lob !== "all") rows = rows.filter((r) => r.lob === filter.lob);
    if (typeFilter !== "all") rows = rows.filter((r) => r.reapplyType === typeFilter);
    return [...rows].sort((a, b) => {
      const av = SORT_KEY[sortField](a);
      const bv = SORT_KEY[sortField](b);
      if (typeof av === "number" && typeof bv === "number")
        return sortDir === "asc" ? av - bv : bv - av;
      return sortDir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
  }, [filter.lob, typeFilter, sortField, sortDir]);

  const paginated  = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const TYPE_FILTERS: { key: TypeFilter; label: string; count: number }[] = [
    { key: "all", label: "All",    count: REAPPLY_TRANSACTIONS.length },
    { key: "A",   label: "Type A", count: REAPPLY_SUMMARY.typeA },
    { key: "B",   label: "Type B", count: REAPPLY_SUMMARY.typeB },
    { key: "C",   label: "Type C", count: REAPPLY_SUMMARY.typeC },
    { key: "D",   label: "Type D", count: REAPPLY_SUMMARY.typeD },
  ];

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronDown size={11} className="text-gray-300" />;
    return sortDir === "asc"
      ? <ChevronUp size={11} className="text-[#E61030]" />
      : <ChevronDown size={11} className="text-[#E61030]" />;
  };

  const PieTooltip = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs shadow-card-md">
        <div className="font-semibold text-text-primary">{payload[0].name}</div>
        <div className="text-text-secondary">{payload[0].value} records</div>
      </div>
    );
  };

  return (
    <div className="bg-surface-page min-h-full">

      {/* ─── Red Alert Banner — ALWAYS VISIBLE, STICKY ─── */}
      <div className="sticky top-0 z-20 bg-[#E61030] px-6 py-3.5 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <AlertTriangle size={18} className="text-white shrink-0" />
          <div>
            <span className="text-white font-semibold text-sm">
              Active Sanctions Exposure — Reapply Transactions
            </span>
            <span className="text-white/80 text-sm mx-2">·</span>
            <span className="text-white font-bold text-sm">
              22 transactions with OFAC-designated counterparties
            </span>
            <span className="text-white/80 text-sm mx-2">·</span>
            <span className="text-white font-bold text-sm">
              Estimated exposure: $4.1M
            </span>
            <span className="text-white/80 text-sm">
              {" "}— Immediate escalation required
            </span>
          </div>
        </div>
        <div className="text-right shrink-0 ml-4">
          <div className="text-white/70 text-xs">Type A + B Records</div>
          <div className="text-white/70 text-xs">Last verified: March 11, 2026</div>
        </div>
      </div>

      <div className="p-6 space-y-5">

        {/* ── KPI Cards Row ───────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          <RiskKpiCard
            label="Total Reapply Inventory"
            value={REAPPLY_SUMMARY.total}
            sub="All types · all statuses"
            icon={Shield}
            variant="neutral"
          />
          <RiskKpiCard
            label="Type A — Counterparty Hit"
            value={REAPPLY_SUMMARY.typeA}
            sub="OFAC-designated counterparty"
            icon={AlertTriangle}
            variant="red"
            escalation={{
              protocol: "ESC-003 — Reapply Type A Active Exposure",
              trigger:  "Active sanctions exposure on reapply transaction > $100K escalates to SSCOE and Legal for immediate assessment and potential transaction blocking.",
              contacts: "SSCOE, Legal",
            }}
          />
          <RiskKpiCard
            label="Type B — Corridor Risk"
            value={REAPPLY_SUMMARY.typeB}
            sub="Restricted jurisdiction corridor"
            icon={AlertCircle}
            variant="orange"
            escalation={{
              protocol: "ESC-003 — Reapply Type B Corridor Risk",
              trigger:  "Corridor restriction flagged on active reapply. Requires legal review for applicable sanctions program scope and potential GL coverage.",
              contacts: "SSCOE, Legal",
            }}
          />
          <RiskKpiCard
            label="Type C — Stale Review"
            value={REAPPLY_SUMMARY.typeC}
            sub=">18 months since last review"
            icon={Clock}
            variant="amber"
          />
          <RiskKpiCard
            label="Type D — Clean"
            value={REAPPLY_SUMMARY.typeD}
            sub="Current · no sanctions hit"
            icon={CheckCircle2}
            variant="green"
          />
          <RiskKpiCard
            label="Type A Total Exposure"
            value={formatCurrency(TYPE_A_TOTAL_EXPOSURE)}
            sub="Across 22 active records"
            icon={DollarSign}
            variant="red"
          />
        </div>

        {/* ── Charts + Context Row ────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Pie chart */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-card flex flex-col">
            <div className="text-sm font-semibold text-text-primary mb-0.5">Inventory Distribution</div>
            <div className="text-xs text-text-muted mb-3">
              {filter.viewMode === 'split' ? '340 records by alert type' : '340 records by risk type'}
            </div>
            {filter.viewMode === 'split' ? (() => {
              const splitPieData = [
                { name: 'Relationship (Type A)', value: REAPPLY_SUMMARY.typeA, fill: REL_COLOR },
                { name: 'Transaction (Type B/C/D)', value: REAPPLY_SUMMARY.typeB + REAPPLY_SUMMARY.typeC + REAPPLY_SUMMARY.typeD, fill: TRX_COLOR },
              ];
              return (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={splitPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={72}
                        dataKey="value" paddingAngle={2}>
                        {splitPieData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} stroke="white" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 mt-2">
                    {splitPieData.map((d) => (
                      <div key={d.name} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-text-secondary">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.fill }} />
                          {d.name}
                        </span>
                        <span className="font-semibold text-text-primary">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              );
            })() : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={PIE_DATA} cx="50%" cy="50%" innerRadius={45} outerRadius={72}
                      dataKey="value" paddingAngle={2}>
                      {PIE_DATA.map((entry, i) => (
                        <Cell key={i} fill={entry.color} stroke="white" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {PIE_DATA.map((d) => (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-text-secondary">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                        {d.name}
                      </span>
                      <span className="font-semibold text-text-primary">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Process gap explainer — the "what is this" context card */}
          <div className="lg:col-span-2 bg-white rounded-lg border border-[#E61030]/25 p-5 shadow-card">
            <div className="flex items-center gap-2 mb-3">
              <FileWarning size={15} className="text-[#E61030]" />
              <span className="text-sm font-semibold text-[#B00D26]">Understanding the Process Gap</span>
            </div>
            <p className="text-sm text-text-secondary mb-4 leading-relaxed">
              Reapply allows previously-approved transactions to continue processing without re-screening.
              When a counterparty is added to the OFAC SDN list <em>after</em> that approval, the transaction
              continues straight-through — bypassing sanctions checks entirely. This is not a system error.
              It is a <strong className="text-text-primary">structural gap in the reapply workflow</strong>.
            </p>

            {/* Headline record callout */}
            <div className="border border-[#E61030]/30 rounded-lg bg-[#FDEAED]/60 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#B00D26]">
                  Highest-Exposure Record · RPY-A-001
                </span>
                <span className="badge-type-a">Type A</span>
              </div>
              <div className="text-sm font-semibold text-text-primary mb-1">
                Volga Meridian Trading Co — Russia/Ukraine Sanctions
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <div className="text-text-muted">Reapply Approved</div>
                  <div className="font-medium text-text-primary">Oct 14, 2022</div>
                </div>
                <div>
                  <div className="text-text-muted">OFAC Designated</div>
                  <div className="font-medium text-[#E61030]">Feb 14, 2024</div>
                </div>
                <div>
                  <div className="text-text-muted">Est. Exposure</div>
                  <div className="font-bold text-[#E61030]">$617,500</div>
                </div>
              </div>
              <div className="mt-2 text-xs text-text-muted">
                $47,500/month · 13 months of undetected transactions · GCB · EO 14024 Russia/Ukraine
              </div>
            </div>
          </div>

        </div>

        {/* ── Reapply Risk Inventory Table ─────────────────── */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-card overflow-hidden">

          {/* Table header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-8 bg-[#E61030] rounded-full" />
              <div>
                <div className="flex items-center gap-2">
                  <TrendingUp size={15} className="text-[#E61030]" />
                  <span className="text-sm font-semibold text-text-primary">Reapply Risk Inventory</span>
                </div>
                <div className="text-xs text-text-muted mt-0.5">
                  340 records · sorted by estimated exposure · click any Type A row to expand detail
                </div>
              </div>
            </div>
            {/* Type filter pills */}
            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              {TYPE_FILTERS.map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => { setTypeFilter(key); setPage(0); setExpandedId(null); }}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium transition-colors border",
                    typeFilter === key
                      ? key === "all"
                        ? "bg-[#003571] text-white border-[#003571]"
                        : key === "A" ? "bg-[#E61030] text-white border-[#E61030]"
                        : key === "B" ? "bg-orange-600 text-white border-orange-600"
                        : key === "C" ? "bg-amber-600 text-white border-amber-600"
                        : "bg-green-700 text-white border-green-700"
                      : "text-text-secondary border-gray-200 hover:border-gray-300 bg-white"
                  )}
                >
                  {label} ({count})
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  <th className="w-8 px-4 py-2.5" />
                  {[
                    { label: "ID",                field: null               },
                    { label: "Beneficiary",        field: null               },
                    { label: "Ctry",              field: null               },
                    { label: "Type",              field: "reapplyType" as SortField },
                    { label: "LOB",               field: null               },
                    { label: "Approval Date",     field: "reapplyApprovalDate" as SortField },
                    { label: "Risk Flag Date",    field: "riskFlagDate" as SortField },
                    { label: "Status",            field: null               },
                    { label: "Est. Exposure",     field: "estimatedExposure" as SortField },
                  ].map(({ label, field }) => (
                    <th
                      key={label}
                      onClick={() => field && handleSort(field)}
                      className={cn(
                        "px-3 py-2.5 text-left text-[11px] font-semibold text-text-muted uppercase tracking-wider whitespace-nowrap",
                        field && "cursor-pointer select-none hover:text-text-secondary"
                      )}
                    >
                      <span className="inline-flex items-center gap-1">
                        {label}
                        {field && <SortIcon field={field} />}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((record) => {
                  const isTypeA    = record.reapplyType === "A";
                  const isExpanded = expandedId === record.transactionId;

                  return [
                    <tr
                      key={record.transactionId}
                      onClick={() => isTypeA && setExpandedId(isExpanded ? null : record.transactionId)}
                      className={cn(
                        "border-b border-gray-100 transition-colors",
                        record.reapplyType === "A" && "row-a cursor-pointer",
                        record.reapplyType === "B" && "row-b cursor-default",
                        record.reapplyType === "C" && "row-c cursor-default",
                        record.reapplyType === "D" && "table-row",
                        isExpanded && "border-b-0"
                      )}
                    >
                      {/* Expand chevron — Type A only */}
                      <td className="px-4 py-2.5 text-center">
                        {isTypeA && (
                          isExpanded
                            ? <ChevronUp size={13} className="text-[#E61030] mx-auto" />
                            : <ChevronRight size={13} className="text-[#E61030]/50 mx-auto" />
                        )}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[#0065B3] font-medium whitespace-nowrap">
                        {filter.viewMode === 'split' && (
                          <span
                            className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle"
                            style={{ background: reapplyAlertType(record) === 'relationship' ? REL_COLOR : TRX_COLOR }}
                          />
                        )}
                        {record.transactionId}
                      </td>
                      <td className="px-3 py-2.5 text-text-primary font-medium max-w-[180px] truncate">
                        {record.beneficiary}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-text-muted">{record.beneficiaryCountry}</td>
                      <td className="px-3 py-2.5"><RiskTypeBadge type={record.reapplyType} /></td>
                      <td className="px-3 py-2.5 font-mono text-text-muted text-[11px] uppercase tracking-wide">
                        {record.lob}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-text-secondary whitespace-nowrap">
                        {formatDateShort(record.reapplyApprovalDate)}
                      </td>
                      <td className="px-3 py-2.5 font-mono whitespace-nowrap">
                        {record.riskFlagDate
                          ? <span className={record.reapplyType === "A" ? "text-[#E61030] font-medium" : "text-orange-600"}>
                              {formatDateShort(record.riskFlagDate)}
                            </span>
                          : <span className="text-text-muted">—</span>
                        }
                      </td>
                      <td className="px-3 py-2.5">
                        <StatusBadge status={record.currentStatus} />
                      </td>
                      <td className="px-3 py-2.5 font-semibold whitespace-nowrap">
                        {record.estimatedExposure > 0
                          ? <span className={record.reapplyType === "A" ? "text-[#E61030]" : "text-orange-700"}>
                              {formatCurrencyFull(record.estimatedExposure)}
                            </span>
                          : <span className="text-text-muted font-normal">—</span>
                        }
                      </td>
                    </tr>,

                    // Inline expansion panel — AnimatePresence handles enter/exit
                    isExpanded && (
                      <tr key={`${record.transactionId}-expand`} className="border-b border-[#E61030]/20">
                        <td colSpan={10} className="p-0">
                          <AnimatePresence>
                            {isExpanded && <TypeAExpansion record={record} />}
                          </AnimatePresence>
                        </td>
                      </tr>
                    ),
                  ].filter(Boolean);
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/50">
            <span className="text-xs text-text-muted">
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                className="px-3 py-1 rounded text-xs text-text-secondary border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-colors">
                Previous
              </button>
              <span className="text-xs text-text-muted">{page + 1} / {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="px-3 py-1 rounded text-xs text-text-secondary border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-colors">
                Next
              </button>
            </div>
          </div>
        </div>

        {/* ── Footer note ─────────────────────────────────── */}
        <div className="flex items-start gap-2 text-xs text-text-muted bg-white rounded-lg border border-gray-100 p-4 shadow-card">
          <Lock size={12} className="shrink-0 mt-0.5 text-text-muted" />
          <span>
            Type A records: reapply approval predates counterparty&apos;s OFAC SDN/OFAC Consolidated/UN/EU designation by ≥6 months.
            Original approval was legitimate — the risk materialised post-approval when the counterparty was subsequently designated.
            Estimated exposures calculated at last review date. Data as of {formatDate(TODAY)}.
          </span>
        </div>

      </div>
    </div>
  );
}

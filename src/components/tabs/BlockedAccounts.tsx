"use client";

// Aesthetic: BofA command center — white cards, navy/blue headers, red for breach
// This tab is a reconciliation engine. The OFAC filing table IS the feature.

import { useState, useMemo } from "react";
import {
  AlertTriangle, Clock, CheckCircle2, XCircle, FileText,
  ChevronDown, ChevronUp, Shield, TrendingUp, Calendar,
  Search, Lock, Info,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { BLOCKED_ACCOUNTS, OFAC_FILINGS, BLOCKED_ACCOUNTS_SUMMARY } from "../../../data/synthetic/blockedAccounts";
import type { FilterState, OfacFiling } from "../../../types/index";
import { REL_COLOR, TRX_COLOR } from "@/lib/alertTypeHelpers";
import { cn, formatCurrency, formatDate, formatDateShort, daysFromToday, TODAY } from "@/lib/utils";

// ─── Static data (not filter-dependent) ───────────────────────────────────────

const NEW_ERA_FILINGS = OFAC_FILINGS.slice(30); // first 30 are legacy samples

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, icon: Icon, variant = "neutral", escalation,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType;
  variant?: "neutral" | "blue" | "red";
  escalation?: { protocol: string; trigger: string; contacts: string; };
}) {
  const [showEsc, setShowEsc] = useState(false);

  const styles = {
    neutral: { border: "border-gray-200",    value: "text-text-primary",  icon: "text-text-muted bg-gray-100"   },
    blue:    { border: "border-[#0065B3]/30", value: "text-[#0065B3]",     icon: "text-[#0065B3] bg-[#E8F1F9]"  },
    red:     { border: "border-[#E61030]/40 animate-pulse-border",
               value: "text-[#E61030]",       icon: "text-[#E61030] bg-[#FDEAED]" },
  }[variant];

  return (
    <div
      className={cn(
        "relative bg-white rounded-lg border p-5 shadow-card flex flex-col gap-2",
        styles.border,
        variant === "red" && "shadow-red-glow"
      )}
      onMouseEnter={() => escalation && setShowEsc(true)}
      onMouseLeave={() => setShowEsc(false)}
    >
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium text-text-muted uppercase tracking-wider leading-tight max-w-[140px]">
          {label}
        </span>
        <div className={cn("p-1.5 rounded-md", styles.icon.split(" ").slice(1).join(" "))}>
          <Icon size={15} className={styles.icon.split(" ")[0]} />
        </div>
      </div>
      <div className={cn("text-3xl font-bold font-condensed tracking-tight", styles.value)}>
        {value}
      </div>
      {sub && <div className="text-xs text-text-muted">{sub}</div>}
      {escalation && (
        <div className="absolute top-2 right-2">
          <Lock size={10} className="text-text-muted opacity-50" />
        </div>
      )}

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

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: OfacFiling["status"] }) {
  if (status === "filed")   return <span className="badge-filed"><CheckCircle2 size={11} /> Filed On Time</span>;
  if (status === "pending") return <span className="badge-pending"><Clock size={11} /> Pending</span>;
  if (status === "overdue") return <span className="badge-overdue"><XCircle size={11} /> Overdue</span>;
  return <span className="badge-filed-late"><AlertTriangle size={11} /> Filed Late</span>;
}

// ─── Countdown cell ───────────────────────────────────────────────────────────

function CountdownCell({ deadline, status }: { deadline: string; status: OfacFiling["status"] }) {
  if (status === "filed") return <span className="text-text-muted text-xs">—</span>;
  const days = daysFromToday(deadline);
  if (days > 0) {
    return <span className="text-amber-600 font-medium text-xs font-mono">{days}d remaining</span>;
  }
  return <span className="text-[#E61030] font-semibold text-xs font-mono">{Math.abs(days)}d overdue</span>;
}

// ─── Chart tooltips ───────────────────────────────────────────────────────────

const BlockTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs shadow-card-md">
      <div className="text-text-muted mb-0.5">{label}</div>
      <div className="font-semibold text-[#003571]">{payload[0].value} blocks</div>
    </div>
  );
};

const VolTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs shadow-card-md">
      <div className="text-text-muted mb-0.5">{label}</div>
      <div className="font-semibold text-[#003571]">{formatCurrency(payload[0].value)}</div>
    </div>
  );
};

// ─── Sort icon ────────────────────────────────────────────────────────────────

type SortField = "blockDate" | "filingDeadline" | "status" | "accountId";
type SortDir   = "asc" | "desc";
type StatusFilter = "all" | "filed" | "pending" | "overdue";

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ChevronDown size={12} className="text-gray-300" />;
  return dir === "asc"
    ? <ChevronUp size={12} className="text-[#0065B3]" />
    : <ChevronDown size={12} className="text-[#0065B3]" />;
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface BlockedAccountsProps {
  filter: FilterState;
}

export default function BlockedAccounts({ filter }: BlockedAccountsProps) {
  const [sortField, setSortField] = useState<SortField>("blockDate");
  const [sortDir,   setSortDir]   = useState<SortDir>("desc");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search,    setSearch]    = useState("");
  const [page,      setPage]      = useState(0);
  const PAGE_SIZE = 20;

  const handleSort = (f: SortField) => {
    if (sortField === f) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(f); setSortDir("desc"); }
    setPage(0);
  };

  // ── Filter-reactive derived data ───────────────────────────────────────────

  const filteredAccounts = useMemo(() => {
    let accounts = BLOCKED_ACCOUNTS.filter(
      (a) => new Date(a.blockDate) >= new Date("2023-10-01T00:00:00Z")
    );
    if (filter.lob !== "all") accounts = accounts.filter((a) => a.lob === filter.lob);
    if (filter.dateRange) {
      accounts = accounts.filter(
        (a) => a.blockDate >= filter.dateRange!.start && a.blockDate <= filter.dateRange!.end
      );
    }
    return accounts;
  }, [filter.lob, filter.dateRange]);

  const newBlocksCount = useMemo(() => {
    return filteredAccounts.filter((a) => {
      const d = new Date(a.blockDate + "T00:00:00Z");
      return d.getUTCFullYear() === 2026 && d.getUTCMonth() === 2;
    }).length;
  }, [filteredAccounts]);

  const monthlyBlocks = useMemo(() => {
    const map: Record<string, { count: number; countRel: number; countTrx: number }> = {};
    filteredAccounts.forEach((a) => {
      const k = a.blockDate.slice(0, 7);
      if (!map[k]) map[k] = { count: 0, countRel: 0, countTrx: 0 };
      map[k].count++;
      if (a.alertTypeCat === "relationship") map[k].countRel++;
      else map[k].countTrx++;
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([month, { count, countRel, countTrx }]) => {
      const [yr] = month.split("-");
      const mLabel = new Date(`${month}-01T00:00:00Z`).toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
      return { month: `${mLabel} '${yr.slice(2)}`, count, countRel, countTrx };
    });
  }, [filteredAccounts]);

  const lobVolume = useMemo(() => {
    const base = filter.lob !== "all"
      ? BLOCKED_ACCOUNTS.filter((a) => a.status === "blocked" && a.lob === filter.lob)
      : BLOCKED_ACCOUNTS.filter((a) => a.status === "blocked");
    const vol: Record<string, number> = {};
    base.forEach((a) => { vol[a.lob] = (vol[a.lob] ?? 0) + a.dollarVolume; });
    return Object.entries(vol).map(([lob, volume]) => ({ lob, volume })).sort((a, b) => b.volume - a.volume);
  }, [filter.lob]);

  const enrichedFilings = useMemo(() => {
    const acctMap = new Map(BLOCKED_ACCOUNTS.map((a) => [a.accountId, a]));
    return NEW_ERA_FILINGS.map((f) => ({
      ...f,
      accountHolder: acctMap.get(f.accountId)?.accountHolder ?? "—",
      country:       acctMap.get(f.accountId)?.country       ?? "—",
    }));
  }, []);

  const statusCounts = useMemo(() => ({
    all:     enrichedFilings.length,
    filed:   enrichedFilings.filter((f) => f.status === "filed").length,
    pending: enrichedFilings.filter((f) => f.status === "pending").length,
    overdue: enrichedFilings.filter((f) => f.status === "overdue").length,
  }), [enrichedFilings]);

  const filtered = useMemo(() => {
    let rows = enrichedFilings;
    if (statusFilter !== "all") rows = rows.filter((r) => r.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
        r.accountId.toLowerCase().includes(q) ||
        r.accountHolder.toLowerCase().includes(q) ||
        r.filingId.toLowerCase().includes(q)
      );
    }
    return [...rows].sort((a, b) => {
      const av = sortField === "accountId"      ? a.accountId
               : sortField === "blockDate"      ? a.blockDate
               : sortField === "filingDeadline" ? a.filingDeadline
               : a.status;
      const bv = sortField === "accountId"      ? b.accountId
               : sortField === "blockDate"      ? b.blockDate
               : sortField === "filingDeadline" ? b.filingDeadline
               : b.status;
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [enrichedFilings, statusFilter, search, sortField, sortDir]);

  const paginated  = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const FILTER_TABS: { key: StatusFilter; label: string }[] = [
    { key: "all",     label: `All (${statusCounts.all})`         },
    { key: "filed",   label: `Filed (${statusCounts.filed})`     },
    { key: "pending", label: `Pending (${statusCounts.pending})` },
    { key: "overdue", label: `Overdue (${statusCounts.overdue})` },
  ];

  return (
    <div className="space-y-5 p-6 bg-surface-page min-h-full">

      {/* ── KPI Row ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Active Blocked Accounts"
          value={BLOCKED_ACCOUNTS_SUMMARY.totalBlocked.toLocaleString()}
          sub={`${BLOCKED_ACCOUNTS_SUMMARY.total.toLocaleString()} total in register`}
          icon={Shield}
          variant="neutral"
        />
        <KpiCard
          label="New Blocks This Month"
          value={newBlocksCount}
          sub="March 2026 — monitoring period"
          icon={TrendingUp}
          variant="blue"
        />
        <KpiCard
          label="Pending OFAC Filings"
          value={BLOCKED_ACCOUNTS_SUMMARY.pendingFilings}
          sub="10-day filing window open"
          icon={Clock}
          variant="blue"
        />
        <KpiCard
          label="Overdue OFAC Filings"
          value={BLOCKED_ACCOUNTS_SUMMARY.overdueFilings}
          sub="Deadline missed — escalation required"
          icon={AlertTriangle}
          variant="red"
          escalation={{
            protocol: "ESC-004 — OFAC Filing Deadline Breach",
            trigger:  "Overdue filings trigger escalation to Regulatory Relations within 24 hours of deadline breach. Filing must be completed and confirmation logged within the same business day.",
            contacts: "Regulatory Relations, OFAC Filing Team",
          }}
        />
      </div>

      {/* ── Charts Row ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Monthly blocks area chart */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold text-text-primary">New Blocks Per Month</div>
              <div className="text-xs text-text-muted mt-0.5">Oct 2023 – Mar 2026 · monitoring period</div>
            </div>
            {filter.viewMode === 'split' ? (
              <span className="inline-flex items-center gap-3 text-xs text-text-muted">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm inline-block" style={{ background: REL_COLOR }} /> Relationship</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm inline-block" style={{ background: TRX_COLOR }} /> Transaction</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs text-text-muted">
                <span className="w-2 h-2 rounded-full bg-[#0065B3] inline-block" /> Block events
              </span>
            )}
          </div>
          <ResponsiveContainer width="100%" height={180}>
            {filter.viewMode === 'split' ? (
              <BarChart data={monthlyBlocks} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F4" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#8A97A5" }} axisLine={false} tickLine={false} interval={4} />
                <YAxis tick={{ fontSize: 10, fill: "#8A97A5" }} axisLine={false} tickLine={false} />
                <Tooltip content={<BlockTooltip />} />
                <Bar dataKey="countRel" name="Relationship" stackId="s" fill={REL_COLOR} radius={[0,0,0,0]} maxBarSize={16} />
                <Bar dataKey="countTrx" name="Transaction"  stackId="s" fill={TRX_COLOR} radius={[2,2,0,0]} maxBarSize={16} />
              </BarChart>
            ) : (
              <AreaChart data={monthlyBlocks} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                <defs>
                  <linearGradient id="blockGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#0065B3" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#0065B3" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F4" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#8A97A5" }} axisLine={false} tickLine={false} interval={4} />
                <YAxis tick={{ fontSize: 10, fill: "#8A97A5" }} axisLine={false} tickLine={false} />
                <Tooltip content={<BlockTooltip />} />
                <Area type="monotone" dataKey="count" stroke="#0065B3" strokeWidth={2}
                  fill="url(#blockGrad)" dot={false}
                  activeDot={{ r: 4, fill: "#0065B3", stroke: "#fff", strokeWidth: 2 }} />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* LOB volume bar */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-card flex-1">
            <div className="text-sm font-semibold text-text-primary mb-0.5">Dollar Volume by LOB</div>
            <div className="text-xs text-text-muted mb-3">Active blocked accounts{filter.viewMode === 'split' ? ' — not split by alert type' : ''}</div>
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={lobVolume} margin={{ top: 0, right: 0, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F4" vertical={false} />
                <XAxis dataKey="lob" tick={{ fontSize: 11, fill: "#8A97A5" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: "#8A97A5" }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `$${(v / 1_000_000).toFixed(0)}M`} />
                <Tooltip content={<VolTooltip />} />
                <Bar dataKey="volume" fill="#003571" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Compliance rate card */}
          <div className="bg-white rounded-lg border border-green-200 p-5 shadow-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Filing Compliance Rate</span>
              <CheckCircle2 size={14} className="text-green-600" />
            </div>
            <div className="text-3xl font-bold font-condensed text-green-700">96%</div>
            <div className="mt-2.5 w-full bg-gray-100 rounded-full h-1.5">
              <div className="h-1.5 rounded-full bg-green-500" style={{ width: "96%" }} />
            </div>
            <div className="text-xs text-text-muted mt-2">
              {statusCounts.filed} filed · {statusCounts.pending} pending · <span className="text-[#E61030] font-medium">{statusCounts.overdue} overdue</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── OFAC Filing Compliance Table ────────────────────── */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-card overflow-hidden">

        {/* Table header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-1 h-8 bg-[#003571] rounded-full" />
            <div>
              <div className="flex items-center gap-2">
                <FileText size={15} className="text-[#003571]" />
                <span className="text-sm font-semibold text-text-primary">OFAC Blocked Account Filing Compliance</span>
              </div>
              <div className="text-xs text-text-muted mt-0.5">
                New-era blocks (Oct 2023 – present) · 10-day filing window per block event · 31 C.F.R. § 501.603
              </div>
            </div>
          </div>
          {/* Status filter pills */}
          <div className="flex items-center gap-1.5">
            {FILTER_TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => { setStatusFilter(key); setPage(0); }}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition-colors border",
                  statusFilter === key
                    ? "bg-[#003571] text-white border-[#003571]"
                    : "text-text-secondary border-gray-200 hover:border-gray-300 bg-white"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Search bar */}
        <div className="flex items-center gap-2 px-5 py-2.5 border-b border-gray-100 bg-gray-50">
          <Search size={13} className="text-text-muted shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search account ID, holder name, or filing ID…"
            className="flex-1 bg-transparent text-xs text-text-primary placeholder-text-muted outline-none"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-text-muted hover:text-text-primary text-xs leading-none">✕</button>
          )}
          <span className="text-xs text-text-muted border-l border-gray-200 pl-3">{filtered.length} records</span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                {[
                  { label: "Account ID",      field: "accountId" as SortField },
                  { label: "Account Holder",  field: null },
                  { label: "Ctry",            field: null },
                  { label: "Block Date",      field: "blockDate" as SortField },
                  { label: "Filing Deadline", field: "filingDeadline" as SortField },
                  { label: "Filed Date",      field: null },
                  { label: "Filing ID",       field: null },
                  { label: "Status",          field: "status" as SortField },
                  { label: "Countdown",       field: null },
                ].map(({ label, field }) => (
                  <th
                    key={label}
                    onClick={() => field && handleSort(field)}
                    className={cn(
                      "px-4 py-2.5 text-left text-xs font-semibold text-text-muted uppercase tracking-wider whitespace-nowrap",
                      field && "cursor-pointer select-none hover:text-text-secondary"
                    )}
                  >
                    <span className="inline-flex items-center gap-1">
                      {label}
                      {field && <SortIcon active={sortField === field} dir={sortDir} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.map((f) => (
                <tr
                  key={f.filingId}
                  className={cn(
                    "table-row",
                    f.status === "overdue" && "bg-[#FDEAED]/60"
                  )}
                >
                  <td className="px-4 py-2.5 font-mono text-[#0065B3] font-medium">{f.accountId}</td>
                  <td className="px-4 py-2.5 text-text-primary font-medium max-w-[180px] truncate">
                    {(f as typeof f & { accountHolder: string }).accountHolder}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-text-muted">
                    {(f as typeof f & { country: string }).country}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-text-secondary whitespace-nowrap">{formatDateShort(f.blockDate)}</td>
                  <td className={cn("px-4 py-2.5 font-mono whitespace-nowrap",
                    f.status === "overdue" ? "text-[#E61030] font-semibold" : "text-text-secondary"
                  )}>
                    {formatDateShort(f.filingDeadline)}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-text-secondary whitespace-nowrap">
                    {f.filingDate ? formatDateShort(f.filingDate) : <span className="text-text-muted">—</span>}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-text-muted text-[11px]">{f.filingId}</td>
                  <td className="px-4 py-2.5"><StatusBadge status={f.status} /></td>
                  <td className="px-4 py-2.5"><CountdownCell deadline={f.filingDeadline} status={f.status} /></td>
                </tr>
              ))}
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

      {/* ── Regulatory note ─────────────────────────────────── */}
      <div className="flex items-start gap-2 text-xs text-text-muted bg-white rounded-lg border border-gray-100 p-4">
        <Info size={13} className="shrink-0 mt-0.5 text-text-muted" />
        <span>
          OFAC blocked account reporting: 31 C.F.R. § 501.603 requires initial report within 10 business days of blocking.
          Overdue filings linked to SPIKE_001 (Nov 14 2023, HMT +28,400 delta) and SPIKE_002 (Feb 2024, ACUITY partial failure).
          Data as of {formatDate(TODAY)}.
        </span>
      </div>

    </div>
  );
}

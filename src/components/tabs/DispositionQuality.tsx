"use client";

import { useMemo, useState } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from "recharts";
import { CheckCircle2, AlertTriangle, TrendingUp, TrendingDown, Info } from "lucide-react";
import { DISPOSITION_WEEKLY, SETBACK_RECORDS } from "@/data/synthetic/disposition";
import { SPIKE_EVENTS } from "@/data/synthetic/spikes";
import { REL_COLOR, TRX_COLOR } from "@/lib/alertTypeHelpers";
import { KPICard } from "@/components/common/KPICard";
import type { FilterState, DispositionWeek } from "@/types/index";

interface DispositionQualityProps {
  filter: FilterState;
}

// ── Formatters ────────────────────────────────────────────────────────────────

function fmtPct(v: number, decimals = 2) {
  return (v * 100).toFixed(decimals) + "%";
}

function fmtShortDate(iso: string) {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", {
    month: "short", day: "numeric", timeZone: "UTC",
  });
}

function fmtWeek(iso: string) {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", {
    month: "short", year: "2-digit", timeZone: "UTC",
  });
}

function avg(arr: number[]) {
  if (!arr.length) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

// ── Color helpers ─────────────────────────────────────────────────────────────

const REASON_COLORS: Record<string, string> = {
  insufficientDocumentation: "#E61030",
  incorrectEntityMatch:      "#F97316",
  policyMisapplication:      "#D97706",
  other:                     "#6B7280",
};

const REASON_LABELS: Record<string, string> = {
  insufficientDocumentation: "Insufficient Docs",
  incorrectEntityMatch:      "Incorrect Entity Match",
  policyMisapplication:      "Policy Misapplication",
  other:                     "Other",
};

// ── Tooltips ──────────────────────────────────────────────────────────────────

function LineTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0A1628] rounded-lg px-3 py-2.5 shadow-xl border border-[#1E3A5F] text-white text-[12px]">
      <div className="font-semibold mb-1.5 text-white/90">{fmtShortDate(label)}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-0.5">
          <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: p.stroke }} />
          <span className="text-white/60">{p.name}:</span>
          <span className="font-medium tabular-nums">{fmtPct(p.value, 3)}</span>
        </div>
      ))}
    </div>
  );
}

function BarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0A1628] rounded-lg px-3 py-2.5 shadow-xl border border-[#1E3A5F] text-white text-[12px]">
      <div className="font-semibold mb-1.5 text-white/90">{fmtShortDate(label)}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-0.5">
          <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: p.fill }} />
          <span className="text-white/60">{p.name}:</span>
          <span className="font-medium tabular-nums">{fmtPct(p.value, 3)}</span>
        </div>
      ))}
    </div>
  );
}

// ── Section label ─────────────────────────────────────────────────────────────

function SectionLabel({ label, noMargin }: { label: string; noMargin?: boolean }) {
  return (
    <h3 className={`text-[11px] font-semibold uppercase tracking-widest text-[#4A5D75] ${noMargin ? "" : "mb-3"}`}>
      {label}
    </h3>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function DispositionQuality({ filter }: DispositionQualityProps) {
  const [hoveredSpike, setHoveredSpike] = useState<string | null>(null);
  const latestDate = DISPOSITION_WEEKLY[DISPOSITION_WEEKLY.length - 1].weekStart;

  // ── Filter weeks by date range ──────────────────────────────────────────────

  const filteredWeeks = useMemo<DispositionWeek[]>(() => {
    if (!filter.dateRange) return DISPOSITION_WEEKLY;
    return DISPOSITION_WEEKLY.filter(
      (w) => w.weekStart >= filter.dateRange!.start && w.weekStart <= filter.dateRange!.end
    );
  }, [filter.dateRange]);

  // ── Trend chart data ────────────────────────────────────────────────────────

  const trendData = useMemo(() => {
    return filteredWeeks.slice(-26).map((w) => ({
      weekStart: w.weekStart,
      trueMatchRate:    w.trueMatchRate,
      trueMatchRateRel: w.trueMatchRateRel,
      trueMatchRateTrx: w.trueMatchRateTrx,
      qaSetbackRate:    w.qaSetbackRate,
      qaSetbackRateRel: w.qaSetbackRateRel,
      qaSetbackRateTrx: w.qaSetbackRateTrx,
      totalReviewed:    w.totalReviewed,
      spikeFlag:        w.spikeFlag,
      spikeId:          w.spikeId,
      // Stacked reason bars for combined setback view (split across 4 reasons deterministically)
      sbr_doc:    w.qaSetbackRate * 0.38,
      sbr_entity: w.qaSetbackRate * 0.27,
      sbr_policy: w.qaSetbackRate * 0.22,
      sbr_other:  w.qaSetbackRate * 0.13,
    }));
  }, [filteredWeeks]);

  // ── KPI values — last 4 weeks ───────────────────────────────────────────────

  const kpi = useMemo(() => {
    const curr = filteredWeeks.slice(-4);
    const prev = filteredWeeks.slice(-8, -4);

    const currTMR    = avg(curr.map((w) => w.trueMatchRate)) * 100;
    const prevTMR    = avg(prev.map((w) => w.trueMatchRate)) * 100;
    const currTMRRel = avg(curr.map((w) => w.trueMatchRateRel)) * 100;
    const currTMRTrx = avg(curr.map((w) => w.trueMatchRateTrx)) * 100;

    const currSBR    = avg(curr.map((w) => w.qaSetbackRate)) * 100;
    const prevSBR    = avg(prev.map((w) => w.qaSetbackRate)) * 100;
    const currSBRRel = avg(curr.map((w) => w.qaSetbackRateRel)) * 100;
    const currSBRTrx = avg(curr.map((w) => w.qaSetbackRateTrx)) * 100;

    const currVol    = Math.round(avg(curr.map((w) => w.totalReviewed)));
    const currVolRel = Math.round(avg(curr.map((w) => w.totalReviewedRel)));
    const currVolTrx = Math.round(avg(curr.map((w) => w.totalReviewedTrx)));

    return {
      tmr: currTMR, tmrDelta: currTMR - prevTMR,
      tmrRel: currTMRRel, tmrTrx: currTMRTrx,
      sbr: currSBR, sbrDelta: currSBR - prevSBR,
      sbrRel: currSBRRel, sbrTrx: currSBRTrx,
      vol: currVol, volRel: currVolRel, volTrx: currVolTrx,
    };
  }, [filteredWeeks]);

  // ── Setback reason pie data ─────────────────────────────────────────────────

  const reasonPieData = useMemo(() => {
    const counts: Record<string, number> = {};
    SETBACK_RECORDS.forEach((r) => {
      counts[r.reason] = (counts[r.reason] ?? 0) + 1;
    });
    return Object.entries(counts).map(([reason, count]) => ({
      name:  REASON_LABELS[reason] ?? reason,
      value: count,
      color: REASON_COLORS[reason] ?? "#6B7280",
    }));
  }, []);

  // Spike reference lines for charts
  const chartDates = useMemo(() => new Set(trendData.map((d) => d.weekStart)), [trendData]);
  const chartSpikes = useMemo(
    () => SPIKE_EVENTS.filter((s) => chartDates.has(s.startDate)),
    [chartDates]
  );

  const spikeInfo = hoveredSpike ? SPIKE_EVENTS.find((s) => s.spikeId === hoveredSpike) : null;

  return (
    <div className="p-6 space-y-6 max-w-[1440px] mx-auto font-sans">

      {/* ── KPI Row ─────────────────────────────────────────────────────────── */}
      <div>
        <SectionLabel label="Quality Metrics — 4-Week Average" />
        {filter.viewMode === 'split' ? (
          <div className="bg-white rounded-xl border border-[#D0D9E8] shadow-sm overflow-hidden">
            {/* Column headers */}
            <div className="grid grid-cols-2">
              <div className="px-5 py-3 bg-[#E8F1FB] border-r border-b border-[#D0D9E8] flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full flex-shrink-0 bg-[#0065B3]" />
                <span className="text-xs font-bold uppercase tracking-widest text-[#003571]">Relationship</span>
                <span className="ml-auto text-[11px] text-[#0065B3] font-semibold tabular-nums">{kpi.tmrRel.toFixed(2)}% TMR avg</span>
              </div>
              <div className="px-5 py-3 bg-[#FFF3E0] border-b border-[#D0D9E8] flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full flex-shrink-0 bg-[#C45A00]" />
                <span className="text-xs font-bold uppercase tracking-widest text-[#7A3300]">Transaction</span>
                <span className="ml-auto text-[11px] text-[#C45A00] font-semibold tabular-nums">{kpi.tmrTrx.toFixed(2)}% TMR avg</span>
              </div>
            </div>
            {/* Two-column KPI content */}
            <div className="grid grid-cols-2 divide-x divide-[#D0D9E8]">
              <div className="p-5 space-y-3">
                <div>
                  <div className="text-[11px] text-[#4A5D75] mb-0.5">True Match Rate</div>
                  <div className="font-['IBM_Plex_Sans_Condensed'] font-bold text-2xl text-[#0065B3]">{kpi.tmrRel.toFixed(2)}%</div>
                </div>
                <div>
                  <div className="text-[11px] text-[#4A5D75] mb-0.5">QA Setback Rate</div>
                  <div className="font-['IBM_Plex_Sans_Condensed'] font-bold text-2xl text-[#1A6632]">{kpi.sbrRel.toFixed(2)}%</div>
                </div>
              </div>
              <div className="p-5 space-y-3">
                <div>
                  <div className="text-[11px] text-[#4A5D75] mb-0.5">True Match Rate</div>
                  <div className="font-['IBM_Plex_Sans_Condensed'] font-bold text-2xl text-[#C45A00]">{kpi.tmrTrx.toFixed(2)}%</div>
                </div>
                <div>
                  <div className="text-[11px] text-[#4A5D75] mb-0.5">QA Setback Rate</div>
                  <div className="font-['IBM_Plex_Sans_Condensed'] font-bold text-2xl text-[#C45A00]">{kpi.sbrTrx.toFixed(2)}%</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <KPICard
              label="True Match Rate"
              value={kpi.tmr}
              unit="%"
              delta={kpi.tmrDelta}
              status={kpi.tmr > 0.5 ? "green" : "amber"}
              subLabel="4-week avg · all tiers"
            />
            <KPICard
              label="QA Setback Rate"
              value={kpi.sbr}
              unit="%"
              delta={kpi.sbrDelta}
              status={kpi.sbr < 3 ? "green" : kpi.sbr < 5 ? "amber" : "red"}
              subLabel="4-week avg · target < 3%"
            />
            <KPICard
              label="Weekly Reviews"
              value={kpi.vol}
              status="neutral"
              subLabel="4-week avg human-reviewed"
            />
          </div>
        )}
      </div>

      {/* Spike hover info */}
      {spikeInfo && (
        <div className="rounded-lg border border-[#0065B3] bg-[#E6F0FA] px-4 py-3 flex gap-3 items-start">
          <span className="text-lg leading-none">⚡</span>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[12px] font-semibold text-[#003571]">{spikeInfo.label}</span>
              <span className="text-[10px] bg-white border border-[#0065B3] text-[#0065B3] rounded px-1.5 py-0.5 font-semibold">{spikeInfo.spikeId}</span>
            </div>
            <p className="text-[11px] text-[#003571]/80">{spikeInfo.rootCause}</p>
          </div>
        </div>
      )}

      {/* ── True Match Rate Chart ────────────────────────────────────────────── */}
      {filter.viewMode === 'split' ? (
        <div className="bg-white rounded-xl border border-[#D0D9E8] shadow-sm overflow-hidden">
          <div className="grid grid-cols-2">
            <div className="px-5 py-3 bg-[#E8F1FB] border-r border-b border-[#D0D9E8] flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0 bg-[#0065B3]" />
              <span className="text-xs font-bold uppercase tracking-widest text-[#003571]">Relationship</span>
              <span className="ml-auto text-[11px] text-[#0065B3] font-semibold tabular-nums">True Match Rate</span>
            </div>
            <div className="px-5 py-3 bg-[#FFF3E0] border-b border-[#D0D9E8] flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0 bg-[#C45A00]" />
              <span className="text-xs font-bold uppercase tracking-widest text-[#7A3300]">Transaction</span>
              <span className="ml-auto text-[11px] text-[#C45A00] font-semibold tabular-nums">True Match Rate</span>
            </div>
          </div>
          <div className="grid grid-cols-2 divide-x divide-[#D0D9E8]">
            <div className="p-4">
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF2" vertical={false} />
                    <XAxis dataKey="weekStart" tickFormatter={fmtWeek}
                      tick={{ fill: "#8699AF", fontSize: 10 }} axisLine={false} tickLine={false} interval={3} />
                    <YAxis tickFormatter={(v) => fmtPct(v, 2)}
                      tick={{ fill: "#8699AF", fontSize: 10 }} axisLine={false} tickLine={false} width={44} />
                    <RTooltip content={<LineTooltip />} />
                    {chartSpikes.map((s) => (
                      <ReferenceLine key={s.spikeId} x={s.startDate} stroke="#0065B3"
                        strokeDasharray="4 3" strokeWidth={1.5} />
                    ))}
                    <Line dataKey="trueMatchRateRel" name="Relationship" stroke={REL_COLOR}
                      strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="p-4">
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF2" vertical={false} />
                    <XAxis dataKey="weekStart" tickFormatter={fmtWeek}
                      tick={{ fill: "#8699AF", fontSize: 10 }} axisLine={false} tickLine={false} interval={3} />
                    <YAxis tickFormatter={(v) => fmtPct(v, 2)}
                      tick={{ fill: "#8699AF", fontSize: 10 }} axisLine={false} tickLine={false} width={44} />
                    <RTooltip content={<LineTooltip />} />
                    {chartSpikes.map((s) => (
                      <ReferenceLine key={s.spikeId} x={s.startDate} stroke="#C45A00"
                        strokeDasharray="4 3" strokeWidth={1.5} />
                    ))}
                    <Line dataKey="trueMatchRateTrx" name="Transaction" stroke={TRX_COLOR}
                      strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#D0D9E8] shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <SectionLabel label="True Match Rate — Weekly Trend (Last 26 Weeks)" noMargin />
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF2" vertical={false} />
                <XAxis dataKey="weekStart" tickFormatter={fmtWeek}
                  tick={{ fill: "#8699AF", fontSize: 10 }} axisLine={false} tickLine={false} interval={3} />
                <YAxis tickFormatter={(v) => fmtPct(v, 2)}
                  tick={{ fill: "#8699AF", fontSize: 10 }} axisLine={false} tickLine={false} width={44} />
                <RTooltip content={<LineTooltip />} />
                {chartSpikes.map((s) => (
                  <ReferenceLine key={s.spikeId} x={s.startDate} stroke="#0065B3"
                    strokeDasharray="4 3" strokeWidth={1.5}
                    label={{ value: "⚡", position: "top", fontSize: 11,
                      onMouseEnter: () => setHoveredSpike(s.spikeId),
                      onMouseLeave: () => setHoveredSpike(null) }}
                  />
                ))}
                <Line dataKey="trueMatchRate" name="True Match Rate" stroke="#003571"
                  strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── QA Setback Rate Chart ────────────────────────────────────────────── */}
      {filter.viewMode === 'split' ? (
        <div className="bg-white rounded-xl border border-[#D0D9E8] shadow-sm overflow-hidden">
          <div className="grid grid-cols-2">
            <div className="px-5 py-3 bg-[#E8F1FB] border-r border-b border-[#D0D9E8] flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0 bg-[#0065B3]" />
              <span className="text-xs font-bold uppercase tracking-widest text-[#003571]">Relationship</span>
              <span className="ml-auto text-[11px] text-[#0065B3] font-semibold tabular-nums">QA Setback Rate</span>
            </div>
            <div className="px-5 py-3 bg-[#FFF3E0] border-b border-[#D0D9E8] flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0 bg-[#C45A00]" />
              <span className="text-xs font-bold uppercase tracking-widest text-[#7A3300]">Transaction</span>
              <span className="ml-auto text-[11px] text-[#C45A00] font-semibold tabular-nums">QA Setback Rate</span>
            </div>
          </div>
          <div className="grid grid-cols-2 divide-x divide-[#D0D9E8]">
            <div className="p-4">
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF2" vertical={false} />
                    <XAxis dataKey="weekStart" tickFormatter={fmtWeek}
                      tick={{ fill: "#8699AF", fontSize: 10 }} axisLine={false} tickLine={false} interval={3} />
                    <YAxis tickFormatter={(v) => fmtPct(v, 1)}
                      tick={{ fill: "#8699AF", fontSize: 10 }} axisLine={false} tickLine={false} width={44} />
                    <RTooltip content={<BarTooltip />} />
                    {chartSpikes.map((s) => (
                      <ReferenceLine key={s.spikeId} x={s.startDate} stroke="#0065B3"
                        strokeDasharray="4 3" strokeWidth={1.5} />
                    ))}
                    <Bar dataKey="qaSetbackRateRel" name="Relationship" fill={REL_COLOR} radius={[2,2,0,0]} maxBarSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="p-4">
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF2" vertical={false} />
                    <XAxis dataKey="weekStart" tickFormatter={fmtWeek}
                      tick={{ fill: "#8699AF", fontSize: 10 }} axisLine={false} tickLine={false} interval={3} />
                    <YAxis tickFormatter={(v) => fmtPct(v, 1)}
                      tick={{ fill: "#8699AF", fontSize: 10 }} axisLine={false} tickLine={false} width={44} />
                    <RTooltip content={<BarTooltip />} />
                    {chartSpikes.map((s) => (
                      <ReferenceLine key={s.spikeId} x={s.startDate} stroke="#C45A00"
                        strokeDasharray="4 3" strokeWidth={1.5} />
                    ))}
                    <Bar dataKey="qaSetbackRateTrx" name="Transaction" fill={TRX_COLOR} radius={[2,2,0,0]} maxBarSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#D0D9E8] shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <SectionLabel label="QA Setback Rate — Weekly (Last 26 Weeks)" noMargin />
              <p className="text-[11px] text-[#8699AF] mt-0.5">Stacked by setback reason</p>
            </div>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF2" vertical={false} />
                <XAxis dataKey="weekStart" tickFormatter={fmtWeek}
                  tick={{ fill: "#8699AF", fontSize: 10 }} axisLine={false} tickLine={false} interval={3} />
                <YAxis tickFormatter={(v) => fmtPct(v, 1)}
                  tick={{ fill: "#8699AF", fontSize: 10 }} axisLine={false} tickLine={false} width={44} />
                <RTooltip content={<BarTooltip />} />
                {chartSpikes.map((s) => (
                  <ReferenceLine key={s.spikeId} x={s.startDate} stroke="#0065B3"
                    strokeDasharray="4 3" strokeWidth={1.5} />
                ))}
                <Bar dataKey="sbr_doc"    name="Insufficient Docs"     stackId="s" fill={REASON_COLORS.insufficientDocumentation} radius={[0,0,0,0]} maxBarSize={18} />
                <Bar dataKey="sbr_entity" name="Incorrect Entity Match" stackId="s" fill={REASON_COLORS.incorrectEntityMatch}      radius={[0,0,0,0]} maxBarSize={18} />
                <Bar dataKey="sbr_policy" name="Policy Misapplication"  stackId="s" fill={REASON_COLORS.policyMisapplication}       radius={[0,0,0,0]} maxBarSize={18} />
                <Bar dataKey="sbr_other"  name="Other"                  stackId="s" fill={REASON_COLORS.other}                      radius={[2,2,0,0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 mt-2 justify-center flex-wrap">
            {Object.entries(REASON_LABELS).map(([key, label]) => (
              <div key={key} className="flex items-center gap-1.5">
                <div className="w-3 h-2 rounded-sm" style={{ backgroundColor: REASON_COLORS[key] }} />
                <span className="text-[11px] text-[#4A5D75]">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Bottom Row — Reason Pie + Review Volume ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Setback reason breakdown pie */}
        <div className="bg-white rounded-xl border border-[#D0D9E8] shadow-sm p-5">
          <SectionLabel label="Setback Reasons — All-Time" />
          {filter.viewMode === 'split' && (
            <div className="flex items-center gap-1.5 mb-3 text-[11px] text-[#4A5D75] bg-[#E6F0FA] rounded px-2.5 py-1.5">
              <Info className="w-3 h-3 text-[#0065B3] flex-shrink-0" />
              Setback reasons shown combined — no per-type breakdown at record granularity.
            </div>
          )}
          <div className="h-36 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={reasonPieData} cx="50%" cy="50%" innerRadius={38} outerRadius={60}
                  dataKey="value" paddingAngle={2}>
                  {reasonPieData.map((d, i) => (
                    <Cell key={i} fill={d.color} stroke="white" strokeWidth={2} />
                  ))}
                </Pie>
                <RTooltip
                  content={({ active, payload }) =>
                    active && payload?.length ? (
                      <div className="bg-white border border-gray-200 rounded px-2.5 py-1.5 text-xs shadow">
                        <div className="font-semibold">{payload[0].name}</div>
                        <div>{payload[0].value} setbacks</div>
                      </div>
                    ) : null
                  }
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 mt-1">
            {reasonPieData.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-[#4A5D75]">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                  {d.name}
                </span>
                <span className="font-semibold text-[#0A1628]">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly review volume */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#D0D9E8] shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <SectionLabel label="Weekly Review Volume — Last 26 Weeks" noMargin />
            {filter.viewMode === 'split' && (
              <div className="flex items-center gap-4">
                {[["Relationship (40%)", REL_COLOR], ["Transaction (60%)", TRX_COLOR]].map(([n, c]) => (
                  <div key={n} className="flex items-center gap-1.5">
                    <div className="w-3 h-2 rounded-sm" style={{ backgroundColor: c }} />
                    <span className="text-[11px] text-[#4A5D75]">{n}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={trendData.map((d) => ({
                  weekStart: d.weekStart,
                  totalReviewed: d.totalReviewed,
                  relReviewed: Math.round(d.totalReviewed * 0.40),
                  trxReviewed: d.totalReviewed - Math.round(d.totalReviewed * 0.40),
                  spikeFlag: d.spikeFlag,
                }))}
                margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF2" vertical={false} />
                <XAxis dataKey="weekStart" tickFormatter={fmtWeek}
                  tick={{ fill: "#8699AF", fontSize: 10 }} axisLine={false} tickLine={false} interval={3} />
                <YAxis tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)}
                  tick={{ fill: "#8699AF", fontSize: 10 }} axisLine={false} tickLine={false} width={36} />
                <RTooltip
                  content={({ active, payload, label }) =>
                    active && payload?.length ? (
                      <div className="bg-[#0A1628] rounded-lg px-3 py-2 text-white text-[12px] shadow-xl border border-[#1E3A5F]">
                        <div className="font-semibold mb-1">{fmtShortDate(label)}</div>
                        {payload.map((p: any) => (
                          <div key={p.dataKey} className="flex gap-2">
                            <div className="w-2 h-2 mt-1 rounded-sm flex-shrink-0" style={{ background: p.fill }} />
                            <span className="text-white/60">{p.name}:</span>
                            <span className="font-medium tabular-nums">{Number(p.value).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    ) : null
                  }
                />
                {filter.viewMode === 'split' ? (
                  <>
                    <Bar dataKey="relReviewed" name="Relationship" stackId="v" fill={REL_COLOR} radius={[0,0,0,0]} maxBarSize={18} />
                    <Bar dataKey="trxReviewed" name="Transaction"  stackId="v" fill={TRX_COLOR} radius={[2,2,0,0]} maxBarSize={18} />
                  </>
                ) : (
                  <Bar dataKey="totalReviewed" name="Total Reviewed" fill="#003571" radius={[2,2,0,0]} maxBarSize={18} />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Summary stats row */}
          <div className={`grid gap-3 mt-3 ${filter.viewMode === 'split' ? 'grid-cols-3' : 'grid-cols-3'}`}>
            {filter.viewMode === 'split' ? (
              <>
                <div className="text-center">
                  <div className="text-xs text-[#8699AF]">Rel Reviews / week</div>
                  <div className="font-['IBM_Plex_Sans_Condensed'] font-bold text-lg text-[#0065B3]">
                    {kpi.volRel.toLocaleString()}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-[#8699AF]">Trx Reviews / week</div>
                  <div className="font-['IBM_Plex_Sans_Condensed'] font-bold text-lg text-[#C45A00]">
                    {kpi.volTrx.toLocaleString()}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-[#8699AF]">Total / week</div>
                  <div className="font-['IBM_Plex_Sans_Condensed'] font-bold text-lg text-[#0A1628]">
                    {kpi.vol.toLocaleString()}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="text-center">
                  <div className="text-xs text-[#8699AF]">4-wk avg volume</div>
                  <div className="font-['IBM_Plex_Sans_Condensed'] font-bold text-lg">{kpi.vol.toLocaleString()}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-[#8699AF]">True match rate</div>
                  <div className="font-['IBM_Plex_Sans_Condensed'] font-bold text-lg text-[#1A6632]">{kpi.tmr.toFixed(2)}%</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-[#8699AF]">QA setback rate</div>
                  <div className={`font-['IBM_Plex_Sans_Condensed'] font-bold text-lg ${kpi.sbr < 3 ? "text-[#1A6632]" : kpi.sbr < 5 ? "text-[#C45A00]" : "text-[#E61030]"}`}>
                    {kpi.sbr.toFixed(2)}%
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── QA Setback Records Table ─────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#D0D9E8] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#D0D9E8] bg-[#F5F7FA]">
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className="text-[#C45A00]" />
            <span className="text-sm font-semibold text-[#0A1628]">QA Setback Records</span>
            <span className="ml-2 text-[11px] text-[#8699AF]">{SETBACK_RECORDS.length} total · all monitoring period</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-[#F5F7FA] border-b border-[#D0D9E8]">
              <tr>
                {["Setback ID", "Date", "Alert ID", "Reason", "Analyst", "QA Lead", "Resolved", "Resolution Date"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-[#4A5D75] whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SETBACK_RECORDS.map((r) => (
                <tr key={r.setbackId} className="border-b border-[#F0F2F5] hover:bg-[#F5F7FA] transition-colors">
                  <td className="px-4 py-2.5 font-mono text-[#C45A00] font-semibold">{r.setbackId}</td>
                  <td className="px-4 py-2.5 text-[#4A5D75]">{r.date}</td>
                  <td className="px-4 py-2.5 font-mono text-[#0065B3]">{r.alertId}</td>
                  <td className="px-4 py-2.5">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold border"
                      style={{ background: REASON_COLORS[r.reason] + "20", color: REASON_COLORS[r.reason], borderColor: REASON_COLORS[r.reason] + "60" }}>
                      {REASON_LABELS[r.reason] ?? r.reason}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[#4A5D75]">{r.analystId}</td>
                  <td className="px-4 py-2.5 font-mono text-[#4A5D75]">{r.qaLeadId}</td>
                  <td className="px-4 py-2.5">
                    {r.resolved
                      ? <span className="flex items-center gap-1 text-[#1A6632]"><CheckCircle2 size={11} /> Yes</span>
                      : <span className="flex items-center gap-1 text-[#E61030]"><AlertTriangle size={11} /> Open</span>
                    }
                  </td>
                  <td className="px-4 py-2.5 text-[#4A5D75]">{r.resolutionDate ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

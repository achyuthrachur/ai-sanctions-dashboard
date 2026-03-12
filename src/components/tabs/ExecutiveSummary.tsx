"use client";

import { useMemo } from "react";
import {
  AreaChart, Area, LineChart, Line,
  BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import { AIInsightBanner } from "@/components/common/AIInsightBanner";
import { KPICard } from "@/components/common/KPICard";
import { DAILY_SUMMARIES } from "@/data/synthetic/alerts";
import { DISPOSITION_WEEKLY } from "@/data/synthetic/disposition";
import { SPIKE_EVENTS } from "@/data/synthetic/spikes";
import { REAPPLY_TRANSACTIONS, REAPPLY_SUMMARY } from "@/data/synthetic/reapply";
import { REL_COLOR, TRX_COLOR } from "@/lib/alertTypeHelpers";
import type { FilterState, DailySummary } from "@/types/index";

const SYNTHETIC_INSIGHT =
  "SLA compliance for L1 High-priority alerts has remained above the 95% target for 18 consecutive days following the resolution of the Acuity vendor backlog in February 2024. " +
  "22 Type A Reapply transactions remain in active_risk status with cumulative estimated exposure of $4.1M — the Volga Meridian corridor (RPY-A-001) accounts for $617K and is the highest-priority remediation item this quarter.";

interface ExecutiveSummaryProps {
  filter: FilterState;
}

function fmtShortDate(iso: string) {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", {
    month: "short", day: "numeric", timeZone: "UTC",
  });
}

function avg(arr: number[]) {
  if (!arr.length) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function SectionLabel({ label }: { label: string }) {
  return (
    <h3 className="text-[11px] font-semibold uppercase tracking-widest text-[#4A5D75] mb-3">
      {label}
    </h3>
  );
}

export default function ExecutiveSummary({ filter }: ExecutiveSummaryProps) {
  const latestDate = DAILY_SUMMARIES[DAILY_SUMMARIES.length - 1].date;

  // ── Filter summaries ──────────────────────────────────────────────────────

  const filteredSummaries = useMemo<DailySummary[]>(() => {
    if (!filter.dateRange) return DAILY_SUMMARIES;
    return DAILY_SUMMARIES.filter(
      (d) => d.date >= filter.dateRange!.start && d.date <= filter.dateRange!.end
    );
  }, [filter.dateRange]);

  // ── Chart data: last 60 days ──────────────────────────────────────────────

  const chartData = useMemo(() => {
    return filteredSummaries.slice(-60).map((d) => ({
      date: d.date,
      totalAlerts: d.totalAlerts,
      relTotal: d.l1CountRel + d.l2CountRel + d.l3CountRel,
      trxTotal: d.l1CountTrx + d.l2CountTrx + d.l3CountTrx,
      l1: d.l1Count,
      l2: d.l2Count,
      l3: d.l3Count,
      spikeFlag: d.spikeFlag,
      spikeId: d.spikeId,
    }));
  }, [filteredSummaries]);

  // ── Disposition weekly: last 12 weeks ────────────────────────────────────

  const dispWeeks = useMemo(() => {
    const weeks = filter.dateRange
      ? DISPOSITION_WEEKLY.filter(
          (w) => w.weekStart >= filter.dateRange!.start && w.weekStart <= filter.dateRange!.end
        )
      : DISPOSITION_WEEKLY;
    return weeks.slice(-12).map((w) => ({
      weekStart: w.weekStart,
      trueMatchRate: w.trueMatchRate * 100,
      qaSetbackRate: w.qaSetbackRate * 100,
      trueMatchRateRel: w.trueMatchRateRel * 100,
      trueMatchRateTrx: w.trueMatchRateTrx * 100,
      qaSetbackRateRel: w.qaSetbackRateRel * 100,
      qaSetbackRateTrx: w.qaSetbackRateTrx * 100,
    }));
  }, [filter.dateRange]);

  // ── KPI values ────────────────────────────────────────────────────────────

  const kpi = useMemo(() => {
    const slice7   = filteredSummaries.slice(-7);
    const prior7   = filteredSummaries.slice(-14, -7);
    const l1hCurr  = avg(slice7.map((d) => d.l1HighSlaCompliance)) * 100;
    const l1hPrev  = avg(prior7.map((d) => d.l1HighSlaCompliance)) * 100;
    const relAvg   = avg(slice7.map((d) => d.l1CountRel + d.l2CountRel + d.l3CountRel));
    const trxAvg   = avg(slice7.map((d) => d.l1CountTrx + d.l2CountTrx + d.l3CountTrx));
    const totalAvg = avg(slice7.map((d) => d.totalAlerts));
    const totalPrev= avg(prior7.map((d) => d.totalAlerts));
    return { l1hCurr, l1hDelta: l1hCurr - l1hPrev, relAvg, trxAvg, totalAvg, totalDelta: totalAvg - totalPrev };
  }, [filteredSummaries]);

  // ── Spike references ──────────────────────────────────────────────────────

  const chartDates = useMemo(() => new Set(chartData.map((d) => d.date)), [chartData]);
  const chartSpikes = useMemo(
    () => SPIKE_EVENTS.filter((s) => chartDates.has(s.startDate)),
    [chartDates]
  );

  // ── Reapply active risk ───────────────────────────────────────────────────
  const activeRisk = REAPPLY_TRANSACTIONS.filter((r) => r.currentStatus === "active_risk").length;
  const typeAExposure = REAPPLY_TRANSACTIONS.filter((r) => r.reapplyType === "A")
    .reduce((s, r) => s + r.estimatedExposure, 0);

  return (
    <div className="p-6 space-y-6 max-w-[1440px] mx-auto">

      {/* AI Insight Banner */}
      <AIInsightBanner insight={SYNTHETIC_INSIGHT} mode="prototype" />

      {/* ── KPI Row ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          label="L1 High SLA Compliance"
          value={kpi.l1hCurr}
          unit="%"
          delta={kpi.l1hDelta}
          deltaLabel="vs prior 7d"
          status={kpi.l1hCurr >= 95 ? "green" : kpi.l1hCurr >= 90 ? "amber" : "red"}
          trend={filteredSummaries.slice(-7).map((d) => d.l1HighSlaCompliance * 100)}
        />
        <KPICard
          label="Active Type A Reapply"
          value={activeRisk}
          unit="records"
          status="red"
          escalationKey={2}
        />
        <KPICard
          label="Overdue OFAC Filings"
          value={3}
          unit="accounts"
          delta={-1}
          deltaLabel="vs prior month"
          status="amber"
          escalationKey={3}
        />
        <KPICard
          label="Maker-Checker Compliance"
          value={99.8}
          unit="%"
          status="green"
        />
      </div>

      {/* ── Daily Alert Volume Chart ─────────────────────────────────────────── */}
      {filter.viewMode === 'split' ? (
        <div className="bg-white rounded-xl border border-[#D0D9E8] shadow-sm overflow-hidden">
          {/* Column headers */}
          <div className="grid grid-cols-2">
            <div className="px-5 py-3 bg-[#E8F1FB] border-r border-b border-[#D0D9E8] flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0 bg-[#0065B3]" />
              <span className="text-xs font-bold uppercase tracking-widest text-[#003571]">Relationship</span>
              <span className="ml-auto text-[11px] text-[#0065B3] font-semibold tabular-nums">
                {Math.round(kpi.relAvg).toLocaleString()}/day
              </span>
            </div>
            <div className="px-5 py-3 bg-[#FFF3E0] border-b border-[#D0D9E8] flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0 bg-[#C45A00]" />
              <span className="text-xs font-bold uppercase tracking-widest text-[#7A3300]">Transaction</span>
              <span className="ml-auto text-[11px] text-[#C45A00] font-semibold tabular-nums">
                {Math.round(kpi.trxAvg).toLocaleString()}/day
              </span>
            </div>
          </div>
          {/* Two-column area charts */}
          <div className="grid grid-cols-2 divide-x divide-[#D0D9E8]">
            <div className="h-48 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="relGradExec" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={REL_COLOR} stopOpacity={0.18} />
                      <stop offset="95%" stopColor={REL_COLOR} stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF2" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={fmtShortDate}
                    tick={{ fill: "#8699AF", fontSize: 10 }} axisLine={false} tickLine={false} interval={7} />
                  <YAxis tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)}
                    tick={{ fill: "#8699AF", fontSize: 10 }} axisLine={false} tickLine={false} width={36} />
                  <RTooltip
                    content={({ active, payload, label }: any) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="bg-[#0A1628] rounded-lg px-3 py-2.5 shadow-xl border border-[#1E3A5F] text-white text-[12px]">
                          <div className="font-semibold mb-1.5">{fmtShortDate(label)}</div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-sm" style={{ background: REL_COLOR }} />
                            <span className="text-white/60">Relationship:</span>
                            <span className="font-medium tabular-nums">{Number(payload[0]?.value ?? 0).toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    }}
                  />
                  {chartSpikes.map((s) => (
                    <ReferenceLine key={s.spikeId} x={s.startDate} stroke="#0065B3"
                      strokeDasharray="4 3" strokeWidth={1.5} />
                  ))}
                  <Area dataKey="relTotal" name="Relationship" type="monotone"
                    fill="url(#relGradExec)" stroke={REL_COLOR} strokeWidth={2} dot={false}
                    activeDot={{ r: 4, fill: REL_COLOR, stroke: "#fff", strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="h-48 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="trxGradExec" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={TRX_COLOR} stopOpacity={0.18} />
                      <stop offset="95%" stopColor={TRX_COLOR} stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF2" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={fmtShortDate}
                    tick={{ fill: "#8699AF", fontSize: 10 }} axisLine={false} tickLine={false} interval={7} />
                  <YAxis tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)}
                    tick={{ fill: "#8699AF", fontSize: 10 }} axisLine={false} tickLine={false} width={36} />
                  <RTooltip
                    content={({ active, payload, label }: any) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="bg-[#0A1628] rounded-lg px-3 py-2.5 shadow-xl border border-[#1E3A5F] text-white text-[12px]">
                          <div className="font-semibold mb-1.5">{fmtShortDate(label)}</div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-sm" style={{ background: TRX_COLOR }} />
                            <span className="text-white/60">Transaction:</span>
                            <span className="font-medium tabular-nums">{Number(payload[0]?.value ?? 0).toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    }}
                  />
                  {chartSpikes.map((s) => (
                    <ReferenceLine key={s.spikeId} x={s.startDate} stroke="#C45A00"
                      strokeDasharray="4 3" strokeWidth={1.5} />
                  ))}
                  <Area dataKey="trxTotal" name="Transaction" type="monotone"
                    fill="url(#trxGradExec)" stroke={TRX_COLOR} strokeWidth={2} dot={false}
                    activeDot={{ r: 4, fill: TRX_COLOR, stroke: "#fff", strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#D0D9E8] shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-[#4A5D75]">
              Daily Alert Volume — Last 60 Days
            </h3>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#0065B3" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#0065B3" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF2" vertical={false} />
                <XAxis dataKey="date" tickFormatter={fmtShortDate}
                  tick={{ fill: "#8699AF", fontSize: 10 }} axisLine={false} tickLine={false} interval={7} />
                <YAxis tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)}
                  tick={{ fill: "#8699AF", fontSize: 10 }} axisLine={false} tickLine={false} width={36} />
                <RTooltip
                  content={({ active, payload, label }: any) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="bg-[#0A1628] rounded-lg px-3 py-2.5 shadow-xl border border-[#1E3A5F] text-white text-[12px]">
                        <div className="font-semibold mb-1.5">{fmtShortDate(label)}</div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-sm bg-[#0065B3]" />
                          <span className="text-white/60">Total:</span>
                          <span className="font-medium tabular-nums">{Number(payload[0]?.value ?? 0).toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  }}
                />
                {chartSpikes.map((s) => (
                  <ReferenceLine key={s.spikeId} x={s.startDate} stroke="#0065B3"
                    strokeDasharray="4 3" strokeWidth={1.5} />
                ))}
                <Area dataKey="totalAlerts" name="Total Alerts" type="monotone"
                  fill="url(#totalGrad)" stroke="#0065B3" strokeWidth={2} dot={false}
                  activeDot={{ r: 4, fill: "#0065B3", stroke: "#fff", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Bottom row: Disposition trend + Reapply exposure ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* True Match Rate & QA Setback — 12-week mini chart */}
        <div className="bg-white rounded-xl border border-[#D0D9E8] shadow-sm p-5">
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-[#4A5D75] mb-1">
            Disposition Quality — 12-Week Trend
          </h3>
          <p className="text-[11px] text-[#8699AF] mb-3">True match rate (left) · QA setback rate (right)</p>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dispWeeks} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF2" vertical={false} />
                <XAxis dataKey="weekStart"
                  tickFormatter={(s) => new Date(s + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", timeZone: "UTC" })}
                  tick={{ fill: "#8699AF", fontSize: 10 }} axisLine={false} tickLine={false} interval={2} />
                <YAxis yAxisId="tmr" tickFormatter={(v) => v.toFixed(1) + "%"}
                  tick={{ fill: "#8699AF", fontSize: 10 }} axisLine={false} tickLine={false} width={38} />
                <YAxis yAxisId="sbr" orientation="right" tickFormatter={(v) => v.toFixed(1) + "%"}
                  tick={{ fill: "#8699AF", fontSize: 10 }} axisLine={false} tickLine={false} width={38} />
                <RTooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="bg-[#0A1628] rounded-lg px-3 py-2 text-white text-[11px] shadow-xl border border-[#1E3A5F]">
                        <div className="font-semibold mb-1">
                          {new Date(label + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}
                        </div>
                        {payload.map((p: any) => (
                          <div key={p.dataKey} className="flex items-center gap-1.5 mb-0.5">
                            <div className="w-2 h-0.5 rounded" style={{ background: p.stroke }} />
                            <span className="text-white/60">{p.name}:</span>
                            <span className="tabular-nums">{Number(p.value).toFixed(2)}%</span>
                          </div>
                        ))}
                      </div>
                    );
                  }}
                />
                {filter.viewMode === 'split' ? (
                  <>
                    <Line yAxisId="tmr" dataKey="trueMatchRateRel" name="TMR Rel" stroke={REL_COLOR} strokeWidth={2} dot={false} />
                    <Line yAxisId="tmr" dataKey="trueMatchRateTrx" name="TMR Trx" stroke={TRX_COLOR} strokeWidth={2} dot={false} />
                    <Line yAxisId="sbr" dataKey="qaSetbackRateRel" name="SBR Rel" stroke={REL_COLOR} strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
                    <Line yAxisId="sbr" dataKey="qaSetbackRateTrx" name="SBR Trx" stroke={TRX_COLOR} strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
                  </>
                ) : (
                  <>
                    <Line yAxisId="tmr" dataKey="trueMatchRate" name="True Match Rate" stroke="#003571" strokeWidth={2} dot={false} />
                    <Line yAxisId="sbr" dataKey="qaSetbackRate" name="QA Setback Rate" stroke="#C45A00" strokeWidth={2} dot={false} strokeDasharray="4 2" />
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 mt-2">
            {filter.viewMode === 'split' ? (
              <>
                <div className="flex items-center gap-1.5"><div className="w-5 h-0.5 rounded bg-[#0065B3]" /><span className="text-[11px] text-[#4A5D75]">Relationship</span></div>
                <div className="flex items-center gap-1.5"><div className="w-5 h-0.5 rounded bg-[#C45A00]" /><span className="text-[11px] text-[#4A5D75]">Transaction</span></div>
                <span className="text-[11px] text-[#8699AF]">Solid = TMR · Dashed = SBR</span>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1.5"><div className="w-5 h-0.5 rounded bg-[#003571]" /><span className="text-[11px] text-[#4A5D75]">True Match Rate</span></div>
                <div className="flex items-center gap-1.5"><div className="w-5 h-0.5 rounded bg-[#C45A00] opacity-70" style={{ backgroundImage: "repeating-linear-gradient(90deg,#C45A00 0,#C45A00 4px,transparent 4px,transparent 6px)" }} /><span className="text-[11px] text-[#4A5D75]">QA Setback Rate</span></div>
              </>
            )}
          </div>
        </div>

        {/* Reapply Risk Exposure Summary */}
        <div className="bg-white rounded-xl border border-[#D0D9E8] shadow-sm p-5">
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-[#4A5D75] mb-1">
            Reapply Risk — Exposure Summary
          </h3>
          <p className="text-[11px] text-[#8699AF] mb-4">Active reapply transactions by risk type</p>
          <div className="space-y-3">
            {[
              { label: "Type A — Counterparty Hit",  count: REAPPLY_SUMMARY.typeA, color: "#E61030", exposure: typeAExposure },
              { label: "Type B — Corridor Risk",     count: REAPPLY_SUMMARY.typeB, color: "#F97316", exposure: null },
              { label: "Type C — Stale Review",      count: REAPPLY_SUMMARY.typeC, color: "#D97706", exposure: null },
              { label: "Type D — Clean",             count: REAPPLY_SUMMARY.typeD, color: "#16A34A", exposure: null },
            ].map(({ label, count, color, exposure }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                <span className="text-xs text-[#4A5D75] flex-1">{label}</span>
                <span className="font-['IBM_Plex_Sans_Condensed'] font-bold text-sm" style={{ color }}>{count}</span>
                {exposure !== null && (
                  <span className="text-[11px] text-[#E61030] font-semibold ml-2">
                    ${(exposure / 1_000_000).toFixed(1)}M exposure
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 h-28">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: "Type A", value: REAPPLY_SUMMARY.typeA, fill: "#E61030" },
                  { name: "Type B", value: REAPPLY_SUMMARY.typeB, fill: "#F97316" },
                  { name: "Type C", value: REAPPLY_SUMMARY.typeC, fill: "#D97706" },
                  { name: "Type D", value: REAPPLY_SUMMARY.typeD, fill: "#16A34A" },
                ]}
                margin={{ top: 4, right: 8, left: -8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF2" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#8699AF", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#8699AF", fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
                <RTooltip
                  content={({ active, payload }) =>
                    active && payload?.length ? (
                      <div className="bg-white border border-gray-200 rounded px-2.5 py-1.5 text-xs shadow">
                        <div className="font-semibold">{payload[0].payload.name}</div>
                        <div>{payload[0].value} records</div>
                      </div>
                    ) : null
                  }
                />
                <Bar dataKey="value" radius={[3, 3, 0, 0]} maxBarSize={40}>
                  {["#E61030", "#F97316", "#D97706", "#16A34A"].map((fill, index) => (
                    <Cell key={index} fill={fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

    </div>
  );
}

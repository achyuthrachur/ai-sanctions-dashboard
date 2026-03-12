"use client";
import { useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { Info, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { LIST_FEED_DAILY } from "@/data/synthetic/listFeeds";
import type { FilterState, FeedName, FeedStatus } from "@/types/index";

interface ListFeedHealthProps {
  filter: FilterState;
}

const FEED_COLORS: Record<FeedName, string> = {
  OFAC_SDN:          "#0065B3",
  OFAC_CONSOLIDATED: "#003571",
  UN_SC:             "#1A6632",
  EU_CONSOLIDATED:   "#C45A00",
  HMT:               "#7C3AED",
  ACUITY_AGGREGATED: "#E61030",
};

const FEED_LABELS: Record<FeedName, string> = {
  OFAC_SDN:          "OFAC SDN",
  OFAC_CONSOLIDATED: "OFAC Consol.",
  UN_SC:             "UN SC",
  EU_CONSOLIDATED:   "EU Consol.",
  HMT:               "HMT",
  ACUITY_AGGREGATED: "Acuity",
};

const FEED_LABELS_FULL: Record<FeedName, string> = {
  OFAC_SDN:          "OFAC SDN",
  OFAC_CONSOLIDATED: "OFAC Consolidated",
  UN_SC:             "UN Security Council",
  EU_CONSOLIDATED:   "EU Consolidated",
  HMT:               "HMT",
  ACUITY_AGGREGATED: "Acuity Aggregated",
};

const FEED_NAMES: FeedName[] = [
  "OFAC_SDN","OFAC_CONSOLIDATED","UN_SC","EU_CONSOLIDATED","HMT","ACUITY_AGGREGATED",
];

function fmtWeek(iso: string) {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", {
    month: "short", year: "2-digit", timeZone: "UTC",
  });
}

function fmtDateShort(iso: string) {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "2-digit", timeZone: "UTC",
  });
}

function mondayOf(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  const dow = d.getUTCDay();
  d.setUTCDate(d.getUTCDate() + (dow === 0 ? -6 : 1 - dow));
  return d.toISOString().slice(0, 10);
}

function SectionLabel({ label, sub }: { label: string; sub?: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-[11px] font-semibold uppercase tracking-widest text-[#4A5D75]">{label}</h3>
      {sub && <p className="text-[11px] text-[#8699AF] mt-0.5">{sub}</p>}
    </div>
  );
}

function StatusChip({ status }: { status: FeedStatus }) {
  if (status === "success")
    return <span className="flex items-center gap-1 text-[#1A6632] font-semibold"><CheckCircle2 size={11} /> Healthy</span>;
  if (status === "partial_failure")
    return <span className="flex items-center gap-1 text-[#C45A00] font-semibold"><AlertTriangle size={11} /> Degraded</span>;
  return <span className="flex items-center gap-1 text-[#E61030] font-semibold"><XCircle size={11} /> Failed</span>;
}

export default function ListFeedHealth({ filter }: ListFeedHealthProps) {

  const filteredRecords = useMemo(() => {
    if (!filter.dateRange) return LIST_FEED_DAILY;
    return LIST_FEED_DAILY.filter(
      (r) => r.date >= filter.dateRange!.start && r.date <= filter.dateRange!.end
    );
  }, [filter.dateRange]);

  // Per-feed KPI tile data
  const feedKPIs = useMemo(() => {
    return FEED_NAMES.map((name) => {
      const recs = filteredRecords.filter((r) => r.feedName === name);
      if (!recs.length) return { name, count: 0, latency: 0, uptime: 100, status: "success" as FeedStatus };
      const latest = recs[recs.length - 1];
      const successCount = recs.filter((r) => r.status === "success").length;
      const uptime = Math.round((successCount / recs.length) * 10000) / 100;
      const avgLatency = Math.round(recs.reduce((s, r) => s + r.latencyMinutes, 0) / recs.length);
      return { name, count: latest.recordCount, latency: avgLatency, uptime, status: latest.status };
    });
  }, [filteredRecords]);

  // Weekly avg latency per feed — last 26 weeks
  const weeklyLatency = useMemo(() => {
    const map: Record<string, Record<FeedName, { sum: number; n: number }>> = {};
    filteredRecords.forEach((r) => {
      const wk = mondayOf(r.date);
      if (!map[wk]) map[wk] = {} as any;
      if (!map[wk][r.feedName]) map[wk][r.feedName] = { sum: 0, n: 0 };
      map[wk][r.feedName].sum += r.latencyMinutes;
      map[wk][r.feedName].n   += 1;
    });
    return Object.keys(map).sort().slice(-26).map((wk) => {
      const row: Record<string, any> = { weekStart: wk };
      FEED_NAMES.forEach((name) => {
        const d = map[wk]?.[name];
        row[name] = d ? Math.round(d.sum / d.n) : null;
      });
      return row;
    });
  }, [filteredRecords]);

  // Weekly record count (end-of-week) per feed — last 26 weeks
  const weeklyCount = useMemo(() => {
    const map: Record<string, Record<FeedName, number>> = {};
    filteredRecords.forEach((r) => {
      const wk = mondayOf(r.date);
      if (!map[wk]) map[wk] = {} as any;
      map[wk][r.feedName] = r.recordCount;
    });
    return Object.keys(map).sort().slice(-26).map((wk) => {
      const row: Record<string, any> = { weekStart: wk };
      FEED_NAMES.forEach((name) => { row[name] = map[wk]?.[name] ?? null; });
      return row;
    });
  }, [filteredRecords]);

  // Incident log (non-success records)
  const incidents = useMemo(() =>
    filteredRecords
      .filter((r) => r.status !== "success")
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 40),
  [filteredRecords]);

  return (
    <div className="p-6 max-w-[1440px] mx-auto space-y-6 font-sans">

      {filter.viewMode === "split" && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-[#E6F0FA] border border-[#0065B3]/30 rounded-lg text-xs text-[#4A5D75]">
          <Info className="w-3.5 h-3.5 text-[#0065B3] flex-shrink-0" />
          Feed health metrics are not segmented by alert type — showing combined view.
        </div>
      )}

      {/* ── Feed Status KPI Tiles ─────────────────────────────────────────────── */}
      <div>
        <SectionLabel label="Feed Status — Current Period" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {feedKPIs.map((kpi) => {
            const color = FEED_COLORS[kpi.name as FeedName];
            return (
              <div key={kpi.name} className="bg-white rounded-lg border border-[#D0D9E8] border-l-4 p-4 shadow-sm"
                style={{ borderLeftColor: color }}>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-[#4A5D75] mb-2 leading-tight">
                  {FEED_LABELS_FULL[kpi.name as FeedName]}
                </div>
                <div className="text-[11px] mb-2">
                  <StatusChip status={kpi.status} />
                </div>
                <div className="font-['IBM_Plex_Sans_Condensed'] font-bold text-xl text-[#0A1628]">
                  {kpi.count >= 1000 ? `${(kpi.count / 1000).toFixed(0)}K` : kpi.count}
                </div>
                <div className="text-[10px] text-[#8699AF]">records</div>
                <div className="mt-2 pt-2 border-t border-[#F0F2F5] space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#4A5D75]">Uptime</span>
                    <span className="text-[11px] font-semibold"
                      style={{ color: kpi.uptime >= 99 ? "#1A6632" : kpi.uptime >= 95 ? "#C45A00" : "#E61030" }}>
                      {kpi.uptime.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#4A5D75]">Avg latency</span>
                    <span className="text-[11px] font-semibold text-[#0A1628]">{kpi.latency}m</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Latency Trend ─────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#D0D9E8] shadow-sm p-5">
        <div className="flex items-start justify-between mb-1">
          <SectionLabel
            label="Ingestion Latency — Weekly Average (Last 26 Weeks)"
            sub="Minutes from vendor publish to system ingestion · dashed red lines = known incidents"
          />
          <div className="flex flex-wrap gap-3 justify-end shrink-0 ml-4">
            {FEED_NAMES.map((name) => (
              <div key={name} className="flex items-center gap-1.5">
                <div className="w-3 h-2 rounded-sm" style={{ backgroundColor: FEED_COLORS[name] }} />
                <span className="text-[10px] text-[#4A5D75]">{FEED_LABELS[name]}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyLatency} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF2" vertical={false} />
              <XAxis dataKey="weekStart" tickFormatter={fmtWeek}
                tick={{ fill: "#8699AF", fontSize: 10 }} axisLine={false} tickLine={false} interval={3} />
              <YAxis tickFormatter={(v) => `${v}m`}
                tick={{ fill: "#8699AF", fontSize: 10 }} axisLine={false} tickLine={false} width={36} />
              <RTooltip
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <div className="bg-[#0A1628] rounded-lg px-3 py-2.5 shadow-xl border border-[#1E3A5F] text-white text-[12px]">
                      <div className="font-semibold mb-1.5 text-white/90">{fmtWeek(label)}</div>
                      {payload.map((p: any) => p.value != null && (
                        <div key={p.dataKey} className="flex items-center gap-2 mb-0.5">
                          <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: p.stroke }} />
                          <span className="text-white/60">{FEED_LABELS[p.dataKey as FeedName] ?? p.dataKey}:</span>
                          <span className="font-medium tabular-nums">{p.value}m</span>
                        </div>
                      ))}
                    </div>
                  ) : null
                }
              />
              <ReferenceLine x="2024-02-05" stroke="#E61030" strokeDasharray="4 3" strokeWidth={1.5} />
              <ReferenceLine x="2024-09-09" stroke="#E61030" strokeDasharray="4 3" strokeWidth={1.5} />
              {FEED_NAMES.map((name) => (
                <Line key={name} dataKey={name} name={FEED_LABELS[name]}
                  stroke={FEED_COLORS[name]} strokeWidth={1.5} dot={false}
                  activeDot={{ r: 3 }} connectNulls={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Record Count Trend ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#D0D9E8] shadow-sm p-5">
        <SectionLabel
          label="Record Count Trend — Last 26 Weeks"
          sub="Total active records per feed (end-of-week snapshot)"
        />
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyCount} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF2" vertical={false} />
              <XAxis dataKey="weekStart" tickFormatter={fmtWeek}
                tick={{ fill: "#8699AF", fontSize: 10 }} axisLine={false} tickLine={false} interval={3} />
              <YAxis tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)}
                tick={{ fill: "#8699AF", fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
              <RTooltip
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <div className="bg-[#0A1628] rounded-lg px-3 py-2.5 shadow-xl border border-[#1E3A5F] text-white text-[12px]">
                      <div className="font-semibold mb-1.5 text-white/90">{fmtWeek(label)}</div>
                      {payload.map((p: any) => p.value != null && (
                        <div key={p.dataKey} className="flex items-center gap-2 mb-0.5">
                          <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: p.stroke }} />
                          <span className="text-white/60">{FEED_LABELS[p.dataKey as FeedName] ?? p.dataKey}:</span>
                          <span className="font-medium tabular-nums">{Number(p.value).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  ) : null
                }
              />
              {FEED_NAMES.map((name) => (
                <Line key={name} dataKey={name} name={FEED_LABELS[name]}
                  stroke={FEED_COLORS[name]} strokeWidth={1.5} dot={false}
                  activeDot={{ r: 3 }} connectNulls />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Incident Log ──────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#D0D9E8] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#D0D9E8] bg-[#F5F7FA] flex items-center gap-2">
          <AlertTriangle size={14} className="text-[#C45A00]" />
          <span className="text-sm font-semibold text-[#0A1628]">Ingestion Incidents</span>
          <span className="ml-2 text-[11px] text-[#8699AF]">
            {incidents.length} incident records in current period
          </span>
        </div>
        {incidents.length === 0 ? (
          <div className="px-5 py-10 text-center text-xs text-[#8699AF] flex flex-col items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-[#1A6632]" />
            No incidents in selected period — all feeds healthy.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-[#F5F7FA] border-b border-[#D0D9E8]">
                <tr>
                  {["Date","Feed","Status","Latency","Records","Delta","Notes"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-[#4A5D75] whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {incidents.map((r) => (
                  <tr key={r.feedId} className="border-b border-[#F0F2F5] hover:bg-[#F5F7FA] transition-colors">
                    <td className="px-4 py-2.5 text-[#4A5D75] whitespace-nowrap">{fmtDateShort(r.date)}</td>
                    <td className="px-4 py-2.5">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold"
                        style={{
                          background: FEED_COLORS[r.feedName] + "18",
                          color: FEED_COLORS[r.feedName],
                          border: `1px solid ${FEED_COLORS[r.feedName]}50`,
                        }}>
                        {FEED_LABELS[r.feedName]}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusChip status={r.status} />
                    </td>
                    <td className="px-4 py-2.5 text-[#4A5D75] tabular-nums">{r.latencyMinutes}m</td>
                    <td className="px-4 py-2.5 text-[#4A5D75] tabular-nums">{r.recordCount.toLocaleString()}</td>
                    <td className="px-4 py-2.5 tabular-nums font-semibold"
                      style={{ color: r.deltaRecords < 0 ? "#E61030" : r.deltaRecords > 0 ? "#1A6632" : "#8699AF" }}>
                      {r.deltaRecords > 0 ? "+" : ""}{r.deltaRecords.toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-[#4A5D75] max-w-xs">
                      <span className="line-clamp-2 leading-relaxed">{r.failureNote ?? "—"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

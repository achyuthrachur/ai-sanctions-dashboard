'use client';

import { useMemo, useState } from 'react';
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { AlertCircle, CheckCircle, XCircle, MinusCircle } from 'lucide-react';
import { KPICard } from '@/components/common/KPICard';
import { SpikeAnnotation } from '@/components/common/SpikeAnnotation';
import { LIST_FEED_DAILY, LIST_FEED_SUMMARY } from '@/data/synthetic/listFeeds';
import { SPIKE_EVENTS } from '@/data/synthetic/spikes';
import type { FilterState, ListFeedRecord, FeedName } from '@/types/index';
import { TODAY } from '@/lib/utils';

const FEED_COLORS: Record<FeedName, string> = {
  OFAC_SDN:          '#0065B3',
  OFAC_CONSOLIDATED: '#004A8F',
  UN_SC:             '#C45A00',
  EU_CONSOLIDATED:   '#1A6632',
  HMT:               '#8699AF',
  ACUITY_AGGREGATED: '#E61030',
};

const FEED_SHORT: Record<FeedName, string> = {
  OFAC_SDN:          'OFAC SDN',
  OFAC_CONSOLIDATED: 'OFAC CONS',
  UN_SC:             'UN SC',
  EU_CONSOLIDATED:   'EU CONS',
  HMT:               'HMT',
  ACUITY_AGGREGATED: 'ACUITY',
};

const FEEDS: FeedName[] = [
  'OFAC_SDN', 'OFAC_CONSOLIDATED', 'UN_SC', 'EU_CONSOLIDATED', 'HMT', 'ACUITY_AGGREGATED',
];

function StatusIcon({ status }: { status: ListFeedRecord['status'] }) {
  if (status === 'success') return <CheckCircle className="w-4 h-4 text-[#1A6632]" />;
  if (status === 'partial_failure') return <MinusCircle className="w-4 h-4 text-[#C45A00]" />;
  return <XCircle className="w-4 h-4 text-[#E61030]" />;
}

interface ListFeedHealthProps {
  filter: FilterState;
}

// Fallback date range covering the full dataset when no filter is set
function getRange(filter: FilterState): { start: string; end: string } {
  if (filter.dateRange) return filter.dateRange;
  return { start: '2023-10-01', end: TODAY };
}

export default function ListFeedHealth({ filter }: ListFeedHealthProps) {
  const [logFilter, setLogFilter] = useState<'all' | 'failures'>('all');

  // Last record per feed (always from full dataset — shows current status)
  const latestByFeed = useMemo(() => {
    const result: Partial<Record<FeedName, ListFeedRecord>> = {};
    for (const rec of LIST_FEED_DAILY) {
      result[rec.feedName] = rec;
    }
    return result;
  }, []);

  // Latency chart — filtered to selected date range
  const latencyData = useMemo(() => {
    const { start, end } = getRange(filter);
    const filtered = LIST_FEED_DAILY.filter(r => r.date >= start && r.date <= end);
    const byDate: Record<string, Record<string, number | null>> = {};
    filtered.forEach(r => {
      if (!byDate[r.date]) byDate[r.date] = {};
      byDate[r.date][r.feedName] = r.status !== 'success' ? null : r.latencyMinutes;
    });
    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, feeds]) => ({ date: date.slice(5), fullDate: date, ...feeds }));
  }, [filter.dateRange]);

  // Delta tracker — filtered to date range
  const deltaData = useMemo(() => {
    const { start, end } = getRange(filter);
    const byDate: Record<string, number> = {};
    LIST_FEED_DAILY.filter(r => r.date >= start && r.date <= end).forEach(r => {
      byDate[r.date] = (byDate[r.date] ?? 0) + r.deltaRecords;
    });
    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, delta]) => ({ date: date.slice(5), fullDate: date, delta }));
  }, [filter.dateRange]);

  // Ingestion log — filtered to date range
  const logRows = useMemo(() => {
    const { start, end } = getRange(filter);
    const inRange = LIST_FEED_DAILY.filter(r => r.date >= start && r.date <= end);
    const failures = inRange.filter(r => r.status !== 'success');
    if (logFilter === 'failures') return failures.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 50);
    return [...inRange].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 100);
  }, [logFilter, filter.dateRange]);

  // Spikes in chart windows
  const spikesInLatency = useMemo(() => {
    const dates = latencyData.map(d => d.fullDate);
    return SPIKE_EVENTS.filter(s => dates.some(d => d >= s.startDate && d <= s.endDate));
  }, [latencyData]);

  const spikesInDelta = useMemo(() => {
    const dates = deltaData.map(d => d.fullDate);
    return SPIKE_EVENTS.filter(s => dates.some(d => d >= s.startDate && d <= s.endDate));
  }, [deltaData]);

  return (
    <div className="p-6 space-y-6">

      {/* Incident Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-start gap-3 rounded-xl border border-[#C45A00] bg-[#FFF3E0] px-4 py-3">
          <AlertCircle className="w-4 h-4 text-[#C45A00] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-[#C45A00] uppercase tracking-wide mb-0.5">
              SPIKE_002 — Acuity Partial Feed Failure
            </p>
            <p className="text-xs text-[#4A5D75]">
              Feb 3–17, 2024 · 15 days · ACUITY_AGGREGATED ingestion degraded to ~30% capacity.
              Contributed to 14-day alert backlog. L1 High SLA dropped to 71%.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-[#E61030] bg-[#FDEAED] px-4 py-3">
          <XCircle className="w-4 h-4 text-[#E61030] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-[#E61030] uppercase tracking-wide mb-0.5">
              Sep 9–10, 2024 — Acuity Complete Failure
            </p>
            <p className="text-xs text-[#4A5D75]">
              36-hour complete outage of ACUITY_AGGREGATED feed. Zero records ingested.
              Manual override activated. Feed restored Sep 11, 2024.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Total Feeds"
          value="6/6"
          status="green"
          subLabel="All feeds nominal today"
        />
        <KPICard
          label="ACUITY Uptime"
          value={+(LIST_FEED_SUMMARY.feedUptime.ACUITY_AGGREGATED * 100).toFixed(1)}
          unit="%"
          status="amber"
          subLabel="96.8% · 17 failure days"
        />
        <KPICard
          label="Partial Failures"
          value={LIST_FEED_SUMMARY.partialFailureDays}
          status="amber"
          subLabel="Across monitoring period"
        />
        <KPICard
          label="Complete Failures"
          value={LIST_FEED_SUMMARY.completeFailureDays}
          status="red"
          subLabel="2-day Acuity outage Sep 2024"
          escalationKey={1}
        />
      </div>

      {/* Feed Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {FEEDS.map(feed => {
          const latest = latestByFeed[feed];
          const isOk = latest?.status === 'success';
          return (
            <div
              key={feed}
              className={`rounded-xl border p-4 bg-white ${isOk ? 'border-[#D0D9E8]' : 'border-[#E61030]'}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-2 h-2 rounded-full ${isOk ? 'bg-[#1A6632]' : 'bg-[#E61030] animate-pulse'}`} />
                <span className="text-xs font-bold text-[#0A1628]">{FEED_SHORT[feed]}</span>
              </div>
              <p className="text-[11px] text-[#8699AF] mb-1">{latest?.date ?? '—'}</p>
              <p className="text-xs text-[#4A5D75]">
                {latest?.recordCount?.toLocaleString() ?? '—'} records
              </p>
              <p className={`text-[10px] font-medium mt-1 ${
                latest?.status === 'success' ? 'text-[#1A6632]' :
                latest?.status === 'partial_failure' ? 'text-[#C45A00]' :
                'text-[#E61030]'
              }`}>
                {latest?.status?.replace('_', ' ').toUpperCase() ?? '—'}
              </p>
            </div>
          );
        })}
      </div>

      {/* Ingestion Latency Chart */}
      <div className="rounded-xl border border-[#D0D9E8] bg-white p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-[#0A1628]">Ingestion Latency per Feed</h3>
          <p className="text-xs text-[#8699AF]">
            Selected period · Minutes to ingest · Gaps = failure events ·{' '}
            <span className="text-[#E61030] font-medium">SPIKE_002 Acuity gap clearly visible</span>
          </p>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={latencyData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F3F8" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#8699AF' }} tickLine={false} axisLine={false} interval={4} />
            <YAxis tick={{ fontSize: 10, fill: '#8699AF' }} tickLine={false} axisLine={false} width={36} tickFormatter={v => `${v}m`} />
            <Tooltip
              contentStyle={{ fontSize: 11, border: '1px solid #D0D9E8', borderRadius: 8 }}
              formatter={(v: unknown, name: unknown) => [v != null ? `${v}m` : 'FAILURE', FEED_SHORT[name as FeedName] ?? String(name)]}
            />
            <Legend wrapperStyle={{ fontSize: 10 }} formatter={name => FEED_SHORT[name as FeedName] ?? String(name)} />
            {spikesInLatency.map(s => (
              <SpikeAnnotation key={s.spikeId} spike={s} />
            ))}
            {FEEDS.map(feed => (
              <Line
                key={feed}
                type="monotone"
                dataKey={feed}
                stroke={FEED_COLORS[feed]}
                strokeWidth={feed === 'ACUITY_AGGREGATED' ? 2.5 : 1.5}
                dot={false}
                connectNulls={false}
                name={feed}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Delta Tracker */}
      <div className="rounded-xl border border-[#D0D9E8] bg-white p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-[#0A1628]">Entity Delta Tracker</h3>
          <p className="text-xs text-[#8699AF]">
            Entities added/removed across all feeds · Selected period ·{' '}
            <span className="text-[#0065B3] font-medium">SPIKE_003 OFAC SDN additions Jun 2024 visible</span>
          </p>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={deltaData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="deltaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0065B3" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#0065B3" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F3F8" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#8699AF' }} tickLine={false} axisLine={false} interval={8} />
            <YAxis tick={{ fontSize: 10, fill: '#8699AF' }} tickLine={false} axisLine={false} width={40} />
            <Tooltip
              contentStyle={{ fontSize: 11, border: '1px solid #D0D9E8', borderRadius: 8 }}
              formatter={(v: unknown) => [typeof v === 'number' ? v.toLocaleString() : String(v), 'Delta Records']}
            />
            {spikesInDelta.map(s => (
              <SpikeAnnotation key={s.spikeId} spike={s} />
            ))}
            <Area type="monotone" dataKey="delta" stroke="#0065B3" fill="url(#deltaGrad)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Ingestion Log Table */}
      <div className="rounded-xl border border-[#D0D9E8] bg-white overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#D0D9E8] bg-[#F5F7FA]">
          <h3 className="text-sm font-semibold text-[#0A1628]">Ingestion Log</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLogFilter('all')}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                logFilter === 'all'
                  ? 'bg-[#003571] text-white border-[#003571]'
                  : 'border-[#D0D9E8] text-[#4A5D75] hover:bg-[#F5F7FA]'
              }`}
            >
              All Records
            </button>
            <button
              onClick={() => setLogFilter('failures')}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                logFilter === 'failures'
                  ? 'bg-[#E61030] text-white border-[#E61030]'
                  : 'border-[#D0D9E8] text-[#4A5D75] hover:bg-[#F5F7FA]'
              }`}
            >
              Failures Only ({LIST_FEED_SUMMARY.partialFailureDays + LIST_FEED_SUMMARY.completeFailureDays})
            </button>
          </div>
        </div>
        <div className="overflow-x-auto max-h-80">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#D0D9E8] bg-[#F5F7FA]">
                {['Date', 'Feed', 'Status', 'Record Count', 'Delta', 'Latency', 'Error / Note'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left font-semibold text-[#4A5D75] uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logRows.map((row, i) => {
                const isAcuitySpike2 = row.feedName === 'ACUITY_AGGREGATED' && row.date >= '2024-02-03' && row.date <= '2024-02-17';
                const isAcuitySep   = row.feedName === 'ACUITY_AGGREGATED' && (row.date === '2024-09-09' || row.date === '2024-09-10');
                const rowBg = isAcuitySep ? 'bg-[#FDEAED]' : isAcuitySpike2 ? 'bg-[#FFF3E0]' : '';
                const isFailure = row.status !== 'success';

                return (
                  <tr key={i} className={`border-b border-[#F5F7FA] hover:bg-[#F5F7FA] transition-colors ${rowBg}`}>
                    <td className="px-4 py-2.5 font-mono text-[#0A1628] whitespace-nowrap">{row.date}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span className={`font-semibold ${row.feedName === 'ACUITY_AGGREGATED' && isFailure ? 'text-[#E61030]' : 'text-[#0A1628]'}`}>
                        {FEED_SHORT[row.feedName]}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <StatusIcon status={row.status} />
                        <span className={
                          row.status === 'success' ? 'text-[#1A6632]' :
                          row.status === 'partial_failure' ? 'text-[#C45A00] font-semibold' :
                          'text-[#E61030] font-bold'
                        }>
                          {row.status === 'success' ? 'OK' :
                           row.status === 'partial_failure' ? 'PARTIAL' : 'FAILURE'}
                        </span>
                        {isAcuitySpike2 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-[#FFF3E0] text-[#C45A00]">SPIKE_002</span>
                        )}
                        {isAcuitySep && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-[#FDEAED] text-[#E61030]">SEP-OUTAGE</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-[#0A1628]">{row.recordCount.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-[#0A1628]">
                      {row.deltaRecords > 1000
                        ? <span className="font-semibold text-[#0065B3]">+{row.deltaRecords.toLocaleString()}</span>
                        : `+${row.deltaRecords}`}
                    </td>
                    <td className="px-4 py-2.5 text-[#0A1628]">
                      {row.status !== 'success' ? <span className="text-[#E61030]">—</span> : `${row.latencyMinutes}m`}
                    </td>
                    <td className="px-4 py-2.5 text-[#8699AF] max-w-xs truncate">
                      {row.failureNote ?? '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

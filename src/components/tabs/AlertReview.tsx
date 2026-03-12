'use client'

// Aesthetic: Swiss / typographic — Bloomberg terminal meets enterprise audit war room
// Color strategy: BofA tokens dominant — navy #003571 headers, blue #0065B3 accents, red #E61030 breach states
// Typography: IBM Plex Sans Condensed (KPI numerics) + IBM Plex Sans (body/tables)

import { useState, useMemo, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { AlertTriangle, Shield } from 'lucide-react'

import { REL_COLOR, TRX_COLOR } from '@/lib/alertTypeHelpers'
import { DAILY_SUMMARIES, ALERT_RECORDS } from '@/data/synthetic/alerts'
import { MAKER_CHECKER_EXCEPTIONS } from '@/data/synthetic/makerChecker'
import { SPIKE_EVENTS } from '@/data/synthetic/spikes'
import { THRESHOLD_CONFIG } from '@/data/config/thresholds'
import { KPICard } from '@/components/common/KPICard'
import { DrillDownTable } from '@/components/common/DrillDownTable'
import type { FilterState, AlertRecord, DailySummary, SpikeEvent } from '@/types/index'

// ─── Types ───────────────────────────────────────────────────────────────────

type ActiveTier = 'L1' | 'L2' | 'L3'

type DrillDownCtx = {
  title: string
  rows: AlertRecord[]
} | null

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtShortDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00Z')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

function fmtPct(v: number): string {
  return (v * 100).toFixed(1) + '%'
}

function avg(arr: number[]): number {
  if (!arr.length) return 0
  return arr.reduce((s, v) => s + v, 0) / arr.length
}

function slaStatus(v: number, target: number, warning: number): 'green' | 'amber' | 'red' {
  if (v >= target) return 'green'
  if (v >= warning) return 'amber'
  return 'red'
}

/** CSS color for a heatmap cell based on SLA compliance value */
function heatColor(v: number, target: number, warning: number): string {
  if (v <= 0) return '#E8EDF2'
  if (v >= target) return '#2D9A4E'
  if (v >= warning) return '#F59E0B'
  if (v >= warning - 0.04) return '#EF6C00'
  return '#E61030'
}

/** Get threshold config for a tier + optional priority */
function getThr(tier: string, priority?: string) {
  return THRESHOLD_CONFIG.tiers.find(
    t => t.tier === tier && (!priority || t.priority === priority)
  ) ?? THRESHOLD_CONFIG.tiers.find(t => t.tier === tier)!
}

// ─── Spike label (Recharts ReferenceLine custom label) ───────────────────────

interface SpikeLabelProps {
  viewBox?: { x: number; y: number; height: number }
  spikeId: string
  onHover: (id: string | null) => void
}

function SpikeRefLabel({ viewBox, spikeId, onHover }: SpikeLabelProps) {
  if (!viewBox) return null
  return (
    <text
      x={viewBox.x}
      y={viewBox.y + 14}
      textAnchor="middle"
      fontSize={11}
      fill="#0065B3"
      fontWeight="700"
      style={{ cursor: 'pointer', userSelect: 'none' }}
      onMouseEnter={() => onHover(spikeId)}
      onMouseLeave={() => onHover(null)}
    >
      ⚡
    </text>
  )
}

// ─── Custom Recharts Tooltip ──────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="bg-[#0A1628] rounded-lg px-3 py-2.5 shadow-xl border border-[#1E3A5F] text-white"
      style={{ fontFamily: 'IBM Plex Sans, sans-serif', fontSize: 12 }}
    >
      <div className="font-semibold mb-2 text-white/90">{fmtShortDate(label)}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-0.5">
          <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: p.fill }} />
          <span className="text-white/60">{p.name}:</span>
          <span className="font-medium tabular-nums">{p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

// ─── L1 / L2 / L3 chart config ────────────────────────────────────────────────

const BAR_COLORS = {
  l1High:   '#E61030',
  l1Medium: '#F59E0B',
  l1Low:    '#0065B3',
  total:    '#0065B3',
}

// ─── SpikeInfoPanel — shown when hovering spike annotation ───────────────────

function SpikeInfoPanel({ spike }: { spike: SpikeEvent }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className="mb-3 rounded-lg border border-[#0065B3] bg-[#E6F0FA] px-4 py-3 flex gap-3 items-start"
    >
      <span className="text-lg leading-none">⚡</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[12px] font-semibold text-[#003571]">{spike.label}</span>
          <span className="text-[10px] text-[#0065B3] bg-white border border-[#0065B3] rounded px-1.5 py-0.5 font-semibold">
            {spike.spikeId}
          </span>
          <span className={`text-[10px] rounded px-1.5 py-0.5 font-semibold ${
            spike.severity === 'critical' ? 'bg-[#FDEAED] text-[#E61030]' :
            spike.severity === 'severe'   ? 'bg-[#FFF3E0] text-[#C45A00]' :
                                             'bg-[#E6F4EA] text-[#1A6632]'
          }`}>
            {spike.severity}
          </span>
        </div>
        <p className="text-[11px] text-[#003571]/80 leading-snug">{spike.rootCause}</p>
      </div>
    </motion.div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface AlertReviewProps {
  filters: FilterState
}

export default function AlertReview({ filters }: AlertReviewProps) {
  const [activeTier, setActiveTier] = useState<ActiveTier>(() => {
    if (filters.tier && filters.tier !== 'all') return filters.tier as ActiveTier
    return 'L1'
  })
  const [drillDown, setDrillDown] = useState<DrillDownCtx>(null)
  const [hoveredSpikeId, setHoveredSpikeId] = useState<string | null>(null)

  // Sync FilterBar tier pill → active tier tab
  useEffect(() => {
    if (filters.tier && filters.tier !== 'all') {
      setActiveTier(filters.tier as ActiveTier)
      setDrillDown(null)
    }
  }, [filters.tier])

  // ── Date window helpers ────────────────────────────────────────────────────

  const latestDate = DAILY_SUMMARIES[DAILY_SUMMARIES.length - 1].date // "2026-03-11"

  function daysBack(n: number): string {
    const d = new Date(latestDate + 'T00:00:00Z')
    d.setUTCDate(d.getUTCDate() - n + 1)
    return d.toISOString().slice(0, 10)
  }

  const effectiveDateRange = filters.dateRange ?? { start: daysBack(90), end: latestDate }

  // ── Filtered DAILY_SUMMARIES ───────────────────────────────────────────────

  const filteredSummaries = useMemo<DailySummary[]>(() => {
    return DAILY_SUMMARIES.filter(
      d => d.date >= effectiveDateRange.start && d.date <= effectiveDateRange.end
    )
  }, [effectiveDateRange.start, effectiveDateRange.end])

  // ── Filtered ALERT_RECORDS ────────────────────────────────────────────────

  const filteredAlerts = useMemo<AlertRecord[]>(() => {
    return ALERT_RECORDS.filter(r => {
      if (filters.lob !== 'all' && r.lob !== filters.lob) return false
      if (r.date < effectiveDateRange.start || r.date > effectiveDateRange.end) return false
      return true
    })
  }, [filters.lob, effectiveDateRange.start, effectiveDateRange.end])

  // ── KPI values: last 7-day average within window ──────────────────────────

  const kpi = useMemo(() => {
    const slice = filteredSummaries.slice(-7)
    const prior = filteredSummaries.slice(-14, -7)

    function avgField(arr: DailySummary[], field: keyof DailySummary): number {
      if (!arr.length) return 0
      return avg(arr.map(d => d[field] as number))
    }

    const curr = {
      l1H: avgField(slice, 'l1HighSlaCompliance') * 100,
      l1M: avgField(slice, 'l1MedSlaCompliance') * 100,
      l1L: avgField(slice, 'l1LowSlaCompliance') * 100,
      l2:  avgField(slice, 'l2SlaCompliance') * 100,
      l3:  avgField(slice, 'l3SlaCompliance') * 100,
    }
    const prev = {
      l1H: avgField(prior, 'l1HighSlaCompliance') * 100,
      l1M: avgField(prior, 'l1MedSlaCompliance') * 100,
      l1L: avgField(prior, 'l1LowSlaCompliance') * 100,
      l2:  avgField(prior, 'l2SlaCompliance') * 100,
      l3:  avgField(prior, 'l3SlaCompliance') * 100,
    }
    return {
      curr,
      delta: {
        l1H: curr.l1H - prev.l1H,
        l1M: curr.l1M - prev.l1M,
        l1L: curr.l1L - prev.l1L,
        l2:  curr.l2  - prev.l2,
        l3:  curr.l3  - prev.l3,
      },
    }
  }, [filteredSummaries])

  // ── Chart data: last 30 days ──────────────────────────────────────────────

  const chartData = useMemo(() => {
    return filteredSummaries.slice(-30).map(d => ({
      date: d.date,
      // L1 estimated breakdown (High ~12%, Med ~28%, Low ~60%)
      l1High:   Math.round(d.l1Count * 0.12),
      l1Medium: Math.round(d.l1Count * 0.28),
      l1Low:    d.l1Count - Math.round(d.l1Count * 0.12) - Math.round(d.l1Count * 0.28),
      l2Total:  d.l2Count,
      l3Total:  d.l3Count,
      // Split fields
      l1Rel:    d.l1CountRel,
      l1Trx:    d.l1CountTrx,
      l2Rel:    d.l2CountRel,
      l2Trx:    d.l2CountTrx,
      l3Rel:    d.l3CountRel,
      l3Trx:    d.l3CountTrx,
      spikeFlag: d.spikeFlag,
      spikeId: d.spikeId,
    }))
  }, [filteredSummaries])

  // ── Heatmap data: last 90 days ────────────────────────────────────────────

  const heatmapData = useMemo(() => {
    return filteredSummaries.slice(-90).map(d => ({
      date: d.date,
      value: activeTier === 'L1' ? d.l1HighSlaCompliance
           : activeTier === 'L2' ? d.l2SlaCompliance
           : d.l3SlaCompliance,
      spikeFlag: d.spikeFlag,
      spikeId: d.spikeId,
    }))
  }, [filteredSummaries, activeTier])

  // First cell day-of-week for heatmap padding (Mon=0)
  const heatmapPadding = useMemo(() => {
    if (!heatmapData.length) return 0
    const dow = new Date(heatmapData[0].date + 'T00:00:00Z').getUTCDay() // 0=Sun
    return (dow + 6) % 7 // shift so Mon=0
  }, [heatmapData])

  // ── Spike events within chart window ─────────────────────────────────────

  const chartDates = useMemo(() => new Set(chartData.map(d => d.date)), [chartData])
  const chartSpikes = useMemo(
    () => SPIKE_EVENTS.filter(s => chartDates.has(s.startDate)),
    [chartDates]
  )

  // ── Hover spike for annotation popover ───────────────────────────────────

  const hoveredSpike = useMemo(
    () => SPIKE_EVENTS.find(s => s.spikeId === hoveredSpikeId) ?? null,
    [hoveredSpikeId]
  )

  // ── Drill-down handlers ───────────────────────────────────────────────────

  const handleBarClick = useCallback((data: any) => {
    const date: string = data?.activeLabel
    if (!date) return
    const rows = filteredAlerts.filter(r => r.date === date && r.tier === activeTier)
    setDrillDown({
      title: `${activeTier} Alert Records — ${fmtShortDate(date)}`,
      rows: rows.length ? rows : filteredAlerts.filter(r => r.tier === activeTier).slice(0, 10),
    })
  }, [filteredAlerts, activeTier])

  const handleHeatmapClick = useCallback((date: string, value: number) => {
    const rows = filteredAlerts.filter(r => r.date === date && r.tier === activeTier)
    const thrKey = activeTier === 'L1' ? getThr('L1', 'High') : getThr(activeTier)
    const status = slaStatus(value, thrKey.targetCompliance, thrKey.warningThreshold)
    setDrillDown({
      title: `${activeTier} SLA Drill-Down — ${fmtShortDate(date)} (${fmtPct(value)})`,
      rows: rows.length ? rows : filteredAlerts.filter(r => r.tier === activeTier).slice(0, 10),
    })
  }, [filteredAlerts, activeTier])

  // ── Thresholds for current tier ───────────────────────────────────────────

  const thrL1H = getThr('L1', 'High')
  const thrL1M = getThr('L1', 'Medium')
  const thrL1L = getThr('L1', 'Low')
  const thrL2  = getThr('L2')
  const thrL3  = getThr('L3')

  // Escalation protocols
  const l1SLAEsc = {
    action: 'Notify Analyst Lead within 1 hour. Escalate to Audit Director if unresolved in 4 hours.',
    contacts: ['Analyst Lead — sanctions-lead@bofa.com', 'Audit Director — jason.cahaly@bofa.com'],
  }
  const mcEsc = {
    action: 'Immediate escalation to Audit Director and IT Security. Document in ATM. Remediate entitlement within 24 hours.',
    contacts: ['Audit Director', 'GES Technology — IT Security'],
  }

  // ── Tier tab pill rendering ───────────────────────────────────────────────

  function TierTabBar() {
    return (
      <div className="flex items-center gap-1 p-1 bg-[#F0F4F9] rounded-lg w-fit mb-6">
        {(['L1', 'L2', 'L3'] as ActiveTier[]).map(tier => (
          <button
            key={tier}
            onClick={() => { setActiveTier(tier); setDrillDown(null) }}
            className={`
              relative px-5 py-1.5 rounded-md text-sm font-semibold transition-all
              ${activeTier === tier
                ? 'bg-white text-[#003571] shadow-sm'
                : 'text-[#4A5D75] hover:text-[#003571]'}
            `}
          >
            {tier}
            {activeTier === tier && (
              <motion.div
                layoutId="tier-indicator"
                className="absolute inset-0 bg-white rounded-md -z-10 shadow-sm"
              />
            )}
          </button>
        ))}
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 font-sans">

      {/* ── Sub-nav ────────────────────────────────────────────────────────── */}
      <TierTabBar />

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTier}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="space-y-6"
        >

          {/* ── Section 1 — SLA KPI Cards ──────────────────────────────────── */}
          <div>
            <SectionLabel label="SLA Compliance — 7-Day Average" />
            <div className={`grid gap-4 ${activeTier === 'L1' ? 'grid-cols-3' : 'grid-cols-2'}`}>
              {activeTier === 'L1' && (
                <>
                  <KPICard
                    label="L1 High Priority"
                    value={kpi.curr.l1H}
                    unit="%"
                    delta={kpi.delta.l1H}
                    status={slaStatus(kpi.curr.l1H / 100, thrL1H.targetCompliance, thrL1H.warningThreshold)}
                    subLabel={`Target ${fmtPct(thrL1H.targetCompliance)} · SLA ${thrL1H.slaHours}h`}
                  />
                  <KPICard
                    label="L1 Medium Priority"
                    value={kpi.curr.l1M}
                    unit="%"
                    delta={kpi.delta.l1M}
                    status={slaStatus(kpi.curr.l1M / 100, thrL1M.targetCompliance, thrL1M.warningThreshold)}
                    subLabel={`Target ${fmtPct(thrL1M.targetCompliance)} · SLA ${thrL1M.slaHours}h`}
                  />
                  <KPICard
                    label="L1 Low Priority"
                    value={kpi.curr.l1L}
                    unit="%"
                    delta={kpi.delta.l1L}
                    status={slaStatus(kpi.curr.l1L / 100, thrL1L.targetCompliance, thrL1L.warningThreshold)}
                    subLabel={`Target ${fmtPct(thrL1L.targetCompliance)} · SLA ${thrL1L.slaHours}h`}
                  />
                </>
              )}
              {activeTier === 'L2' && (
                <>
                  <KPICard
                    label="L2 SLA Compliance"
                    value={kpi.curr.l2}
                    unit="%"
                    delta={kpi.delta.l2}
                    status={slaStatus(kpi.curr.l2 / 100, thrL2.targetCompliance, thrL2.warningThreshold)}
                    subLabel={`Target ${fmtPct(thrL2.targetCompliance)} · SLA ${thrL2.slaHours}h`}
                  />
                  <KPICard
                    label="L2 Alerts (7-day avg)"
                    value={Math.round(avg(filteredSummaries.slice(-7).map(d => d.l2Count)))}
                    status="neutral"
                    subLabel="Daily avg — last 7 days"
                  />
                </>
              )}
              {activeTier === 'L3' && (
                <>
                  <KPICard
                    label="L3 SLA Compliance"
                    value={kpi.curr.l3}
                    unit="%"
                    delta={kpi.delta.l3}
                    status={slaStatus(kpi.curr.l3 / 100, thrL3.targetCompliance, thrL3.warningThreshold)}
                    subLabel={`Target ${fmtPct(thrL3.targetCompliance)} · SLA ${thrL3.slaHours}h`}
                  />
                  <KPICard
                    label="L3 Alerts (7-day avg)"
                    value={Math.round(avg(filteredSummaries.slice(-7).map(d => d.l3Count)))}
                    status="neutral"
                    subLabel="Daily avg — last 7 days"
                  />
                </>
              )}
            </div>
          </div>

          {/* ── Section 2 — Daily Alert Volume Chart ────────────────────────── */}
          <div className="bg-white rounded-xl border border-[#D0D9E8] shadow-sm p-5">
            <div className="flex items-center justify-between mb-1">
              <SectionLabel label={`${activeTier} Daily Alert Volume — Last 30 Days`} noMargin />
              <span className="text-[11px] text-[#8699AF]">Click a bar to drill down</span>
            </div>

            {/* Spike annotation popover */}
            <AnimatePresence>
              {hoveredSpike && <SpikeInfoPanel spike={hoveredSpike} />}
            </AnimatePresence>

            <div className="h-56 mt-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                  onClick={handleBarClick}
                  style={{ cursor: 'pointer' }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF2" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={fmtShortDate}
                    tick={{ fill: '#8699AF', fontSize: 10, fontFamily: 'IBM Plex Sans' }}
                    axisLine={false}
                    tickLine={false}
                    interval={4}
                  />
                  <YAxis
                    tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)}
                    tick={{ fill: '#8699AF', fontSize: 10, fontFamily: 'IBM Plex Sans' }}
                    axisLine={false}
                    tickLine={false}
                    width={36}
                  />
                  <RTooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(0,101,179,0.06)' }} />

                  {/* Spike reference lines */}
                  {chartSpikes.map(spike => (
                    <ReferenceLine
                      key={spike.spikeId}
                      x={spike.startDate}
                      stroke="#0065B3"
                      strokeDasharray="4 3"
                      strokeWidth={1.5}
                      label={
                        <SpikeRefLabel
                          spikeId={spike.spikeId}
                          onHover={setHoveredSpikeId}
                        />
                      }
                    />
                  ))}

                  {/* L1: stacked High/Med/Low (combined) or Rel/Trx pairs (split) */}
                  {activeTier === 'L1' && filters.viewMode !== 'split' && (
                    <>
                      <Bar dataKey="l1High"   name="High"   stackId="a" fill={BAR_COLORS.l1High}   radius={[0,0,0,0]} maxBarSize={20} />
                      <Bar dataKey="l1Medium" name="Medium" stackId="a" fill={BAR_COLORS.l1Medium} radius={[0,0,0,0]} maxBarSize={20} />
                      <Bar dataKey="l1Low"    name="Low"    stackId="a" fill={BAR_COLORS.l1Low}    radius={[2,2,0,0]} maxBarSize={20} />
                    </>
                  )}
                  {activeTier === 'L1' && filters.viewMode === 'split' && (
                    <>
                      <Bar dataKey="l1Rel" name="L1 Relationship" stackId="l1" fill={REL_COLOR} radius={[0,0,0,0]} maxBarSize={20} />
                      <Bar dataKey="l1Trx" name="L1 Transaction"  stackId="l1" fill={TRX_COLOR} radius={[2,2,0,0]} maxBarSize={20} />
                    </>
                  )}
                  {/* L2 */}
                  {activeTier === 'L2' && filters.viewMode !== 'split' && (
                    <Bar dataKey="l2Total" name="L2 Alerts" fill={BAR_COLORS.total} radius={[2,2,0,0]} maxBarSize={20} />
                  )}
                  {activeTier === 'L2' && filters.viewMode === 'split' && (
                    <>
                      <Bar dataKey="l2Rel" name="L2 Relationship" stackId="l2" fill={REL_COLOR} radius={[0,0,0,0]} maxBarSize={20} />
                      <Bar dataKey="l2Trx" name="L2 Transaction"  stackId="l2" fill={TRX_COLOR} radius={[2,2,0,0]} maxBarSize={20} />
                    </>
                  )}
                  {/* L3 */}
                  {activeTier === 'L3' && filters.viewMode !== 'split' && (
                    <Bar dataKey="l3Total" name="L3 Alerts" fill={BAR_COLORS.total} radius={[2,2,0,0]} maxBarSize={20} />
                  )}
                  {activeTier === 'L3' && filters.viewMode === 'split' && (
                    <>
                      <Bar dataKey="l3Rel" name="L3 Relationship" stackId="l3" fill={REL_COLOR} radius={[0,0,0,0]} maxBarSize={20} />
                      <Bar dataKey="l3Trx" name="L3 Transaction"  stackId="l3" fill={TRX_COLOR} radius={[2,2,0,0]} maxBarSize={20} />
                    </>
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Chart legend */}
            {filters.viewMode === 'split' ? (
              <div className="flex items-center gap-4 mt-2 justify-center">
                {[['Relationship', REL_COLOR], ['Transaction', TRX_COLOR]].map(([name, color]) => (
                  <div key={name} className="flex items-center gap-1.5">
                    <div className="w-3 h-2 rounded-sm" style={{ backgroundColor: color }} />
                    <span className="text-[11px] text-[#4A5D75]">{name}</span>
                  </div>
                ))}
              </div>
            ) : activeTier === 'L1' && (
              <div className="flex items-center gap-4 mt-2 justify-center">
                {[['High', BAR_COLORS.l1High], ['Medium', BAR_COLORS.l1Medium], ['Low', BAR_COLORS.l1Low]].map(([name, color]) => (
                  <div key={name} className="flex items-center gap-1.5">
                    <div className="w-3 h-2 rounded-sm" style={{ backgroundColor: color }} />
                    <span className="text-[11px] text-[#4A5D75]">{name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Section 3 — SLA Heatmap ─────────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-[#D0D9E8] shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <SectionLabel
                label={`${activeTier} SLA Compliance Heatmap — Last 90 Days`}
                noMargin
              />
              <div className="flex items-center gap-3">
                <HeatLegend
                  target={activeTier === 'L1' ? thrL1H.targetCompliance
                        : activeTier === 'L2' ? thrL2.targetCompliance
                        : thrL3.targetCompliance}
                  warning={activeTier === 'L1' ? thrL1H.warningThreshold
                         : activeTier === 'L2' ? thrL2.warningThreshold
                         : thrL3.warningThreshold}
                />
                <span className="text-[11px] text-[#8699AF]">Click cell to drill down</span>
              </div>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-1 pl-0">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                <div key={i} className="text-center text-[10px] text-[#8699AF] font-medium">{d}</div>
              ))}
            </div>

            {/* Heatmap grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Padding for first week */}
              {Array.from({ length: heatmapPadding }).map((_, i) => (
                <div key={`pad-${i}`} className="aspect-square" />
              ))}
              {heatmapData.map(cell => {
                const thr = activeTier === 'L1' ? thrL1H
                          : activeTier === 'L2' ? thrL2
                          : thrL3
                const color = heatColor(cell.value, thr.targetCompliance, thr.warningThreshold)
                return (
                  <button
                    key={cell.date}
                    title={`${cell.date}: ${fmtPct(cell.value)}${cell.spikeFlag ? ' ⚡ ' + cell.spikeId : ''}`}
                    onClick={() => handleHeatmapClick(cell.date, cell.value)}
                    className="aspect-square rounded-sm transition-transform hover:scale-110 hover:ring-2 hover:ring-[#0065B3] hover:ring-offset-1 focus:outline-none"
                    style={{ backgroundColor: color }}
                  />
                )
              })}
            </div>

            <div className="mt-3 flex items-center gap-2 flex-wrap">
              {heatmapData.some(d => d.spikeFlag) && (
                <p className="text-[10px] text-[#8699AF]">
                  ⚡ Cells with spike events marked in chart above
                </p>
              )}
              {filters.viewMode === 'split' && (
                <p className="text-[10px] text-[#8699AF]">
                  SLA data shown combined — not yet split by alert type.
                </p>
              )}
            </div>
          </div>

          {/* ── Section 4 — Maker-Checker Integrity (L1 only) ───────────────── */}
          {activeTier === 'L1' && (
            <MakerCheckerPanel escalationProtocol={mcEsc} />
          )}

          {/* ── Drill-Down Table ─────────────────────────────────────────────── */}
          <AnimatePresence>
            {drillDown && (
              <DrillDownTable
                title={drillDown.title}
                rows={drillDown.rows}
                onClose={() => setDrillDown(null)}
              />
            )}
          </AnimatePresence>

        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// ─── SectionLabel ─────────────────────────────────────────────────────────────

function SectionLabel({ label, noMargin }: { label: string; noMargin?: boolean }) {
  return (
    <h3 className={`text-[11px] font-semibold uppercase tracking-widest text-[#4A5D75] ${noMargin ? '' : 'mb-3'}`}>
      {label}
    </h3>
  )
}

// ─── HeatLegend ───────────────────────────────────────────────────────────────

function HeatLegend({ target, warning }: { target: number; warning: number }) {
  return (
    <div className="flex items-center gap-3">
      {[
        { color: '#2D9A4E', label: `≥ ${fmtPct(target)}` },
        { color: '#F59E0B', label: `≥ ${fmtPct(warning)}` },
        { color: '#E61030', label: 'Breach' },
      ].map(({ color, label }) => (
        <div key={label} className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
          <span className="text-[10px] text-[#4A5D75]">{label}</span>
        </div>
      ))}
    </div>
  )
}

// ─── MakerCheckerPanel ────────────────────────────────────────────────────────

interface MakerCheckerPanelProps {
  escalationProtocol: { action: string; contacts: string[] }
}

function MakerCheckerPanel({ escalationProtocol }: MakerCheckerPanelProps) {
  const exceptions = MAKER_CHECKER_EXCEPTIONS
  const hasExceptions = exceptions.length > 0

  const EX_TYPE_LABEL: Record<string, string> = {
    implementation_gap:       'Implementation Gap',
    entitlement_provisioning: 'Entitlement Provisioning',
    workflow_bypass:          'Workflow Bypass',
    other:                    'Other',
  }

  return (
    <div className="bg-white rounded-xl border border-[#D0D9E8] shadow-sm overflow-hidden">
      {/* Panel header */}
      <div className={`px-5 py-4 border-b border-[#D0D9E8] flex items-center justify-between ${hasExceptions ? 'bg-[#FDEAED]' : 'bg-[#E6F4EA]'}`}>
        <div className="flex items-center gap-2.5">
          {hasExceptions
            ? <AlertTriangle size={16} className="text-[#E61030]" />
            : <Shield size={16} className="text-[#1A6632]" />}
          <span className={`text-[13px] font-semibold ${hasExceptions ? 'text-[#E61030]' : 'text-[#1A6632]'}`}>
            Maker-Checker Integrity
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-baseline gap-1">
            <span className={`font-condensed font-bold text-2xl ${hasExceptions ? 'text-[#E61030]' : 'text-[#1A6632]'}`}>
              99.8
            </span>
            <span className="text-sm font-medium text-[#4A5D75]">%</span>
          </div>
          <span className="text-[11px] text-[#4A5D75]">compliance rate</span>
          {hasExceptions && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#E61030] bg-[#FDEAED] border border-[#E61030] rounded px-2 py-0.5">
              <AlertTriangle size={10} /> {exceptions.length} exceptions
            </span>
          )}
        </div>
      </div>

      {/* Exceptions summary strip */}
      {hasExceptions && (
        <div className="px-5 py-2.5 bg-[#FFF3E0] border-b border-[#D0D9E8] flex items-center gap-2">
          <AlertTriangle size={13} className="text-[#C45A00] flex-shrink-0" />
          <p className="text-[11px] text-[#C45A00] font-medium">
            {exceptions.length} exception{exceptions.length !== 1 ? 's' : ''} logged across monitoring period.
            All remediated. Escalation required per protocol.
          </p>
        </div>
      )}

      {/* Exceptions table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-sans">
          <thead className="bg-[#F5F7FA] border-b border-[#D0D9E8]">
            <tr>
              {['Exception ID', 'Date', 'Maker ID', 'Checker ID', 'Exception Type', 'Remediation', 'Related Spike', 'LOB', 'Notes'].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-[#4A5D75] whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {exceptions.map((ex, i) => (
              <motion.tr
                key={ex.exceptionId}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.2 }}
                className="border-b border-[#F0F2F5] hover:bg-[#FFF8F8] transition-colors"
              >
                <td className="px-4 py-3 font-mono text-[#E61030] font-semibold">{ex.exceptionId}</td>
                <td className="px-4 py-3 text-[#4A5D75] whitespace-nowrap">{ex.date}</td>
                <td className="px-4 py-3 font-mono text-[#0A1628]">{ex.makerId}</td>
                <td className="px-4 py-3 font-mono text-[#0A1628]">
                  {ex.checkerId ?? <span className="text-[#E61030] font-medium">— same person</span>}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-[#FFF3E0] text-[#C45A00] border border-[#C45A00]">
                    {EX_TYPE_LABEL[ex.exceptionType] ?? ex.exceptionType}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-[#1A6632] font-medium">{ex.remediationDate}</span>
                  <span className="text-[#8699AF] ml-1">({ex.remediationDays}d)</span>
                </td>
                <td className="px-4 py-3">
                  {ex.relatedSpikeId
                    ? <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#E6F0FA] text-[#0065B3] border border-[#0065B3]">{ex.relatedSpikeId}</span>
                    : <span className="text-[#8699AF]">—</span>
                  }
                </td>
                <td className="px-4 py-3 text-[#4A5D75]">{ex.lob}</td>
                <td className="px-4 py-3 text-[#4A5D75] max-w-[280px]">
                  <p className="truncate" title={ex.description}>{ex.description}</p>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

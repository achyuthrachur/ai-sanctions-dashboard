'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Download, ChevronUp, ChevronDown } from 'lucide-react'
import type { AlertRecord } from '@/types/index'

interface DrillDownTableProps {
  title: string
  rows: AlertRecord[]
  onClose: () => void
}

type SortKey = keyof AlertRecord
type SortDir = 'asc' | 'desc'

const DISPOSITION_BADGE: Record<string, string> = {
  true_match:    'bg-[#FDEAED] text-[#E61030] border-[#E61030]',
  false_positive:'bg-[#E6F4EA] text-[#1A6632] border-[#1A6632]',
  escalated:     'bg-[#FFF3E0] text-[#C45A00] border-[#C45A00]',
  auto_cleared:  'bg-[#E6F0FA] text-[#0065B3] border-[#0065B3]',
  pending:       'bg-[#F5F7FA] text-[#4A5D75] border-[#D0D9E8]',
}

const PRIORITY_BADGE: Record<string, string> = {
  High:   'bg-[#FDEAED] text-[#E61030] border-[#E61030]',
  Medium: 'bg-[#FFF3E0] text-[#C45A00] border-[#C45A00]',
  Low:    'bg-[#F5F7FA] text-[#4A5D75] border-[#D0D9E8]',
}

const SLA_STYLE: Record<string, string> = {
  met:      'text-[#1A6632]',
  breached: 'text-[#E61030] font-semibold',
  pending:  'text-[#C45A00]',
}

const COLUMNS: { key: SortKey; label: string; className?: string }[] = [
  { key: 'alertId',      label: 'Alert ID',     className: 'w-24' },
  { key: 'date',         label: 'Date',         className: 'w-24' },
  { key: 'alertType',    label: 'Type',         className: 'w-32' },
  { key: 'priority',     label: 'Priority',     className: 'w-20' },
  { key: 'tier',         label: 'Tier',         className: 'w-14' },
  { key: 'originator',   label: 'Originator',   className: 'max-w-[140px]' },
  { key: 'hoursToReview',label: 'Hours',        className: 'w-16' },
  { key: 'slaStatus',    label: 'SLA',          className: 'w-24' },
  { key: 'disposition',  label: 'Disposition',  className: 'w-28' },
  { key: 'lob',          label: 'LOB',          className: 'w-16' },
]

function exportCSV(rows: AlertRecord[], title: string) {
  const headers = COLUMNS.map(c => c.label)
  const lines = [
    headers.join(','),
    ...rows.map(r => [
      r.alertId, r.date, `"${r.alertType}"`, r.priority, r.tier,
      `"${r.originator}"`, r.hoursToReview, r.slaStatus,
      r.disposition.replace(/_/g, ' '), r.lob,
    ].join(',')),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `${title.replace(/[^a-z0-9]/gi, '_')}.csv`; a.click()
  URL.revokeObjectURL(url)
}

const rowVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.018, duration: 0.2 } }),
}

export function DrillDownTable({ title, rows, onClose }: DrillDownTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const sorted = [...rows].sort((a, b) => {
    const av = String(a[sortKey] ?? '')
    const bv = String(b[sortKey] ?? '')
    return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
  })

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ type: 'spring', damping: 26, stiffness: 320 }}
      className="mt-5 bg-white rounded-xl border border-[#D0D9E8] shadow-lg overflow-hidden"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#D0D9E8] bg-[#F5F7FA]">
        <div className="flex items-center gap-3">
          <span className="text-[13px] font-semibold text-[#0A1628]">{title}</span>
          <span className="text-[11px] text-[#8699AF] bg-[#E8EDF2] rounded px-2 py-0.5">
            {rows.length} records
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportCSV(rows, title)}
            className="flex items-center gap-1.5 text-xs text-[#0065B3] border border-[#0065B3] rounded px-2.5 py-1 hover:bg-[#E6F0FA] transition-colors"
          >
            <Download size={11} /> Export CSV
          </button>
          <button onClick={onClose} className="text-[#8699AF] hover:text-[#0A1628] transition-colors p-0.5">
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-h-64 overflow-y-auto">
        <table className="w-full text-xs font-sans">
          <thead className="sticky top-0 bg-[#F5F7FA] border-b border-[#D0D9E8] z-10">
            <tr>
              {COLUMNS.map(col => (
                <th
                  key={col.key}
                  className={`px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-[#4A5D75] cursor-pointer hover:text-[#0065B3] whitespace-nowrap select-none ${col.className ?? ''}`}
                  onClick={() => toggleSort(col.key)}
                >
                  <span className="flex items-center gap-1">
                    {col.label}
                    {sortKey === col.key
                      ? (sortDir === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />)
                      : <ChevronDown size={10} className="opacity-30" />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length} className="px-5 py-8 text-center text-[#8699AF] text-xs">
                  No records match the current filter criteria
                </td>
              </tr>
            )}
            {sorted.map((r, i) => (
              <motion.tr
                key={r.alertId}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={rowVariants}
                className="border-b border-[#F0F2F5] hover:bg-[#F8FAFC] transition-colors"
              >
                <td className="px-3 py-2 font-mono text-[#0065B3] font-medium whitespace-nowrap">{r.alertId}</td>
                <td className="px-3 py-2 text-[#4A5D75] whitespace-nowrap">{r.date}</td>
                <td className="px-3 py-2 text-[#0A1628] whitespace-nowrap">{r.alertType}</td>
                <td className="px-3 py-2">
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold border ${PRIORITY_BADGE[r.priority] ?? ''}`}>
                    {r.priority}
                  </span>
                </td>
                <td className="px-3 py-2 font-medium text-[#0A1628]">{r.tier}</td>
                <td className="px-3 py-2 text-[#0A1628] max-w-[140px] truncate" title={r.originator}>
                  {r.originator}
                </td>
                <td className="px-3 py-2 text-right text-[#0A1628] tabular-nums">{r.hoursToReview}h</td>
                <td className={`px-3 py-2 whitespace-nowrap ${SLA_STYLE[r.slaStatus] ?? ''}`}>
                  {r.slaStatus === 'met' ? '✓ Met' : r.slaStatus === 'breached' ? '⚠ Breach' : '— Pending'}
                </td>
                <td className="px-3 py-2">
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium border ${DISPOSITION_BADGE[r.disposition] ?? ''}`}>
                    {r.disposition.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-3 py-2 text-[#4A5D75]">{r.lob}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}

"use client";
import { RotateCcw } from "lucide-react";
import type { FilterState } from "@/types/index";
import { TODAY } from "@/lib/utils";

interface FilterBarProps {
  filter: FilterState;
  onChange: (f: FilterState) => void;
}

const DATE_PRESETS = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
  { label: "All", days: 0 },
];

const LOB_OPTIONS = ["all", "GCIB", "GCB", "GES", "Other"] as const;
const TIER_OPTIONS = ["all", "L1", "L2", "L3"] as const;

const DEFAULT_FILTER: FilterState = {
  dateRange: null,
  tier: "all",
  priority: "all",
  slaStatus: "all",
  lob: "all",
  disposition: "all",
  viewMode: "split",
};

function getActiveDays(filter: FilterState): number {
  if (!filter.dateRange) return 0;
  const { start, end } = filter.dateRange;
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000);
}

function applyPreset(days: number): FilterState["dateRange"] {
  if (days === 0) return null;
  const end = TODAY;
  const d = new Date(TODAY + "T00:00:00Z");
  d.setDate(d.getDate() - days);
  return { start: d.toISOString().slice(0, 10), end };
}

export function FilterBar({ filter, onChange }: FilterBarProps) {
  const activeDays = getActiveDays(filter);
  const isDirty = filter.dateRange !== null || filter.lob !== "all" || filter.tier !== "all";

  function setPreset(days: number) {
    onChange({ ...filter, dateRange: applyPreset(days) });
  }

  return (
    <div className="bg-white border-b border-[#D0D9E8] px-6 py-2.5 flex items-center gap-4 flex-wrap shrink-0 z-20 shadow-sm">
      {/* Date presets */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-[#8699AF] font-medium mr-1">Period:</span>
        {DATE_PRESETS.map((p) => {
          const isActive =
            p.days === 0
              ? filter.dateRange === null
              : activeDays === p.days;
          return (
            <button
              key={p.label}
              onClick={() => setPreset(p.days)}
              className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                isActive
                  ? "bg-[#0065B3] text-white"
                  : "bg-[#F5F7FA] text-[#4A5D75] hover:bg-[#E6F0FA] hover:text-[#0065B3]"
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      <div className="w-px h-5 bg-[#D0D9E8]" />

      {/* LOB */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-[#8699AF] font-medium mr-1">LOB:</span>
        {LOB_OPTIONS.map((lob) => (
          <button
            key={lob}
            onClick={() => onChange({ ...filter, lob })}
            className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
              filter.lob === lob
                ? "bg-[#0065B3] text-white"
                : "bg-[#F5F7FA] text-[#4A5D75] hover:bg-[#E6F0FA] hover:text-[#0065B3]"
            }`}
          >
            {lob === "all" ? "All" : lob}
          </button>
        ))}
      </div>

      <div className="w-px h-5 bg-[#D0D9E8]" />

      {/* View Mode Toggle */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-[#8699AF] font-medium mr-1">View:</span>
        <div
          className="flex items-center rounded-lg border border-[#D0D9E8] overflow-hidden"
          role="group"
          aria-label="View mode"
        >
          <button
            onClick={() => onChange({ ...filter, viewMode: 'split' })}
            aria-pressed={filter.viewMode === 'split'}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              filter.viewMode === 'split'
                ? 'bg-[#003571] text-white'
                : 'bg-white text-[#4A5D75] hover:bg-[#E6F0FA]'
            }`}
          >
            Split
          </button>
          <div className="w-px h-4 bg-[#D0D9E8]" aria-hidden="true" />
          <button
            onClick={() => onChange({ ...filter, viewMode: 'combined' })}
            aria-pressed={filter.viewMode === 'combined'}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              filter.viewMode === 'combined'
                ? 'bg-[#003571] text-white'
                : 'bg-white text-[#4A5D75] hover:bg-[#E6F0FA]'
            }`}
          >
            Combine
          </button>
        </div>
      </div>

      <div className="w-px h-5 bg-[#D0D9E8]" />

      {/* Tier */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-[#8699AF] font-medium mr-1">Tier:</span>
        {TIER_OPTIONS.map((tier) => (
          <button
            key={tier}
            onClick={() => onChange({ ...filter, tier: tier as FilterState["tier"] })}
            className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
              filter.tier === tier
                ? "bg-[#0065B3] text-white"
                : "bg-[#F5F7FA] text-[#4A5D75] hover:bg-[#E6F0FA] hover:text-[#0065B3]"
            }`}
          >
            {tier === "all" ? "All" : tier}
          </button>
        ))}
      </div>

      <div className="w-px h-5 bg-[#D0D9E8]" />

      {/* Reset — only shown when filters are active */}
      {isDirty && (
        <button
          onClick={() => onChange(DEFAULT_FILTER)}
          className="flex items-center gap-1.5 text-xs text-[#4A5D75] hover:text-[#0065B3] transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </button>
      )}
    </div>
  );
}

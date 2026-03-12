"use client";
import { Info } from "lucide-react";
import type { FilterState } from "@/types/index";

interface ListFeedHealthProps {
  filter: FilterState;
}

export default function ListFeedHealth({ filter }: ListFeedHealthProps) {
  return (
    <div className="p-6 max-w-[1440px] mx-auto space-y-4">
      {filter.viewMode === 'split' && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-[#E6F0FA] border border-[#0065B3]/30 rounded-lg text-xs text-[#4A5D75]">
          <Info className="w-3.5 h-3.5 text-[#0065B3] flex-shrink-0" />
          Feed health metrics are not segmented by alert type — showing combined view.
        </div>
      )}
      <div className="rounded-xl border border-[#D0D9E8] bg-white p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
        <p className="text-sm font-semibold text-[#0A1628] mb-1">List &amp; Feed Health</p>
        <p className="text-xs text-[#8699AF]">
          Phase 4 — Feed latency charts, ingestion log, and spike annotation overlays coming in later phases.
        </p>
      </div>
    </div>
  );
}

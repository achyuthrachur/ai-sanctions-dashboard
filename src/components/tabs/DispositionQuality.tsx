"use client";
import type { FilterState } from "@/types/index";

interface DispositionQualityProps {
  filter: FilterState;
}

export default function DispositionQuality({ filter: _filter }: DispositionQualityProps) {
  return (
    <div className="p-6 max-w-[1440px] mx-auto">
      <div className="rounded-xl border border-[#D0D9E8] bg-white p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
        <p className="text-sm font-semibold text-[#0A1628] mb-1">Disposition Quality</p>
        <p className="text-xs text-[#8699AF]">
          Phase 4 — QA setback analysis, true match rate trends, and disposition quality charts coming in later phases.
        </p>
      </div>
    </div>
  );
}

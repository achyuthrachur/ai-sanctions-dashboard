"use client";
import type { FilterState } from "@/types/index";
import { AIInsightBanner } from "@/components/common/AIInsightBanner";
import { KPICard } from "@/components/common/KPICard";

interface ExecutiveSummaryProps {
  filter: FilterState;
}

const SYNTHETIC_INSIGHT =
  "SLA compliance for L1 High-priority alerts has remained above the 95% target for 18 consecutive days following the resolution of the Acuity vendor backlog in February 2024. " +
  "22 Type A Reapply transactions remain in active_risk status with cumulative estimated exposure of $4.1M — the Volga Meridian corridor (RPY-A-001) accounts for $617K and is the highest-priority remediation item this quarter.";

export default function ExecutiveSummary({ filter: _filter }: ExecutiveSummaryProps) {
  return (
    <div className="p-6 space-y-6 max-w-[1440px] mx-auto">
      {/* AI Insight Banner */}
      <AIInsightBanner insight={SYNTHETIC_INSIGHT} mode="prototype" />

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          label="L1 High SLA Compliance"
          value={96.2}
          unit="%"
          delta={1.4}
          deltaLabel="vs prior 7d"
          status="green"
          trend={[94, 95, 93, 96, 97, 96, 96.2]}
        />
        <KPICard
          label="Active Type A Reapply"
          value={22}
          unit="records"
          status="red"
          escalationKey={2}
          trend={[18, 19, 20, 20, 21, 22, 22]}
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

      {/* Tab placeholder */}
      <div className="rounded-xl border border-[#D0D9E8] bg-white p-12 flex flex-col items-center justify-center text-center">
        <p className="text-sm font-semibold text-[#0A1628] mb-1">Executive Summary</p>
        <p className="text-xs text-[#8699AF]">
          Phase 2 — Chart content and cross-filtering coming in later phases.
        </p>
      </div>
    </div>
  );
}

import type { SpikeEvent } from "../../types/index";

export const SPIKE_EVENTS: SpikeEvent[] = [
  {
    spikeId: "SPIKE_001",
    label: "BoE List Merge",
    startDate: "2023-11-14",
    endDate: "2023-11-14",
    durationDays: 1,
    peakDailyAlerts: 682000,
    severity: "severe",
    rootCause:
      "Bank of England consolidated list merge introduced ~28,000 net-new entity records overnight, " +
      "triggering mass re-screening across all active correspondent accounts.",
    affectedFeeds: ["HMT"],
    makerCheckerException: true,
    staffingOvertime: true,
    description:
      "Single-day spike of 682K alerts on Nov 14 2023 caused by BoE list restructuring. " +
      "L1 High SLA compliance dropped to 83%. Overtime activated across all analyst pools. " +
      "A downstream maker-checker exception was logged Dec 12 2023 related to the backlog.",
  },
  {
    spikeId: "SPIKE_002",
    label: "Acuity Partial Feed Failure",
    startDate: "2024-02-03",
    endDate: "2024-02-17",
    durationDays: 15,
    peakDailyAlerts: 91000,
    severity: "critical",
    rootCause:
      "ACUITY_AGGREGATED feed entered partial failure mode due to upstream vendor API degradation. " +
      "Duplicate and malformed records flooded the screening engine, creating a 14-day backlog " +
      "that required manual triage and list reconciliation.",
    affectedFeeds: ["ACUITY_AGGREGATED"],
    makerCheckerException: true,
    staffingOvertime: true,
    description:
      "Most severe event in the monitoring period. 15 days of elevated volume (peak 91K/day) with " +
      "L1 High SLA compliance falling to 71% and L1 Medium to 78%. ACUITY_AGGREGATED feed remained " +
      "in partial_failure status throughout. Two maker-checker exceptions linked to this period " +
      "(Dec 12 2023 pre-cursor gap, Mar 4 2024 rollout failure). Full remediation completed Feb 20 2024.",
  },
  {
    spikeId: "SPIKE_003",
    label: "OFAC SDN Geopolitical Update",
    startDate: "2024-06-22",
    endDate: "2024-06-24",
    durationDays: 3,
    peakDailyAlerts: 74000,
    severity: "moderate",
    rootCause:
      "OFAC published a major SDN list update adding 340 entities across Russia, Belarus, and Iran " +
      "in response to escalating geopolitical events. Re-screening triggered 3-day elevated volume.",
    affectedFeeds: ["OFAC_SDN", "OFAC_CONSOLIDATED"],
    makerCheckerException: false,
    staffingOvertime: false,
    description:
      "3-day elevated volume event peaking at 74K alerts/day. SLA compliance held above warning " +
      "thresholds. No overtime required. Feed operations remained normal.",
  },
  {
    spikeId: "SPIKE_004",
    label: "Internal Threshold Tuning Anomaly",
    startDate: "2024-10-08",
    endDate: "2024-10-17",
    durationDays: 10,
    peakDailyAlerts: 68000,
    severity: "moderate",
    rootCause:
      "Risk team lowered fuzzy-match threshold from 85% to 78% confidence for a 10-day A/B evaluation. " +
      "This caused a 35–45% increase in daily alert volume as marginal matches were promoted to review queue.",
    affectedFeeds: [],
    makerCheckerException: false,
    staffingOvertime: true,
    description:
      "Internal configuration change created a 10-day volume anomaly peaking at 68K/day. " +
      "Overtime activated in week 2. Threshold was rolled back Oct 18 2024 after evaluation concluded.",
  },
  {
    spikeId: "SPIKE_005",
    label: "Maker-Checker Rollout Volume Surge",
    startDate: "2025-01-15",
    endDate: "2025-01-22",
    durationDays: 8,
    peakDailyAlerts: 63000,
    severity: "moderate",
    rootCause:
      "Rollout of enhanced maker-checker workflow to 3 additional LOBs temporarily doubled review " +
      "steps per alert for newly onboarded teams, reducing throughput and causing queue buildup.",
    affectedFeeds: [],
    makerCheckerException: false,
    staffingOvertime: true,
    description:
      "8-day volume increase peaking at 63K/day caused by workflow overhead during LOB onboarding. " +
      "New teams required 2x review time as analysts learned the enhanced maker-checker process. " +
      "Throughput normalized by Jan 23 2025 after training completion.",
  },
];

// Lookup map for quick spike retrieval by ID
export const SPIKE_MAP: Record<string, SpikeEvent> = Object.fromEntries(
  SPIKE_EVENTS.map((s) => [s.spikeId, s])
);

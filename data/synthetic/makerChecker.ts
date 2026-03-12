import type { MakerCheckerRecord } from "../../types/index";

// ============================================================
// MAKER_CHECKER_EXCEPTIONS — exactly 3 records
//
// Overall compliance rate: 99.8% clean
// Derived from ~780K total daily review actions across the
// monitoring period (avg ~1,480 reviews/day × 527 days).
// 3 exceptions / 779,960 total = 0.000385% exception rate → 99.9996% clean
// Rounded to reported metric: 99.8% (includes near-miss reviews
// that were flagged but resolved same-session without exception log).
// ============================================================

export const MAKER_CHECKER_EXCEPTIONS: MakerCheckerRecord[] = [
  {
    exceptionId: "MCX-001",
    date: "2023-12-12",
    exceptionType: "implementation_gap",
    description:
      "Pre-consent order control gap: L1 High alert batch reviewed by MKR-031 was " +
      "checker-validated by the same analyst pool lead (CHK-031) due to a role-boundary " +
      "misconfiguration carried over from the legacy workflow system. The gap predated the " +
      "Nov 14 BoE list merge spike (SPIKE_001) and was exposed when the backlog required " +
      "all-hands review without updated entitlement controls. Remediated by updating role " +
      "separation rules in the workflow engine and re-reviewing 14 affected alerts.",
    makerId: "MKR-031",
    checkerId: "CHK-031",
    remediationDate: "2023-12-17",
    remediationDays: 5,
    relatedSpikeId: "SPIKE_001",
    lob: "GCB",
  },
  {
    exceptionId: "MCX-002",
    date: "2024-03-04",
    exceptionType: "implementation_gap",
    description:
      "Rollout gap during SPIKE_002 recovery: as ACUITY_AGGREGATED feed failure backlog " +
      "cleared in late Feb 2024, a batch of 9 L1 Medium alerts was processed through an " +
      "interim triage queue that had not yet been updated with the enhanced maker-checker " +
      "enforcement patch. MKR-019 completed both make and check steps before the queue " +
      "routing was corrected. Alerts were re-reviewed under proper separation on Mar 6 2024. " +
      "Linked to the operational stress period of SPIKE_002 (Feb 3–17 2024).",
    makerId: "MKR-019",
    checkerId: null,
    remediationDate: "2024-03-06",
    remediationDays: 2,
    relatedSpikeId: "SPIKE_002",
    lob: "GTS",
  },
  {
    exceptionId: "MCX-003",
    date: "2024-08-19",
    exceptionType: "entitlement_provisioning",
    description:
      "IT access provisioning error: MKR-027 was granted checker-level entitlement in " +
      "addition to existing maker permissions during a quarterly access recertification cycle. " +
      "The dual-role condition persisted for 4 days before the anomaly was detected by the " +
      "automated entitlement audit job on Aug 23 2024. During that window MKR-027 performed " +
      "3 self-check actions on L3 Low-priority alerts. All 3 alerts were re-reviewed by " +
      "assigned checkers and dispositions confirmed. IT Security revoked duplicate entitlement " +
      "and updated provisioning workflow to block dual-role grants at request time.",
    makerId: "MKR-027",
    checkerId: "MKR-027",
    remediationDate: "2024-08-23",
    remediationDays: 4,
    relatedSpikeId: null,
    lob: "GWIM",
  },
];

// Derived compliance metric (for dashboard display)
export const MAKER_CHECKER_SUMMARY = {
  totalExceptions: 3,
  monitoringPeriodDays: 527,
  estimatedDailyReviewActions: 1480,
  estimatedTotalReviewActions: 780760,
  complianceRate: 0.998, // reported metric (includes near-miss pool)
  lastExceptionDate: "2024-08-19",
  daysSinceLastException: 570, // as of 2026-03-11
} as const;

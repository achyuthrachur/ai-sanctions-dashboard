import type { DispositionWeek, SetbackRecord } from "../../types/index";

// ============================================================
// DISPOSITION_WEEKLY — weekly QA metrics
// Oct 2 2023 (Monday) through Mar 9 2026 — 75 weeks
//
// Baselines:
//   trueMatchRate:    0.003–0.008  (0.3–0.8%)
//   falsePositiveRate: complement of true match + auto-cleared
//   autoCleared:      ~0.35        (35%)
//   qaSetbackRate:    0.021        (2.1% baseline)
//                     0.05–0.08    during SPIKE_001 / SPIKE_002 weeks
// No Math.random() — all values from deterministic offset tables
// ============================================================

// Week-level micro-variation (cycles through 20 offsets)
const TMR_OFFSETS  = [0,0.001,0.002,0.001,0.003,0.002,0.001,0.003,0.002,0.001,
                      0.003,0.001,0.002,0.003,0.001,0.002,0.001,0.003,0.002,0.001];
const SBR_OFFSETS  = [0,0.001,0.002,0.001,0.003,0.002,0.001,0.003,0.002,0.001,
                      0.002,0.003,0.001,0.002,0.003,0.001,0.002,0.001,0.003,0.002];
const VOL_OFFSETS  = [0,1200,2400,800,3100,1800,600,2700,1400,3300,
                      900,2100,3500,700,2900,1600,3800,1100,2300,4000];

function mondayOf(weekIndex: number): string {
  // Week 0 = 2023-10-02 (Monday)
  const base = new Date("2023-10-02T00:00:00Z");
  base.setUTCDate(base.getUTCDate() + weekIndex * 7);
  return base.toISOString().slice(0, 10);
}

// Spike week ranges (week index 0 = Oct 2 2023)
// SPIKE_001: Nov 13 = week 6 (Nov 13–17)
// SPIKE_002: Feb 5 = weeks 18–21 (Feb 3–17 spans 3 full weeks)
// SPIKE_003: Jun 17 = week 37 (Jun 22–24 falls in week 37 = Jun 17–23 + Jun 24–30)
// SPIKE_004: Oct 7 = weeks 53–55
// SPIKE_005: Jan 13 = weeks 67–68

function getSpikeWeekInfo(weekIdx: number): { spikeId: string | null; severity: "none"|"moderate"|"severe"|"critical" } {
  if (weekIdx === 6)                      return { spikeId: "SPIKE_001", severity: "severe" };
  if (weekIdx === 7)                      return { spikeId: "SPIKE_001", severity: "moderate" }; // tail
  if (weekIdx >= 18 && weekIdx <= 20)     return { spikeId: "SPIKE_002", severity: "critical" };
  if (weekIdx === 21)                     return { spikeId: "SPIKE_002", severity: "moderate" }; // recovery
  if (weekIdx === 37 || weekIdx === 38)   return { spikeId: "SPIKE_003", severity: "moderate" };
  if (weekIdx >= 53 && weekIdx <= 55)     return { spikeId: "SPIKE_004", severity: "moderate" };
  if (weekIdx === 67 || weekIdx === 68)   return { spikeId: "SPIKE_005", severity: "moderate" };
  return { spikeId: null, severity: "none" };
}

function generateDispositionWeekly(): DispositionWeek[] {
  const weeks: DispositionWeek[] = [];
  const TOTAL_WEEKS = 128; // Oct 2 2023 → Mar 9 2026 (127 full weeks + current)

  for (let w = 0; w < TOTAL_WEEKS; w++) {
    const weekStart = mondayOf(w);
    const { spikeId, severity } = getSpikeWeekInfo(w);
    const vIdx = w % VOL_OFFSETS.length;
    const tIdx = w % TMR_OFFSETS.length;
    const sIdx = w % SBR_OFFSETS.length;

    // Base weekly review volume ~5 working days × ~47K/day but only human-reviewed portion
    // Auto-cleared ~35% → human reviewed ~65% of daily volume
    const baseWeeklyVol = Math.round((47000 * 5 * 0.65) + VOL_OFFSETS[vIdx]);
    let totalReviewed = baseWeeklyVol;
    let trueMatchRate  = 0.004 + TMR_OFFSETS[tIdx];   // 0.4–0.7% baseline
    let qaSetbackRate  = 0.021 + SBR_OFFSETS[sIdx];   // 2.1–2.4% baseline
    let autoCleared    = 0.348 + (w % 3) * 0.004;     // 34.8–35.6%

    // Spike week adjustments
    if (severity === "critical") {
      totalReviewed  = Math.round(baseWeeklyVol * 1.85);
      trueMatchRate  = 0.006 + TMR_OFFSETS[tIdx];
      qaSetbackRate  = 0.065 + SBR_OFFSETS[sIdx];     // 6.5–7.8% (SPIKE_002)
      autoCleared    = 0.28;                            // fewer auto-clears under pressure
    } else if (severity === "severe") {
      totalReviewed  = Math.round(baseWeeklyVol * 14.5); // SPIKE_001 single day 682K
      trueMatchRate  = 0.005 + TMR_OFFSETS[tIdx];
      qaSetbackRate  = 0.052 + SBR_OFFSETS[sIdx];     // 5.2–5.5% (SPIKE_001)
      autoCleared    = 0.30;
    } else if (severity === "moderate") {
      totalReviewed  = Math.round(baseWeeklyVol * 1.35);
      trueMatchRate  = 0.005 + TMR_OFFSETS[tIdx];
      qaSetbackRate  = 0.031 + SBR_OFFSETS[sIdx];     // 3.1–3.4%
      autoCleared    = 0.33;
    }

    const falsePositiveRate = Math.round((1 - trueMatchRate - autoCleared) * 1000) / 1000;

    const totalReviewedRel = Math.round(totalReviewed * 0.40);
    const totalReviewedTrx = totalReviewed - totalReviewedRel;
    const trueMatchRateRel = Math.min(trueMatchRate * 1.40, 0.9999);
    const trueMatchRateTrx = trueMatchRate * 0.75;
    const qaSetbackRateRel = qaSetbackRate * 0.80;
    const qaSetbackRateTrx = qaSetbackRate * 1.15;

    weeks.push({
      weekStart,
      trueMatchRate:    Math.round(trueMatchRate   * 10000) / 10000,
      trueMatchRateRel: Math.round(trueMatchRateRel * 10000) / 10000,
      trueMatchRateTrx: Math.round(trueMatchRateTrx * 10000) / 10000,
      falsePositiveRate: Math.max(0, Math.round(falsePositiveRate * 10000) / 10000),
      autoCleared:      Math.round(autoCleared     * 1000)  / 1000,
      qaSetbackRate:    Math.round(qaSetbackRate   * 10000) / 10000,
      qaSetbackRateRel: Math.round(qaSetbackRateRel * 10000) / 10000,
      qaSetbackRateTrx: Math.round(qaSetbackRateTrx * 10000) / 10000,
      totalReviewed,
      totalReviewedRel,
      totalReviewedTrx,
      spikeFlag: spikeId !== null,
      spikeId,
    });
  }
  return weeks;
}

export const DISPOSITION_WEEKLY: DispositionWeek[] = generateDispositionWeekly();

// ============================================================
// SETBACK_RECORDS — sample QA setback rows
// 24 records with 4 reason types, spread across monitoring period
// ============================================================

export const SETBACK_RECORDS: SetbackRecord[] = [
  // --- insufficientDocumentation (7 records) ---
  {
    setbackId: "SBK-001", alertId: "ALR-0003", date: "2023-10-08",
    reason: "insufficientDocumentation",
    analystId: "MKR-008", qaLeadId: "QA-003",
    description: "Escalated L2 alert lacked required beneficial ownership documentation for Meridian Bank correspondent relationship. Analyst closed without attaching SWIFT confirmation.",
    resolved: true, resolutionDate: "2023-10-10",
  },
  {
    setbackId: "SBK-002", alertId: "ALR-0012", date: "2023-11-10",
    reason: "insufficientDocumentation",
    analystId: "MKR-023", qaLeadId: "QA-001",
    description: "False positive disposition on Riyadh Capital lacked negative-match memorandum. QA requires documented rationale for all L2 closures.",
    resolved: true, resolutionDate: "2023-11-12",
  },
  {
    setbackId: "SBK-003", alertId: "ALR-0041", date: "2024-02-07",
    reason: "insufficientDocumentation",
    analystId: "MKR-022", qaLeadId: "QA-002",
    description: "SPIKE_002 period: L2 Kyiv Holdings alert closed as false positive without Ukraine-corridor restriction memo. Setback during high-volume triage.",
    resolved: true, resolutionDate: "2024-02-14",
  },
  {
    setbackId: "SBK-004", alertId: "ALR-0057", date: "2024-03-22",
    reason: "insufficientDocumentation",
    analystId: "MKR-008", qaLeadId: "QA-004",
    description: "Escalated L2 Donetsk corridor alert closed without completed escalation form. Post-SPIKE_002 backlog clearance period.",
    resolved: true, resolutionDate: "2024-03-24",
  },
  {
    setbackId: "SBK-005", alertId: "ALR-0099", date: "2024-10-10",
    reason: "insufficientDocumentation",
    analystId: "MKR-024", qaLeadId: "QA-003",
    description: "SPIKE_004 period: L2 Minsk Trade false positive closed without Belarus corridor restriction check attached.",
    resolved: true, resolutionDate: "2024-10-13",
  },
  {
    setbackId: "SBK-006", alertId: "ALR-0140", date: "2025-04-15",
    reason: "insufficientDocumentation",
    analystId: "MKR-011", qaLeadId: "QA-001",
    description: "L2 Minsk Trade escalation missing secondary reviewer sign-off sheet. Standard escalation protocol not fully documented.",
    resolved: true, resolutionDate: "2025-04-17",
  },
  {
    setbackId: "SBK-007", alertId: "ALR-0181", date: "2026-02-02",
    reason: "insufficientDocumentation",
    analystId: "MKR-009", qaLeadId: "QA-002",
    description: "L2 Tripoli Trade escalation missing OFAC Libya sanctions reference citation in disposition narrative.",
    resolved: true, resolutionDate: "2026-02-04",
  },

  // --- incorrectEntityMatch (6 records) ---
  {
    setbackId: "SBK-008", alertId: "ALR-0005", date: "2023-10-15",
    reason: "incorrectEntityMatch",
    analystId: "MKR-002", qaLeadId: "QA-003",
    description: "True match on Volga Energy confirmed incorrectly — QA determined the screened entity is Volga Energy Ltd (UK, non-sanctioned), not Volga Energy PJSC (Russia, SDN). Disposition reversed to false positive after full entity differentiation review.",
    resolved: true, resolutionDate: "2023-10-17",
  },
  {
    setbackId: "SBK-009", alertId: "ALR-0039", date: "2024-02-05",
    reason: "incorrectEntityMatch",
    analystId: "MKR-003", qaLeadId: "QA-004",
    description: "SPIKE_002: Moscow Partners SDN hit confirmed as true match under triage pressure. QA found screened entity was Moscow Partners AG (Swiss reg, no SDN listing). High-volume error.",
    resolved: true, resolutionDate: "2024-02-19",
  },
  {
    setbackId: "SBK-010", alertId: "ALR-0046", date: "2024-02-12",
    reason: "incorrectEntityMatch",
    analystId: "MKR-019", qaLeadId: "QA-001",
    description: "SPIKE_002: Bucharest Corp false positive disposition — QA identified entity as Romania-registered subsidiary of a sanctioned Belarusian parent. Should have been escalated, not closed.",
    resolved: true, resolutionDate: "2024-02-22",
  },
  {
    setbackId: "SBK-011", alertId: "ALR-0075", date: "2024-06-22",
    reason: "incorrectEntityMatch",
    analystId: "MKR-002", qaLeadId: "QA-002",
    description: "SPIKE_003: Ural Resources SDN match confirmed, but QA noted the screened transaction was routed through a non-sanctioned intermediary. Confirmation technically correct but requires corridor-restriction supplemental review.",
    resolved: true, resolutionDate: "2024-06-25",
  },
  {
    setbackId: "SBK-012", alertId: "ALR-0107", date: "2024-11-13",
    reason: "incorrectEntityMatch",
    analystId: "MKR-003", qaLeadId: "QA-003",
    description: "Tehran Capital confirmed as true match SDN hit — QA found two distinct entities sharing the name; the screened entity is non-sanctioned Tehran Capital LLC (UAE). Disposition reversed.",
    resolved: true, resolutionDate: "2024-11-15",
  },
  {
    setbackId: "SBK-013", alertId: "ALR-0164", date: "2025-10-06",
    reason: "incorrectEntityMatch",
    analystId: "MKR-005", qaLeadId: "QA-004",
    description: "Volga Partners confirmed as true match, but QA identified the entity as Volga Partners BV (Netherlands, OFAC non-listed). Error due to partial name match on SDN alias field.",
    resolved: true, resolutionDate: "2025-10-08",
  },

  // --- policyMisapplication (6 records) ---
  {
    setbackId: "SBK-014", alertId: "ALR-0009", date: "2023-10-29",
    reason: "policyMisapplication",
    analystId: "MKR-003", qaLeadId: "QA-001",
    description: "Minsk Trade escalation: analyst applied Belarus primary sanction policy when the correct policy is secondary sanctions guidance per internal memo 2023-SC-14. Disposition methodology corrected.",
    resolved: true, resolutionDate: "2023-10-31",
  },
  {
    setbackId: "SBK-015", alertId: "ALR-0034", date: "2024-01-23",
    reason: "policyMisapplication",
    analystId: "MKR-008", qaLeadId: "QA-002",
    description: "Yemen corridor escalation applied outdated OFAC Yemen FAQ guidance (pre-2023 update). Analyst used legacy policy that had been superseded by updated GL-4A provisions.",
    resolved: true, resolutionDate: "2024-01-25",
  },
  {
    setbackId: "SBK-016", alertId: "ALR-0044", date: "2024-02-10",
    reason: "policyMisapplication",
    analystId: "MKR-021", qaLeadId: "QA-003",
    description: "SPIKE_002: Vilnius Trade flagged under Baltic corridor restriction policy (not applicable to Lithuania post-2022 policy revision). Analyst had not received updated policy circular during spike-period triage.",
    resolved: true, resolutionDate: "2024-02-24",
  },
  {
    setbackId: "SBK-017", alertId: "ALR-0077", date: "2024-06-22",
    reason: "policyMisapplication",
    analystId: "MKR-010", qaLeadId: "QA-004",
    description: "SPIKE_003: Donbas Holdings escalated under pre-invasion Ukraine-Russia policy framework rather than updated 2024 OFAC Ukraine/Russia consolidated guidance. Policy retraining issued to analyst team.",
    resolved: true, resolutionDate: "2024-06-26",
  },
  {
    setbackId: "SBK-018", alertId: "ALR-0101", date: "2024-10-14",
    reason: "policyMisapplication",
    analystId: "MKR-006", qaLeadId: "QA-001",
    description: "SPIKE_004: Damascus Corp confirmed true match under primary Syria sanctions, but required humanitarian exemption review under GL-21 was omitted. GL-21 check now mandatory for Syria SDN closures.",
    resolved: true, resolutionDate: "2024-10-16",
  },
  {
    setbackId: "SBK-019", alertId: "ALR-0131", date: "2025-02-21",
    reason: "policyMisapplication",
    analystId: "MKR-016", qaLeadId: "QA-002",
    description: "Damascus Corp closed as false positive without required Syria secondary sanctions analysis. Analyst applied primary sanctions checklist only, missing step 4 of the updated 5-step Syria review protocol.",
    resolved: true, resolutionDate: "2025-02-24",
  },

  // --- other (5 records) ---
  {
    setbackId: "SBK-020", alertId: "ALR-0017", date: "2023-11-15",
    reason: "other",
    analystId: "MKR-012", qaLeadId: "QA-003",
    description: "SPIKE_001 tail: Alert routing error caused Bristol Exports alert to be reviewed by a GCB analyst rather than the assigned GTS queue. Disposition valid but procedural breach noted.",
    resolved: true, resolutionDate: "2023-11-16",
  },
  {
    setbackId: "SBK-021", alertId: "ALR-0063", date: "2024-04-19",
    reason: "other",
    analystId: "MKR-020", qaLeadId: "QA-004",
    description: "SLA timer miscalculation: Tripoli Holdings L2 alert hoursToReview recorded as 46h against a 48h SLA, but system logged case start time 6h after actual assignment, causing apparent met-SLA when breach occurred.",
    resolved: true, resolutionDate: "2024-04-22",
  },
  {
    setbackId: "SBK-022", alertId: "ALR-0088", date: "2024-08-12",
    reason: "other",
    analystId: "MKR-028", qaLeadId: "QA-001",
    description: "Dakar Trust L3 alert: QA setback for duplicate disposition entry — alert was closed twice in system within 4 minutes. Second closure overrode first. System deduplication rule applied retroactively.",
    resolved: true, resolutionDate: "2024-08-13",
  },
  {
    setbackId: "SBK-023", alertId: "ALR-0120", date: "2025-01-15",
    reason: "other",
    analystId: "MKR-018", qaLeadId: "QA-002",
    description: "SPIKE_005: Minsk Export alert assigned to incorrect maker-checker pair due to LOB onboarding misconfiguration during rollout. Alert re-queued and processed correctly same day.",
    resolved: true, resolutionDate: "2025-01-15",
  },
  {
    setbackId: "SBK-024", alertId: "ALR-0199", date: "2026-03-11",
    reason: "other",
    analystId: "MKR-011", qaLeadId: "QA-003",
    description: "Minsk Corp L2 alert opened same day as data snapshot. QA review scheduled; no setback determination yet. Record created for pipeline tracking.",
    resolved: false, resolutionDate: null,
  },
];

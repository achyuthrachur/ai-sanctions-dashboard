import type { StaffingWeek } from "../../types/index";

// ============================================================
// STAFFING_WEEKLY — 75 weekly snapshots
// Oct 2 2023 (Monday) through Mar 9 2026
//
// Baseline: 156 total analysts (makers + checkers + QA leads + team leads)
//   makers:     98   (63%)
//   checkers:   42   (27%)
//   qaLeads:    10   (6%)
//   teamLeads:   6   (4%)
//
// Baseline alertsPerAnalyst/day: ~120 (weeklyAlertVolume / analysts / 5)
// overtimeIndicator: true when alertsPerAnalyst/day > 144 (120% of baseline)
//
// Overtime confirmed for: SPIKE_001 (wk 6–7), SPIKE_002 (wk 18–21),
//                         SPIKE_004 (wk 53–55), SPIKE_005 (wk 67–68)
// SPIKE_003 (wk 37–38): volume elevated but held below overtime threshold
//
// No Math.random() — all values deterministic
// ============================================================

function mondayOf(weekIndex: number): string {
  const base = new Date("2023-10-02T00:00:00Z");
  base.setUTCDate(base.getUTCDate() + weekIndex * 7);
  return base.toISOString().slice(0, 10);
}

// Micro-variation tables (cycles of 20)
const VOL_WEEK_OFFSETS = [
  0, 8400, 16200, 5600, 22100, 13700, 4200, 19300, 11100, 26400,
  7300, 17800, 28900, 3100, 21500, 12300, 31000, 9700, 18600, 35200,
];

const ANALYST_DELTAS = [0,0,1,0,-1,0,1,0,0,-1,1,0,0,1,-1,0,0,1,0,-1];

// Staffing compositions for different headcount levels
function getComposition(total: number): { makers: number; checkers: number; qaLeads: number; teamLeads: number } {
  const teamLeads = 6;
  const qaLeads   = total <= 156 ? 10 : Math.min(10 + Math.floor((total - 156) / 8), 14);
  const remaining = total - teamLeads - qaLeads;
  const makers    = Math.round(remaining * 0.70);
  const checkers  = remaining - makers;
  return { makers, checkers, qaLeads, teamLeads };
}

type SpikeWeekProfile = {
  spikeId: string | null;
  volumeMultiplier: number;
  analystBoost: number;    // temporary contractors / overtime staff
  overtime: boolean;
};

function getSpikeProfile(w: number): SpikeWeekProfile {
  // SPIKE_001: week 6 peak, week 7 tail
  if (w === 6) return { spikeId:"SPIKE_001", volumeMultiplier:14.6, analystBoost:12, overtime:true  };
  if (w === 7) return { spikeId:"SPIKE_001", volumeMultiplier:2.6,  analystBoost:8,  overtime:true  };
  // SPIKE_002: weeks 18–21 (Feb 3–Mar 3 2024 spans 4 weeks)
  if (w === 18) return { spikeId:"SPIKE_002", volumeMultiplier:1.48, analystBoost:14, overtime:true  };
  if (w === 19) return { spikeId:"SPIKE_002", volumeMultiplier:1.87, analystBoost:18, overtime:true  };
  if (w === 20) return { spikeId:"SPIKE_002", volumeMultiplier:1.83, analystBoost:16, overtime:true  };
  if (w === 21) return { spikeId:"SPIKE_002", volumeMultiplier:1.32, analystBoost:10, overtime:true  };
  // SPIKE_003: weeks 37–38 — volume elevated but no overtime
  if (w === 37) return { spikeId:"SPIKE_003", volumeMultiplier:1.58, analystBoost:0,  overtime:false };
  if (w === 38) return { spikeId:"SPIKE_003", volumeMultiplier:1.38, analystBoost:0,  overtime:false };
  // SPIKE_004: weeks 53–55
  if (w === 53) return { spikeId:"SPIKE_004", volumeMultiplier:1.32, analystBoost:6,  overtime:true  };
  if (w === 54) return { spikeId:"SPIKE_004", volumeMultiplier:1.44, analystBoost:9,  overtime:true  };
  if (w === 55) return { spikeId:"SPIKE_004", volumeMultiplier:1.35, analystBoost:6,  overtime:true  };
  // SPIKE_005: weeks 67–68
  if (w === 67) return { spikeId:"SPIKE_005", volumeMultiplier:1.29, analystBoost:5,  overtime:true  };
  if (w === 68) return { spikeId:"SPIKE_005", volumeMultiplier:1.38, analystBoost:7,  overtime:true  };
  return { spikeId: null, volumeMultiplier: 1.0, analystBoost: 0, overtime: false };
}

function generateStaffingWeekly(): StaffingWeek[] {
  const weeks: StaffingWeek[] = [];
  const TOTAL_WEEKS = 75;
  const BASE_ANALYSTS = 156;
  const BASE_DAILY_ALERTS = 47000; // mid-range baseline
  const WORKING_DAYS = 5;

  for (let w = 0; w < TOTAL_WEEKS; w++) {
    const weekStart = mondayOf(w);
    const vOff = VOL_WEEK_OFFSETS[w % VOL_WEEK_OFFSETS.length];
    const aDelta = ANALYST_DELTAS[w % ANALYST_DELTAS.length];
    const { spikeId, volumeMultiplier, analystBoost, overtime } = getSpikeProfile(w);

    // Base weekly volume: 5 days × baseline daily × micro-variation
    const baseWeeklyVolume = Math.round((BASE_DAILY_ALERTS * WORKING_DAYS + vOff) * volumeMultiplier);

    // Analyst headcount: baseline ± natural attrition/hiring + spike boosts
    const totalAnalysts = BASE_ANALYSTS + aDelta + analystBoost;
    const { makers, checkers, qaLeads, teamLeads } = getComposition(totalAnalysts);

    // alertsPerAnalyst: per analyst per day (5-day week)
    const alertsPerAnalyst = Math.round(baseWeeklyVolume / totalAnalysts / WORKING_DAYS);

    weeks.push({
      weekStart,
      totalAnalysts,
      makers,
      checkers,
      qaLeads,
      teamLeads,
      weeklyAlertVolume: baseWeeklyVolume,
      alertsPerAnalyst,
      overtimeIndicator: overtime,
      spikeFlag: spikeId !== null,
      spikeId,
    });
  }
  return weeks;
}

export const STAFFING_WEEKLY: StaffingWeek[] = generateStaffingWeekly();

// Summary metrics (for dashboard KPI tiles)
export const STAFFING_SUMMARY = {
  currentHeadcount: 156,
  currentMakers: 98,
  currentCheckers: 42,
  currentQaLeads: 10,
  currentTeamLeads: 6,
  baselineAlertsPerAnalystPerDay: 120,
  overtimeThresholdAlertsPerDay: 144, // 120% of baseline
  weeksWithOvertime: STAFFING_WEEKLY.filter(w => w.overtimeIndicator).length,
  peakWeeklyVolume: Math.max(...STAFFING_WEEKLY.map(w => w.weeklyAlertVolume)),
  peakWeek: STAFFING_WEEKLY.reduce(
    (max, w) => (w.weeklyAlertVolume > max.weeklyAlertVolume ? w : max),
    STAFFING_WEEKLY[0]
  ).weekStart,
} as const;

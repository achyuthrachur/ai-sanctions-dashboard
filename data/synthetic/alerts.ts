import type { AlertRecord, DailySummary } from "../../types/index";

// ============================================================
// DAILY_SUMMARIES — Oct 1 2023 through Mar 11 2026 (527 days)
// All values deterministic (no Math.random).
// Spike degradations hardcoded by date range.
// ============================================================

// --- Spike date range helpers (inclusive) ---
function inRange(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}

// --- Deterministic variation: cycle through preset offsets by day index ---
// dayIndex mod patterns produce realistic day-to-day variation within bands
const VOLUME_OFFSETS = [0, 2100, 4300, 1800, 3200, 5100, 2700, 900, 3800, 1500,
  4600, 2200, 800, 3500, 4900, 1200, 3000, 4400, 700, 2500,
  3900, 1100, 4200, 600, 2900, 4700, 1300, 3600, 5000, 2000];

const SLA_MICRO = [0, 0.003, 0.006, 0.001, 0.008, 0.004, 0.002, 0.007, 0.005, 0.009,
  0.001, 0.006, 0.003, 0.008, 0.002, 0.007, 0.004, 0.009, 0.001, 0.005];

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function generateDailySummaries(): DailySummary[] {
  const results: DailySummary[] = [];
  const start = "2023-10-01";
  const totalDays = 527;

  for (let i = 0; i < totalDays; i++) {
    const date = addDays(start, i);
    const vOff = VOLUME_OFFSETS[i % VOLUME_OFFSETS.length];
    const sOff = SLA_MICRO[i % SLA_MICRO.length];
    const dow = new Date(date + "T00:00:00Z").getUTCDay(); // 0=Sun

    // Weekend volume reduction ~15%
    const weekendFactor = dow === 0 || dow === 6 ? 0.85 : 1.0;
    const baseVolume = Math.round((42000 + vOff) * weekendFactor);

    // Baseline SLA (normal operations)
    let totalAlerts = baseVolume;
    let l1H = 0.963 + sOff;
    let l1M = 0.952 + sOff;
    let l1L = 0.984 + sOff;
    let l2 = 0.967 + sOff;
    let l3 = 0.981 + sOff;
    let spikeFlag = false;
    let spikeId: string | null = null;

    // SPIKE_001: Nov 14 2023 — single day, 682K alerts, severe SLA degradation
    if (date === "2023-11-14") {
      totalAlerts = 682000;
      l1H = 0.83;
      l1M = 0.87;
      l1L = 0.91;
      l2 = 0.89;
      l3 = 0.94;
      spikeFlag = true;
      spikeId = "SPIKE_001";
    }
    // SPIKE_001 tail: Nov 15–16 — elevated recovery
    else if (date === "2023-11-15") {
      totalAlerts = 198000;
      l1H = 0.88; l1M = 0.90; l1L = 0.94; l2 = 0.92; l3 = 0.96;
      spikeFlag = true; spikeId = "SPIKE_001";
    }
    else if (date === "2023-11-16") {
      totalAlerts = 112000;
      l1H = 0.91; l1M = 0.92; l1L = 0.96; l2 = 0.94; l3 = 0.97;
      spikeFlag = true; spikeId = "SPIKE_001";
    }

    // SPIKE_002: Feb 3–17 2024 — Acuity partial failure, 15 days, most severe
    else if (date === "2024-02-03") {
      totalAlerts = 67000; l1H = 0.88; l1M = 0.91; l1L = 0.95; l2 = 0.93; l3 = 0.96;
      spikeFlag = true; spikeId = "SPIKE_002";
    }
    else if (date === "2024-02-04") {
      totalAlerts = 74000; l1H = 0.85; l1M = 0.88; l1L = 0.93; l2 = 0.91; l3 = 0.95;
      spikeFlag = true; spikeId = "SPIKE_002";
    }
    else if (date === "2024-02-05") {
      totalAlerts = 79000; l1H = 0.82; l1M = 0.86; l1L = 0.91; l2 = 0.89; l3 = 0.94;
      spikeFlag = true; spikeId = "SPIKE_002";
    }
    else if (date === "2024-02-06") {
      totalAlerts = 83000; l1H = 0.79; l1M = 0.83; l1L = 0.89; l2 = 0.87; l3 = 0.93;
      spikeFlag = true; spikeId = "SPIKE_002";
    }
    else if (date === "2024-02-07") {
      totalAlerts = 87000; l1H = 0.76; l1M = 0.80; l1L = 0.87; l2 = 0.85; l3 = 0.92;
      spikeFlag = true; spikeId = "SPIKE_002";
    }
    else if (date === "2024-02-08") {
      totalAlerts = 89000; l1H = 0.74; l1M = 0.78; l1L = 0.86; l2 = 0.84; l3 = 0.91;
      spikeFlag = true; spikeId = "SPIKE_002";
    }
    else if (date === "2024-02-09") {
      totalAlerts = 91000; l1H = 0.71; l1M = 0.78; l1L = 0.84; l2 = 0.82; l3 = 0.90;
      spikeFlag = true; spikeId = "SPIKE_002";
    }
    else if (date === "2024-02-10") {
      totalAlerts = 91000; l1H = 0.71; l1M = 0.78; l1L = 0.84; l2 = 0.82; l3 = 0.90;
      spikeFlag = true; spikeId = "SPIKE_002";
    }
    else if (date === "2024-02-11") {
      totalAlerts = 88000; l1H = 0.73; l1M = 0.79; l1L = 0.85; l2 = 0.83; l3 = 0.91;
      spikeFlag = true; spikeId = "SPIKE_002";
    }
    else if (date === "2024-02-12") {
      totalAlerts = 85000; l1H = 0.75; l1M = 0.80; l1L = 0.86; l2 = 0.84; l3 = 0.91;
      spikeFlag = true; spikeId = "SPIKE_002";
    }
    else if (date === "2024-02-13") {
      totalAlerts = 82000; l1H = 0.77; l1M = 0.82; l1L = 0.87; l2 = 0.85; l3 = 0.92;
      spikeFlag = true; spikeId = "SPIKE_002";
    }
    else if (date === "2024-02-14") {
      totalAlerts = 78000; l1H = 0.79; l1M = 0.83; l1L = 0.88; l2 = 0.86; l3 = 0.92;
      spikeFlag = true; spikeId = "SPIKE_002";
    }
    else if (date === "2024-02-15") {
      totalAlerts = 74000; l1H = 0.82; l1M = 0.85; l1L = 0.90; l2 = 0.88; l3 = 0.93;
      spikeFlag = true; spikeId = "SPIKE_002";
    }
    else if (date === "2024-02-16") {
      totalAlerts = 69000; l1H = 0.85; l1M = 0.87; l1L = 0.92; l2 = 0.90; l3 = 0.94;
      spikeFlag = true; spikeId = "SPIKE_002";
    }
    else if (date === "2024-02-17") {
      totalAlerts = 62000; l1H = 0.88; l1M = 0.89; l1L = 0.94; l2 = 0.92; l3 = 0.95;
      spikeFlag = true; spikeId = "SPIKE_002";
    }

    // SPIKE_003: Jun 22–24 2024 — OFAC SDN geopolitical, volume elevated, SLA holds
    else if (date === "2024-06-22") {
      totalAlerts = 74000; l1H = 0.94; l1M = 0.93; l1L = 0.97; l2 = 0.95; l3 = 0.97;
      spikeFlag = true; spikeId = "SPIKE_003";
    }
    else if (date === "2024-06-23") {
      totalAlerts = 71000; l1H = 0.94; l1M = 0.93; l1L = 0.97; l2 = 0.96; l3 = 0.98;
      spikeFlag = true; spikeId = "SPIKE_003";
    }
    else if (date === "2024-06-24") {
      totalAlerts = 64000; l1H = 0.95; l1M = 0.94; l1L = 0.98; l2 = 0.96; l3 = 0.98;
      spikeFlag = true; spikeId = "SPIKE_003";
    }

    // SPIKE_004: Oct 8–17 2024 — threshold tuning anomaly
    else if (inRange(date, "2024-10-08", "2024-10-17")) {
      const dayNum = ["2024-10-08","2024-10-09","2024-10-10","2024-10-11","2024-10-12",
                      "2024-10-13","2024-10-14","2024-10-15","2024-10-16","2024-10-17"].indexOf(date);
      const vols   = [58000,61000,64000,66000,68000,67000,65000,63000,61000,58000];
      const l1hArr = [0.94,0.93,0.92,0.91,0.90,0.91,0.91,0.92,0.93,0.94];
      totalAlerts = vols[dayNum];
      l1H = l1hArr[dayNum]; l1M = l1hArr[dayNum] + 0.01;
      l1L = 0.97; l2 = 0.95; l3 = 0.97;
      spikeFlag = true; spikeId = "SPIKE_004";
    }

    // SPIKE_005: Jan 15–22 2025 — maker-checker rollout
    else if (inRange(date, "2025-01-15", "2025-01-22")) {
      const dayNum = ["2025-01-15","2025-01-16","2025-01-17","2025-01-18","2025-01-19",
                      "2025-01-20","2025-01-21","2025-01-22"].indexOf(date);
      const vols   = [55000,58000,61000,63000,62000,60000,57000,53000];
      const l1hArr = [0.94,0.93,0.92,0.92,0.93,0.93,0.94,0.95];
      totalAlerts = vols[dayNum];
      l1H = l1hArr[dayNum]; l1M = l1hArr[dayNum] + 0.01;
      l1L = 0.97; l2 = 0.95; l3 = 0.97;
      spikeFlag = true; spikeId = "SPIKE_005";
    }

    const l1Count = Math.round(totalAlerts * 0.90);
    const l2Count = Math.round(totalAlerts * 0.08);
    const l3Count = totalAlerts - l1Count - l2Count;

    const l1CountRel = Math.round(l1Count * 0.38);
    const l1CountTrx = l1Count - l1CountRel;
    const l2CountRel = Math.round(l2Count * 0.38);
    const l2CountTrx = l2Count - l2CountRel;
    const l3CountRel = Math.round(l3Count * 0.38);
    const l3CountTrx = l3Count - l3CountRel;

    results.push({
      date,
      totalAlerts,
      l1Count,
      l2Count,
      l3Count,
      l1CountRel,
      l1CountTrx,
      l2CountRel,
      l2CountTrx,
      l3CountRel,
      l3CountTrx,
      l1HighSlaCompliance: Math.min(1, Math.round(l1H * 1000) / 1000),
      l1MedSlaCompliance:  Math.min(1, Math.round(l1M * 1000) / 1000),
      l1LowSlaCompliance:  Math.min(1, Math.round(l1L * 1000) / 1000),
      l2SlaCompliance:     Math.min(1, Math.round(l2  * 1000) / 1000),
      l3SlaCompliance:     Math.min(1, Math.round(l3  * 1000) / 1000),
      spikeFlag,
      spikeId,
    });
  }
  return results;
}

export const DAILY_SUMMARIES: DailySummary[] = generateDailySummaries();

// ============================================================
// ALERT_RECORDS — 200 individual alert rows
// Spread across full time range including spike windows.
// ============================================================

export const ALERT_RECORDS: AlertRecord[] = [
  // ── Oct–Nov 2023 (normal + SPIKE_001) ──────────────────────
  { alertId:"ALR-0001", date:"2023-10-03", alertType:"Name Match", priority:"High", tier:"L1", originator:"Global Trades LLC", beneficiary:"Nile Trading Co", countries:["US","EG"], hoursToReview:18, slaStatus:"met", disposition:"false_positive", makerId:"MKR-014", checkerId:"CHK-007", lob:"GTS" },
  { alertId:"ALR-0002", date:"2023-10-05", alertType:"Entity Screen", priority:"Medium", tier:"L1", originator:"Pacific Rim Corp", beneficiary:"Seoul Partners", countries:["US","KR"], hoursToReview:22, slaStatus:"met", disposition:"false_positive", makerId:"MKR-021", checkerId:"CHK-003", lob:"GCB" },
  { alertId:"ALR-0003", date:"2023-10-08", alertType:"Transaction Monitor", priority:"High", tier:"L2", originator:"Atlantic Capital", beneficiary:"Meridian Bank", countries:["US","GB"], hoursToReview:41, slaStatus:"met", disposition:"escalated", makerId:"MKR-008", checkerId:"CHK-012", lob:"GWIM" },
  { alertId:"ALR-0004", date:"2023-10-11", alertType:"Name Match", priority:"Low", tier:"L1", originator:"Sunrise Exports", beneficiary:"Dubai Holdings", countries:["US","AE"], hoursToReview:68, slaStatus:"met", disposition:"false_positive", makerId:"MKR-031", checkerId:"CHK-019", lob:"GTS" },
  { alertId:"ALR-0005", date:"2023-10-15", alertType:"Country Risk", priority:"High", tier:"L1", originator:"BofA Internal", beneficiary:"Volga Energy", countries:["US","RU"], hoursToReview:20, slaStatus:"met", disposition:"true_match", makerId:"MKR-002", checkerId:"CHK-001", lob:"GCB" },
  { alertId:"ALR-0006", date:"2023-10-18", alertType:"SDN Hit", priority:"High", tier:"L1", originator:"Westfield Finance", beneficiary:"Tehran Metals", countries:["US","IR"], hoursToReview:8, slaStatus:"met", disposition:"true_match", makerId:"MKR-005", checkerId:"CHK-002", lob:"GTS" },
  { alertId:"ALR-0007", date:"2023-10-22", alertType:"Entity Screen", priority:"Medium", tier:"L2", originator:"Harbor Logistics", beneficiary:"Singapore Depot", countries:["US","SG"], hoursToReview:44, slaStatus:"met", disposition:"false_positive", makerId:"MKR-018", checkerId:"CHK-009", lob:"GCIB" },
  { alertId:"ALR-0008", date:"2023-10-25", alertType:"Name Match", priority:"Low", tier:"L3", originator:"BofA Wealth", beneficiary:"Lagos Trust", countries:["US","NG"], hoursToReview:70, slaStatus:"met", disposition:"false_positive", makerId:"MKR-027", checkerId:"CHK-014", lob:"GWIM" },
  { alertId:"ALR-0009", date:"2023-10-29", alertType:"Transaction Monitor", priority:"High", tier:"L1", originator:"Keystone Corp", beneficiary:"Minsk Trade", countries:["US","BY"], hoursToReview:23, slaStatus:"met", disposition:"escalated", makerId:"MKR-003", checkerId:"CHK-006", lob:"GCB" },
  { alertId:"ALR-0010", date:"2023-11-02", alertType:"Country Risk", priority:"Medium", tier:"L1", originator:"Delta Shipping", beneficiary:"Pyongyang Rep", countries:["US","KP"], hoursToReview:19, slaStatus:"met", disposition:"true_match", makerId:"MKR-011", checkerId:"CHK-005", lob:"GTS" },
  { alertId:"ALR-0011", date:"2023-11-07", alertType:"Name Match", priority:"High", tier:"L1", originator:"Thornton LLC", beneficiary:"Aleppo Partners", countries:["US","SY"], hoursToReview:21, slaStatus:"met", disposition:"true_match", makerId:"MKR-006", checkerId:"CHK-008", lob:"GCIB" },
  { alertId:"ALR-0012", date:"2023-11-10", alertType:"SDN Hit", priority:"High", tier:"L2", originator:"CapGroup Fund", beneficiary:"Riyadh Capital", countries:["US","SA"], hoursToReview:46, slaStatus:"met", disposition:"false_positive", makerId:"MKR-023", checkerId:"CHK-016", lob:"GWIM" },
  // SPIKE_001 window — Nov 14 2023
  { alertId:"ALR-0013", date:"2023-11-14", alertType:"Name Match", priority:"High", tier:"L1", originator:"Broadmoor Trade", beneficiary:"Leeds Consolidated", countries:["US","GB"], hoursToReview:29, slaStatus:"breached", disposition:"false_positive", makerId:"MKR-007", checkerId:"CHK-011", lob:"GTS" },
  { alertId:"ALR-0014", date:"2023-11-14", alertType:"Entity Screen", priority:"High", tier:"L1", originator:"Falcon Capital", beneficiary:"Exeter Holdings", countries:["US","GB"], hoursToReview:31, slaStatus:"breached", disposition:"pending", makerId:"MKR-009", checkerId:"CHK-013", lob:"GCB" },
  { alertId:"ALR-0015", date:"2023-11-14", alertType:"SDN Hit", priority:"High", tier:"L1", originator:"Meridian Trust", beneficiary:"Brighton Commerce", countries:["US","GB"], hoursToReview:27, slaStatus:"breached", disposition:"false_positive", makerId:"MKR-015", checkerId:"CHK-018", lob:"GCIB" },
  { alertId:"ALR-0016", date:"2023-11-14", alertType:"Country Risk", priority:"Medium", tier:"L1", originator:"Summit Bank", beneficiary:"Manchester Trade", countries:["US","GB"], hoursToReview:26, slaStatus:"breached", disposition:"false_positive", makerId:"MKR-022", checkerId:"CHK-020", lob:"GTS" },
  { alertId:"ALR-0017", date:"2023-11-15", alertType:"Name Match", priority:"High", tier:"L1", originator:"BofA Corp", beneficiary:"Bristol Exports", countries:["US","GB"], hoursToReview:28, slaStatus:"breached", disposition:"false_positive", makerId:"MKR-012", checkerId:"CHK-004", lob:"GCB" },
  { alertId:"ALR-0018", date:"2023-11-16", alertType:"Entity Screen", priority:"Medium", tier:"L2", originator:"Westside Finance", beneficiary:"Edinburgh Trust", countries:["US","GB"], hoursToReview:52, slaStatus:"met", disposition:"false_positive", makerId:"MKR-019", checkerId:"CHK-017", lob:"GWIM" },
  { alertId:"ALR-0019", date:"2023-11-20", alertType:"Transaction Monitor", priority:"Low", tier:"L1", originator:"Coastal Trade", beneficiary:"Wellington Corp", countries:["US","NZ"], hoursToReview:71, slaStatus:"met", disposition:"false_positive", makerId:"MKR-028", checkerId:"CHK-015", lob:"GTS" },
  { alertId:"ALR-0020", date:"2023-11-26", alertType:"Name Match", priority:"High", tier:"L1", originator:"BofA Securities", beneficiary:"Havana Trust", countries:["US","CU"], hoursToReview:14, slaStatus:"met", disposition:"true_match", makerId:"MKR-004", checkerId:"CHK-002", lob:"GCIB" },

  // ── Dec 2023 ────────────────────────────────────────────────
  { alertId:"ALR-0021", date:"2023-12-01", alertType:"SDN Hit", priority:"High", tier:"L1", originator:"Central Corp", beneficiary:"Caracas Trade", countries:["US","VE"], hoursToReview:16, slaStatus:"met", disposition:"true_match", makerId:"MKR-001", checkerId:"CHK-001", lob:"GCB" },
  { alertId:"ALR-0022", date:"2023-12-05", alertType:"Entity Screen", priority:"Medium", tier:"L2", originator:"Pinnacle Bank", beneficiary:"Sofia Partners", countries:["US","BG"], hoursToReview:47, slaStatus:"met", disposition:"false_positive", makerId:"MKR-020", checkerId:"CHK-010", lob:"GTS" },
  { alertId:"ALR-0023", date:"2023-12-09", alertType:"Country Risk", priority:"High", tier:"L1", originator:"Keystone Trade", beneficiary:"Damascus Corp", countries:["US","SY"], hoursToReview:19, slaStatus:"met", disposition:"true_match", makerId:"MKR-006", checkerId:"CHK-007", lob:"GCB" },
  { alertId:"ALR-0024", date:"2023-12-12", alertType:"Name Match", priority:"Medium", tier:"L1", originator:"Highland Finance", beneficiary:"Minsk Holdings", countries:["US","BY"], hoursToReview:23, slaStatus:"met", disposition:"escalated", makerId:"MKR-010", checkerId:"CHK-003", lob:"GCIB" },
  { alertId:"ALR-0025", date:"2023-12-15", alertType:"Transaction Monitor", priority:"Low", tier:"L3", originator:"Venture Capital", beneficiary:"Nairobi Trust", countries:["US","KE"], hoursToReview:69, slaStatus:"met", disposition:"false_positive", makerId:"MKR-029", checkerId:"CHK-014", lob:"GWIM" },
  { alertId:"ALR-0026", date:"2023-12-18", alertType:"SDN Hit", priority:"High", tier:"L1", originator:"BofA Merrill", beneficiary:"Pyongyang Trade", countries:["US","KP"], hoursToReview:11, slaStatus:"met", disposition:"true_match", makerId:"MKR-003", checkerId:"CHK-005", lob:"GTS" },
  { alertId:"ALR-0027", date:"2023-12-21", alertType:"Entity Screen", priority:"Medium", tier:"L2", originator:"Pacific Capital", beneficiary:"Jakarta Corp", countries:["US","ID"], hoursToReview:45, slaStatus:"met", disposition:"false_positive", makerId:"MKR-017", checkerId:"CHK-009", lob:"GCB" },
  { alertId:"ALR-0028", date:"2023-12-27", alertType:"Name Match", priority:"High", tier:"L1", originator:"Summit Finance", beneficiary:"Tripoli Partners", countries:["US","LY"], hoursToReview:20, slaStatus:"met", disposition:"true_match", makerId:"MKR-005", checkerId:"CHK-006", lob:"GCIB" },

  // ── Jan 2024 ────────────────────────────────────────────────
  { alertId:"ALR-0029", date:"2024-01-04", alertType:"Country Risk", priority:"Medium", tier:"L1", originator:"First National", beneficiary:"Minsk Export", countries:["US","BY"], hoursToReview:22, slaStatus:"met", disposition:"false_positive", makerId:"MKR-013", checkerId:"CHK-008", lob:"GTS" },
  { alertId:"ALR-0030", date:"2024-01-08", alertType:"SDN Hit", priority:"High", tier:"L1", originator:"Eastern Finance", beneficiary:"Tehran Capital", countries:["US","IR"], hoursToReview:9, slaStatus:"met", disposition:"true_match", makerId:"MKR-002", checkerId:"CHK-001", lob:"GCB" },
  { alertId:"ALR-0031", date:"2024-01-12", alertType:"Transaction Monitor", priority:"Low", tier:"L2", originator:"Coastal Corp", beneficiary:"Oslo Partners", countries:["US","NO"], hoursToReview:48, slaStatus:"met", disposition:"false_positive", makerId:"MKR-025", checkerId:"CHK-012", lob:"GTS" },
  { alertId:"ALR-0032", date:"2024-01-16", alertType:"Name Match", priority:"High", tier:"L1", originator:"BofA Global", beneficiary:"Havana Holdings", countries:["US","CU"], hoursToReview:17, slaStatus:"met", disposition:"true_match", makerId:"MKR-004", checkerId:"CHK-002", lob:"GWIM" },
  { alertId:"ALR-0033", date:"2024-01-19", alertType:"Entity Screen", priority:"Medium", tier:"L1", originator:"Metro Trade", beneficiary:"Riyadh Export", countries:["US","SA"], hoursToReview:23, slaStatus:"met", disposition:"false_positive", makerId:"MKR-016", checkerId:"CHK-011", lob:"GCB" },
  { alertId:"ALR-0034", date:"2024-01-23", alertType:"Country Risk", priority:"High", tier:"L2", originator:"Crestwood Corp", beneficiary:"Sanaa Holdings", countries:["US","YE"], hoursToReview:44, slaStatus:"met", disposition:"escalated", makerId:"MKR-008", checkerId:"CHK-013", lob:"GCIB" },
  { alertId:"ALR-0035", date:"2024-01-27", alertType:"SDN Hit", priority:"High", tier:"L1", originator:"Northern Finance", beneficiary:"Volga Trade", countries:["US","RU"], hoursToReview:15, slaStatus:"met", disposition:"true_match", makerId:"MKR-007", checkerId:"CHK-004", lob:"GTS" },
  { alertId:"ALR-0036", date:"2024-01-31", alertType:"Name Match", priority:"Low", tier:"L3", originator:"Harbor Fund", beneficiary:"Accra Partners", countries:["US","GH"], hoursToReview:71, slaStatus:"met", disposition:"false_positive", makerId:"MKR-030", checkerId:"CHK-016", lob:"GWIM" },

  // ── Feb 2024 — SPIKE_002 window ─────────────────────────────
  { alertId:"ALR-0037", date:"2024-02-03", alertType:"Name Match", priority:"High", tier:"L1", originator:"Midwest Capital", beneficiary:"Frankfurt Corp", countries:["US","DE"], hoursToReview:28, slaStatus:"breached", disposition:"false_positive", makerId:"MKR-011", checkerId:"CHK-007", lob:"GCB" },
  { alertId:"ALR-0038", date:"2024-02-04", alertType:"Entity Screen", priority:"High", tier:"L1", originator:"Lakeside Finance", beneficiary:"Warsaw Trade", countries:["US","PL"], hoursToReview:30, slaStatus:"breached", disposition:"false_positive", makerId:"MKR-009", checkerId:"CHK-006", lob:"GTS" },
  { alertId:"ALR-0039", date:"2024-02-05", alertType:"SDN Hit", priority:"High", tier:"L1", originator:"BofA Risk", beneficiary:"Moscow Partners", countries:["US","RU"], hoursToReview:25, slaStatus:"breached", disposition:"true_match", makerId:"MKR-003", checkerId:"CHK-001", lob:"GCIB" },
  { alertId:"ALR-0040", date:"2024-02-06", alertType:"Country Risk", priority:"Medium", tier:"L1", originator:"Highpoint Corp", beneficiary:"Minsk Capital", countries:["US","BY"], hoursToReview:27, slaStatus:"breached", disposition:"escalated", makerId:"MKR-015", checkerId:"CHK-005", lob:"GCB" },
  { alertId:"ALR-0041", date:"2024-02-07", alertType:"Transaction Monitor", priority:"High", tier:"L2", originator:"Summit Trade", beneficiary:"Kyiv Holdings", countries:["US","UA"], hoursToReview:55, slaStatus:"breached", disposition:"false_positive", makerId:"MKR-022", checkerId:"CHK-010", lob:"GTS" },
  { alertId:"ALR-0042", date:"2024-02-08", alertType:"Name Match", priority:"High", tier:"L1", originator:"Frontier Finance", beneficiary:"Riga Trust", countries:["US","LV"], hoursToReview:29, slaStatus:"breached", disposition:"false_positive", makerId:"MKR-018", checkerId:"CHK-014", lob:"GWIM" },
  { alertId:"ALR-0043", date:"2024-02-09", alertType:"Entity Screen", priority:"High", tier:"L1", originator:"Coastal Capital", beneficiary:"Tallinn Corp", countries:["US","EE"], hoursToReview:31, slaStatus:"breached", disposition:"false_positive", makerId:"MKR-012", checkerId:"CHK-018", lob:"GCB" },
  { alertId:"ALR-0044", date:"2024-02-10", alertType:"SDN Hit", priority:"High", tier:"L1", originator:"National Corp", beneficiary:"Vilnius Trade", countries:["US","LT"], hoursToReview:28, slaStatus:"breached", disposition:"pending", makerId:"MKR-021", checkerId:"CHK-019", lob:"GTS" },
  { alertId:"ALR-0045", date:"2024-02-11", alertType:"Country Risk", priority:"High", tier:"L1", originator:"Atlantic Fund", beneficiary:"Chisinau Holdings", countries:["US","MD"], hoursToReview:27, slaStatus:"breached", disposition:"false_positive", makerId:"MKR-006", checkerId:"CHK-003", lob:"GCIB" },
  { alertId:"ALR-0046", date:"2024-02-12", alertType:"Name Match", priority:"Medium", tier:"L1", originator:"Pacific Trust", beneficiary:"Bucharest Corp", countries:["US","RO"], hoursToReview:25, slaStatus:"breached", disposition:"false_positive", makerId:"MKR-019", checkerId:"CHK-012", lob:"GCB" },
  { alertId:"ALR-0047", date:"2024-02-13", alertType:"Transaction Monitor", priority:"High", tier:"L2", originator:"Metro Finance", beneficiary:"Belgrade Trade", countries:["US","RS"], hoursToReview:52, slaStatus:"met", disposition:"false_positive", makerId:"MKR-024", checkerId:"CHK-017", lob:"GTS" },
  { alertId:"ALR-0048", date:"2024-02-14", alertType:"Entity Screen", priority:"High", tier:"L1", originator:"Keystone Finance", beneficiary:"Sarajevo Partners", countries:["US","BA"], hoursToReview:26, slaStatus:"breached", disposition:"false_positive", makerId:"MKR-010", checkerId:"CHK-008", lob:"GWIM" },
  { alertId:"ALR-0049", date:"2024-02-15", alertType:"SDN Hit", priority:"High", tier:"L1", originator:"Northern Trade", beneficiary:"Skopje Corp", countries:["US","MK"], hoursToReview:24, slaStatus:"met", disposition:"false_positive", makerId:"MKR-014", checkerId:"CHK-011", lob:"GCB" },
  { alertId:"ALR-0050", date:"2024-02-17", alertType:"Name Match", priority:"Medium", tier:"L1", originator:"Western Finance", beneficiary:"Tirana Trade", countries:["US","AL"], hoursToReview:23, slaStatus:"met", disposition:"false_positive", makerId:"MKR-023", checkerId:"CHK-020", lob:"GCIB" },

  // ── Mar 2024 (post-spike recovery) ──────────────────────────
  { alertId:"ALR-0051", date:"2024-03-01", alertType:"Country Risk", priority:"High", tier:"L1", originator:"BofA GCB", beneficiary:"Tehran Export", countries:["US","IR"], hoursToReview:18, slaStatus:"met", disposition:"true_match", makerId:"MKR-002", checkerId:"CHK-001", lob:"GCB" },
  { alertId:"ALR-0052", date:"2024-03-05", alertType:"Entity Screen", priority:"Medium", tier:"L2", originator:"Lakewood Corp", beneficiary:"Tbilisi Partners", countries:["US","GE"], hoursToReview:46, slaStatus:"met", disposition:"false_positive", makerId:"MKR-017", checkerId:"CHK-009", lob:"GTS" },
  { alertId:"ALR-0053", date:"2024-03-08", alertType:"SDN Hit", priority:"High", tier:"L1", originator:"Highland Capital", beneficiary:"Havana Corp", countries:["US","CU"], hoursToReview:12, slaStatus:"met", disposition:"true_match", makerId:"MKR-005", checkerId:"CHK-002", lob:"GCIB" },
  { alertId:"ALR-0054", date:"2024-03-12", alertType:"Transaction Monitor", priority:"Low", tier:"L3", originator:"Harbor Finance", beneficiary:"Kampala Trust", countries:["US","UG"], hoursToReview:72, slaStatus:"met", disposition:"false_positive", makerId:"MKR-028", checkerId:"CHK-015", lob:"GWIM" },
  { alertId:"ALR-0055", date:"2024-03-15", alertType:"Name Match", priority:"High", tier:"L1", originator:"Frontier Trade", beneficiary:"Volga Partners", countries:["US","RU"], hoursToReview:21, slaStatus:"met", disposition:"true_match", makerId:"MKR-007", checkerId:"CHK-004", lob:"GCB" },
  { alertId:"ALR-0056", date:"2024-03-19", alertType:"Entity Screen", priority:"Medium", tier:"L1", originator:"Summit Corp", beneficiary:"Amman Holdings", countries:["US","JO"], hoursToReview:23, slaStatus:"met", disposition:"false_positive", makerId:"MKR-016", checkerId:"CHK-008", lob:"GTS" },
  { alertId:"ALR-0057", date:"2024-03-22", alertType:"Country Risk", priority:"High", tier:"L2", originator:"Eastern Capital", beneficiary:"Donetsk Trade", countries:["US","UA"], hoursToReview:47, slaStatus:"met", disposition:"escalated", makerId:"MKR-008", checkerId:"CHK-013", lob:"GCIB" },
  { alertId:"ALR-0058", date:"2024-03-26", alertType:"SDN Hit", priority:"High", tier:"L1", originator:"Pacific Finance", beneficiary:"Pyongyang Corp", countries:["US","KP"], hoursToReview:10, slaStatus:"met", disposition:"true_match", makerId:"MKR-003", checkerId:"CHK-006", lob:"GCB" },

  // ── Apr–May 2024 ────────────────────────────────────────────
  { alertId:"ALR-0059", date:"2024-04-02", alertType:"Name Match", priority:"Medium", tier:"L1", originator:"Crestwood Finance", beneficiary:"Beirut Partners", countries:["US","LB"], hoursToReview:22, slaStatus:"met", disposition:"false_positive", makerId:"MKR-013", checkerId:"CHK-007", lob:"GTS" },
  { alertId:"ALR-0060", date:"2024-04-07", alertType:"Transaction Monitor", priority:"High", tier:"L1", originator:"Coastal Finance", beneficiary:"Sanaa Trade", countries:["US","YE"], hoursToReview:19, slaStatus:"met", disposition:"true_match", makerId:"MKR-004", checkerId:"CHK-003", lob:"GCB" },
  { alertId:"ALR-0061", date:"2024-04-11", alertType:"Entity Screen", priority:"Low", tier:"L3", originator:"National Finance", beneficiary:"Lusaka Corp", countries:["US","ZM"], hoursToReview:70, slaStatus:"met", disposition:"false_positive", makerId:"MKR-029", checkerId:"CHK-016", lob:"GWIM" },
  { alertId:"ALR-0062", date:"2024-04-15", alertType:"SDN Hit", priority:"High", tier:"L1", originator:"Meridian Corp", beneficiary:"Tehran Capital", countries:["US","IR"], hoursToReview:11, slaStatus:"met", disposition:"true_match", makerId:"MKR-001", checkerId:"CHK-001", lob:"GCIB" },
  { alertId:"ALR-0063", date:"2024-04-19", alertType:"Country Risk", priority:"Medium", tier:"L2", originator:"Western Corp", beneficiary:"Tripoli Holdings", countries:["US","LY"], hoursToReview:46, slaStatus:"met", disposition:"false_positive", makerId:"MKR-020", checkerId:"CHK-012", lob:"GCB" },
  { alertId:"ALR-0064", date:"2024-04-24", alertType:"Name Match", priority:"High", tier:"L1", originator:"Northern Capital", beneficiary:"Moscow Export", countries:["US","RU"], hoursToReview:20, slaStatus:"met", disposition:"true_match", makerId:"MKR-006", checkerId:"CHK-005", lob:"GTS" },
  { alertId:"ALR-0065", date:"2024-04-29", alertType:"Transaction Monitor", priority:"Low", tier:"L1", originator:"Southern Finance", beneficiary:"Mumbai Partners", countries:["US","IN"], hoursToReview:69, slaStatus:"met", disposition:"false_positive", makerId:"MKR-026", checkerId:"CHK-018", lob:"GCIB" },
  { alertId:"ALR-0066", date:"2024-05-03", alertType:"Entity Screen", priority:"High", tier:"L1", originator:"BofA GWIM", beneficiary:"Minsk Corp", countries:["US","BY"], hoursToReview:18, slaStatus:"met", disposition:"true_match", makerId:"MKR-009", checkerId:"CHK-002", lob:"GWIM" },
  { alertId:"ALR-0067", date:"2024-05-08", alertType:"SDN Hit", priority:"High", tier:"L2", originator:"Keystone Capital", beneficiary:"Havana Holdings", countries:["US","CU"], hoursToReview:43, slaStatus:"met", disposition:"true_match", makerId:"MKR-011", checkerId:"CHK-010", lob:"GCB" },
  { alertId:"ALR-0068", date:"2024-05-13", alertType:"Country Risk", priority:"Medium", tier:"L1", originator:"Metro Capital", beneficiary:"Caracas Trade", countries:["US","VE"], hoursToReview:23, slaStatus:"met", disposition:"false_positive", makerId:"MKR-018", checkerId:"CHK-014", lob:"GTS" },
  { alertId:"ALR-0069", date:"2024-05-17", alertType:"Name Match", priority:"Low", tier:"L3", originator:"Harbor Corp", beneficiary:"Addis Trust", countries:["US","ET"], hoursToReview:68, slaStatus:"met", disposition:"false_positive", makerId:"MKR-030", checkerId:"CHK-019", lob:"GWIM" },
  { alertId:"ALR-0070", date:"2024-05-22", alertType:"Transaction Monitor", priority:"High", tier:"L1", originator:"Pinnacle Corp", beneficiary:"Volga Export", countries:["US","RU"], hoursToReview:20, slaStatus:"met", disposition:"true_match", makerId:"MKR-005", checkerId:"CHK-004", lob:"GCB" },
  { alertId:"ALR-0071", date:"2024-05-27", alertType:"Entity Screen", priority:"Medium", tier:"L2", originator:"Summit Finance", beneficiary:"Athens Partners", countries:["US","GR"], hoursToReview:45, slaStatus:"met", disposition:"false_positive", makerId:"MKR-022", checkerId:"CHK-017", lob:"GCIB" },

  // ── Jun 2024 — SPIKE_003 window ─────────────────────────────
  { alertId:"ALR-0072", date:"2024-06-03", alertType:"SDN Hit", priority:"High", tier:"L1", originator:"BofA Corp", beneficiary:"Tbilisi Export", countries:["US","GE"], hoursToReview:14, slaStatus:"met", disposition:"true_match", makerId:"MKR-003", checkerId:"CHK-001", lob:"GCB" },
  { alertId:"ALR-0073", date:"2024-06-10", alertType:"Name Match", priority:"Medium", tier:"L1", originator:"Eastern Finance", beneficiary:"Nicosia Trade", countries:["US","CY"], hoursToReview:23, slaStatus:"met", disposition:"false_positive", makerId:"MKR-015", checkerId:"CHK-007", lob:"GTS" },
  { alertId:"ALR-0074", date:"2024-06-17", alertType:"Country Risk", priority:"High", tier:"L2", originator:"Frontier Corp", beneficiary:"Minsk Holdings", countries:["US","BY"], hoursToReview:46, slaStatus:"met", disposition:"escalated", makerId:"MKR-008", checkerId:"CHK-013", lob:"GCIB" },
  { alertId:"ALR-0075", date:"2024-06-22", alertType:"SDN Hit", priority:"High", tier:"L1", originator:"BofA Securities", beneficiary:"Ural Resources", countries:["US","RU"], hoursToReview:17, slaStatus:"met", disposition:"true_match", makerId:"MKR-002", checkerId:"CHK-001", lob:"GCB" },
  { alertId:"ALR-0076", date:"2024-06-22", alertType:"Name Match", priority:"High", tier:"L1", originator:"Atlantic Capital", beneficiary:"Kherson Trade", countries:["US","RU"], hoursToReview:19, slaStatus:"met", disposition:"true_match", makerId:"MKR-007", checkerId:"CHK-005", lob:"GTS" },
  { alertId:"ALR-0077", date:"2024-06-22", alertType:"Entity Screen", priority:"Medium", tier:"L1", originator:"Coastal Corp", beneficiary:"Donbas Holdings", countries:["US","RU"], hoursToReview:22, slaStatus:"met", disposition:"escalated", makerId:"MKR-010", checkerId:"CHK-008", lob:"GCIB" },
  { alertId:"ALR-0078", date:"2024-06-23", alertType:"Transaction Monitor", priority:"High", tier:"L2", originator:"National Finance", beneficiary:"Novorossiysk Corp", countries:["US","RU"], hoursToReview:44, slaStatus:"met", disposition:"true_match", makerId:"MKR-021", checkerId:"CHK-011", lob:"GCB" },
  { alertId:"ALR-0079", date:"2024-06-24", alertType:"Country Risk", priority:"High", tier:"L1", originator:"Summit Capital", beneficiary:"Volga Energy RU", countries:["US","RU"], hoursToReview:20, slaStatus:"met", disposition:"true_match", makerId:"MKR-006", checkerId:"CHK-003", lob:"GTS" },
  { alertId:"ALR-0080", date:"2024-06-28", alertType:"SDN Hit", priority:"High", tier:"L1", originator:"Harbor Finance", beneficiary:"Tehran Partners", countries:["US","IR"], hoursToReview:12, slaStatus:"met", disposition:"true_match", makerId:"MKR-004", checkerId:"CHK-002", lob:"GCB" },

  // ── Jul–Sep 2024 ────────────────────────────────────────────
  { alertId:"ALR-0081", date:"2024-07-05", alertType:"Name Match", priority:"Medium", tier:"L1", originator:"Lakewood Finance", beneficiary:"Sofia Trade", countries:["US","BG"], hoursToReview:23, slaStatus:"met", disposition:"false_positive", makerId:"MKR-016", checkerId:"CHK-009", lob:"GTS" },
  { alertId:"ALR-0082", date:"2024-07-10", alertType:"Entity Screen", priority:"Low", tier:"L3", originator:"Pacific Corp", beneficiary:"Kinshasa Trust", countries:["US","CD"], hoursToReview:70, slaStatus:"met", disposition:"false_positive", makerId:"MKR-027", checkerId:"CHK-016", lob:"GWIM" },
  { alertId:"ALR-0083", date:"2024-07-15", alertType:"Transaction Monitor", priority:"High", tier:"L1", originator:"Keystone Finance", beneficiary:"Havana Export", countries:["US","CU"], hoursToReview:18, slaStatus:"met", disposition:"true_match", makerId:"MKR-005", checkerId:"CHK-004", lob:"GCB" },
  { alertId:"ALR-0084", date:"2024-07-20", alertType:"SDN Hit", priority:"High", tier:"L2", originator:"Meridian Capital", beneficiary:"Pyongyang Holdings", countries:["US","KP"], hoursToReview:43, slaStatus:"met", disposition:"true_match", makerId:"MKR-003", checkerId:"CHK-006", lob:"GCIB" },
  { alertId:"ALR-0085", date:"2024-07-25", alertType:"Country Risk", priority:"Medium", tier:"L1", originator:"Western Finance", beneficiary:"Minsk Corp", countries:["US","BY"], hoursToReview:22, slaStatus:"met", disposition:"false_positive", makerId:"MKR-019", checkerId:"CHK-012", lob:"GTS" },
  { alertId:"ALR-0086", date:"2024-07-30", alertType:"Name Match", priority:"High", tier:"L1", originator:"Northern Corp", beneficiary:"Caracas Partners", countries:["US","VE"], hoursToReview:19, slaStatus:"met", disposition:"true_match", makerId:"MKR-009", checkerId:"CHK-007", lob:"GCB" },
  { alertId:"ALR-0087", date:"2024-08-05", alertType:"Entity Screen", priority:"Medium", tier:"L2", originator:"Southern Capital", beneficiary:"Tripoli Corp", countries:["US","LY"], hoursToReview:46, slaStatus:"met", disposition:"false_positive", makerId:"MKR-023", checkerId:"CHK-017", lob:"GTS" },
  { alertId:"ALR-0088", date:"2024-08-12", alertType:"Transaction Monitor", priority:"Low", tier:"L3", originator:"Harbor Corp", beneficiary:"Dakar Trust", countries:["US","SN"], hoursToReview:71, slaStatus:"met", disposition:"false_positive", makerId:"MKR-028", checkerId:"CHK-015", lob:"GWIM" },
  { alertId:"ALR-0089", date:"2024-08-19", alertType:"SDN Hit", priority:"High", tier:"L1", originator:"Crestwood Finance", beneficiary:"Tehran Trade", countries:["US","IR"], hoursToReview:13, slaStatus:"met", disposition:"true_match", makerId:"MKR-002", checkerId:"CHK-001", lob:"GCB" },
  { alertId:"ALR-0090", date:"2024-08-26", alertType:"Country Risk", priority:"High", tier:"L1", originator:"Pinnacle Finance", beneficiary:"Damascus Partners", countries:["US","SY"], hoursToReview:20, slaStatus:"met", disposition:"true_match", makerId:"MKR-006", checkerId:"CHK-005", lob:"GCIB" },
  { alertId:"ALR-0091", date:"2024-09-02", alertType:"Name Match", priority:"Medium", tier:"L1", originator:"BofA GTS", beneficiary:"Tashkent Corp", countries:["US","UZ"], hoursToReview:23, slaStatus:"met", disposition:"false_positive", makerId:"MKR-014", checkerId:"CHK-008", lob:"GTS" },
  { alertId:"ALR-0092", date:"2024-09-09", alertType:"Entity Screen", priority:"High", tier:"L2", originator:"Frontier Finance", beneficiary:"Baku Holdings", countries:["US","AZ"], hoursToReview:45, slaStatus:"met", disposition:"false_positive", makerId:"MKR-020", checkerId:"CHK-010", lob:"GCB" },
  { alertId:"ALR-0093", date:"2024-09-16", alertType:"Transaction Monitor", priority:"High", tier:"L1", originator:"Metro Corp", beneficiary:"Volga Holdings", countries:["US","RU"], hoursToReview:21, slaStatus:"met", disposition:"true_match", makerId:"MKR-007", checkerId:"CHK-003", lob:"GCIB" },
  { alertId:"ALR-0094", date:"2024-09-23", alertType:"SDN Hit", priority:"High", tier:"L1", originator:"Central Finance", beneficiary:"Pyongyang Trade", countries:["US","KP"], hoursToReview:11, slaStatus:"met", disposition:"true_match", makerId:"MKR-003", checkerId:"CHK-002", lob:"GCB" },
  { alertId:"ALR-0095", date:"2024-09-30", alertType:"Country Risk", priority:"Medium", tier:"L1", originator:"Atlantic Corp", beneficiary:"Minsk Export", countries:["US","BY"], hoursToReview:23, slaStatus:"met", disposition:"false_positive", makerId:"MKR-018", checkerId:"CHK-014", lob:"GTS" },

  // ── Oct 2024 — SPIKE_004 window ─────────────────────────────
  { alertId:"ALR-0096", date:"2024-10-01", alertType:"Name Match", priority:"High", tier:"L1", originator:"BofA Corp", beneficiary:"Caracas Corp", countries:["US","VE"], hoursToReview:19, slaStatus:"met", disposition:"true_match", makerId:"MKR-005", checkerId:"CHK-004", lob:"GCB" },
  { alertId:"ALR-0097", date:"2024-10-08", alertType:"Entity Screen", priority:"High", tier:"L1", originator:"Eastern Finance", beneficiary:"Lagos Partners", countries:["US","NG"], hoursToReview:26, slaStatus:"met", disposition:"false_positive", makerId:"MKR-012", checkerId:"CHK-009", lob:"GTS" },
  { alertId:"ALR-0098", date:"2024-10-09", alertType:"SDN Hit", priority:"High", tier:"L1", originator:"Western Corp", beneficiary:"Tehran Holdings", countries:["US","IR"], hoursToReview:23, slaStatus:"met", disposition:"true_match", makerId:"MKR-004", checkerId:"CHK-001", lob:"GCB" },
  { alertId:"ALR-0099", date:"2024-10-10", alertType:"Transaction Monitor", priority:"Medium", tier:"L2", originator:"Northern Finance", beneficiary:"Minsk Trade", countries:["US","BY"], hoursToReview:50, slaStatus:"met", disposition:"false_positive", makerId:"MKR-024", checkerId:"CHK-013", lob:"GCIB" },
  { alertId:"ALR-0100", date:"2024-10-12", alertType:"Name Match", priority:"High", tier:"L1", originator:"Lakewood Corp", beneficiary:"Volga Export", countries:["US","RU"], hoursToReview:25, slaStatus:"met", disposition:"true_match", makerId:"MKR-008", checkerId:"CHK-006", lob:"GTS" },
  { alertId:"ALR-0101", date:"2024-10-14", alertType:"Country Risk", priority:"High", tier:"L1", originator:"Keystone Corp", beneficiary:"Damascus Corp", countries:["US","SY"], hoursToReview:24, slaStatus:"met", disposition:"true_match", makerId:"MKR-006", checkerId:"CHK-005", lob:"GCB" },
  { alertId:"ALR-0102", date:"2024-10-17", alertType:"Entity Screen", priority:"Medium", tier:"L1", originator:"Coastal Capital", beneficiary:"Havana Trade", countries:["US","CU"], hoursToReview:23, slaStatus:"met", disposition:"false_positive", makerId:"MKR-016", checkerId:"CHK-011", lob:"GCIB" },
  { alertId:"ALR-0103", date:"2024-10-22", alertType:"SDN Hit", priority:"High", tier:"L1", originator:"BofA GCB", beneficiary:"Pyongyang Corp", countries:["US","KP"], hoursToReview:12, slaStatus:"met", disposition:"true_match", makerId:"MKR-002", checkerId:"CHK-002", lob:"GCB" },
  { alertId:"ALR-0104", date:"2024-10-28", alertType:"Name Match", priority:"Low", tier:"L3", originator:"Pacific Finance", beneficiary:"Maputo Trust", countries:["US","MZ"], hoursToReview:70, slaStatus:"met", disposition:"false_positive", makerId:"MKR-029", checkerId:"CHK-015", lob:"GWIM" },

  // ── Nov–Dec 2024 ────────────────────────────────────────────
  { alertId:"ALR-0105", date:"2024-11-04", alertType:"Country Risk", priority:"High", tier:"L2", originator:"Summit Capital", beneficiary:"Tripoli Trade", countries:["US","LY"], hoursToReview:47, slaStatus:"met", disposition:"escalated", makerId:"MKR-011", checkerId:"CHK-010", lob:"GCB" },
  { alertId:"ALR-0106", date:"2024-11-08", alertType:"Transaction Monitor", priority:"Medium", tier:"L1", originator:"Harbor Finance", beneficiary:"Tirana Corp", countries:["US","AL"], hoursToReview:23, slaStatus:"met", disposition:"false_positive", makerId:"MKR-017", checkerId:"CHK-008", lob:"GTS" },
  { alertId:"ALR-0107", date:"2024-11-13", alertType:"SDN Hit", priority:"High", tier:"L1", originator:"Meridian Finance", beneficiary:"Tehran Capital", countries:["US","IR"], hoursToReview:14, slaStatus:"met", disposition:"true_match", makerId:"MKR-003", checkerId:"CHK-001", lob:"GCIB" },
  { alertId:"ALR-0108", date:"2024-11-18", alertType:"Name Match", priority:"Medium", tier:"L1", originator:"Atlantic Finance", beneficiary:"Sanaa Partners", countries:["US","YE"], hoursToReview:22, slaStatus:"met", disposition:"false_positive", makerId:"MKR-020", checkerId:"CHK-012", lob:"GCB" },
  { alertId:"ALR-0109", date:"2024-11-22", alertType:"Entity Screen", priority:"High", tier:"L1", originator:"Central Corp", beneficiary:"Minsk Corp", countries:["US","BY"], hoursToReview:19, slaStatus:"met", disposition:"true_match", makerId:"MKR-007", checkerId:"CHK-007", lob:"GTS" },
  { alertId:"ALR-0110", date:"2024-11-27", alertType:"Transaction Monitor", priority:"Low", tier:"L3", originator:"Eastern Corp", beneficiary:"Bangui Trust", countries:["US","CF"], hoursToReview:71, slaStatus:"met", disposition:"false_positive", makerId:"MKR-030", checkerId:"CHK-019", lob:"GWIM" },
  { alertId:"ALR-0111", date:"2024-12-03", alertType:"Country Risk", priority:"High", tier:"L1", originator:"Northern Finance", beneficiary:"Volga Corp", countries:["US","RU"], hoursToReview:20, slaStatus:"met", disposition:"true_match", makerId:"MKR-005", checkerId:"CHK-004", lob:"GCB" },
  { alertId:"ALR-0112", date:"2024-12-09", alertType:"SDN Hit", priority:"High", tier:"L2", originator:"Western Capital", beneficiary:"Havana Holdings", countries:["US","CU"], hoursToReview:44, slaStatus:"met", disposition:"true_match", makerId:"MKR-009", checkerId:"CHK-006", lob:"GTS" },
  { alertId:"ALR-0113", date:"2024-12-14", alertType:"Name Match", priority:"Medium", tier:"L1", originator:"Crestwood Corp", beneficiary:"Tashkent Trade", countries:["US","UZ"], hoursToReview:23, slaStatus:"met", disposition:"false_positive", makerId:"MKR-015", checkerId:"CHK-009", lob:"GCIB" },
  { alertId:"ALR-0114", date:"2024-12-19", alertType:"Entity Screen", priority:"High", tier:"L1", originator:"Pinnacle Finance", beneficiary:"Damascus Trade", countries:["US","SY"], hoursToReview:18, slaStatus:"met", disposition:"true_match", makerId:"MKR-006", checkerId:"CHK-003", lob:"GCB" },
  { alertId:"ALR-0115", date:"2024-12-24", alertType:"Transaction Monitor", priority:"Low", tier:"L3", originator:"BofA GWIM", beneficiary:"Nairobi Corp", countries:["US","KE"], hoursToReview:70, slaStatus:"met", disposition:"false_positive", makerId:"MKR-027", checkerId:"CHK-016", lob:"GWIM" },
  { alertId:"ALR-0116", date:"2024-12-30", alertType:"Country Risk", priority:"High", tier:"L1", originator:"Pacific Capital", beneficiary:"Pyongyang Holdings", countries:["US","KP"], hoursToReview:15, slaStatus:"met", disposition:"true_match", makerId:"MKR-003", checkerId:"CHK-002", lob:"GCB" },

  // ── Jan 2025 — SPIKE_005 window ─────────────────────────────
  { alertId:"ALR-0117", date:"2025-01-06", alertType:"SDN Hit", priority:"High", tier:"L1", originator:"Lakewood Finance", beneficiary:"Tehran Export", countries:["US","IR"], hoursToReview:13, slaStatus:"met", disposition:"true_match", makerId:"MKR-004", checkerId:"CHK-001", lob:"GTS" },
  { alertId:"ALR-0118", date:"2025-01-10", alertType:"Name Match", priority:"Medium", tier:"L2", originator:"Highland Corp", beneficiary:"Cairo Partners", countries:["US","EG"], hoursToReview:46, slaStatus:"met", disposition:"false_positive", makerId:"MKR-022", checkerId:"CHK-013", lob:"GCB" },
  { alertId:"ALR-0119", date:"2025-01-15", alertType:"Entity Screen", priority:"High", tier:"L1", originator:"Summit Finance", beneficiary:"Volga Trade", countries:["US","RU"], hoursToReview:26, slaStatus:"met", disposition:"escalated", makerId:"MKR-011", checkerId:"CHK-010", lob:"GCIB" },
  { alertId:"ALR-0120", date:"2025-01-15", alertType:"Transaction Monitor", priority:"High", tier:"L1", originator:"Metro Corp", beneficiary:"Minsk Export", countries:["US","BY"], hoursToReview:27, slaStatus:"met", disposition:"false_positive", makerId:"MKR-018", checkerId:"CHK-014", lob:"GTS" },
  { alertId:"ALR-0121", date:"2025-01-16", alertType:"SDN Hit", priority:"High", tier:"L1", originator:"Coastal Finance", beneficiary:"Havana Corp", countries:["US","CU"], hoursToReview:25, slaStatus:"met", disposition:"true_match", makerId:"MKR-002", checkerId:"CHK-005", lob:"GCB" },
  { alertId:"ALR-0122", date:"2025-01-17", alertType:"Country Risk", priority:"Medium", tier:"L1", originator:"Frontier Finance", beneficiary:"Damascus Partners", countries:["US","SY"], hoursToReview:24, slaStatus:"met", disposition:"false_positive", makerId:"MKR-014", checkerId:"CHK-008", lob:"GCB" },
  { alertId:"ALR-0123", date:"2025-01-18", alertType:"Name Match", priority:"High", tier:"L1", originator:"Eastern Corp", beneficiary:"Caracas Trade", countries:["US","VE"], hoursToReview:26, slaStatus:"met", disposition:"true_match", makerId:"MKR-007", checkerId:"CHK-004", lob:"GCIB" },
  { alertId:"ALR-0124", date:"2025-01-20", alertType:"Entity Screen", priority:"Medium", tier:"L2", originator:"National Finance", beneficiary:"Baku Corp", countries:["US","AZ"], hoursToReview:49, slaStatus:"met", disposition:"false_positive", makerId:"MKR-025", checkerId:"CHK-017", lob:"GTS" },
  { alertId:"ALR-0125", date:"2025-01-22", alertType:"Transaction Monitor", priority:"High", tier:"L1", originator:"Western Finance", beneficiary:"Volga Holdings", countries:["US","RU"], hoursToReview:25, slaStatus:"met", disposition:"true_match", makerId:"MKR-006", checkerId:"CHK-003", lob:"GCB" },
  { alertId:"ALR-0126", date:"2025-01-28", alertType:"SDN Hit", priority:"High", tier:"L1", originator:"Harbor Capital", beneficiary:"Pyongyang Trade", countries:["US","KP"], hoursToReview:12, slaStatus:"met", disposition:"true_match", makerId:"MKR-003", checkerId:"CHK-001", lob:"GCB" },

  // ── Feb–Mar 2025 ────────────────────────────────────────────
  { alertId:"ALR-0127", date:"2025-02-03", alertType:"Country Risk", priority:"Medium", tier:"L1", originator:"Crestwood Corp", beneficiary:"Tripoli Corp", countries:["US","LY"], hoursToReview:22, slaStatus:"met", disposition:"false_positive", makerId:"MKR-019", checkerId:"CHK-012", lob:"GTS" },
  { alertId:"ALR-0128", date:"2025-02-07", alertType:"Name Match", priority:"High", tier:"L1", originator:"Pacific Finance", beneficiary:"Tehran Trade", countries:["US","IR"], hoursToReview:17, slaStatus:"met", disposition:"true_match", makerId:"MKR-005", checkerId:"CHK-002", lob:"GCB" },
  { alertId:"ALR-0129", date:"2025-02-12", alertType:"Entity Screen", priority:"Low", tier:"L3", originator:"BofA Wealth", beneficiary:"Lome Trust", countries:["US","TG"], hoursToReview:72, slaStatus:"met", disposition:"false_positive", makerId:"MKR-028", checkerId:"CHK-015", lob:"GWIM" },
  { alertId:"ALR-0130", date:"2025-02-17", alertType:"SDN Hit", priority:"High", tier:"L2", originator:"Summit Corp", beneficiary:"Minsk Holdings", countries:["US","BY"], hoursToReview:45, slaStatus:"met", disposition:"true_match", makerId:"MKR-009", checkerId:"CHK-006", lob:"GCB" },
  { alertId:"ALR-0131", date:"2025-02-21", alertType:"Transaction Monitor", priority:"Medium", tier:"L1", originator:"Northern Capital", beneficiary:"Damascus Corp", countries:["US","SY"], hoursToReview:23, slaStatus:"met", disposition:"false_positive", makerId:"MKR-016", checkerId:"CHK-009", lob:"GTS" },
  { alertId:"ALR-0132", date:"2025-02-25", alertType:"Country Risk", priority:"High", tier:"L1", originator:"Keystone Finance", beneficiary:"Caracas Holdings", countries:["US","VE"], hoursToReview:19, slaStatus:"met", disposition:"true_match", makerId:"MKR-007", checkerId:"CHK-007", lob:"GCIB" },
  { alertId:"ALR-0133", date:"2025-03-01", alertType:"SDN Hit", priority:"High", tier:"L1", originator:"Atlantic Corp", beneficiary:"Havana Trade", countries:["US","CU"], hoursToReview:14, slaStatus:"met", disposition:"true_match", makerId:"MKR-004", checkerId:"CHK-004", lob:"GCB" },
  { alertId:"ALR-0134", date:"2025-03-06", alertType:"Name Match", priority:"Medium", tier:"L2", originator:"Metro Finance", beneficiary:"Tashkent Corp", countries:["US","UZ"], hoursToReview:47, slaStatus:"met", disposition:"false_positive", makerId:"MKR-021", checkerId:"CHK-011", lob:"GTS" },
  { alertId:"ALR-0135", date:"2025-03-11", alertType:"Entity Screen", priority:"High", tier:"L1", originator:"Eastern Capital", beneficiary:"Tehran Corp", countries:["US","IR"], hoursToReview:18, slaStatus:"met", disposition:"true_match", makerId:"MKR-002", checkerId:"CHK-001", lob:"GCB" },
  { alertId:"ALR-0136", date:"2025-03-17", alertType:"Transaction Monitor", priority:"Low", tier:"L3", originator:"Frontier Corp", beneficiary:"Bamako Trust", countries:["US","ML"], hoursToReview:70, slaStatus:"met", disposition:"false_positive", makerId:"MKR-029", checkerId:"CHK-016", lob:"GWIM" },
  { alertId:"ALR-0137", date:"2025-03-22", alertType:"Country Risk", priority:"High", tier:"L1", originator:"Highland Finance", beneficiary:"Pyongyang Corp", countries:["US","KP"], hoursToReview:16, slaStatus:"met", disposition:"true_match", makerId:"MKR-006", checkerId:"CHK-003", lob:"GCB" },

  // ── Apr–Jun 2025 ────────────────────────────────────────────
  { alertId:"ALR-0138", date:"2025-04-02", alertType:"SDN Hit", priority:"High", tier:"L1", originator:"National Corp", beneficiary:"Volga Partners", countries:["US","RU"], hoursToReview:15, slaStatus:"met", disposition:"true_match", makerId:"MKR-003", checkerId:"CHK-002", lob:"GTS" },
  { alertId:"ALR-0139", date:"2025-04-09", alertType:"Name Match", priority:"Medium", tier:"L1", originator:"Lakewood Corp", beneficiary:"Sanaa Corp", countries:["US","YE"], hoursToReview:23, slaStatus:"met", disposition:"false_positive", makerId:"MKR-013", checkerId:"CHK-008", lob:"GCB" },
  { alertId:"ALR-0140", date:"2025-04-15", alertType:"Entity Screen", priority:"High", tier:"L2", originator:"Western Finance", beneficiary:"Minsk Trade", countries:["US","BY"], hoursToReview:46, slaStatus:"met", disposition:"escalated", makerId:"MKR-011", checkerId:"CHK-010", lob:"GCIB" },
  { alertId:"ALR-0141", date:"2025-04-22", alertType:"Transaction Monitor", priority:"High", tier:"L1", originator:"Southern Corp", beneficiary:"Tehran Trade", countries:["US","IR"], hoursToReview:20, slaStatus:"met", disposition:"true_match", makerId:"MKR-005", checkerId:"CHK-005", lob:"GCB" },
  { alertId:"ALR-0142", date:"2025-04-29", alertType:"Country Risk", priority:"Medium", tier:"L1", originator:"Coastal Finance", beneficiary:"Damascus Trade", countries:["US","SY"], hoursToReview:22, slaStatus:"met", disposition:"false_positive", makerId:"MKR-018", checkerId:"CHK-014", lob:"GTS" },
  { alertId:"ALR-0143", date:"2025-05-06", alertType:"SDN Hit", priority:"High", tier:"L1", originator:"BofA GCIB", beneficiary:"Havana Holdings", countries:["US","CU"], hoursToReview:13, slaStatus:"met", disposition:"true_match", makerId:"MKR-007", checkerId:"CHK-004", lob:"GCIB" },
  { alertId:"ALR-0144", date:"2025-05-13", alertType:"Name Match", priority:"Low", tier:"L3", originator:"Pacific Corp", beneficiary:"Niamey Trust", countries:["US","NE"], hoursToReview:71, slaStatus:"met", disposition:"false_positive", makerId:"MKR-030", checkerId:"CHK-019", lob:"GWIM" },
  { alertId:"ALR-0145", date:"2025-05-20", alertType:"Entity Screen", priority:"High", tier:"L1", originator:"Meridian Finance", beneficiary:"Volga Corp", countries:["US","RU"], hoursToReview:19, slaStatus:"met", disposition:"true_match", makerId:"MKR-004", checkerId:"CHK-001", lob:"GCB" },
  { alertId:"ALR-0146", date:"2025-05-27", alertType:"Transaction Monitor", priority:"Medium", tier:"L2", originator:"Harbor Finance", beneficiary:"Caracas Corp", countries:["US","VE"], hoursToReview:47, slaStatus:"met", disposition:"false_positive", makerId:"MKR-022", checkerId:"CHK-013", lob:"GTS" },
  { alertId:"ALR-0147", date:"2025-06-03", alertType:"Country Risk", priority:"High", tier:"L1", originator:"Pinnacle Corp", beneficiary:"Pyongyang Trade", countries:["US","KP"], hoursToReview:14, slaStatus:"met", disposition:"true_match", makerId:"MKR-002", checkerId:"CHK-002", lob:"GCB" },
  { alertId:"ALR-0148", date:"2025-06-10", alertType:"SDN Hit", priority:"High", tier:"L2", originator:"Atlantic Finance", beneficiary:"Tehran Holdings", countries:["US","IR"], hoursToReview:44, slaStatus:"met", disposition:"true_match", makerId:"MKR-009", checkerId:"CHK-006", lob:"GCIB" },
  { alertId:"ALR-0149", date:"2025-06-17", alertType:"Name Match", priority:"Medium", tier:"L1", originator:"Northern Corp", beneficiary:"Minsk Corp", countries:["US","BY"], hoursToReview:23, slaStatus:"met", disposition:"false_positive", makerId:"MKR-015", checkerId:"CHK-007", lob:"GTS" },
  { alertId:"ALR-0150", date:"2025-06-24", alertType:"Entity Screen", priority:"High", tier:"L1", originator:"Keystone Corp", beneficiary:"Damascus Corp", countries:["US","SY"], hoursToReview:18, slaStatus:"met", disposition:"true_match", makerId:"MKR-006", checkerId:"CHK-003", lob:"GCB" },

  // ── Jul–Sep 2025 ────────────────────────────────────────────
  { alertId:"ALR-0151", date:"2025-07-07", alertType:"Transaction Monitor", priority:"High", tier:"L1", originator:"Summit Finance", beneficiary:"Havana Trade", countries:["US","CU"], hoursToReview:20, slaStatus:"met", disposition:"true_match", makerId:"MKR-005", checkerId:"CHK-004", lob:"GCB" },
  { alertId:"ALR-0152", date:"2025-07-14", alertType:"Country Risk", priority:"Medium", tier:"L1", originator:"Eastern Finance", beneficiary:"Tripoli Trade", countries:["US","LY"], hoursToReview:22, slaStatus:"met", disposition:"false_positive", makerId:"MKR-017", checkerId:"CHK-009", lob:"GTS" },
  { alertId:"ALR-0153", date:"2025-07-21", alertType:"SDN Hit", priority:"High", tier:"L1", originator:"Crestwood Corp", beneficiary:"Volga Trade", countries:["US","RU"], hoursToReview:15, slaStatus:"met", disposition:"true_match", makerId:"MKR-003", checkerId:"CHK-001", lob:"GCB" },
  { alertId:"ALR-0154", date:"2025-07-28", alertType:"Name Match", priority:"Low", tier:"L3", originator:"BofA Wealth", beneficiary:"Conakry Trust", countries:["US","GN"], hoursToReview:70, slaStatus:"met", disposition:"false_positive", makerId:"MKR-027", checkerId:"CHK-016", lob:"GWIM" },
  { alertId:"ALR-0155", date:"2025-08-04", alertType:"Entity Screen", priority:"High", tier:"L2", originator:"Metro Finance", beneficiary:"Sanaa Holdings", countries:["US","YE"], hoursToReview:46, slaStatus:"met", disposition:"escalated", makerId:"MKR-011", checkerId:"CHK-010", lob:"GCIB" },
  { alertId:"ALR-0156", date:"2025-08-11", alertType:"Transaction Monitor", priority:"High", tier:"L1", originator:"Frontier Finance", beneficiary:"Tehran Export", countries:["US","IR"], hoursToReview:17, slaStatus:"met", disposition:"true_match", makerId:"MKR-007", checkerId:"CHK-005", lob:"GCB" },
  { alertId:"ALR-0157", date:"2025-08-18", alertType:"Country Risk", priority:"Medium", tier:"L1", originator:"Coastal Corp", beneficiary:"Pyongyang Corp", countries:["US","KP"], hoursToReview:21, slaStatus:"met", disposition:"true_match", makerId:"MKR-020", checkerId:"CHK-012", lob:"GTS" },
  { alertId:"ALR-0158", date:"2025-08-25", alertType:"SDN Hit", priority:"High", tier:"L1", originator:"Lakewood Finance", beneficiary:"Minsk Trade", countries:["US","BY"], hoursToReview:14, slaStatus:"met", disposition:"true_match", makerId:"MKR-004", checkerId:"CHK-002", lob:"GCB" },
  { alertId:"ALR-0159", date:"2025-09-01", alertType:"Name Match", priority:"Medium", tier:"L2", originator:"National Finance", beneficiary:"Caracas Trade", countries:["US","VE"], hoursToReview:47, slaStatus:"met", disposition:"false_positive", makerId:"MKR-023", checkerId:"CHK-017", lob:"GCIB" },
  { alertId:"ALR-0160", date:"2025-09-08", alertType:"Entity Screen", priority:"High", tier:"L1", originator:"Pacific Corp", beneficiary:"Damascus Trade", countries:["US","SY"], hoursToReview:19, slaStatus:"met", disposition:"true_match", makerId:"MKR-006", checkerId:"CHK-003", lob:"GCB" },
  { alertId:"ALR-0161", date:"2025-09-15", alertType:"Transaction Monitor", priority:"Low", tier:"L3", originator:"Harbor Corp", beneficiary:"Libreville Trust", countries:["US","GA"], hoursToReview:72, slaStatus:"met", disposition:"false_positive", makerId:"MKR-028", checkerId:"CHK-015", lob:"GWIM" },
  { alertId:"ALR-0162", date:"2025-09-22", alertType:"Country Risk", priority:"High", tier:"L1", originator:"Highland Corp", beneficiary:"Tehran Partners", countries:["US","IR"], hoursToReview:16, slaStatus:"met", disposition:"true_match", makerId:"MKR-002", checkerId:"CHK-001", lob:"GCB" },
  { alertId:"ALR-0163", date:"2025-09-29", alertType:"SDN Hit", priority:"High", tier:"L2", originator:"Western Finance", beneficiary:"Havana Corp", countries:["US","CU"], hoursToReview:44, slaStatus:"met", disposition:"true_match", makerId:"MKR-009", checkerId:"CHK-006", lob:"GTS" },

  // ── Oct–Dec 2025 ────────────────────────────────────────────
  { alertId:"ALR-0164", date:"2025-10-06", alertType:"Name Match", priority:"High", tier:"L1", originator:"Meridian Corp", beneficiary:"Volga Partners", countries:["US","RU"], hoursToReview:20, slaStatus:"met", disposition:"true_match", makerId:"MKR-005", checkerId:"CHK-004", lob:"GCB" },
  { alertId:"ALR-0165", date:"2025-10-13", alertType:"Entity Screen", priority:"Medium", tier:"L1", originator:"Summit Corp", beneficiary:"Tripoli Corp", countries:["US","LY"], hoursToReview:23, slaStatus:"met", disposition:"false_positive", makerId:"MKR-014", checkerId:"CHK-008", lob:"GCIB" },
  { alertId:"ALR-0166", date:"2025-10-20", alertType:"Transaction Monitor", priority:"High", tier:"L1", originator:"Northern Finance", beneficiary:"Minsk Corp", countries:["US","BY"], hoursToReview:19, slaStatus:"met", disposition:"true_match", makerId:"MKR-007", checkerId:"CHK-007", lob:"GCB" },
  { alertId:"ALR-0167", date:"2025-10-27", alertType:"Country Risk", priority:"Low", tier:"L3", originator:"BofA GTS", beneficiary:"Abidjan Trust", countries:["US","CI"], hoursToReview:71, slaStatus:"met", disposition:"false_positive", makerId:"MKR-030", checkerId:"CHK-019", lob:"GWIM" },
  { alertId:"ALR-0168", date:"2025-11-03", alertType:"SDN Hit", priority:"High", tier:"L1", originator:"Coastal Finance", beneficiary:"Pyongyang Trade", countries:["US","KP"], hoursToReview:13, slaStatus:"met", disposition:"true_match", makerId:"MKR-003", checkerId:"CHK-002", lob:"GCB" },
  { alertId:"ALR-0169", date:"2025-11-10", alertType:"Name Match", priority:"Medium", tier:"L2", originator:"Eastern Corp", beneficiary:"Damascus Partners", countries:["US","SY"], hoursToReview:46, slaStatus:"met", disposition:"false_positive", makerId:"MKR-021", checkerId:"CHK-011", lob:"GTS" },
  { alertId:"ALR-0170", date:"2025-11-17", alertType:"Entity Screen", priority:"High", tier:"L1", originator:"Keystone Finance", beneficiary:"Sanaa Corp", countries:["US","YE"], hoursToReview:18, slaStatus:"met", disposition:"true_match", makerId:"MKR-006", checkerId:"CHK-003", lob:"GCB" },
  { alertId:"ALR-0171", date:"2025-11-24", alertType:"Transaction Monitor", priority:"High", tier:"L1", originator:"Atlantic Corp", beneficiary:"Tehran Trade", countries:["US","IR"], hoursToReview:20, slaStatus:"met", disposition:"true_match", makerId:"MKR-004", checkerId:"CHK-001", lob:"GCIB" },
  { alertId:"ALR-0172", date:"2025-12-01", alertType:"Country Risk", priority:"Medium", tier:"L1", originator:"Frontier Finance", beneficiary:"Caracas Holdings", countries:["US","VE"], hoursToReview:22, slaStatus:"met", disposition:"false_positive", makerId:"MKR-016", checkerId:"CHK-009", lob:"GCB" },
  { alertId:"ALR-0173", date:"2025-12-08", alertType:"SDN Hit", priority:"High", tier:"L1", originator:"Pacific Finance", beneficiary:"Volga Trade", countries:["US","RU"], hoursToReview:15, slaStatus:"met", disposition:"true_match", makerId:"MKR-002", checkerId:"CHK-005", lob:"GTS" },
  { alertId:"ALR-0174", date:"2025-12-15", alertType:"Name Match", priority:"Low", tier:"L3", originator:"Harbor Corp", beneficiary:"Bangui Corp", countries:["US","CF"], hoursToReview:70, slaStatus:"met", disposition:"false_positive", makerId:"MKR-029", checkerId:"CHK-016", lob:"GWIM" },
  { alertId:"ALR-0175", date:"2025-12-22", alertType:"Entity Screen", priority:"High", tier:"L2", originator:"National Corp", beneficiary:"Havana Trade", countries:["US","CU"], hoursToReview:45, slaStatus:"met", disposition:"true_match", makerId:"MKR-011", checkerId:"CHK-010", lob:"GCB" },
  { alertId:"ALR-0176", date:"2025-12-29", alertType:"Transaction Monitor", priority:"High", tier:"L1", originator:"Lakewood Corp", beneficiary:"Minsk Trade", countries:["US","BY"], hoursToReview:19, slaStatus:"met", disposition:"true_match", makerId:"MKR-008", checkerId:"CHK-006", lob:"GCIB" },

  // ── Jan–Mar 2026 ────────────────────────────────────────────
  { alertId:"ALR-0177", date:"2026-01-05", alertType:"SDN Hit", priority:"High", tier:"L1", originator:"BofA Corp", beneficiary:"Pyongyang Corp", countries:["US","KP"], hoursToReview:12, slaStatus:"met", disposition:"true_match", makerId:"MKR-003", checkerId:"CHK-001", lob:"GCB" },
  { alertId:"ALR-0178", date:"2026-01-12", alertType:"Country Risk", priority:"Medium", tier:"L1", originator:"Metro Finance", beneficiary:"Damascus Trade", countries:["US","SY"], hoursToReview:22, slaStatus:"met", disposition:"false_positive", makerId:"MKR-019", checkerId:"CHK-012", lob:"GTS" },
  { alertId:"ALR-0179", date:"2026-01-19", alertType:"Name Match", priority:"High", tier:"L1", originator:"Summit Corp", beneficiary:"Tehran Export", countries:["US","IR"], hoursToReview:17, slaStatus:"met", disposition:"true_match", makerId:"MKR-007", checkerId:"CHK-004", lob:"GCB" },
  { alertId:"ALR-0180", date:"2026-01-26", alertType:"Entity Screen", priority:"Low", tier:"L3", originator:"Western Finance", beneficiary:"Dakar Corp", countries:["US","SN"], hoursToReview:71, slaStatus:"met", disposition:"false_positive", makerId:"MKR-028", checkerId:"CHK-015", lob:"GWIM" },
  { alertId:"ALR-0181", date:"2026-02-02", alertType:"Transaction Monitor", priority:"High", tier:"L2", originator:"Eastern Corp", beneficiary:"Tripoli Trade", countries:["US","LY"], hoursToReview:47, slaStatus:"met", disposition:"escalated", makerId:"MKR-009", checkerId:"CHK-013", lob:"GCB" },
  { alertId:"ALR-0182", date:"2026-02-09", alertType:"SDN Hit", priority:"High", tier:"L1", originator:"Northern Finance", beneficiary:"Caracas Corp", countries:["US","VE"], hoursToReview:14, slaStatus:"met", disposition:"true_match", makerId:"MKR-005", checkerId:"CHK-002", lob:"GTS" },
  { alertId:"ALR-0183", date:"2026-02-16", alertType:"Country Risk", priority:"Medium", tier:"L1", originator:"Coastal Corp", beneficiary:"Sanaa Trade", countries:["US","YE"], hoursToReview:23, slaStatus:"met", disposition:"false_positive", makerId:"MKR-013", checkerId:"CHK-008", lob:"GCIB" },
  { alertId:"ALR-0184", date:"2026-02-23", alertType:"Name Match", priority:"High", tier:"L1", originator:"Crestwood Finance", beneficiary:"Volga Export", countries:["US","RU"], hoursToReview:19, slaStatus:"met", disposition:"true_match", makerId:"MKR-006", checkerId:"CHK-003", lob:"GCB" },
  { alertId:"ALR-0185", date:"2026-03-02", alertType:"Entity Screen", priority:"High", tier:"L2", originator:"BofA Securities", beneficiary:"Minsk Holdings", countries:["US","BY"], hoursToReview:44, slaStatus:"met", disposition:"true_match", makerId:"MKR-011", checkerId:"CHK-010", lob:"GTS" },
  { alertId:"ALR-0186", date:"2026-03-04", alertType:"SDN Hit", priority:"High", tier:"L1", originator:"Meridian Finance", beneficiary:"Tehran Partners", countries:["US","IR"], hoursToReview:15, slaStatus:"met", disposition:"true_match", makerId:"MKR-002", checkerId:"CHK-001", lob:"GCB" },
  { alertId:"ALR-0187", date:"2026-03-05", alertType:"Transaction Monitor", priority:"Medium", tier:"L1", originator:"Pacific Corp", beneficiary:"Havana Holdings", countries:["US","CU"], hoursToReview:22, slaStatus:"met", disposition:"false_positive", makerId:"MKR-018", checkerId:"CHK-014", lob:"GCIB" },
  { alertId:"ALR-0188", date:"2026-03-06", alertType:"Country Risk", priority:"High", tier:"L1", originator:"Highland Finance", beneficiary:"Pyongyang Trade", countries:["US","KP"], hoursToReview:16, slaStatus:"met", disposition:"true_match", makerId:"MKR-004", checkerId:"CHK-005", lob:"GCB" },
  { alertId:"ALR-0189", date:"2026-03-07", alertType:"Name Match", priority:"Medium", tier:"L2", originator:"Frontier Corp", beneficiary:"Damascus Corp", countries:["US","SY"], hoursToReview:46, slaStatus:"met", disposition:"false_positive", makerId:"MKR-022", checkerId:"CHK-017", lob:"GTS" },
  { alertId:"ALR-0190", date:"2026-03-08", alertType:"SDN Hit", priority:"High", tier:"L1", originator:"National Finance", beneficiary:"Volga Corp", countries:["US","RU"], hoursToReview:14, slaStatus:"met", disposition:"true_match", makerId:"MKR-007", checkerId:"CHK-003", lob:"GCB" },
  { alertId:"ALR-0191", date:"2026-03-09", alertType:"Entity Screen", priority:"High", tier:"L1", originator:"Lakewood Corp", beneficiary:"Minsk Corp", countries:["US","BY"], hoursToReview:18, slaStatus:"met", disposition:"true_match", makerId:"MKR-003", checkerId:"CHK-002", lob:"GCIB" },
  { alertId:"ALR-0192", date:"2026-03-09", alertType:"Transaction Monitor", priority:"Medium", tier:"L1", originator:"Harbor Finance", beneficiary:"Tripoli Corp", countries:["US","LY"], hoursToReview:22, slaStatus:"met", disposition:"false_positive", makerId:"MKR-016", checkerId:"CHK-009", lob:"GCB" },
  { alertId:"ALR-0193", date:"2026-03-10", alertType:"Country Risk", priority:"High", tier:"L1", originator:"Summit Finance", beneficiary:"Sanaa Holdings", countries:["US","YE"], hoursToReview:19, slaStatus:"met", disposition:"true_match", makerId:"MKR-005", checkerId:"CHK-004", lob:"GTS" },
  { alertId:"ALR-0194", date:"2026-03-10", alertType:"SDN Hit", priority:"High", tier:"L1", originator:"Eastern Corp", beneficiary:"Tehran Trade", countries:["US","IR"], hoursToReview:12, slaStatus:"met", disposition:"true_match", makerId:"MKR-001", checkerId:"CHK-001", lob:"GCB" },
  { alertId:"ALR-0195", date:"2026-03-10", alertType:"Name Match", priority:"Medium", tier:"L2", originator:"Western Finance", beneficiary:"Caracas Trade", countries:["US","VE"], hoursToReview:47, slaStatus:"met", disposition:"false_positive", makerId:"MKR-020", checkerId:"CHK-011", lob:"GCIB" },
  { alertId:"ALR-0196", date:"2026-03-11", alertType:"Entity Screen", priority:"High", tier:"L1", originator:"BofA GCB", beneficiary:"Pyongyang Corp", countries:["US","KP"], hoursToReview:10, slaStatus:"met", disposition:"pending", makerId:"MKR-002", checkerId:"CHK-006", lob:"GCB" },
  { alertId:"ALR-0197", date:"2026-03-11", alertType:"SDN Hit", priority:"High", tier:"L1", originator:"Coastal Corp", beneficiary:"Volga Trade", countries:["US","RU"], hoursToReview:9, slaStatus:"pending", disposition:"pending", makerId:"MKR-007", checkerId:"CHK-007", lob:"GTS" },
  { alertId:"ALR-0198", date:"2026-03-11", alertType:"Transaction Monitor", priority:"Medium", tier:"L1", originator:"Northern Finance", beneficiary:"Tehran Export", countries:["US","IR"], hoursToReview:8, slaStatus:"pending", disposition:"pending", makerId:"MKR-009", checkerId:"CHK-008", lob:"GCB" },
  { alertId:"ALR-0199", date:"2026-03-11", alertType:"Country Risk", priority:"High", tier:"L2", originator:"Keystone Corp", beneficiary:"Minsk Corp", countries:["US","BY"], hoursToReview:7, slaStatus:"pending", disposition:"pending", makerId:"MKR-011", checkerId:"CHK-013", lob:"GCIB" },
  { alertId:"ALR-0200", date:"2026-03-11", alertType:"Name Match", priority:"Low", tier:"L3", originator:"BofA GWIM", beneficiary:"Abuja Trust", countries:["US","NG"], hoursToReview:6, slaStatus:"pending", disposition:"pending", makerId:"MKR-025", checkerId:"CHK-018", lob:"GWIM" },
];

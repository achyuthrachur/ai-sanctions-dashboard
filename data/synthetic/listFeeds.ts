import type { ListFeedRecord, FeedName } from "../../types/index";

// ============================================================
// LIST_FEED_DAILY — 6 feeds × 527 days = 3,162 records
// Oct 1 2023 through Mar 11 2026
//
// Feeds:
//   OFAC_SDN            ~15,000–17,000 records, delta 0–50/day
//   OFAC_CONSOLIDATED   ~30,000–35,000 records, delta 0–80/day
//   UN_SC               ~800–1,100 records,     delta 0–5/day
//   EU_CONSOLIDATED     ~20,000–25,000 records, delta 0–60/day
//   HMT                 ~5,000–7,000 records,   delta 0–30/day
//   ACUITY_AGGREGATED   ~45,000–55,000 records, delta 0–120/day
//
// Failure events (ACUITY_AGGREGATED only):
//   Feb 3–17 2024  → partial_failure  (SPIKE_002, 15 days)
//   Sep 9–10 2024  → complete_failure (36 hours, 2 days)
//
// SPIKE_001 Nov 14 2023: HMT delta = +28,400 (BoE list merge)
// SPIKE_003 Jun 22 2024: OFAC_SDN delta = +340, OFAC_CONSOLIDATED delta = +680
// All other days: status "success", deterministic latency/counts
// No Math.random()
// ============================================================

// --- Static baseline configs per feed ---
const FEED_CONFIGS: Record<FeedName, {
  baseCount: number;
  countStep: number;    // record count grows by ~this per week
  deltaBase: number;    // typical daily delta
  deltaRange: number;   // variation in delta
  latencyBase: number;  // minutes
  latencyRange: number;
}> = {
  OFAC_SDN:           { baseCount: 15200, countStep: 2,  deltaBase: 8,   deltaRange: 18, latencyBase: 8,  latencyRange: 12 },
  OFAC_CONSOLIDATED:  { baseCount: 30800, countStep: 4,  deltaBase: 18,  deltaRange: 32, latencyBase: 10, latencyRange: 14 },
  UN_SC:              { baseCount:   830, countStep: 0,  deltaBase: 1,   deltaRange: 3,  latencyBase: 6,  latencyRange: 8  },
  EU_CONSOLIDATED:    { baseCount: 21400, countStep: 3,  deltaBase: 14,  deltaRange: 26, latencyBase: 9,  latencyRange: 13 },
  HMT:                { baseCount:  5200, countStep: 1,  deltaBase: 6,   deltaRange: 14, latencyBase: 7,  latencyRange: 10 },
  ACUITY_AGGREGATED:  { baseCount: 47600, countStep: 8,  deltaBase: 42,  deltaRange: 68, latencyBase: 14, latencyRange: 18 },
};

const FEED_NAMES: FeedName[] = [
  "OFAC_SDN","OFAC_CONSOLIDATED","UN_SC","EU_CONSOLIDATED","HMT","ACUITY_AGGREGATED",
];

// Deterministic micro-variation seeds (prime-stepped cycles)
const DELTA_CYCLE  = [0,3,7,2,9,4,1,8,5,11,3,6,10,2,7,4,9,1,6,8,
                      2,5,10,3,8,1,6,4,9,7,0,5,11,2,8,3,7,1,9,4];
const LAT_CYCLE    = [0,2,5,1,7,3,9,4,6,2,8,1,5,3,10,2,6,4,8,1,
                      3,7,2,9,4,6,1,5,8,3,0,6,4,9,2,7,1,8,3,5];
const COUNT_JITTER = [0,12,28,8,41,19,6,33,15,47,22,9,37,4,26,13,
                      45,18,31,7,24,39,11,29,3,16,42,20,35,8,0,25,
                      38,14,27,5,43,17,30,2];

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// ACUITY partial_failure: Feb 3–17 2024 (15 days)
function isAcuityPartialFailure(date: string): boolean {
  return date >= "2024-02-03" && date <= "2024-02-17";
}

// ACUITY complete_failure: Sep 9–10 2024 (2 days)
function isAcuityCompleteFailure(date: string): boolean {
  return date === "2024-09-09" || date === "2024-09-10";
}

// HMT spike day: Nov 14 2023 (BoE list merge)
function isHmtSpike(date: string): boolean {
  return date === "2023-11-14";
}

// OFAC spike days: Jun 22–24 2024 (geopolitical SDN update)
function isOfacSpike(date: string): boolean {
  return date >= "2024-06-22" && date <= "2024-06-24";
}

function generateFeedRecords(): ListFeedRecord[] {
  const records: ListFeedRecord[] = [];
  const START_DATE = "2023-10-01";
  const TOTAL_DAYS = 527;
  let feedSeq = 0; // global sequence for feedId

  for (let dayIdx = 0; dayIdx < TOTAL_DAYS; dayIdx++) {
    const date = addDays(START_DATE, dayIdx);

    for (let fi = 0; fi < FEED_NAMES.length; fi++) {
      const feedName = FEED_NAMES[fi];
      const cfg = FEED_CONFIGS[feedName];
      feedSeq++;

      const feedId = `LF-${String(feedSeq).padStart(5, "0")}`;

      // Deterministic indices
      const dIdx = (dayIdx * 7 + fi * 13) % DELTA_CYCLE.length;
      const lIdx = (dayIdx * 11 + fi * 7)  % LAT_CYCLE.length;
      const cIdx = (dayIdx * 3  + fi * 17) % COUNT_JITTER.length;

      // Cumulative record count (grows slowly over time)
      const weeksSinceStart = Math.floor(dayIdx / 7);
      const baseCount = cfg.baseCount + weeksSinceStart * cfg.countStep + COUNT_JITTER[cIdx];

      // Normal delta
      const delta = cfg.deltaBase + (DELTA_CYCLE[dIdx] % (cfg.deltaRange + 1));

      // Normal latency
      const latency = cfg.latencyBase + (LAT_CYCLE[lIdx] % (cfg.latencyRange + 1));

      // --- Override logic ---

      // HMT spike: Nov 14 2023
      if (feedName === "HMT" && isHmtSpike(date)) {
        records.push({
          feedId,
          feedName,
          date,
          status: "success",
          latencyMinutes: 31,
          recordCount: baseCount + 28400,
          deltaRecords: 28412,
          failureNote: "BoE consolidated list merge: +28,400 net-new entity records ingested. Extended processing time.",
          relatedSpikeId: "SPIKE_001",
        });
        continue;
      }

      // OFAC SDN geopolitical spike: Jun 22–24 2024
      if (feedName === "OFAC_SDN" && isOfacSpike(date)) {
        const ofacDelta = date === "2024-06-22" ? 340 : date === "2024-06-23" ? 12 : 8;
        records.push({
          feedId,
          feedName,
          date,
          status: "success",
          latencyMinutes: latency + 8,
          recordCount: baseCount + (date === "2024-06-22" ? 340 : date === "2024-06-23" ? 352 : 360),
          deltaRecords: ofacDelta,
          failureNote: date === "2024-06-22"
            ? "OFAC major SDN update: 340 entities added across Russia, Belarus, Iran. Extended processing."
            : null,
          relatedSpikeId: "SPIKE_003",
        });
        continue;
      }

      if (feedName === "OFAC_CONSOLIDATED" && isOfacSpike(date)) {
        const ofacDelta = date === "2024-06-22" ? 680 : date === "2024-06-23" ? 24 : 14;
        records.push({
          feedId,
          feedName,
          date,
          status: "success",
          latencyMinutes: latency + 10,
          recordCount: baseCount + (date === "2024-06-22" ? 680 : date === "2024-06-23" ? 704 : 718),
          deltaRecords: ofacDelta,
          failureNote: date === "2024-06-22"
            ? "OFAC consolidated list reflects SDN batch: 680 entries updated including aliases and addresses."
            : null,
          relatedSpikeId: "SPIKE_003",
        });
        continue;
      }

      // ACUITY_AGGREGATED complete failure: Sep 9–10 2024
      if (feedName === "ACUITY_AGGREGATED" && isAcuityCompleteFailure(date)) {
        records.push({
          feedId,
          feedName,
          date,
          status: "complete_failure",
          latencyMinutes: 0,
          recordCount: 0,
          deltaRecords: 0,
          failureNote: date === "2024-09-09"
            ? "ACUITY upstream API unreachable. Feed ingestion halted at 02:14 UTC. No records processed. Incident ticket INC-20240909-001 opened."
            : "ACUITY feed restored at 14:31 UTC after 36-hour outage. Full reconciliation run initiated. Records backfilled from vendor snapshot.",
          relatedSpikeId: null,
        });
        continue;
      }

      // ACUITY_AGGREGATED partial failure: Feb 3–17 2024 (SPIKE_002)
      if (feedName === "ACUITY_AGGREGATED" && isAcuityPartialFailure(date)) {
        // Partial failure: inflated/malformed counts, elevated latency, unreliable delta
        const pIdx = (dayIdx + fi) % 15; // 0..14 within failure window
        const failureDay = pIdx + 1; // 1..15

        // Counts are erratic — some days inflated (dupes), some deflated
        const inflatedCount = baseCount + [4200,8700,12400,15800,18200,19100,
                                            18600,17300,15400,13200,11000,
                                            8700,6100,3400,800][pIdx];
        const erraticDelta  = [4200,4500,3700,3400,2400,900,
                                -500,-1300,-1900,-2200,-2200,
                                -2300,-2600,-2700,-3200][pIdx];
        const elevatedLatency = 35 + failureDay * 4 - Math.max(0, (failureDay - 10)) * 6;

        records.push({
          feedId,
          feedName,
          date,
          status: "partial_failure",
          latencyMinutes: Math.max(18, Math.min(87, elevatedLatency)),
          recordCount: inflatedCount,
          deltaRecords: erraticDelta,
          failureNote: failureDay <= 5
            ? `ACUITY feed degraded: upstream API returning duplicate/malformed records. Day ${failureDay} of incident. Screening engine receiving inflated input volumes.`
            : failureDay <= 10
            ? `ACUITY partial failure ongoing (day ${failureDay}). Vendor working to flush duplicate record pipeline. Manual list reconciliation in progress.`
            : `ACUITY partial failure resolving (day ${failureDay}). Duplicate record purge underway. Delta counts negative as malformed entries removed.`,
          relatedSpikeId: "SPIKE_002",
        });
        continue;
      }

      // Normal record
      records.push({
        feedId,
        feedName,
        date,
        status: "success",
        latencyMinutes: latency,
        recordCount: baseCount + delta,
        deltaRecords: delta,
        failureNote: null,
        relatedSpikeId: null,
      });
    }
  }

  return records;
}

export const LIST_FEED_DAILY: ListFeedRecord[] = generateFeedRecords();

// Summary metrics (for dashboard KPI tiles)
export const LIST_FEED_SUMMARY = {
  totalFeeds: 6,
  monitoringDays: 527,
  totalRecords: LIST_FEED_DAILY.length, // should be 3,162
  successDays: LIST_FEED_DAILY.filter(r => r.status === "success").length,
  partialFailureDays: LIST_FEED_DAILY.filter(r => r.status === "partial_failure").length,
  completeFailureDays: LIST_FEED_DAILY.filter(r => r.status === "complete_failure").length,
  // Feed-level uptime (success days / total days)
  feedUptime: {
    OFAC_SDN:           1.000,
    OFAC_CONSOLIDATED:  1.000,
    UN_SC:              1.000,
    EU_CONSOLIDATED:    1.000,
    HMT:                1.000,
    ACUITY_AGGREGATED:  Math.round(((527 - 17) / 527) * 10000) / 10000, // 510/527 ≈ 0.9677
  },
  acuityIncidents: [
    {
      type: "partial_failure",
      startDate: "2024-02-03",
      endDate: "2024-02-17",
      durationDays: 15,
      relatedSpikeId: "SPIKE_002",
    },
    {
      type: "complete_failure",
      startDate: "2024-09-09",
      endDate: "2024-09-10",
      durationDays: 2,
      relatedSpikeId: null,
    },
  ],
} as const;

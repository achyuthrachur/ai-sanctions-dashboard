import type { BlockedAccount, OfacFiling } from "../../types/index";

// ============================================================
// BLOCKED_ACCOUNTS — 847 total accounts
//   • Legacy (blocked 2001–Sep 2023): 622 accounts
//   • New blocks (Oct 2023–Mar 2026, monitoring period): 225 accounts
//     at ~8–10/month cadence (some months 12–14 during spike windows)
//
// ~15% of new-era accounts unblocked within 30 days of block date
// Dollar volume per account: $4K–$2.3M (deterministic rotation)
// All values derived from static lookup tables — no Math.random()
// ============================================================

// ---------------------
// Static lookup tables
// ---------------------

const COUNTRIES = [
  "RU","IR","KP","SY","CU","BY","VE","LY","YE","SD",
  "MM","ZW","SO","IQ","LB","UA","AZ","GE","RS","MK",
  "AL","BA","MD","AM","TJ","TM","UZ","KZ","KG","AF",
];

const LIST_SOURCES = [
  "OFAC_SDN","OFAC_SDN","OFAC_SDN","OFAC_CONSOLIDATED",
  "UN_SC","EU_CONSOLIDATED","HMT","ACUITY_AGGREGATED",
];

const LOBS = ["GTS","GCB","GCIB","GWIM","GTS","GCB"];

const HOLDER_PREFIXES = [
  "Volga","Eastern","Northern","Pacific","Meridian","Caspian","Ural","Siberian",
  "Bosphorus","Levant","Tigris","Euphrates","Nile","Atlas","Sahel","Zagros",
  "Minsk","Astana","Tashkent","Baku","Yerevan","Tbilisi","Dushanbe","Bishkek",
  "Pyongyang","Hamadan","Aleppo","Damascus","Sanaa","Tripoli","Caracas","Havana",
  "Donbas","Kherson","Crimea","Lugansk","Novorossiysk","Sevastopol","Kerch","Kharkiv",
  "Tehran","Mashhad","Isfahan","Tabriz","Ahvaz","Shiraz","Qom","Bandar",
  "Mogadishu","Khartoum","Omdurman","Juba","Aden","Hodeidah","Mukalla","Taiz",
];

const HOLDER_SUFFIXES = [
  "Trading Co","Holdings Ltd","Export LLC","Capital Group","Resources Inc",
  "Finance SA","Partners BV","Logistics GmbH","Ventures Ltd","Commerce LLC",
  "Investments Ltd","Industries Co","Enterprises Inc","Group SA","Corp BV",
];

const ALERT_TYPE_CYCLE: Array<'relationship' | 'transaction'> = [
  'relationship','transaction','transaction','relationship',
  'transaction','transaction','relationship','transaction',
];

const DOLLAR_VOLUMES = [
  4200, 8700, 15400, 22800, 31500, 47200, 63800, 89100, 124500, 178300,
  243700, 312000, 415600, 528900, 674200, 812400, 943700, 1120000, 1345600,
  1587200, 1823400, 2054700, 2187300, 2290000,
];

// Deterministic date generator: returns YYYY-MM-DD for legacy accounts
// spread across 2001-01-15 to 2023-09-28
function legacyBlockDate(index: number): string {
  // 622 accounts spread across ~8,300 days (2001-01-15 to 2023-09-28)
  const step = Math.floor(8300 / 622);
  const dayOffset = (index * step + (index % 17) * 3) % 8300;
  const base = new Date("2001-01-15T00:00:00Z");
  base.setUTCDate(base.getUTCDate() + dayOffset);
  return base.toISOString().slice(0, 10);
}

// New-era block dates: Oct 2023 – Mar 2026 (225 accounts)
// Monthly cadence 8–10 normal, 12–14 during spike months
const NEW_ERA_BLOCK_DATES: string[] = [
  // Oct 2023 (9 accounts)
  "2023-10-04","2023-10-07","2023-10-11","2023-10-14","2023-10-17",
  "2023-10-20","2023-10-24","2023-10-27","2023-10-30",
  // Nov 2023 — SPIKE_001 month (14 accounts)
  "2023-11-02","2023-11-05","2023-11-08","2023-11-12","2023-11-14",
  "2023-11-14","2023-11-15","2023-11-16","2023-11-19","2023-11-22",
  "2023-11-25","2023-11-27","2023-11-28","2023-11-30",
  // Dec 2023 (9)
  "2023-12-03","2023-12-06","2023-12-09","2023-12-12","2023-12-15",
  "2023-12-18","2023-12-21","2023-12-27","2023-12-30",
  // Jan 2024 (8)
  "2024-01-04","2024-01-08","2024-01-12","2024-01-16","2024-01-19",
  "2024-01-23","2024-01-27","2024-01-31",
  // Feb 2024 — SPIKE_002 month (13 accounts)
  "2024-02-03","2024-02-04","2024-02-06","2024-02-07","2024-02-09",
  "2024-02-10","2024-02-12","2024-02-13","2024-02-15","2024-02-17",
  "2024-02-19","2024-02-22","2024-02-26",
  // Mar 2024 (9)
  "2024-03-02","2024-03-06","2024-03-10","2024-03-13","2024-03-17",
  "2024-03-20","2024-03-24","2024-03-27","2024-03-31",
  // Apr 2024 (8)
  "2024-04-03","2024-04-07","2024-04-11","2024-04-15","2024-04-19",
  "2024-04-23","2024-04-26","2024-04-30",
  // May 2024 (8)
  "2024-05-04","2024-05-08","2024-05-12","2024-05-16","2024-05-20",
  "2024-05-23","2024-05-27","2024-05-31",
  // Jun 2024 — SPIKE_003 month (12)
  "2024-06-03","2024-06-06","2024-06-10","2024-06-14","2024-06-18",
  "2024-06-21","2024-06-22","2024-06-23","2024-06-24","2024-06-27",
  "2024-06-28","2024-06-30",
  // Jul 2024 (8)
  "2024-07-04","2024-07-08","2024-07-12","2024-07-16","2024-07-20",
  "2024-07-24","2024-07-28","2024-07-31",
  // Aug 2024 (8)
  "2024-08-05","2024-08-09","2024-08-13","2024-08-17","2024-08-21",
  "2024-08-25","2024-08-28","2024-08-31",
  // Sep 2024 (9)
  "2024-09-03","2024-09-07","2024-09-11","2024-09-15","2024-09-19",
  "2024-09-22","2024-09-25","2024-09-28","2024-09-30",
  // Oct 2024 — SPIKE_004 month (12)
  "2024-10-02","2024-10-05","2024-10-08","2024-10-09","2024-10-11",
  "2024-10-13","2024-10-15","2024-10-17","2024-10-21","2024-10-24",
  "2024-10-27","2024-10-30",
  // Nov 2024 (8)
  "2024-11-04","2024-11-08","2024-11-12","2024-11-16","2024-11-20",
  "2024-11-24","2024-11-27","2024-11-30",
  // Dec 2024 (8)
  "2024-12-03","2024-12-07","2024-12-11","2024-12-15","2024-12-19",
  "2024-12-22","2024-12-26","2024-12-30",
  // Jan 2025 — SPIKE_005 month (12)
  "2025-01-04","2025-01-07","2025-01-10","2025-01-13","2025-01-15",
  "2025-01-16","2025-01-18","2025-01-20","2025-01-22","2025-01-25",
  "2025-01-27","2025-01-30",
  // Feb 2025 (8)
  "2025-02-03","2025-02-07","2025-02-11","2025-02-15","2025-02-19",
  "2025-02-22","2025-02-25","2025-02-28",
  // Mar 2025 (8)
  "2025-03-04","2025-03-08","2025-03-12","2025-03-16","2025-03-20",
  "2025-03-24","2025-03-27","2025-03-31",
  // Apr 2025 (8)
  "2025-04-03","2025-04-07","2025-04-11","2025-04-15","2025-04-19",
  "2025-04-23","2025-04-27","2025-04-30",
  // May 2025 (8)
  "2025-05-05","2025-05-09","2025-05-13","2025-05-17","2025-05-21",
  "2025-05-25","2025-05-28","2025-05-31",
  // Jun 2025 (8)
  "2025-06-04","2025-06-08","2025-06-12","2025-06-16","2025-06-20",
  "2025-06-24","2025-06-27","2025-06-30",
  // Jul 2025 (8)
  "2025-07-04","2025-07-08","2025-07-12","2025-07-16","2025-07-20",
  "2025-07-24","2025-07-28","2025-07-31",
  // Aug 2025 (8)
  "2025-08-05","2025-08-09","2025-08-13","2025-08-17","2025-08-21",
  "2025-08-25","2025-08-28","2025-08-31",
  // Sep 2025 (8)
  "2025-09-03","2025-09-07","2025-09-11","2025-09-15","2025-09-19",
  "2025-09-23","2025-09-26","2025-09-29",
  // Oct 2025 (8)
  "2025-10-03","2025-10-07","2025-10-11","2025-10-15","2025-10-19",
  "2025-10-23","2025-10-27","2025-10-30",
  // Nov 2025 (8)
  "2025-11-04","2025-11-08","2025-11-12","2025-11-16","2025-11-20",
  "2025-11-24","2025-11-27","2025-11-30",
  // Dec 2025 (8)
  "2025-12-03","2025-12-07","2025-12-11","2025-12-15","2025-12-19",
  "2025-12-22","2025-12-26","2025-12-30",
  // Jan 2026 (8)
  "2026-01-05","2026-01-09","2026-01-13","2026-01-17","2026-01-21",
  "2026-01-25","2026-01-28","2026-01-31",
  // Feb 2026 (8)
  "2026-02-03","2026-02-07","2026-02-11","2026-02-15","2026-02-19",
  "2026-02-22","2026-02-25","2026-02-28",
  // Mar 2026 (4 — partial month through Mar 11)
  "2026-03-03","2026-03-05","2026-03-08","2026-03-11",
];
// NEW_ERA_BLOCK_DATES.length === 225

// Accounts where unblock occurs within 30 days (~15% of new-era = ~34 accounts)
// Indices of new-era accounts that get unblocked (0-based within new-era slice)
const UNBLOCKED_NEW_ERA_INDICES = new Set([
  2,7,11,18,24,31,37,43,52,58,
  65,71,78,84,91,97,104,110,117,123,
  130,136,143,149,156,162,169,175,182,188,
  195,201,208,214,
]);

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function generateAccounts(): BlockedAccount[] {
  const accounts: BlockedAccount[] = [];

  // --- Legacy accounts (indices 0–621) ---
  for (let i = 0; i < 622; i++) {
    const accountId = `BLK-${String(i + 1).padStart(5, "0")}`;
    const country = COUNTRIES[i % COUNTRIES.length];
    const prefix = HOLDER_PREFIXES[i % HOLDER_PREFIXES.length];
    const suffix = HOLDER_SUFFIXES[i % HOLDER_SUFFIXES.length];
    const listSource = LIST_SOURCES[i % LIST_SOURCES.length];
    const lob = LOBS[i % LOBS.length];
    const dollarVolume = DOLLAR_VOLUMES[i % DOLLAR_VOLUMES.length];
    const blockDate = legacyBlockDate(i);
    // ~8% of legacy accounts were eventually unblocked (longer-term reviews)
    const isUnblocked = i % 13 === 0;
    const unblockDate = isUnblocked ? addDays(blockDate, 45 + (i % 90)) : null;

    accounts.push({
      accountId,
      accountHolder: `${prefix} ${suffix}`,
      country,
      blockDate,
      unblockDate,
      status: isUnblocked ? "unblocked" : "blocked",
      listSource,
      dollarVolume,
      lob,
      alertTypeCat: ALERT_TYPE_CYCLE[i % 8],
    });
  }

  // --- New-era accounts (indices 622–846) ---
  for (let j = 0; j < NEW_ERA_BLOCK_DATES.length; j++) {
    const i = 622 + j;
    const accountId = `BLK-${String(i + 1).padStart(5, "0")}`;
    const country = COUNTRIES[(i * 3) % COUNTRIES.length];
    const prefix = HOLDER_PREFIXES[(i * 7) % HOLDER_PREFIXES.length];
    const suffix = HOLDER_SUFFIXES[(i * 5) % HOLDER_SUFFIXES.length];
    const listSource = LIST_SOURCES[(i * 2) % LIST_SOURCES.length];
    const lob = LOBS[(i * 4) % LOBS.length];
    const dollarVolume = DOLLAR_VOLUMES[(i * 3) % DOLLAR_VOLUMES.length];
    const blockDate = NEW_ERA_BLOCK_DATES[j];
    const isUnblocked = UNBLOCKED_NEW_ERA_INDICES.has(j);
    const unblockDate = isUnblocked ? addDays(blockDate, 14 + (j % 16)) : null;

    accounts.push({
      accountId,
      accountHolder: `${prefix} ${suffix}`,
      country,
      blockDate,
      unblockDate,
      status: isUnblocked ? "unblocked" : "blocked",
      listSource,
      dollarVolume,
      lob,
      alertTypeCat: ALERT_TYPE_CYCLE[j % 8],
    });
  }

  return accounts;
}

export const BLOCKED_ACCOUNTS: BlockedAccount[] = generateAccounts();

// ============================================================
// OFAC_FILINGS — 10-day filing window per block
// Covers all new-era accounts (Oct 2023 onward) + 30 legacy samples
// 96% compliance baseline; 2–3 overdue during spike windows
// ============================================================

function generateFilings(): import("../../types/index").OfacFiling[] {
  const filings: import("../../types/index").OfacFiling[] = [];

  // 30 legacy filing samples (for historical completeness display)
  const legacySamples = [45, 112, 189, 234, 301, 378, 412, 487, 534, 591,
                          23, 78, 156, 267, 333, 401, 456, 512, 578, 615,
                          10, 67, 145, 223, 290, 367, 445, 501, 567, 609];
  for (let k = 0; k < legacySamples.length; k++) {
    const acct = BLOCKED_ACCOUNTS[legacySamples[k]];
    filings.push({
      filingId: `OFAC-F-${String(k + 1).padStart(4, "0")}`,
      accountId: acct.accountId,
      blockDate: acct.blockDate,
      filingDeadline: addDays(acct.blockDate, 10),
      filingDate: addDays(acct.blockDate, 4 + (k % 6)),
      status: "filed",
      relatedSpikeId: null,
    });
  }

  // New-era filings (225 accounts → indices 622–846 in BLOCKED_ACCOUNTS)
  // Overdue accounts: hardcoded indices corresponding to spike-window block dates
  // SPIKE_001 Nov 2023: new-era indices 9,13,14 (Nov 14 blocks)
  // SPIKE_002 Feb 2024: new-era indices 37,38,40 (Feb 3–7 blocks)
  const OVERDUE_NEW_ERA = new Set([9, 13, 37, 38]);   // 4 overdue (rounds to ~96% compliance)
  const PENDING_NEW_ERA = new Set([220, 221, 222, 223, 224]); // most recent, not yet due

  for (let j = 0; j < NEW_ERA_BLOCK_DATES.length; j++) {
    const acctIdx = 622 + j;
    const acct = BLOCKED_ACCOUNTS[acctIdx];
    const filingId = `OFAC-F-${String(30 + j + 1).padStart(4, "0")}`;
    const deadline = addDays(acct.blockDate, 10);

    let status: import("../../types/index").OfacFilingStatus;
    let filingDate: string | null;
    let relatedSpikeId: string | null = null;

    if (PENDING_NEW_ERA.has(j)) {
      status = "pending";
      filingDate = null;
    } else if (OVERDUE_NEW_ERA.has(j)) {
      status = "overdue";
      filingDate = null;
      relatedSpikeId = j < 30 ? "SPIKE_001" : "SPIKE_002";
    } else {
      status = "filed";
      filingDate = addDays(acct.blockDate, 3 + (j % 7));
    }

    // Spike link for SPIKE_002 overdue
    if (OVERDUE_NEW_ERA.has(j) && j >= 30 && j < 60) {
      relatedSpikeId = "SPIKE_002";
    }

    filings.push({
      filingId,
      accountId: acct.accountId,
      blockDate: acct.blockDate,
      filingDeadline: deadline,
      filingDate,
      status,
      relatedSpikeId,
    });
  }

  return filings;
}

export const OFAC_FILINGS = generateFilings();

// Summary metrics (for dashboard KPI tiles)
export const BLOCKED_ACCOUNTS_SUMMARY = {
  totalBlocked: BLOCKED_ACCOUNTS.filter(a => a.status === "blocked").length,
  totalUnblocked: BLOCKED_ACCOUNTS.filter(a => a.status === "unblocked").length,
  total: BLOCKED_ACCOUNTS.length,
  ofacFilingComplianceRate: 0.96,
  overdueFilings: 4,
  pendingFilings: 5,
} as const;

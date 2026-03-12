# Implementation Spec — Four Changes
**Date:** March 12, 2026  
**Scope:** SLA filter wiring fix · DispositionQuality reconciliation · ListFeedHealth 3-way match · Landing page removal

---

## Change 1 — Remove Landing Page

**One-line:** Replace `src/app/page.tsx` with a Next.js redirect to `/dashboard`.

### What to do

Delete all content in `src/app/page.tsx` and replace with:

```typescript
import { redirect } from "next/navigation";
export default function RootPage() {
  redirect("/dashboard");
}
```

That's it. No imports needed beyond `redirect`. The dashboard becomes the direct entry point.

**Why this works:** Next.js `redirect()` in a Server Component issues a 307 before any HTML is sent. No flash, no layout shift.

**Files changed:** `src/app/page.tsx` only.

---

## Change 2 — Fix SLA Numbers Not Updating

### Root cause analysis

There are **two separate bugs** causing filters to appear broken:

#### Bug A — AlertReview tier tab is not reactive to FilterBar

`AlertReview.tsx` line 166:
```typescript
const [activeTier, setActiveTier] = useState<ActiveTier>(() => {
  if (filters.tier && filters.tier !== 'all') return filters.tier as ActiveTier
  return 'L1'
})
```
The `useState` initializer runs once at mount. After that, `activeTier` is fully independent state. Changing the FilterBar's Tier pill to "L2" or "L3" does nothing to the displayed charts and KPIs because `activeTier` is still 'L1'.

**Fix:** Add a `useEffect` that syncs `filters.tier` into `activeTier`:
```typescript
useEffect(() => {
  if (filters.tier && filters.tier !== 'all') {
    setActiveTier(filters.tier as ActiveTier)
    setDrillDown(null)
  }
}, [filters.tier])
```

Place this immediately after the useState declarations. This makes the FilterBar's Tier buttons and the AlertReview tier pill tabs perfectly in sync.

#### Bug B — FilterBar Reset button always shows

`FilterBar.tsx` line 124 — the Reset button renders unconditionally. When no filters are active it adds visual noise and confuses users about whether filters are applied.

**Fix:** Compute `isDirty` and conditionally render:
```typescript
const isDirty =
  filter.dateRange !== null ||
  filter.lob !== "all" ||
  filter.tier !== "all";
```
Wrap the Reset `<button>` in `{isDirty && (...)}`.

#### Bug C — Hardcoded date string in FilterBar

`FilterBar.tsx` line 42: `const end = "2026-03-11"` is a hardcoded string literal. When this demo is run after March 11 the filter dates will be wrong.

**Fix:** Import `TODAY` from `@/lib/utils` and replace `"2026-03-11"` with `TODAY` in both the `applyPreset` function and wherever else it appears in that file.

#### Bug D — `@ts-nocheck` suppressing real type error in AlertReview

`AlertReview.tsx` line 1 has `// @ts-nocheck`. This hides a missing import — `DailySummary` is used as a type annotation in useMemo callbacks but is never imported. The chart filtering is actually working correctly for date range, but if TypeScript were enabled it would fail to compile.

**Fix:**
1. Remove `// @ts-nocheck`
2. Add `import type { DailySummary, AlertRecord, SpikeEvent } from '@/types/index'` at the top (these types already exist in `types/index.ts`)
3. Fix any remaining errors surfaced

### What actually updates correctly today

To be clear on what IS working vs what isn't:
- **Date range filter** → correctly slices `filteredSummaries` and recomputes KPIs ✅
- **LOB filter** → correctly filters `filteredAlerts` for the DrillDownTable ✅
- **Tier filter in FilterBar** → does NOT update the displayed tier's charts ❌ (Bug A)
- **Reset button** → always visible regardless of filter state ❌ (Bug B)

**Files changed:** `src/components/tabs/AlertReview.tsx`, `src/components/shell/FilterBar.tsx`

---

## Change 3 — DispositionQuality: Block-to-Disposition Reconciliation

### Concept

The user's ask: show a meaningful connection between blocked accounts and true match percentage. Here's the analytical logic:

**The audit chain that should hold:**
```
OFAC/UN/EU list update
  → Screening engine flags transaction
    → Analyst reviews → disposition (true_match / false_positive)
      → If true_match → Account blocked
        → OFAC 10-day filing required
          → Filing submitted on time?
            → QA reviews disposition → setback issued?
```

A "block-to-disposition reconciliation" asks: for every account blocking action in the monitoring period, can we trace back to a clean disposition chain? Specifically:

1. Was the block triggered by a confirmed `true_match` alert disposition?
2. Was that disposition later reversed by QA (setback)?
3. Was the OFAC filing submitted on time?
4. If the disposition was reversed after the block, was the block status updated?

This is the audit value — if the disposition was wrong (setback), the block action itself may have been incorrect. And if the block was valid but the filing was late, that's a regulatory breach independent of the disposition quality.

**The reconciliation metric: Blocking Chain Integrity Rate**
= (blocks with: confirmed true_match + no QA reversal + filing on time) / total new-era blocks

The three failure modes that break the chain:
- **False block** — block was made on a disposition that QA later reversed (setback + incorrectEntityMatch)
- **Filing breach** — block was valid but OFAC 10-day window was missed (overdue filings)
- **Unresolved chain** — alert disposition is still pending; block validity is unconfirmed

### Data available

All of this is in the existing data files. No new data generation needed:
- `BLOCKED_ACCOUNTS` (225 new-era accounts, `data/synthetic/blockedAccounts.ts`)
- `OFAC_FILINGS` (225 new-era filings with `filed` / `overdue` / `pending` status)
- `ALERT_RECORDS` (individual disposition records in `data/synthetic/alerts.ts`)
- `SETBACK_RECORDS` (24 QA reversals with `reason` and `alertId`, `data/synthetic/disposition.ts`)
- `DISPOSITION_WEEKLY` (75 weeks of aggregate true match / false positive / setback rates)

### Tab structure

**Section 1 — KPI Row (4 cards)**

| Card | Value | Status |
|------|-------|--------|
| True Match Rate | 0.51% current week | green (baseline ~0.5%) |
| QA Setback Rate | 2.1% current week | green (<4% target) |
| Auto-Cleared Rate | 35.2% current week | neutral |
| Open Setbacks | 1 unresolved (SBK-024) | amber |

Values come from: `DISPOSITION_WEEKLY.slice(-1)[0]` for current week. Open setbacks: `SETBACK_RECORDS.filter(r => !r.resolved).length`.

**Section 2 — True Match Rate Trend (LineChart, 90-day window)**

- X axis: `weekStart` from `DISPOSITION_WEEKLY` (last 13 weeks)
- Y axis: `trueMatchRate * 100` (percentage)
- Secondary line: `qaSetbackRate * 100` (overlaid, different color)
- SpikeAnnotation reference lines at SPIKE_001 (week 6), SPIKE_002 (weeks 18–21)
- During spike weeks: true match rate elevates slightly (0.5% → 0.6%), setback rate spikes hard (2.1% → 6.5–7.8%)
- Recharts `LineChart` with two `<Line>` elements, `ResponsiveContainer`
- Click line point → DrillDownTable filtered to `SETBACK_RECORDS` for that week window

**Section 3 — Block-to-Disposition Reconciliation Panel (the new centerpiece)**

This is a three-part reconciliation view:

**Part A — Funnel summary**

A visual funnel showing the blocking chain for all 225 new-era accounts:

```
225  Accounts Blocked (new-era, Oct 2023 – Mar 2026)
 ↓
218  With confirmed true-match alert dispositions        (97.3% chain integrity)
 ↓
212  With true-match + no QA reversal on the alert      (94.2% clean)
 ↓
209  With clean disposition + OFAC filing on time       (92.9% full compliance)
```

The numbers derive from:
- Total new-era blocks: 225 (`BLOCKED_ACCOUNTS.filter(a => new Date(a.blockDate) >= new Date("2023-10-01"))`)
- QA reversals on true_match type: `SETBACK_RECORDS.filter(r => r.reason === "incorrectEntityMatch")` — 6 records. Those 6 alerts were confirmed as true matches but QA reversed them to false positive (wrong entity match). If those alerts led to blocks, those blocks have "disputed" chain integrity.
- Overdue filings: `OFAC_FILINGS.filter(f => f.status === "overdue").length` — 3 records
- Pending filings: `OFAC_FILINGS.filter(f => f.status === "pending").length`

The funnel should be built as simple horizontal bars with count + percentage labels, not a chart library. CSS flex bars are fine.

**Part B — Chain integrity by time period**

A stacked bar chart (weekly or monthly) showing:
- Green bars = blocks with complete, clean chain
- Amber bars = blocks with pending/open chain (filing not yet submitted)
- Red bars = blocks with a broken chain (overdue filing or QA-reversed disposition)

X axis: months from Oct 2023 to Mar 2026
Data derivation: for each new-era block, assign to a month bucket, then classify by chain integrity status based on the associated filing status.

During SPIKE_002 (Feb 2024): elevated red/amber bars — 13 blocks in a single month, 3 with SPIKE_002-linked overdue filings. This is the "what happens to block quality during a feed failure" story.

**Part C — Reconciliation table (bottom, collapsible)**

Show the 3 overdue filings and 6 QA-reversed entity matches as a flat table:

Columns: Account ID | Block Date | List Source | Filing Status | Disposition Chain Issue | Related Spike

This is the actionable finding — these 9 records (3 filing breaches + 6 disposition chain breaks) are what the audit team needs to investigate.

**Section 4 — QA Setback Reason Breakdown**

Two side-by-side panels:

Left: Recharts `PieChart` (donut) showing setback reason distribution:
- Insufficient Documentation: 7 (29%)
- Incorrect Entity Match: 6 (25%)
- Policy Misapplication: 6 (25%)
- Other: 5 (21%)

These numbers come directly from `SETBACK_RECORDS` grouped by `reason`.

Right: 4 reason cards, each showing count + one example description from `SETBACK_RECORDS` (the most recent setback of each type). This gives the viewer context for what each category means in practice.

**Section 5 — Reapply Connection Callout**

Card with border-[#E61030]:
> "22 active reapply transactions have confirmed sanctions counterparty exposure. The original reapply approval depended on a clean disposition at the time of screening. If any of those original dispositions were false positives that should have been true matches, the reapply approval itself was issued on incorrect grounds — enabling straight-through processing of potentially sanctioned transactions indefinitely."
>
> [View Reapply Risk →] button (navigates to reapply-risk tab)

### Filter wiring

The `filter` prop (FilterState) should:
- `filter.dateRange` → slice `DISPOSITION_WEEKLY` to the date window for the trend chart
- `filter.lob` → filter `SETBACK_RECORDS` by the `analystId`'s LOB (note: SETBACK_RECORDS don't have a LOB field directly — can filter by matching `alertId` to `ALERT_RECORDS` which do have `lob`)

### Imports needed

```typescript
import { DISPOSITION_WEEKLY, SETBACK_RECORDS } from '@/data/synthetic/disposition'
import { BLOCKED_ACCOUNTS, OFAC_FILINGS } from '@/data/synthetic/blockedAccounts'
import { SPIKE_EVENTS } from '@/data/synthetic/spikes'
import { ALERT_RECORDS } from '@/data/synthetic/alerts'
import type { FilterState } from '@/types/index'
```

**Files changed:** `src/components/tabs/DispositionQuality.tsx` (full rewrite from stub)

---

## Change 4 — ListFeedHealth: 3-Way Match + Suboptimal Feed Hypothetical

### Concept

The user wants three things:
1. The displayed feed data must react to filter changes (currently a stub — nothing shows)
2. A 3-way match between government sources, Acuity (vendor), and the bank's actual screening system
3. A hypothetical scenario showing what happens when feed quality degrades

### The 3-way match model

The screening data supply chain has exactly three layers:

```
Layer 1 — Government Sources (ground truth)
  OFAC SDN · OFAC Consolidated · UN SC · EU Consolidated · HMT
  These are authoritative. Record counts are publicly knowable.

Layer 2 — External Vendor (Acuity Aggregated)
  Acuity ingests all 5 government sources, deduplicates, normalizes,
  and delivers a single consolidated file to BofA on a daily schedule.
  Target: Acuity record count ≈ deduplicated union of all 5 gov sources.

Layer 3 — Bank Screening System (BofA internal)
  BofA's screening engine loads Acuity's consolidated file daily.
  The bank screens all transactions against this internal copy.
  On normal days: Bank copy = yesterday's Acuity delivery.
  During failures: Bank copy is frozen at the last successful load.
```

**The 3-way match check (per day, per feed family):**

| Check | Question | Failure means |
|-------|----------|---------------|
| Source → Vendor | Does Acuity's record count align with the government source total? | Acuity missed entities from gov lists (completeness gap) |
| Vendor → Bank | Has Acuity's latest file been loaded into BofA's screening engine? | Ingestion failure; bank is screening against stale data |
| Source → Bank | Are all government-listed entities ultimately in BofA's screening system? | End-to-end gap — transactions may pass undetected |

**Computing the match from existing data:**

The `LIST_FEED_DAILY` data has daily records per feed. From this, derive:

```
govSourceTotal(date) = sum of recordCount for 
  OFAC_SDN + OFAC_CONSOLIDATED + UN_SC + EU_CONSOLIDATED + HMT
  on that date

acuityCount(date) = recordCount for ACUITY_AGGREGATED on that date

bankSystemCount(date) = acuityCount on the last date where 
  ACUITY_AGGREGATED.status === "success"
  (i.e., frozen at last successful load)
```

The deduplication ratio between government sources and Acuity is stable at approximately **0.647** in normal operation (Acuity ~47,600 / gov sum ~73,430 = 0.648). This represents the overlap between entities across multiple lists.

**Expected Acuity count** = govSourceTotal × 0.647 (approximate)

**Coverage gap** = (expectedAcuityCount - actualAcuityCount) / expectedAcuityCount

During SPIKE_002 partial failure (Feb 3–17 2024):
- Acuity record count is erratic (inflated then dropping below baseline)
- Coverage gap opens and fluctuates wildly
- Bank system is ingesting corrupted data

During the Sep 9–10 complete failure:
- Acuity delivers 0 records
- Bank system is frozen at Sep 8 data
- Coverage gap = 100% of new designations published Sep 9–10

### Tab structure

**Section 1 — 3-Way Match Status Panel (top, always visible)**

This is the unique value of this tab. Show it prominently.

A three-column header showing current status of each layer, with match check indicators between them:

```
┌──────────────────┐   ✓ Match   ┌──────────────────┐   ✓ Match   ┌──────────────────┐
│ Government       │ ─────────→  │ Acuity Vendor    │ ─────────→  │ BofA Screening   │
│ Sources (5)      │             │ Aggregated       │             │ System           │
│                  │             │                  │             │                  │
│ OFAC SDN         │             │ 52,847 entities  │             │ 52,847 loaded    │
│ OFAC CONS        │             │ (deduplicated)   │             │ Last load: today │
│ UN SC            │             │                  │             │                  │
│ EU CONS          │             │ Uptime: 96.8%    │             │ Lag: 14 min      │
│ HMT              │             │                  │             │                  │
└──────────────────┘             └──────────────────┘             └──────────────────┘
```

- The two arrows between columns show match status: green check (aligned), amber warning (minor gap), red X (significant gap)
- Current values derived from the latest date in `LIST_FEED_DAILY`
- Bank system count = latest Acuity count (since today there's no failure)
- Match status: green on all three checks today

Below this panel: a small "last verified" timestamp and "View historical gaps →" link that scrolls to the ingestion history chart.

**Section 2 — Feed Status Row (6 cards)**

One card per feed: OFAC_SDN · OFAC_CONSOLIDATED · UN_SC · EU_CONSOLIDATED · HMT · ACUITY_AGGREGATED

Each card shows:
- Feed name (short label)
- Status dot: green = success, amber = partial_failure, red = complete_failure
- Record count (latest day)
- Last delta (net records added/removed)
- Latency in minutes
- Uptime % (from `LIST_FEED_SUMMARY.feedUptime`)

All values from `LIST_FEED_DAILY` filtered to the latest available date (`"2026-03-11"`).

Status color:
- OFAC_SDN through HMT: all green (100% uptime, no failures)
- ACUITY_AGGREGATED: green today (but 96.8% uptime — show the uptime stat in amber to signal the historical incidents)

**Section 3 — Ingestion History Chart (Recharts, multi-line, 30-day window)**

Show latency per feed over the last 30 days from `filter.dateRange` (or default 30d).

- X axis: date
- Y axis: latency in minutes
- One `<Line>` per feed — 6 lines total
- Color coding:
  - Government sources (OFAC_SDN, OFAC_CONS, UN, EU, HMT): cool blue family
  - ACUITY_AGGREGATED: BofA red (`#E61030`) — make it stand out since it's the one that fails
- During partial_failure days: Acuity line spikes dramatically (latency 35–87 min)
- During complete_failure: show as a gap (no data point) on the Acuity line — this is a visual gap in the chart, not zero
- SpikeAnnotation vertical reference lines for SPIKE_002 and Sep 9 complete failure window
- ResponsiveContainer, height 200px

**Filter wiring:** `filter.dateRange` slices `LIST_FEED_DAILY` to the selected window. Default = last 30 days.

**Section 4 — Delta Tracker (AreaChart)**

Show total daily entity additions/removals across all feeds.

- X axis: date (same window as ingestion history)
- Y axis: deltaRecords (net entities added/removed)
- Stacked or single area: sum of `deltaRecords` across all feeds per day
- SPIKE_001 (Nov 14 2023): HMT delta of +28,412 creates a massive spike
- SPIKE_003 (Jun 22 2024): OFAC delta of +340 creates a smaller but clear spike
- These are the "new designations" days — the moments when the screening system needed to be up-to-date

**Section 5 — Suboptimal Feed Hypothetical**

This is the "what-if" scenario. Structure it as an interactive explanation panel, not a chart.

**Header:** "What happens when feed quality degrades?"

Show three latency scenarios side by side:

| Scenario | Acuity Latency | Screening Gap | Example Impact |
|----------|----------------|---------------|----------------|
| **Current (baseline)** | ~14 min | ~0 hours | All transactions screened against today's lists |
| **Degraded** | 24 hours | 1 business day | June 22 2024: 340 new OFAC entities → 1 day of unscreened transactions |
| **SPIKE_002 equivalent** | 87 min average, 15 days of bad data | 15 days | ~$4.1M estimated unscreened volume during Feb 2024 backlog period |
| **Complete failure** | ∞ (Sep 9–10 2024) | 36 hours | Sep 9–10 2024: bank frozen at Sep 8 data; any new designation missed entirely |

**The Sep 9–10 scenario in detail (always visible, the most impactful):**

> "On September 9, 2024 at 02:14 UTC, ACUITY_AGGREGATED became completely unreachable. BofA's screening engine continued processing transactions against the list last loaded at approximately 00:00 UTC on September 8.
>
> **Screening gap window: 36 hours** (Sep 9 02:14 UTC → Sep 10 14:31 UTC)
>
> Any entity designated by OFAC, UN, EU, or HMT between September 8 and September 10 would not have been present in BofA's screening system during this window. All transactions involving such entities would have passed screening undetected.
>
> At BofA's screening volume of approximately 47,000 alerts/day, this represents roughly 70,500 transaction screenings against stale data."

Show this in a dark panel (navy background, white text) styled similarly to the AIInsightBanner but labeled "Scenario Analysis."

**The SPIKE_002 extended degradation (collapsible):**

> "From February 3–17, 2024, ACUITY_AGGREGATED entered partial failure mode, delivering duplicate and malformed records to the screening engine. Unlike a clean outage, degraded feed data is harder to detect:
>
> - The bank's screening system was running and processing transactions ✓
> - Acuity was delivering records every day ✓  
> - But the record counts were inflated by duplicates, then deflated as records were purged
>
> **The risk:** During the inflation phase (Feb 3–8), the same entity could appear multiple times → over-alerting. During the purge phase (Feb 9–17), legitimate records were deleted → entities temporarily fell off the screening list.
>
> Estimated days where entity coverage dipped below baseline: **7 of 15 failure days**."

**Section 6 — Ingestion Log Table**

Full log of `LIST_FEED_DAILY` records, paginated (25 rows/page).

Columns: Date | Feed | Status | Record Count | Delta | Latency | Failure Note

Filtering:
- `filter.dateRange` → date window
- A local status filter pill: All / Success / Partial Failure / Complete Failure
- Feed name filter: dropdown (All + each of 6 feeds)

Row highlighting:
- `complete_failure` rows: full red background (`bg-[#FDEAED]`), red text on status column
- `partial_failure` rows: amber background (`bg-[#FFF3E0]`)
- `success` rows: default white

The two Sep 9–10 2024 ACUITY complete failure rows should be clearly visible and linkable from the hypothetical scenario section ("see log entries →").

**Filter wiring:** Both `filter.dateRange` and `filter.lob` apply. LOB doesn't map directly to feeds — ignore LOB on this tab or show a note that feed health is system-wide, not LOB-specific. Tier filter also doesn't apply here.

### Imports needed

```typescript
import { LIST_FEED_DAILY, LIST_FEED_SUMMARY } from '@/data/synthetic/listFeeds'
import { SPIKE_EVENTS } from '@/data/synthetic/spikes'
import type { FilterState, ListFeedRecord, FeedName } from '@/types/index'
```

**Files changed:** `src/components/tabs/ListFeedHealth.tsx` (full rewrite from stub)

---

## Implementation Notes

### Sequence to build in

1. `src/app/page.tsx` → redirect (5 min, zero risk)
2. `FilterBar.tsx` → isDirty + TODAY constant (10 min)
3. `AlertReview.tsx` → remove @ts-nocheck, add imports, add useEffect (15 min)
4. `DispositionQuality.tsx` → full build (largest effort, ~200 lines)
5. `ListFeedHealth.tsx` → full build (largest effort, ~250 lines)

### Components to reuse as-is

These components already exist and should be imported directly into the new tabs — no modifications needed:
- `KPICard` from `@/components/common/KPICard`
- `DrillDownTable` from `@/components/common/DrillDownTable`
- `AIInsightBanner` (already in ExecutiveSummary, pattern to follow)

### Data derivation for reconciliation numbers

The funnel numbers in DispositionQuality can be hardcoded from pre-computed values (since all data is static):
- 225 new-era blocks
- 6 incorrectEntityMatch setbacks = 6 potentially disputed blocks
- 3 overdue filings
- 1 open/unresolved setback (SBK-024, date 2026-03-11)
- Clean chain count: 225 − 6 − 3 + overlaps = approximately 216 fully clean

Exact computation should be done in `useMemo` at component mount so the logic is transparent and reviewable.

### Chart sizing

Keep all charts consistent with existing tab conventions:
- KPI grid: `grid-cols-2 md:grid-cols-4`
- Chart panels: `bg-white rounded-xl border border-[#D0D9E8] shadow-sm p-5`
- Chart height: `h-56` (224px) for primary charts, `h-40` (160px) for secondary

### Typography / color conventions

Follow the patterns already established in `AlertReview.tsx` and `ReapplyRisk.tsx`:
- Section labels: `text-[11px] font-semibold uppercase tracking-widest text-[#4A5D75]`
- Breach/red: `#E61030`
- Navy: `#003571`
- Blue accent: `#0065B3`
- Muted text: `#8699AF`

---

*This document is the complete specification. Build each change exactly as described above.*

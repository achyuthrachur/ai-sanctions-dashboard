# Phase 6 Handoff — Relationship / Transaction Split View

## Status: COMPLETE ✅ — `npm run build` passes (0 errors)

---

## What was just done
Implemented the full Relationship/Transaction Split View across all 14 execution steps.

**Types (`types/index.ts`)**
- `FilterState`: added `viewMode: 'split' | 'combined'`
- `DailySummary`: added `l1CountRel/Trx`, `l2CountRel/Trx`, `l3CountRel/Trx`
- `DispositionWeek`: added `trueMatchRateRel/Trx`, `qaSetbackRateRel/Trx`, `totalReviewedRel/Trx`
- `BlockedAccount`: added `alertTypeCat: 'relationship' | 'transaction'`

**Data generators**
- `data/synthetic/alerts.ts` — 38%/62% rel/trx split in `generateDailySummaries()`
- `data/synthetic/disposition.ts` — rel/trx split rates in weekly generator
- `data/synthetic/blockedAccounts.ts` — `ALERT_TYPE_CYCLE` + `alertTypeCat` on all accounts

**New file: `src/lib/alertTypeHelpers.ts`** — `REL_COLOR` (#0065B3), `TRX_COLOR` (#C45A00), `reapplyAlertType()`

**FilterBar** — replaced dead alert type dropdown with Split/Combine pill toggle (Split = default)

**DashboardPage** — updated DEFAULT_FILTER, now passes `filter` to `BlockedAccounts` and `ReapplyRisk`

**AlertReview** — split bar pairs per tier, split-aware legend, heatmap note in split mode

**BlockedAccounts** — split monthly bar chart (stacked Rel/Trx), LOB chart sub-label in split mode

**ReapplyRisk** — split pie (2 segments), colored `●` dot in table rows

**ListFeedHealth** — informational banner in split mode

## What to do next
- Implement `DispositionQuality` tab charts — use `trueMatchRateRel/Trx`, `qaSetbackRateRel/Trx` from `DISPOSITION_WEEKLY`
- Implement `ExecutiveSummary` area/line chart using `relTotal`/`trxTotal` derived from `DAILY_SUMMARIES` split fields
- Deploy to Vercel

## Files touched
`types/index.ts`, `data/synthetic/alerts.ts`, `data/synthetic/disposition.ts`, `data/synthetic/blockedAccounts.ts`, `src/lib/alertTypeHelpers.ts` (new), `src/components/shell/FilterBar.tsx`, `src/app/dashboard/page.tsx`, `src/components/tabs/AlertReview.tsx`, `src/components/tabs/BlockedAccounts.tsx`, `src/components/tabs/ReapplyRisk.tsx`, `src/components/tabs/ListFeedHealth.tsx`

## Verify
```
npm run build   # must exit 0
```

---

# Previous: Phase 5 Handoff — BofA Sanctions Dashboard

## Status: PHASE 5 COMPLETE ✅ — DEPLOYED

## Deployed URL
**https://boa-sanctions-app.vercel.app**

Direct URL: https://boa-sanctions-ip7gocrhf-achyuth-rachurs-projects.vercel.app

## GitHub Repo
https://github.com/achyuthrachur/boa-sanctions-dashboard

## App Location (local)
`C:\Users\RachurA\AI Coding Projects\boa-sanctions-app`

## What Was Done in Phase 5

### FilterBar (`components/shell/FilterBar.tsx`)
- Sticky bar below TabNav: date presets (7D / 30D / 90D / Full Period) + LOB / Alert Type / Alert Level dropdowns
- Resets to 30D / All on "Reset" button (only shows when dirty)
- State managed at page level (`DashboardFilter` type in `types/filter.ts`), passed as props to all tabs
- Date range displayed in bottom-right of bar

### FilterBar wired to all tabs
- `ExecutiveSummary`: AreaChart sliced to `filter.dateRange`; visible spike annotations recomputed from range
- `DispositionQuality`: trend + bar charts filtered to date range; `latest` KPI uses last week in range
- `ListFeedHealth`: latency chart, delta chart, and log table all filtered to date range

### Breach Dots from live data (`lib/breachState.ts`)
- `computeBreachMap()` derives breach state from actual data:
  - Alert Review: amber if 7-day avg L1H SLA < 0.95
  - Reapply Risk: red if any Type A `active_risk` records exist
  - Disposition: amber if latest qaSetbackRate > 4%
  - List Feed: red if complete_failure in last 7 days
- `TabNav` accepts `breachMap: BreachMap` prop — no hardcoded breach states

### KPICard countUp on tab switch
- Added `animationKey?: string | number` prop
- `useEffect` depends on `[value, animationKey]` — fires on every tab switch
- RAF cleanup added (cancel on unmount to prevent memory leaks)
- `animationKey={activeTab}` passed from dashboard page through to all tab KPICards

### Accessibility
- `TopNav` uses `<header role="banner">`
- `TabNav` uses `<nav aria-label="Dashboard tabs">`, `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`, `focus-visible:ring`
- `FilterBar` uses `role="toolbar" aria-label`, `aria-pressed` on preset buttons, `aria-label` on selects
- `<main role="tabpanel">` with correct `id` linkage
- SR-only text on status indicator

### Responsive
- TopNav: truncates title text, hides prototype label on mobile
- TabNav: horizontal scroll for small viewports
- FilterBar: flex-wrap for small viewports
- All tab grids: `grid-cols-2 md:grid-cols-3 lg:grid-cols-6` etc.

### Build
✅ `npm run build` — clean, no warnings
✅ `npx tsc --noEmit` — clean

## Remaining (for Phase 5 follow-up or future sessions)
- Phases 2 & 3 stubs (AlertReview, BlockedAccounts, ReapplyRisk) need full implementation
- FilterBar LOB/type filters: currently passed to tabs but only date range affects chart data
  (full filter propagation to DrillDownTable rows is ready to wire once Phase 2/3 are built)
- Lighthouse score verification (requires live URL + Chrome DevTools)

# BofA Sanctions Dashboard — Fixes & Enhancements
**Inspected:** March 12, 2026  
**Workspace:** `AI Sanctions Dashboarding WireFrames`  
**Based on:** Full codebase audit against PRD + HANDOFF.md

---

## Summary

The shell, AlertReview, BlockedAccounts, and ReapplyRisk tabs are fully built and polished. Three tabs are stubs (ExecutiveSummary is partial, DispositionQuality and ListFeedHealth are empty placeholders). Several bugs exist in the integrated shell that affect the entire demo experience — most critically, fonts are not loaded, so all typography is falling back to system fonts. Fix the bugs first, then build the three missing tabs.

---

## 🔴 Critical Bugs (Fix Before Demo)

### BUG-01 — IBM Plex Sans fonts not imported
**File:** `src/app/layout.tsx`  
**Impact:** ALL typography across the entire dashboard falls back to system fonts. The `font-condensed` utility class (used for all KPI numbers) is non-functional. The entire typographic design system is broken.

**Root cause:** `layout.tsx` has no Google Fonts `<link>` import. `tailwind.config.ts` and `globals.css` reference the font families but they are never actually loaded.

**Fix:** Add to `<head>` in `layout.tsx`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
<link
  href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Sans+Condensed:wght@400;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
  rel="stylesheet"
/>
```

---

### BUG-02 — ExecutiveSummary insight text doesn't match PRD
**File:** `src/components/tabs/ExecutiveSummary.tsx` (line 10–12)  
**Impact:** The pre-written AI Insight text is wrong for the demo. The component shows a narrative about "18 consecutive days" and "96.2% compliance" but the PRD-specified text says "94.2% compliance" and tells a different story. Jason and the demo audience will notice inconsistency with other KPIs.

**Current text (wrong):**
```
"SLA compliance for L1 High-priority alerts has remained above the 95% target for 18 consecutive days following the resolution of the Acuity vendor backlog in February 2024..."
```

**PRD-specified text (correct):**
```
"As of March 11, 2026 — L1 High SLA compliance is at 94.2%, within target range. 22 reapply-tagged transactions have active counterparty sanctions exposure requiring immediate review — estimated total exposure $4.1M across Type A records. 3 OFAC blocked account filings are pending within the 10-day regulatory window. List feed health is nominal across all 6 sources. No maker-checker exceptions detected in the current period."
```

Also: The 4 KPI cards in the component show 96.2% but PRD and ReapplyRisk tab both use 94.2%. Fix value to 94.2%.

---

### BUG-03 — FilterBar Reset button always visible
**File:** `src/components/shell/FilterBar.tsx` (line 124–131)  
**Impact:** Reset button shows even when filters are at default state, creating visual noise and making it unclear whether filters are active.

**Fix:** Add a `isDirty` check before rendering the Reset button:
```typescript
const isDirty =
  filter.dateRange !== null ||
  filter.lob !== "all" ||
  filter.tier !== "all";
```
Only render the `<button>` when `isDirty` is true.

---

### BUG-04 — FilterBar hardcodes end date as "2026-03-11"
**File:** `src/components/shell/FilterBar.tsx` (line 42–43)  
**Impact:** Minor but reflects poor code quality. Should derive from `TODAY` in `@/lib/utils` to be consistent with all other date references in the app.

**Fix:**
```typescript
import { TODAY } from "@/lib/utils";
// ...
function applyPreset(days: number): FilterState["dateRange"] {
  if (days === 0) return null;
  const d = new Date(TODAY + "T00:00:00Z");
  d.setDate(d.getDate() - days);
  return { start: d.toISOString().slice(0, 10), end: TODAY };
}
```

---

### BUG-05 — `@ts-nocheck` in AlertReview suppresses real type errors
**File:** `src/components/tabs/AlertReview.tsx` (line 1)  
**Impact:** TypeScript errors are silently ignored across the entire file. Specifically, `DailySummary` is used as a type annotation in `useMemo` callbacks (e.g., `useMemo<DailySummary[]>`) but is never imported. Also `avgField` uses `keyof DailySummary` without the type being in scope.

**Fix:** Remove `// @ts-nocheck`. Import `DailySummary` from `@/types/index` (it should be defined there alongside `AlertRecord`). Fix any remaining type errors properly.

---

### BUG-06 — BlockedAccounts receives no FilterState props
**File:** `src/app/dashboard/page.tsx` (line 45)  
**Impact:** The global FilterBar's LOB and date range selections have zero effect on the Blocked Accounts tab. Changing LOB filter or date range does nothing when on this tab. FilterBar appears broken to demo viewers.

**Current:**
```tsx
{activeTab === "blocked-accounts" && <BlockedAccounts />}
```
**Fix:** Add FilterState to `BlockedAccounts` component props interface and pass `filter={filter}` from the dashboard. Wire LOB and date range to filter the OFAC filing table rows.

---

### BUG-07 — FilterBar Tier filter doesn't sync AlertReview's activeTier
**File:** `src/components/tabs/AlertReview.tsx` (line 166–168)  
**Impact:** If a user pre-selects Tier "L2" or "L3" in the FilterBar, the AlertReview tab still opens on L1. The tier pill selection inside AlertReview and the global FilterBar's tier filter are not synchronized after mount.

**Root cause:** `useState` initializer runs once at mount. Subsequent FilterBar tier changes don't update `activeTier`.

**Fix:** Add a `useEffect` to sync:
```typescript
useEffect(() => {
  if (filters.tier && filters.tier !== 'all') {
    setActiveTier(filters.tier as ActiveTier);
  }
}, [filters.tier]);
```

---

### BUG-08 — TabNav breach dots are hardcoded, not data-driven
**File:** `src/components/shell/TabNav.tsx` (lines 18–25)  
**Impact:** The HANDOFF.md states breach dots were made data-driven, but the current `TabNav.tsx` has all breach states hardcoded. Only `reapply-risk` has `hasBreach: true`. The `alert-review` dot never activates even when L1H SLA is below target. The `list-feed-health` dot never activates even when a feed failure exists.

**Fix:** Create `src/lib/breachState.ts` with a `computeBreachMap()` function that derives breach states from actual data. Pass the result as a `breachMap` prop to `TabNav`, replacing the hardcoded `hasBreach` flags. See HANDOFF.md for the intended logic.

---

### BUG-09 — KPICard countUp doesn't re-fire on tab switch
**File:** `src/components/common/KPICard.tsx` (line 55–70)  
**Impact:** HANDOFF.md says Anime.js countUp was wired to re-fire on every tab switch via an `animationKey` prop. Current code doesn't have this prop. The countUp animation only fires on initial mount, never when returning to a tab. The "wow factor" of seeing numbers count up is lost after first load.

**Fix:** Add `animationKey?: string | number` to `KPICardProps`. Add it to the `useEffect` dependency array. Pass `animationKey={activeTab}` from the dashboard page through to each tab's KPI cards. Include RAF cleanup on unmount.

---

## 🟡 Missing Features (Phase 4 Implementation Gaps)

### FEAT-01 — ExecutiveSummary: incomplete implementation
**File:** `src/components/tabs/ExecutiveSummary.tsx`  
**Status:** Partial — has AIInsightBanner and 4 KPI cards, but critically missing tab navigation and charts.

**What's missing (per PRD Phase 4):**
- **6 KPI cards** (one per tab, not 4): SLA Compliance 94.2% amber → links to Alert Review; Maker-Checker 100.0% green → links to Alert Review; Active Blocked Accounts 892 neutral → links to Blocked Accounts; Reapply Risk Items 33 RED → links to Reapply Risk; QA Setback Rate 2.1% green → links to Disposition Quality; Feed Health 6/6 Nominal green → links to List & Feed Health
- **`onClick` handlers** on KPI cards that call the tab change function (requires lifting `onTabChange` prop into ExecutiveSummary)
- **Alert Volume AreaChart** (Recharts AreaChart, 30-day rolling, all tiers, with SpikeAnnotation overlays)
- **Active Breach Summary Panel** (list of all red/amber metrics with "View Details →" links to their tabs)
- Data imports from `data/synthetic/alerts.ts`, `data/synthetic/reapply.ts`, `data/synthetic/blockedAccounts.ts`

**Demo impact:** This is the LANDING tab — the first thing Jason sees. The current state (KPI cards pointing to the wrong tab, no chart, no breach panel) does not support the PRD's demo sequence starting with "Land on Executive Summary — AI banner calls out the 22 active exposure items."

---

### FEAT-02 — DispositionQuality: complete stub replacement needed
**File:** `src/components/tabs/DispositionQuality.tsx`  
**Status:** Empty placeholder.

**What to build (per PRD Phase 4):**
1. **KPI Row**: True Match Rate (0.5%, green) | QA Setback Rate (2.1%, green) | Auto-Cleared Rate (~35%, neutral) | Open Setbacks (count, amber if >0)
2. **True Match Rate Trend**: Recharts LineChart, 90-day window, from `DISPOSITION_WEEKLY`. SpikeAnnotation at SPIKE_001 (elevated false positives) and SPIKE_002.
3. **QA Setback Rate Chart**: Recharts BarChart, weekly setback rate stacked by reason category. Click bar → DrillDownTable with `SetbackRecord` rows.
4. **Setback Reason Breakdown**: Recharts PieChart showing breakdown from `SETBACK_REASON_BREAKDOWN` or derived from `SETBACK_RECORDS`.
5. **Reapply Connection Callout**: Card with text "22 active reapply transactions flagged with potential sanctions exposure. Incorrect disposition at original approval may have enabled indefinite straight-through processing." + "View Reapply Risk →" button (navigates tab).

**Data available:** `data/synthetic/disposition.ts` exports `DISPOSITION_WEEKLY` (75 weeks), `SETBACK_RECORDS`, `SETBACK_REASON_BREAKDOWN`.

---

### FEAT-03 — ListFeedHealth: complete stub replacement needed
**File:** `src/components/tabs/ListFeedHealth.tsx`  
**Status:** Empty placeholder.

**What to build (per PRD Phase 4):**
1. **Feed Status Row**: One card per feed (6 total: OFAC_SDN, OFAC_CONSOLIDATED, UN_SC, EU_CONSOLIDATED, HMT, ACUITY_AGGREGATED). Each shows StatusDot (green/red), feed name, last ingestion timestamp, record count, last delta.
2. **Ingestion History Chart**: Recharts multi-line chart, daily latency per feed, 30-day window. SPIKE_002 (Feb 3–17 2024) ACUITY partial failure must be visible as a gap/spike.
3. **Delta Tracker**: Recharts AreaChart, entities added/removed per day. SPIKE_003 (Jun 2024 OFAC SDN additions) visible as spike. SPIKE_001 HMT +28,400 visible.
4. **Ingestion Log Table**: Date | Feed | Status | Record Count | Delta Added | Delta Removed | Latency | Error Code. Sep 9–10 2024 ACUITY `complete_failure` rows must be highlighted in red. Feb 2024 `partial_failure` rows in amber.

**Data available:** `data/synthetic/listFeeds.ts` exports `LIST_FEED_DAILY` and `FEED_LATEST_STATUS`.

---

## 🟠 Quality & Accessibility Issues

### QA-01 — Accessibility ARIA attributes not present
**Files:** `src/components/shell/TabNav.tsx`, `src/components/shell/FilterBar.tsx`, `src/app/dashboard/page.tsx`  
**HANDOFF.md claimed these were added but they are absent from the current code.**

Missing:
- `TabNav`: `<nav aria-label="Dashboard tabs">`, `role="tablist"` on container, `role="tab"` on each button, `aria-selected={activeTab === tab.id}`, `aria-controls={tab.id}`, `focus-visible:ring-2` on buttons
- `FilterBar`: `role="toolbar" aria-label="Dashboard filters"`, `aria-pressed={isActive}` on preset buttons
- Dashboard `<main>`: `role="tabpanel"` with `id` matching the active tab
- `TopNav`: `<header role="banner">` (currently `<nav>`)

**Impact:** Lighthouse Accessibility score will be significantly below 90. The PRD targets >90 Accessibility.

---

### QA-02 — TopNav "Live" indicator is misleading for a prototype
**File:** `src/components/shell/TopNav.tsx` (line 33–34)  
**Impact:** The pulsing green "Live" dot and "Live" text suggest real-time data, but the very same nav bar has a "Prototype — Synthetic Data" badge. This is contradictory and could raise questions from the BofA audience about data authenticity. The "Live" indicator was intended to simulate production state, but in a prototype it reads as a quality issue.

**Fix options:**
- Change "Live" to "Simulated Live" or
- Change the green dot text from "Live" to "Connected" and keep it as-is (ambiguous but professional), or
- Remove the "Live" label and keep just the "Prototype — Synthetic Data" badge

---

### QA-03 — AlertReview lacks outer padding/max-width wrapper
**File:** `src/components/tabs/AlertReview.tsx` (line 364)  
**Impact:** The outer `<div className="space-y-6 font-sans">` has no padding or max-width constraint. All other tabs wrap content in `<div className="p-6 max-w-[1440px] mx-auto">`. AlertReview's content bleeds to the container edges at large viewports and lacks the 24px padding on mobile.

**Fix:** Wrap the return in `<div className="p-6 space-y-6 max-w-[1440px] mx-auto">`.

---

### QA-04 — Inconsistent max-width constraints across tabs
**Observed across:** multiple tab components  
All tabs should use `max-w-[1440px] mx-auto` at the content root. Current state:
- ExecutiveSummary: ✅ has `max-w-[1440px] mx-auto`
- AlertReview: ❌ missing
- BlockedAccounts: ❌ uses `min-h-full` without max-width
- ReapplyRisk: ❌ uses `min-h-full` without max-width
- DispositionQuality: ✅ has it (stub)
- ListFeedHealth: ✅ has it (stub)

At ultra-wide displays (>1440px), content in AlertReview, BlockedAccounts, and ReapplyRisk will stretch uncomfortably.

---

### QA-05 — `SpikeAnnotation.tsx` component exists but may be unused in chart contexts
**File:** `src/components/common/SpikeAnnotation.tsx`  
**Inspection needed:** `AlertReview.tsx` implements spike annotations inline using Recharts `ReferenceLine` with a custom `SpikeRefLabel` component — it doesn't import or use the standalone `SpikeAnnotation.tsx` component. Verify whether `SpikeAnnotation.tsx` is being used anywhere or is dead code. If unused, either wire it properly or remove it.

---

## 🟢 Enhancement Opportunities

### ENH-01 — Add `animationKey` to KPICard for tab-switch countUp
Already listed as BUG-09 but also an enhancement: once fixed, this is one of the highest-impact polish items. KPI numbers counting up every time you switch tabs dramatically elevates the demo feel.

---

### ENH-02 — Implement dynamic breach detection with `computeBreachMap()`
Already listed as BUG-08. Enhancement detail: the breach logic should be:
- **Alert Review** (amber): 7-day avg L1H SLA < 95%
- **Reapply Risk** (red): any Type A `active_risk` records exist — always true in this dataset
- **Disposition Quality** (amber): latest QA setback rate > 4%
- **List & Feed Health** (red): any `complete_failure` in last 7 days

With current synthetic data, the expected live breach state is:
- Reapply Risk: 🔴 red (22 Type A active)
- Alert Review: likely 🟢 green (SLA is ~96.2–94.2% — above 95% target... wait, 94.2% is BELOW 95%, so actually this should be 🟡 amber)
- Other tabs: depends on data

---

### ENH-03 — FilterBar active filter count badge
When filters deviate from default, show a small badge on a "Filters Active" indicator so users know data is being filtered. Example: "2 filters active" next to the Reset button. This helps during demos when the audience may not notice the filter bar state.

---

### ENH-04 — DrillDownTable max-height too restrictive
**File:** `src/components/common/DrillDownTable.tsx` (line 117)  
The table body is capped at `max-h-64` (256px). This typically shows only 8–10 rows before scrolling. For the demo, increase to `max-h-96` (384px) or make it responsive to viewport height (`max-h-[40vh]`).

---

### ENH-05 — Add favicon for demo polish
**File:** `src/app/layout.tsx`  
No favicon is set. During the demo, the browser tab will show a blank icon. Add BofA favicon or a generic one:
```typescript
export const metadata: Metadata = {
  // ... existing
  icons: { icon: "/bank_of_america_logo.svg" },
};
```

---

### ENH-06 — AlertReview: add TierTabBar inside padding wrapper
**File:** `src/components/tabs/AlertReview.tsx`  
The L1/L2/L3 tier tab bar renders outside the content padding. It should be inside the padded container. With the fix from QA-03, the `TierTabBar` will naturally fall inside the `p-6` wrapper, but double-check that it still has `mb-6` spacing.

---

### ENH-07 — ReapplyRisk sticky red banner z-index conflict
**File:** `src/components/tabs/ReapplyRisk.tsx` (line 313)  
The red alert banner uses `sticky top-0 z-20`. The `FilterBar` uses `z-20` and `TabNav` uses `z-10`. When scrolling on the Reapply Risk tab, the sticky red banner may overlap the FilterBar if the main area scrolls behind it. Verify `z-index` stacking is correct at all scroll positions. The dashboard's `<main>` has `overflow-auto`, so the inner sticky should behave correctly, but validate during testing.

---

### ENH-08 — Sparkline in KPICard only shows when trend data provided
Current `ExecutiveSummary.tsx` only passes `trend` to 2 of 4 KPI cards. Once the tab is rebuilt with all 6 cards, ensure all cards that have trend data pass it through. Cards without trend data should still look visually balanced — consider whether a flat "no data" state is needed.

---

## 📋 Build Order Recommendation

Fix the bugs in this sequence for maximum demo readiness:

1. **BUG-01** — Fix fonts (highest visual impact, 2-minute fix)
2. **BUG-02** — Fix insight text and KPI values (demo accuracy)
3. **BUG-03** — Fix Reset button visibility (UX polish)
4. **BUG-04** — Fix hardcoded date in FilterBar
5. **FEAT-01** — Complete ExecutiveSummary (demo sequence starts here)
6. **FEAT-02** — Build DispositionQuality
7. **FEAT-03** — Build ListFeedHealth
8. **BUG-09 / ENH-01** — Add animationKey to KPICard
9. **BUG-08 / ENH-02** — Implement dynamic breach dots
10. **BUG-06** — Wire FilterState to BlockedAccounts
11. **BUG-07** — Sync FilterBar tier to AlertReview
12. **QA-01** — Add ARIA attributes (Lighthouse target)
13. **BUG-05** — Remove @ts-nocheck from AlertReview
14. **QA-03 / QA-04** — Fix padding/max-width consistency
15. **ENH-05** — Add favicon

---

## 📁 Files Requiring Changes

| File | Issues |
|------|--------|
| `src/app/layout.tsx` | BUG-01 (fonts), ENH-05 (favicon) |
| `src/app/dashboard/page.tsx` | BUG-06 (BlockedAccounts props), QA-01 (tabpanel role), FEAT-01 (onTabChange to ExecSummary) |
| `src/components/shell/TabNav.tsx` | BUG-08 (breach dots), QA-01 (ARIA) |
| `src/components/shell/FilterBar.tsx` | BUG-03 (Reset visibility), BUG-04 (hardcoded date), QA-01 (ARIA) |
| `src/components/shell/TopNav.tsx` | QA-02 (Live indicator), QA-01 (header role) |
| `src/components/common/KPICard.tsx` | BUG-09 (animationKey) |
| `src/components/tabs/ExecutiveSummary.tsx` | BUG-02 (insight text), FEAT-01 (full implementation) |
| `src/components/tabs/AlertReview.tsx` | BUG-05 (@ts-nocheck), BUG-07 (tier sync), QA-03 (padding) |
| `src/components/tabs/BlockedAccounts.tsx` | BUG-06 (FilterState props), QA-04 (max-width) |
| `src/components/tabs/ReapplyRisk.tsx` | QA-04 (max-width), ENH-07 (z-index verify) |
| `src/components/tabs/DispositionQuality.tsx` | FEAT-02 (full implementation) |
| `src/components/tabs/ListFeedHealth.tsx` | FEAT-03 (full implementation) |
| `src/components/common/DrillDownTable.tsx` | ENH-04 (max-height) |
| `src/lib/breachState.ts` | BUG-08 (create new file) |

---

*Document generated by codebase inspection against PRD v1.0 and HANDOFF.md Phase 5.*

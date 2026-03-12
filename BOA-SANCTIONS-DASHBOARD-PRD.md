# BofA Sanctions Continuous Monitoring Dashboard
## Product Requirements Document — Phased Build for Parallel Claude Code Instances

**Client:** Bank of America — Sanctions Audit Team  
**Delivered by:** Crowe LLP — Integrated Risk Management / AI Practice  
**Contact:** Achyuth Rachur, Staff Consultant, IRM  
**Purpose:** Prototype demonstrating continuous monitoring and auditing of the sanctions program. Replaces a static monthly Tableau dashboard with an interactive, drill-down capable, breach-aware monitoring surface that can be actioned upon — not just observed.  
**Status:** Pre-production prototype. All data is synthetic.  
**Date:** March 2026

---

## Background & Objective

BofA's sanctions audit team has Tableau dashboards that nobody uses. They refresh monthly, summarize at too high a level to be actionable, and provide no drill-down, no breach logic, and no decision support. The audit director's exact ask: *"I want something I can hold in my hand. Push a button. Here are the results."*

This prototype demonstrates what that looks like — moving from a dashboard as a passive information source to a command center that surfaces breaches, supports decision-making, and shows a clear path to action. The Tableau-style visual grammar is intentional: it gives the BofA team a familiar reference point while demonstrating a meaningfully better interaction model.

The prototype must be polished enough to demo to an audit director, senior audit managers, and a retired FDIC financial crimes specialist in a live session. Every interaction must work. No broken states.

---

## Tech Stack

- **Framework:** Next.js (App Router, TypeScript)
- **Styling:** Tailwind CSS with custom design tokens in `tailwind.config.ts`
- **Charts:** Recharts — cross-filter behavior (click chart element → filter drill-down table)
- **Components:** Shadcn/ui for primitives (tables, tooltips, dropdowns, badges)
- **Animation:** Framer Motion for tab transitions and panel reveals; Anime.js v4 for countUp on KPI numbers and stagger on table row entrances
- **Data layer:** All content in `/data` as typed TypeScript objects — zero runtime API calls in prototype
- **Deployment:** Vercel — standard Next.js deployment, supports API routes, SSR, server actions. No static export needed.
- **Repo:** `gh repo create achyuthrachur/boa-sanctions-dashboard --public --source=. --remote=origin --push`

---

## Architecture

```
/
├── app/
│   ├── page.tsx                    # Landing page (see Landing Page spec below)
│   └── dashboard/
│       └── page.tsx                # Main dashboard shell
├── components/
│   ├── shell/
│   │   ├── AppShell.tsx
│   │   ├── TopNav.tsx
│   │   ├── FilterBar.tsx
│   │   └── TabNav.tsx
│   ├── common/
│   │   ├── KPICard.tsx
│   │   ├── DrillDownTable.tsx
│   │   ├── SpikeAnnotation.tsx
│   │   ├── EscalationTooltip.tsx
│   │   ├── AIInsightBanner.tsx
│   │   ├── BreachBadge.tsx
│   │   └── StatusDot.tsx
│   └── tabs/
│       ├── ExecutiveSummary.tsx
│       ├── AlertReview.tsx
│       ├── BlockedAccounts.tsx
│       ├── ReapplyRisk.tsx
│       ├── DispositionQuality.tsx
│       └── ListFeedHealth.tsx
├── data/
│   ├── synthetic/
│   │   ├── alerts.ts
│   │   ├── blockedAccounts.ts
│   │   ├── disposition.ts
│   │   ├── makerChecker.ts
│   │   ├── listFeeds.ts
│   │   ├── reapply.ts
│   │   ├── staffing.ts
│   │   └── spikes.ts
│   └── config/
│       ├── thresholds.ts
│       ├── escalation.ts
│       └── meta.ts
├── hooks/
│   ├── useFilteredData.ts          # Applies global FilterBar state to any dataset
│   └── useDrillDown.ts             # Manages selected chart element → table state
├── types/
│   └── index.ts                    # All shared TypeScript interfaces
└── lib/
    └── utils.ts                    # Date helpers, formatters, breach calculators
```

**Architecture rule:** Components are dumb. They receive data as props and render it. No component imports directly from `/data`. Data flows: `page.tsx` loads from `/data` → passes to tab components as props → tab components pass to chart/table components. This makes content iteration fast without touching component logic.

---

## Design Direction

**Aesthetic:** Refined enterprise — Bloomberg terminal meets internal audit war room. BofA brand-anchored: deep `#003571` navy top bar and landing page hero, `#0065B3` blue accents, `#E61030` red strictly for breach/danger states. Clean white content area, sharp typographic hierarchy. The brand palette does the heavy lifting — no generic SaaS gradients or decorative color.

**Typography:**
- Display / KPI numbers: `IBM Plex Sans Condensed` (bold, large)
- Body / tables / labels: `IBM Plex Sans` (regular/medium)
- Import via Google Fonts in `layout.tsx`

**Interaction model:** Tableau-style cross-filtering. Clicking a bar in any chart filters the DrillDownTable beneath it. Clicking a KPI card navigates to the relevant detail tab. Every data point has a path to the underlying record.

**Breach states:**
- Green border + dot: passing (≥95%)
- Amber border + dot: warning (90–95%)
- Red border + dot + pulsing animation: breach (<90% or active exception)
- Breached cards show `EscalationTooltip` on hover — grayed out, locked, synthetic contacts visible

**AI Insight Banner:** Fixed panel at top of Executive Summary. Pre-written synthetic narrative in prototype. Lock icon + "Connect to live data feed to enable AI-generated insights" in bottom corner.

**Spike Annotations:** Vertical dashed line on time-series charts at known spike dates. Hover popover explains the cause.

---

## Brand Assets

**Logo:** `bank_of_america_logo.svg` is in the project root — copy it to `/public/bank_of_america_logo.svg` at project init. Reference it in the top nav and landing page as a Next.js `<Image>` component pointing to `/bank_of_america_logo.svg`.

**Brand colors extracted from SVG:**
- BofA Blue: `rgb(0, 101, 179)` → `#0065B3`
- BofA Red: `rgb(230, 16, 48)` → `#E61030`

These two colors are the primary brand palette. All other colors derive from or complement them. No Crowe colors anywhere in this project.

## Design Tokens

```typescript
// tailwind.config.ts — extend colors:
colors: {
  boa: {
    blue: '#0065B3',
    'blue-dark': '#004A8F',
    'blue-deeper': '#003571',
    'blue-light': '#E6F0FA',
    red: '#E61030',
    'red-dark': '#B50026',
    'red-light': '#FDEAED',
  },
  surface: {
    DEFAULT: '#F5F7FA',
    card: '#FFFFFF',
    border: '#D0D9E8',
  },
  text: {
    primary: '#0A1628',
    secondary: '#4A5D75',
    muted: '#8699AF',
  },
  status: {
    red: '#E61030',
    'red-light': '#FDEAED',
    amber: '#C45A00',
    'amber-light': '#FFF3E0',
    green: '#1A6632',
    'green-light': '#E6F4EA',
    blue: '#0065B3',
    'blue-light': '#E6F0FA',
  }
}
```

**Usage rules:**
- Top nav + landing page hero background: `boa-blue-deeper` (`#003571`)
- Active tab indicator / accent lines / links: `boa-blue` (`#0065B3`)
- Breach / danger states: `boa-red` (`#E61030`) — BofA red maps perfectly to danger
- AI Insight banner background: `boa-blue-deeper` with white text
- Reapply Risk red alert banner: `boa-red` background, white text
- All other surfaces: white / `surface-DEFAULT`

---

## Landing Page Specification

The app opens on a landing page (`app/page.tsx`) before entering the dashboard. This is the first thing BofA sees in a demo — it sets tone, communicates purpose, and gives the session context. It should feel like a Crowe-delivered product for BofA, not a generic prototype.

### Layout

**Full-viewport hero section:**
- Background: `boa-blue-deeper` (`#003571`) — full bleed
- Top-left: BofA logo (`/public/bank_of_america_logo.svg`) — white version or rendered on dark background at appropriate size
- Centered headline: `"Sanctions Continuous Monitoring"` — large, IBM Plex Sans Condensed, white
- Sub-headline: `"Continuous Auditing & Assurance Platform — Prototype"` — smaller, white/70% opacity
- Below sub-headline: a single `"Enter Dashboard →"` CTA button — white background, `boa-blue` text, subtle hover state
- Bottom-right corner: `"Delivered by Crowe LLP | Integrated Risk Management"` — small muted text, white/50% opacity

**Below the hero — 3-column "What This Shows" section:**
White background. Three cards, each with an icon, a short title, and 1-sentence description:

1. **Alert SLA Compliance** — "Track timeliness of L1, L2, and L3 sanctions alert reviews against regulatory SLA targets — by day, by priority, by line of business."
2. **Reapply Transaction Risk** — "Surface recurring transactions that bypass screening after a counterparty or corridor has been sanctioned — with estimated exposure and a timeline of undetected activity."
3. **Blocked Account Monitoring** — "Monitor new blocks, unblock events, OFAC 10-day filing compliance, and dollar volume — with a direct path to the annual blocked account reconciliation."

**Footer strip:**
`boa-blue-deeper` background, white text. Left: "Bank of America | Sanctions Audit — Continuous Monitoring Dashboard". Right: "Prototype — All data is synthetic. Not for production use."

### Behavior
- The "Enter Dashboard →" button navigates to `/dashboard`
- No authentication, no loading state — direct navigation
- Framer Motion: headline and sub-headline fade+slide up on page load (staggered, 0.2s delay between elements)
- The 3 feature cards animate in with a stagger as they enter the viewport (Framer Motion `whileInView`)

### What NOT to do
- No generic stock imagery or illustrations
- No carousel or auto-playing anything
- No marketing copy — this is a tool, not a product page
- Keep it to two sections (hero + feature cards) — clean, fast, purposeful

---

## Synthetic Data Specifications

**Time Range:** October 1, 2023 — March 11, 2026 (~18 months of daily data)

Spike events must be **narratively consistent across all files** — a single real-world event (e.g. Feb 2024 Acuity vendor failure) must show up simultaneously in alert volumes, SLA compliance degradation, and list feed health data.

### Alert Volumes (`alerts.ts`)

**Schema:**
```typescript
interface DailyAlertSummary {
  date: string                    // ISO "2024-01-15"
  l1High: number
  l1Medium: number
  l1Low: number
  l2Total: number
  l3Total: number
  relationshipAlerts: number      // higher risk, ~15% of total
  transactionAlerts: number       // lower risk, ~85% of total
  lobGCIB: number
  lobGCB: number
  lobGES: number
  lobOther: number
  slaComplianceL1High: number     // 0–1
  slaComplianceL1Medium: number
  slaComplianceL1Low: number
  slaComplianceL2: number
  slaComplianceL3: number
  spikeEventId?: string
}

interface AlertRecord {           // 200 rows for DrillDownTable demos
  alertId: string
  date: string
  alertType: 'relationship' | 'transaction'
  priority: 'high' | 'medium' | 'low'
  tier: 'L1' | 'L2' | 'L3'
  originatorEntity: string
  beneficiaryEntity: string
  originatorCountry: string
  beneficiaryCountry: string
  alertDate: string
  reviewDate: string | null
  hoursToReview: number | null
  slaStatus: 'within_sla' | 'breach' | 'pending'
  analystId: string
  disposition: 'approved' | 'blocked' | 'escalated' | 'pending' | 'auto_cleared'
  makerId: string
  checkerId: string
  lob: 'GCIB' | 'GCB' | 'GES' | 'Other'
}
```

**Volume targets:**
- Daily average: 40,000–55,000 baseline
- L1 ~90% of volume, L2 ~8%, L3 ~2%

**Spike events (must be consistent across ALL data files):**
```
SPIKE_001: Nov 14, 2023 — Bank of England list merge → 682K single-day alert spike
SPIKE_002: Feb 3–17, 2024 — Acuity vendor partial ingestion failure → 14-day backlog
SPIKE_003: Jun 22, 2024 — OFAC SDN additions (geopolitical) → 3-day elevated volume
SPIKE_004: Oct 8, 2024 — Internal threshold tuning change → 10-day anomaly
SPIKE_005: Jan 15, 2025 — Maker-checker rollout → temporary volume increase
```

**SLA compliance:**
- Baseline: L1 High/Med 94–97%, L1 Low 99%, L2 96%, L3 98%
- SPIKE_002: L1 High drops to 71%, L1 Med to 78%
- SPIKE_001: L1 High drops to 83%

### Maker-Checker Log (`makerChecker.ts`)

```typescript
interface MakerCheckerRecord {
  alertId: string
  alertDate: string
  makerId: string
  checkerId: string
  isSamePerson: boolean
  exceptionType?: 'entitlement_provisioning' | 'system_bypass' | 'implementation_gap'
  resolutionDate?: string
  resolutionNotes?: string
}
```

- 99.8% clean across full period
- **3 synthetic exceptions:**
  - Dec 12, 2023: `implementation_gap` (pre-consent order control)
  - Mar 4, 2024: `implementation_gap` (rollout gap during SPIKE_002)
  - Aug 19, 2024: `entitlement_provisioning` (IT access error, remediated in 4 days)

### Blocked Accounts (`blockedAccounts.ts`)

```typescript
interface BlockedAccount {
  accountId: string
  entityName: string
  entityType: 'individual_entity' | 'corporate' | 'correspondent_bank'
  blockDate: string
  blockReason: string
  listSource: 'OFAC_SDN' | 'OFAC_CONSOLIDATED' | 'UN_SC' | 'EU_CONSOLIDATED' | 'HMT' | 'ACUITY'
  dollarBalance: number
  currency: string
  lob: 'GCIB' | 'GCB' | 'GES' | 'Other'
  ofacFilingRequired: boolean
  ofacFilingDeadline: string | null
  ofacFilingDate: string | null
  ofacFilingId: string | null
  filingStatus: 'filed_on_time' | 'filed_late' | 'pending' | 'overdue' | 'not_required'
  unblockDate: string | null
  isActive: boolean
}
```

- 847 legacy accounts blocked prior to Oct 2023 (some since 2001)
- New blocks: 12–40/month
- OFAC 10-day filing: 96% baseline compliance, 2–3 overdue/month during high-volume periods
- Dollar volume: $4K–$2.3M per account
- ~15% of new blocks unblocked within 30 days

### Disposition Quality (`disposition.ts`)

```typescript
interface DispositionSummary {
  date: string
  totalDispositioned: number
  trueMatchRate: number           // % relationship alerts → actual block
  qaSetbackRate: number
  setbackReasons: {
    insufficientDocumentation: number
    incorrectEntityMatch: number
    policyMisapplication: number
    other: number
  }
  autoCleared: number
}
```

- True match rate: 0.3–0.8%
- QA setback rate: 2.1% baseline, 5–8% during SPIKE_001 and SPIKE_002
- Auto-cleared: ~35% of low-priority alerts

### Reapply Risk (`reapply.ts`) — Headline Feature

This is the live process gap named explicitly in the client meeting. A recurring transaction is approved once, tagged "reapply" for straight-through processing, and never re-screened. If either party is subsequently sanctioned — or the corridor is — the transactions keep flowing undetected.

```typescript
type ReapplyRiskType = 'A_COUNTERPARTY' | 'B_CORRIDOR' | 'C_STALE_REVIEW' | 'D_CLEAN'

interface ReapplyTransaction {
  transactionId: string
  originatorEntity: string
  originatorCountry: string
  beneficiaryEntity: string
  beneficiaryCountry: string
  transactionAmount: number
  currency: string
  frequency: 'daily' | 'weekly' | 'monthly'
  reapplyApprovalDate: string
  lastReviewDate: string | null
  riskType: ReapplyRiskType
  riskFlag: boolean
  riskFlagDate: string | null     // MUST be 6+ months after reapplyApprovalDate
  riskFlagDetail: string | null   // e.g. "Beneficiary added to OFAC SDN Feb 14 2024"
  riskFlagSource: string | null
  estimatedExposure: number       // total $ transacted since riskFlagDate
  currentStatus: 'active_risk' | 'under_review' | 'remediated' | 'clean'
  lob: 'GCIB' | 'GCB' | 'GES' | 'Other'
}
```

**Distribution (340 total):**

- **Type A — Counterparty Hit (22):** One party added to a sanctions list AFTER reapply approval. Transactions are still flowing.
  - Example: Monthly wire $47,500 to trading company designated under OFAC Russia/Ukraine sanctions Feb 14, 2024. Reapply approved Oct 2022. 13 months of undetected transactions. Estimated exposure ~$617,500.
  - Example: Weekly $8,200 to logistics firm added to UN Security Council list Jun 2024.
  - All Type A: `riskFlagDate` is 6–18 months after `reapplyApprovalDate`

- **Type B — Corridor Risk (11):** Origin/destination jurisdiction placed under new/expanded sanctions since reapply approval. Transaction parties are not individually sanctioned but the corridor is restricted.

- **Type C — Stale Review (67):** Reapply approval >18 months old, no review conducted. No current sanctions hit detected but SLA missed.

- **Type D — Clean (240):** Current reviews, no sanctions exposure.

**Critical data integrity rule:** Type A `riskFlagDate` must post-date `reapplyApprovalDate` by at least 6 months. This is what makes the scenario realistic and devastating — the original approval was legitimate.

### List Feed Health (`listFeeds.ts`)

```typescript
interface ListFeedRecord {
  date: string
  feedId: 'OFAC_SDN' | 'OFAC_CONSOLIDATED' | 'UN_SC' | 'EU_CONSOLIDATED' | 'HMT' | 'ACUITY_AGGREGATED'
  ingestionStatus: 'success' | 'partial_failure' | 'complete_failure'
  recordCount: number
  deltaAdded: number
  deltaRemoved: number
  latencyMinutes: number
  errorCode: string | null
  notes: string | null
}
```

- SPIKE_002 (Feb 3–17, 2024): Acuity Aggregated → `partial_failure` for 14 days
- Sep 9–10, 2024: Acuity Aggregated → `complete_failure` for 36 hours
- All other records: success, latency 5–25 min

### Staffing (`staffing.ts`)

```typescript
interface StaffingWeek {
  weekStart: string
  totalAnalysts: number           // baseline 156
  makers: number
  checkers: number
  qaLeads: number
  teamLeads: number
  totalAlertVolumeWeek: number
  alertsPerAnalyst: number
  overtimeIndicator: boolean      // true when alerts/analyst > 120% baseline
}
```

### Spike Events (`spikes.ts`)

```typescript
interface SpikeEvent {
  id: string
  date: string
  endDate: string | null
  label: string
  description: string
  magnitude: string
  cause: 'list_merge' | 'vendor_failure' | 'geopolitical' | 'internal_tuning' | 'control_rollout'
  affectedMetrics: string[]
}
```

### Config Files

**`thresholds.ts`:**
```typescript
export const SLA_THRESHOLDS = {
  l1High:   { target: 0.95, warning: 0.90, slaHours: 24 },
  l1Medium: { target: 0.95, warning: 0.90, slaHours: 24 },
  l1Low:    { target: 0.99, warning: 0.97, slaHours: 72 },
  l2:       { target: 0.96, warning: 0.92, slaHours: 48 },
  l3:       { target: 0.98, warning: 0.95, slaHours: 72 },
}
export const OFAC_FILING_WINDOW_DAYS = 10
export const REAPPLY_REVIEW_SLA_MONTHS = 18
```

**`escalation.ts`** — synthetic, visual placeholder only, no live triggers:
```typescript
export const ESCALATION_PROTOCOLS = {
  l1SLABreach: {
    label: "L1 SLA Breach",
    action: "Notify Analyst Lead within 1 hour. Escalate to Audit Director if unresolved in 4 hours.",
    contacts: ["Analyst Lead — sanctions-lead@bofa.com", "Audit Director — jason.cahaly@bofa.com"],
    locked: true
  },
  makerCheckerException: {
    label: "Maker-Checker Exception",
    action: "Immediate escalation to Audit Director and IT Security. Document in ATM. Remediate entitlement within 24 hours.",
    contacts: ["Audit Director", "GES Technology — IT Security"],
    locked: true
  },
  reapplyTypeA: {
    label: "Active Sanctions Exposure — Reapply Transaction",
    action: "Immediate freeze review. Escalate to SSCOE Director and Legal. File OFAC notification if required.",
    contacts: ["SSCOE Director", "Legal / Compliance"],
    locked: true
  },
  ofacFilingOverdue: {
    label: "OFAC Filing Overdue (>10 days)",
    action: "File immediately. Notify Regulatory Relations. Document late filing reason in case system.",
    contacts: ["Regulatory Relations", "OFAC Filing Team"],
    locked: true
  }
}
```

---

## Phase Structure

> **Dependency rule:** Phase 0 runs first. Phase 0.5 runs immediately after Phase 0 (same terminal). Phases 1, 2, 3, and 4 run in parallel only after Phase 0.5 is complete and 21st.dev component matches have been confirmed. Phase 5 runs last.

---

## Phase 0 — Synthetic Data Engine
**Instance:** Terminal 1  
**Depends on:** Nothing — runs first, unblocks everything  
**Deliverable:** Complete, fully typed `/data` directory

### What to build
Generate all synthetic data files per specifications above. Pure TypeScript — no UI, no packages beyond TypeScript itself. Every file must be self-contained, fully typed, and importable.

### Quality rules
- All dates: realistic ISO calendar dates
- Spike events: **narratively consistent across all files** — SPIKE_002 shows up in alert backlog, SLA degradation, AND list feed partial failure simultaneously
- Reapply Type A: `riskFlagDate` must be 6+ months after `reapplyApprovalDate`
- Entity names: synthetic company names only — no real individuals
- Dollar amounts: realistic mix ($4K consumer to $2.3M GCIB)
- Include 200 individual `AlertRecord` rows for DrillDownTable demos
- No `Math.random()` at runtime — all values pre-computed and static

### Build order
Start with `types/index.ts` (all shared interfaces), then `data/config/`, then `data/synthetic/` in this order: alerts → makerChecker → blockedAccounts → disposition → reapply → listFeeds → staffing → spikes.

### Kickoff prompt
```
Read this PRD in full before writing any code. Your only task is Phase 0.

Generate all synthetic data files for the BofA Sanctions Continuous Monitoring 
Dashboard. Output TypeScript files to /data/synthetic/ and /data/config/ exactly 
as specified in the Data Specifications section.

Rules:
- Pure data generation only — no UI, no components, no packages
- All data is static and pre-computed (no Math.random() at runtime)
- Spike events must be narratively consistent across all files
- Reapply Type A records: riskFlagDate must be 6+ months after reapplyApprovalDate
- 200 individual AlertRecord rows for drill-down demos
- Export all arrays and constants as named exports

Start with types/index.ts, then data/config/, then data/synthetic/ in this order:
alerts, makerChecker, blockedAccounts, disposition, reapply, listFeeds, staffing, spikes.

The reapply.ts file is the most important — get the risk type distribution (22/11/67/240),
field structure, and Type A scenario narratives exactly right. These are the demo centerpiece.
```

---

## Phase 0.5 — UI Component Inventory & Interview
**Instance:** Terminal 2 (runs immediately after Phase 0 completes, before Phase 1 begins)  
**Depends on:** Phase 0 complete (needs the full data schema and tab structure to enumerate all UI elements)  
**Deliverable:** A complete `COMPONENT_INVENTORY.md` file listing every UI element needed across the entire dashboard — then an interactive interview with Achyuth to capture his preferences on each one

### What this phase does
Before any component code is written, this phase produces an exhaustive inventory of every distinct UI element the dashboard requires — KPI cards, tables, tabs, badges, banners, tooltips, charts, modals, filters, etc. — organized by category.

Once the inventory is complete, Claude Code conducts a structured interview with Achyuth, going through each component category and asking targeted preference questions. The goal is to capture enough detail so that Achyuth can take the inventory to Claude (claude.ai) to identify the best matching 21st.dev components for each slot before Phase 1 begins.

**This phase does not write any component code.** It only produces the inventory document and captures interview answers.

### What to produce

**`COMPONENT_INVENTORY.md`** — structured as follows:
```
# Dashboard Component Inventory

## Navigation & Layout
- [ ] Top navigation bar
- [ ] Tab navigation (6 tabs + breach indicator dots)
- [ ] Filter bar (date range, LOB, alert type, tier)
- [ ] Sub-navigation (L1/L2/L3 within Alert Review tab)
- [ ] Page/content layout grid

## Data Display — Cards
- [ ] KPI metric card (primary — used ~30x across all tabs)
- [ ] Feed status card (List Feed Health tab)
- [ ] Risk summary card (Reapply Risk tab — Type A/B/C/D)
- [ ] Callout / connection card (Disposition tab → Reapply link)

## Data Display — Tables
- [ ] Drill-down data table (sortable, filterable, expandable rows)
- [ ] OFAC filing compliance table (with status badges + countdown)
- [ ] Maker-checker exception log table
- [ ] Reapply risk inventory table (color-coded rows, expandable Type A)
- [ ] Alert record table (primary drill-down)
- [ ] Ingestion log table (with error row highlighting)

## Data Display — Charts
- [ ] Stacked bar chart (alert volumes by priority)
- [ ] Line chart (trend lines — blocked accounts, true match rate)
- [ ] Area chart (alert volume — Executive Summary)
- [ ] Multi-line chart (feed latency)
- [ ] Pie / donut chart (reapply risk distribution, setback reasons)
- [ ] Calendar heatmap (SLA compliance — 90-day grid)
- [ ] Sparkline (inline in KPI cards)

## Status & Feedback
- [ ] Status badge (Filed On Time / Overdue / Pending / etc.)
- [ ] Risk type badge (Type A / B / C / D)
- [ ] Breach indicator dot (on tab nav)
- [ ] Status dot (feed health cards)
- [ ] Alert / warning banner (Reapply Risk tab — red)
- [ ] AI Insight banner (Executive Summary — navy)
- [ ] Toast / notification (for future escalation trigger feedback)

## Overlays & Interaction
- [ ] Drill-down table slide-up panel (appears on chart click)
- [ ] Row expansion panel (Type A reapply detail — inline)
- [ ] Escalation tooltip (locked/grayed — hover on breached KPI)
- [ ] Spike annotation (chart overlay — vertical line + popover)
- [ ] Popover (hover details on spike annotations)
- [ ] Tooltip (general — chart data points, truncated text)
- [ ] Modal / dialog (if needed for full-screen drill-down)

## Form & Filter Controls
- [ ] Date range picker (with presets)
- [ ] Multi-select dropdown (Line of Business)
- [ ] Toggle / segmented control (Alert Type, Alert Level)
- [ ] Reset button
- [ ] Sort controls (table column headers)
- [ ] CSV export button

## Loading & Empty States
- [ ] Skeleton loader (for chart/table loading states)
- [ ] Empty state (no data matching filters)
- [ ] Error state (data load failure)
```

After generating this file, walk through each category in a conversational interview with Achyuth. For each component type, ask:
1. **Style preference** — e.g. for tables: striped vs. borderless vs. full grid
2. **Density preference** — compact vs. comfortable vs. spacious
3. **Any specific behavior** — e.g. does the date picker need a calendar popover or just text inputs
4. **Priority** — is this a "get it exactly right" component or "good enough"

Capture all answers in the `COMPONENT_INVENTORY.md` file under each item as a `preference:` note.

When the interview is complete, tell Achyuth: **"Inventory complete. Bring this file to Claude (claude.ai) to find the best 21st.dev component matches for each slot before we start Phase 1."**

### Kickoff prompt
```
Read this PRD in full before starting. Your task is Phase 0.5.

Do NOT write any component code. Your only deliverable is COMPONENT_INVENTORY.md.

Step 1: Generate the complete component inventory file as specified in Phase 0.5.
Expand on the template — add any component slots you identify that aren't listed, 
based on your reading of the full PRD and all tab specifications. Be exhaustive. 
If you see a UI element described anywhere in the PRD that isn't in the inventory 
template, add it.

Step 2: Once the file is written, conduct a structured interview with me (Achyuth).
Go category by category. For each component type, ask targeted questions about 
style, density, behavior, and priority. Keep questions focused — one or two per 
component type. Capture my answers as preference notes in the file.

Step 3: When the interview is complete, update COMPONENT_INVENTORY.md with all 
captured preferences and tell me to bring it to Claude (claude.ai) for 21st.dev 
component matching before Phase 1 begins.

Start with Step 1 now — generate the inventory file, then prompt me to begin the interview.
```

---

## Phase 1 — App Shell + Design System
**Instance:** Terminal 2 (same instance continues, or Terminal 3)  
**Depends on:** Phase 0 complete, Phase 0.5 complete (component preferences captured + 21st.dev matches identified)  
**Deliverable:** Full app scaffold — navigation, layout, theme, reusable components, empty tab containers that compile and deploy

### Components to build

**`AppShell.tsx`** — top nav "BANK OF AMERICA | Sanctions Audit — Continuous Monitoring", last refresh timestamp from `meta.ts`, green synthetic "Live" indicator dot. Below nav: FilterBar. Below that: TabNav + content area.

**`FilterBar.tsx`** — sticky. Presets: Last 7 / 30 / 90 days / Custom. Dropdowns: Line of Business (All/GCIB/GCB/GES/Other), Alert Type (All/Relationship/Transaction), Alert Level (All/L1/L2/L3). Reset button. State managed at page level, passed as props via `FilterState` interface.

**`TabNav.tsx`** — 6 tabs with breach indicator dots (red dot if any metric in that tab is breached):
1. Executive Summary  2. Alert Review  3. Blocked Accounts  
4. Reapply Risk ← red dot always on (Type A = active breach)  
5. Disposition Quality  6. List & Feed Health  
Framer Motion `layoutId` for active indicator sliding between tabs.

**`KPICard.tsx`** — most important reusable component:
```typescript
props: {
  label: string
  value: string | number
  unit?: string
  delta?: number
  deltaLabel?: string
  trend?: number[]                // sparkline
  status: 'green' | 'amber' | 'red' | 'neutral'
  escalationKey?: string
  onClick?: () => void
}
```
Anime.js v4 countUp on numeric values at mount/tab-switch. Pulsing border CSS animation on red cards. EscalationTooltip on hover when status is red/amber and escalationKey is provided.

**`AIInsightBanner.tsx`** — navy background, white text, blue left border. Accepts `insight: string` and `mode: 'live' | 'prototype'`. Prototype mode shows insight text + "⚠ Prototype — Static Data" badge. Lock icon + muted ghost text bottom-right.

**`DrillDownTable.tsx`** — Framer Motion slide-up on chart click. Sortable columns, row hover. CSV export button (client-side). Anime.js stagger on row entrance. `onClose` handler.

**`SpikeAnnotation.tsx`** — Recharts custom ReferenceLine wrapper. Dashed vertical line + hover popover with spike description.

**`EscalationTooltip.tsx`** — grayed-out, locked visual. Shows escalation contacts and action text in muted color. "Future Feature" tag. Never interactive.

Each tab file renders its name + a placeholder message. Routing and layout must work cleanly before chart phases begin.

### Kickoff prompt
```
Read this PRD in full before writing any code. Your task is Phase 1.

Build the complete application shell and design system for the BofA Sanctions 
Continuous Monitoring Dashboard. Do not build chart logic or data visualizations.

Critical requirements:
- Copy bank_of_america_logo.svg from the project root to /public/bank_of_america_logo.svg
  at project init — reference it everywhere as a Next.js <Image> at /bank_of_america_logo.svg
- Build the landing page (app/page.tsx) per the Landing Page Specification in the PRD:
  hero with boa-blue-deeper background, BofA logo, headline, CTA button; 3-column 
  feature cards below; footer strip. Framer Motion entrance animations on hero elements.
- FilterBar state at page level, passed as props — no context/Zustand
- KPICard: full breach states, Anime.js v4 countUp, EscalationTooltip on breached cards
- TabNav: red breach dots on tabs with active breaches
- AIInsightBanner: prototype mode with static text + lock icon
- DrillDownTable: Framer Motion slide-up entrance, CSV export, Anime.js stagger rows
- Typography: IBM Plex Sans + IBM Plex Sans Condensed (Google Fonts)
- Use BofA brand color tokens exactly as specified in PRD — no Crowe colors
- Each tab renders an empty named container — no chart content in Phase 1

Must compile cleanly. Verify with `npm run dev` locally before handing off to Phase 5 for Vercel deployment.
```

---

## Phase 2 — Alert Review Module (L1 / L2 / L3)
**Instance:** Terminal 3  
**Depends on:** Phase 0 (data), Phase 1 (shell)  
**Deliverable:** Complete `AlertReview.tsx` — highest priority tab for the demo

### Tab structure
Sub-navigation: **L1 | L2 | L3** — identical layout per tier, different data and SLA thresholds.

**Section 1 — SLA Summary Row (per tier)**
3 KPI cards (High/Med/Low for L1; single target for L2/L3). Current compliance %, delta vs. prior 7 days, breach state per `thresholds.ts`.

**Section 2 — Daily Alert Volume Chart (per tier)**
Recharts BarChart, stacked (High/Med/Low), 30-day default window. SpikeAnnotation overlays. Toggles: Relationship/Transaction/Both; By LOB. Click bar → DrillDownTable with AlertRecord rows for that date/priority.

**Section 3 — SLA Heatmap (per tier)**
Calendar heatmap, last 90 days. Cell color = SLA compliance % (green/amber/red). Built with a CSS grid of colored divs — no third-party library. Click cell → DrillDownTable with breach details.

**Section 4 — Maker-Checker Integrity (L1 only)**
Single large KPI: "Maker ≠ Checker Compliance". Should read 100.0% except on exception dates. Exception log table: Alert ID | Date | Maker ID | Checker ID | Exception Type | Resolution Date | Notes. All 3 synthetic exceptions visible. Red card with escalation tooltip when exceptions exist.

**Framer Motion AnimatePresence** for L1/L2/L3 tier switching animation.

### Kickoff prompt
```
Read this PRD in full before writing any code. Your task is Phase 2.

Build AlertReview.tsx. Import from /data/synthetic/alerts.ts and 
/data/synthetic/makerChecker.ts. Receive FilterBar state as props and apply 
to all data before rendering.

Requirements:
- L1/L2/L3 sub-nav with identical layout architecture per tier
- SLA heatmap: CSS grid of colored divs, not a third-party library
- Every chart click fires DrillDownTable with relevant AlertRecord rows
- Maker-checker panel on L1 only — all 3 synthetic exceptions visible
- SpikeAnnotation overlays on all time-series charts
- Framer Motion AnimatePresence for tier switching
- FilterBar props (LOB, alert type, date range, tier) filter all chart data

This tab is the demo anchor — it must be polished and fully interactive.
```

---

## Phase 3 — Blocked Accounts + Reapply Risk
**Instance:** Terminal 4  
**Depends on:** Phase 0 (data), Phase 1 (shell)  
**Deliverable:** `BlockedAccounts.tsx` and `ReapplyRisk.tsx`

### Blocked Accounts Tab

Data from `blockedAccounts.ts`.

**KPI Row:** Total Active Blocked Accounts | New Blocks This Month | Pending OFAC Filing (blue) | Overdue OFAC Filings (red + escalation tooltip)

**Block Volume Trend:** Recharts LineChart — daily new blocks + cumulative total, 90-day window. Toggle: show unblock events as downward markers.

**OFAC Filing Compliance Table:** All new blocks — Account ID | Block Date | Filing Deadline | Filing Date | Filing ID | Status badge (Filed On Time / Filed Late / Pending / Overdue). Filing deadline countdown for Pending items. This is the direct automation of what Anna did manually last year — make it feel like a reconciliation engine.

**Dollar Volume Chart:** Recharts BarChart — weekly blocked account dollar volume stacked by LOB.

### Reapply Risk Tab — Headline Feature

This tab visualizes a live process gap. It should feel like a risk radar, not a routine monitor.

**Red alert banner (always visible):** "⚠ Active Sanctions Exposure Detected — 22 transactions require immediate review. Estimated total exposure: $4.1M."

**Risk Summary Row (4 KPI cards):**
- Total Reapply Inventory: 340 — neutral
- Type A — Counterparty Hit: 22 — RED, pulsing border, escalation tooltip
- Type B — Corridor Risk: 11 — RED, escalation tooltip
- Type C — Stale Review: 67 — AMBER
- Type D shown as denominator context text below cards, not a separate card

**Risk Distribution:** Recharts PieChart or Treemap. Click segment → filters inventory table.

**Reapply Risk Inventory Table (main element):**
Transaction ID | Originator | Originator Country | Beneficiary | Beneficiary Country | Amount | Frequency | Approval Date | Last Review Date | Risk Type badge | Risk Flag | Flag Date | Est. Exposure | Status

Default sort: by Estimated Exposure descending (Type A surfaces first). Row backgrounds: red-tint for A, amber-tint for B, yellow-tint for C.

**Type A Row Expansion:** Clicking a Type A row expands an inline detail panel:
- Timeline: Reapply Approval Date → Sanctions Designation Date → Current Date
- Transactions since designation: count + total dollar exposure
- Risk flag detail (which list, which designation event)
- Escalation protocol block (synthetic, locked visual)

### Kickoff prompt
```
Read this PRD in full before writing any code. Your task is Phase 3.

Build two tabs: BlockedAccounts.tsx and ReapplyRisk.tsx.

Blocked Accounts: The OFAC filing compliance table is the centerpiece. Make it feel 
like a reconciliation engine — filing deadline countdown for pending items, 
clear status badges, row-level context.

Reapply Risk: This is the headline feature of the entire dashboard. It visualizes 
a live process gap where transactions flow undetected after counterparties are sanctioned.

- Red alert banner always visible at top (22 transactions, $4.1M exposure)
- Type A and B KPI cards: always red, pulsing border
- Inventory table: color-coded rows by risk type, default sort by estimated exposure
- Type A row expansion: inline timeline panel showing approval date → sanction 
  designation date → transactions since designation with total exposure

This tab should feel like a risk alarm. The demo sequence walks Jason through 
the highest-exposure Type A record step by step — make that story land visually.
```

---

## Phase 4 — Disposition Quality + List Feed Health + Executive Summary
**Instance:** Terminal 5  
**Depends on:** Phase 0 (data), Phase 1 (shell)  
**Deliverable:** `DispositionQuality.tsx`, `ListFeedHealth.tsx`, `ExecutiveSummary.tsx`

### Disposition Quality Tab

Data from `disposition.ts`.

**KPI Row:** True Match Rate | QA Setback Rate | Auto-Cleared Rate | Open Setbacks

**True Match Rate Trend:** Recharts LineChart — 90 days. SpikeAnnotation at SPIKE_001 (volume spike → elevated false positives visible as true match rate anomaly).

**QA Setback Rate Chart:** Recharts BarChart — weekly setback rate stacked by reason category. Click → DrillDownTable.

**Setback Reason Breakdown:** Recharts PieChart.

**Reapply Connection Callout:** Card linking to Reapply Risk tab — "22 active reapply transactions flagged with potential sanctions exposure. Incorrect disposition at original approval may have enabled indefinite straight-through processing." With "View Reapply Risk →" button.

### List & Feed Health Tab

Data from `listFeeds.ts` and `spikes.ts`.

**Feed Status Row:** One StatusDot card per feed (6 total). Green = last ingestion successful. Red = failure. Last update timestamp + record count.

**Ingestion History Chart:** Recharts multi-line chart — daily latency per feed, 30-day window. SPIKE_002 Acuity failure clearly visible as a gap.

**Delta Tracker:** Recharts AreaChart — entities added/removed per day across all feeds. SPIKE_003 (Jun 2024 OFAC SDN additions) visible as spike.

**Ingestion Log Table:** Date | Feed | Status | Record Count | Delta Added | Delta Removed | Latency | Error Code. Two failure events as red rows with full error detail.

### Executive Summary Tab

Data from all files + `meta.ts`. Landing tab. The command center.

**AIInsightBanner — pre-written synthetic insight text:**
```
"As of March 11, 2026 — L1 High SLA compliance is at 94.2%, within target range. 
22 reapply-tagged transactions have active counterparty sanctions exposure requiring 
immediate review — estimated total exposure $4.1M across Type A records. 3 OFAC 
blocked account filings are pending within the 10-day regulatory window. List feed 
health is nominal across all 6 sources. No maker-checker exceptions detected in 
the current period."
```

**KPI Summary Row (6 cards — one per tab):**
- SLA Compliance: 94.2% — amber → links to Alert Review
- Maker-Checker Integrity: 100.0% — green → links to Alert Review
- Active Blocked Accounts: 892 — neutral → links to Blocked Accounts
- Reapply Risk Items: 33 — RED (22 Type A + 11 Type B) → links to Reapply Risk
- QA Setback Rate: 2.1% — green → links to Disposition Quality
- Feed Health: 6/6 Nominal — green → links to List & Feed Health

**Alert Volume Trend:** Recharts AreaChart — 30-day rolling, all tiers. SpikeAnnotation overlays.

**Active Breach Summary Panel:** If any KPI is red/amber, panel below KPI row lists all active breaches with severity, description, and "View Details →" link to relevant tab.

### Kickoff prompt
```
Read this PRD in full before writing any code. Your task is Phase 4.

Build three tabs: DispositionQuality.tsx, ListFeedHealth.tsx, and ExecutiveSummary.tsx.

ExecutiveSummary is the landing tab and most important of the three:
- AIInsightBanner: use the exact pre-written insight text from the PRD
- 6 KPI cards: each must navigate to its respective tab on click
- Active Breach Summary panel lists all red/amber metrics with detail links
- Alert volume AreaChart with SpikeAnnotation overlays

DispositionQuality:
- Reapply Connection callout card with link to Reapply Risk tab is required
- QA setback reason breakdown should be visually prominent

ListFeedHealth:
- SPIKE_002 and Sep 2024 Acuity failures must be clearly visible as anomalies 
  in the ingestion history chart and as red rows in the log table
```

---

## Phase 5 — Integration + Polish
**Instance:** Any available terminal  
**Depends on:** All previous phases complete  
**Deliverable:** Fully integrated, deployed application

### What to do
1. Import and wire all tab components into AppShell
2. Verify FilterBar state propagates correctly to all tabs
3. Verify DrillDownTable fires from every chart across all tabs
4. Verify tab breach indicator dots update correctly from data
5. Smoke test all Framer Motion transitions — no jarring cuts
6. Verify Anime.js countUp fires on tab switch (not just initial page load)
7. Check responsive behavior: 1280px (primary), 1024px (functional)
8. Fix any TypeScript errors or import issues from parallel phase merges
9. Lighthouse: target >90 Performance, >90 Accessibility
10. `npm run dev` local verification
11. Deploy to Vercel: push to GitHub then connect repo at vercel.com, or run `npx vercel --prod`
12. Verify deployed URL — all tabs load, all charts render, no console errors

### Kickoff prompt
```
Read this PRD in full. Your task is Phase 5: integration and polish.

Wire all tab components into the AppShell. Verify FilterBar state flows to all tabs.
Verify DrillDownTable works from all chart interactions across all tabs.

Quality pass:
- No console errors in production build
- All Framer Motion transitions smooth
- Anime.js countUp fires on tab switch, not just initial load
- Tab breach dots update correctly from live data state
- Responsive at 1280px and 1024px
- Lighthouse Performance > 90, Accessibility > 90

Deploy: push to GitHub → `npx vercel --prod`
Verify the deployed URL before marking complete.
```

---

## Out of Scope

- Live API connections to any BofA system (GPSCM, ATM, alert systems)
- Real-time data refresh or WebSocket connections
- Actual email/Teams/escalation notification triggers
- Authentication or role-based access control
- Supabase/Neon backend (future phase)
- Live Anthropic API call in AIInsightBanner (static in this build)
- Staffing forecasting module (stub placeholder acceptable)
- Tableau Server REST API or Hyper file generation

---

## Deliverable Checklist

- [ ] Phase 0: All `/data` files generated, typed, exported, spike events narratively consistent
- [ ] Phase 0.5: COMPONENT_INVENTORY.md complete, interview conducted, preferences captured, 21st.dev matches confirmed by Achyuth
- [ ] Phase 1: Landing page renders with BofA branding + CTA; shell compiles; 6 tabs route correctly; KPICard breach states + countUp work; FilterBar renders
- [ ] Phase 2: Alert Review — L1/L2/L3 sub-nav, SLA heatmap, maker-checker panel, chart click → drill-down
- [ ] Phase 3: Blocked Accounts — OFAC filing table complete; Reapply Risk — red banner, Type A expansion panel, risk inventory table sorted by exposure
- [ ] Phase 4: Executive Summary — AIInsightBanner with exact text, 6 KPI cards linked; Disposition + List Feed tabs complete
- [ ] Phase 5: All tabs integrated, FilterBar wired, deployed to Vercel, Lighthouse >90
- [ ] No console errors in production build
- [ ] Responsive at 1280px and 1024px
- [ ] Demo-ready: every interaction works, no broken states

---

## Demo Delivery Sequence (for the BofA session)

The Reapply Risk tab is the demo highlight. Walk Jason through this sequence:

1. Land on **Executive Summary** — AI banner calls out the 22 active exposure items and $4.1M
2. Click the red **"Reapply Risk Items: 33"** KPI card
3. Show the **red alert banner** at top of the Reapply Risk tab
4. Sort the inventory table by **Estimated Exposure** — highest-risk item (~$617K) surfaces first
5. Click that row → expand the **Type A detail panel** — show the timeline: approval Oct 2022 → OFAC designation Feb 2024 → 13 months of undetected transactions
6. Hover the **Escalation Protocol** tooltip — "this is what gets triggered automatically in production"

Then pivot to Alert Review and show the SLA heatmap + the Feb 2024 degradation period (SPIKE_002) to connect the vendor failure event to real operational impact.

This two-tab sequence alone justifies the engagement. It turns a known process gap into a visual, timestamped, dollar-quantified story — which is exactly what Jason said he needed to take to management.

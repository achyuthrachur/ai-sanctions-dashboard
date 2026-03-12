# Dashboard Component Inventory
**Project:** BofA Sanctions Continuous Monitoring Dashboard
**Phase:** 0.5 — Complete ✅
**Status:** Interview complete — all preferences captured. Ready for Phase 1.

---

## Master Install Block — Run Once at Phase 1 Start

```bash
# 1. shadcn init
npx shadcn@latest init

# 2. All shadcn / 21st.dev components
npx shadcn@latest add "https://21st.dev/r/ayushmxxn/tubelight-navbar"
npx shadcn@latest add "https://21st.dev/r/shadcn/select"
npx shadcn@latest add "https://21st.dev/r/shadcn/toggle-group"
npx shadcn@latest add "https://21st.dev/r/shadcn/card"
npx shadcn@latest add "https://21st.dev/r/shadcn/alert"
npx shadcn@latest add "https://21st.dev/r/shadcn/popover"
npx shadcn@latest add "https://21st.dev/r/shadcn/drawer"
npx shadcn@latest add "https://21st.dev/r/shadcn/scroll-area"
npx shadcn@latest add "https://21st.dev/r/shadcn/table"
npx shadcn@latest add "https://21st.dev/r/shadcn/badge"
npx shadcn@latest add "https://21st.dev/r/shadcn/calendar"
npx shadcn@latest add "https://21st.dev/r/shadcn/command"
npx shadcn@latest add "https://21st.dev/r/shadcn/skeleton"
npx shadcn@latest add "https://21st.dev/r/shadcn/button"
npx shadcn@latest add "https://21st.dev/r/shadcn/separator"
npx shadcn@latest add https://shadcn-ui-animated-tabs.vercel.app/r/animated-tabs.json

# 3. npm packages
npm install @tanstack/react-table react-countup framer-motion
```

---

## Navigation & Layout

- [x] **Top navigation bar**
  - source: **Custom build**
  - spec: `bg-[#003571]`, white text, BofA logo (`<Image src="/bank_of_america_logo.svg">`) left, "BANK OF AMERICA | Sanctions Audit — Continuous Monitoring" center-left, Live dot + last refresh timestamp right

- [x] **Tab navigation** (6 tabs + breach dots)
  - source: **21st.dev Tubelight Navbar** → `npx shadcn@latest add "https://21st.dev/r/ayushmxxn/tubelight-navbar"`
  - spec: Adapt for horizontal 6-tab strip. Active color = `#0065B3`. Breach dots wired as a custom overlay layer on top of tab labels — red filled circle 6px, positioned `top-1 right-1` absolute within tab label wrapper. Do NOT modify Tubelight internals for dots.

- [x] **Filter bar — dropdowns**
  - source: **shadcn/select** → `npx shadcn@latest add "https://21st.dev/r/shadcn/select"`
  - spec: Compact single-row at 1280px. LOB dropdown: All / GCIB / GCB / GES / Other

- [x] **Filter bar — toggles**
  - source: **shadcn/toggle-group** → `npx shadcn@latest add "https://21st.dev/r/shadcn/toggle-group"`
  - spec: Pill-style toggle group. Alert Type (All / Relationship / Transaction), Alert Level (All / L1 / L2 / L3). Active state: `bg-[#0065B3] text-white`

- [x] **Animated tab content transitions**
  - source: **Animated Tabs (registry)** → `npx shadcn@latest add https://shadcn-ui-animated-tabs.vercel.app/r/animated-tabs.json`
  - spec: Smooth fade/slide between tab panels

- [ ] **L1 / L2 / L3 sub-navigation** (Alert Review tab only)
  - source: Re-use **shadcn/toggle-group** (same primitive, smaller variant)
  - spec: Same pill-toggle pattern as FilterBar toggles, sits at top of Alert Review content area

- [ ] **Page / content layout grid**
  - source: Custom Tailwind CSS grid
  - spec: `max-w-[1440px] mx-auto px-6` content container. KPI rows: `grid grid-cols-4 gap-4` default, `grid-cols-3` for some tabs

- [ ] **Landing page hero section**
  - source: Custom build (Framer Motion for entrance animations)
  - spec: Full viewport height, `bg-[#003571]`. BofA logo top-left. Headline "Sanctions Continuous Monitoring" centered, IBM Plex Sans Condensed Bold, white. Sub-headline `text-white/70`. CTA button `bg-white text-[#0065B3]`. "Delivered by Crowe LLP | IRM" bottom-right `text-white/50 text-xs`

- [ ] **Landing page footer strip**
  - source: Custom build
  - spec: `bg-[#003571]` bar, flex justify-between, white text `text-sm`

---

## Data Display — Cards

- [x] **KPI metric card (primary)** — used ~30× across all tabs
  - source: **shadcn/card** → `npx shadcn@latest add "https://21st.dev/r/shadcn/card"`
  - countUp: **react-countup** → `npm install react-countup`
  - sparkline: **Recharts** inline `<LineChart>` (already installed), small fixed height ~32px
  - breach border: **CSS keyframes** — `pulse-border` animation already in `tailwind.config.ts`
  - escalation tooltip: **shadcn/popover** (see Overlays category)
  - spec: Status border colors: green=`border-green-500`, amber=`border-amber-500`, red=`border-[#E61030] animate-[pulse-border_2s_infinite]`

- [ ] **Feed status card** (List Feed Health tab, 6 total)
  - source: **shadcn/card** + custom layout
  - spec: Feed name bold, StatusDot left of name, last ingestion timestamp, record count. Red tint `bg-[#FDEAED]` on failure

- [ ] **Risk summary card** (Reapply Risk tab, Types A/B/C/D)
  - source: **shadcn/card** + custom tint
  - spec: A=`bg-[#FDEAED] border-[#E61030]`, B=`bg-orange-50 border-orange-400`, C=`bg-amber-50 border-amber-400`, D=`bg-green-50 border-green-500`

- [ ] **Reapply connection callout card** (Disposition Quality tab)
  - source: **shadcn/card** + **shadcn/button**
  - spec: Icon (Link2 Lucide) + short copy + "View Reapply Risk →" ghost button

- [x] **AI Insight Banner** (Executive Summary, top)
  - source: **shadcn/alert** base → `npx shadcn@latest add "https://21st.dev/r/shadcn/alert"` + custom layout
  - spec: `bg-[#003571] border-l-4 border-[#0065B3]`. `BrainCircuit` icon Lucide in `#0065B3`. Right side: "Prototype — Static Data" badge (`bg-white/10 text-white/60 text-[10px] uppercase tracking-wider`) + `Lock` icon `text-white/30`. IBM Plex Sans body text `text-white/90 text-sm`

- [x] **Red Alert Banner** (Reapply Risk tab, always visible, never dismissible)
  - source: **shadcn/alert** base + custom layout
  - spec: `bg-[#E61030] sticky top-0 z-10`. `AlertTriangle` white. Bold exposure amount. Right: "Type A + B Records · Last verified: March 11, 2026" `text-white/70 text-xs`

- [ ] **Active breach summary panel** (Executive Summary, conditional)
  - source: **shadcn/card** + custom
  - spec: Only renders when any KPI is red/amber. Lists each breach with severity dot, description, "View Details →" link. `border-l-4` colored by highest severity

---

## Data Display — Tables

- [x] **Table base primitive** — all 6 tables use same foundation
  - source: **shadcn/table** + **@tanstack/react-table**
  - install: `npx shadcn@latest add "https://21st.dev/r/shadcn/table"` + `npm install @tanstack/react-table`
  - spec: TanStack for sorting/filtering logic, shadcn/table for rendering primitives

- [ ] **Drill-down data table** (inside bottom drawer)
  - source: shadcn/table + TanStack — see Overlays for the drawer wrapper

- [ ] **OFAC filing compliance table** (Blocked Accounts tab)
  - spec: Countdown cell for Pending items — "X days remaining" in `text-amber-600`, "X days overdue" in `text-[#E61030]`. Uses date-fns (already installed)

- [ ] **Maker-checker exception log table** (Alert Review L1 only)
  - spec: 3 data rows + volume context row at bottom. Exception type as BreachBadge. Red row background on exception rows

- [ ] **Reapply risk inventory table** (Reapply Risk tab)
  - spec: Row tint by type: A=`bg-[#FDEAED]`, B=`bg-orange-50`, C=`bg-amber-50`, D=plain. Default sort: estimated exposure DESC. Click row → Type A expansion panel

- [ ] **Alert record table** (DrillDownTable target, 200 rows)
  - spec: Standard sortable table, all columns from AlertRecord type

- [ ] **List feed ingestion log table** (List Feed Health tab)
  - spec: Red row `bg-[#FDEAED]` for partial_failure/complete_failure rows. Error code in monospace

---

## Data Display — Charts

All charts: **Recharts** (already installed). All chart containers: `ResponsiveContainer width="100%" height={240}` default.

- [ ] **Stacked bar chart** — Alert volumes by priority. `BarChart` + `Bar` per priority. Click bar → opens DrillDownTable drawer
- [ ] **Line chart** — Blocked accounts trend + true match rate trend. `LineChart`
- [ ] **Area chart** — Alert volume overview (Executive Summary). `AreaChart` with gradient fill
- [ ] **Multi-line chart** — Feed latency per feed (6 lines). `LineChart` with 6 `<Line>` elements
- [ ] **Pie / donut chart** — Reapply risk distribution + QA setback reasons. `PieChart` with `innerRadius` for donut
- [ ] **Calendar heatmap** — SLA compliance, 90-day grid
  - source: **Custom CSS grid** — NOT a chart library. `grid-cols-13` (13 weeks × 7 days). Each cell `w-7 h-7 rounded-sm cursor-pointer`. Color: green ≥95%, amber 90–95%, red <90%. Click → DrillDownTable drawer
- [ ] **Sparkline** — Inline in KPI cards. `LineChart` `width={80} height={32}`, no axes, no tooltips
- [ ] **Delta tracker area chart** — Entities added/removed. `AreaChart` two series (added/removed)
- [ ] **Dollar volume bar chart** — Weekly blocked account $ stacked by LOB. `BarChart`
- [ ] **QA setback rate bar chart** — Weekly setback rate by reason. `BarChart` stacked

---

## Status & Feedback

- [x] **Status badges** (Filed On Time / Filed Late / Overdue / Pending / Not Required)
  - source: **shadcn/badge** → `npx shadcn@latest add "https://21st.dev/r/shadcn/badge"`
  - spec: Same pill shape (`rounded-full`) for all status badges. Colors: Filed On Time=green, Filed Late=amber, Overdue=red, Pending=blue, Not Required=muted

- [x] **Risk type badges** (Type A / B / C / D)
  - source: **shadcn/badge** (same primitive, different variant)
  - spec: Same `rounded-full` pill shape as status badges. A=`bg-[#FDEAED] text-[#E61030] border border-[#E61030]/30`, B=`bg-orange-50 text-orange-700`, C=`bg-amber-50 text-amber-700`, D=`bg-green-50 text-green-700`
  - note: Risk type badges are visually distinct via color, not shape — consistent pill across both badge types

- [ ] **Breach indicator dot** (on TabNav tabs)
  - source: Custom — `6px` red filled circle, `absolute top-1 right-1` within tab label wrapper. No library
  - spec: `w-1.5 h-1.5 rounded-full bg-[#E61030]` overlaid on Tubelight tab

- [ ] **Status dot** (feed health cards)
  - source: Custom CSS
  - spec: `w-2 h-2 rounded-full`. Green pulsing=`animate-pulse bg-green-500`, red=`bg-[#E61030]`, gray=`bg-gray-400`

- [ ] **Synthetic "Live" indicator** (TopNav)
  - source: Custom CSS animation
  - spec: `w-2 h-2 rounded-full bg-green-400 animate-pulse` + "Live" text `text-green-400 text-xs`

- [ ] **Prototype badge** (AI Insight Banner + anywhere needed)
  - source: Inline `<span>` — custom
  - spec: `text-[10px] font-medium px-2 py-0.5 rounded bg-white/10 text-white/60 uppercase tracking-wider`

- [ ] **"Future Feature" tag** (Escalation Tooltip header)
  - source: Inline `<span>` — custom, non-interactive
  - spec: `text-[10px] uppercase tracking-wider text-text-muted`

---

## Overlays & Interaction

- [x] **Escalation tooltip** (280px popover, hover-triggered, locked)
  - source: **shadcn/popover** → `npx shadcn@latest add "https://21st.dev/r/shadcn/popover"`
  - spec: `w-[280px]`, `side="top" align="start"`, open on `onMouseEnter` with 300ms delay, close on `onMouseLeave`. Content: `pointer-events-none opacity-60`. Header: `Lock` icon + "Escalation Protocol — Future Feature". Action text `text-xs text-text-secondary`. Contacts `text-xs text-text-muted → contact`

- [x] **DrillDownTable bottom drawer** (55vh, no dim, Vaul spring physics)
  - source: **shadcn/drawer (Vaul)** → `npx shadcn@latest add "https://21st.dev/r/shadcn/drawer"`
  - also: **shadcn/scroll-area** → `npx shadcn@latest add "https://21st.dev/r/shadcn/scroll-area"`
  - spec: `modal={false}`, `h-[55vh]`, drag handle top, DrawerHeader with title + row count + Export CSV + X close. DataTable inside ScrollArea

- [x] **Type A row expansion panel** (drop-card below row)
  - source: **Framer Motion AnimatePresence** + `motion.tr`/`motion.td` — no install
  - spec: `initial={{ height:0, opacity:0 }}` → `animate={{ height:'auto', opacity:1 }}`, 0.25s easeOut. Card: `bg-[#FDEAED] border-l-4 border-[#E61030] shadow-[0_4px_12px_rgba(230,16,48,0.12)]`. Interior: 3-node timeline (Approval gray → Designation red → Today with $ exposure), risk flag detail, escalation block (locked, visual only)

- [ ] **Spike annotation** (vertical dashed line on time-series charts)
  - source: Recharts `<ReferenceLine>` custom wrapper + **shadcn/popover** for hover popover
  - spec: `strokeDasharray="4 3"` vertical line in `#0065B3/60`. Hover → popover with spike ID, date, label, 2-sentence description

- [ ] **Countdown timer display** (OFAC filing table)
  - source: Custom — **date-fns** (already installed) `differenceInDays(deadline, today)`
  - spec: Positive = "X days remaining" `text-amber-600`. Zero/negative = "X days overdue" `text-[#E61030] font-semibold`

- [ ] **Unblock event marker** (Blocked Accounts line chart toggle)
  - source: Recharts `<ReferenceLine>` or custom dot renderer
  - spec: Small downward triangle marker on the line at unblock date. Toggle show/hide via chart control

---

## Form & Filter Controls

- [x] **Date range picker** (calendar + popover)
  - source: **shadcn/calendar** + **shadcn/popover**
  - install: `npx shadcn@latest add "https://21st.dev/r/shadcn/calendar"` (popover already installing)
  - spec: Preset pills (Last 7 / 30 / 90 days) as shadcn/toggle-group. "Custom" pill opens popover with calendar range picker

- [x] **Multi-select dropdown** (LOB)
  - source: **shadcn/command** + **shadcn/popover** → `npx shadcn@latest add "https://21st.dev/r/shadcn/command"`
  - spec: Standard shadcn combobox pattern — Command palette inside Popover

- [x] **Toggle / segmented controls** (Alert Type, Alert Level)
  - source: **shadcn/toggle-group** (already installing)

- [x] **Reset button**
  - source: **shadcn/button** → `npx shadcn@latest add "https://21st.dev/r/shadcn/button"`
  - spec: `variant="ghost"` with `RotateCcw` Lucide icon

- [ ] **Sort controls** (table column headers)
  - source: TanStack Table `getSortedRowModel()` + Lucide `ArrowUpDown` / `ArrowUp` / `ArrowDown` icons in header cells
  - spec: `cursor-pointer` header cells, icon swaps on sort direction

- [x] **CSV export button**
  - source: **shadcn/button** (already installing) — client-side `Blob` download, no library
  - spec: `variant="ghost" size="sm"` + `Download` Lucide icon. Filename: `{tab}-{date}.csv`

- [ ] **Chart toggle buttons** (Relationship/Transaction/Both, By LOB)
  - source: **shadcn/toggle-group** (already installing)
  - spec: Same pill-toggle pattern as FilterBar toggles, inline above chart

---

## Loading & Empty States

- [x] **Skeleton loader**
  - source: **shadcn/skeleton** → `npx shadcn@latest add "https://21st.dev/r/shadcn/skeleton"`
  - spec: Used during tab transitions and filter recalculation. KPI card skeletons: `w-full h-24 rounded-lg`. Chart skeleton: `w-full h-[240px] rounded-lg`. Table skeleton: 5 rows of `h-10`

- [x] **Empty state** (no data matching filters)
  - source: Custom build — no install. Lucide `SearchX` icon + "No records match the current filters" text + "Reset Filters" button
  - spec: Centered in table/chart container, `text-text-muted`, icon `w-8 h-8`

- [ ] **Error state** (data load failure — prototype fallback)
  - source: Custom build — `AlertCircle` Lucide icon + "Unable to load data" text
  - spec: Same container centering as empty state. Won't appear in prototype but scaffolded

---

## Typography & Iconography

- [ ] **Display / KPI numbers** — IBM Plex Sans Condensed Bold
  - source: Google Fonts via `next/font/google` in `layout.tsx`
  - spec: `font-['IBM_Plex_Sans_Condensed'] font-bold` for all KPI values and large numbers

- [ ] **Body / tables / labels** — IBM Plex Sans Regular/Medium
  - source: Google Fonts via `next/font/google` in `layout.tsx`
  - spec: `font-['IBM_Plex_Sans']` as `body` base font via CSS variable

- [ ] **Icon set** — Lucide React (already in package.json)
  - Key icons: `Lock`, `AlertTriangle`, `BrainCircuit`, `ChevronDown`, `TrendingUp`, `TrendingDown`, `Shield`, `Activity`, `FileText`, `Download`, `X`, `ChevronRight`, `RotateCcw`, `ArrowUpDown`, `ArrowUp`, `ArrowDown`, `SearchX`, `AlertCircle`, `Link2`

---

## Phase 1 Specific — Shell Placeholders

- [ ] **Tab placeholder containers** — each of 6 tabs renders name + "Phase 2/3/4 — Chart content coming" in consistent style
  - source: Custom — `div` with tab name in `text-text-secondary` centered, consistent height

---

*Total distinct component types: 55 | Interview status: Complete ✅*

---

## Notes for Claude Code (Phase 1)

1. **Run the master install block above in full before writing any component code**
2. **Tubelight Navbar adaptation:** accept the installed component as-is, wrap it in a container that adds the breach dot overlay per-tab — do not fork its internals
3. **`@/*` alias fix needed:** current `tsconfig.json` maps `@/*` → `./src/*` but data files are at root. Add explicit path overrides: `"@/data/*": ["./data/*"]` and `"@/types/*": ["./types/*"]` before `"@/*"` in the paths object so they resolve correctly
4. **Tailwind config must be replaced:** current config has Crowe dark theme colors. Replace with BofA light theme tokens per PRD exactly — white content surface, `#003571` / `#0065B3` / `#E61030` palette
5. **Logo:** `bank_of_america_logo.svg` is in project root — copy to `/public/bank_of_america_logo.svg` before first `npm run dev`
6. **react-countup, not animejs:** the user selected `react-countup` for KPI number animation. Do not install or use animejs
7. **No Crowe colors anywhere** — this is a BofA-branded product

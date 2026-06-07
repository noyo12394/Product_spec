# 11 — UI/UX Design System

Goal: a **premium, calm, enterprise** aesthetic — dense where estimators need data,
spacious where executives need clarity. Reference quality: Procore, Autodesk Construction
Cloud, Bluebeam, Linear, Vercel, and modern AI SaaS dashboards.

## 1. Design principles
1. **Trust through transparency** — confidence and provenance are first-class UI, never hidden.
2. **Data density without clutter** — tables breathe via spacing/typography, not by hiding info.
3. **The drawing is the hero** — the viewer is large, fast, and tightly linked to data.
4. **Progressive disclosure** — summary first; drill into audit detail on demand.
5. **Keyboard-first power use** — estimators live in the takeoff grid; shortcuts everywhere.
6. **Consistent, predictable, accessible** — WCAG 2.1 AA, strong focus states, no surprises.

## 2. Color system

A neutral, professional base with a confident brand accent and a clear semantic scale
(especially for confidence). Supports light and dark themes.

```
Brand
  --brand-600  #2563EB   (primary actions, links)        // deep professional blue
  --brand-700  #1D4ED8   (hover/active)
  --brand-50   #EFF5FF   (tints, selected rows)

Neutrals (slate)
  --bg          #FFFFFF / dark #0B0F19
  --surface     #F8FAFC / dark #111827
  --surface-2   #F1F5F9 / dark #1F2937
  --border      #E2E8F0 / dark #283143
  --text        #0F172A / dark #E5E7EB
  --text-muted  #64748B / dark #94A3B8

Accent (data viz secondary)
  --accent      #7C3AED   (violet, AI/insight highlights)
  --teal        #0D9488   (positive deltas, savings)

Semantic
  --success     #16A34A
  --warning     #D97706
  --danger      #DC2626
  --info        #0284C7

Confidence scale (used on chips, row tints, overlays)
  high    #16A34A  (≥0.85)   green
  medium  #D97706  (0.6–0.85) amber
  low     #DC2626  (<0.6)     red
  manual  #2563EB  (human-edited) blue
```
Use color sparingly on surfaces; reserve saturation for state, confidence, and the brand accent.

## 3. Typography
- **UI font:** Inter (or Geist) — clean, neutral, excellent at small sizes.
- **Numeric/tabular:** use `font-variant-numeric: tabular-nums` for aligned quantities/costs; consider a mono (JetBrains Mono) for codes/IDs.
- **Scale (rem):** 12 (caption), 14 (body/table), 16 (base), 18 (section), 20/24 (headings), 30/36 (page titles, dashboards).
- **Weights:** 400 body, 500 labels, 600 headings/emphasis. Line-height 1.5 body, 1.2 headings.

## 4. Spacing, radius, elevation
- **Spacing scale:** 4 / 8 / 12 / 16 / 24 / 32 / 48 (8px base grid).
- **Radius:** 8px default, 12px cards, 6px inputs, pill for chips.
- **Elevation:** subtle, layered shadows (e.g., `0 1px 2px rgba(15,23,42,.06)`, `0 8px 24px rgba(15,23,42,.08)` for popovers/modals). Avoid heavy drop shadows.

## 5. Layout & navigation
- **App shell:** left **collapsible sidebar** (global nav) + top **context bar** (project switcher, breadcrumbs, search, notifications, user) + main content.
- **Sidebar nav:** Dashboard, Projects, (within a project: Drawings, Takeoff, Rooms, Rates, Estimate, Reviews, Exports), Rate Library, Admin.
- **Breadcrumbs:** Org ▸ Project ▸ Module ▸ Sheet/Estimate.
- **Project context tabs:** Overview · Drawings · Takeoff · Rooms · Estimate · Reviews · Exports.
- **Command palette (⌘K):** jump to project, sheet, takeoff item, action.
- **Responsive:** sidebar collapses to icons; viewer + grid stack on narrow screens (review is desktop-first).

## 6. Tables (the takeoff grid)
The most-used surface — design for power and clarity:
- Sticky header + first column; **virtualized** rows for 10k+ items.
- **Tabular-nums**, right-aligned quantities/costs; unit chip next to value.
- **Confidence chip** per row (color band) + "needs review" flag.
- Grouping (by room / discipline / division) with collapsible group headers showing subtotals.
- Inline edit (double-click), multi-select, bulk actions toolbar, column show/hide, saved views.
- Row states: detected, accepted (subtle green tick), edited (blue), rejected (strikethrough/muted), manual (blue dot).
- Keyboard: arrow nav, Enter to edit, ⌘A select, A=accept, R=reject, J/K next/prev.

## 7. Cards
- **Metric cards** (dashboard): big tabular number, label, delta chip (▲/▼ with teal/red), sparkline.
- **Project cards:** thumbnail of lead sheet, status pill, client, due date, estimate total, progress bar.
- **Confidence summary card:** stacked bar of high/medium/low value share.
- Consistent 12px radius, 1px border, hover lift.

## 8. Drawing viewer
- Full-bleed canvas; floating, glassy toolbar (zoom, fit, layers, measure, markup, compare).
- **Layer panel** (toggle visibility), **sheet thumbnails** rail, minimap.
- **Measurement overlays:** colored by confidence; hover shows tooltip (type, value, confidence); click selects → highlights the linked takeoff row (and vice-versa).
- Overlay types: count pins, length polylines, area fills (semi-transparent), room polygons with labels.
- Smooth 60fps pan/zoom (WebGL/Canvas); progressive tile loading; crisp at all zoom levels.
- Compare mode: split or onion-skin between versions with diff highlighting.

## 9. Measurement overlays & review pairing
The signature interaction: **viewer ↔ grid are two views of one dataset.**
- Selecting a grid row pans/zooms the viewer to the element and pulses it.
- Selecting an element opens its takeoff row + audit panel.
- The **audit panel** ("How was this calculated?") shows method, inputs, formula, source sheet, scale, reconciliation, assumptions, confidence, and model/prompt version.

## 10. Estimate builder
- Spreadsheet-like priced grid with grouping and live roll-ups.
- Right-side **totals panel**: direct cost → overhead → markup → contingency → tax → total, each editable, recomputing live.
- Scenario tabs/compare; cost-by-discipline and cost-by-room donut/bar charts.
- Approval banner (status, approver, lock state) at top.

## 11. Professional report design (exports)
- **Cover:** firm logo, project, client, date, revision, total (large).
- **Executive summary:** total, cost by discipline (chart), confidence summary, key assumptions.
- **Detailed BOQ:** grouped by division/discipline/room; columns: code, description, qty, unit, rate, total; clean rules, alternating subtle row tint, tabular numerals.
- **Room-wise summary:** per-room costs.
- **Audit appendix:** how key/large quantities were derived; assumptions list; confidence notes.
- Branded header/footer, page numbers, consistent type scale; print-perfect PDF.

## 12. Empty, loading & error states
- **Empty:** friendly illustration + primary CTA ("Upload your first drawing set").
- **Processing:** stepper showing pipeline stage (Converting → Parsing → Interpreting → Takeoff) with per-sheet progress.
- **Error:** plain-language message + remedy (e.g., "Couldn't detect scale — calibrate manually").
- **AI working:** subtle shimmer + "Reviewing 1,240 elements…"; never block the whole UI.

## 13. Motion
- Purposeful, fast (150–250ms), `ease-out`. Used for: panel slide-ins, row highlight pulse on viewer-grid pairing, number count-ups on totals. Respect `prefers-reduced-motion`.

## 14. Component library
Built on **shadcn/ui + Tailwind + Radix**, themed with the tokens above. Maintain a Storybook
with all states (incl. confidence variants, loading, empty, error) as the source of truth.

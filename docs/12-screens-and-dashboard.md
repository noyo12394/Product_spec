# 12 — Screens & Dashboard (Page-by-Page)

Screen inventory with purpose, key components, and primary actions. Wireframes are described
in ASCII for clarity; build against the [Design System](11-ui-ux-design-system.md).

## Navigation map
```
/login, /signup, /sso
/onboarding
/dashboard                         ← portfolio home
/projects                          ← project list
/projects/new
/projects/:id                      ← project overview
/projects/:id/drawings
/projects/:id/drawings/:sheetId    ← viewer + takeoff review (the workhorse)
/projects/:id/takeoff              ← full takeoff grid
/projects/:id/rooms                ← room-wise takeoff
/projects/:id/estimate             ← estimate builder
/projects/:id/estimate/revisions   ← revision compare
/projects/:id/reviews              ← review/approval queue
/projects/:id/exports              ← export center
/rates                             ← rate library
/admin/...                         ← org, users, roles, taxonomy, integrations, audit
/settings                          ← personal
```

---

## 1. Auth & Onboarding
- **Login/Signup/SSO** — email+password, OIDC/SAML SSO, MFA. Clean centered card, brand mark.
- **Onboarding** — create org, set units/currency/region, invite team, optional rate-library import. Progress stepper.

## 2. Portfolio Dashboard (`/dashboard`)
Executive + estimator home.
```
┌───────────────────────────────────────────────────────────────────────────┐
│  Dashboard                                   ⌘K  🔔  Avatar                  │
├───────────────────────────────────────────────────────────────────────────┤
│ [Active projects 12] [In review 4] [Est. value $48.2M] [Avg time-to-est 0.8d]│  ← metric cards
├───────────────────────────────────────────────────────────────────────────┤
│  Cost by discipline (bar)        │   Throughput / time-to-estimate (line)   │
├──────────────────────────────────┴──────────────────────────────────────────┤
│  Recent projects (cards/table): name · client · status · total · due · prog. │
│  My review queue: items needing your attention (low-confidence, mentions)    │
└───────────────────────────────────────────────────────────────────────────┘
```
Actions: New Project, jump to project, open review queue.

## 3. Projects List (`/projects`)
- Filterable/searchable table or card grid: name, client, region, disciplines, status, estimate total, due date, progress.
- Saved views (My projects, In review, Won/Lost). Bulk archive. New Project CTA.

## 4. New Project (`/projects/new`)
- Form: name, client, location/**region** (drives rates), **units/currency**, discipline scope (multi-select), due date, team members, optional rate library.
- Then prompt to upload drawings.

## 5. Project Overview (`/projects/:id`)
```
Project ▸ Riverside Office Fit-out                Status: In Review   [Export]
Tabs: Overview · Drawings · Takeoff · Rooms · Estimate · Reviews · Exports
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ Drawings 38 │ Items 1,240 │ Reviewed 78%│ Total $4.21M│
└─────────────┴─────────────┴─────────────┴─────────────┘
Pipeline status (per discipline) · Confidence summary (stacked bar) ·
Recent activity · Cost by discipline · Open reviews · Team
```

## 6. Drawings / Drawing Register (`/projects/:id/drawings`)
- Upload zone (drag-drop, zip) with job progress stepper per file.
- Register table: thumbnail, sheet no, title, discipline, version, scale (confirmed?), status, last updated.
- Bulk discipline tagging; scale-confirm prompts; version badges; open in viewer.

## 7. Drawing Viewer + Takeoff Review (`/projects/:id/drawings/:sheetId`) — the workhorse
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ A-101 Floor Plan L1   Scale 1:50 ✓   Disc: Architectural   [Compare] [Markup]  │
├───────────┬───────────────────────────────────────────────┬───────────────────┤
│ Thumbs    │                                               │ Takeoff rows       │
│ rail      │            DRAWING CANVAS                      │ (filter: this sheet)│
│           │     overlays: rooms, walls, doors…            │ ┌───────────────┐ │
│ Layers ▸  │     (colored by confidence)                   │ │Door D1  12 ea ●H│ │
│ □ A-WALL  │                                               │ │Wall   42.6 m2 ●M│ │
│ □ A-DOOR  │     [hover element → tooltip]                 │ │Window 8 ea   ●H │ │
│ □ A-FLOR  │     [click element ↔ highlights row]          │ └───────────────┘ │
│           │                                               │ [Accept] [Reject]  │
├───────────┴───────────────────────────────────────────────┴───────────────────┤
│ Audit panel: "How was Wall=42.6 m² calculated?"  method · inputs · formula ·    │
│ source A-101 · scale 1:50 ✓ · reconciliation match · confidence 0.88            │
└────────────────────────────────────────────────────────────────────────────────┘
```
Actions: pan/zoom, toggle layers, accept/edit/split/merge/reclassify, add manual measurement, comment, calibrate scale, compare versions.

## 8. Takeoff Grid (`/projects/:id/takeoff`)
- Full editable, virtualized grid across all sheets/disciplines.
- Group by room/discipline/division with subtotal headers.
- Filters: discipline, confidence band, status, sheet, search.
- Bulk accept/reject by confidence threshold; column customization; saved views.
- Clicking a row can deep-link into the viewer for that element.

## 9. Room-wise Takeoff (`/projects/:id/rooms`)
- Room list with area, perimeter, height, item count, (priced) cost.
- Expand a room → its quantities by discipline; mini-plan thumbnail with the room highlighted.
- Compare rooms; flag rooms missing expected items.

## 10. Rate Library (`/rates`)
- Libraries list (org/regional); within a library: searchable rates table (code, description, uom, material/labor/equip/sub, total, region, effective date, source).
- Import (CSV/Excel) with column mapper; inline edit; versioning; map rates ↔ cost items.

## 11. Estimate Builder (`/projects/:id/estimate`)
```
Estimate ▸ Rev 3 (Draft)         92% value high-confidence      [Price] [Submit for approval]
┌──────────────────────────────────────────────┬────────────────────────┐
│ Priced grid (grouped by division)            │ Totals                  │
│ code · desc · qty · unit · rate · total       │ Direct cost  $3.42M     │
│ ...                                           │ Overhead 8%  $0.27M     │
│ subtotal per group                            │ Markup 12%   $0.44M     │
│                                               │ Contingency  $0.21M     │
│                                               │ Tax          —          │
│                                               │ TOTAL        $4.21M     │
├──────────────────────────────────────────────┴────────────────────────┤
│ Cost by discipline (donut)   ·   Cost by room (bar)                     │
└────────────────────────────────────────────────────────────────────────┘
```
Actions: apply rates, edit markups, add manual lines, create revision, submit for approval.

## 12. Revisions & Compare (`/projects/:id/estimate/revisions`)
- Revision list with status, total, author, date.
- Side-by-side compare: line-level deltas, total delta, top cost drivers. Promote to issued.

## 13. Reviews & Approval (`/projects/:id/reviews`)
- Queue of items needing review (low confidence, reconciliation mismatches, mentions, A/E flags).
- Approval requests for lead estimator: summary, confidence, diff vs. prior; Approve/Return with comment.

## 14. Export Center (`/projects/:id/exports`)
- New export: choose format (Excel/PDF/BOQ), template, scope (project/discipline/room/division), include audit appendix.
- Export history: format, scope, status, download/share link, created by/at.

## 15. Admin (`/admin/...`)
- **Org & billing**, **Users & roles** (RBAC matrix), **Teams**, **Taxonomy** (CSI/Uniclass + custom cost items/assemblies), **Symbol/layer mapping profiles**, **Integrations** (SSO, storage, Procore/ACC), **Audit log viewer**, **API keys**.

## 16. Settings (`/settings`)
- Profile, notifications, theme (light/dark), default units, security (MFA/sessions).

---

## Dashboard layout system (reusable)
Every dashboard/overview uses the same grid: **metric-card row → 2-up chart row →
content list(s)**, on a 12-column responsive grid with 24px gutters. Cards and charts share
tokens from the design system, ensuring visual consistency from portfolio to project to estimate.

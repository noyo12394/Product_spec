# 04 — Feature List

Features grouped by module. Each is tagged: **[MVP]**, **[V1]** (fast-follow), or **[V2+]** (future).
See [MVP & Roadmap](15-mvp-and-roadmap.md) for sequencing.

---

## Project Dashboard
- [MVP] Project list with status, client, discipline scope, due date, last activity.
- [MVP] Create/edit project (name, client, location/region, units, currency, team).
- [MVP] Per-project overview: drawings count, takeoff progress, estimate total, revision count.
- [V1] Portfolio analytics: cost by discipline, win/loss, throughput, time-to-estimate.
- [V1] Saved views, filters, and search across projects.
- [V2+] Forecasting & benchmarking against historical projects.

## File Upload & Drawing Register
- [MVP] Drag-drop multi-file upload; DWG, DXF, PDF, PNG/JPG/TIFF, XLSX/CSV, DOCX.
- [MVP] Zip ingestion; auto-grouping into a drawing register (sheet number, title, discipline).
- [MVP] Upload progress, job status, and error reporting.
- [V1] Version linking & drawing diff (revision clouds, added/removed/changed).
- [V1] Email-in / cloud-drive import (Drive, Dropbox, SharePoint, Procore/ACC).
- [V2+] Auto sheet-index parsing from a drawing-list sheet.

## Drawing Viewer
- [MVP] High-performance pan/zoom viewer for vector PDF, raster, and DXF.
- [MVP] Layer toggles; sheet navigation; fit/zoom-to-region.
- [MVP] Measurement overlays linked to takeoff rows (click row ↔ highlight element).
- [V1] Manual markup tools (count, length, area, polygon, calibrate scale).
- [V1] Side-by-side version compare; overlay diff.
- [V2+] 3D/BIM (IFC) viewer with model-based takeoff.

## CAD/PDF Parser
- [MVP] DWG→DXF conversion; DXF geometry/text/layer/block extraction.
- [MVP] Vector PDF text + vector extraction; raster OCR.
- [MVP] Scale detection (title block / scale bar / known dimension) with user confirm.
- [MVP] Schedule, legend, and title-block extraction (tabular).
- [V1] Line-type / hatch pattern classification; block library mapping.
- [V2+] Per-org layer/symbol mapping profiles that learn from corrections.

## Discipline Selector
- [MVP] Tag sheets/elements by Civil, Structural, Mechanical, Electrical, Architectural.
- [MVP] Discipline-scoped takeoff and filtering.
- [V1] Auto discipline classification per sheet (model + title-block heuristics).

## AI Drawing Interpretation
- [MVP] Room detection (boundaries, names, numbers).
- [MVP] Element detection per MVP disciplines (walls, slabs, columns, beams, doors, windows + key MEP fixtures).
- [MVP] Confidence scoring per element/quantity.
- [MVP] Schedule reconciliation (cross-check detected counts vs. door/window/room schedules).
- [V1] Symbol/legend learning; full MEP element coverage (ducts, pipes, fittings, panels, equipment).
- [V2+] Cross-sheet reasoning (plan ↔ section ↔ detail), spec-to-drawing linking.

## Measurement & Takeoff Engine
- [MVP] Length, area, volume, count with unit handling (metric/imperial).
- [MVP] Opening deductions; configurable waste factors.
- [MVP] Room-wise rollups; discipline & project rollups.
- [MVP] Audit trail per quantity (source, geometry, formula, inputs, assumptions).
- [V1] Assemblies/recipes (1 wall → framing + board + insulation + paint).
- [V1] Rules engine for trade-specific takeoff conventions.
- [V2+] Parametric assemblies tied to spec sections.

## Quantity Extraction Table
- [MVP] Editable, filterable, groupable takeoff grid (by room/discipline/division).
- [MVP] Inline edit, add, delete, split, merge, reclassify.
- [MVP] Bulk accept/reject by confidence/discipline/sheet.
- [MVP] Confidence indicators + "needs review" flags.
- [V1] Column customization, formulas, saved layouts.

## Rate Library
- [MVP] Material/labor/equipment/sub rates with unit, currency, region, effective date.
- [MVP] CSV/Excel import; in-app edit; category mapping (CSI/Uniclass).
- [MVP] Library snapshot per estimate (reproducibility).
- [V1] Multiple libraries (org, project, regional); rate escalation/indexing.
- [V2+] Market rate feeds / supplier price integrations.

## Final Estimate Builder
- [MVP] Apply rates to quantities; line-item priced estimate.
- [MVP] Markups, overhead, contingency, tax; subtotal/total roll-ups.
- [MVP] Estimate revisions.
- [V1] Scenario comparison & value engineering; alternates/allowances.
- [V2+] Probabilistic/risk-based estimating (ranges, Monte Carlo).

## Review & Approval Workflow
- [MVP] Estimator review gate before pricing.
- [V1] Lead approval gate; revision lock; status lifecycle.
- [V1] Comments/mentions on items and drawing regions.
- [V2+] Configurable multi-step approval chains.

## Export Center
- [MVP] Excel (templated), PDF (branded), BOQ format; audit appendix.
- [MVP] Scope selection (project / discipline / room / division).
- [V1] Custom templates; firm branding; shareable links.
- [V2+] Direct push to Procore/ACC/ERP.

## Admin Settings
- [MVP] Org, users, roles, projects; rate libraries; units/currency defaults.
- [V1] SSO/SAML, audit log viewer, taxonomy management, API keys.
- [V2+] Data residency, private/VPC deployment, custom ML model profiles.

---

## Cross-cutting
- [MVP] Audit logging of all user/system actions.
- [MVP] Confidence + provenance on every AI output.
- [V1] Notifications (in-app + email).
- [V1] Full-text search across projects, drawings, items.
- [V2+] Mobile companion (field verification, photo capture).

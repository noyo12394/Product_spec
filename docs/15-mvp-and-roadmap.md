# 15 — MVP Scope & Roadmap

## 1. MVP objective
Prove the core value loop end-to-end for **one discipline done well (Architectural)** plus
basic Structural, on **clean vector drawings (DXF / vector PDF)**:

> Upload a drawing set → create a project → view drawings → extract basic quantities →
> room-wise takeoff → manually correct → apply rates → export a final estimate.

The MVP must demonstrate **trustworthy assistance**: confidence scores, audit trails, and a
real human-review gate — not magic-black-box pricing.

## 2. MVP scope (in)

### Projects & files
- Create/edit project (name, client, region, units, currency, disciplines, team).
- Upload DXF, vector PDF, PNG/JPG (raster as best-effort), XLSX BOQ (import as reference).
- Drawing register with sheet number/title/discipline; job status & progress.

### Parsing & viewer
- DXF + vector-PDF parsing → CDM (layers, geometry, text, basic schedules, title block).
- Scale detection + **mandatory user confirmation**.
- Drawing viewer: pan/zoom, layer toggles, sheet nav, overlays linked to takeoff rows.

### Interpretation (architectural + basic structural)
- Room detection (boundaries, name/number) on clean vector plans.
- Element detection: walls, doors, windows, floors/slabs, columns, beams.
- Confidence scoring per element/quantity.
- Door/window/room **schedule reconciliation**.

### Takeoff
- Measurement engine: counts, lengths, areas, volumes; opening deductions; waste factors.
- Room-wise rollups; full takeoff grid (editable, groupable, filter by confidence).
- **Audit trail** per quantity.

### Review & correction
- Estimator review: accept/edit/split/merge/reclassify; add manual items; bulk accept/reject by confidence.
- Viewer ↔ grid pairing + "How was this calculated?" panel.

### Pricing & export
- Rate library (import CSV/Excel, in-app edit, map to cost items).
- Apply rates → priced estimate with markups/overhead/contingency/tax; revisions (basic).
- Export to Excel (templated), PDF (branded report), BOQ; audit appendix.

### Platform
- Multi-tenant org/users; core RBAC (admin, lead, estimator, viewer); auth + MFA.
- Audit logging; async job pipeline with progress; notifications (in-app).

## 3. MVP scope (out — deliberately)
- DWG (require DXF/PDF for MVP) — add ODA conversion in V1.
- Full MEP element coverage (ducts, pipes, conduit routing) — V1.
- Heavy raster/scanned-drawing accuracy, line recovery — best-effort only in MVP.
- Assemblies/recipes, scenario compare, multi-step approvals — V1.
- SSO/SAML, integrations (Procore/ACC), mobile — V1/V2.
- Continuous-learning retraining loop (collect data in MVP, retrain in V1).

## 4. MVP success criteria
- Element detection recall ≥ 85% on the clean-vector eval set (architectural).
- A real estimator completes upload→export on a sample project in < 1 day with trust in the total.
- ≥ 60% takeoff-time reduction vs. their manual baseline on that project.
- Zero quantities priced without confidence + audit + review.

## 5. Roadmap

### V1 — "Production-ready multi-discipline" (post-MVP, ~Q+1/Q+2)
- DWG ingestion via ODA conversion.
- Full MEP coverage (ducts, pipes, fittings, conduit, panels, equipment).
- Assemblies/recipes; rules engine for trade conventions.
- Drawing **version diff** + estimate **scenario compare**; multi-step approval workflow.
- Manual markup tools in viewer; version compare/onion-skin.
- SSO/SAML, audit-log viewer, taxonomy management, custom templates & branding.
- Continuous-learning loop (retrain detector from corrections; per-org symbol/layer profiles).
- Notifications (email), full-text search, portfolio analytics.

### V2 — "Intelligence & ecosystem"
- Cross-sheet reasoning (plan↔section↔detail), spec-to-drawing/assembly linking.
- BIM/IFC ingestion + model-based takeoff; 3D viewer.
- Probabilistic/risk-based estimating (ranges, Monte Carlo).
- Market rate feeds / supplier price integrations.
- Direct push to Procore / Autodesk Construction Cloud / ERP.
- Mobile companion (field verification, photo capture, RFI loop).

### V3+ — "Platform & autonomy"
- Benchmarking & forecasting across historical projects.
- Custom per-tenant ML model profiles; private/VPC deployment offering.
- Agentic "draft estimate" that pre-stages a full reviewed-ready takeoff for the estimator to approve.
- Marketplace for rate libraries, assemblies, and symbol packs.

## 6. Sequencing rationale
Nail **one discipline on clean vector data with full trust mechanics** before widening
disciplines or fighting raster/DWG complexity. Trust (confidence + audit + review) is the
moat; breadth without trust is a liability.

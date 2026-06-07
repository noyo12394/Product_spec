# 01 — Product Requirements Document (PRD)

## 1. Overview

**Product name:** EstimAI
**Category:** AI-assisted construction estimating / preconstruction SaaS
**One-liner:** Upload your drawing set, let AI do the takeoff, and ship a defensible, priced estimate in hours instead of weeks — with an estimator in control the whole way.

### Problem
Construction estimating is slow, manual, and error-prone. Estimators spend 60–80% of
their time on quantity takeoff: manually counting fixtures, measuring walls, tracing
slabs, and copying numbers into spreadsheets. Drawings arrive in inconsistent formats
(DWG, DXF, PDF, scanned images), at different scales, with non-standard symbols and
layer conventions. Mistakes in takeoff propagate directly into bids — a single missed
zero or miscounted assembly can win an unprofitable job or lose a profitable one.

### Solution
EstimAI ingests the full drawing set, interprets it across disciplines, and produces a
quantity takeoff with confidence scores and a transparent audit trail. The estimator
reviews, corrects, and approves; the system then applies a rate library to produce a
final, exportable estimate. Versioning, revisions, and audit logs make every number
traceable and defensible.

### Why now
- LLMs + modern computer vision can read drawings and schedules at a quality that was impossible 3 years ago.
- Vector-PDF and DXF parsing libraries are mature.
- The industry is under margin pressure and labor shortage, raising demand for productivity tools.
- Buyers already trust cloud preconstruction tools (Procore, ACC, Bluebeam), so the category is established.

## 2. Goals & Non-Goals

### Goals
1. Cut takeoff time by **≥ 60%** for a typical mid-size project.
2. Reach **≥ 90% element-detection recall** on clean vector drawings for MVP disciplines.
3. Keep humans in control: nothing is priced without estimator approval.
4. Make every quantity **explainable** (what, where, how computed, what confidence).
5. Produce **export-ready** deliverables (Excel, PDF, BOQ) that match firm templates.
6. Support **multi-discipline** estimating in one project workspace.

### Non-Goals (initially)
- Full 4D/5D scheduling integration (future).
- Acting as a system of record for accounting/ERP (we integrate, not replace).
- Generating drawings or performing design work.
- Replacing the estimator's judgment — EstimAI is an assistant, not an autopilot.

## 3. Target Users
General contractors, subcontractors, specialty trades, quantity surveyors,
architecture/engineering firms, and owners' preconstruction teams. See
[Personas](02-personas.md).

## 4. Success Metrics (KPIs)

| Metric | Target (12 months) |
|--------|--------------------|
| Takeoff time reduction vs. manual baseline | ≥ 60% |
| Element detection recall (vector drawings, MVP disciplines) | ≥ 90% |
| Element detection precision | ≥ 85% |
| Estimator corrections per 100 detected items | ≤ 15 |
| Time-to-first-estimate for a new project | < 1 business day |
| Weekly active estimators / licensed seats | ≥ 60% |
| Net revenue retention | ≥ 115% |
| Estimate export adoption (projects exported / projects created) | ≥ 80% |

## 5. Functional Requirements

### 5.1 Ingestion
- FR-1: Upload DWG, DXF, PDF (vector + raster), PNG/JPG/TIFF, XLSX/CSV BOQs, DOCX/PDF specs.
- FR-2: Accept multi-file drawing sets and zipped sheet packages; group into a project.
- FR-3: Detect and let users confirm drawing **scale** (from title block, scale bar, or known dimension).
- FR-4: Extract layers, line types, blocks, text, tags, schedules, legends, annotations.
- FR-5: Handle files up to 500 MB; queue large jobs and report progress.

### 5.2 Interpretation
- FR-6: Detect rooms/spaces and their names, numbers, and boundaries.
- FR-7: Detect elements per discipline: walls, slabs, columns, beams, footings, doors,
  windows, ducts, pipes, fittings, lighting points, sockets, panels, plumbing fixtures, HVAC units, etc.
- FR-8: Read schedules (door/window/room/finish/equipment) and legends/symbol keys.
- FR-9: Attach a **confidence score** to every detected element and quantity.
- FR-10: Produce an **audit trail** per quantity: source sheet, geometry, formula, inputs, scale, assumptions.

### 5.3 Measurement & Takeoff
- FR-11: Compute length, area, volume, and count quantities with correct units.
- FR-12: Support assemblies (e.g., a wall = framing + board + paint + insulation).
- FR-13: Room-wise takeoff: roll quantities up by room, then by discipline, then by project.
- FR-14: Deduct openings (doors/windows) from wall areas; apply configurable waste factors.

### 5.4 Review & Correction
- FR-15: Side-by-side drawing viewer with measurement overlays linked to takeoff rows.
- FR-16: Estimators can add, edit, delete, split, merge, and re-classify items.
- FR-17: Bulk accept/reject by confidence threshold, discipline, or sheet.
- FR-18: Every manual change is logged with user, timestamp, and before/after values.

### 5.5 Pricing
- FR-19: Maintain a **rate library** (material, labor, equipment, subcontractor) with regions and dates.
- FR-20: Apply rates to quantities to build a priced estimate with markups, overhead, contingency, tax.
- FR-21: Support multiple estimate **revisions** and scenario comparison.

### 5.6 Export & Reporting
- FR-22: Export to Excel (templated), PDF (branded report), and standard BOQ formats.
- FR-23: Generate summary dashboards (cost by discipline, by room, by CSI/Uniclass division).
- FR-24: Include audit/assumption appendix in exports.

### 5.7 Administration
- FR-25: Multi-tenant orgs, projects, teams, roles, and permissions.
- FR-26: Manage rate libraries, templates, classification taxonomies, and integrations.
- FR-27: Full audit log of all user and system actions.

## 6. Non-Functional Requirements
- **Performance:** Viewer loads a typical sheet in < 2s; takeoff table interactions < 200ms.
- **Scalability:** Parse/ML jobs scale horizontally via a worker pool; 1000s of concurrent projects.
- **Reliability:** 99.9% uptime target; durable object storage; idempotent, resumable jobs.
- **Security:** Encryption at rest and in transit; tenant isolation; SOC 2-aligned controls. See [Security](14-security-permissions.md).
- **Accuracy transparency:** No quantity reaches an export without a confidence value and audit record.
- **Auditability:** Immutable event log for estimates, revisions, and approvals.
- **Accessibility:** WCAG 2.1 AA for primary workflows.
- **Internationalization:** Metric & imperial units; multi-currency; localizable labels.

## 7. Constraints & Assumptions
- DWG is proprietary; we rely on ODA/Teigha conversion to DXF rather than reverse-engineering.
- Scanned/raster drawings yield lower accuracy than vector — surfaced via confidence.
- AI output is assistive; the estimator is accountable for the final number (reflected in UX and legal terms).
- Initial classification taxonomy: CSI MasterFormat + Uniclass mapping; extensible per org.

## 8. Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| AI mis-detects elements, eroding trust | Confidence scores, audit trails, mandatory human review, continuous eval set |
| DWG conversion fidelity issues | Use ODA converter; validate geometry; fall back to PDF/raster pipeline |
| Inconsistent drawing standards across firms | Per-org layer/symbol mapping profiles; learn from corrections |
| Liability for bad estimates | Clear "assistive" positioning, approval gates, audit trails, T&Cs |
| Data sensitivity (bid pricing is confidential) | Strong tenant isolation, RBAC, encryption, optional private/VPC deployment |

## 9. Out-of-scope clarifications
EstimAI does not stamp engineering deliverables, does not guarantee code compliance,
and does not replace a licensed professional's review.

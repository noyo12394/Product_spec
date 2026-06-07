# 16 — Step-by-Step Build Plan

A pragmatic, phased plan a small team can execute. Phases are roughly 2–4 week increments;
adjust to team size. Each phase ends with something demoable and testable.

## Team (lean MVP)
- 1 Tech lead / full-stack
- 1–2 Frontend (React/Next.js)
- 1 Backend (NestJS/Node)
- 1–2 Python/ML (CAD parsing + AI pipeline)
- 1 Product/UX designer (part-time after design system)
- (Shared) DevOps/QA

---

## Phase 0 — Foundations (Week 1–2)
**Goal:** repo, infra skeleton, design system, auth.
- Monorepo (Turborepo): `apps/web`, `apps/core-api`, `services/cad-ai`, `packages/ui`, `packages/types`.
- CI/CD (GitHub Actions), Docker, Terraform skeleton, staging env.
- Postgres + PostGIS, Redis, S3 bucket provisioned.
- Auth (OIDC + email/MFA), org/user/membership models, RBAC scaffolding.
- Design system in Storybook (tokens, buttons, inputs, table, card, chips, confidence variants).
- **Exit:** users can sign up, create an org, log in; design system published.

## Phase 1 — Projects & file upload (Week 3–4)
**Goal:** project CRUD + ingestion intake.
- Project create/list/overview screens; project members & roles.
- Upload service (presigned URLs), virus scan, drawing register, jobs table + worker bootstrap.
- File-type detection & routing skeleton; job-progress over WebSocket.
- **Exit:** create a project, upload DXF/PDF, see files queued with live status.

## Phase 2 — Parsing → Canonical Drawing Model (Week 5–7)
**Goal:** turn DXF/vector PDF into the CDM.
- DXF parse (ezdxf): layers, geometry, blocks, text.
- Vector-PDF parse (PyMuPDF/pdfplumber): geometry, text.
- Schedule/legend/title-block table extraction (basic).
- Scale detection + persist; raster tiling for viewer.
- **Exit:** uploaded sheets produce a validated CDM + tiles; data visible via API.

## Phase 3 — Drawing viewer + scale confirm (Week 8–9)
**Goal:** see drawings, confirm scale.
- Viewer (PDF.js / OpenSeadragon / canvas overlays): pan/zoom, layers, sheet nav.
- Scale-confirmation UI (calibrate by known dimension if needed).
- **Exit:** estimator opens any sheet, confirms scale, toggles layers.

## Phase 4 — Room & element detection + measurement (Week 10–13)
**Goal:** the core takeoff for architectural + basic structural.
- Room detection (wall-graph polygonize + label matching).
- Vector-first element heuristics (walls/doors/windows/slabs/columns/beams) + symbol detector v0.
- Measurement engine (count/length/area/volume, opening deduction, waste) with **audit trails**.
- Confidence fusion v1; schedule reconciliation.
- **Exit:** a sheet yields confidence-scored quantities with audit JSON.

## Phase 5 — Takeoff grid + review workspace (Week 14–16)
**Goal:** the human-in-the-loop UX (highest-value surface).
- Virtualized, editable, groupable takeoff grid; filters by confidence/discipline/sheet.
- Viewer ↔ grid pairing; "How was this calculated?" audit panel.
- Accept/edit/split/merge/reclassify; bulk actions; manual items; all changes audit-logged.
- Room-wise takeoff screen.
- **Exit:** estimator reviews & corrects a full sheet efficiently.

## Phase 6 — Rates & estimate builder (Week 17–18)
**Goal:** turn quantities into priced estimates.
- Rate library (import CSV/Excel, edit, map to cost items).
- Estimate builder: apply rates, markups/overhead/contingency/tax, totals, basic revisions.
- Rate snapshot per revision.
- **Exit:** priced estimate with live totals and confidence summary.

## Phase 7 — Export center (Week 19–20)
**Goal:** professional deliverables.
- Excel (templated), PDF (branded report), BOQ exports + audit appendix.
- Export center UI + history.
- **Exit:** download a client-ready estimate in all three formats.

## Phase 8 — Hardening & MVP launch (Week 21–24)
**Goal:** trustworthy, secure, observable.
- AI eval harness + labeled eval set; calibration; recall/precision gates in CI.
- Security pass (RLS, scanning, pen-test prep), perf (viewer/grid), observability dashboards.
- Pilot with 2–3 friendly estimating teams; measure KPIs ([01](01-product-requirements.md)).
- **Exit:** MVP live with pilots; metrics instrumented.

---

## After MVP → V1 (see [Roadmap](15-mvp-and-roadmap.md))
DWG conversion, full MEP, assemblies, version diff, scenario compare, SSO, integrations,
continuous-learning retraining.

## Engineering practices throughout
- **Eval-driven AI:** no model/prompt change ships without passing the eval gate.
- **Contract-first:** OpenAPI + shared TS/Pydantic types; FE/BE never drift.
- **Idempotent jobs:** every pipeline step resumable, keyed by content hash + version.
- **Trust invariant test:** automated check that no quantity reaches an export without
  confidence + audit + review status.
- **Feature flags** for gradual AI rollout per tenant.
- **Definition of done:** tests + Storybook states + audit logging + accessibility check.

## Key risks to watch during build
- Parsing fidelity on real-world messy files → invest early in a diverse test corpus.
- Viewer performance with large sheets → tile + virtualize from the start.
- Confidence calibration → build the eval set in Phase 4, not at the end.
- Scope creep into raster/DWG/MEP before architectural-vector is solid → hold the line.

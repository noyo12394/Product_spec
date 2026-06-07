# EstimAI — AI-Powered Construction Estimation Platform

> An enterprise-grade web application that reads CAD/BIM and construction documents, automatically performs quantity takeoffs, and helps estimators produce final, defensible cost estimates — with a human always in the loop.

EstimAI ingests DWG, DXF, PDF, image-based drawings, Excel BOQs, and specification
documents across all disciplines (Civil, Structural, Mechanical, Electrical,
Architectural). It detects rooms, extracts measurements, classifies work items,
generates takeoffs, applies a rate library, and produces priced estimates that can
be exported to Excel, PDF, and BOQ formats — all behind a premium, modern SaaS UI
comparable to Procore, Autodesk Construction Cloud, and Bluebeam.

A central principle: **the AI never blindly prices.** Every quantity carries a
confidence score, an audit trail explaining how it was computed, and an
estimator-review gate before final pricing.

---

## Documentation Index

This repository is the full product specification. Read in order, or jump to a section.

| # | Document | Covers |
|---|----------|--------|
| 01 | [Product Requirements (PRD)](docs/01-product-requirements.md) | Vision, goals, scope, success metrics, requirements |
| 02 | [User Personas](docs/02-personas.md) | Estimator, Lead Estimator, PM, Contractor, Architect/Engineer, Admin |
| 03 | [Main Workflows](docs/03-workflows.md) | End-to-end flows from upload to final price |
| 04 | [Feature List](docs/04-features.md) | Full catalog by module, MVP vs. later |
| 05 | [Technical Architecture](docs/05-architecture.md) | System diagram, services, data flow, deployment |
| 06 | [Recommended Tech Stack](docs/06-tech-stack.md) | Frontend, backend, AI, infra choices + rationale |
| 07 | [Database Schema](docs/07-database-schema.md) | Tables, relationships, example DDL |
| 08 | [AI/ML Architecture](docs/08-ai-ml-architecture.md) | Drawing interpretation pipeline, models, confidence |
| 09 | [CAD/PDF Processing](docs/09-cad-pdf-processing.md) | Parsing DWG/DXF/PDF/images, scale, layers, symbols |
| 10 | [Estimation & Measurement Logic](docs/10-estimation-measurement-logic.md) | Takeoff math, rules, room-wise, audit trails |
| 11 | [UI/UX Design System](docs/11-ui-ux-design-system.md) | Colors, type, layout, tables, cards, viewer, reports |
| 12 | [Screens & Dashboard](docs/12-screens-and-dashboard.md) | Page-by-page breakdown, dashboard layout |
| 13 | [AI Prompting Strategy](docs/13-ai-prompting-strategy.md) | Agent design, example prompts, guardrails |
| 14 | [Security & Permissions](docs/14-security-permissions.md) | RBAC, tenancy, audit, compliance |
| 15 | [MVP Scope & Roadmap](docs/15-mvp-and-roadmap.md) | MVP definition + advanced future features |
| 16 | [Step-by-Step Build Plan](docs/16-build-plan.md) | Phased delivery, milestones, team |
| 17 | [API Endpoints](docs/17-api-endpoints.md) | REST/GraphQL surface with examples |
| 18 | [Frontend Component Structure](docs/18-frontend-components.md) | Component tree, state, routing |
| 19 | [Worked Examples](docs/19-examples.md) | Sample tables, estimate output, full user journey |

---

## TL;DR for a development team

- **Stack:** Next.js + TypeScript + Tailwind/shadcn front end; FastAPI (Python) core
  for CAD/AI work + Node/NestJS for the SaaS API; Postgres + PostGIS; Redis; S3-compatible
  object storage; a Python worker pool (Celery/RQ) for parsing and ML; LLM orchestration
  via Claude (`claude-opus-4-8` for reasoning, `claude-haiku-4-5` for cheap classification).
- **CAD pipeline:** `ezdxf` (DXF), ODA File Converter / Teigha for DWG→DXF, `pdfplumber`/`PyMuPDF`
  for vector PDFs, OCR (PaddleOCR/Tesseract) + a YOLO-style symbol detector for raster drawings.
- **Core loop:** Upload → normalize → parse geometry & text → detect rooms/elements →
  measure → classify → confidence-scored takeoff → **human review** → rate application →
  priced estimate → export. Every number has an audit trail and a revision history.
- **MVP:** project creation, file upload, drawing viewer, basic quantity extraction,
  room-wise takeoff, manual correction, rate application, final estimate export.

See [docs/15-mvp-and-roadmap.md](docs/15-mvp-and-roadmap.md) and
[docs/16-build-plan.md](docs/16-build-plan.md) to start building.

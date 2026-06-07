# 06 — Recommended Tech Stack

Choices favor mature ecosystems, hiring availability, and the specific needs of CAD
geometry + ML. Rationale included so the team can adapt.

## Frontend
| Concern | Choice | Why |
|---------|--------|-----|
| Framework | **Next.js (React) + TypeScript** | SSR/ISR, routing, great DX, large talent pool |
| Styling | **Tailwind CSS + shadcn/ui** | Fast, consistent, premium look; design-system friendly |
| Component primitives | **Radix UI** | Accessible, unstyled primitives under shadcn |
| Data grid | **TanStack Table** (+ virtualization) | Powerful editable/groupable takeoff tables at scale |
| Drawing viewer | **PDF.js** (PDF), **OpenSeadragon** (tiled raster), **PixiJS/Canvas/WebGL** (vector overlays); **dxf-parser**/**three.js** for DXF | High-perf pan/zoom + overlay rendering |
| State/data | **TanStack Query** (server state) + **Zustand** (UI state) | Simple, scalable, avoids Redux boilerplate |
| Charts | **Recharts** or **visx** | Dashboards, cost breakdowns |
| Forms | **React Hook Form + Zod** | Type-safe validation shared with API |
| Realtime | **WebSocket** (native) / **Socket.IO** | Job progress, presence, collaboration |
| i18n | **next-intl** | Units/currency/locale |

## Backend
| Concern | Choice | Why |
|---------|--------|-----|
| SaaS/Core API | **NestJS (Node + TypeScript)** | Structured, modular, shares types with FE; strong for CRUD/auth/workflow |
| CAD/AI API + workers | **FastAPI (Python)** | The geometry + ML ecosystem lives in Python |
| API style | **REST (OpenAPI)** primary; **GraphQL** optional for dashboards | REST is simplest to build/secure; GraphQL helps complex reads later |
| Background jobs | **Celery** or **RQ** + Redis broker | Mature Python task queues for the pipeline |
| Validation | **Zod** (TS) / **Pydantic** (Py) | End-to-end typed contracts |

## CAD / Drawing processing (Python)
| Need | Library/Tool |
|------|--------------|
| DXF read/write | **ezdxf** |
| DWG → DXF | **ODA File Converter** / **Teigha** (LibreDWG as OSS fallback) |
| Vector PDF | **PyMuPDF (fitz)**, **pdfplumber** |
| Raster/scan OCR | **PaddleOCR** (primary), **Tesseract** (fallback) |
| Table/schedule extraction | **Camelot**, **pdfplumber**, layout models (e.g., LayoutLMv3) |
| Geometry ops | **Shapely**, **PostGIS**, **NumPy** |
| Image processing | **OpenCV** |
| Raster tiling | **libvips / pyvips**, **gdal2tiles** |

## AI / ML
| Need | Choice |
|------|--------|
| LLM reasoning/orchestration | **Claude `claude-opus-4-8`** (complex interpretation, reconciliation, audit narration) |
| Cheap/bulk classification | **Claude `claude-haiku-4-5`** |
| Symbol/element detection | **YOLOv8/RT-DETR** style detector, fine-tuned on construction symbols |
| Room/space segmentation | Segmentation model (e.g., U-Net/Mask2Former) + geometric wall-graph method |
| Embeddings | Sentence/vision embeddings for symbol & spec retrieval |
| Vector store | **pgvector** (start) → managed vector DB if needed |
| Orchestration | LLM tool-use / agent framework (e.g., Claude tool use, LangGraph optional) |
| Eval | Custom eval harness + labeled drawing set; tracked per release |

> Default to the latest, most capable Claude models for AI features; tier by cost/latency.

## Data & infrastructure
| Concern | Choice |
|---------|--------|
| Primary DB | **PostgreSQL + PostGIS** |
| Cache/queue/pubsub | **Redis** |
| Object storage | **S3** (or S3-compatible: GCS/MinIO) |
| CDN | CloudFront / Cloudflare (tiles, exports, static) |
| Search (later) | OpenSearch/Elasticsearch for full-text |
| Auth | **Auth0 / Clerk / Keycloak** (OIDC + SSO/SAML) |
| Containerization | **Docker** |
| Orchestration | **Kubernetes** (EKS/GKE/AKS) or managed PaaS early |
| IaC | **Terraform** |
| CI/CD | **GitHub Actions** |
| Observability | **OpenTelemetry**, **Prometheus + Grafana**, **Sentry** |
| Billing | **Stripe** |
| Email/notify | **Postmark/SendGrid** |

## Exports
| Format | Tooling |
|--------|---------|
| Excel | **openpyxl** / **xlsxwriter** (templated) |
| PDF report | **WeasyPrint** (HTML→PDF) or **ReportLab**; or headless Chromium for pixel-perfect branded reports |
| BOQ | Templated Excel/CSV mapped to standard BOQ schemas |

## Rationale highlights
- **Two-language split (TS + Python)** is deliberate: TypeScript for the product surface
  (shared types, fast iteration, hiring), Python where geometry/ML libraries are unmatched.
  The boundary is the job queue + a typed internal API.
- **PostGIS** avoids reinventing geometric measurement (area, length, overlap, deduction).
- **shadcn/ui + Tailwind** delivers the premium, consistent look without a heavyweight UI library lock-in.
- **Claude tiering** controls cost while keeping high quality where it matters.

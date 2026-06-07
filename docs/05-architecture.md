# 05 — Technical Architecture

## 1. Architectural principles
- **Separation of concerns:** the SaaS API (CRUD, auth, billing, workflow) is distinct
  from the compute-heavy **CAD/AI pipeline** (parsing, vision, LLM).
- **Async by default:** anything slow (conversion, parsing, ML, export) runs as a queued,
  resumable, idempotent job with progress reporting.
- **Provenance everywhere:** every derived value stores its inputs and method.
- **Multi-tenant isolation:** tenant ID scoping on every row + per-tenant storage prefixes.
- **Stateless services, durable state:** services scale horizontally; state lives in
  Postgres, object storage, and Redis.

## 2. High-level system diagram

```
                         ┌──────────────────────────────────────────┐
                         │                Clients                     │
                         │  Web app (Next.js)   ·  future Mobile      │
                         └───────────────┬──────────────────────────┘
                                         │ HTTPS / WSS
                                  ┌──────▼───────┐
                                  │  API Gateway  │  auth, rate-limit, routing
                                  └──────┬───────┘
              ┌──────────────────────────┼───────────────────────────┐
              │                          │                            │
       ┌──────▼───────┐          ┌───────▼────────┐           ┌───────▼────────┐
       │  Core API     │          │  CAD/AI API     │           │  Realtime/WS    │
       │ (NestJS/Node) │          │  (FastAPI/Py)   │           │  (presence,     │
       │ projects,     │          │ ingestion,      │           │  job progress)  │
       │ estimates,    │          │ parse, takeoff, │           └────────────────┘
       │ rates, RBAC,  │          │ AI orchestration│
       │ exports meta  │          └───────┬────────┘
       └──────┬───────┘                   │ enqueue
              │                    ┌───────▼────────────────────────────┐
              │                    │           Job Queue (Redis/RQ        │
              │                    │           or Celery + broker)        │
              │                    └───────┬─────────┬─────────┬─────────┘
              │                            │         │         │
              │                   ┌────────▼──┐ ┌────▼─────┐ ┌─▼──────────┐
              │                   │ Convert   │ │ Parse     │ │ ML/Vision  │
              │                   │ worker    │ │ worker    │ │ worker     │
              │                   │ (DWG→DXF, │ │ (DXF/PDF/ │ │ (detect,   │
              │                   │  OCR prep)│ │  OCR,     │ │  classify, │
              │                   └────┬──────┘ │  schedule)│ │  LLM calls)│
              │                        │        └────┬──────┘ └────┬───────┘
              │                        │             │             │
              │                   ┌────▼─────────────▼─────────────▼────┐
              │                   │        Takeoff / Estimation engine    │
              │                   └────────────────┬─────────────────────┘
              │                                     │
   ┌──────────▼───────────┐   ┌──────────────┐ ┌───▼───────────┐ ┌──────────────┐
   │ Postgres + PostGIS    │   │ Object store  │ │ Vector DB     │ │ LLM provider │
   │ (relational + geom)   │   │ (S3: files,   │ │ (embeddings:  │ │ (Claude:     │
   │                       │   │  tiles,       │ │  symbols,     │ │  opus/haiku) │
   │                       │   │  exports)     │ │  specs)       │ │              │
   └───────────────────────┘   └──────────────┘ └───────────────┘ └──────────────┘
```

## 3. Services

### 3.1 Core API (NestJS / TypeScript)
Owns the business/SaaS surface: auth & RBAC, organizations/projects/teams, drawing
register metadata, takeoff items (CRUD + corrections), rate libraries, estimates &
revisions, export requests, comments, notifications, audit log, billing. Talks to
Postgres; emits jobs to the queue for compute work; serves the realtime channel.

### 3.2 CAD/AI API + workers (FastAPI / Python)
Python is the right home for the geometry + ML ecosystem. Responsibilities:
- **Ingestion/convert worker:** DWG→DXF (ODA/Teigha), PDF type detection, page split, OCR prep, tiling for the viewer.
- **Parse worker:** DXF geometry/layers/blocks/text; vector-PDF extraction; OCR; schedule/legend/title-block table extraction → canonical drawing model.
- **ML/Vision worker:** room segmentation, symbol/element detection, classification, embedding generation, LLM orchestration for interpretation & reconciliation.
- **Takeoff/estimation engine:** deterministic measurement math + rules + assemblies, producing quantities with audit trails.

These are separate worker types so each scales independently (GPU for vision, CPU for parse).

### 3.3 Realtime service
WebSocket channel for job-progress updates, presence, and collaborative review.

### 3.4 Export service
Renders Excel (templated), PDF (branded), and BOQ outputs from estimate snapshots; writes to object storage.

## 4. Data stores
- **Postgres + PostGIS** — relational data plus geometry (room polygons, element geometry, measurement regions). PostGIS gives robust area/length/overlap operations.
- **Object storage (S3-compatible)** — original files, converted DXF, rendered tiles, thumbnails, exports. Per-tenant prefixes; lifecycle policies.
- **Redis** — job queue/broker, caching, rate limiting, realtime pub/sub.
- **Vector DB** (pgvector or a managed vector store) — embeddings for symbol matching, spec/schedule semantic search, and similar-element retrieval.

## 5. Data flow (happy path)
1. Client uploads → Core API issues a presigned URL → file lands in object storage.
2. Core API records the file + enqueues a `convert` job.
3. Convert → Parse → ML/Vision → Takeoff jobs run in sequence (with fan-out per sheet), each writing structured results to Postgres and artifacts to object storage, emitting progress over WS.
4. Takeoff items appear in the UI with confidence; estimator reviews via Core API.
5. On pricing, Core API snapshots the rate library and computes the estimate.
6. Export service renders deliverables on demand.

## 6. Cross-cutting concerns
- **AuthN/Z:** OAuth2/OIDC + SSO; JWT access tokens; RBAC enforced at API and row level (tenant scoping). See [Security](14-security-permissions.md).
- **Observability:** structured logs, distributed tracing (OpenTelemetry), metrics (Prometheus/Grafana), job dashboards, ML eval dashboards.
- **Idempotency & retries:** jobs keyed by content hash + version; safe to re-run; dead-letter queue for poison jobs.
- **Feature flags & config:** per-tenant flags for gradual rollout of AI features.
- **Audit:** append-only event log for estimate/quantity/approval changes.

## 7. Deployment
- **Containers on Kubernetes** (EKS/GKE/AKS) or a managed PaaS for early stage.
- **Autoscaling worker pools:** CPU pool (parse/convert), GPU pool (vision), burstable LLM-call pool.
- **Environments:** dev → staging → prod; ephemeral preview envs per PR.
- **Object storage + CDN** for tiles/exports.
- **IaC** (Terraform) and CI/CD (GitHub Actions) with automated tests + ML eval gates.
- **Optional single-tenant/VPC deployment** for enterprise clients with strict data residency.

## 8. Scaling notes
- Parse/ML jobs are the cost center → scale workers by queue depth, not request count.
- Viewer performance via pre-tiled raster + vector simplification, served from CDN.
- Postgres read replicas for dashboards/analytics; partition large tables (takeoff_items, audit_log) by tenant/time.
- LLM cost control: route cheap classification to `claude-haiku-4-5`, reserve `claude-opus-4-8` for complex reasoning/reconciliation; cache by content hash.

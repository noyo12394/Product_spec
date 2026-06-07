# 07 — Database Schema

PostgreSQL + PostGIS. All tenant-scoped tables carry `org_id`. IDs are UUIDs.
Timestamps are `timestamptz`. Soft-delete via `deleted_at` where useful.
Geometry columns use PostGIS `geometry` types (stored in drawing/world coordinates).

## 1. Entity relationship (textual)

```
organizations 1───* users (via memberships)
organizations 1───* projects
projects      1───* drawings 1───* drawing_versions 1───* sheets
sheets        1───* parsed_layers, parsed_text, schedules, legends
sheets        1───* rooms
sheets/rooms  1───* elements (detected geometry: walls, doors, ducts...)
elements      1───* takeoff_items  (a takeoff item references its source element[s])
projects      1───* takeoff_items
takeoff_items *───1 cost_items (classification) *───* rates (via rate snapshot)
projects      1───* estimates 1───* estimate_revisions 1───* estimate_lines
estimate_revisions 1───1 rate_library_snapshots
everything    ───* audit_events
```

## 2. Core tables (illustrative DDL)

```sql
-- ===== Tenancy & identity =====
CREATE TABLE organizations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  default_units TEXT NOT NULL DEFAULT 'metric',     -- 'metric' | 'imperial'
  default_currency TEXT NOT NULL DEFAULT 'USD',
  region        TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  full_name     TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE memberships (
  org_id   UUID REFERENCES organizations(id),
  user_id  UUID REFERENCES users(id),
  role     TEXT NOT NULL,        -- owner|admin|lead_estimator|estimator|pm|reviewer|viewer
  PRIMARY KEY (org_id, user_id)
);

-- ===== Projects =====
CREATE TABLE projects (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id),
  name          TEXT NOT NULL,
  client_name   TEXT,
  location      TEXT,
  region        TEXT,                 -- drives rate region
  units         TEXT NOT NULL DEFAULT 'metric',
  currency      TEXT NOT NULL DEFAULT 'USD',
  disciplines   TEXT[] NOT NULL DEFAULT '{}', -- civil,structural,mechanical,electrical,architectural
  status        TEXT NOT NULL DEFAULT 'draft',
  due_date      DATE,
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at    TIMESTAMPTZ
);
CREATE INDEX ON projects (org_id, status);

CREATE TABLE project_members (
  project_id UUID REFERENCES projects(id),
  user_id    UUID REFERENCES users(id),
  role       TEXT NOT NULL,
  PRIMARY KEY (project_id, user_id)
);

-- ===== Drawings & versions =====
CREATE TABLE drawings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id),
  sheet_number TEXT,                 -- e.g. 'A-101'
  title        TEXT,
  discipline   TEXT,                 -- civil|structural|mechanical|electrical|architectural
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE drawing_versions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drawing_id    UUID NOT NULL REFERENCES drawings(id),
  version_no    INT NOT NULL,
  file_type     TEXT NOT NULL,       -- dwg|dxf|pdf_vector|pdf_raster|image|xlsx|docx
  storage_key   TEXT NOT NULL,       -- object storage path of original
  dxf_key       TEXT,                -- converted DXF if applicable
  page_count    INT,
  status        TEXT NOT NULL DEFAULT 'uploaded', -- uploaded|converting|parsing|interpreting|ready|error
  uploaded_by   UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (drawing_id, version_no)
);

CREATE TABLE sheets (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drawing_version_id UUID NOT NULL REFERENCES drawing_versions(id),
  page_index         INT NOT NULL,
  scale_ratio        NUMERIC,        -- e.g. 0.02 (1:50) in drawing units → world
  scale_confirmed    BOOLEAN NOT NULL DEFAULT FALSE,
  units              TEXT,           -- units detected on the sheet
  tile_key           TEXT,           -- tiled raster for the viewer
  width_px           INT,
  height_px          INT,
  discipline         TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===== Parsed primitives =====
CREATE TABLE parsed_layers (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_id  UUID NOT NULL REFERENCES sheets(id),
  name      TEXT,
  color     TEXT,
  line_type TEXT,
  meta      JSONB
);

CREATE TABLE parsed_text (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_id  UUID NOT NULL REFERENCES sheets(id),
  content   TEXT,
  geom      geometry(POINT, 0),      -- placement
  height    NUMERIC,
  rotation  NUMERIC,
  source    TEXT,                    -- dxf_text|pdf_text|ocr
  confidence NUMERIC                 -- for OCR
);

CREATE TABLE schedules (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_id  UUID NOT NULL REFERENCES sheets(id),
  kind      TEXT,                    -- door|window|room|finish|equipment|generic
  columns   JSONB,                   -- header definition
  rows      JSONB,                   -- extracted rows
  confidence NUMERIC
);

-- ===== Rooms & elements =====
CREATE TABLE rooms (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_id    UUID NOT NULL REFERENCES sheets(id),
  project_id  UUID NOT NULL REFERENCES projects(id),
  name        TEXT,
  number      TEXT,
  boundary    geometry(POLYGON, 0),  -- in world units after scale
  area        NUMERIC,
  perimeter   NUMERIC,
  height      NUMERIC,               -- ceiling height if known
  confidence  NUMERIC,
  source      TEXT,                  -- ai|manual
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE elements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_id    UUID NOT NULL REFERENCES sheets(id),
  project_id  UUID NOT NULL REFERENCES projects(id),
  room_id     UUID REFERENCES rooms(id),
  discipline  TEXT NOT NULL,
  element_type TEXT NOT NULL,        -- wall|slab|column|beam|footing|door|window|duct|pipe|fitting|light|socket|panel|fixture|hvac_unit ...
  geom        geometry(GEOMETRY, 0), -- line/polygon/point depending on type
  attributes  JSONB,                 -- thickness, diameter, rating, tag, material hint...
  confidence  NUMERIC NOT NULL,
  source      TEXT NOT NULL,         -- ai|manual|schedule
  status      TEXT NOT NULL DEFAULT 'detected', -- detected|accepted|edited|rejected
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON elements (project_id, discipline, element_type);
CREATE INDEX ON elements USING GIST (geom);

-- ===== Takeoff =====
CREATE TABLE cost_items (         -- classification taxonomy (CSI/Uniclass + custom)
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID REFERENCES organizations(id),  -- null = global
  code        TEXT,               -- e.g. CSI '03 30 00'
  name        TEXT NOT NULL,
  uom         TEXT NOT NULL,      -- m, m2, m3, ea, kg ...
  discipline  TEXT,
  parent_id   UUID REFERENCES cost_items(id)
);

CREATE TABLE takeoff_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES projects(id),
  room_id       UUID REFERENCES rooms(id),
  cost_item_id  UUID REFERENCES cost_items(id),
  discipline    TEXT NOT NULL,
  description   TEXT,
  uom           TEXT NOT NULL,
  quantity      NUMERIC NOT NULL,
  waste_pct     NUMERIC NOT NULL DEFAULT 0,
  net_quantity  NUMERIC,            -- quantity * (1 + waste_pct)
  confidence    NUMERIC,
  status        TEXT NOT NULL DEFAULT 'pending', -- pending|accepted|edited|rejected|manual
  audit         JSONB NOT NULL,     -- {source_sheet, element_ids, formula, inputs, scale, assumptions}
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON takeoff_items (project_id, discipline, status);

CREATE TABLE takeoff_item_elements (   -- M:N link item ↔ source elements
  takeoff_item_id UUID REFERENCES takeoff_items(id),
  element_id      UUID REFERENCES elements(id),
  PRIMARY KEY (takeoff_item_id, element_id)
);

-- ===== Rates =====
CREATE TABLE rate_libraries (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id    UUID NOT NULL REFERENCES organizations(id),
  name      TEXT NOT NULL,
  region    TEXT,
  currency  TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE rates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id    UUID NOT NULL REFERENCES rate_libraries(id),
  cost_item_id  UUID REFERENCES cost_items(id),
  description   TEXT NOT NULL,
  uom           TEXT NOT NULL,
  material_rate NUMERIC DEFAULT 0,
  labor_rate    NUMERIC DEFAULT 0,
  equipment_rate NUMERIC DEFAULT 0,
  sub_rate      NUMERIC DEFAULT 0,
  total_rate    NUMERIC,           -- sum or overridden
  region        TEXT,
  effective_date DATE,
  source        TEXT
);
CREATE INDEX ON rates (library_id, cost_item_id);

-- ===== Estimates =====
CREATE TABLE estimates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id),
  name        TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'draft',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE rate_library_snapshots (   -- frozen rates for reproducibility
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_revision_id UUID,
  data        JSONB NOT NULL,           -- frozen copy of relevant rates
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE estimate_revisions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id   UUID NOT NULL REFERENCES estimates(id),
  revision_no   INT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'draft', -- draft|priced|pending_approval|approved|issued
  rate_snapshot_id UUID REFERENCES rate_library_snapshots(id),
  markup_pct    NUMERIC DEFAULT 0,
  overhead_pct  NUMERIC DEFAULT 0,
  contingency_pct NUMERIC DEFAULT 0,
  tax_pct       NUMERIC DEFAULT 0,
  subtotal      NUMERIC,
  total         NUMERIC,
  approved_by   UUID REFERENCES users(id),
  approved_at   TIMESTAMPTZ,
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (estimate_id, revision_no)
);

CREATE TABLE estimate_lines (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_revision_id UUID NOT NULL REFERENCES estimate_revisions(id),
  takeoff_item_id UUID REFERENCES takeoff_items(id),
  cost_item_id    UUID REFERENCES cost_items(id),
  description     TEXT,
  uom             TEXT,
  quantity        NUMERIC,
  unit_rate       NUMERIC,
  material_cost   NUMERIC,
  labor_cost      NUMERIC,
  equipment_cost  NUMERIC,
  sub_cost        NUMERIC,
  line_total      NUMERIC,
  room_id         UUID REFERENCES rooms(id),
  discipline      TEXT
);
CREATE INDEX ON estimate_lines (estimate_revision_id, discipline);

-- ===== Exports, comments, jobs, audit =====
CREATE TABLE exports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id),
  estimate_revision_id UUID REFERENCES estimate_revisions(id),
  format      TEXT NOT NULL,        -- xlsx|pdf|boq
  scope       JSONB,                -- discipline/room/division filters
  storage_key TEXT,
  status      TEXT NOT NULL DEFAULT 'queued',
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL,
  entity_type TEXT NOT NULL,        -- takeoff_item|element|sheet|room|estimate
  entity_id   UUID NOT NULL,
  body        TEXT NOT NULL,
  resolved    BOOLEAN NOT NULL DEFAULT FALSE,
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE jobs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID,
  kind        TEXT NOT NULL,        -- convert|parse|interpret|takeoff|export
  ref_id      UUID,                 -- drawing_version/sheet/estimate id
  status      TEXT NOT NULL DEFAULT 'queued', -- queued|running|done|error
  progress    INT DEFAULT 0,
  error       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_events (         -- append-only
  id          BIGSERIAL PRIMARY KEY,
  org_id      UUID NOT NULL,
  actor_id    UUID,                 -- null for system
  action      TEXT NOT NULL,        -- e.g. takeoff_item.edited, estimate.approved
  entity_type TEXT NOT NULL,
  entity_id   UUID,
  before      JSONB,
  after       JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON audit_events (org_id, entity_type, entity_id, created_at);
```

## 3. Notes
- **PostGIS geometry** stores room/element shapes; `scale_ratio` converts drawing→world units so area/length are computed in real units (m, m²).
- **`audit` JSONB on `takeoff_items`** is the heart of explainability (see [Estimation Logic](10-estimation-measurement-logic.md) for its shape).
- **Rate snapshots** freeze pricing so historical estimates remain reproducible even as the live library changes.
- **`audit_events`** is append-only and partitioned by time for scale; never updated.
- Row-level tenant isolation: every query filters by `org_id` (enforced via app layer + optional Postgres RLS policies).

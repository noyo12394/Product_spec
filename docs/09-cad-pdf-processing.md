# 09 — CAD / PDF Processing Approach

This is the ingestion + parsing layer that turns heterogeneous files into a single
**Canonical Drawing Model (CDM)** the rest of the system reasons over.

## 1. Supported inputs & routing
```
DWG ──► ODA/Teigha convert ──► DXF ──┐
DXF ─────────────────────────────────┤──► Vector parse (ezdxf / geometry)
PDF (vector) ──► PyMuPDF/pdfplumber ─┘
PDF (raster) ──► render ──► OCR + vision ──► Raster pipeline
Image (PNG/JPG/TIFF) ─────────────────────► Raster pipeline
XLSX / CSV (BOQ) ──► tabular parse ────────► BOQ importer
DOCX / PDF (specs) ──► text + section parse ► Spec linker
```
PDF type detection: inspect for embedded vector content & extractable text; if absent or
sparse, treat as raster (scanned) and route to OCR/vision.

## 2. The Canonical Drawing Model (CDM)
A normalized, sheet-scoped representation independent of source format:
```jsonc
{
  "sheet_id": "...",
  "scale_ratio": 0.02,            // drawing units → world (1:50)
  "units": "mm",
  "bbox": [x0,y0,x1,y1],
  "layers":   [{ "name":"A-WALL", "color":"...", "line_type":"CONTINUOUS" }],
  "geometry": [                    // normalized primitives
    { "id":"g1", "kind":"polyline", "layer":"A-WALL", "points":[[..],[..]], "closed":false },
    { "id":"g2", "kind":"polygon",  "layer":"A-SLAB", "points":[...], "closed":true },
    { "id":"g3", "kind":"block_ref","name":"DOOR", "insert":[x,y], "rotation":90, "scale":1 },
    { "id":"g4", "kind":"hatch",    "layer":"A-FLOR", "boundary":[...], "pattern":"ANSI31" },
    { "id":"g5", "kind":"dimension","value":3600, "geom":[...] }
  ],
  "text": [ { "id":"t1","content":"OFFICE 204","pos":[x,y],"height":250,"source":"dxf_text","confidence":1.0 } ],
  "tables": {
    "title_block": { "project":"...", "sheet_no":"A-101", "scale":"1:50", "rev":"C" },
    "schedules": [ { "kind":"door", "columns":[...], "rows":[...], "confidence":0.93 } ],
    "legends":   [ { "symbol_img_ref":"...", "meaning":"Single door", "confidence":0.9 } ]
  }
}
```

## 3. Vector pipeline (DXF / vector PDF)
1. **Geometry extraction** (`ezdxf` for DXF; PyMuPDF for vector PDF): lines, polylines,
   arcs, circles, splines, hatches, dimensions, block references (`INSERT`), and their layers.
2. **Layer & block harvest:** names, colors, line types; block definitions and instance counts.
3. **Text extraction:** `TEXT`/`MTEXT` entities (DXF) or text spans (PDF) with placement.
4. **Table/schedule extraction:** detect tabular regions (grid lines + aligned text) → reconstruct rows/columns (Camelot/pdfplumber + heuristics; LayoutLM for hard cases).
5. **Title-block parse:** locate the title block (corner region, known layout) → sheet no, title, scale, revision, discipline.

Vector data is the gold source: dimensions give true lengths; block instances give exact
counts; closed polylines give exact areas.

## 4. Raster pipeline (scans / images / raster PDF)
1. **Pre-processing (OpenCV):** deskew, denoise, contrast normalize, binarize, dewarp.
2. **Tiling:** generate pyramid tiles (pyvips/gdal2tiles) for the viewer and for detection.
3. **OCR (PaddleOCR primary, Tesseract fallback):** text + positions + per-token confidence; specialized passes for rotated text and small annotations.
4. **Line/vector recovery:** Hough/contour-based line detection to approximate walls/edges for measurement (lower confidence than true vectors).
5. **Symbol detection:** the vision detector over tiles → element candidates.
6. **Table detection:** detect schedule grids visually → OCR cells → reconstruct tables.

Raster results carry explicit lower confidence and route more items to human review.

## 5. Scale & calibration (critical)
Wrong scale invalidates every measurement, so this is an explicit, confirmable step.
Detection strategies, in priority order:
1. **Title block scale text** ("1:50", "1/4\" = 1'-0\"") → parse to ratio.
2. **DXF units + model extents** (if drawing is in real units, scale is implicit/known).
3. **Scale bar** detection (vision) → measure pixels per unit.
4. **Known dimension** anchoring: read a dimension annotation, match to its geometry length, derive px/unit.
5. **Manual calibration:** user draws a line on a known dimension and types the real value.

The derived `scale_ratio` + `units` are stored on the sheet and **must be confirmed by the
user** (`scale_confirmed = true`) before takeoff runs. Imperial/metric handled throughout.

## 6. BOQ & spec ingestion
- **BOQ (XLSX/CSV):** map columns (item code, description, unit, qty, rate) via a guided
  mapper; import as reference quantities or seed takeoff items; reconcile against AI takeoff.
- **Specs (DOCX/PDF):** section-split (CSI/Uniclass), extract material/finish requirements,
  embed for retrieval; link spec sections to cost items/assemblies (V1+).

## 7. Coordinate & unit handling
- All geometry stored in **world units** after applying `scale_ratio`; original drawing
  coordinates retained for viewer overlay alignment.
- Measurements computed in PostGIS using world-unit geometry, then formatted per project
  units (metric/imperial) and currency.

## 8. Performance & reliability
- Each stage is an idempotent, resumable job keyed by file content hash + version.
- Large files chunked by sheet/page; fan-out parallelizes per sheet.
- Converted DXF, tiles, and OCR results cached in object storage to avoid re-compute.
- Poison files routed to a dead-letter queue with actionable error messages to the user.

## 9. Output contract
The parsing layer's deliverable is a validated CDM per sheet, plus stored artifacts
(DXF, tiles, OCR JSON). The AI layer ([08](08-ai-ml-architecture.md)) and takeoff engine
([10](10-estimation-measurement-logic.md)) consume only the CDM, keeping them
source-format agnostic.

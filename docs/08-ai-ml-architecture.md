# 08 — AI/ML Architecture for Drawing Interpretation

## 1. Design philosophy
Drawing interpretation is a **hybrid** problem: deterministic geometry/parsing where
possible, ML where pattern recognition is needed, and an LLM for reasoning,
reconciliation, and explanation. Crucially, **the system never asserts a quantity
without a confidence score and an audit trail**, and **a human reviews before pricing**.

We treat the LLM as a *reasoner over structured evidence*, not as a pixel reader of last
resort. Wherever a vector path or a parsed schedule already gives us ground truth, we use
it and feed it to the LLM as context — reducing hallucination and cost.

## 2. The interpretation pipeline

```
            ┌──────────────────────────────────────────────────────────┐
            │  Stage 0: Normalization (deterministic)                    │
            │  DWG→DXF, PDF vector/raster split, page→sheet, tiling      │
            └───────────────┬──────────────────────────────────────────┘
                            ▼
   ┌────────────────────────────────────────────────────────────────────┐
   │  Stage 1: Structured extraction (deterministic + OCR)               │
   │  • Vector: layers, blocks, lines, polylines, hatches, dimensions    │
   │  • Text:  DXF text / PDF text / OCR (raster)                         │
   │  • Tables: schedules, legends, title block                          │
   │  → Canonical Drawing Model (CDM)                                    │
   └───────────────┬───────────────────────────────────────────────────┘
                   ▼
   ┌────────────────────────────────────────────────────────────────────┐
   │  Stage 2: Scale & coordinate calibration                            │
   │  scale bar / title block / known dim / user confirm → world units   │
   └───────────────┬───────────────────────────────────────────────────┘
                   ▼
   ┌────────────────────────────────────────────────────────────────────┐
   │  Stage 3: Spatial structure                                         │
   │  • Wall-graph + region growing → room polygons                      │
   │  • Match room labels (text-in-polygon) → room names/numbers         │
   └───────────────┬───────────────────────────────────────────────────┘
                   ▼
   ┌────────────────────────────────────────────────────────────────────┐
   │  Stage 4: Element detection & classification                        │
   │  • Vector-first: layer/block name heuristics + geometry rules       │
   │  • Vision detector (YOLO/RT-DETR) for symbols (raster + vector raster│
   │    render) → doors, windows, fixtures, lights, sockets, HVAC, etc.  │
   │  • Embedding match against legend/symbol library                    │
   └───────────────┬───────────────────────────────────────────────────┘
                   ▼
   ┌────────────────────────────────────────────────────────────────────┐
   │  Stage 5: LLM reasoning & reconciliation (Claude)                   │
   │  • Reconcile detected counts vs. schedules/legends                  │
   │  • Resolve ambiguous symbols/labels using context                   │
   │  • Assign discipline & cost-item classification                     │
   │  • Generate per-quantity audit narrative + assumptions              │
   │  • Emit confidence + "needs review" flags                           │
   └───────────────┬───────────────────────────────────────────────────┘
                   ▼
   ┌────────────────────────────────────────────────────────────────────┐
   │  Stage 6: Confidence fusion & handoff to takeoff engine             │
   └────────────────────────────────────────────────────────────────────┘
```

## 3. Component models

### 3.1 Vector-first heuristics (highest trust, cheapest)
When DXF/vector PDF is available, layers and block names are strong signals:
- Layer `A-WALL` / `WALL` → wall candidates; closed polylines on `A-SLAB` → slabs.
- Inserted blocks named `DOOR`, `WIN`, `RECEP`, `LIGHT` → counts by block reference.
- Dimensions and explicit text give true lengths.
These produce high base confidence and are the backbone for clean CAD sets.

### 3.2 Room/space segmentation
Two complementary methods, fused:
1. **Geometric:** build a graph of wall segments → detect enclosed cycles → polygonize → rooms (robust on clean vector).
2. **Vision segmentation:** a segmentation model on the rendered raster for messy/scanned plans.
Room **labels** come from text whose placement falls inside a polygon; the LLM disambiguates ("OFFICE 204" → name=Office, number=204).

### 3.3 Symbol/element detector
A fine-tuned object detector (YOLOv8/RT-DETR family) trained on a labeled corpus of
construction symbols across disciplines. Runs on rendered tiles. Outputs bounding boxes +
class + score. Vector evidence, when present, overrides/boosts detector scores.

### 3.4 Embedding-based symbol matching
Each legend entry is embedded; unknown symbols are embedded and matched to the legend via
the vector store. This lets the system adapt to firm-specific symbology without retraining.

### 3.5 LLM reasoner (Claude)
- **Model tiering:** `claude-haiku-4-5` for high-volume, low-complexity classification
  (e.g., "is this text a room label?"); `claude-opus-4-8` for reconciliation, ambiguous
  cross-references, discipline/cost classification, and audit narration.
- **Tool use:** the LLM is given tools to query the CDM (e.g., `get_schedule(kind)`,
  `count_elements(type)`, `get_legend()`), so it reasons over *retrieved facts*, not guesses.
- **Structured output:** the LLM returns JSON conforming to a schema (element/quantity +
  confidence + audit). See [Prompting Strategy](13-ai-prompting-strategy.md).

## 4. Confidence model
Final confidence per element/quantity is a **fusion** of signals (weighted, calibrated):

```
confidence = f(
   source_trust,        # vector/schedule (high) > detector (medium) > OCR-only (lower)
   detector_score,      # vision model probability
   schedule_agreement,  # detected count vs. schedule count
   scale_certainty,     # confirmed scale vs. inferred
   ocr_quality,         # text recognition confidence (raster)
   geometry_validity,   # closed polygon? plausible dimensions?
   cross_sheet_support  # corroborated elsewhere (V2)
)
```
Bands surfaced in UI:
- **High (≥ 0.85)** — green; auto-accept candidate (still reviewable).
- **Medium (0.6–0.85)** — amber; review recommended.
- **Low (< 0.6)** — red; review required, surfaced first in the queue.

Confidence is **calibrated** against the labeled eval set so "0.8" is meaningful.

## 5. Reconciliation logic (key differentiator)
The system cross-checks independent evidence sources and raises flags on disagreement:
- Detected door count vs. **door schedule** count.
- Room areas vs. **room schedule** areas.
- Fixture counts vs. **equipment schedule**.
- Symbol classes vs. **legend** definitions.
Discrepancies become explicit review items ("Detected 18 doors; door schedule lists 20 →
2 may be missed"), which is exactly where estimators add the most value.

## 6. Human-in-the-loop & continuous learning
- Every correction (accept/edit/reject/reclassify) is captured as **labeled feedback**.
- A feedback pipeline aggregates corrections to: (a) retrain/fine-tune the detector,
  (b) refine per-org symbol/layer mapping profiles, (c) recalibrate confidence,
  (d) build few-shot examples for the LLM prompts.
- An **eval harness** with a held-out labeled drawing set gates every model release
  (recall/precision per element type, confidence calibration, regression checks).

## 7. Guardrails
- LLM is constrained to JSON schema; outputs failing validation are rejected/retried.
- The LLM **may not invent quantities**; numeric quantities come from the deterministic
  takeoff engine over geometry — the LLM classifies, reconciles, and explains.
- Low-confidence or unreconciled items can never be auto-priced; they block on review.
- All AI outputs are versioned with model id + prompt version for reproducibility/audit.

## 8. Failure modes & fallbacks
| Situation | Fallback |
|-----------|----------|
| DWG conversion fails | Try raster pipeline on a rendered PDF/image |
| No vector data (scan) | OCR + vision detector; lower base confidence; more review |
| Unknown symbology | Embedding match to legend; if none, flag "unclassified" for human |
| Scale undetectable | Force manual scale calibration before any measurement |
| Schedule unreadable | Skip reconciliation; rely on geometry; flag lower confidence |

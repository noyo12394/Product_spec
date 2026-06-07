# 19 — Worked Examples

Concrete artifacts to make the spec tangible: sample data, an estimate output, and a full
user journey from upload to final price.

---

## 1. Example: detected elements → takeoff items

A small architectural room ("Office 204", 1:50 plan), after parsing + interpretation:

**Rooms**
| id | name | number | area (m²) | perimeter (m) | height (m) | confidence |
|----|------|--------|-----------|---------------|-----------|-----------|
| room_204 | Office | 204 | 18.20 | 17.60 | 3.00 | 0.95 |

**Elements (sample)**
| id | type | discipline | attributes | confidence | source |
|----|------|------------|-----------|-----------|--------|
| el_301 | wall | architectural | type=P1, len=5.2m | 0.90 | vector |
| el_302 | wall | architectural | type=P1, len=3.6m | 0.90 | vector |
| el_310 | door | architectural | type=D1, w=0.9m | 0.97 | block+schedule |
| el_320 | window | architectural | type=W2, w=1.5m | 0.93 | block+schedule |
| el_330 | light | electrical | 2x4 troffer | 0.82 | symbol |

## 2. Example: takeoff table (room-wise, Office 204)

| Cost item | Code | Qty | Unit | Waste | Net qty | Confidence | Status |
|-----------|------|-----|------|------|---------|-----------|--------|
| Partition wall P1 (area) | 09 21 16 | 52.80 | m² | 5% | 55.44 | 0.90 | accepted |
| Gypsum board (2 layers) | 09 29 00 | 105.60 | m² | 5% | 110.88 | 0.90 | accepted |
| Paint (2 coats) | 09 91 23 | 105.60 | m² | 8% | 114.05 | 0.88 | accepted |
| Floor finish — carpet | 09 68 00 | 18.20 | m² | 10% | 20.02 | 0.95 | accepted |
| Suspended ceiling | 09 51 00 | 18.20 | m² | 5% | 19.11 | 0.91 | edited |
| Door D1 | 08 11 00 | 1 | ea | 0% | 1 | 0.97 | accepted |
| Window W2 | 08 51 00 | 1 | ea | 0% | 1 | 0.93 | accepted |
| Light fixture 2x4 | 26 51 00 | 2 | ea | 0% | 2 | 0.82 | needs review |

*Wall area = (5.2+3.6+...) length × 3.0 height − door/window openings; carpet = room area.*

## 3. Example: audit trail (Paint area line)

```jsonc
{
  "quantity": 105.60, "uom": "m2",
  "method": "wall_area_minus_openings",
  "inputs": {
    "wall_run_m": 17.60, "wall_height_m": 3.00,
    "gross_area_m2": 52.80,
    "openings_deducted_m2": { "door_D1": 1.89, "window_W2": 1.95 },
    "faces": 2, "coats_factor": 1.0
  },
  "formula": "((17.60 * 3.00) - 1.89 - 1.95) * 2 faces = 97.92 ... (per actual geometry) ",
  "source": { "sheet": "A-101", "room": "204", "element_ids": ["el_301","el_302"],
              "scale_ratio": 0.02, "scale_confirmed": true },
  "reconciliation": { "schedule": "finish_schedule", "status": "match" },
  "confidence": 0.88,
  "assumptions": ["Ceiling height 3.0 m from room schedule", "Both wall faces painted"],
  "model": { "interpreter": "claude-opus-4-8", "prompt_version": "interp-v3" }
}
```

## 4. Example: final estimate output (project roll-up)

**Riverside Office Fit-out — Estimate Rev 3 (Approved)** · Region US-CA · USD

| Division | Description | Amount |
|----------|-------------|-------:|
| 03 — Concrete | Slabs, footings, columns | $312,400 |
| 08 — Openings | Doors, windows, glazing | $186,900 |
| 09 — Finishes | Partitions, paint, flooring, ceilings | $742,300 |
| 23 — HVAC | Ductwork, equipment | $498,100 |
| 26 — Electrical | Lighting, power, panels | $415,600 |
| 22 — Plumbing | Fixtures, piping | $221,300 |
| ... | ... | ... |
| **Direct cost** | | **$3,420,000** |
| Overhead (8%) | | $273,600 |
| Markup / profit (12%) | | $443,232 |
| Contingency (5%) | | $206,842 |
| Tax | | — |
| **ESTIMATE TOTAL** | | **$4,343,674** |

**Confidence summary:** 92% of value from high-confidence items, 6% medium, 2% low (all reviewed).

### Excel export (sheet structure)
- `Summary` — totals, markups, confidence summary, cost-by-discipline chart.
- `BOQ` — full line items grouped by division (code, description, qty, unit, rate, total).
- `By Room` — room-wise cost breakdown.
- `Audit Appendix` — derivation of major quantities + assumptions list.

### PDF report (sections)
Cover → Executive summary → Cost by discipline (chart) → Detailed BOQ → Room-wise summary →
Assumptions & audit appendix → Branded header/footer.

## 5. Example: full user journey (upload → final price)

> **Maria (estimator)** prices the Riverside Office Fit-out.

1. **Create project** — Maria creates "Riverside Office Fit-out", region US-CA, units imperial→she sets metric, currency USD, disciplines: Architectural + Structural + MEP, due 2026-07-15.
2. **Upload** — drags a 38-sheet zip (DXF + vector PDFs). Files queue; each shows
   Converting → Parsing → Interpreting → Takeoff with live progress.
3. **Confirm scale** — for 3 sheets the system isn't sure of scale; Maria confirms "1:50"
   on two and calibrates the third by clicking a 3600mm dimension. ✅
4. **Review interpretation** — opens A-101. The viewer shows rooms (green polygons), doors
   (pins), walls (blue lines), all colored by confidence. The side panel lists takeoff rows.
5. **Reconciliation flag** — a banner: "Door schedule lists 20; detected 18 — 2 may be
   missed." Maria zooms to the flagged grid area, finds 2 doors on a low-contrast layer,
   adds them manually. Reconciliation turns green.
6. **Bulk accept** — she filters confidence ≥ 0.85, reviews a sample, and bulk-accepts 412
   architectural items. She hand-reviews the ~60 amber/red items, fixing a mis-classified
   "window" that was actually a louver (reclassify) and splitting one wall row across two rooms.
7. **Room-wise check** — on the Rooms tab she spots a room with no floor finish; the room had
   an unlabeled finish — she adds it. Cross-check passes (Σ room areas ≈ floor area).
8. **Apply rates** — selects the "US-CA 2026 Q2" rate library; the estimate builder prices
   all lines, freezing a rate snapshot. She sets overhead 8%, markup 12%, contingency 5%.
9. **Estimate** — total lands at **$4,343,674**; confidence summary shows 92% high-confidence.
   She creates Rev 3 after a value-engineering swap (carpet → LVT) and compares revisions.
10. **Approval** — submits for approval; **David (lead)** reviews the diff vs. Rev 2 and the
    audit appendix, then approves — Rev 3 locks.
11. **Export** — Maria exports Excel (BOQ + by-room + audit appendix) and a branded PDF.
    Both land in the Export Center with shareable links. She sends the client the PDF.

**Outcome:** what used to take ~2 weeks of manual takeoff took under a day, every number is
traceable to a sheet and a formula, and the lead approved with confidence.

---

## 6. Example: API call sequence for that journey
```
POST /projects                              → proj_1
POST /projects/proj_1/uploads:initiate      → presigned URL (×38)
POST /projects/proj_1/uploads:complete      → 202 jobs queued
WS   project:proj_1                          → job.progress / job.done events
POST /sheets/sheet_3/scale:confirm          → scaleConfirmed
POST /projects/proj_1/takeoff:run           → 202
GET  /projects/proj_1/takeoff?confidenceGte=0.85
POST /takeoff-items:bulk {action:accept}    → affected:412
POST /takeoff-items {manual door D3}        → ti_new
POST /projects/proj_1/estimates             → est_1
POST /estimates/est_1/revisions             → rev_3
POST /estimate-revisions/rev_3:price        → 202 → totals
POST /estimate-revisions/rev_3:submit       → pending_approval
POST /estimate-revisions/rev_3:approve      → approved (David)
POST /estimate-revisions/rev_3/exports {pdf}, {xlsx}, {boq}
```

# 10 — Estimation & Measurement Logic

The takeoff engine is **deterministic**. It consumes detected/confirmed geometry (the CDM
+ elements) and produces quantities with full audit trails. AI classifies and reconciles;
**math is done by code**, not the LLM — this keeps numbers reproducible and defensible.

## 1. Measurement primitives

All geometry is in world units (after scale calibration). Core operations (via PostGIS / Shapely):

| Quantity | Method | Typical elements |
|----------|--------|------------------|
| **Count (ea)** | count of block refs / detected symbols of a type | doors, windows, fixtures, lights, sockets, columns |
| **Length (m / ft)** | sum of polyline/centerline lengths | walls (run), pipes, ducts, conduit, beams, kerbs |
| **Area (m² / ft²)** | polygon area (with holes/openings deducted) | slabs, floors, ceilings, wall faces, paint, finishes |
| **Volume (m³ / ft³)** | area × thickness/height | concrete (slab, footing, column, beam), excavation |
| **Weight (kg / lb)** | length × unit mass (profile) or volume × density | rebar, steel sections |

## 2. Discipline-specific logic (examples)

### Architectural
- **Wall area** = wall length × height − Σ(opening areas) for doors/windows in that wall.
- **Floor/ceiling area** = room polygon area (ceiling may add soffits).
- **Skirting/cornice length** = room perimeter − door widths.
- **Paint area** = wall area (× coats factor) ± reveals.
- **Doors/windows** = counts by type from blocks/schedule (reconciled).

### Structural
- **Slab volume** = slab polygon area × thickness.
- **Column volume** = section area × height × count.
- **Beam volume** = section area × length.
- **Footing volume** = footprint × depth.
- **Rebar (kg)** = derived from member dimensions × reinforcement ratio/schedule (V1: from bar schedules).

### Civil
- **Excavation volume** = plan area × depth (± slope/working space factor).
- **Paving area** = surface polygon area.
- **Kerb/drain length** = centerline length.

### Mechanical (HVAC) / Plumbing
- **Duct length** = centerline length by size; **duct area** = perimeter × length (for insulation/sheet).
- **Pipe length** = centerline length by diameter; **fittings** = count by type.
- **Equipment** = count from symbols/equipment schedule.

### Electrical
- **Lighting points / sockets / switches** = counts by symbol (reconciled with legend).
- **Conduit/cable length** = routed centerline length (or estimated via point-to-point + factor).
- **Panels/DBs** = count; **fixtures** = count by type.

## 3. Assemblies (V1)
An assembly maps one detected element to multiple cost items via a recipe:
```jsonc
{
  "assembly": "Partition wall type P1",
  "trigger": { "element_type": "wall", "attributes": { "type": "P1" } },
  "components": [
    { "cost_item": "Metal stud framing", "uom": "m2", "factor": 1.00 },
    { "cost_item": "Gypsum board 2 layers", "uom": "m2", "factor": 2.00 },
    { "cost_item": "Insulation", "uom": "m2", "factor": 1.00 },
    { "cost_item": "Paint (2 coats)", "uom": "m2", "factor": 2.00 }
  ]
}
```
Wall area drives all components, each with its own UOM, factor, and rate.

## 4. Waste & adjustment factors
- Per cost-item **waste %** (e.g., tile 10%, concrete 3%) configurable per org/project.
- `net_quantity = quantity × (1 + waste_pct)`.
- Optional rounding rules (e.g., round up to purchase units / lengths).

## 5. Room-wise estimation
1. Assign each element to a room via spatial containment (`ST_Within` / nearest room).
2. Roll quantities up: **element → room → discipline → project**.
3. Room-wise table shows per-room quantities and (after pricing) per-room cost — useful for
   fit-out and apples-to-apples room comparisons.
4. Elements spanning rooms (e.g., a shared wall) are split or allocated per rules.

## 6. The audit trail (explainability)
Every `takeoff_item` stores an `audit` JSON that fully reconstructs the number:
```jsonc
{
  "quantity": 42.6,
  "uom": "m2",
  "method": "wall_area_minus_openings",
  "inputs": {
    "wall_length_m": 15.2,
    "wall_height_m": 3.0,
    "openings_deducted_m2": 3.0,
    "waste_pct": 0.05
  },
  "formula": "(15.2 * 3.0) - 3.0, then * (1 + 0.05)",
  "source": { "sheet": "A-101", "element_ids": ["el_123","el_124"], "scale_ratio": 0.02, "scale_confirmed": true },
  "reconciliation": { "schedule": "door_schedule", "detected": 2, "scheduled": 2, "status": "match" },
  "confidence": 0.88,
  "assumptions": ["Ceiling height assumed 3.0 m from room schedule"],
  "model": { "interpreter": "claude-opus-4-8", "prompt_version": "interp-v3" }
}
```
This powers the "How was this calculated?" panel in review and the audit appendix in exports.

## 7. Pricing logic
```
line_total = net_quantity × unit_rate
unit_rate  = material_rate + labor_rate + equipment_rate + sub_rate   (or override)

discipline_subtotal = Σ line_totals (by discipline)
direct_cost         = Σ all line_totals
overhead            = direct_cost × overhead_pct
markup (profit)     = (direct_cost + overhead) × markup_pct
contingency         = (direct_cost + overhead + markup) × contingency_pct
pre_tax             = direct_cost + overhead + markup + contingency
tax                 = pre_tax × tax_pct
ESTIMATE TOTAL      = pre_tax + tax
```
- Rates pulled from the project's rate library, **matched by `cost_item_id`**, filtered by
  region/effective date, then **frozen as a snapshot** on the estimate revision.
- Markups/overhead/contingency/tax are revision-level (overridable per line where needed).

## 8. Confidence in pricing
- Items below the org's review threshold cannot be included in an `approved` estimate until reviewed.
- Estimate-level confidence summary (e.g., "92% of value from high-confidence items") is shown and exported.

## 9. Validation & sanity checks
- Geometry validity (closed polygons, non-zero areas, plausible thicknesses).
- Cross-discipline sanity (e.g., floor area ≈ Σ room areas within tolerance).
- Outlier detection vs. historical $/m² benchmarks (flag, don't block).
- Unit consistency enforced (no mixing m and ft in one rollup).

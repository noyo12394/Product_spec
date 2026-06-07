# 03 — Main Workflows

This document describes the primary end-to-end flows. The headline flow —
**upload to final price** — is detailed first, followed by supporting flows.

---

## W1 — Master flow: Upload → Final Priced Estimate

```
[Create Project]
      │
      ▼
[Upload drawing set]  ──►  files stored, virus-scanned, deduped
      │
      ▼
[Normalize & classify files]  DWG→DXF, PDF type-detect (vector/raster),
      │                       sheet detection, discipline guess
      ▼
[Confirm scale & disciplines]  user confirms/edits scale + which sheets
      │                        belong to Civil/Struct/Mech/Elec/Arch
      ▼
[Parse geometry + text]  layers, blocks, lines, hatches, text, schedules,
      │                  legends, title block, annotations
      ▼
[AI interpretation]  room detection, element detection/classification,
      │               schedule reconciliation, confidence scoring
      ▼
[Measurement & takeoff engine]  lengths/areas/volumes/counts, assemblies,
      │                          opening deductions, waste, room rollups
      ▼
[Confidence-scored takeoff]  every item: value + unit + confidence + audit
      │
      ▼
[ESTIMATOR REVIEW]  ◄── mandatory gate
      │   • viewer overlays linked to rows
      │   • accept / edit / split / merge / reclassify / add manual
      │   • bulk actions by confidence/discipline/sheet
      ▼
[Apply rate library]  match items → rates (region, date), markups,
      │                overhead, contingency, tax
      ▼
[Final estimate builder]  review totals, scenarios, what-ifs
      │
      ▼
[APPROVAL]  ◄── lead estimator signs off (revision locked)
      │
      ▼
[Export center]  Excel / PDF / BOQ + audit appendix
```

### Stage detail
1. **Create project** — name, client, location/region (drives rates & units), discipline scope, due date, team.
2. **Upload** — drag-drop a set or zip; progress per file; auto-grouping into the project's drawing register.
3. **Normalize** — DWG converted to DXF; PDFs classified vector vs. raster; multi-page sheets split; OCR queued for raster.
4. **Confirm scale & disciplines** — system proposes scale (title block / scale bar / known dimension) and a discipline per sheet; user confirms. Wrong scale = wrong everything, so this is an explicit gate.
5. **Parse** — extract structured geometry + text into the canonical drawing model (see [CAD/PDF Processing](09-cad-pdf-processing.md)).
6. **AI interpretation** — agents detect rooms and elements, reconcile against schedules/legends, and assign confidence (see [AI/ML Architecture](08-ai-ml-architecture.md)).
7. **Takeoff** — measurement engine computes quantities + audit trail (see [Estimation & Measurement Logic](10-estimation-measurement-logic.md)).
8. **Estimator review** — the core human-in-the-loop step. Low-confidence items are surfaced first.
9. **Pricing** — rate matching + markups produce a priced estimate.
10. **Approval** — lead estimator approves; the revision is locked and versioned.
11. **Export** — branded outputs with an audit/assumptions appendix.

---

## W2 — Drawing revision handling
When a new drawing version arrives:
1. Upload new sheet(s); system links them to the existing register entry as a new version.
2. **Diff engine** compares geometry/schedules between versions and flags added/changed/removed elements.
3. Affected takeoff rows are marked "needs re-review"; unaffected rows retain prior approval.
4. Estimator reviews only the delta; a new estimate revision is created.

## W3 — Estimate revision & scenario comparison
1. Duplicate an approved estimate to create a revision (e.g., value-engineering options).
2. Adjust quantities, rates, markups, or scope.
3. Compare revisions side-by-side (line-level deltas, total deltas, cost drivers).
4. Promote a revision to "issued."

## W4 — Rate library management
1. Admin/lead imports rates (CSV/Excel) or edits in-app.
2. Rates carry unit, currency, region, effective date, source, and category mapping.
3. Estimates reference a **snapshot** of the library at pricing time (so historical estimates stay reproducible).

## W5 — Collaboration & review
1. Estimator @-mentions a colleague or A/E on a takeoff row or drawing region.
2. Comments thread on the element; status (open/resolved) tracked.
3. A/E can flag a mis-detection; it routes back to the estimator's review queue.

## W6 — Export & client reporting
1. Choose template (firm-branded) and format (Excel / PDF / BOQ).
2. Select scope (whole project, by discipline, by room, by division).
3. Generate; system includes confidence summary + audit appendix; file lands in Export Center and is downloadable/shareable.

---

## Workflow states (estimate lifecycle)
```
draft → in_takeoff → in_review → priced → pending_approval → approved → issued
                                   │                              │
                                   └────── revision ◄─────────────┘
                          (any state) → archived
```

## Notification triggers
- Job complete (parse/AI done) → notify uploader.
- Low overall confidence on a sheet → flag for estimator.
- Revision uploaded → notify project team.
- Approval requested / granted → notify lead & PM.
- Export ready → notify requester.

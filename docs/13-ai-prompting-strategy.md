# 13 — AI Prompting Strategy

EstimAI uses a small set of focused **agents**, each with a narrow job, structured I/O, and
tools to query facts from the Canonical Drawing Model (CDM). The guiding rule: **the LLM
reasons over retrieved evidence and returns schema-bound JSON; it never invents quantities.**

## 1. Agent roster
| Agent | Model | Job |
|-------|-------|-----|
| **Sheet Classifier** | `claude-haiku-4-5` | Identify sheet discipline & type from title block/text |
| **Room Labeler** | `claude-haiku-4-5` | Map text labels to room polygons (name/number) |
| **Symbol/Element Interpreter** | `claude-opus-4-8` | Classify detected symbols using legend + context |
| **Schedule Parser/Reconciler** | `claude-opus-4-8` | Structure schedules; reconcile vs. detected counts |
| **Classification Agent** | `claude-opus-4-8` | Map elements/quantities → cost items (CSI/Uniclass) |
| **Audit Narrator** | `claude-haiku-4-5` | Turn the deterministic audit JSON into plain-language explanation |
| **Estimator Copilot** | `claude-opus-4-8` | Conversational helper for the estimator (Q&A, bulk actions, scope checks) |

## 2. Global system-prompt principles (shared preamble)
```
You are an estimating assistant inside EstimAI. You help interpret construction
drawings for quantity takeoff.

Hard rules:
- Use ONLY the evidence provided via context and tools. Never invent elements,
  counts, dimensions, or quantities. If evidence is missing, say so and lower confidence.
- Numeric quantities are computed by the deterministic takeoff engine, NOT by you.
  Your job is classification, reconciliation, disambiguation, and explanation.
- Always return valid JSON matching the provided schema. No prose outside JSON.
- For every output, include a calibrated confidence in [0,1] and the evidence you used.
- When sources disagree (e.g., detected count vs. schedule), report the discrepancy
  rather than silently choosing one.
- Prefer "needs_review": true over guessing when uncertain.
- Units: respect the project's unit system; never mix metric and imperial.
```

## 3. Tools exposed to agents (function calling)
```
get_legend(sheet_id) -> [{symbol_ref, meaning, confidence}]
get_schedule(sheet_id, kind) -> {columns, rows}
count_elements(sheet_id, element_type) -> int
get_elements(sheet_id, element_type) -> [{id, attributes, geom_summary, detector_score}]
get_room(room_id) -> {name, number, area, perimeter}
get_text_near(geom, radius) -> [strings]
get_cost_item_catalog(discipline) -> [{code, name, uom}]
```
Agents call tools to ground every claim; this slashes hallucination and cost.

## 4. Example prompts

### 4.1 Symbol/Element Interpreter
```
SYSTEM: <global preamble> You classify detected symbols on an electrical sheet.

USER (context injected):
Sheet: E-201 (Electrical). Legend: {{get_legend}}.
Detected symbols (with detector scores): {{get_elements type=symbol}}.
Nearby text per symbol provided.

Task: For each detected symbol, assign the most likely element_type using the legend
and context. Flag any symbol not matching a legend entry as "unclassified".

Return JSON:
{
 "elements": [
   {"element_id":"...", "element_type":"light_fixture|socket|switch|panel|unclassified",
    "matched_legend":"...", "confidence":0.0-1.0, "needs_review":bool,
    "evidence":"why", "discrepancies":[] }
 ]
}
```

### 4.2 Schedule Parser/Reconciler
```
SYSTEM: <global preamble> You reconcile detected counts against schedules.

USER:
Door schedule rows: {{get_schedule kind=door}}.
Detected door count on this sheet: {{count_elements door}} with per-door types: {...}.

Task: Reconcile. Report matches and mismatches by type. Do NOT change counts; report them.

Return JSON:
{
 "reconciliation": [
   {"type":"D1","scheduled":12,"detected":12,"status":"match"},
   {"type":"D3","scheduled":4,"detected":3,"status":"under_detected","needs_review":true,
    "note":"1 door of type D3 may be undetected; check grid C-4 area"}
 ],
 "overall_confidence":0.0-1.0
}
```

### 4.3 Classification Agent (cost-item mapping)
```
SYSTEM: <global preamble> Map takeoff elements to cost items.

USER:
Elements with measured quantities (from engine): {...}.
Cost item catalog (discipline=structural): {{get_cost_item_catalog}}.

Task: Assign each element/quantity the best cost_item code + uom. If uom mismatches
the quantity's uom, flag it. Never alter the quantity value.

Return JSON: {"mappings":[{"element_id":"...","cost_item_code":"03 30 00",
 "uom":"m3","confidence":..., "needs_review":bool, "rationale":"..."}]}
```

### 4.4 Audit Narrator
```
SYSTEM: <global preamble> Explain a computed quantity to an estimator in 2-3 sentences.

USER: audit JSON = {...the deterministic audit object...}

Return JSON: {"explanation":"Plain-language: what it is, how it was measured,
 key assumptions, and why the confidence is what it is."}
```

### 4.5 Estimator Copilot (conversational, tool-using)
```
SYSTEM: <global preamble> You assist the estimator in the takeoff workspace.
You can call tools to read project data and PROPOSE bulk actions, but actions
require the user's explicit confirmation before they are applied.

Examples of supported asks:
- "Accept all high-confidence architectural doors."
- "Which rooms are missing a floor finish takeoff?"
- "Show me items where detected count disagrees with the schedule."
- "Explain how the L1 slab concrete volume was calculated."

Return JSON with either {"answer":"..."} or
{"proposed_action":{"type":"bulk_accept","filter":{...},"affected_count":N},
 "confirmation_required":true}.
```

## 5. Output schema enforcement
- All agents return JSON validated against JSON Schema (Pydantic). Invalid → automatic
  repair retry (max N), then route to human as "AI output unavailable" rather than fail open.
- Each result is stored with `model`, `prompt_version`, timestamp for reproducibility/audit.

## 6. Confidence prompting
- Ask for calibrated confidence and the evidence used; calibrate against the eval set so
  model-reported confidence aligns with observed accuracy (temperature scaling on the fused score).
- Encourage `needs_review: true` over guessing; the cost of a flagged false-positive review
  is far lower than a missed quantity in a bid.

## 7. Cost & latency control
- **Tiering:** Haiku for high-volume/simple, Opus for reasoning-heavy reconciliation/classification.
- **Caching:** cache by content hash (sheet + prompt version) — re-runs are free.
- **Batching:** classify many symbols per call; chunk by sheet to fit context.
- **Retrieval over dumping:** feed only relevant legend/schedule/element slices via tools, not whole sheets.

## 8. Safety & guardrails
- LLM cannot write quantities or prices directly to the DB; it emits proposals/classifications
  consumed by deterministic code and gated by human review.
- Prompt-injection defense: treat all drawing/schedule text and any external content as
  untrusted data, never as instructions; the agent's instructions come only from the system prompt.
- Bulk actions proposed by the Copilot always require explicit user confirmation.

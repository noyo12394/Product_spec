# 17 — API Endpoints

REST (OpenAPI) primary surface. All routes are tenant-scoped via the authenticated user's
`org_id`; project routes additionally check project membership. Versioned under `/api/v1`.
JSON request/response; cursor pagination; idempotency keys on mutations.

Conventions: `200/201` success, `202` accepted (async job started), `4xx` client errors,
`401/403` auth/authz, `409` conflict (optimistic concurrency), `422` validation.

## Auth & identity
```
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
POST   /api/v1/auth/refresh
POST   /api/v1/auth/mfa/verify
GET    /api/v1/me
GET    /api/v1/orgs/:orgId/members
POST   /api/v1/orgs/:orgId/members              # invite
PATCH  /api/v1/orgs/:orgId/members/:userId      # change role
```

## Projects
```
GET    /api/v1/projects                          # list (filters: status, q, discipline)
POST   /api/v1/projects                          # create
GET    /api/v1/projects/:id
PATCH  /api/v1/projects/:id
DELETE /api/v1/projects/:id                       # soft delete
GET    /api/v1/projects/:id/overview             # metrics, pipeline status, confidence summary
POST   /api/v1/projects/:id/members
```

## Drawings & ingestion
```
POST   /api/v1/projects/:id/uploads:initiate     # -> { uploadUrl, fileId } (presigned)
POST   /api/v1/projects/:id/uploads:complete     # finalize -> enqueues convert/parse  (202)
GET    /api/v1/projects/:id/drawings             # drawing register
GET    /api/v1/drawings/:drawingId/versions
GET    /api/v1/drawing-versions/:vid
GET    /api/v1/drawing-versions/:vid/sheets
GET    /api/v1/sheets/:sheetId                    # CDM summary + status
PATCH  /api/v1/sheets/:sheetId                    # set discipline
POST   /api/v1/sheets/:sheetId/scale:confirm      # { scaleRatio, units } (required pre-takeoff)
GET    /api/v1/sheets/:sheetId/tiles/{z}/{x}/{y}  # viewer tiles (or via CDN)
GET    /api/v1/sheets/:sheetId/layers
```

## Interpretation & takeoff (async)
```
POST   /api/v1/sheets/:sheetId/interpret          # run AI interpretation (202 -> jobId)
POST   /api/v1/projects/:id/takeoff:run           # run/refresh takeoff (202)
GET    /api/v1/jobs/:jobId                         # status/progress
GET    /api/v1/sheets/:sheetId/rooms
GET    /api/v1/sheets/:sheetId/elements           # detected elements (+confidence)
```

## Rooms
```
GET    /api/v1/projects/:id/rooms
GET    /api/v1/rooms/:roomId
PATCH  /api/v1/rooms/:roomId                       # edit name/number/boundary/height
POST   /api/v1/rooms                               # manual room
```

## Takeoff items (review & correction)
```
GET    /api/v1/projects/:id/takeoff               # filters: discipline, confidence band,
                                                  #   status, sheet, room, group_by
GET    /api/v1/takeoff-items/:itemId              # includes audit JSON
POST   /api/v1/takeoff-items                       # add manual item
PATCH  /api/v1/takeoff-items/:itemId               # edit (qty, uom, classification, status)
DELETE /api/v1/takeoff-items/:itemId
POST   /api/v1/takeoff-items/:itemId:split
POST   /api/v1/takeoff-items:merge                 # { itemIds: [...] }
POST   /api/v1/takeoff-items:bulk                  # { filter, action: accept|reject|reclassify }
GET    /api/v1/takeoff-items/:itemId/audit         # full audit trail + narrative
```

## Rates
```
GET    /api/v1/rate-libraries
POST   /api/v1/rate-libraries
POST   /api/v1/rate-libraries/:libId/import        # CSV/Excel (column mapping)
GET    /api/v1/rate-libraries/:libId/rates         # search/filter
POST   /api/v1/rate-libraries/:libId/rates
PATCH  /api/v1/rates/:rateId
GET    /api/v1/cost-items                           # taxonomy (CSI/Uniclass + custom)
```

## Estimates
```
GET    /api/v1/projects/:id/estimates
POST   /api/v1/projects/:id/estimates              # create estimate
POST   /api/v1/estimates/:eid/revisions            # new revision
POST   /api/v1/estimate-revisions/:rid:price       # apply rates -> compute lines/totals (202)
GET    /api/v1/estimate-revisions/:rid             # lines + totals + confidence summary
PATCH  /api/v1/estimate-revisions/:rid             # markups/overhead/contingency/tax
POST   /api/v1/estimate-revisions/:rid:submit      # -> pending_approval
POST   /api/v1/estimate-revisions/:rid:approve     # lead/admin only -> approved (locks)
POST   /api/v1/estimate-revisions/:rid:issue
GET    /api/v1/estimates/:eid/compare?a=rid1&b=rid2 # revision diff
```

## Exports
```
POST   /api/v1/estimate-revisions/:rid/exports     # { format: xlsx|pdf|boq, scope, template } (202)
GET    /api/v1/projects/:id/exports                # history
GET    /api/v1/exports/:exportId                    # status + download URL
```

## Comments, reviews, notifications
```
GET    /api/v1/:entityType/:entityId/comments
POST   /api/v1/:entityType/:entityId/comments
PATCH  /api/v1/comments/:commentId                  # resolve
GET    /api/v1/projects/:id/reviews                 # review/approval queue
GET    /api/v1/notifications
```

## Admin & audit
```
GET    /api/v1/orgs/:orgId/audit                    # filterable audit log
GET    /api/v1/orgs/:orgId/roles
POST   /api/v1/orgs/:orgId/integrations             # SSO, storage, Procore/ACC
GET    /api/v1/orgs/:orgId/api-keys
```

## Realtime (WebSocket)
```
WS /api/v1/realtime
  → subscribe: { channel: "project:{id}" | "job:{id}" }
  ← events:    job.progress, job.done, takeoff.updated, comment.created, review.requested
```

## Example payloads

### Create project
```http
POST /api/v1/projects
{
  "name": "Riverside Office Fit-out",
  "clientName": "Riverside Dev Co",
  "region": "US-CA",
  "units": "imperial",
  "currency": "USD",
  "disciplines": ["architectural","structural"],
  "dueDate": "2026-07-15"
}
→ 201 { "id": "proj_...", "status": "draft", ... }
```

### Confirm scale
```http
POST /api/v1/sheets/sheet_123/scale:confirm
{ "scaleRatio": 0.02, "units": "mm" }
→ 200 { "scaleConfirmed": true }
```

### Bulk accept high-confidence
```http
POST /api/v1/takeoff-items:bulk
{ "filter": { "projectId":"proj_1","discipline":"architectural","confidenceGte":0.85 },
  "action": "accept" }
→ 200 { "affected": 412 }
```

### Takeoff item with audit (GET)
```jsonc
{
  "id": "ti_900",
  "discipline": "architectural",
  "description": "Partition wall P1 — paint area",
  "uom": "m2", "quantity": 42.6, "wastePct": 0.05, "netQuantity": 44.73,
  "confidence": 0.88, "status": "pending",
  "roomId": "room_204",
  "sourceElementIds": ["el_123","el_124"],
  "audit": { "method":"wall_area_minus_openings", "inputs":{...}, "formula":"...",
             "source":{"sheet":"A-101","scaleRatio":0.02}, "reconciliation":{...} }
}
```

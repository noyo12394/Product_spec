# 02 — User Personas

Six core personas drive EstimAI's design. Each has distinct goals, pains, and
permission needs (see [Security & Permissions](14-security-permissions.md)).

---

## P1 — Maria, the Estimator (primary user)
- **Role:** Quantity takeoff & estimating specialist at a general contractor.
- **Daily reality:** Juggles 2–4 active bids, each with 50–300 sheets, all due "yesterday."
- **Goals:** Finish accurate takeoffs fast; not miss scope; defend her numbers in bid review.
- **Pains:** Manual counting/measuring is tedious; drawings are messy and rescaled; copy-paste errors; revisions force re-work.
- **What she needs from EstimAI:**
  - Fast, reliable auto-takeoff she can trust *because* she can verify it.
  - A viewer where clicking a takeoff row highlights the exact element on the sheet.
  - Easy correction tools (edit, split, merge, reclassify, bulk-accept).
  - Confidence scores so she knows where to focus her review time.
- **Success looks like:** "I reviewed 1,200 detected items in an afternoon and trust the total."

## P2 — David, the Lead/Chief Estimator (reviewer & approver)
- **Role:** Owns the final bid number; manages a team of estimators.
- **Goals:** Consistent methodology across the team; catch scope gaps; sign off with confidence.
- **Pains:** Hard to audit how juniors arrived at numbers; inconsistent assumptions; last-minute surprises.
- **Needs:** Approval workflow, audit trails, side-by-side revision comparison, markup/contingency control, team-wide rate libraries and templates.
- **Success:** "I can see exactly how every line was derived and approve revisions in one place."

## P3 — Priya, the Preconstruction / Project Manager
- **Role:** Coordinates preconstruction; interfaces with clients and design teams.
- **Goals:** Keep projects on schedule; track estimate status; communicate cost drivers.
- **Pains:** No single view of project/drawing/estimate status; version chaos; ad-hoc reporting.
- **Needs:** Project dashboard, status tracking, cost-by-discipline/room dashboards, branded client-ready reports, export center.
- **Success:** "I know every project's estimate status and can generate a client report in two clicks."

## P4 — Sam, the Contractor / Business Owner (buyer & occasional user)
- **Role:** Owner or principal of a contracting firm.
- **Goals:** Win more profitable bids; reduce estimating headcount cost per bid; faster turnaround.
- **Pains:** Estimating is a bottleneck and a cost center; inconsistent margins.
- **Needs:** ROI visibility, win/loss and throughput dashboards, seat/role management, security assurances.
- **Success:** "We bid 40% more jobs with the same team and our margins are predictable."

## P5 — Aisha, the Architect / Engineer (collaborator)
- **Role:** Designer or discipline engineer (structural/MEP) who supplies drawings and reviews scope.
- **Goals:** Ensure the takeoff reflects design intent; respond to RFIs about quantities.
- **Pains:** Estimators misread drawings; back-and-forth over what's included.
- **Needs:** Read/comment access to drawings and takeoffs, ability to flag mis-detections, discipline filters.
- **Success:** "I can confirm the structural takeoff matches my model and flag what's wrong."

## P6 — Tom, the Org Admin / IT (configuration & governance)
- **Role:** Administers the EstimAI tenant for the firm.
- **Goals:** Control access, manage libraries/templates, ensure security/compliance, set integrations.
- **Pains:** Shadow IT; inconsistent data; security/audit requirements from clients.
- **Needs:** RBAC, SSO/SAML, audit logs, rate-library governance, taxonomy management, data residency controls.
- **Success:** "Access, data, and audit trails are all under control and pass our client security reviews."

---

## Persona → permission summary

| Persona | Create projects | Upload | Run AI takeoff | Edit takeoff | Approve estimate | Manage rates | Admin/org |
|---------|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| Estimator (Maria) | ✓ | ✓ | ✓ | ✓ | – | – | – |
| Lead Estimator (David) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | – |
| PM (Priya) | ✓ | ✓ | – | – | – | – | – |
| Contractor (Sam) | ✓ | – | – | – | ✓ | – | partial |
| Architect/Engineer (Aisha) | – | ✓ | – | comment | – | – | – |
| Admin (Tom) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

(Exact role matrix in [Security & Permissions](14-security-permissions.md).)

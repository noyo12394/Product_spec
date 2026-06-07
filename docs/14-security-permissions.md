# 14 — Security & Permissions Model

Bid pricing and client drawings are highly confidential. Security and tenant isolation are
core requirements, not afterthoughts.

## 1. Tenancy & isolation
- **Multi-tenant** with hard `org_id` scoping on every row; enforced at the API layer and,
  where supported, with **Postgres Row-Level Security (RLS)** policies as defense-in-depth.
- **Object storage** segregated by per-tenant key prefixes; signed, short-lived URLs only.
- **Optional single-tenant / VPC deployment** for enterprise clients with strict isolation/residency needs.

## 2. Authentication
- OAuth2 / OIDC; email+password with strong hashing (Argon2/bcrypt).
- **SSO/SAML & SCIM** for enterprise (Okta, Azure AD, Google).
- **MFA/TOTP**; session management with refresh-token rotation; device/session revocation.
- Short-lived JWT access tokens; refresh tokens stored httpOnly/secure.

## 3. Authorization (RBAC)
Roles at org and project scope. Project membership can override/narrow org role.

| Capability | Owner | Admin | Lead Est. | Estimator | PM | Reviewer (A/E) | Viewer |
|------------|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| Manage org/billing | ✓ | ✓ | – | – | – | – | – |
| Manage users/roles | ✓ | ✓ | – | – | – | – | – |
| Manage rate libraries | ✓ | ✓ | ✓ | – | – | – | – |
| Manage taxonomy/templates | ✓ | ✓ | ✓ | – | – | – | – |
| Create/edit projects | ✓ | ✓ | ✓ | ✓ | ✓ | – | – |
| Upload drawings | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | – |
| Run AI takeoff | ✓ | ✓ | ✓ | ✓ | – | – | – |
| Edit takeoff items | ✓ | ✓ | ✓ | ✓ | – | comment | – |
| Price estimate | ✓ | ✓ | ✓ | ✓ | – | – | – |
| **Approve / issue estimate** | ✓ | ✓ | ✓ | – | – | – | – |
| Export deliverables | ✓ | ✓ | ✓ | ✓ | ✓ | – | view |
| View project | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| View audit log | ✓ | ✓ | ✓ | – | – | – | – |

- **Granular project roles:** a user can be estimator on project A and viewer on project B.
- **Custom roles** (V1+) for enterprises.
- Authorization checks centralized in a policy layer (e.g., CASL/OPA-style) — never ad-hoc per endpoint.

## 4. Data protection
- **Encryption in transit:** TLS 1.2+ everywhere.
- **Encryption at rest:** DB, object storage, backups (AES-256, KMS-managed keys).
- **Secrets** in a managed vault (AWS Secrets Manager / Vault); no secrets in code/repo.
- **PII minimization:** store only necessary user data; configurable data-retention & deletion.
- **Backups:** encrypted, tested restores; point-in-time recovery for Postgres.

## 5. File safety
- **Virus/malware scanning** on every upload before processing.
- File-type validation & size limits; reject/sandbox unexpected content.
- Parsing workers run sandboxed (least privilege, no outbound except allowed services).

## 6. Audit & accountability
- **Append-only `audit_events`** for every state change: who, what, before/after, when.
- Estimate approvals, quantity edits, rate changes, exports, permission changes all logged.
- Admin audit-log viewer with filters and export; tamper-evident (hash-chained, optional).
- AI outputs recorded with model id + prompt version for full reproducibility.

## 7. AI-specific security
- Drawing/schedule text and any external/PR/comment content treated as **untrusted data**,
  never as instructions (prompt-injection defense).
- LLM has **no direct write** access to pricing/quantity data; only proposals gated by humans.
- Optional: route LLM calls through a provider/region meeting client data agreements; redact
  identifiers where feasible; no training on customer data without explicit opt-in.

## 8. Network & infra
- Private subnets for DB/workers; public surface limited to the API gateway/CDN.
- WAF + rate limiting + bot protection at the edge.
- Least-privilege IAM; per-service roles; no shared credentials.
- Dependency scanning (SCA), SAST/DAST in CI, container image scanning.

## 9. Compliance posture
- Target **SOC 2 Type II**-aligned controls; GDPR/CCPA-ready (DSRs, data residency options).
- DPA & subprocessor list for customers; configurable data residency (region pinning).
- Pen-testing before GA and annually thereafter.

## 10. Application-level safeguards
- Input validation (Zod/Pydantic) on every endpoint; output encoding (XSS).
- CSRF protection; secure, httpOnly, sameSite cookies; strict CORS allowlist.
- Idempotency keys on mutating endpoints; optimistic concurrency on takeoff/estimate edits.
- Rate limits per user/org; abuse monitoring; anomaly alerts.

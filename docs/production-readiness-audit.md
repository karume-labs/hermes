# Production readiness audit

Audit of the Hermes monorepo before opening it to real clinics and patients.
Originally reviewed from `main` at `2ae1180`; this revision records the
implementation pass completed on 6 November 2026.

**Verdict: code-side launch blockers are closed.** The application now has
patient authentication, invite-only staff accounts, clinic tenancy, guarded
reads, signed webhooks, consent-aware delivery, web/mobile clients wired to the
new contracts, the full screening-to-closure loop (ownership, referral
acceptance, confirmation, consultation, treatment, surveillance and patient
understanding), and an operable readiness endpoint. Launch is still gated by
external operations that cannot be completed in the repository: TLS/DNS, a live
SMS gateway, off-host backups, error tracking/uptime alerting, a penetration
test, store credentials and legal review.

Use this document as the launch board. Each item keeps its original priority
and now carries a status and the evidence for it.

| Priority | Meaning |
| --- | --- |
| **P0** | Must be closed before any real patient data enters the system. |
| **P1** | Must be closed before public launch. |
| **P2** | Should ship in the first month after launch. |
| **P3** | Backlog / scale work. |

| Status | Meaning |
| --- | --- |
| **Done** | Implemented in code and exercised locally. |
| **Partial** | The software part is shipped; a policy, provider or scale limit remains. |
| **External** | Needs an account, contract, infrastructure or review outside this repo. |
| **Deferred** | Deliberately not done in this pass (reason given). |

---

## 1. Security and access control

| # | Item | Priority | Status | Evidence |
| --- | --- | --- | --- | --- |
| 1.1 | Patient authentication | P0 | **Done** | Phone + 6-digit SMS code → opaque bearer token, SHA-256 hashed in `patient_sessions`; codes HMAC-SHA256 with `BETTER_AUTH_SECRET`, 5 attempts, 3 requests/10 min/patient, 5/10 min/IP. Mobile stores the token in `expo-secure-store`. Verified: request → verify → `GET /patients/:id/cases` returns 200, another patient returns 404, no token returns 401. |
| 1.2 | Staff registration open | P0 | **Done** | Better Auth `disableSignUp`; Google/social providers removed. Admins invite from `/admin/staff`; single-use token, 7-day expiry, hashed at rest, password set at `/accept-invite`. Verified end to end: invite → accept → sign in → coordinator sees only `clinic-1`; `/staff/users` returns 401 for that coordinator. |
| 1.3 | Unauthenticated PHI reads | P0 | **Done** | `requireStaff`/`requirePatient` on cases, messages, audit, metrics, notifications, webhook logs, routing rules, attachments, patients, slots and bookings. Coordinators are rejected if their `clinicId` is null. |
| 1.4 | Attachment download trusts `?patientId=` | P0 | **Done** | Download requires staff access to the case clinic or the patient bearer token; the query-parameter bypass is gone. Filenames are sanitised and served with `nosniff` and a restrictive CSP. |
| 1.5 | Lab webhooks unauthenticated | P0 | **Done** | HMAC-SHA256 over `${timestamp}.${raw body}`, 5-minute skew, `webhook_receipts` single-use replay guard, raw-body capture. Verified: unsigned 401, signed 200 with a triaged case, replay 409. |
| 1.6 | No tenant model | P0 | **Done** | `clinics` and `patients` tables; `care_cases`, `slots`, `bookings`, `routing_rules`, attachments and notifications carry clinic/patient FKs. Staff have one `user.clinicId`; admins are null (all clinics). |
| 1.7 | Transport, headers, proxy | P0 | **Partial** | Web sends HSTS, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, `nosniff` and `frame-ancestors 'none'`; API uses helmet and an explicit origin allow-list. **External:** Caddy TLS certificates require public DNS and ports 80/443. |
| 1.8 | CORS/CSRF posture | P1 | **Done** | `origin: env.FRONTEND_URL` with credentials, explicit methods; no wildcard. |
| 1.9 | Secrets and production env validation | P0 | **Partial** | API and web parse env through TypeBox. Production refuses unsafe defaults for `DATABASE_URL`, `API_SECRET`, `BETTER_AUTH_SECRET`, `WEBHOOK_SECRET`, non-HTTPS `API_URL`/`FRONTEND_URL`, and patient auth refuses to issue codes without `SMS_WEBHOOK_URL`. **External:** managed secret store and rotation runbook. |
| 1.10 | Auth hardening | P1 | **Done** | Sign-up rate limit removed with the endpoint; email sign-in limited to 5/min; sessions invalidated on role/clinic/ban change; invite and patient-code endpoints rate limited. |
| 1.11 | API abuse controls | P1 | **Partial** | Fixed-window limiter on patient code/verify, invite acceptance and ingestion. **Limitation:** in-memory per instance; put a shared limiter (or edge rules) in front of multiple API replicas. |
| 1.12 | Dependencies and supply chain | P2 | **External** | Run `bun audit`, secret scanning and SAST in CI once the workflow is re-enabled. |
| 1.13 | Audit logging completeness | P1 | **Partial** | Every case transition, ingestion, notification outcome and closure is audited with the acting principal. PHI read auditing is not exhaustive (reads are access-controlled and logged structurally, not written to `audit_trail`). |

## 2. Data, correctness and compliance

| # | Item | Priority | Status | Evidence |
| --- | --- | --- | --- | --- |
| 2.1 | No patient/clinic entity | P0 | **Done** | `clinics`, `patients`, `staff_invites`; FKs and indexes across care-loop, booking, notify and ingestion; migration `0005` backfilled existing rows, `0006` added invites, receipts and the routing FK. |
| 2.2 | Duplicate ingestion race | P1 | **Done** | `care_cases.lab_payload_id` unique; insert race caught (`23505`) and resolved to the original case. |
| 2.3 | Schema and query gaps | P1 | **Done** | Unique active booking per case, slot/case indexes, notification attempt indexes, clinic FK on routing rules, `webhook_receipts`. |
| 2.4 | Booking inventory synthetic | P0 | **Partial** | Slots are generated for a rolling 14 days per clinic; booking validates clinic, future time, kind, slot hold, unique booking; cancel and reschedule implemented; closing/referring releases the hold. **Remaining:** integrate a real clinic calendar when one exists. |
| 2.5 | Referral does not hand off | P1 | **Done** | Referrals are first-class rows with `sent` / `accepted` / `declined` / `completed`, a hand-off note, decision actor/timestamp and decline reason. Active referrals widen case visibility and booking to the receiving clinic; acceptance assigns a named owner and creates a receiving task. Verified: receiving clinic reads the case, accepts it; a declined referral clears the destination and creates an origin-clinic re-route task. |
| 2.6 | Closure actor client-supplied | P1 | **Done** | `closedBy` is the authenticated staff email. Closure now requires the `clinician` or `admin` role; a coordinator receives 401. Verified: coordinator close 401, clinician close 200. |
| 2.13 | Brief loop lacks accountability and clinical states | P1 | **Done** | `assignedToId` names an owner: ingestion and referral acceptance assign a clinic coordinator by default, and closure is refused without an owner. `confirmationStatus`/`confirmedAt`, `consultedAt`/outcome, `treatmentStartedAt` and surveillance plan/next review are stored and audited. The cron sweep turns a due `nextReviewAt` into one deduplicated surveillance task, and negative teach-back opens an assigned patient follow-up. Tasks appear in a dedicated `/tasks` worklist. Internal clinician notes are restricted to clinicians/admins and omitted from coordinator case payloads. |
| 2.7 | Triage hard-coded/unversioned | P1 | **Partial** | Rules are centralised in `triage.ts`, LOINC-normalised and unit-tested. **Remaining (clinical governance):** a versioned rule set and documented clinical sign-off. |
| 2.8 | SLA numbers disagree | P1 | **Done** | API and marketing both use 4h / 48h / 168h; guide, hero and FAQ updated. |
| 2.9 | Data protection and clinical compliance | P0 | **External** | `/privacy` and `/terms` pages ship with product-accurate copy. A DPIA, DPA/BAA with each subprocessor and counsel review remain external. |
| 2.10 | PHI in logs and URLs | P1 | **Done** | Structured logs omit query strings, redact UUIDs and `/patients/:id`; request ids returned in `x-request-id`. Identifiers still appear in authenticated paths by design. |
| 2.11 | Retention and deletion | P1 | **Partial** | Codes (10 min), sessions (30 days), invites (7 days) and webhook receipts (24h) expire automatically. **Remaining:** clinic-policy retention and a patient export/delete process. |
| 2.12 | Backups and disaster recovery | P0 | **External** | Automated off-host Postgres backup, upload replication and a restore drill. |

## 3. Product and workflow gaps

| # | Item | Priority | Status | Evidence |
| --- | --- | --- | --- | --- |
| 3.1 | Notifications undeliverable | P0 | **Partial** | Consent-aware outbox dispatch: Expo push direct with invalid-token cleanup, SMS via `NOTIFY_WEBHOOK_URL`, in-app settles locally, bounded retries and SMS fallback, `FOR UPDATE SKIP LOCKED` claim. **External:** live SMS/notification provider credentials. |
| 3.2 | No patient lifecycle | P1 | **Partial** | Sign-in, session restore, sign-out, consent capture/update and device registration are wired. **Remaining:** account deletion and phone-change verification. |
| 3.3 | Queue usability at scale | P1 | **Deferred** | Server-side pagination and saved views are not in this pass; the queue remains filtered but unpaginated. |
| 3.4 | Admin capabilities | P1/P2 | **Done** | Staff list, role/clinic change, ban/unban, invite create/list/revoke, clinic list, plus the existing delivery, webhook and routing views. |
| 3.5 | Web UX resilience | P2 | **Done** | Route error boundary, not-found page and dashboard loading state; Eden errors keep the API message/status instead of a rewritten response. |
| 3.6 | Accessibility | P2 | **External** | The product is English-only by design: result summaries and SMS copy are English and there is no language preference or selection step. **External:** WCAG 2.2 AA audit. |
| 3.7 | File handling | P2 | **Partial** | Server-side uploads, magic-byte MIME verification, size cap, UUID names. **External:** object storage and off-host replication. |

## 4. Reliability and operations

| # | Item | Priority | Status | Evidence |
| --- | --- | --- | --- | --- |
| 4.1 | Observability | P0 | **Partial** | Request ids, structured access/error logs, `/ready` database probe, cron failures logged. **External:** error tracking, uptime checks and alert routing. |
| 4.2 | Background jobs in-process | P1 | **Partial** | Outbox claims rows with `SKIP LOCKED`; cron wraps all work in a logged try/catch; receipts pruned each run. **Remaining:** a separate worker process at scale. |
| 4.3 | Graceful shutdown | P2 | **Done** | `SIGTERM`/`SIGINT` stop the Elysia server before exit. |
| 4.4 | CI/CD and migrations | P0 | **Deferred** | Disabled on request: `.github/workflows/deploy.yml.disabled`. Migrations are versioned (`0005`–`0009`) and applied locally. Re-enable with lint, typecheck, tests, builds and a migration job. |
| 4.5 | Docker packaging | P1 | **External** | Image hardening and resource limits are unchanged; review before deployment. |
| 4.6 | Capacity and load | P1 | **External** | Load test at target volume with recorded results. |

## 5. Mobile app release readiness

| Item | Status | Evidence |
| --- | --- | --- |
| Patient sign-in | **Done** | `/sign-in`: phone, consent, code, dev-code hint, session storage. |
| Token storage and auth headers | **Done** | `expo-secure-store`; every `careApi` call sends `Authorization: Bearer`. |
| Remove seeded identity switcher | **Done** | `PATIENT_IDS`/`nextPatient` deleted; home shows the signed-in patient and clinic. |
| Sign-out | **Done** | Revokes server session and clears token/profile. |
| Consent | **Done** | Required checkbox at sign-in; persisted through `/patient-auth/consent`. |
| Push registration | **Done (code)** | Registers the Expo token after sign-in; invalid tokens are pruned server-side. |
| EAS project, signing keys, store listings | **External** | Build and submission credentials. |
| Device testing / crash reporting | **External** | Not exercised on a physical device in this pass. |

## 6. Marketing site

| Item | Status | Evidence |
| --- | --- | --- |
| SLA copy | **Done** | 4h / 48h / 168h in constants, hero and FAQ. |
| Signed-webhook claim | **Done** | HMAC-SHA256, timestamp and replay protection described where claimed. |
| Staff access copy | **Done** | No public sign-up or Google; invite + patient SMS code described. |
| Legal pages | **Done (draft)** | `/privacy` and `/terms`; counsel review still required. |
| robots/sitemap | **Done** | `robots.txt` and `sitemap.xml` generated from `SITE_URL`. |

## 7. Verification performed

| Check | Result |
| --- | --- |
| `bun run --cwd apps/api typecheck` | pass |
| `bun run --cwd apps/web typecheck` | pass |
| `bun run --cwd apps/mobile typecheck` | pass |
| `bun run --cwd apps/www typecheck` | pass (0 errors) |
| `bun run --cwd packages/validators typecheck` | pass |
| `bun run --cwd apps/api test` | 25 pass (includes DB-backed ownership, referral, surveillance, teach-back and consult-visibility tests) |
| `bun run --cwd apps/web build` | pass |
| Patient auth + scoping (curl) | 200 own cases, 404 other patient, 401 anonymous |
| Staff invite → accept → sign in (curl) | 200; coordinator sees only `clinic-1`; admin route 401 |
| Webhook signature / unsigned / replay (curl) | 200 / 401 / 409 |
| Booking at referred clinic + cancel (curl) | 200 / 200 |
| Full loop: assign → confirm → consult → treat → refer → accept → close (curl) | 200 at each step; receiving clinic reads shared case 200 |
| Coordinator closure attempt vs clinician closure (curl) | 401 / 200 |
| Unowned case closure (curl) | 409 until an owner is assigned |
| Teach-back `understood: false` then `true` (curl) | follow-up task opened, then closed |
| Declined referral (curl) | destination cleared; origin re-route task created |
| Internal consult notes (curl) | visible to receiving clinic, absent from patient response |
| `/health`, `/ready` | 200 |

Not run in this pass: Docker image build, full browser click-through, physical-device
mobile run, load test, penetration test, accessibility audit. The dashboard queue
and case file were rendered in the local browser after the build; the mobile app
was typechecked but not run on a device.
The unrelated Expo-generated `ios/**` files still fail formatting; they are
untracked and were left untouched.

## 8. Go/No-Go checklist

**Security**

- [x] No route returns PHI without an authenticated principal
- [x] Patient authentication shipped; cross-patient access returns 404
- [x] Staff sign-up closed; invites verified; admins can deactivate users
- [x] Webhooks authenticated and replay-protected
- [ ] HTTPS enforced with HSTS at the proxy (**external: DNS + certificates**)
- [x] CORS allow-list; cookies same-origin-configured
- [x] Production env guards for API and web
- [ ] Secrets in a managed store; rotation documented (**external**)
- [x] Rate limits on auth, ingestion and messaging
- [ ] Pen-test findings closed or risk-accepted (**external**)

**Data and clinical**

- [x] `patients`, `clinics` and FKs in place; tenant isolation tested
- [x] Audit trail for case events and clinical milestones
- [x] Named owner, receiving-clinic acceptance, clinician-only closure
- [x] Confirmation, consultation, treatment, surveillance and patient understanding captured
- [ ] Retention/deletion policy implemented (**partial; clinic policy needed**)
- [ ] Backups automated off-host; restore drill passed (**external**)
- [ ] DPA/BAA signed; DPIA complete (**external**)
- [x] Privacy policy, terms and consent flows live (legal review pending)
- [ ] Clinical owner approved triage rules, SLAs and escalation tree (**external**)

**Operate**

- [ ] CI green (disabled by request)
- [ ] CD applies migrations and smoke-tests (**external**)
- [ ] Staging environment (**external**)
- [ ] Error tracking and alerts firing to a real channel (**external**)
- [x] `/health` and `/ready` available
- [ ] Load test at target volume (**external**)
- [ ] Support process, on-call rota and documentation (**external**)

**Clients**

- [ ] Production signing keys and EAS project (**external**)
- [ ] Push and SMS verified on real devices (**external provider**)
- [ ] Store listings, privacy manifest and account deletion (**external**)
- [x] Web error/loading/not-found states
- [x] Marketing site SLA and signing claims match the API

## 9. External dependency register

| Dependency | Why it blocks | Done when |
| --- | --- | --- |
| DNS + TLS certificates | Traffic must not be plain HTTP | `https://` origin serves the dashboard and API with HSTS |
| SMS gateway | Patient login and SMS fallback | `SMS_WEBHOOK_URL` reaches a live provider in production |
| Notification sink | SMS alerts and fallback | `NOTIFY_WEBHOOK_URL` delivered to the provider, delivery stats non-zero |
| Off-host backups | Recovery from host loss | Nightly Postgres dump + upload copy, restore drill recorded |
| Error tracking / uptime | Detect silent failure | Alerts reach a real on-call channel from a staging deploy |
| Penetration test | External assurance | Findings closed or risk-accepted |
| EAS + store accounts | Patient app distribution | Signed builds in TestFlight/Play internal track |
| Legal review | Privacy/terms/DPA/DPIA | Counsel sign-off recorded |

## 10. Endpoint auth reference

| Route | Auth |
| --- | --- |
| `POST /webhooks/lab`, `/fhir`, `/hl7` | HMAC signature + timestamp + single-use receipt |
| `GET/PUT/DELETE /routing-rules` | staff (writes coordinator/admin) |
| `GET /cases`, `/cases/:id`, `/cases/:id/messages` | staff or owning patient; clinic-scoped |
| `POST /cases/acknowledge` | owning patient |
| `POST /cases/:id/messages`, `/outreach`, `/escalate` | staff |
| `GET/POST /patients/:patientId/*` | patient bearer whose id matches the path |
| `GET /clinics`, `/clinics/:clinicId/slots` | staff, or patient with care at that clinic |
| `POST /bookings`, `/:id/cancel`, `/:id/reschedule` | staff or owning patient |
| `GET/POST /cases/:id/attachments` | staff |
| `GET /attachments/:id` | staff or owning patient |
| `POST /referrals`, `/cases/close` | coordinator/admin |
| `GET /metrics`, `/audit/:caseId`, `/notifications*`, `/webhooks/logs` | staff; notifications admin |
| `POST /notifications/dispatch` | admin |
| `GET/POST /staff/*` | admin, except `/staff/invites/accept` (public, rate limited) |
| `POST /patient-auth/request-code`, `/verify` | public, rate limited |
| `GET/POST/PATCH /patient-auth/session`, `/sign-out`, `/consent` | patient bearer |
| `GET /health`, `/ready` | none (intended) |

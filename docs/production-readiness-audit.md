# Production readiness audit

Audit of the Hermes monorepo before opening it to real clinics and patients.
Everything below was read from the current `main` tree (`2ae1180`): API routers,
auth config, Drizzle schema, web/mobile/www code, Docker/Caddy/CI files and the
seeded data model. Nothing was load-tested or penetration-tested, and no
external compliance review has happened.

**Verdict: not ready for production.** The clinical workflow is coherent and
the dashboard is usable, but the platform currently has no patient
authentication, accepts lab results and patient reads without credentials,
serves marketing copy over plain HTTP, and has no backups, monitoring or CI.
Several of these are launch blockers on their own; together they make a data
breach or a silent care failure likely.

Use this document as the launch board. Each item has a priority, the evidence
that it is missing, what "done" means, and a rough effort estimate.

| Priority | Meaning |
| --- | --- |
| **P0** | Must be closed before any real patient data enters the system. Legal, safety or existential risk. |
| **P1** | Must be closed before public launch; can follow a closed pilot only with written risk acceptance. |
| **P2** | Should ship in the first month after launch. |
| **P3** | Backlog / scale work. |

Effort estimates are engineering days for one experienced developer, excluding
procurement, clinical review and legal review.

---

## 0. Executive summary

### Top blockers

| # | Blocker | Why it stops launch | Est. |
| --- | --- | --- | --- |
| 1 | No patient authentication; patient identity is a client-supplied string | Anyone who knows or guesses a patient id can read results, messages, documents and book appointments. Ids are seeded and predictable (`patient-1-clinic-1`). | 8–12d |
| 2 | Public staff sign-up grants `coordinator` access | Any internet user can create an account and read the whole PHI queue. Email is never verified and there is no invite or approval step. | 2–3d |
| 3 | Most read endpoints have no auth guard | `GET /cases`, `GET /metrics`, `GET /notifications`, `GET /webhooks/logs`, `GET /audit/:caseId`, `GET /routing-rules` and most `/patients/*` routes return PHI or operational data to anonymous callers. | 3–5d |
| 4 | Lab ingestion webhooks are unauthenticated and unsigned | Anyone can inject a fake result for any `patientId`, trigger patient notifications, and pollute the audit trail. Marketing copy already claims "signed webhook endpoints". | 3–5d |
| 5 | Plain HTTP in the deployed stack | `infra/caddy/Caddyfile` only listens on `:80`, has no TLS, no HSTS and no security headers. Sessions and PHI would travel in clear text. | 1d |
| 6 | No clinic/tenant scoping | `care_cases.clinic_id` is a free-text column; staff have no clinic assignment, so every coordinator sees every clinic's patients. | 4–6d |
| 7 | Notifications cannot actually reach patients | There is no SMS/email provider, no patient phone/email stored, and Expo push is skipped because `app.json` has no `extra.eas.projectId`. The outbox only queues rows. | 5–8d |
| 8 | No backups or restore drill | Data lives in one named Docker volume (`hermes_db`). A lost host loses every case, message and document. | 2–3d |
| 9 | No observability or alerting | No error tracking, structured logs, request ids, metrics scrape or uptime checks. A failed cron or a 500 is invisible until a clinician complains. | 3–5d |
| 10 | No CI/CD and no migration step | `.github/workflows/deploy.yml` is entirely commented out. Production migrations, image builds and rollbacks are manual and undocumented. | 3–5d |

### Already in decent shape

- Drizzle access is parameterised; no string-built SQL found.
- Staff session auth is real Better Auth with role checks on the write routes
  that have them (`assertCoordinator`), and role changes invalidate sessions.
- Uploads are written under a server-controlled directory with UUID names,
  MIME allow-list and a 10 MB cap; filenames never form the path.
- Triage, duplicate-feed handling, booking row locks and the SLA sweep are
  straightforward and unit-tested (14 tests).
- `bun run lint`, full-workspace typecheck, API tests and both production
  builds pass on `main`.

---

## 1. Security and access control

### 1.1 Patient authentication is absent — P0

**Evidence.** `apps/mobile/lib/session.ts` defaults every install to
`DEFAULT_PATIENT_ID = "patient-1-clinic-1"` and lets the user cycle through
four seeded ids with `nextPatient`. `apps/api/src/features/patient/routers/patients-router.ts`
scopes reads by the `:patientId` path segment only. There is no patient table,
no credential, no token and no session. `apps/mobile/README.md` documents this
as a known gap.

**Impact.** Reading another patient's results requires changing one string.
That is an unauthorised disclosure of PHI, and it also allows an attacker to
acknowledge results on a patient's behalf, which corrupts the clinical record.

**Done means**

- A real patient identity: phone + OTP (most appropriate for the Kenyan
  market), magic link, or clinic-issued invite code exchanged for a session.
- `patients` table keyed by a stable internal id, with phone/email, consent
  flags and clinic membership.
- API patient routes derive the patient from the session, never from the URL.
  Keep the path segment only as a cross-check that 404s on mismatch.
- Mobile stores a short-lived access token + refresh token in
  `expo-secure-store`, with device binding, remote revocation and a visible
  sign-out / "remove this device" action.
- Rate limits and lockout on OTP requests and verification.
- Tests: two patients, foreign case id, foreign attachment id, revoked token.

**Est.** 8–12 days, plus SMS costs.

### 1.2 Staff registration is open and unverified — P0

**Evidence.** `apps/api/src/features/auth/services/config.ts` enables
`emailAndPassword` with no `requireEmailVerification`, no `sendVerificationEmail`
and no allow-list. The admin plugin sets `defaultRole: "coordinator"`, and
`apps/web/src/proxy.ts` lets any `coordinator` or `admin` through every
non-admin page. `/sign-up` is linked from `/sign-in`.

**Impact.** Self-service account creation into a PHI system. Even without
malice, a mistyped email creates an orphan account with clinical access.

**Done means**

- Close public sign-up. Staff accounts are created by an admin invite
  (email link, single use, expiring) or provisioned by the clinic's IdP.
- Verify email before first session; require an admin approval step for
  Google sign-ups, or restrict Google to a verified Workspace domain.
- Admin user management UI: invite, change role, deactivate, force sign-out,
  view last sign-in. Offboarding must not require SQL.
- Audit every auth and role event (invite sent, accepted, role changed,
  banned, session revoked).

**Est.** 2–3 days (invite flow) + 2 days (admin UI).

### 1.3 Unauthenticated PHI and operational reads — P0

**Evidence.** Only these routes call `requireStaff` / `assertCoordinator`:
routing-rule writes, case messages/outreach/escalate, attachment upload/list,
referral and closure, notification dispatch. Everything below is anonymous:

| Route | Exposes |
| --- | --- |
| `GET /cases`, `GET /cases/:id`, `GET /cases/:id/messages` | Full case list, summaries, message threads |
| `GET /audit/:caseId` | Complete audit trail with clinical detail |
| `GET /patients/:patientId/cases` and sub-routes | Patient results, messages, notifications |
| `GET /notifications`, `/notifications/stats` | All notification payloads and delivery state |
| `GET /webhooks/logs` | Raw lab payloads (patient ids, marker values) |
| `GET /metrics` | Operational and clinical aggregates |
| `GET /routing-rules` | Clinic routing configuration |
| `GET /clinics/:clinicId/slots` | Clinic schedule |
| `POST /bookings`, `POST /cases/acknowledge` | State changes on any case |
| `GET /attachments/:id?patientId=…` | Any document, if the patient id is known |

**Done means**

- Default-deny. Add an auth plugin/derive that resolves a principal
  (`staff` or `patient`) before routing, and make the unauthenticated set an
  explicit short allow-list: `/health`, `/auth/*`, signed webhooks.
- Staff routes require `requireStaff`; patient routes require the patient
  session from 1.1 and enforce ownership in the query, not after the fetch.
- A route-inventory test that fails when a handler is added without a guard.
- Public stats/metrics must come from a token-protected admin route or a
  separate internal scrape endpoint.

**Est.** 3–5 days including tests.

### 1.4 Attachment download trusts a query parameter — P0

**Evidence.** `apps/api/src/features/documents/routers/attachments-router.ts`
allows anonymous download when `?patientId=` matches the case's patient. The
patient id is not secret.

**Impact.** Every uploaded lab report or referral letter is downloadable by
anyone who can guess a patient id. Files are served `inline` with the stored
MIME type.

**Done means**

- Patient downloads require a patient session; staff downloads require staff
  auth. No query-parameter escape hatch.
- Short-lived signed download URLs (60s) so files can be previewed without
  forwarding the session cookie.
- Content sniffing on upload and `X-Content-Type-Options: nosniff` on
  download; consider scanning PDFs, and sanitise the filename used in
  `Content-Disposition` (currently only quotes are stripped).

**Est.** 1–2 days.

### 1.5 Lab webhooks have no authenticity check — P0

**Evidence.** `POST /webhooks/lab|fhir|hl7` accept any JSON body. There is no
HMAC, no bearer token, no IP allow-list, no timestamp/nonce and no replay
protection. `API_SECRET` exists but the webhook routes do not call
`requireStaff`. The marketing page states results "land on signed webhook
endpoints" (`apps/www/src/lib/constants.ts`).

**Impact.** A forged result creates a real case, queues a real patient
notification and can drive an escalation. It also pollutes the audit trail
that the clinic relies on.

**Done means**

- Per-integration credentials (client id + secret), not one global secret.
- HMAC-SHA256 over the raw body with a timestamp header, 5-minute skew window,
  constant-time compare, and rejected-request logging.
- Replay handling: reject a reused signature/nonce.
- Source IP allow-list where the lab has fixed egress.
- Authenticated route tests for: missing header, wrong signature, stale
  timestamp, replayed body, valid body.
- Fix the marketing claim if any part of this is not shipped.

**Est.** 3–5 days.

### 1.6 No tenant model — P0 for multi-clinic, P1 for a single pilot clinic

**Evidence.** `care_cases.clinic_id`, `bookings`, `slots` and routing rules use
free-text clinic ids (`clinic-1`). There is no `clinics` table, no staff→clinic
membership, and every coordinator query is global. `ingest-service.ts` falls
back to `DEFAULT_CLINIC = "clinic-1"` when a marker does not match a rule.

**Impact.** Clinic A staff can read and act on Clinic B cases. A misrouted
marker silently lands in the wrong clinic. Data-processing agreements usually
assume per-tenant isolation.

**Done means**

- `clinics` table with name, timezone, address, contact and status.
- `staff_clinics` membership (or `user.clinic_id` for a single-clinic pilot).
- Every staff query filtered by membership; admin role may span clinics but
  must choose one.
- Unrouted markers go to an explicit "unassigned" queue with an alert, not a
  hard-coded default.
- Tests: cross-clinic case read, cross-clinic booking, cross-clinic upload.

**Est.** 4–6 days.

### 1.7 Transport, headers and proxy — P0

**Evidence.** `infra/caddy/Caddyfile` defines only `:80`, with no domain, no
TLS, no HSTS, no security headers and no request body limit. Compose publishes
`443` but nothing listens there.

**Impact.** Session cookies and clinical data travel in clear text; any
network intermediary can read or modify them. Browsers will also warn on
non-HTTPS, and Better Auth cannot mark cookies `Secure`.

**Done means**

- Caddy site block per hostname with automatic HTTPS, HTTP→HTTPS redirect,
  HSTS (`max-age` ≥ 1 year, `includeSubDomains`, `preload` once stable).
- Security headers: CSP (including `connect-src` for the API origin),
  `frame-ancestors 'none'`, `Referrer-Policy: no-referrer`,
  `Permissions-Policy`, `X-Content-Type-Options: nosniff`.
- Request body limits at the proxy, plus timeouts and connection limits.
- Separate hostnames (or paths) for dashboard, API and marketing; document
  which cookie domain each uses.
- Verify with `curl -I` and an SSL Labs-style scan.

**Est.** 1 day (plus DNS/certificates).

### 1.8 CORS and CSRF posture — P1

**Evidence.** `apps/api/src/index.ts` uses `cors({ origin: true, credentials: true })`,
which reflects any requesting origin. `sameSite: "lax"` limits cross-site
cookie sends, but the reflection still enables cross-origin reads for any
endpoint that does not require a cookie (see 1.3) and weakens defence in
depth.

**Done means**

- Explicit allow-list: dashboard origin, marketing origin if needed, native
  app origins only where relevant.
- CSRF token or `Origin`/`Sec-Fetch-Site` validation on state-changing
  requests.
- Automated test that a foreign `Origin` is rejected for credentialed
  mutations.

**Est.** 1 day.

### 1.9 Secrets and production env validation — P0

**Evidence.** `apps/api/src/features/shared/env/index.ts` defaults
`BETTER_AUTH_SECRET` to a published development string, `API_URL` to
`http://localhost:18003`, `FRONTEND_URL` to `http://localhost:3100` and
`DATABASE_URL` to `""`. The boot guard only checks `API_SECRET`. The web app
reads `NEXT_PUBLIC_API_URL` at build time; `apps/mobile/lib/env/index.ts`
falls back to `http://localhost:8001` and never validates.

**Impact.** A missing variable in production silently produces sessions
signed with a public secret, OAuth callbacks to localhost, or an app pointed at
a developer machine.

**Done means**

- Production mode refuses to boot unless `DATABASE_URL`, `BETTER_AUTH_SECRET`
  (≥ 32 random bytes), `API_URL` and `FRONTEND_URL` are set and not
  development defaults. Same for `NEXT_PUBLIC_API_URL` in the web build and
  `EXPO_PUBLIC_API_BASE` in the mobile build.
- Secrets in a managed store (Doppler, 1Password, AWS/GCP Secrets Manager,
  SOPS) injected at deploy; nothing but `.env.example` in the repo. `apps/api/.env`
  and `apps/web/.env` are ignored today — keep it that way and add a pre-commit
  secret scanner.
- Distinct secrets per environment; documented rotation for
  `BETTER_AUTH_SECRET`, `API_SECRET` and webhook credentials. Rotating the
  auth secret signs everyone out — plan for it.
- `API_SECRET` currently grants admin as actor `"service"`. Split it into
  named service credentials so audit entries identify the caller.

**Est.** 2–3 days.

### 1.10 Auth hardening — P1

Missing today:

- Rate limiting / lockout on sign-in, sign-up, password reset and OTP. Better
  Auth `rateLimit` is explicitly `{ enabled: false }`.
- Password reset ("Forgot password") and email verification delivery: there is
  no mail provider at all.
- MFA for admin accounts (TOTP or WebAuthn).
- Session policy: fixed 7-day default, no idle timeout, no session list, no
  "sign out everywhere". Healthcare deployments usually require 15–30 minute
  idle timeouts.
- Login history and anomaly alerts.
- Password policy beyond 8 characters (breach-list check, reuse prevention).

**Done means** the above implemented, with auth events written to an
append-only security log and alerts on repeated failures.

**Est.** 4–6 days.

### 1.11 API abuse controls — P1

**Evidence.** No global rate limit, no per-route quotas, no request size limits
except the 10 MB upload check, no idempotency keys on ingestion, no pagination
(see 3.3) and no WAF.

**Done means**

- Edge rate limits per IP and per credential; stricter buckets for auth,
  ingestion, messaging, booking and upload.
- Body size caps per content type.
- Idempotency-Key support on webhooks and booking (in addition to the
  `labPayloadId` check, which currently races — see 2.2).
- Basic bot/WAF rules at the proxy or CDN.

**Est.** 2–3 days.

### 1.12 Dependencies and supply chain — P2

No `bun audit` in any script, no Dependabot/Renovate, no lockfile review
process, no SBOM, no image scanning. Add automated audit + update PRs, pin
Docker images by digest, and run `trivy`/`grype` on each image.

**Est.** 1–2 days.

### 1.13 Audit logging completeness — P1

Present: case-scoped `audit_trail` rows for ingestion, ack, booking, referral,
closure, messages, outreach, escalation, uploads.

Missing: reads and downloads (who viewed which patient file), staff sign-in
and role changes, routing-rule edits, notification dispatches, admin exports,
and any audit entry for `GET` requests. The table is mutable in place with no
trigger, no hash chain and no retention policy.

**Done means**

- Access log for PHI reads and downloads with actor, patient, case, time, IP
  and user agent.
- Auth/admin events in the same or a parallel append-only store.
- Retention policy (for example 6–7 years) with export and legal hold, and
  database permissions that prevent application-level deletion.
- A "who accessed this patient" report for compliance requests.

**Est.** 3–4 days.

---

## 2. Data, correctness and compliance

### 2.1 The data model has no patient or clinic entity — P0

`care_cases.patient_id` and `clinic_id` are `text`. There is no patient
demographics, no contact details, no clinic record and no foreign keys. This
blocks patient auth, SMS delivery, tenant scoping and any de-identification or
deletion request.

**Done means** `patients` (identity, contact, consent, clinic), `clinics`
(name, timezone, address) and `staff_clinics`, with FKs from cases, messages,
notifications, bookings, devices and attachments. Migrate seeded ids to real
UUIDs.

**Est.** 5–8 days including migration and seed rewrite.

### 2.2 Ingestion duplicates under concurrency — P1

`ingestLab` does `findCaseByLabPayloadId` then `createCase` with no unique
constraint on `care_cases.lab_payload_id`. Two simultaneous retries create two
cases, two notifications and two audit entries. Add a unique index and handle
the conflict by returning the existing case.

**Est.** 0.5 day.

### 2.3 Schema and query gaps — P1

- No index on `care_cases` (`status`, `severity`, `sla_due_at`, `created_at`,
  `patient_id`, `clinic_id`). The queue and the 5-minute sweep both do full
  table scans (`listAllCases`, `listCases`).
- `care_cases.appointment_id` has no FK to `bookings`.
- `bookings` has no unique constraint on `case_id`; two parallel bookings can
  give one case two appointments.
- `slots.held_by_case_id` has no index.
- No pagination anywhere; the queue and metrics load every case into memory
  forever. Add cursor pagination + `LIMIT` and aggregate in SQL.
- Notification payloads and webhook-log details are unbounded JSON.

**Est.** 2–3 days.

### 2.4 Booking inventory is synthetic — P0 for real clinics

`ensureSlots` creates exactly three slots per clinic (now +1, +2, +3 days) the
first time a clinic is queried and never replenishes them. After three days
every slot is in the past; the mobile booking screen will show expired slots
and `POST /bookings` does not check that `startAt` is in the future or that the
slot belongs to the case's clinic. There is no cancel, reschedule, capacity or
clinician assignment.

**Done means** real availability (clinic schedule table or EHR integration),
future-only booking, clinic match, cancellation/reschedule with audit,
capacity > 1 where appropriate, and a confirmation notification.

**Est.** 5–8 days.

### 2.5 Referral does not hand off — P1

`POST /referrals` sets `referral_clinic_id` and status `referred`. The note is
written only into the audit payload, the receiving clinic gets no case, no
notification and no task, and the originating case stays open indefinitely.
A referral currently looks closed in the UI while nobody owns the follow-up.

**Done means** a linked case or referral record at the receiving clinic, a
notification, an owner and an SLA, plus a visible two-sided status.

**Est.** 3–5 days.

### 2.6 Closure actor is client-supplied — P1

`POST /cases/close` takes `clinicianId` from the request body and writes
`clinician:<id>` into the audit trail while the actual authenticated caller may
be a coordinator. Clinical sign-off must be attributable.

**Done means** the actor comes from the session, `clinicianId` is validated
against the staff directory (or removed), and closure requires the
acknowledgment/referral prerequisite the clinical protocol defines.

**Est.** 1 day.

### 2.7 Triage logic is hard-coded and unversioned — P1

`apps/api/src/features/care-loop/services/triage.ts` holds thresholds in code
(glucose ≥ 200, HbA1c ≥ 9, K ≥ 6, Na < 125, troponin ≥ 0.4, BP ≥ 180, LDL ≥ 190,
creatinine ≥ 2, K ≥ 5.3, any value ≥ 1000) and summaries in a template. There is
no clinical sign-off record, no version, no effective date and no way to change
a threshold without a deploy. Units are passed through without normalisation,
so mg/dL vs mmol/L would change severity.

**Done means** a clinically approved rule set with versioning and an effective
date, unit normalisation, a change log, and a test suite that pins each
threshold to the approved document. Document who approved which version.

**Est.** 3–5 days + clinical review.

### 2.8 SLA numbers disagree between surfaces — P1

The API/test suite uses 4h (Urgent), 48h (Actionable) and 168h (Routine).
`apps/www/src/lib/constants.ts` advertises 24h and 72h. Pick the clinically
approved windows and make one shared constant drive API, copy and docs.

**Est.** 0.5 day.

### 2.9 Data protection and clinical compliance — P0 (legal, not code)

Nothing in the repo addresses any of the following. Which ones apply depends
on where patients and clinics are located; confirm with counsel.

| Area | Missing artefact |
| --- | --- |
| Kenya | Data controller/processor registration with the ODPC, DPIAs, lawful basis, data-subject request procedure, 72-hour breach notification, cross-border transfer assessment. |
| HIPAA (if US patients) | BAAs with every subprocessor (hosting, SMS, email, push, error tracking), Security Risk Analysis, workforce training, access review, contingency plan, incident response. |
| GDPR (if EU patients) | Records of processing, DPIA for health data, processor agreements, retention schedule, DSAR and erasure workflow (which the current schema cannot satisfy because there is no patient entity). |
| Clinical | Named clinical owner, triage threshold approval, disclaimer that this is not a diagnosis, adverse-event and near-miss reporting, escalation contact tree. |
| Consent | No consent capture for processing, SMS/push contact, or terms/privacy acceptance. `mobile_events` telemetry fires on launch with no consent gate. |
| Policies | Privacy policy, terms of service, acceptable use, retention policy, incident response plan, business continuity plan, subprocessor list. |
| Vendor risk | No DPAs/BAAs, no security questionnaires, no subprocessor inventory. |

**Est.** Legal/procurement track; start in parallel with engineering.

### 2.10 PHI in logs and URLs — P1

- Patient ids appear in every URL and query string; Caddy access logs will
  retain them.
- `webhook_logs.detail` stores raw lab payloads (patient id, marker, value) and
  the admin UI renders them; `GET /webhooks/logs` is public today.
- `audit_trail.detail` stores the full lab payload and message metadata.
- No log retention, redaction or access control on log stores.
- Mobile `console.warn` includes error messages from the API.

**Done means** structured logs with a redaction policy, no identifiers in URL
paths where avoidable, restricted log access, defined retention, and no PHI in
client console output in release builds.

**Est.** 2–3 days.

### 2.11 Retention and deletion — P1

No retention job, no soft-delete/erasure path, no legal hold, no export. Cases
and messages are kept forever by default, which is both a privacy risk and a
storage cost. Define retention per record type, implement scheduled deletion
or archival, and provide patient export/erasure once 2.1 exists.

**Est.** 3–4 days.

### 2.12 Backups and disaster recovery — P0

The only persistence is the `hermes_db` volume plus `hermes_uploads`. There is
no `pg_dump` schedule, no off-host copy, no PITR, no restore test and no
documented RPO/RTO. Uploads are on one disk with no replication.

**Done means**

- Managed Postgres (or automated `pg_dump` + WAL archiving) with daily backups
  and point-in-time recovery, encrypted, off-host, different region/account.
- Object storage or a replicated volume for uploads, with lifecycle rules.
- Restore runbook, quarterly restore drill with a recorded result, and defined
  RPO (for example 15 min) and RTO (for example 4 h).

**Est.** 2–3 days plus provider cost.

---

## 3. Product and workflow gaps

### 3.1 Notifications are queued but undeliverable — P0

`dispatchPending` posts to `NOTIFY_WEBHOOK_URL`, which is empty in every
example env. It forwards `deviceTokens` to that sink; there is no Expo Push
call, no APNs/FCM configuration, no SMS provider, and no patient phone number
or email in the database. `apps/mobile/app.json` has no `extra.eas.projectId`,
so `registerPushToken` returns `null` on every device.

**Done means**

- Patient contact details captured and verified (phone for SMS, email
  optional), with channel consent and opt-out.
- Expo Push (or direct APNs/FCM) sending with receipt checking and token
  cleanup on `DeviceNotRegistered`.
- An SMS provider with a registered sender ID, templated messages, delivery
  receipts and cost controls.
- Fallback policy (push → SMS after N minutes), quiet hours, and a maximum
  daily contact frequency.
- Delivery dashboard reflecting real provider status, not just queue state.

**Est.** 5–8 days plus provider contracts.

### 3.2 No patient account lifecycle — P1

No registration, no profile, no clinic selection, no consent screen, no
account deletion, no notification preferences, no language choice, no
accessibility settings. Required for app-store review once accounts exist.

**Est.** 5–7 days (overlaps 1.1).

### 3.3 Queue usability at scale — P1

`GET /cases` returns all cases, newest first, with no pagination, search,
assignment, notes, unread filter, saved views or bulk actions. Client polling
every 30s re-fetches the whole list. At a few thousand cases this becomes slow
and unusable; it also makes the 5-minute sweep and metrics progressively more
expensive.

**Done means** server-side pagination and filtering, indexed queries, an
assigned-to field, and aggregate counts computed in SQL.

**Est.** 3–5 days.

### 3.4 Admin capabilities — P1/P2

Missing user management (see 1.2), clinic management, slot/schedule
management, notification templates, provider configuration, audit search
(currently only per case), data export, and a real "system status" view.
`/admin` metrics are computed in memory over every row.

**Est.** 5–8 days.

### 3.5 Web UX resilience — P2

No `error.tsx`, `loading.tsx` or `not-found.tsx` in `apps/web/src/app`; a
failed fetch falls through to a blank or generic screen. No forgot-password
link. Session expiry is handled by the proxy but the in-page API client's
error path returns a hand-built object that loses the real status
(`apps/web/src/features/shared/api/index.ts`), so query errors can be
misleading. Add error boundaries, skeletons, an error-mapping layer and a
"session expired" recovery flow.

**Est.** 2–3 days.

### 3.6 Accessibility and language — P2

No accessibility audit, no keyboard/screen-reader pass, no focus management in
the drawer or dialogs, no `lang` per locale, no Swahili/i18n scaffolding
despite a Kenyan deployment. Commission an audit against WCAG 2.2 AA and add
translation infrastructure if required.

**Est.** 3–5 days + audit.

### 3.7 File handling — P2

No virus/malware scan, no PDF sanitisation, no checksum, no size/age quota, no
orphan cleanup if a case is deleted, and no storage abstraction (local disk
only), which pins uploads to a single API container and blocks horizontal
scaling. Move to object storage with private buckets and signed URLs, or at
minimum mount shared storage and add a scanning step.

**Est.** 3–4 days.

---

## 4. Reliability and operations

### 4.1 Observability — P0

Nothing reports whether the system is working:

- `/health` returns `{ok:true}` without checking the DB or the outbox.
- No structured request logs, request ids, latency or error rates.
- No error tracking (Sentry or equivalent) in API, web or mobile.
- No uptime monitor or alert route.
- No dashboards for queue depth, SLA breaches, notification failures or job
  runtime. `/metrics` is an in-app business summary, not infrastructure
  metrics.
- Cron failures are silent: the `Cron` callback in `apps/api/src/index.ts` does
  not catch or report errors.

**Done means** Sentry (or equivalent) in all three clients, JSON logs with
request ids and redaction, `/health` (liveness) + `/ready` (DB + migrations),
Prometheus/OpenTelemetry metrics, an external uptime check, and alerts to a
real on-call channel for 5xx rate, cron staleness, notification failure rate
and SLA breach spikes.

**Est.** 3–5 days.

### 4.2 Background jobs are in-process and unsynchronised — P1

The 5-minute cron runs inside the API process. Two replicas would double-run
escalations, reminders and dispatch; `dispatchPending` selects rows and then
updates them without `FOR UPDATE SKIP LOCKED`, so concurrent workers can send
the same notification twice. No job history, retry limits or dead-letter view.

**Done means** a separate worker (or advisory-lock/`SKIP LOCKED` claiming),
job run records, alerting on staleness, and idempotent sends.

**Est.** 3–4 days.

### 4.3 No graceful shutdown or resource limits — P2

No SIGTERM handling, no drain, no statement/query timeouts, no container
memory or CPU limits, no readiness gating before Caddy routes traffic. Add
signal handling, pool/query timeouts and compose resource limits.

**Est.** 1–2 days.

### 4.4 CI/CD and migrations — P0

`.github/workflows/deploy.yml` is fully commented out. There is no pipeline
that installs, lints, typechecks, tests, builds images, pushes them or applies
migrations. Compose references `ghcr.io/hermes/*` images with no build or push
workflow. No staging environment, no smoke test after deploy, no rollback
procedure, no migration safety check (drizzle migrations are applied with
`db:migrate` by hand).

**Done means**

- CI on every PR: install with frozen lockfile, lint, format check, typecheck,
  tests, both builds, Docker build, dependency audit.
- CD: build and push tagged images, run migrations as a one-shot job, deploy,
  smoke test `/health`, `/ready` and a sign-in flow, then promote.
- Staging environment with synthetic data; no production data in staging.
- Documented rollback (previous image tag + backward-compatible migrations)
  and a migration policy (expand/contract, no destructive statements in the
  same release).
- Branch protection and required checks.

**Est.** 3–5 days.

### 4.5 Docker packaging — P1

`Dockerfile.api` and `Dockerfile.web` copy the whole repo and `node_modules`
into a single-stage image, run as root, and have no image labels or health
metadata. `.dockerignore` excludes `.env`, so the web build has no
`NEXT_PUBLIC_API_URL` at build time and is likely to fail its env validation —
verify with `docker build` before relying on it. Healthchecks call `wget`,
which may not exist in `oven/bun` images; verify in the container.

**Done means** multi-stage builds, non-root user, read-only root filesystem
where possible, build args for public env, pinned base images by digest, and a
container-level healthcheck that actually runs.

**Est.** 2–3 days.

### 4.6 Capacity and load — P1

No load test has been run. Expected unknowns: queue query cost without
indexes, metrics over all rows, upload throughput, Postgres pool of 15, cron
runtime as cases grow, and mobile cold-start. Define target volumes (cases per
clinic per day, concurrent coordinators, notification fan-out), run k6/artillery
against staging, and record the breaking point.

**Est.** 2–4 days.

---

## 5. Mobile app release readiness

The app runs, but it is not shippable to a store.

| Item | Status |
| --- | --- |
| Patient auth | Missing (see 1.1) — client-supplied id, no sign-out |
| Signing | `android/app/build.gradle` release builds use the **debug keystore**; no upload key, no Play App Signing, no iOS credentials |
| Versioning | `versionCode 1`, `versionName "1.0.0"`, no versioning policy |
| EAS | No `eas.json`; `app.json` has no `extra.eas.projectId`, so push tokens are never obtained |
| Environment | `EXPO_PUBLIC_API_BASE` defaults to `localhost:8001`; `mobileEnvSchema` exists but is unused; HTTP is allowed |
| OTA | `expo-updates` dependency present but no channel/runtime configuration |
| Crash reporting | None (no Sentry/Crashlytics) |
| Privacy | No privacy policy link, no consent, no data-safety disclosure, no account deletion |
| Store assets | No screenshots, feature graphic, description, support URL or review notes in the repo |
| Permissions | Notifications, Face ID and calendar permissions requested with no pre-permission explanation or fallback copy review |
| Security | No certificate pinning, no jailbreak/root signal, no screenshot protection for results |
| Offline | Screens show an error string and a retry; no cached last-known result or offline state |
| Deep links | Custom scheme only; no universal/app links, no cold-start notification handling test |
| iOS | No committed iOS project or privacy manifest; iOS build path untested |

**Done means** a release pipeline (EAS Build/Submit or Fastlane), production
keystore in a secret manager, store listings, privacy manifest and data-safety
form, crash reporting, forced-update mechanism, and a smoke test on a physical
iOS and Android device against the production API.

**Est.** 5–8 days plus store review time.

---

## 6. Marketing site

`apps/www` is a static Astro page that is not part of the compose stack and has
no deployment pipeline.

- **No legal pages:** no `/privacy`, `/terms`, `/security` or `/contact`.
  Publishing a health product without them is not viable.
- **No contact route:** no email, phone, address or company entity anywhere.
- **Claims vs reality:** "signed webhook endpoints" (not signed), SLA windows
  24h/72h vs API 48h/168h, "SMS fallback" (no SMS provider), patient
  acknowledgment (no patient auth).
- **Dashboard link defaults to `http://localhost:3100`** when
  `PUBLIC_DASHBOARD_URL` is unset; production build must fail instead of
  shipping a localhost link.
- **No `robots.txt`, sitemap or analytics**; `og.png` exists but there is no
  per-page image.
- **No cookie/analytics consent** (needed once analytics is added).
- **TLS/hosting:** not in compose, no host configured, no cache headers.

**Est.** 3–5 days including legal copy review.

---

## 7. Testing and verification

Current automated coverage is 14 unit tests covering FHIR/HL7 mapping, triage
grading and SLA windows (`apps/api/tests`). Everything else is unverified.

| Layer | Needed |
| --- | --- |
| API unit | Booking conflicts, dedupe race, SLA sweep idempotency, notification backoff, storage validation |
| API integration | Auth guards on every route, cross-tenant access, webhook signature failures, upload/download permissions, closure/referral transitions |
| Database | Migration up/down on a clean DB, constraint behaviour, seed idempotency |
| Web | Component tests for queue filters and forms; Playwright happy path (sign in → case → acknowledge → book → close) |
| Mobile | Detox/Maestro flows: biometric gate, result, booking, message, push deep link |
| Security | Dependency audit, secret scan, SAST, third-party penetration test before launch |
| Performance | Load test of queue, ingestion and dispatch at target volume |
| Accessibility | WCAG 2.2 AA audit of dashboard and mobile |
| Clinical UAT | Scripted scenarios signed off by a clinician and a coordinator |

Add coverage reporting and a CI gate on changed lines; do not chase a global
percentage.

**Est.** 8–12 days for a credible pre-launch suite, plus the external pen test.

---

## 8. Suggested execution plan

### Phase 1 — Close the bleeding (week 1–2)

1. Lock down all routes (1.3), close sign-up (1.2), remove the `?patientId=`
   download bypass (1.4).
2. Sign webhooks (1.5) or disable public ingestion until signed.
3. TLS + headers (1.7), explicit CORS (1.8), production env boot guards (1.9).
4. Turn CI back on with lint/typecheck/test/build (4.4, first half).
5. Turn on error tracking and uptime checks (4.1, minimum viable).

### Phase 2 — Identity and tenancy (week 2–5)

6. Patient identity + sessions (1.1) with mobile token storage and sign-out.
7. `patients`, `clinics`, `staff_clinics` and FKs (2.1); staff invite flow and
   admin user management (1.2); clinic scoping (1.6).
8. Audit PHI reads/downloads and auth events (1.13).

### Phase 3 — Make the loop real (week 4–7)

9. Patient contact capture, push, SMS and consent (3.1).
10. Real booking availability, cancellation and clinic match (2.4).
11. Referral handoff with ownership (2.5); closure attribution (2.6).
12. Triage rule versioning and clinical sign-off (2.7); align SLA copy (2.8).

### Phase 4 — Operate it (week 6–9)

13. Backups, PITR, uploads replication and a restore drill (2.12).
14. Separate worker with `SKIP LOCKED`, job history and alerts (4.2).
15. Metrics/logs/alert routes and dashboards (4.1); load test (4.6).
16. CD with migrations, staging, smoke tests and rollback (4.4); hardened
    images (4.5).

### Phase 5 — Launch readiness (week 8–10)

17. Mobile release pipeline, store listings, privacy manifest (section 5).
18. Legal pages, DPA/BAA, DPIA, retention and incident response (2.9, 2.11).
19. Pen test, accessibility audit, clinical UAT (section 7).
20. Support model, on-call rota, runbooks and training.

Rough total: **9–12 weeks** for a small team, assuming legal and clinical
review run in parallel. A single-clinic closed pilot could start after Phase 1
and 2 with written risk acceptance and synthetic or consented data.

---

## 9. Go/No-Go checklist

Copy this into the release ticket. Every line must be checked, with a name and
date.

**Security**

- [ ] No route returns PHI without an authenticated principal (route-inventory test)
- [ ] Patient authentication shipped; cross-patient access tested
- [ ] Staff sign-up closed; invites verified; admins can deactivate users
- [ ] Webhooks authenticated and replay-protected
- [ ] HTTPS enforced with HSTS; security headers verified
- [ ] CORS allow-list; foreign-origin mutation returns 403
- [ ] Production env guards for API, web and mobile
- [ ] Secrets in a managed store; rotation documented
- [ ] Rate limits on auth, ingestion, messaging and upload
- [ ] Pen-test findings closed or risk-accepted

**Data and compliance**

- [ ] `patients`/`clinics`/`staff_clinics` in place with FKs; tenant isolation tested
- [ ] Audit trail append-only for case events and PHI access
- [ ] Retention/deletion implemented and documented
- [ ] Backups automated off-host; restore drill passed
- [ ] DPA/BAA signed with every subprocessor; DPIA complete
- [ ] Privacy policy, terms, contact and consent flows live
- [ ] Clinical owner has approved triage rules, SLAs and escalation tree
- [ ] Incident response and breach-notification runbooks written and rehearsed

**Delivery and operations**

- [ ] CI green (lint, typecheck, tests, builds, audit)
- [ ] CD applies migrations and smoke-tests; rollback tested
- [ ] Staging environment exists; no production data in it
- [ ] Error tracking, uptime checks and alerts firing to a real channel
- [ ] `/health` and `/ready` used by the proxy/load balancer
- [ ] Load test at target volume with recorded results
- [ ] Support process, on-call rota and user documentation ready

**Mobile and web**

- [ ] Production signing keys and EAS project configured
- [ ] Push and SMS verified end to end on real devices
- [ ] Store listings, privacy manifest, data-safety form and account deletion
- [ ] Crash reporting and forced-update path
- [ ] Accessibility audit passed
- [ ] Marketing site deployed on its domain with the correct dashboard link
- [ ] Clinical UAT signed off by a coordinator and a clinician

---

## 10. Quick reference: endpoint auth today

| Route | Auth |
| --- | --- |
| `POST /webhooks/lab`, `/fhir`, `/hl7` | none |
| `GET /routing-rules` | none |
| `PUT/DELETE /routing-rules` | staff |
| `GET /cases`, `/cases/:id`, `/cases/:id/messages` | none |
| `POST /cases/acknowledge` | none |
| `POST /cases/:id/messages`, `/outreach`, `/escalate` | staff |
| `GET/POST /patients/:patientId/*` | none (path-segment ownership only) |
| `GET /clinics/:clinicId/slots` | none |
| `POST /bookings` | none |
| `GET/POST /cases/:id/attachments` | staff |
| `GET /attachments/:id` | staff, or none with `?patientId=` |
| `POST /referrals`, `/cases/close` | staff |
| `GET /metrics`, `/audit/:caseId` | none |
| `GET /notifications`, `/notifications/stats` | none |
| `POST /notifications/dispatch` | staff |
| `GET /webhooks/logs` | none |
| `GET /health` | none (intended) |

The default for new routes should be "guarded"; this table should be generated
by a test, not maintained by hand.

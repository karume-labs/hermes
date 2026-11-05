# Multi-Platform Ecosystem, Core Features & User Flows

## 1. Multi-Platform Ecosystem

### Patient Mobile App (Cross-Platform Mobile)

**Purpose:** The secure, localized hub where patients receive push notifications, authenticate via biometrics (FaceID/Fingerprint), review screening results in plain language, book appointments, and track their care status in real-time.

### Clinician & Care Coordinator Dashboard (Web App - Desktop Optimized)

**Purpose:** The command center for primary care doctors, nurses, and care coordinators to monitor active screening queues, track SLA countdowns, manage escalations, and execute clinical sign-offs.

### Admin & Laboratory Integration Portal (System-to-System & Web Dashboard)

**Purpose:** Manages incoming lab feeds via secure webhooks/APIs (HL7/FHIR), monitors institutional compliance, tracks conversion metrics, and configures routing logic.

## 2. Core Feature Set

- **Automated Ingestion & Triage Pipeline:** Ingests lab results, grades severity (Routine, Actionable, Urgent), assigns SLA time-frames, and routes cases to the appropriate primary care clinic.
- **Encrypted Push & SMS Notification Engine:** Dispatches immediate, secure push alerts to the mobile app (backed by fallback SMS) with clear calls to action.
- **Biometric-Secured Patient Dashboard:** Protects sensitive health data behind device-level biometrics, offering a clean, jargon-free summary of actionable results.
- **In-App Slot Booking & Calendar Sync:** Integrates with clinic scheduling systems to let users select and confirm appointment slots directly inside the app, syncing reminders to their local device calendar.
- **Automated Escalation & SLA Tracking:** Tracks cases against countdown timers; automatically flags stalled or unacknowledged mobile alerts and escalates them to care coordinators.
- **Cross-Provider Hand-Off & Documented Closure:** Maintains a shared audit trail across care settings (Lab → Primary Care → Specialist → Treatment) until final clinical sign-off.

## 3. Comprehensive User Flows

### Flow 1: The Patient Journey (Mobile-First Experience)

1. **Trigger & Push Notification:**
   A patient completes an annual health screening at a partner facility. An actionable result (e.g., an elevated metabolic marker) is logged.
   The system sends a secure push notification to the patient's mobile app: "You have an important update regarding your recent health screening. Tap to view details."

2. **Secure Authentication & Plain-Language Review:**
   The patient taps the push notification, opening the app and authenticating instantly via biometrics (FaceID/Fingerprint).
   They land on a dedicated "Care Action" screen showing a clear, plain-language summary of the result, explaining what it means and why timely follow-up matters (distinguishing screening from diagnosis).

3. **Frictionless Action Selection & Booking:**
   The app presents actionable next steps: "Book a confirmatory consultation at your primary clinic" or "Request a telehealth review."
   The user selects a preferred slot from available calendar windows, confirms the booking with a single tap, and automatically saves the event to their phone's local calendar with built-in prep instructions.

4. **Active Tracking & Guidance:**
   The mobile app displays a visual "Care Journey" progress tracker (e.g., Result Received → Appointment Booked → Specialist Consultation → Completed). Automated reminders nudge the user 24 hours before their visit.

5. **Loop Closure:**
   After attending the appointment and finalizing a treatment or surveillance plan with the clinician, the app updates to show Case Closed, providing a reassuring summary of their ongoing care path.

### Flow 2: The Care Coordinator / Clinician Journey (Queue Management & Escalation)

1. **Queue Inspection:**
   The coordinator opens the Desktop Dashboard to monitor the active Loop-Closure Queue, filtered by SLA urgency and risk severity.

2. **Handling Unacknowledged Mobile Alerts:**
   If a patient receives a push notification but fails to open or acknowledge it within a set window (e.g., 48 hours for actionable results), the system flags the case as Pending Mobile Acknowledgement and shifts it to the coordinator's attention queue.

3. **Intervention & Outreach:**
   The coordinator reviews the case history, sees that the push notification was unread, and triggers a direct in-app secure message or a secondary phone outreach workflow.

4. **Referral Hand-Off & Tracking:**
   Once the patient attends their visit and a specialist referral is generated, the coordinator links the downstream provider data to the case file.

5. **Documented Closure:**
   Upon receiving clinical sign-off from the treating physician, the coordinator clicks "Close Case," submitting the required clinical evidence. The system archives the case and updates population health registers.

### Flow 3: The System Administrator Journey (Governance & Performance)

1. **Performance Overview:**
   The admin reviews ecosystem-wide metrics on the analytics dashboard: Average Time to Mobile Acknowledgment, Referral Conversion Rates, Mobile App Retention/Engagement, and SLA Breach Percentages.

2. **System Health & Exception Audits:**
   The admin inspects webhook delivery logs, failed lab integrations, or mobile push notification delivery rates, ensuring system reliability across all touchpoints.

## 4. Tech Stack Adaptation

Adapt the proven stacks from `vaunt` (web + API) and `pennywise` (mobile) to this repo. Both references use **Bun as runtime + package manager**, **TypeScript**, **Biome for lint/format**, **Elysia + TypeBox for the API**, and **Bun workspaces** (`apps/*`, `packages/*`).

This repo has `apps/web` (`next 16.4.5`, `react 19.3.0`) for web dashboards plus `apps/mobile` as an Expo app (`expo ~56.0.13`, `react-native 0.85.3`, `expo-router`, `uniwind`, `rn-primitives`). Web/API follow `vaunt`, mobile follows `pennywise`.

### 4.1 Shared foundation (from both repos)

- **Runtime / monorepo:** Bun workspaces with single root `bun.lock`. Run everything from root via `bun run --cwd apps/<name>`. Keep `apps/*` for deployables, `packages/*` for shared `db` / `types` / `validators`.
- **Language / quality:** TypeScript (~6.0), `biome check` + `biome format`, `tsc --noEmit`, `bun test`. Add `lefthook.yml` for pre-commit hooks as in both repos.
- **Validation:** TypeBox schemas as single source of truth (`@sinclair/typebox`, `drizzle-typebox` for DB-derived schemas). Validate on boot with hard fail; reuse for Elysia routes and Eden client types.
- **Dates:** `dayjs` for SLA countdowns, booking windows, and 24h/48h reminder logic.

### 4.2 Clinician Dashboard + Admin Portal + API (adapted from `vaunt`)

`vaunt` is a `vaunt--monorepo` with `apps/web` (Next.js frontend) + `apps/api` (Elysia backend) + `packages/db|types|validators` + `infra/` (Caddy + Docker).

Apply to this ecosystem:

- **Web (Clinician queue + Admin portal):** Next.js 16 + React 19 in `apps/web`:
  - UI/data: `@mantine/core|hooks|form|notifications|dates|charts|modals`, `@tanstack/react-query` for queue polling/caching, `@tanstack/react-table` for Loop-Closure Queue, `react-hook-form + @hookform/resolvers` for sign-off / routing-rule forms, `nuqs` for shareable queue filters (SLA, severity), `recharts` for conversion / SLA-breach / acknowledgment metrics, `@tabler/icons-react`, `embla-carousel` where needed, `postcss-preset-mantine`.
  - Typed API access: `@elysiajs/eden` + workspace `@vaunt/api`-style shared types — coordinator actions (`close-case`, `escalate`, `link-referral`) and admin config calls stay end-to-end typed.
- **API (lab ingestion, triage, SLA, notifications):** Bun + `elysia` in `apps/api`:
  - Auth: `better-auth` for clinician/coordinator/admin sessions; device-token auth for mobile.
  - DB: `drizzle-orm` + PostgreSQL via `postgres-js` (matches Vaunt's pooled `client.ts`; `drizzle-kit` for `db:generate|push|migrate|studio`). `packages/db` owns schema/migrations; no duplicate table definitions in features.
  - Lab feeds: secure Elysia webhooks/APIs for HL7/FHIR (with `@elysiajs/cors`, `elysia-helmet`), delivery-log table for admin audit, retry queue for failed integrations.
  - Triage/SLA: severity grading (Routine / Actionable / Urgent) + SLA assignment on ingest; `croner` jobs for countdowns, 48h unacknowledged-mobile-alert detection, and escalation to coordinator queue.
  - Comms: `nodemailer` for email fallback + push/SMS provider for `expo-notifications` + SMS fallback; store delivery receipts for System Health audits.
  - Files/evidence: `@aws-sdk/client-s3` (presigned URLs) for clinical-evidence attachments on closure.
  - Infra: `infra/docker/docker-compose.yml` + `infra/caddy/` reverse proxy pattern from `vaunt`, GHCR images (`elysia-api`, `next-web`), `/health` checks, `tunnel.sh`-style SSH access for prod DB/API if needed.

### 4.3 Patient Mobile App (adapted from `pennywise` `apps/mobile`)

`pennywise` `apps/mobile` (`@pennywise/mobile`) is Expo `~57.0.31` + `react-native 0.86.3` + `expo-router/entry` + React 19, with local-first Drizzle + SQLite. Mirror that here in `apps/mobile/`:

- **Framework:** Expo + `expo-router` (file = route: `apps/mobile/app/`), React Native, `react 19.2.3`. Keep native config in `app.json` + `plugins/` (config plugins) — never hand-edit `android/`/`ios/` (per `REACT-NATIVE.MD`).
- **UI:** `uniwind` + `tailwindcss ^4.2.1` + `tailwind-merge` + `class-variance-authority` + `clsx`, `@rn-primitives/*` (dialog, bottom-sheet via `@gorhom/bottom-sheet`, progress, select, tabs, etc.), `lucide-react-native`, `react-native-svg`, `victory-native` for Care Journey tracker, `sonner-native` for toasts, `@shopify/flash-list` for result/appointment lists, `react-native-reanimated`, `gesture-handler`, `safe-area-context`, `screens`.
- **Care-critical device APIs:**
  - Push: `expo-notifications` for secure screening alerts + fallback SMS path.
  - Biometrics: `expo-local-authentication` (FaceID/Fingerprint gate on Care Action screen) + `expo-secure-store` + `expo-crypto` + `@noble/ed25519|hashes` for token/key storage.
  - Booking/calendar: `expo-linking` (deep link from push → Care Action), `react-native-ui-datepicker` for slot picking, device-calendar sync for confirmations + 24h reminders, `expo-haptics` for confirmation feedback.
  - Offline/tracking: `expo-sqlite` + `drizzle-orm` local-first cache of results/appointments/journey state (`src/db/schema.ts` only, `drizzle-kit generate/studio`), `zustand` stores, `expo-network` awareness, `expo-background-downloader` / `react-native-blob-util` for result PDFs, `expo-document-picker` + `expo-sharing` + `expo-clipboard` for prep instructions, `expo-font` + `expo-image` + `expo-splash-screen` + `expo-status-bar` + `expo-system-ui`, `expo-updates` for OTA fixes, `expo-constants` for env.
- **Env / structure:** `process.env` only in `src/shared/env/` (validated env, `EXPO_PUBLIC_API_BASE` via `update-ip` script pattern), feature-folder layout `src/features/<domain>/{components,hooks,services}` + `src/shared/`, absolute `@/` imports, pure logic in `.ts` (testable via `bun test`), ~150-line file cap, comments explain failure modes.
- **Gaps to close in current `apps/mobile/` starter:** add `expo-notifications`, `expo-local-authentication`, `expo-secure-store`, `expo-crypto`, `expo-sqlite`, `drizzle-orm`, `zustand`, `dayjs`, `@shopify/flash-list`, `victory-native`, `sonner-native`, `@gorhom/bottom-sheet`, `expo-document-picker`, `expo-sharing`, `expo-file-system`, `expo-linking` (already present — keep), `expo-network`, `expo-updates` (already present — keep), plus Elysia Eden client for typed `apps/api` calls.

### 4.4 Feature → stack mapping

| Feature (§2) | Web/API implementation (`vaunt` pattern) | Mobile implementation (`pennywise` pattern) |
| --- | --- | --- |
| Ingestion & triage | Elysia webhooks + TypeBox validation, Drizzle/Postgres, severity + SLA assignment, routing to clinic | — (receives triaged case via Eden/REST + push) |
| Push & SMS engine | API dispatch + delivery-receipt table, `croner` retries, Nodemailer/SMS fallback | `expo-notifications` handling, deep link to Care Action, unread → Pending Mobile Acknowledgement |
| Biometric dashboard | Better Auth session + role scope for queue access | `expo-local-authentication` gate + `expo-secure-store`, plain-language summary UI |
| Slot booking + calendar sync | Clinic scheduling integration in API, slot availability endpoint, booking confirmation | Date-picker + slot list, one-tap confirm, local calendar entry + prep instructions |
| Escalation & SLA tracking | `croner` SLA timers, TanStack Query/Table queue with SLA filters, `nuqs` shareable views | Read-only SLA status + reminder nudges; unread triggers coordinator queue |
| Hand-off & closure | Referral-link + Close Case flow (RHF + evidence upload to S3), audit trail, register updates | Journey tracker (Received → Booked → Consultation → Completed → Closed) via local SQLite + server sync |

### 4.5 Suggested repo layout (target)

```text
apps/
  web/      # Next.js 16 clinician + admin dashboards (vaunt apps/web pattern)
  api/      # Bun + Elysia ingestion/triage/SLA/notify API (vaunt apps/api pattern)
  mobile/   # Expo patient app (pennywise apps/mobile pattern)
packages/
  db/         # Drizzle schema/migrations (server Postgres + mobile SQLite shared types where safe)
  types/
  validators/ # TypeBox shared contracts (lab payloads, booking, closure evidence)
infra/
  caddy/
  docker/
scripts/
  update-ip.ts # pennywise LAN-IP sync for EXPO_PUBLIC_API_BASE in mobile .env
```

## 5. Implementation status (this repo, pennywise-inspired, not 1:1)

Root is workspace orchestration only; the apps live under `apps/`.

```text
./ (Bun workspaces: apps/*, packages/*)
  apps/web/
    next.config.ts        # standalone output
    src/app/page.tsx      # ecosystem entry → /queue + /admin
    src/app/queue/page.tsx # Flow 2: Loop-Closure Queue (?severity=&status=)
    src/app/admin/page.tsx # Flow 3: avg ack time, conversions, SLA breaches
    src/lib/api.ts        # web → API client (NEXT_PUBLIC_API_URL)
  apps/api/src/
    index.ts              # Elysia composition + 5-min SLA sweep/dispatch
    features/care-loop/   # routers + services (triage, case-repository, sla-sweep)
    features/booking/     # slot seeding + transactional booking (row lock)
    features/notify/      # notification outbox + webhook delivery log
    features/shared/env/  # validated env (PORT, DATABASE_URL, API_SECRET, NOTIFY_WEBHOOK_URL)
  packages/types|validators|db # shared DTOs, TypeBox contracts, Drizzle schema + migrations + seed
  apps/mobile/app/
    index.tsx             # Flow 1 step 1-2: push deep links, case list, demo identity switcher
    care-action.tsx       # Flow 1 step 2: biometric gate + plain-language review
    booking.tsx           # Flow 1 step 3: real slots, confirm, device-calendar sync
    journey.tsx           # Flow 1 step 4-5: Received → Booked → Consultation → Completed
    messages.tsx          # secure thread with the care team
  apps/mobile/lib/care-api.ts # mobile → API client (EXPO_PUBLIC_API_BASE)
  infra/docker|infra/caddy # vaunt-style deploy (GHCR + Caddy, /api/* → :8001)
  scripts/update-ip.ts    # pennywise-style LAN IP sync for Expo
```

Run: `bun install` → `bun run dev:api` (:8001) + `bun run dev` (:3000) + `bun run dev:mobile`. Verify: `bun run typecheck`, `bun run test`, `bun run build`.

## 6. Connected end-to-end (implemented)

- Web: Next.js + Mantine + TanStack Query + nuqs at `/`, `/queue` (nuqs severity/status filters, ingest demo, escalate, per-case links), `/cases/[id]` (slots, book, referral hand-off, documented closure), `/admin` (metrics via treaty). Providers wrap Mantine + NuqsAdapter + QueryClient.
- API: Elysia feature routers (`/webhooks/lab`, `/cases`, `/bookings`, `/clinics/:id/slots`, `/referrals`, `/cases/close`, `/metrics`, `/audit/:caseId`) with TypeBox validation, typed errors + `onError` envelope, 5-min `croner` SLA sweep, coordinator guard (enforced in production, open in dev/test).
- Mobile: `apps/mobile/` Expo app with `expo-local-authentication` + `expo-secure-store` biometric gate (demo bypass when no biometrics are enrolled), `expo-notifications` push registration + 24h reminder scheduling, `expo-calendar` visit sync, typed `careApi` client over the patient endpoints (`/patients/:id/cases`, `/acknowledge`, `/read`, `/devices`, `/events`), deep-link `care-action?caseId=` acknowledge flow, live journey timeline and a secure message thread. Identity is still client-supplied (SecureStore, demo `patient-1..4-clinic-1`); the server enforces case ownership, but there is no Better Auth patient session yet.
- Data: `packages/db` feature schemas (`uuid` PKs, `lifecycleTimestamps`, `$onUpdate`, relations, single `client.ts`) for `care_cases`, `audit_trail`, `bookings`, `slots`, `notifications`, `webhook_logs`. Migrations live in `packages/db/src/migrations`; `packages/db/src/seed/index.ts` composes feature seeders (`src/care-loop/seed`, `src/booking/seed`) behind `--care-loop`/`--booking`/`--force` and is idempotent. API reads/writes go through feature repositories, so API DTO shapes are unchanged.
- Delivery: every triage push is written to the notification outbox (`queued`), drained by the 5-minute job when `NOTIFY_WEBHOOK_URL` is set; inbound lab calls are recorded in `webhook_logs`. With no provider configured rows stay `queued` rather than being marked sent. `/admin` renders both tables.
- Deploy: `infra/docker/docker-compose.yml` (Postgres 17 + API + web + Caddy), Dockerfiles in `infra/docker/`, `tunnel.sh`, `.github/workflows/deploy.yml` CI (`install → lint → typecheck → test → build`, plus a migration job against a throwaway Postgres service).

### Persistence setup

```bash
cp apps/api/.env.example apps/api/.env   # DATABASE_URL=postgresql://…/hermes
bun run db:generate   # after schema edits
bun run db:migrate    # apply packages/db/src/migrations
bun run db:seed       # demo cases + clinic slots (idempotent)
```

Local note: this workspace's dev database runs on port `5434` (`postgres/postgres`, db `hermes`) because `5432`/`5433` were already taken; compose uses an internal `postgres:5432` and injects `DATABASE_URL` for the API container.

Verified: `bun run format`/`bun run lint` clean, `bun run typecheck` (web+api+mobile+db+validators+types) clean, `bun run test` 14 pass, `bun run build` prerenders `/ /queue /admin` with `/cases/[id]` partial, and a live Postgres-backed loop (ingest → acknowledge → slots → book → refer → message → close → metrics → notifications → webhook log) returns a closed case with its audit trail, a queued push, and a booking conflict on re-book. The web flows were also walked in a browser against the running API (booking, referral, secure message, closure, `/admin` sections, no console errors).

Not verified here: Docker images/compose (no daemon in this environment) and the Expo app on a device/emulator (no simulator available) — mobile is covered by typecheck and API contract tests only.

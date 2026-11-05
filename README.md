# Hermes Care Loop

Screening → sign-off loop closure for clinics. Bun monorepo: Next.js web
(clinician queue + admin) in `apps/web`, Astro marketing site in `apps/www`,
Elysia API in `apps/api`, Expo patient app in `apps/mobile`, shared contracts
in `packages/*`. Conventions in `AGENTS.md`; product spec in
`docs/multi-platform-ecosystem.md`.

## Layout

```text
apps/
  web/      # Next.js 16 clinician queue + admin (Mantine, TanStack Query, nuqs)
  www/      # Astro landing page (Tailwind v4, no client framework)
  api/      # Elysia ingestion, triage, booking, notifications, metrics
  mobile/   # Expo patient app (expo-router)
packages/
  db/       # Drizzle schema, migrations, per-feature seeders
  types/    # shared DTOs
  validators/ # TypeBox contracts
infra/
  docker/   # Dockerfiles + docker-compose (Postgres 17, API, web, Caddy)
  caddy/    # reverse proxy: /api/* → api:8001
scripts/    # demo seeding + Expo LAN-IP sync
```

Root `package.json` only orchestrates workspaces; every script runs with
`--cwd` into `apps/*` or `packages/*`.

## Quickstart

```bash
bun install
cp apps/api/.env.example apps/api/.env      # DATABASE_URL + BETTER_AUTH_SECRET
cp apps/web/.env.example apps/web/.env      # NEXT_PUBLIC_API_URL
cp apps/mobile/.env.example apps/mobile/.env # EXPO_PUBLIC_API_BASE
bun run db:migrate  # apply packages/db/src/migrations
bun run db:seed     # demo cases, clinic slots and staff accounts (idempotent)
bun run dev:api     # Elysia API on :8001
bun run dev         # Next.js web on :3000
bun run dev:mobile  # Expo app in apps/mobile
bun run dev:www     # Astro landing page on :4322
bun run seed:demo   # 3 demo lab cases through the API
```

Open [http://localhost:3000/sign-in](http://localhost:3000/sign-in) and use a
seeded account (`coordinator@hermescare.test` / `admin@hermescare.test`,
password `hermes-demo`). `/queue` is the Loop-Closure Queue and `/admin` holds
governance metrics, delivery health, the webhook log and routing rules.

## Staff auth

`apps/api` mounts **Better Auth** at `/auth/*` with the Drizzle adapter
(`user`, `session`, `account`, `verification` in `packages/db/src/auth/schema`).
Sign-up is open: new staff start as `coordinator`; promote an account to
`admin` to unlock `/admin` (the dashboard's `proxy.ts` enforces the role).
Google sign-in is optional — set `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
on the API and `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true` on the web app, and the
"Continue with Google" button appears on both auth pages.

```bash
# rotate/seed credentials (Vaunt pattern: accounts are created through Better Auth)
ADMIN_EMAIL=admin@clinic.test ADMIN_PASSWORD=... bun run db:seed -- --auth
```

`BETTER_AUTH_SECRET` must be a long random string in production; the API,
the seeder and the web session check all read it from the API env.

## Landing page

`apps/www` is the Astro marketing site: hero, the four-step loop, platform
features, the two surfaces, SLA/governance copy and an FAQ that is also emitted
as FAQPage JSON-LD. It is static — `bun run build:www` writes `apps/www/dist`.

```bash
bun run dev:www            # http://localhost:4322
bun run build:www          # static build
```

The "Open dashboard" buttons read `PUBLIC_DASHBOARD_URL` at build time and fall
back to `http://localhost:3100`. Set it to the deployed dashboard origin, and
keep `site` in `apps/www/astro.config.mjs` in sync with `SITE_URL` in
`apps/www/src/lib/constants.ts` so canonical and share URLs stay correct.

## Mobile patient app

`apps/mobile` is the Expo (SDK 56) patient surface: push deep links into a
biometric-gated result summary, plain-language guidance, in-app booking with a
24h reminder written to the device calendar, a live care-journey timeline, and
a secure message thread with the care team.

```bash
bun run dev:mobile   # Expo dev server (press i / a, or scan the QR on device)
bun run update-ip    # point EXPO_PUBLIC_API_BASE at this machine's LAN IP
```

Push needs an EAS `projectId` in `app.json` (`extra.eas.projectId`); without it
the app skips token registration and the demo continues with in-app alerts.
Devices without enrolled biometrics get a worker-documented demo bypass, and
the demo identity switcher cycles `patient-1..4-clinic-1` so each seeded case
can be walked end to end. Staff sessions use Better Auth; patient identity is
still client-supplied — the server enforces case ownership on the patient
routes.

## Database

Postgres via `drizzle-orm` + `postgres-js`, owned by `packages/db`
(`src/<feature>/schema`, migrations in `src/migrations`, seeders in
`src/<feature>/seed`).

```bash
bun run db:generate   # after schema edits
bun run db:migrate    # apply committed SQL
bun run db:seed       # all features; skips populated tables
bun run db:seed -- --care-loop   # one feature (also --booking, --auth)
bun run db:seed -- --force       # wipe demo rows, then reseed
bun run db:seed:fresh # migrate + force seed
bun run db:studio     # drizzle studio
```

Pushes queue in the `notifications` outbox; set `NOTIFY_WEBHOOK_URL` to a
provider sink and the 5-minute job drains it. Unset means rows stay `queued`.
`infra/docker/docker-compose.yml` runs Postgres 17 next to the API.

## Verify

```bash
bun run format
bun run lint       # biome check
bun run typecheck  # web + api + mobile + db + validators + types
bun run test       # triage unit tests
bun run build      # production Next.js build
```

## Deploy

`infra/docker/docker-compose.yml` + `infra/caddy/Caddyfile` (Caddy fronts
`:80/443`, `/api/*` → API; Postgres 17 with a named volume sits behind the
API healthcheck). Images build from `infra/docker/Dockerfile.{api,web}`; the web
image runs the Next standalone server traced from the workspace root. CI in
`.github/workflows/deploy.yml` runs install → lint → typecheck → test → build,
then applies migrations against a throwaway Postgres service.

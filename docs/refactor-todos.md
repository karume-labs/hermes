# Contract, data-flow and dashboard refactor — live board

Tracking the Vaunt-aligned refactor. Statuses flip as work lands; `VERIFY` covers
format, lint, typecheck, tests, build and the browser/API walkthroughs.

## A. Shared contracts

| # | Task | Status |
| --- | --- | --- |
| A1 | `packages/db`: Better Auth tables (`user`, `session`, `account`, `verification`) + migration 0003 | done |
| A2 | `packages/types`: derive select/insert models from Drizzle, serialized DTOs, composites | done |
| A3 | `packages/validators`: split per domain, TypeBox messages, shared form schemas (sign-in, sign-up) | done |
| A4 | API: DTO serializers typed by shared contracts | done |
| A5 | API: Better Auth mounted at `/auth/*`, async session guard, role checks | done |
| A6 | Seeding: `--auth` flag creates accounts through `auth.api.signUpEmail` (Vaunt pattern) | done |
| A7 | Web auth: sign-in, sign-up, Google opt-in, session hook, proxy gate | done |

## B. Web (Vaunt conventions)

| # | Task | Status |
| --- | --- | --- |
| B1 | Deps: react-hook-form, @hookform/resolvers, @tanstack/react-table, @mantine/dates, @tabler/icons-react, better-auth | done |
| B2 | `proxy.ts` gate (Better Auth cookie + role) | done |
| B3 | AppShell + sidebar/navbar + user menu + page header | done |
| B4 | Shared table kit (DataTable, DataToolbar, skeleton) | done |
| B5 | Feature folders: auth, queue, cases, admin, shared | done |
| B6 | Sign-in + sign-up screens (RHF + TypeBox) | done |
| B7 | Queue page: toolbar + table + SLA/ack columns | done |
| B8 | Case page: appointment/referral/closure forms (RHF + TypeBox), messages, audit | done |
| B9 | Admin pages: metrics, delivery, webhook log, routing (form) | done |

## C. Mobile (Pennywise conventions)

| # | Task | Status |
| --- | --- | --- |
| C1 | Move to `src/` with `app/`, `features/care-loop`, `shared/` | pending |
| C2 | Eden client + TanStack Query provider and hooks | pending |
| C3 | Screens: dashboard, care action, booking, journey, messages | pending |
| C4 | Shared TypeBox validation for send-message form | pending |
| C5 | Biometric gate aligned with Pennywise AppLockGate behaviour | pending |

## D. Verification

| # | Task | Status |
| --- | --- | --- |
| D1 | `bun run format` / `lint` / `typecheck` / `test` | done |
| D2 | API end-to-end script (auth + full loop) | pending — sign-in endpoint is now `/auth/sign-in/email` |
| D3 | Browser walkthrough: gate, sign-in, sign-up, queue, sign-out | done |
| D4 | Mobile typecheck + Metro Android bundle | pending |
| D5 | Next production build (`bun run build`) | done |

# AGENTS.md

Project entry point for coding agents. Vaunt is the stack reference; guardrails
in `/mnt/p5/CODEINE/guardrails` are the conventions floor.

## Load order

1. This file.
2. Always-on: `GENERAL.MD` (arrow functions, named exports, ~150-line cap,
   absolute aliases), `NAMING.MD` (kebab-case files, PascalCase components),
   `FEATURE-FOLDER.MD` (feature-first, API/web rails mirror), `FALLBACKS.MD`
   (no `??`/`||`/`as` on typed values), `TOOLING.MD`, `ENV-VARS.MD`.
3. Stack-specific for this repo (Elysia standalone API):
   `ELYSIA-EDEN.MD` + `VALIDATION.MD` (TypeBox on server) + `API-CONTRACT.MD`
   + `DRIZZLE.MD`. Web follows `REACT.MD` + `NEXTJS.MD` + `DATA-FETCHING.MD`
   (typed client) where wired; mobile follows `REACT-NATIVE.MD`.
4. Task-dependent files when the task touches that concern.

## Rules that apply here

| Rule | What it means in this repo |
| --- | --- |
| `GENERAL.MD` | Arrow functions with named exports; ~150 lines per file; absolute `@/` imports; no relay-only files. |
| `NAMING.MD` | kebab-case folders/files, PascalCase components matching filename, full domain words. |
| `FEATURE-FOLDER.MD` | `apps/api/src/features/<domain>/{routers,services,schema,types}` mirrors `apps/web/src/features/<domain>/{components,services,keys}`. Shared code in `features/shared/`. |
| `FALLBACKS.MD` | Trust validated env and contract types natively; defaults live in schema, not at read site. |
| `TOOLING.MD` | Biome + `tsc` + lefthook; finish with `bun run format`, `bun run lint`, `bun run typecheck`. |
| `ENV-VARS.MD` | `process.env` only in `features/shared/env/index.ts` (web) and `features/shared/env/index.ts` (api, TypeBox). Everywhere else imports validated `env`. |
| `VALIDATION.MD` | TypeBox for Elysia routes; shared validators package is the contract. |
| `ELYSIA-EDEN.MD` | Feature routers with `prefix`, composed in `src/index.ts`; `export type App`; treaty client in web. |
| `DRIZZLE.MD` | `packages/db/src/<feature>/schema/index.ts` with `uuid` PK, `lifecycleTimestamps`, relations; single `client.ts`; seeders in `src/<feature>/seed/{index.ts,data.json}` composed by `src/seed/index.ts` with `--<feature>` flags. |

Vaunt conventions adopted: Bun workspaces (`apps/*`, `packages/*`), Elysia +
Better Auth shape, Drizzle + Postgres via `packages/db`, Caddy + Docker in
`infra/`, Biome + lefthook + `tsc` gates.

## Design system

One token set, three implementations: `apps/web/src/features/shared/styles/theme.ts`
+ `app/globals.css`, `apps/mobile/global.css` + `lib/theme.ts`, and
`apps/www/src/styles/global.css`. Keep them in sync.

| Concern | Rule |
| --- | --- |
| Type | Plus Jakarta Sans, weights 500/700/800. Dashboard body 15/22, patient body 17/26. |
| Colour | `spark` #FF4500 is the only primary-action/focus colour, with ink text (never white). `wing` #38BDF8 is fills and graphics only. |
| Status | Fixed pairs: routine #166534 on #DCFCE7, actionable #92400E on #FEF3C7, urgent #991B1B on #FEE2E2, info #075985 on #E0F2FE. Never reuse spark for severity. |
| Shape | control 6, card 12, panel 18, app tile 26. Hairlines over shadows. |
| Marks | `core` (marketing/brand), `patient` heart (mobile), `clinic` plus (dashboard), `admin` shield (admin views); favicon is wings plus one spark dot. |
| Signals | Every status carries an icon and a label, so colour is never the only cue. |

## Workspace shape

| Path | Owns |
| --- | --- |
| `apps/web` | Next.js 16 App Router UI (`src/app`), feature folders, Eden treaty client, its own `next.config.ts`/`tsconfig.json`/`postcss.config.mjs`. |
| `apps/api` | Standalone Elysia + Bun server, `src/features/<domain>`, entry `src/index.ts` (`export type App`). |
| `apps/mobile` | Expo + expo-router patient app (`app/`, `lib/`, `components/`). |
| `packages/db` | Drizzle client, feature schemas, migrations, seeders (only place SQL lives). |
| `packages/types`, `packages/validators` | Shared DTOs and TypeBox contracts. |
| `infra` | Docker images/compose and Caddy config. |
| `scripts` | Demo seeding and Expo LAN-IP sync. |

The root package is orchestration only: no app dependencies, no root
`tsconfig.json`; scripts delegate with `bun run --cwd <workspace> <script>`.

## Verify before you finish

```sh
bun run format
bun run lint
bun run typecheck
bun run --cwd apps/api test
bun run --cwd apps/api typecheck
```

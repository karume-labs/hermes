# Hermes repository audit

Date: 2026-11-13
Scope: `apps/web`, `apps/api`, `apps/mobile`, `apps/www`, `packages/*`, `infra/`,
tooling and docs.
Method: route/screen inventory, env-schema vs `.env.example` comparison, import
graph checks, provider wiring checks, marker sweep (`TODO`/`FIXME`/placeholder),
and a full gate run.

Current gate status (all green on `main`):

```
bun run format        # clean
bun run lint          # 474 files, 0 errors (2 CSS specificity warnings)
bun run check:guardrails  # 412 files OK
bun run typecheck     # 0 errors, 8 workspaces
bun run test          # 56 api + 8 token tests pass
apps/web build        # succeeded (previous run)
```

Legend: **P0** blocks a real user from completing a core flow in production.
**P1** works but is incomplete, untested or fragile. **P2** hygiene/hardening.

## P0 — end-to-end blockers

### 1. Transactional email cannot be configured from the documented env
`apps/api/src/features/shared/env/index.ts:19-31` requires `SMTP_HOST`,
`SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD` and `MAIL_FROM`, but
`apps/api/.env.example` lists none of them. Deployers following the example get
a working API whose invite, reset-password and login-code mail all throw
"mail is not configured". Invite creation survives because it returns
`inviteUrl` in the response, but reset-password has no fallback.
Fix: add the six keys to `.env.example`, and fail production boot when
`SMTP_HOST` is empty (same style as the existing `unsafe` list).

### 2. Patient sign-in has no production transport
`apps/api/src/features/patient-auth/services/patient-code-service.ts:24-30`
returns "not sent" when `SMS_WEBHOOK_URL` is empty, and the code is only echoed
as `devCode` outside production (`:115`). The production env guard
(`env/index.ts:63-95`) does not check `SMS_WEBHOOK_URL`, so a deploy can pass
every check while no patient can receive a code. The mobile app's only patient
auth is phone + code.
Fix: require `SMS_WEBHOOK_URL` (or an email fallback) in production and surface
that in the env error list.

### 3. `/email-preferences` is a dead route
`apps/web/src/proxy.ts:74-79` lists `/email-preferences` among public auth
paths, but no page exists under `apps/web/src/app`. Signed-out visitors get a
404; signed-in visitors are redirected away from it. Either build the page
(patient/staff alert preferences) or drop the path from `AUTH_PATHS` so email
links cannot point at it.

### 4. Push registration can never succeed
`apps/mobile/lib/notifications.ts:20-40` reads `extra.eas.projectId` and returns
`null` when it is missing. `apps/mobile/app.json` has no `extra.eas` block and
there is no `apps/mobile/eas.json`. Consequently no device token is registered,
the API's `push` channel finds zero tokens, and delivery falls through to
`NOTIFY_WEBHOOK_URL`, which is also empty by default. Push works only as a
local, in-app notification.
Fix: create `eas.json` + `extra.eas.projectId`, document `eas init`, and add a
token-registration smoke check.

### 5. Mobile API base is an unvalidated localhost fallback
`apps/mobile/lib/env/index.ts` accepts `EXPO_PUBLIC_API_BASE` but falls back to
`http://localhost:8001` without validation. A release build with the variable
missing ships an app that talks to nothing, and the fallback pattern violates
`FALLBACKS.MD`. Fix: validate with TypeBox/Zod at module load and fail the
build/boot when unset outside development.

### 6. CI is not in the repository
`.github/workflows/ci.yml` exists locally but is untracked: the push was
rejected because the git credential is an OAuth App without `workflow` scope.
Every gate currently depends on the local lefthook. Add the workflow with a
token that has `workflow` scope (or via the GitHub UI).

## P1 — functional gaps and fragility

| # | Finding | Evidence |
| - | ------- | -------- |
| 7 | `.env.example` sets `FRONTEND_URL=http://localhost:3000`, while the API default and the dashboard dev server are `:3100`. CORS, Better Auth trusted origin, cookies and reset links all disagree locally. | `apps/api/.env.example:11`, `env/index.ts:13` |
| 8 | No end-to-end or mobile tests. Coverage is 56 API tests, 8 token tests and one web unit test file; nothing exercises a browser or a device, so route wiring, cookies and mobile navigation are unverified. | `find` inventory |
| 9 | 16 files still exceed the 150-line cap and are exempted by `scripts/guardrails-legacy.json`: `case-repository`, `handover-service`, `shared/auth`, `shared/mail`, `staff-service`, `staff-invite-service`, mobile `queries`/`sign-in`/`onboarding`, and seven web admin/clinic views. | `scripts/guardrails-legacy.json` |
| 10 | `apps/mobile/android` and `apps/mobile/ios` are present and tracked. `REACT-NATIVE.MD` bans editing them and expects CNG via `expo prebuild --clean`; they will drift from `app.json`. | directory listing |
| 11 | Marketing download CTAs are not deliverable: the iOS link is a store search and the Android package (`com.hermes.care`) is not published. | `apps/www/src/lib/constants.ts:31-36` |
| 12 | `apps/www` hardcodes `SITE_URL` and falls back to `localhost` for the dashboard URL, duplicating `astro.config.mjs` and violating the no-fallback rule. | `apps/www/src/lib/constants.ts:8,27` |
| 13 | `infra/caddy/Caddyfile` and the compose stack have no validation or smoke job; TLS/headers/proxy behaviour is unverified in CI. | `infra/` |
| 14 | Attachments are written to `UPLOAD_DIR` on the API's local disk, so the API cannot scale past one replica and file loss follows a lost volume. | `env/index.ts:17-19`, documents storage |
| 15 | Email delivery is unverified end to end (no SMTP in dev) and there is no bounce/failure reporting beyond `email_logs`. | mail service + `email_logs` schema |
| 16 | Staff alert preferences are only reachable from the organization page; a clinician outside an org has no settings surface, though `PATCH /staff/me/preferences` exists. | `apps/web/src/features/admin/components/organization-view.tsx:49` |
| 17 | The organization API (create org, invite org admin, clinic scoping) has no automated tests; only the migration/seed result was checked manually. | `apps/api/tests/` |

## P2 — hygiene and hardening

- `??`/`||` remain at ~350 call sites. Most are legitimate optional access, but
  the env fallbacks in #5 and #12 are genuine `FALLBACKS.MD` violations; the
  rule still needs review attention because it is not machine-checkable.
- Notification delivery is "queue only" until `NOTIFY_WEBHOOK_URL` is set; the
  admin delivery page is the only visibility into the outbox.
- No database backup/restore runbook and no migration dry-run in CI.
- `docs/hermes-guide.md` section 13 lists external dependencies; it should be
  updated with the EAS project id and SMTP/SMS requirements found above.
- Logging is structured JSON to stdout, but there is no log shipping or alert
  on repeated `background_job_failed` events.

## End-to-end readiness by flow

| Flow | Status | Blocked by |
| ---- | ------ | ---------- |
| Staff sign-in → dashboard | Works locally | — |
| Invite → accept → first sign-in | Works | Email (manual link works) |
| Password reset | Code path complete | SMTP (#1) |
| Patient self-sign-up | Works locally | #5 for release builds |
| Patient code sign-in | Works in dev (`devCode`) | SMS gateway (#2) |
| Results, messages, booking, visits | Works; API-tested | — |
| Queue, case detail, closure, referral, handover | Works; API-tested | — |
| Organization admin (clinics, team, invites) | Works manually | #17 |
| Email alerts + preferences | Preference plumbing complete | SMTP (#1), dead page (#3) |
| Push notifications | In-app only | EAS project id (#4) |
| Marketing site | Renders | Download links (#11) |
| Documents/upload | Works single-node | #14 |

## Recommended order

1. `.env.example` completeness + production guards for SMTP and SMS (#1, #2).
2. Build `/email-preferences` or remove it from the proxy (#3).
3. EAS project id and `eas.json` so device tokens register (#4).
4. Validated mobile env with no localhost fallback (#5).
5. Land CI (#6) and add a compose/Caddy smoke job (#13).
6. Add a Playwright smoke path: sign-in → queue → case → close, plus a mobile
   Expo web smoke for sign-in and case list (#8).
7. Finish the remaining 15 splits (#9) and remove the legacy allowlist.

## Status after remediation (same day)

| Item | Status |
| ---- | ------ |
| 1 SMTP env + production guard | Fixed: keys documented in `.env.example`; production boot now refuses an empty `SMTP_HOST`. |
| 2 SMS production guard | Fixed: production boot refuses an empty `SMS_WEBHOOK_URL`. |
| 3 dead `/email-preferences` | Fixed: removed from the proxy auth paths. |
| 4 push project id | Code fixed: `EXPO_PUBLIC_EAS_PROJECT_ID` + `eas.json`; a real id still has to come from `eas init` on an Expo account. |
| 5 mobile env | Fixed: validated, https-only in production, dev-only localhost default. |
| 6 CI | Prepared in `.github/workflows/ci.yml`; still needs a push with `workflow` scope. |
| 7 `FRONTEND_URL` port | Fixed to `:3100`. |
| 8 tests | Partly: API `/health` + `/ready` smoke tests added (58 API tests); no browser or device E2E yet. |
| 9 oversized files | 15 remain; `staff-invite-service` split into create/accept/token files. |
| 10 native folders | Unchanged; deleting tracked `android/`/`ios/` needs a decision. |
| 11 store links | Unchanged; needs published listings. |
| 12 www fallback | Fixed with an Astro `env.schema` default. |
| 13 infra validation | Not done; needs a Caddy/compose job in CI. |
| 14 local-disk uploads | Unchanged; needs a storage service choice. |
| 15 email delivery | Unverified; needs SMTP credentials. |
| 16 staff preferences UI | Not done. |
| 17 organisation tests | Not done. |

`bun run verify` now runs format check, lint, guardrails, typecheck and tests in
one command for local and CI use.

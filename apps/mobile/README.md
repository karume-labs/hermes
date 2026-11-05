# Hermes Care — patient mobile app

Expo (SDK 56) + expo-router patient surface for the Care Loop. Expo Router,
Tailwind via Uniwind, React Native Reusables primitives, typed API client over
`packages/types`.

## Run

```bash
cp .env.example .env      # EXPO_PUBLIC_API_BASE=http://localhost:8001
bun run dev               # from this folder, or `bun run dev:mobile` at the root
bun run update-ip         # root: rewrite .env for a physical device on the LAN
```

- iOS simulator: press `i` — use `http://localhost:8001`.
- Android emulator: press `a` — use `http://10.0.2.2:8001`.
- Physical device: `bun run update-ip` then scan the QR code.

## Screens

| Route | Flow |
| --- | --- |
| `/` | Biometric gate, case list with journey stage and unread messages, demo identity switcher, pull to refresh. |
| `/care-action?caseId=` | Plain-language result, meaning/why it matters, acknowledge, visit card with calendar sync, next steps. |
| `/booking?caseId=&clinicId=&kind=` | Live clinic slots, one-tap confirm, 24h device-calendar reminder, prep instructions. |
| `/journey?caseId=` | Received → Booked → Consultation → Completed timeline. |
| `/messages?caseId=` | Secure message thread with the care team. |

Biometrics use `expo-local-authentication`; when no biometrics are enrolled the
gate offers an explicit demo path. Push registration needs an EAS `projectId`
in `app.json` (`extra.eas.projectId`) and is skipped otherwise, so the app still
works with in-app notification records. Deep links use the `hermescare` scheme.

Patient identity is client-supplied (SecureStore, demo default
`patient-1-clinic-1`) — the server enforces case ownership, but patient
authentication is not implemented yet.

## Checks

```bash
bun run typecheck    # tsc --noEmit
```

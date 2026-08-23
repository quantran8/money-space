# Money Space — mobile

The React Native / Expo client. Same backend and same business logic as the web
app; only the UI is written twice.

## Running it

```bash
# once, from frontend/
pnpm install

# point the app at a backend (see below), then:
pnpm mobile            # or: cd mobile && pnpm start
```

Press `i` for the iOS simulator, `a` for Android.

### Pointing at a backend

Copy `.env.example` to `.env` and set the base URL:

```
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.50:3000
```

A simulator can use `localhost`, but **a real device cannot** — on a phone,
`localhost` is the phone. Use the machine's LAN IP (`ipconfig getifaddr en0` on
macOS) with the backend running:

```bash
cd ../../backend && npm run start:dev
```

The backend enables CORS for all origins and binds `0.0.0.0`, so nothing else is
needed beyond being on the same network.

`EXPO_PUBLIC_*` is inlined by Metro at build time — changing it needs a
dev-server restart, not just a reload.

## Checks

```bash
pnpm typecheck    # tsc --noEmit; covers packages/core too
pnpm lint         # banned-copy check, then expo lint
pnpm bundle       # full Metro + Hermes bundle, catches what tsc cannot
```

From `frontend/`, `pnpm verify` runs all of these plus the web's.

There is no test runner, matching the web app.

## Layout

```
app/                    Expo Router routes
  (tabs)/               the five primary destinations, behind the auth gates
  auth · signup · onboarding · join · events · activity
  assets/[assetId] · debts/[debtId] · goals/[goalId]
src/
  components/ui/        the design-system kit — build from this
  features/<domain>/    screens and sections, UI only
  shared/               the adapters that plug core into React Native
  theme/                v4.2 tokens as JS values
```

Business logic is **not** here. It lives in `../packages/core`, shared with the
web app. See [CLAUDE.md](CLAUDE.md) for the rules that keeps that split honest.

## Deep links

The scheme is `moneyspace://`. An invite QR encodes
`moneyspace://join?household=…&token=…`, which opens `app/join.tsx` directly —
deliberately outside the household gate, since whoever scans an invite usually
has no household yet.

Test one against a running dev server:

```bash
npx uri-scheme open "moneyspace://join?household=abc&token=xyz" --ios
```

## What is not built yet

- **Google sign-in.** Core keeps the flow; the mobile app needs
  `expo-auth-session` plus a registered redirect. Email/password reaches every
  screen in the meantime.
- **QR scanning.** The inviter's side shows a code; the invitee currently opens
  the link. Scanning needs `expo-camera` and a permission-denied path.
- Some desktop-only surfaces stayed on the web on purpose — the event-category
  console, full month-by-month goal tables, multi-series charts that are
  unreadable at 375pt. Each omission is commented where it was made.

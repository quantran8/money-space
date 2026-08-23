# Mobile app (Expo) — full port from web

- **Date**: 2026-08-23
- **Session folder**: `session/2026-08-23/mobile-app-expo-port/`
- **Status**: done

## What the task is

Build the mobile app the three-repo model always assumed (`memory/README.md`
names `backend`, `frontend-web`, `mobile-app`) and bring it to parity with the
web app as of today.

## Changes made

### Repo shape

The web repo became a pnpm workspace at `frontend/` (git root moved up one
level; the GitHub repo is unchanged). **The backend stayed a separate repo** —
its `deploy.yml` builds ARM64 → OCIR → Oracle Cloud on every push to `master`,
so folding it in would fire a backend deploy on every web or mobile commit, and
it shares no TypeScript with the frontend anyway.

```
frontend/                  ← git root, pnpm workspace
  packages/core/           18.2k LOC shared by web and mobile
  web/                     UI only
  mobile/                  UI only, 16.9k LOC
  memory/ design/ session/ shared docs, moved up from web/
```

**Vercel needs its Root Directory changed to `frontend/web`** with the install
command at the workspace root. Not done — it is dashboard config.

### `packages/core`

`api/`, `hooks/`, `model/` for 15 slices, plus `shared/` and `i18n/`. Only three
upward imports existed and all were `import type`, so the split was clean.

Core must run on Hermes, so four things became injected adapters (same shape as
the existing `configureAuthBridge`): `configureEnv`, `configureStorage`,
`configureNavigation`, `configureNotifier`, later `configureClipboard` and
`configureJoinUrlBase`. This removed `sonner` (13 files) and `react-router-dom`
(7 files) from core.

Core uses `#/` internally so it never collides with each app's `@/`.

### Mobile

Expo SDK 57 / RN 0.86 / Expo Router / NativeWind v4. 26 UI primitives built
first, then 11 features ported by parallel agents. Five tabs matching the web's
bottom nav exactly.

### Web

Imports repointed at core; `main.tsx` now installs the adapters. Behaviour
unchanged — build output is within 2 kB of baseline.

## Key decisions

- **Monorepo over copying.** 18.2k LOC is shared; copying would mean maintaining
  it twice. Requires no npm registry — pnpm links `packages/core` by symlink.
- **`auth-store` hydrates asynchronously now.** The web read `localStorage` at
  module scope and hardcoded `hydrated: true`. `useSession` already exposed
  `isLoading` from that flag, so only the store changed — but without this,
  native would sign the user out on every cold start.
- **Design v4.2, not v3.1.** `web/CLAUDE.md` pointed at the superseded v4.1 and
  named tokens that no longer exist. Fixed that file too.
- **Charts only where they beat a list** (§9). Most became grouped rows; the two
  that survived are hand-drawn `react-native-svg`, no charting library.
- **Seams over guesses.** Where a feature needed something another agent owned,
  the agent left a marked seam rather than building a second version. All are
  now resolved except two intentional ones (freshness in Household, what-if from
  Household).

### Runtime bugs found and fixed in core

Each compiles fine and only fails on device:

- `crypto.randomUUID()` throws on Hermes — took down asset creation. Now
  `shared/lib/create-id.ts`; `events-form.ts` was doing the same and was
  repointed before the events port touched it.
- `navigator.clipboard` is undefined on RN, so "Sao chép" on the invite link
  always reported a failure it had never attempted.
- `window.history.replaceState` in `use-debts-page.ts`.
- `window.location.origin` in `buildJoinUrl`.

`Intl` was expected to be a problem and is **not** — RN 0.86 builds Hermes with
`HERMES_ENABLE_INTL=true` on both platforms, so `vi-VN` money formatting works
with no polyfill (~2.7 MB saved).

### Memory corrections

Two files had drifted from the code and were corrected:

- `cashflow-events.md` described a four-slice `SpendImpactBar`; the web
  deliberately moved to two slices (the bar draws the **spend** split by what
  pays for it, not the wallet).
- `money-events.md` / `domain-overview.md` said `TODAY` was the hardcoded
  `'2026-07-08'`; it is the real clock now. `AS_OF` is still hardcoded — that
  mixture is the actual hazard.

## Mobile app parity notes

This task IS the mobile port, so the direction is reversed: what the **web**
should carry forward.

- Business logic now lives in `packages/core`. A change there reaches both
  apps; a change in `web/src` reaches neither. Never add a repository call,
  query hook, zod schema or calculation to `web/src` again.
- Core cannot use `sonner`, `react-router-dom`, `window`, `document`,
  `localStorage`, `navigator` or `crypto` directly. Use the adapters.
- `src/i18n/resources.ts` moved to `packages/core/src/i18n/resources.ts` and is
  shared. Both `vi` and `en` still required; `check-copy` guards it for both
  platforms now.
- Not ported on purpose, and NOT web regressions: Google sign-in, QR scanning,
  the event-category console, full month-by-month goal tables, and multi-series
  charts that are unreadable at 375pt.

## Verification

`pnpm verify` at the workspace root runs all four gates:

```
web build (tsc -b + vite)    ✓  2,022 kB (baseline 2,020 kB)
web lint + check-copy        ✓  0 errors (7 pre-existing warnings)
mobile tsc --noEmit          ✓  0 errors
mobile check-copy + lint     ✓  clean
```

Metro bundle: ✓ 7.9 MB `.hbc` (Hermes bytecode).

**Not yet done:** no run against a live backend on a device or simulator. The
LAN path was verified by curl during planning (`/health` and
`POST /api/auth/login` over `192.168.1.232:3000`), but the end-to-end flow —
sign in → onboarding → record something → kill and reopen the app still signed
in — has not been exercised.

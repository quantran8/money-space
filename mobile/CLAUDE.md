# CLAUDE.md — Money Space mobile

Guidance for Claude Code when working in `mobile/`.

## Commands

```bash
pnpm --filter money-space-mobile start   # Expo dev server
cd mobile && npx tsc --noEmit            # typecheck gate
cd mobile && npx expo lint               # lint gate
cd mobile && npx expo export --platform ios --output-dir /tmp/x   # bundle check
```

There is no test runner, matching the web app. `tsc` is the gate.

## What this is

The React Native / Expo client for Money Space, a Vietnamese-first finance app
for couples. It talks to the same NestJS backend as the web app and shares all
non-UI logic with it through `@money-space/core`.

Expo SDK 57, RN 0.86, React 19, Expo Router, NativeWind v4.

## The split that matters

```
packages/core/   api · hooks · model · i18n · stores   ← shared with web
mobile/          UI only
```

**Never** copy a repository function, a query hook, a zod schema or a
calculation into `mobile/`. If it is not UI, it belongs in core, where the web
gets the same fix. If core is missing something, add it there.

What lives here: screens (`app/`), components (`src/components/`), the platform
adapters (`src/shared/`), and the theme (`src/theme/`).

## Platform adapters

Core is platform-agnostic and receives its environment by injection, wired in
[src/shared/bootstrap.ts](src/shared/bootstrap.ts):

| Core needs | Mobile provides |
|---|---|
| `configureEnv` | `EXPO_PUBLIC_API_BASE_URL` |
| `configureStorage` | SecureStore ([native-storage.ts](src/shared/native-storage.ts)) |
| `configureNavigation` | Expo Router ([native-navigation.ts](src/shared/native-navigation.ts)) |
| `configureNotifier` | [toast.tsx](src/shared/toast.tsx), installed by `ToastProvider` |
| `configureAuthBridge` | core's own, called from bootstrap |

Core's hooks import `useNavigate` / `useLocation` / `useSearchParam` from
`@money-space/core/shared/navigation` — never from `expo-router` directly, or
they would stop working on the web.

## Routing

Expo Router, file-based, paths deliberately mirroring the web's so deep links
resolve the same on both:

```
app/_layout.tsx      bootstrap, providers, AppState → focusManager
app/index.tsx        → redirect to (tabs)
app/auth.tsx         sign in            app/signup.tsx
app/onboarding.tsx   create a household
app/join.tsx         invite QR target — RequireAuth only, NOT RequireHousehold
app/(tabs)/          RequireAuth → RequireHousehold → 5 tabs
```

Five tabs, hard-capped (§8): Tổng quan · Sắp tới · Mục tiêu · Tài sản · Gia đình.
`Lịch sử cập nhật` and `Cài đặt` live inside Gia đình.

`/join` sits outside the household gate on purpose: whoever scans an invite
usually has no household, and that gate would send them to create one.

## UI

Build from [src/components/ui](src/components/ui) — import from the barrel:

```ts
import { Screen, Sections, Panel, MetricCell, GroupedRow } from '@/components/ui'
```

If a primitive is missing, add it to the kit rather than hand-rolling markup in
a feature. One Button, one Field, one way to show a status.

Design source of truth is [../design/](../design/) (v4.2), **not** the v3.1
folder the web's CLAUDE.md still points at. Mobile-specific rules:

- Panel padding 20 (`p-5`). Desktop's 32 never applies.
- Touch targets ≥ 44pt for nav, CTAs and action links.
- Tables become **grouped rows**. Core flows never scroll horizontally.
- Money values never truncate.
- `--interactive` is the CTA colour (v4.2 renamed the web's `--accent`).

Tokens live twice — [tailwind.config.js](tailwind.config.js) for classes,
[src/theme/tokens.ts](src/theme/tokens.ts) for props that take colours. Change
both.

## Typography

Two faces, two jobs, one hard constraint:

- **Be Vietnam Pro** — all Vietnamese text, titles, labels, money.
- **IBM Plex Mono** — ASCII only: dates, counts, units, percentages.

Mono must never touch accented Vietnamese. `RowMetaMono` vs `RowMeta` in
[grouped-row.tsx](src/components/ui/grouped-row.tsx) exists for exactly this.

Money always renders with `fontVariant: ['tabular-nums']`, or columns of
amounts do not line up.

## i18n

Mandatory, and the resources are shared: keys live in
`packages/core/src/i18n/resources.ts`, filled for **both** `vi` and `en`. Never
hardcode a display string; never invent a key without adding it to both blocks.
`pnpm lint` (web) runs the banned-copy check over that same file.

## Domain

`../memory/` is the durable source of truth for business logic, shared across
backend, web and mobile. Read the relevant file before changing anything that
touches business rules, and update it in the same commit when a rule changes.

Invariants that outrank any visual concern:

1. **Money can be NEGATIVE.** `lowestProjectedBalance` and flexible money are
   never clamped to 0. The negative number is the signal the product exists to
   show.
2. **Never render `0đ` when the truth is "no data yet".**
3. **Voice**: no judgement, no monitoring a partner, never "you should / should
   not buy". What-if shows *consequence*, never a verdict.
4. Asset valuation mode is always derived from `type` — never user-picked.
5. Every derived number must be explainable ("Theo dữ liệu hiện có").

## Task logging

Log every task at `../session/<date>/<task-name>/README.md` from
[../session/TEMPLATE.md](../session/TEMPLATE.md), the same as the web app.

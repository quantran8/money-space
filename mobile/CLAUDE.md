# CLAUDE.md — Oursight mobile

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

The React Native / Expo client for Oursight, a Vietnamese-first finance app
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

| Core needs            | Mobile provides                                                       |
| --------------------- | --------------------------------------------------------------------- |
| `configureEnv`        | `EXPO_PUBLIC_API_BASE_URL`                                            |
| `configureStorage`    | SecureStore ([native-storage.ts](src/shared/native-storage.ts))       |
| `configureNavigation` | Expo Router ([native-navigation.ts](src/shared/native-navigation.ts)) |
| `configureNotifier`   | [toast.tsx](src/shared/toast.tsx), installed by `ToastProvider`       |
| `configureAuthBridge` | core's own, called from bootstrap                                     |

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
import {
  Screen,
  Sections,
  Panel,
  MetricCell,
  GroupedRow,
} from "@/components/ui";
```

If a primitive is missing, add it to the kit rather than hand-rolling markup in
a feature. One Button, one Field, one way to show a status.

Design source of truth is [../design/](../design/) — **v5**, and the
`.dc.html` pages in `../design-v5-styleguide/` outrank the markdown where they
disagree. Mobile-specific rules:

- Panel padding 20 (`p-5`). Desktop's 32 never applies.
- Touch targets ≥ 44pt for nav, CTAs and action links.
- Tables become **grouped rows**. Core flows never scroll horizontally.
- Money values never truncate.
- `action` (ink) is the CTA colour. v5 split interaction from data semantics:
  `action` is what you press, `data-primary` (blue) is what a chart draws with,
  and `positive` (green) means a good consequence — **never** "this is
  clickable". A static metric never wears the action colour.
- Anything that must be READ takes an `*-ink` token (`text-alert-ink`,
  `text-attention-ink`). The bare `alert` / `attention` / `positive` tones are
  FILLS — a dot, a bar, a destructive background — and fail AA as text.
- Cards carry no shadow and no border; they separate from `canvas` by lightness
  alone. `Sunk` is a **control surface** (field, chart bed), not a card tier.

Tokens live twice — [tailwind.config.js](tailwind.config.js) for classes,
[src/theme/tokens.ts](src/theme/tokens.ts) for props that take colours. Change
both.

## Typography

Two faces, two jobs, one hard constraint:

- **Urbanist** — all Vietnamese text, titles, labels, money. Loaded at
  **300/400/500 only**; there is no 600, so `font-semibold` must never be used.
- **IBM Plex Mono** — ASCII only: dates, counts, units, percentages.

Mono must never touch accented Vietnamese. `RowMetaMono` vs `RowMeta` in
[grouped-row.tsx](src/components/ui/grouped-row.tsx) exists for exactly this.

Both faces are loaded in [app/_layout.tsx](app/_layout.tsx) via
`@expo-google-fonts/*`; the first frame is held until they land.

**Size comes from the scale, never from a literal.** The eleven `.t-*` steps
(`t-display` … `t-caption-sm`) are defined in the tailwind config plugin and
mirror `web/src/index.css`. A step carries size, weight AND tracking together,
so:

- Never write `text-[17px]` — it is not a step.
- Never add `font-medium` to `t-hero` / `t-figure` / `t-metric` / `t-title` /
  `t-subtitle`; those already state their weight. On `t-body` and below it is
  legitimate emphasis within a step.
- Never re-state `letterSpacing` beside a step. The exception is positive
  tracking on an uppercase label, which no step carries.

`Money` takes `step`, not a pixel size. Money always renders with
`fontVariant: ['tabular-nums']`, or columns of amounts do not line up.

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
   not buy". What-if shows _consequence_, never a verdict.
4. Asset valuation mode is always derived from `type` — never user-picked.
5. Every derived number must be explainable ("Theo dữ liệu hiện có").

## Task logging

Log every task at `../session/<date>/<task-name>/README.md` from
[../session/TEMPLATE.md](../session/TEMPLATE.md), the same as the web app.

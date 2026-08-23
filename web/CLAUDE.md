# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

The workspace uses **pnpm**, from the `frontend/` root:

```bash
pnpm install     # once, at the workspace root
pnpm dev         # Vite dev server (HMR)
pnpm build       # tsc -b (typecheck) then vite build
pnpm lint        # the banned-copy check, then eslint
```

There is no test runner configured. `pnpm build` is the typecheck gate — it
covers `packages/core` too, so a core change that breaks the web fails here.

`pnpm lint` also runs [scripts/check-copy.mjs](scripts/check-copy.mjs), which
reads `packages/core/src/i18n/resources.ts` and fails the build if banned
vocabulary appears (see **Voice** below). The copy is shared, so this guards the
mobile app's strings as well.

## What this is

Money Space (package name `family-finance-app`) is a Vietnamese-first finance web app for **couples aged 25–37**. React 19 + Vite + TypeScript, Tailwind v4, shadcn/ui (new-york style), react-router-dom v7, TanStack Query, react-hook-form + zod, zustand, recharts, i18next.

The product thesis is **Financial Clarity → Financial Foresight → Financial Decision**: clarity drives adoption, foresight drives retention, and decision support is what people pay for. It is explicitly **not** an expense tracker, not a budgeting app, and not a tool for monitoring a partner.

**The app talks to a live REST backend** — the NestJS service in the sibling repo `money-space-backend`, base URL from `VITE_API_BASE_URL` (default `http://localhost:3000`). There is no mock data and no Supabase client in this repo; auth tokens come from the backend's `/api/auth/*` endpoints.

## Architecture

This app is one workspace of a pnpm monorepo rooted at `frontend/`. Everything
that is not UI lives in `@money-space/core`, shared with the Expo app in
`../mobile/`:

```
packages/core/src/          ← shared with mobile
  api/                      http.ts (apiRequest — the ONLY fetch), env.ts,
                            query-client.ts, query-keys.ts
  shared/lib/               format-money, number-format, validation, utils (cn)
  shared/stores/            auth-store, household-store, whatif-store
  shared/{storage,notify,navigation}.ts   injected by each host app
  features/<domain>/{api,hooks,model}/
  i18n/                     config.ts, resources.ts

web/src/                    ← this app: UI only
  app/                      router.tsx, App.tsx, layout/app-shell.tsx
  features/<domain>/ui/     *-page.tsx and ui/components/*
  components/ui/            shadcn/ui primitives + app-level ones
  shared/                   web-storage.ts and the two web-only lib helpers
```

**Never add a repository call, query hook, zod schema or calculation to
`web/src/`.** If it is not UI it belongs in core, where mobile gets the same
fix. Core must never import from `react-dom`, `react-router-dom` or
`@/components`, and must never touch `window` / `document` / `localStorage` —
it runs on Hermes too.

- **Routing**: [src/app/router.tsx](src/app/router.tsx) is a single `createBrowserRouter` tree. `RequireAuth` → `RequireHousehold` → `AppShell` wraps the authenticated pages. The nav list lives in [src/app/layout/app-shell.tsx](src/app/layout/app-shell.tsx).
- **HTTP**: everything goes through `apiRequest` in `packages/core/src/shared/api/http.ts`. It unwraps the backend's `{ success, statusCode, data, ... }` envelope, throws `ApiError`, injects the bearer token, and on a 401 does one silent refresh + retry via the `AuthBridge` installed in [src/main.tsx](src/main.tsx). Never call `fetch` directly from a feature.
- **Query keys** are centralized in `packages/core/src/shared/api/query-keys.ts`. Add new keys there, never inline.
- **Path aliases**: `@/` → `web/src/`, `@money-space/core/*` → the shared package. Core uses `#/` for its own internals.
- **Reference slice**: `packages/core/src/features/goals/` plus [src/features/goals/ui/](src/features/goals/ui/) is the canonical shape.

## Domain

`../memory/` is the durable source of truth for business logic (nghiệp vụ) and is kept consistent across the `backend`, `frontend-web`, and `mobile-app` repos.

- **Before changing anything that touches business logic**, read the relevant `../memory/` file first.
- **Whenever a task changes business logic**, update the corresponding `../memory/` file in the same commit.
- One concern per file. See [memory/README.md](../memory/README.md).

Two domain rules worth knowing up front:

- **Asset valuation** (`packages/core/src/features/assets/model/assets.ts`) — every asset `type` maps deterministically to a `valuationMode` (`manual` / `market_priced` / `formula_calculated`) and a default `liquidity` bucket. **Never let the user free-pick the valuation mode; derive it from type** via `valuationModeForType` / `liquidityForAssetType`. `computeCurrentValue` is the single entry point.
- **Money is raw numbers** across the API (VND). The client formats it — see `packages/core/src/shared/lib/format-money.ts` (`formatMoney`, `formatVndShort` "24,5M", `formatVndSigned`, `formatMonthYear`). The backend never returns pre-formatted money strings.

## Conventions

- **Build from existing components.** Reuse what is in `src/features/*/ui/components/` and [src/components/ui/](src/components/ui/). If a needed primitive isn't there, install it from shadcn/ui (`npx shadcn@latest add ...`) rather than hand-rolling markup.
- **Design system**: [../design/](../design/) is the source of truth — **v4.2**, split into foundations / components / patterns / product recipes. `../family-finance-v3.1/design.md` is the superseded v4.1 and the root `design.md` the superseded v2. v4.2 renamed `--accent` to `--interactive`, lifted `--ink3` for contrast, and **removed shadows entirely** (so `rounded-card`, `shadow-soft` and `shadow-apple` no longer exist).
- **i18n is mandatory.** Default and fallback language is Vietnamese (`vi`); English (`en`) is secondary. All copy goes through `useTranslation()` / `t('key')` with keys in `packages/core/src/i18n/resources.ts` — **both `vi` and `en` must be filled**. Never hardcode display strings. Enum-like values use keyed lookups, e.g. `t(\`options.assetType.${type}\`)`.
- **Forms**: react-hook-form + `zodResolver`. Build schemas with the localized helpers in `packages/core/src/shared/lib/validation.ts` so messages are translated. Use `.superRefine` for conditional validation. Forms following design.md §22 (assets, events) use `mode: 'onSubmit'` + `reValidateMode: 'onChange'` + `shouldFocusError`, because §22.10 requires the primary button to stay enabled and to report what is missing on click; older forms still use `mode: 'onChange'` and can migrate.
- **Money input**: whole digits only. Fields group them for display (`20000` → `"20.000"`) but form state always holds a plain separator-free digit string — see `packages/core/src/shared/lib/number-format.ts` (`sanitizeIntegerInput`, `formatIntegerDisplay`, `parseRawMoney`). There is **no** `"20M"` / `"500K"` shorthand: `sanitizeIntegerInput` strips the suffix and `parseRawMoney("20M")` is `NaN`. Comma is the decimal separator for quantities and rates (`parseRawDecimal`).
- **Styling**: Tailwind v4 utilities with CSS variables, e.g. `text-[hsl(var(--muted-foreground))]`. Chart colors come from `packages/core/src/shared/constants/colors.ts` — don't invent per-chart hues.

## Voice

Non-negotiable, and enforced by `pnpm lint`. The product must never read as control, surveillance, judgement, or a verdict.

- **Never** say a user should or should not buy something. What-if shows *consequence*, never a recommendation.
- **Never** frame anything as monitoring a partner. Ask who is *responsible for* a source of money, never who spent it.
- **Never** call flexible money a spending allowance.
- Banned vocabulary is listed in [scripts/check-copy.mjs](scripts/check-copy.mjs); the rationale is in [family-finance-v3.1/08-brand-copy-wireframes.md](../family-finance-v3.1/08-brand-copy-wireframes.md) §3 and `design.md` §16.
- Every calculated number must be explainable — surface the assumptions behind it ("Theo dữ liệu hiện có").

## Task logging for mobile app parity

**Every task in this repo must be recorded** at `../session/<date>/<task-name>/README.md`, copied from [session/TEMPLATE.md](../session/TEMPLATE.md). Log what the task was, which files/features changed, and the key decisions, so the mobile app repo can be brought to parity later. See [session/README.md](../session/README.md).

## Spec

The product spec lives in [family-finance-v3.1/](../family-finance-v3.1/) and is the source of truth for domain rules and UX:

- `04-mvp-features-flows.md` — MVP scope, onboarding, screens, core flows
- `05-calculation-data-model.md` — forecast, flexible money, goal projection, what-if formulas
- `08-brand-copy-wireframes.md` — wireframes, copy, banned vocabulary
- `Backend-Tables-Relationships-Money-Space-MVP-v3.1.md` — the full backend schema
- `design.md` — the design system

Documents at the repo root (`# Product Spec v1.md`, `# Backend Tables & Relationships — Money.md`, `Money Space — Apple-like Design System v2.md`, `design.md`) are **superseded v1/v2 history** — do not treat them as current.

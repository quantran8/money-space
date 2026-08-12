# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Vite dev server (HMR)
npm run build    # tsc -b (typecheck) then vite build
npm run lint     # eslint over the repo, then the banned-copy check
npm run preview  # serve the production build
```

There is no test runner configured. `npm run build` is the typecheck gate — run it to verify changes compile.

`npm run lint` also runs [scripts/check-copy.mjs](scripts/check-copy.mjs), which fails the build if banned vocabulary appears in the i18n resources (see **Voice** below).

## What this is

Money Space (package name `family-finance-app`) is a Vietnamese-first finance web app for **couples aged 25–37**. React 19 + Vite + TypeScript, Tailwind v4, shadcn/ui (new-york style), react-router-dom v7, TanStack Query, react-hook-form + zod, zustand, recharts, i18next.

The product thesis is **Financial Clarity → Financial Foresight → Financial Decision**: clarity drives adoption, foresight drives retention, and decision support is what people pay for. It is explicitly **not** an expense tracker, not a budgeting app, and not a tool for monitoring a partner.

**The app talks to a live REST backend** — the NestJS service in the sibling repo `money-space-backend`, base URL from `VITE_API_BASE_URL` (default `http://localhost:3000`). There is no mock data and no Supabase client in this repo; auth tokens come from the backend's `/api/auth/*` endpoints.

## Architecture

Feature-sliced. Do not add files to a flat `src/routes/` or `src/lib/` — those layouts are gone.

```
src/
  app/            router.tsx, App.tsx, layout/app-shell.tsx (sidebar + <Outlet/>)
  features/<domain>/
    api/          *.repository.ts — plain functions over apiRequest, plus response types
    hooks/        use-*.ts (TanStack Query) and use-*-page.ts (page state/derivations)
    model/        *.types.ts, *-form.ts (zod schemas), pure calculation helpers
    ui/           *-page.tsx and ui/components/*
  shared/
    api/          http.ts (apiRequest — the ONLY fetch), env.ts, query-client.ts, query-keys.ts
    lib/          utils.ts (cn), format-money.ts, number-format.ts, validation.ts, hooks
    stores/       auth-store.ts, household-store.ts, whatif-store.ts
    constants/    colors.ts
  components/ui/  shadcn/ui primitives + a few app-level ones
  i18n/           config.ts, resources.ts
```

- **Routing**: [src/app/router.tsx](src/app/router.tsx) is a single `createBrowserRouter` tree. `RequireAuth` → `RequireHousehold` → `AppShell` wraps the authenticated pages. The nav list lives in [src/app/layout/app-shell.tsx](src/app/layout/app-shell.tsx).
- **HTTP**: everything goes through `apiRequest` in [src/shared/api/http.ts](src/shared/api/http.ts). It unwraps the backend's `{ success, statusCode, data, ... }` envelope, throws `ApiError`, injects the bearer token, and on a 401 does one silent refresh + retry via the `AuthBridge` installed in [src/main.tsx](src/main.tsx). Never call `fetch` directly from a feature.
- **Query keys** are centralized in [src/shared/api/query-keys.ts](src/shared/api/query-keys.ts). Add new keys there, never inline.
- **Path alias**: `@/` → `src/`. Always import via `@/...`.
- **Reference slice**: [src/features/goals/](src/features/goals/) is the canonical shape — copy its `api`/`hooks`/`model`/`ui` layering when adding a feature.

## Domain

`memory/` is the durable source of truth for business logic (nghiệp vụ) and is kept consistent across the `backend`, `frontend-web`, and `mobile-app` repos.

- **Before changing anything that touches business logic**, read the relevant `memory/` file first.
- **Whenever a task changes business logic**, update the corresponding `memory/` file in the same commit.
- One concern per file. See [memory/README.md](memory/README.md).

Two domain rules worth knowing up front:

- **Asset valuation** ([src/features/assets/model/assets.ts](src/features/assets/model/assets.ts)) — every asset `type` maps deterministically to a `valuationMode` (`manual` / `market_priced` / `formula_calculated`) and a default `liquidity` bucket. **Never let the user free-pick the valuation mode; derive it from type** via `valuationModeForType` / `defaultLiquidityForType`. `computeCurrentValue` is the single entry point.
- **Money is raw numbers** across the API (VND). The client formats it — see [src/shared/lib/format-money.ts](src/shared/lib/format-money.ts) (`formatMoney`, `formatVndShort` "24,5M", `formatVndSigned`, `formatMonthYear`). The backend never returns pre-formatted money strings.

## Conventions

- **Build from existing components.** Reuse what is in `src/features/*/ui/components/` and [src/components/ui/](src/components/ui/). If a needed primitive isn't there, install it from shadcn/ui (`npx shadcn@latest add ...`) rather than hand-rolling markup.
- **Design system**: [family-finance-v3.1/design.md](family-finance-v3.1/design.md) is the source of truth for the visual language — tokens, type scale, spacing, radius (`rounded-card`), shadows (`shadow-soft`, `shadow-apple`), the section → sub-section → metric IA, and per-component style rules. The root `design.md` is the superseded v2 system.
- **i18n is mandatory.** Default and fallback language is Vietnamese (`vi`); English (`en`) is secondary. All copy goes through `useTranslation()` / `t('key')` with keys in [src/i18n/resources.ts](src/i18n/resources.ts) — **both `vi` and `en` must be filled**. Never hardcode display strings. Enum-like values use keyed lookups, e.g. `t(\`options.assetType.${type}\`)`.
- **Forms**: react-hook-form + `zodResolver`, `mode: 'onChange'`. Build schemas with the localized helpers in [src/shared/lib/validation.ts](src/shared/lib/validation.ts) so messages are translated. Use `.superRefine` for conditional validation.
- **Money input**: shorthand like `"20M"` / `"1,8M"` / `"500K"`, parsed by the helpers in [src/shared/lib/number-format.ts](src/shared/lib/number-format.ts). Comma is the decimal separator.
- **Styling**: Tailwind v4 utilities with CSS variables, e.g. `text-[hsl(var(--muted-foreground))]`. Chart colors come from [src/shared/constants/colors.ts](src/shared/constants/colors.ts) — don't invent per-chart hues.

## Voice

Non-negotiable, and enforced by `npm run lint`. The product must never read as control, surveillance, judgement, or a verdict.

- **Never** say a user should or should not buy something. What-if shows *consequence*, never a recommendation.
- **Never** frame anything as monitoring a partner. Ask who is *responsible for* a source of money, never who spent it.
- **Never** call flexible money a spending allowance.
- Banned vocabulary is listed in [scripts/check-copy.mjs](scripts/check-copy.mjs); the rationale is in [family-finance-v3.1/08-brand-copy-wireframes.md](family-finance-v3.1/08-brand-copy-wireframes.md) §3 and `design.md` §16.
- Every calculated number must be explainable — surface the assumptions behind it ("Theo dữ liệu hiện có").

## Task logging for mobile app parity

**Every task in this repo must be recorded** at `session/<date>/<task-name>/README.md`, copied from [session/TEMPLATE.md](session/TEMPLATE.md). Log what the task was, which files/features changed, and the key decisions, so the mobile app repo can be brought to parity later. See [session/README.md](session/README.md).

## Spec

The product spec lives in [family-finance-v3.1/](family-finance-v3.1/) and is the source of truth for domain rules and UX:

- `04-mvp-features-flows.md` — MVP scope, onboarding, screens, core flows
- `05-calculation-data-model.md` — forecast, flexible money, goal projection, what-if formulas
- `08-brand-copy-wireframes.md` — wireframes, copy, banned vocabulary
- `Backend-Tables-Relationships-Money-Space-MVP-v3.1.md` — the full backend schema
- `design.md` — the design system

Documents at the repo root (`# Product Spec v1.md`, `# Backend Tables & Relationships — Money.md`, `Money Space — Apple-like Design System v2.md`, `design.md`) are **superseded v1/v2 history** — do not treat them as current.

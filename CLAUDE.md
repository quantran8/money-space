# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Vite dev server (HMR)
npm run build    # tsc -b (typecheck) then vite build
npm run lint     # eslint over the repo
npm run preview  # serve the production build
```

There is no test runner configured. `npm run build` is the typecheck gate — run it to verify changes compile.

## What this is

Money Space (package name `family-finance-app`) is a Vietnamese-first family/household finance web app — an MVP frontend. React 19 + Vite + TypeScript, Tailwind v4, shadcn/ui (new-york style), react-router-dom v7, react-hook-form + zod, zustand, recharts, i18next.

**The UI currently renders entirely from local mock/seed data, not from a live backend.** Pages import from [src/lib/mock-data.ts](src/lib/mock-data.ts) and [src/lib/assets.ts](src/lib/assets.ts) and hold state in local `useState`. Supabase is scaffolded ([src/lib/supabase.ts](src/lib/supabase.ts)) but the client is `null` unless `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are set (see [.env.example](.env.example)), and no page reads from it yet. When adding backend integration, this is greenfield — wire mock sources over to Supabase queries.

## Architecture

- **Routing**: [src/routes/router.tsx](src/routes/router.tsx) defines a single `createBrowserRouter` tree. `AppShell` (sidebar + `<Outlet />`) wraps every page. Each nav destination is a `*-page.tsx` in [src/routes/](src/routes/); the nav list itself lives in [src/components/layout/app-shell.tsx](src/components/layout/app-shell.tsx).
- **State**: [src/store/app-store.ts](src/store/app-store.ts) is a minimal zustand store (just `activeHouseholdId`). Most page state is local `useState` seeded from mock data.
- **Path alias**: `@/` → `src/` (configured in both [vite.config.ts](vite.config.ts) and tsconfig). Always import via `@/...`.
- **UI components**: [src/components/ui/](src/components/ui/) are shadcn/ui primitives (managed via `components.json`, `npx shadcn@latest add ...`). Feature components live under `src/components/<feature>/`. Utility `cn()` is in [src/lib/utils.ts](src/lib/utils.ts).

## The asset valuation model (core domain)

[src/lib/assets.ts](src/lib/assets.ts) is the heart of the app and mirrors the backend spec. Every asset `type` maps deterministically to a `valuationMode` and a default `liquidity` bucket via lookup tables — **do not let the user free-pick valuation mode; derive it from type** (`valuationModeForType`, `defaultLiquidityForType`). The three modes:

- `manual` — user enters an estimated value.
- `market_priced` — value = quantity × market price (mock prices in `mockPrices`, FX via `mockFxToVnd`, both stand-ins for a future pricing API).
- `formula_calculated` — value = principal + simple accrued interest (`computeFormulaValue`).

`computeCurrentValue(asset, asOf)` is the single entry point that dispatches on mode and returns VND (or `null` when a market symbol has no known price). The assets page ([src/routes/assets-page.tsx](src/routes/assets-page.tsx)) shows the canonical pattern: a discriminated form where visible fields switch on the selected type's mode, with a live computed-value preview. `AS_OF` is a hardcoded date constant used across asset computations. Money is stored as VND numbers; `formatVndShort` renders the short "24,5M" style (note the comma decimal separator).

## Conventions

- **Components come from `src/components/`; primitives come from shadcn/ui.** Every UI element must be built from a component in [src/components/](src/components/) — reuse the existing feature/UI components. If a needed primitive isn't there yet, install it from shadcn/ui (`npx shadcn@latest add ...`) into [src/components/ui/](src/components/ui/) rather than hand-rolling markup. Never build ad-hoc UI when a shadcn primitive exists for it.
- **All UI must follow the app design system in [design.md](design.md).** [design.md](design.md) is the source of truth for the visual language — colors/tokens, typography scale, spacing, radius (`rounded-card`, `rounded-full`), shadows (`shadow-soft`, `shadow-apple`), the Apple-like calm-finance direction, layout/IA (section → sub-section → metric), component style rules (Card, Button, Badge, Input, Select, Table, Dialog/Sheet, Progress), icon system (lucide, line icons), and copywriting/voice. New and modified UI must match these patterns and classes — don't invent per-component styling that diverges from the system.
- **i18n is mandatory for user-facing text.** Default language is Vietnamese (`vi`), fallback also `vi`; English (`en`) is the secondary. All copy goes through `useTranslation()` / `t('key')` with keys defined in [src/i18n/resources.ts](src/i18n/resources.ts) (both `vi` and `en` must be filled). Never hardcode display strings. Enum-like values are translated via keyed lookups, e.g. `t('options.assetType.${type}')`.
- **Forms**: react-hook-form with `zodResolver`, `mode: 'onChange'`. Build zod schemas with the localized helpers in [src/lib/validation.ts](src/lib/validation.ts) (`localizedRequiredText`, `localizedOptionalText`, etc.) so error messages are translated. For conditional validation (fields that depend on another field's value), use `.superRefine`, as the asset schema does per valuation mode.
- **Money input parsing**: user-entered amounts use a shorthand (`"20M"`, `"1,8M"`, `"500K"`, `"1.2B"`) validated by `moneyPattern` and parsed to VND by `parseMoneyToVnd`. Comma is a decimal separator.
- **Styling**: Tailwind v4 utility classes with CSS variables, e.g. `text-[hsl(var(--muted-foreground))]`, `bg-[hsl(var(--accent))]`. Chart colors are centralized (e.g. `liquidityColors` in assets.ts) — follow the dataviz palette rather than inventing per-chart hues.

## Backend reference

The full Postgres schema (Supabase, with RLS policies) lives in [supabase/migrations/20260705223000_init_money_space.sql](supabase/migrations/20260705223000_init_money_space.sql). TypeScript row types are in [src/types/database.ts](src/types/database.ts). The design/spec docs at the repo root (`# Product Spec v1.md`, `# Backend Tables & Relationships — Money.md`, `design.md`) are the source of truth for domain rules; the frontend enum unions in `src/lib/assets.ts` deliberately mirror the SQL enums.

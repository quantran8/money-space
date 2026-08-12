# v3.1 foundations (Phase 0)

- **Date**: 2026-08-12
- **Session folder**: `session/2026-08-12/v31-foundations/`
- **Status**: done

## What the task is

First phase of implementing the v3.1 product spec (`family-finance-v3.1/`) across the frontend and
backend. This phase lands only foundations — no user-visible change — so later phases have correct
docs, shared plumbing, and a copy guard to build on.

Plan: `~/.claude/plans/family-finance-v3-1-implement-recursive-lollipop.md`.

## Changes made

- `CLAUDE.md` — **rewritten.** It described a pre-refactor layout (`src/routes/`,
  `src/lib/mock-data.ts`, `src/lib/assets.ts`, `src/store/app-store.ts`) that has not existed since
  `c36bca8 refactor app structure`, and claimed the UI runs on mock data — untrue since
  `a4923f3`/`59fc645 connect api to backend`. It now documents the real feature-sliced layout, the
  `apiRequest` HTTP boundary, the v3.1 product thesis, and the voice rules.
- `design.md` (root) — replaced with a pointer to `family-finance-v3.1/design.md`. The root file was
  the v2 system whose Home layout v3.1 explicitly retires; keeping both invited an agent to follow
  the wrong one. Full v2 text stays in git (`git show 28bb7c5:design.md`).
- `src/shared/api/supabase.ts`, `src/shared/types/database.ts` — **deleted.** 574 lines that only
  imported each other; nothing else in `src/` referenced them. The app talks to the NestJS backend.
- `package.json` — dropped the `@supabase/supabase-js` dependency (sole consumer was the file above);
  `lint` now also runs the copy check.
- `src/shared/api/env.ts` — reduced to `apiBaseUrl`; the Supabase env vars and `hasSupabase` are gone.
- `src/shared/api/query-keys.ts` — added v3.1 keys: `forecast`, `flexibleMoney`, `financialState`,
  `cashflowEvents`, `cashflowOccurrences`, `reserves`, `freshness`, `goalProjection`.
- `src/shared/stores/whatif-store.ts` — **new.** Holds the global what-if sheet's open state and
  prefill.
- `src/shared/lib/format-money.ts` — added `formatMonthYear` for goal projection dates.
  (`formatVndSigned` already existed.)
- `scripts/check-copy.mjs` — **new.** Fails `npm run lint` when banned vocabulary appears in the i18n
  resources.
- `src/i18n/resources.ts` — added the v3.1 `options.*` enum namespaces in **both** `vi` and `en`:
  `financialState`, `financialMode`, `sharingLevel`, `sharingLevelDescription`, `financialNature`,
  `direction`, `requirement`, `certainty`, `recurrence`, `cashflowStatus`, `horizon`.

## Key decisions

- **What-if is a store + one mounted sheet, not a route.** The spec is explicit that what-if is a
  global contextual action, not a nav tab. A zustand store lets any screen open it without prop
  drilling and without a URL.
- **`sharingLevel` keeps all four backend values even though the MVP UI exposes three.** A record
  already stored as `grouped` must still render a label rather than an empty Select; the *selectable*
  set is narrowed at the component, not in the translation table.
- **The copy guard has a small, explicit allowlist.** Two existing strings legitimately use banned
  words while negating them ("không tạo cảm giác kiểm soát", 'thay vì "cảnh báo"'). They are
  allowlisted by exact substring so any *new* use still fails the build.
- **The 14 pre-existing eslint problems were left alone.** Verified they are identical with these
  changes stashed — they are not from this work, and they sit in files later phases rewrite anyway.
  Note this means **`npm run lint` was already exiting non-zero before this phase**; `npm run build`
  is the reliable gate. The copy check therefore runs *before* eslint in the `lint` script, so a
  pre-existing eslint failure cannot silently skip the copy guard.

## Mobile app parity notes

- The **voice rules and banned vocabulary** apply to mobile identically — port
  `scripts/check-copy.mjs` (or its list) into the mobile repo's lint.
- The **`options.*` translation keys** are shared domain vocabulary; copy them verbatim so both
  clients label enums the same way.
- **Do not port**: `scripts/check-copy.mjs` path assumptions, the Vite/`env.ts` specifics, and the
  Supabase removal (mobile never had that scaffolding).
- Mobile will need the same what-if-as-contextual-action decision: no what-if tab in the bottom nav.

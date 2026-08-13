# Phases 9–11 — Home rework, household + nav restructure, asset classification, onboarding

- **Date**: 2026-08-13
- **Session folder**: `session/2026-08-13/phase-9-11-home-household-onboarding/`
- **Status**: done

## What the task is

The final three v3.1 frontend phases from
`session/2026-08-13/v31-remaining-phases/README.md`. With these, phases 0–11 are
complete.

## Phase 9 — Home rework

New Home in the **mandated order**: Financial State → Flexible Money → What-if
CTA → 30 Days Ahead → Money Location → Main Goal → Freshness.

- New: `financial-state-section.tsx`, `flexible-money-section.tsx`,
  `whatif-cta-section.tsx`, `days-ahead-section.tsx`,
  `money-location-section.tsx`, plus `features/freshness/` (types, repository,
  `use-freshness`, `freshness-section.tsx`).
- `dashboard-page.tsx` swapped in one commit, then the dead components deleted:
  `net-worth-hero.tsx` (§19 — Total Assets must not be the hero),
  `discuss-section.tsx`, `recent-events-section.tsx` (small transactions banned
  from Home), `long-term-goal-section.tsx`, `assets-breakdown-section.tsx`,
  `upcoming-payments-section.tsx`, `responsibility-section.tsx`.
- Both dashboard hooks trimmed: `use-dashboard-page.ts` 194 → 36 lines,
  `use-dashboard-overview.ts` no longer fans out to debts/events/cashflow.
  `dashboard.ts` lost 64 lines of helpers that nothing called any more.

## Phase 10 — household slice + nav restructure

- `src/features/household/` — a composition slice mounting the members
  components, sharing + reminders cards (moved off `/settings`), a new reserve
  card, an assets summary and freshness.
- `/settings` trimmed to account / data / categories.
- **Sidebar 5 primary + 3 secondary**, split by a `<Separator/>`:
  primary `/` · `/upcoming` · `/goals` · `/assets` · `/household`;
  secondary `/events` · `/debts` · `/settings`.
- New `mobile-bottom-nav.tsx` (five primary only) and the what-if FAB lifted
  above it.
- Redirects: `/payments` → `/upcoming`, `/members` → `/household`.
- Deleted the orphaned `members-page.tsx` and `members-sidebar.tsx`.

## Phase 11 — asset classification, then onboarding

- `model/asset-classification.ts` — `FinancialNature` and the canonical
  `VisibilityLevel`, with `MVP_VISIBILITY_LEVELS` exposing **three** of the four
  and `isSelectableVisibility` keeping a stored `grouped` record rendering its
  label read-only instead of an empty Select.
- `asset-classification-fields.tsx` — extracted so the dialog and onboarding
  render the same fields (the plan's "biggest reuse win").
- `AssetForm` + zod schema extended; `private` requires a `privacyOwnerMemberId`
  (§30).
- **Onboarding wizard**: 10 screens, resumable via `{onboardingStep,
  householdId}` now persisted in `household-store.ts`. Ends on the **Clarity
  Moment** (`FirstPictureStep`) and the **Consequence Moment**
  (`FirstWhatIfStep`).

## Key decisions

- **The `settings-form.ts` sharing rename was safe, and I checked why.** The
  README flagged it as breaking. Tracing `handleSave` showed only `currency` is
  ever sent to the server — `shareAssets` / `shareUpcoming` are local-only form
  state. So the rename to the canonical union could be done outright with no
  stored value stranded. The old union (`'overview' | 'grouped' | 'detailed'`)
  matched nothing on the backend: `detailed` was never valid and `private` could
  not be expressed at all.
- **`options.financialNature.*` already existed** with better copy than what I
  was about to add; I deleted my duplicate rather than overwrite it.
- **Money Location falls back to buckets.** The plan wants holder grouping by
  default, but assets carry no holder field until Phase 11's own form changes
  land against a live DB. The component takes `holders` and renders them when
  present; today Home passes `[]`. No further change is needed there once real
  holder data exists.
- **`RequireHousehold` needed a second condition.** After step 1 the user HAS a
  household, so the existing `total === 0` check would wave a half-finished
  wizard through into the app. It now also redirects when `onboardingStep` is
  non-null.
- **Onboarding steps write immediately, not batched at the end.** A user who
  abandons halfway keeps what they entered. Every step writes through the same
  slice hooks the rest of the app uses — onboarding is a different *sequence*
  over existing features, never a second implementation.
- **The wizard's step lives in a persisted store, not local state.** The setup
  asks for a lot; losing it once to a closed tab is enough to lose the user.
- **The mobile bottom bar carries five destinations, not eight.** The three
  secondary items stay in the drawer — a bar with eight targets is a bar nobody
  can hit.

## Gate

- `npm run build` — **clean** at every phase boundary.
- `node scripts/check-copy.mjs` — **passes**.
- `npx eslint .` — **6 errors, 8 warnings**, unchanged from the pre-existing
  baseline across all six phases.
- Every new i18n key verified to resolve in **both** `vi` and `en` by runtime
  lookup (28 wizard keys in the last batch alone), not just structurally.
- All new modules transform 200 under Vite.

**Not proven:** live rendering, at any point in phases 5–11. The v3.1 migrations
are still unapplied, so no screen has been exercised against real data. This is
the same limit flagged at the start and it has not moved — applying the
migrations is the next real step, and the first thing that could invalidate any
of this.

## Mobile app parity notes

- Home's **section order is mandated** and part of the product argument, not a
  layout preference. Port the order, and port the two absences too: no net-worth
  hero, no recent-transactions list.
- `features/freshness/` and `features/household/` port directly. The 5+3 nav
  split and the five-item bottom bar should be mirrored.
- **`asset-classification.ts` is business logic, not UI** — the three-of-four
  MVP picker and the read-only `grouped` fallback must be ported as rules.
- Mobile's own settings form almost certainly has the same
  `'overview' | 'detailed'` union; it is wrong against the backend and should be
  renamed the same way.
- The onboarding wizard's resumability contract is `{onboardingStep,
  householdId}` persisted locally; mobile should use the same two keys so a user
  switching devices at least resumes coherently per-device.

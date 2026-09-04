# Category as a real foreign key (`category_id`)

- **Date**: 2026-09-04
- **Session folder**: `session/2026-09-04/category-id-foreign-key/`
- **Status**: done

## What the task is

`money_events.category` and `cashflow_events.category` were free TEXT **codes**,
matched against `money_event_categories` at the app layer only — no foreign key.
The user asked for a genuine 1-1 relation to the categories table.

Decisions taken (all confirmed with the user before implementing):

1. **FK targets `id`, not `code`** — see below for why `code` cannot be an FK
   target here.
2. **Drop the code column entirely.** No denormalized `category` alongside
   `category_id`; one source of truth.
3. **`households.config.defaultEventCategoryCode` → `defaultEventCategoryId`**,
   for consistency (it had the same code-as-pointer problem).
4. **Backfill falls back to the system `other` row** for any code that no longer
   resolves, so the column can be NOT NULL with no orphans.

## Why `code` could never be the FK target

`money_event_categories.code` is unique only **per scope**, enforced by two
partial unique indexes: one on `(household_id, code) WHERE household_id IS NOT
NULL`, another on `(code) WHERE household_id IS NULL` (the shared system rows).
No single unique constraint covers the column, so nothing can reference it. A
composite `(household_id, code)` FK does not work either: system rows carry
`household_id IS NULL`, which cannot match an event's non-null household.

`id` is a global primary key, so `category_id` references it directly and the
scope question moves entirely into the app's lookup (which it already did).

## Changes made

### Migration — `backend/prisma/migrations/20260904090000_category_id_foreign_key/`

Per table (`money_events`, then `cashflow_events`): add nullable `category_id`,
backfill in the app's own resolution order (the row's OWN household category
first, then the shared system row, then the system `other` fallback), set NOT
NULL, add the FK (`ON DELETE RESTRICT`), swap the `(household_id, category)`
index for `(household_id, category_id)`, drop `category`.

Then `households.config`: rewrite `defaultEventCategoryCode` → resolved
`defaultEventCategoryId`, **dropping** the pointer where the code no longer
resolves rather than repointing it at `other` (that would silently change the
household's own choice, unlike an event whose category is merely unknown).

Two things worth knowing about the SQL:
- The household-scope backfill runs **before** the system-scope one and both
  only fill `NULL`s, which is what makes "own row wins over system row"
  deterministic without an explicit ordering.
- The config rewrite uses a **correlated scalar subquery**, not `UPDATE … FROM
  LATERAL`: the UPDATE target is not laterally visible to a `FROM` item, so
  referencing `h` there fails with `invalid reference to FROM-clause entry`.
  (First attempt did exactly that and was rolled back — Prisma wraps each
  migration in a transaction, so nothing partial landed.)

Preflight confirmed every existing code resolved cleanly (38 money events, 68
cashflow events, 1 household pointer) — nothing hit the `other` fallback.

### Backend

- `prisma/schema.prisma` — `MoneyEvent.categoryId` / `CashflowEvent.categoryId`
  as `@db.Uuid` FKs with named relations, plus the two back-relations on
  `MoneyEventCategory`; index renamed.
- **New resolver methods** on the money-events repository +
  `MoneyEventsService.resolveCategoryIdOrThrow(householdId, id)` /
  `systemCategoryId(householdId, code)`. Both are public so
  `CashflowEventsService` reuses them instead of duplicating the scope lookup.
  Every internal flow that used to write a literal code now resolves an id:
  - `money-events.service.ts` — the saving-interest auto-create (`'interest'`),
    including its idempotency check, which compared `event.category ===
    'interest'` and now compares ids.
  - `debts.service.ts` — three `category: 'debt'` writes.
  - `prisma-assets.repository.ts` — three raw-SQL INSERTs that wrote `'other'` /
    `'investment'` literals; each now resolves the system row **inline in the
    SQL**, keeping the "one round-trip" property those statements were built for.
- `money-event-categories` module: `setDefaultCategoryCode` →
  `setDefaultCategoryId`, new `findVisibleCategoryById` (system rows included —
  unlike `findHouseholdCategoryById`, which deliberately excludes them),
  `findCategoryByCode` now resolves own-row-over-system-row explicitly.
  `SetDefaultCategoryDto.code` → `.categoryId`.
- `money-space.mapper.ts` — `mapHouseholdConfig` reads `defaultEventCategoryId`;
  `mapMoneyEvent`/`mapCashflowEvent` map `categoryId`. **`normalizeMoneyEventCategory`
  deleted** — it defaulted a blank code to `'other'`, which is meaningless for an id.
- `toMoneyEventCard` (the wire shape) returns `categoryId` only — the client
  already holds the full category list and resolves label/glyph/colour off it,
  so shipping those per event would duplicate them on every row.
- Test fixtures updated (`spend-aftermath`, `wallet-values-after-pending`,
  `assets.service.spec`, `app.e2e-spec`), and the two `CashflowEventsService`
  spec mocks gained the resolver methods.

### Frontend core

- `MoneyEventItem`, `EventPayload`, `CashflowEvent`, `CashflowEventPayload`,
  `LocalMoneyEvent`, `FinancialRecordItem` — all `category: string` →
  `categoryId: string`.
- `EventCategoryItem.code` **stays** — it is the category row's own field and
  still the i18n key (`options.eventCategory.<code>`); only events stopped
  storing it.
- **New `useCategoryVisuals()`** (core) — id → `{ label, iconKey, iconColor }`,
  shared by the events timeline, the dashboard's spending rows and both pickers,
  rather than each surface rebuilding the same memo.
- `categoryOptions` in both hooks: `value` is now `category.id`; the label is
  still resolved through `category.code`.
- `defaultCategoryCode` → `defaultCategoryId` in both hooks.
- `toSalePayload` takes the resolved `investment` category id as a parameter;
  `use-asset-sale` resolves it (own row over system row).
- `use-asset-detail`: a note-less entry falls back to its **date**, not the
  category — the category is a UUID now, not a readable code.
- The react-hook-form field is still **named** `category` in both forms, but it
  holds an **id**. Documented on the type rather than renamed, to keep the diff
  contained.

### Frontend web

- `RecordCard` — the three separate `categoryIconKey`/`categoryIconColor`/derived
  label props collapse into one `categoryVisual?: { label, iconKey, iconColor }`,
  since they all come from the same lookup now.
- `events-timeline-card` / `events-page` — `categoryVisualByCode` →
  `categoryVisualById`.
- `spending-section` (dashboard) — takes `categoryVisualById` and renders the
  resolved label; a row whose category cannot be resolved shows **no subtitle**
  rather than a raw UUID.
- `categories-card` — the star toggle sets the default by `category.id`.
  It still *displays* `category.code` for custom rows, which is correct.

### Mobile

**No changes needed.** `event-form-sheet.tsx` consumes `categoryOptions`
generically (value/label) and binds the form's `category` field — both still
correct now that core supplies ids as the option values.

## Verification

- Migration applied to the dev Supabase DB; row counts preserved exactly per
  category (26/4/3/2/1/1/1 money events, 68 cashflow events), both FKs and both
  indexes present, `category` column dropped, household pointer converted and
  the old key removed.
- Prisma relation reads verified end-to-end (`money_events` → category code +
  iconKey; `cashflow_events` → category code).
- Backend: build clean; typecheck down to **7 pre-existing** errors (from 8 —
  fixing a spec mock incidentally resolved one); **791/792 tests pass**, the one
  failure being the pre-existing `vnstock-commodity` gold-price test, unrelated.
- Frontend: `pnpm build` clean, `pnpm lint` 0 errors (13 pre-existing warnings).
- Backend restarted clean against the migrated DB, `/health` 200, zero ERROR
  lines in the log.

**Not verified**: the UI was not exercised in a browser (needs a logged-in
session). Everything above is schema-, type- and API-level verification.

## Mobile app parity notes

The schema and API are shared, so the RN app is already on the new contract the
moment it refetches — but two things to check when next touching it:

1. **`useCategoryVisuals()` is in core**, so the RN app can and should use it
   wherever it renders a recorded/expected event's category. It currently does
   not render categories outside the form picker.
2. **Do not reintroduce a code-keyed lookup.** Anything mapping "category" to a
   label/icon must key by **id**; the code survives only as the i18n key on the
   category row itself.

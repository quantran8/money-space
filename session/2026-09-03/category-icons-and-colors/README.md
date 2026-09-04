# Category icons, colors, and code auto-generation

- **Date**: 2026-09-03
- **Session folder**: `session/2026-09-03/category-icons-and-colors/`
- **Status**: done

## What the task is

Started from "update every money-event row to render like a mockup" (a coloured
disc, category as subtitle, person + wallet meta line). Grew, across the
conversation, into:

1. Every `money_event_categories` row carries an **icon key** (a lucide glyph
   name) and an **icon color** (a hex fill); the frontend maps the key to a
   component and renders the fill as the disc's background with a white glyph.
2. `cashflow_events` (the upcoming/forecast side) gets its own `category`
   column — it used to have none, and completing an outgoing item hardcoded
   `category: 'other'` regardless of what it actually was.
3. Creating a money event no longer synthesizes a placeholder note
   (`"Chưa có ghi chú thêm."`, a transfer auto-note, or falling back to the
   cashflow event's name on completion) — an empty note stays empty; the
   timeline already falls back to the category label when there is no note.
4. The Settings → Categories "Add category" dialog no longer asks for a code:
   the backend derives a lowercase-snake_case slug from the label (with a
   Vietnamese-aware transliteration) and resolves collisions by appending
   `_2`, `_3`, ... A household never sees or types a code at creation.
5. The cashflow (upcoming) create/edit form gained a **category select field**
   it never had.
6. Every category-carrying `<Select>` (money-event form, cashflow form) and
   every category-carrying row (RecordCard, Settings card) now renders the
   same disc — glyph + fill — instead of plain text.

## Changes made

### Backend (`money-space-backend`)

- **Migrations**:
  - `20260903100000_category_icon_key_and_cashflow_category` — adds
    `money_event_categories.icon_key` (seeds all 16 system categories),
    `cashflow_events.category` (NOT NULL, default `'other'`, backfills
    existing rows), and an index on `(household_id, category)`.
  - `20260903110000_category_icon_color` — adds
    `money_event_categories.icon_color` (nullable hex string).
  - Both applied to the dev Supabase DB (along with one pre-existing pending
    migration, `20260830014051`, unrelated to this session — a goal/snapshot
    FK and index rename — confirmed with the user before running
    `migrate deploy` since it touches a real, non-local database).
- `prisma/schema.prisma` — `MoneyEventCategory.iconKey`/`.iconColor`;
  `CashflowEvent.category`.
- `money-event-categories` module:
  - `MoneyEventCategoriesService.createCategory` no longer accepts `code` from
    the client — it derives one via a new `slugify()` (Vietnamese diacritics →
    ASCII, `đ/Đ` handled explicitly since NFD doesn't decompose them, then
    collapsed to `snake_case`) and resolves collisions with a numeric suffix.
    `CreateMoneyEventCategoryDto.code` is now optional and ignored.
  - Added `normalizeIconKey` (kebab-case shape check only — the backend does
    NOT pin the valid icon set, the client owns that map) and
    `normalizeIconColor` (hex shape check: `#RGB`/`#RRGGBB`/`#RRGGBBAA`).
  - `updateCategory` accepts `iconKey`/`iconColor`; system rows still reject
    all edits (unchanged `ensureCustomCategory` gate).
  - Entity, DTOs, mapper, and the Prisma repository (`insertCategory`,
    `updateCategory`) all carry the two new fields through.
- `cashflow-events` module:
  - `CashflowEvent` entity, `CreateCashflowEventDto`, the Prisma repository's
    `createMany`/`updateMany` writes, and the service's create/update paths
    all carry `category` (defaulted/normalized via the existing
    `normalizeMoneyEventCategory` from `money-space.mapper.ts` — no second
    normalizer written).
  - `completeCashflowEvent` now records the money event with
    `category: event.category` instead of the hardcoded `'other'` for every
    outgoing item.
  - `completeCashflowEvent`'s `note` is `payload.note?.trim() ?? ''` — no
    longer falls back to `event.name` when the user typed nothing.
- Two backend unit-test fixtures (`spend-aftermath.spec.ts`,
  `wallet-values-after-pending.spec.ts`) updated with a `category: 'other'`
  field to satisfy the now-required `CashflowEvent.category`.

### Frontend core (`packages/core`)

- `features/events/api/event-categories.repository.ts` — `EventCategoryItem`
  gained `iconKey`/`iconColor`; `EventCategoryPayload` dropped `code` (create
  never sends one) and gained `iconKey?`/`iconColor?`; `updateEventCategory`'s
  payload type is now `Partial<EventCategoryPayload>` (was
  `Partial<Omit<..., 'code'>>`, now redundant).
- `features/events/hooks/use-events-page.ts` — `categoryOptions` entries carry
  `iconKey`/`iconColor`; replaced the narrower `categoryIconByCode` with
  `categoryVisualByCode` (code → `{ iconKey, iconColor }`).
- `features/events/hooks/use-events-page.ts` — removed the auto-note synthesis
  entirely: `resolvedNote = values.note.trim()` replaces the old `autoNote`
  (which fell back to `t('common.noAdditionalNote')` or a generated transfer
  sentence). The now-unused `fromAsset`/`toAsset` locals were removed too.
- `features/cashflow/model/cashflow.types.ts` — `CashflowEvent.category: string`.
- `features/cashflow/api/cashflow-events.repository.ts` —
  `CashflowEventPayload.category?: string`.
- `features/cashflow/model/cashflow-form.ts` — `CashflowEventForm.category`,
  defaulted to `'other'`, required in `buildCashflowSchema`.
- `features/cashflow/hooks/use-cashflow-form.ts` — pulls `useEventCategories`,
  computes `defaultCategoryCode` (mirrors the money-event form's own default
  prefill) and `categoryOptions` (value/label/iconKey/iconColor), prefills
  `category` on both create and edit, submits it, and now returns
  `categoryOptions` to callers.

### Frontend web (`web/src`)

- **New**: `features/events/ui/components/category-icon.tsx` — the
  `iconKey → LucideIcon` map (16 entries matching the seeded keys exactly) plus
  `CATEGORY_ICON_FALLBACK` and `CATEGORY_ICON_KEYS`. Deliberately exports the
  map + fallback rather than a lookup function — a capitalized binding
  assigned from a function CALL trips `react-hooks/static-components` (same
  reasoning as the pre-existing `event-type-icon.tsx`); callers do
  `CATEGORY_ICONS[key] ?? CATEGORY_ICON_FALLBACK` directly.
- **New**: `features/events/ui/components/category-icon-picker.tsx` — the
  glyph grid + colour swatches (a curated row plus a native
  `<input type="color">` for a fully free choice) used by the Settings card.
- **New**: `features/events/ui/components/category-select-item.tsx` — the
  disc + label used inside a `<SelectItem>`, shared by the money-event form
  and the cashflow form so both pickers look identical.
- `features/events/ui/components/record-card.tsx` — rewritten row shape: a
  disc (category glyph, white-on-fill when the category has a colour,
  `bg-wash`/`text-ink2` neutral otherwise) replaces the old type-icon +
  initial-avatar; category renders as a subtitle (tinted `text-attention-ink`
  when the record needs attention, same as before); a `User` + `Wallet` meta
  row replaces the old avatar-only actor. Accepts `categoryIconKey` and
  `categoryIconColor` props from the caller.
- `features/events/ui/components/events-timeline-card.tsx` — threads
  `categoryVisualByCode` down to each `RecordCard`.
- `features/events/ui/events-page.tsx` — passes `categoryVisualByCode` through.
- `features/events/ui/components/actual-record-form.tsx` — the "Danh mục"
  `<Select>` now renders `<CategorySelectItem>` per option instead of plain
  text, so the trigger and the open list both show the glyph+fill.
- `features/cashflow/ui/components/cashflow-event-form-dialog.tsx` — added the
  category field entirely (a `<Select>` between name and expected date, using
  `<CategorySelectItem>`); takes a new `categoryOptions` prop.
- `features/forecast/ui/upcoming-page.tsx`,
  `features/dashboard/ui/dashboard-page.tsx` — pass
  `categoryOptions={cashflowForm.categoryOptions}` to the dialog.
- `features/settings/ui/components/categories-card.tsx` — the add-category
  dialog lost its code field entirely (label + icon/colour picker only); the
  row grid gained a leading disc (glyph + fill, editable via
  `CategoryIconPicker` for custom rows only — system rows keep their seeded
  glyph/fill, same rule as their code).
- **Removed**: `features/events/ui/components/events-data-table.tsx` — dead
  code, not rendered anywhere (the live list is `RecordCard` via
  `EventsTimelineCard`); confirmed with the user before deleting.
- `packages/core/src/i18n/resources.ts` — added `settings.categories.iconLabel`
  /`colorLabel`/`customColor`/`clearColor` (vi+en); removed
  `codeLabel`/`codePlaceholder`/`codeHint` (no longer referenced anywhere);
  added `upcoming.form.category`/`categoryPlaceholder` (vi+en).

## Key decisions

- **Disc colour is a deliberate exception to design v5 §4** ("colour encodes
  meaning, never decoration/identity" — see memory
  `system-colors-not-new-hues`). The first pass built a neutral-only disc on
  that basis; the user then explicitly asked for a user-chosen background
  colour with a white glyph, which is their call on their own product, not a
  drift from the system. Implemented as a genuinely free hex choice (swatches
  are a shortcut, not a limit) rather than a fixed palette, since "để user tự
  chọn" was explicit.
- **Code is server-generated, never client-supplied**, on the user's explicit
  instruction. `slugify()` handles Vietnamese labels (the common case here)
  with an explicit `đ/Đ` pass before NFD stripping, since `đ` is a distinct
  Unicode letter that does not decompose into `d` + a combining mark.
  Collisions resolve with a numeric suffix rather than a 409 — the label field
  gave the household no way to predict or retry a slug conflict.
- **Icon key is shape-checked, not enum-validated, on the backend.** The
  client owns the actual key→icon map (`category-icon.tsx`); pinning the valid
  set server-side would mean a backend release every time a glyph is added.
  An unrecognized key can never break a render — every read site falls back
  to `CATEGORY_ICON_FALLBACK`.
- **`categoryVisualByCode` replaces `categoryIconByCode`** rather than adding a
  second parallel map — both fields come from the same category row, so one
  lookup table serving both call sites, not two maps threaded in parallel.
- **Auto-note removal is a UI-layer change only** (`use-events-page.ts`); the
  backend's `createMoneyEvent` never synthesized a note (`payload.note?.trim()
  ?? ''` was already correct) — only the create/edit form and the cashflow
  completion path were injecting placeholder text.
- **`EventsDataTable` deleted, not just left unused** — confirmed with the
  user first (see conversation). Two ways to render the same list is a bug
  waiting to happen the next time someone edits the wrong one.

## Mobile app parity notes

None of this reached the Expo app yet. Everything here needs a port:

1. **Schema/API is shared** — the RN app talks to the same backend, so
   `iconKey`/`iconColor` on categories and `category` on cashflow events are
   already live for it once it fetches the updated endpoints. No backend work
   needed there.
2. **Icon map**: `mobile/` needs its own `category-icon.tsx` equivalent using
   `lucide-react-native`, keyed by the SAME 16 seeded strings
   (`house`, `graduation-cap`, `bus`, `heart-pulse`, `users`, `shield-check`,
   `piggy-bank`, `trending-up`, `landmark`, `arrow-down-left`, `percent`,
   `wrench`, `shopping-basket`, `baby`, `plane`, `circle-dashed`) — this is the
   contract, not the web component itself.
3. **Disc rendering**: wherever the RN app lists money events or upcoming
   items, it needs the same disc treatment (fill from `iconColor`, white glyph
   when set, neutral `wash`/`ink2` otherwise) — check whether it currently
   shows a type icon, an avatar initial, or nothing.
4. **Category picker in forms**: the RN money-event form and (once it exists)
   any cashflow-event form need the category `<Select>` equivalent to render
   the disc, not plain text — mirrors `CategorySelectItem` here.
5. **Code auto-generation**: any "add category" UI in the RN app must NOT ask
   for a code — the backend now ignores it. If mobile's create-category form
   still has a code field, remove it.
6. **No-auto-note**: if mobile's money-event create form has its own
   placeholder-note fallback (parallel to the one removed from
   `use-events-page.ts`), remove it there too — empty note is a real,
   displayable state on both platforms now.

Web-specific, do **not** port as-is: the native `<input type="color">` picker
in `category-icon-picker.tsx` (RN needs a proper colour-picker library or a
swatch-only approach), and the Radix `Select`/`Popover` mechanics generally.

# Money-event category: default flag + Settings section

- **Date**: 2026-07-14
- **Session folder**: `session/2026-07-14/category-default-and-settings-section/`
- **Status**: done

## What the task is

Add an `isDefault` field to money-event categories: the flagged category is
auto-selected in forms that need a category. One default per household; a system
OR custom category can be the default. Also surface a Settings section to create
categories and set the default.

## Design

Default-ness can't be a boolean column on `money_event_categories` because system
rows are shared across households (`household_id IS NULL`). Instead it's a
**per-household pointer** stored in a new **`households.config`** jsonb bag:
`config.defaultEventCategoryCode`. The list API overlays a computed `isDefault`
per row (code === pointer). This keeps "1 per household" trivially true and lets
the pointer target a system code.

## Changes made

### Backend (`money-space-backend`)

- `prisma/schema.prisma` — added `config Json @default("{}")` to `Household`.
- `prisma/migrations/20260714150000_household_config/migration.sql` — adds the
  `households.config` jsonb column.
- `modules/households/entities/household.entity.ts` — added `HouseholdConfig`
  (`defaultEventCategoryCode?`) + `config` on `Household`.
- `common/repositories/money-space.mapper.ts` — `mapHousehold` parses `config`
  (tolerant of object/string/malformed → `{}`); `mapMoneyEventCategory` defaults
  `isDefault: false` (service overlays the real value).
- `modules/money-event-categories/`:
  - `entities/money-event-category.entity.ts` — added `isDefault`.
  - `dto/set-default-category.dto.ts` — new (`{ code: string | null }`).
  - `repositories/*` — `setDefaultCategoryCode` (jsonb merge / key-remove via raw
    SQL) + `findCategoryByCode` (system or own).
  - `money-event-categories.service.ts` — `listCategories` overlays `isDefault`
    from the household config; new `setDefaultCategory` (validates the code is
    visible, replaces the single pointer, `null` clears); `deleteCategory` clears
    a dangling default; `createCategory` sets `isDefault: false`.
  - `money-event-categories.controller.ts` — `PUT /default` (before `:categoryId`).

### Frontend (`money-space-frontend`)

- `features/events/api/event-categories.repository.ts` — `isDefault` on
  `EventCategoryItem`; `setDefaultEventCategory(householdId, code|null)`.
- `features/events/hooks/use-event-categories.ts` — `setDefaultCategory` mutation.
- `features/settings/ui/components/categories-card.tsx` — per-row **star toggle**
  to set/clear the default (system + custom), "Mặc định" badge on the default.
- `features/events/hooks/use-events-page.ts` — `defaultCategoryCode` memo;
  create-reset prefills `category` with it.
- `i18n/resources.ts` — `settings.categories.{default,setDefault,unsetDefault,
  defaultSet,defaultCleared,defaultError}` (vi + en).

## Key decisions

- **Config bag, not a row column.** `households.config` jsonb is extensible for
  future per-household settings; the default category is its first key.
- **Toggle semantics.** Star on a non-default sets it (replacing the old);
  star on the current default clears it. At most one default.
- **Auto-select only on create.** Editing keeps the event's own category.

## Mobile app parity notes

- Add `households.config` jsonb (shared Supabase migration
  `20260714150000_household_config` already covers the DB).
- Category model gains `isDefault` (computed); add the `PUT .../default` call.
- Auto-select the default category in the mobile create form.
- Add a set-default control (star) in the mobile categories/settings screen,
  available for system + custom rows.

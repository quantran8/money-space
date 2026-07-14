# Event category from money_event_categories table

- **Date**: 2026-07-13
- **Session folder**: `session/2026-07-13/event-category-from-table/`
- **Status**: done

## What the task is

The money-event "Danh mục" (category) field was a free-text input where the user
typed arbitrary strings. Requirement: the category must be **picked from the
`money_event_categories` table** (system rows + per-household custom rows) instead
of typed. Additionally:
- The stored value is the category **`code`**, and the display label must always
  be translated to the user's language **via that code** (i18n), not the DB label.
- Add full **CRUD** for categories, surfaced in the **Settings** page so users can
  add/edit/delete their own household categories (system rows are read-only).

## Changes made

### Backend (`money-space-backend`)
- `src/modules/money-event-categories/` — new NestJS module (the `MoneyEventCategory`
  Prisma model + `money_event_categories` table already existed; this adds the API):
  - `entities/money-event-category.entity.ts`
  - `dto/create-money-event-category.dto.ts`, `dto/update-money-event-category.dto.ts`
    (code is immutable on update — renaming would orphan events pointing at it)
  - `repositories/*` — interface + Prisma repo (list = system rows `household_id IS NULL`
    + this household's rows; code uniqueness check; soft-delete via `deletedAt`)
  - `money-event-categories.service.ts` — validates code (`^[a-z][a-z0-9_]*$`),
    label required, 409 on duplicate code, blocks editing/deleting system rows
  - `money-event-categories.controller.ts` — `GET` (any member) + `POST`/`PATCH`/`DELETE`
    (`@RequireCapability('edit')`) under `/api/households/:householdId/money-event-categories`
  - `money-event-categories.module.ts`, registered in `modules/money-space.module.ts`
- `src/common/repositories/money-space.mapper.ts` — added `mapMoneyEventCategory`.

### Frontend (`money-space-frontend`)
- `src/features/events/api/event-categories.repository.ts` — list + CRUD API calls.
- `src/features/events/hooks/use-event-categories.ts` — react-query hook (list query
  + create/update/delete mutations with invalidation), mirrors `use-members`.
- `src/shared/api/query-keys.ts` — added `eventCategories(householdId)`.
- `src/features/events/hooks/use-events-page.ts` — consumes `useEventCategories`,
  exposes `categoryOptions` (value = code, label = `t('options.eventCategory.<code>')`
  with DB label fallback).
- `src/features/events/ui/events-page.tsx`, `.../components/event-form-dialog.tsx`,
  `.../components/actual-record-form.tsx` — thread `categoryOptions` through; the
  free-text "Danh mục" input is now a `<Select>` bound to `category` (stores the code).
- `src/features/settings/ui/components/categories-card.tsx` — new Settings card:
  lists categories (system badge + code), add custom (label + code), inline-edit
  label, delete custom (ConfirmDialog). Placed outside the settings `<form>`.
- `src/features/settings/ui/settings-page.tsx` — renders `CategoriesCard`.
- `src/i18n/resources.ts` — filled `options.eventCategory` for all system codes
  (vi + en); added `settings.categories.*` copy (vi + en).

The events timeline already displayed the category via
`t('options.eventCategory.<code>', { defaultValue: code })` — unchanged, now backed
by the fuller key list.

## Key decisions

- **Value = code, label via i18n by code.** Storing the code keeps display fully
  localizable (`options.eventCategory.<code>`); the DB `label` is only a fallback for
  custom categories that have no translation key.
- **Category code is immutable.** `money_events.category` points at the code, so a
  rename would orphan history; only label/sortOrder are editable. To "rename", create
  a new category and re-tag.
- **System rows are read-only** (`household_id IS NULL`, `is_system`). Edit/delete
  are scoped to the household's own rows at the repository layer.
- **No enum change / migration.** Table + Prisma model already existed; this task was
  purely the API + UI wiring.

## Mobile app parity notes

- Add the same categories list/CRUD API client + a category picker replacing any
  free-text category input on the mobile events form.
- Add a Settings screen section to manage household categories (system = read-only).
- Mirror the i18n keys `options.eventCategory.*` and `settings.categories.*`.
- Same rule: store the **code**, render the label via i18n keyed by code.

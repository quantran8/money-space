# Drop money-event title, make category required

- **Date**: 2026-07-14
- **Session folder**: `session/2026-07-14/drop-money-event-title-require-category/`
- **Status**: done

## What the task is

Update frontend + backend: remove the money-event `title` field entirely and
make `category` required (sourced from the money-event categories). The note now
stands in for the old title as the event's descriptive label.

## Changes made

### Backend (`money-space-backend`)

- `prisma/schema.prisma` — dropped `title` from `MoneyEvent`.
- `prisma/migrations/20260714140000_drop_money_event_title/migration.sql` — new
  migration: copies `title` into `description` where description was blank, then
  `DROP COLUMN title`.
- `src/modules/money-events/entities/money-event.entity.ts`,
  `dto/create-money-event.dto.ts` — removed `title`.
- `src/modules/money-events/money-events.service.ts` — removed title on
  create/update; added `assertCategoryPresent` (400 on blank category) on create
  and on any update that touches `category`; interest accrual now writes its
  label into `note`.
- `repositories/prisma-money-events.repository.ts` — dropped `title` from INSERT
  and the update `data`.
- `src/common/repositories/money-space.mapper.ts` (`mapMoneyEvent`),
  `src/common/utils/money-space.utils.ts` (`toMoneyEventCard`) — dropped `title`.
- `src/modules/debts/debts.service.ts`,
  `src/modules/assets/assets.service.ts` + `repositories` — internal flows that
  auto-generated a title (`Vay: …`, `Vay thêm: …`, `Điều chỉnh dư nợ: …`,
  `Định giá lại: …`) now fold that label into the `note`.
- `test/app.e2e-spec.ts` — mock event uses `note` instead of `title`.

### Frontend (`money-space-frontend`)

- `features/events/model/events.types.ts` (`MoneyEventItem`),
  `api/events.repository.ts` (`EventPayload`) — removed `title`.
- `features/events/model/events-form.ts` — removed `title` from
  `LocalMoneyEvent`, `ActualRecordForm`, `actualDefaults`, `toMoneyEventSeed`,
  `areEventsEqual`; removed the `title` zod rule; added a category-required rule
  (expense/income) in `buildActualSchema`; `category` default is now `''`;
  `FinancialRecordItem.title` kept as a **derived display label**.
- `features/events/ui/components/actual-record-form.tsx` — removed the "Nội dung"
  (title) field; moved the required "Danh mục" (category) `<Select>` directly
  under the amount for expense/income (out of "Thêm chi tiết").
- `features/events/hooks/use-events-page.ts` — derive the timeline row label from
  note→category; auto-fill the note for transfer/goal/payment; drop title from
  create/update/duplicate payloads; search filter uses the derived label.
- `features/events/ui/events-page.tsx` — delete-confirm uses `note`.
- `features/dashboard/...recent-events-section.tsx`,
  `hooks/use-dashboard-page.ts` — show note (fallback category).
- `features/debts/hooks/use-debt-detail.ts`,
  `features/assets/hooks/use-asset-detail.ts`,
  `features/assets/model/asset-sale-form.ts`,
  `features/goals/hooks/use-goals-page.ts` — history/label derived from note;
  payloads send `note` instead of `title`.
- `features/settings/ui/settings-page.tsx` — rendered the (previously imported
  but unused) `CategoriesCard`, so households can manage the now-required
  categories.
- `features/events/ui/components/events-data-table.tsx` — updated to note
  (component is currently unused/dead code but kept compiling).

## Key decisions

- **Note replaces title** (per the user). The DB `title` column is fully dropped;
  no code path stores a title anymore. All human-readable labels live in `note`.
- **Category required, enforced both sides.** Frontend: required picker for
  expense/income (the other event types are auto-classified). Backend:
  `assertCategoryPresent` 400s on blank — not validated against the categories
  table (internal codes like `interest`/`debt` must pass), so "required" means
  "non-empty".
- Migration preserves history: existing `title` values are copied into empty
  `description`s before the column drop.

## Mobile app parity notes

- Remove the `title` field from the money-event model, create/edit form, and all
  event/record display in the mobile app; use the **note** as the label with a
  **translated category** fallback.
- Make the category picker **required** for expense/income; default it unselected.
- Fold any auto-generated event labels (debt/goal/payment/sale/interest) into the
  note, matching the web copy.
- Surface the categories manager (equivalent of `CategoriesCard`) in mobile
  settings.
- DB migration `20260714140000_drop_money_event_title` is shared (Supabase) — no
  mobile-specific migration needed.

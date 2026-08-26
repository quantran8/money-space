# Settings / household page redesign

- **Date**: 2026-08-26
- **Session folder**: `session/2026-08-26/settings-page-redesign/`
- **Status**: done

## What the task is

Rebuild `/household` to a supplied HTML mockup: a "Cài đặt" header naming the
space with a save-state indicator, a workspace panel, a members list, a
categories panel with system/custom tabs, and data + delete split apart.

The mockup also had a sticky settings sidebar; the user asked for it to be
removed mid-task, so it was built and then taken back out.

## Changes made

- `packages/core/src/i18n/resources.ts` — new keys (vi + en):
  `settings.header.{pageTitle,manageSpace,savedState}`,
  `settings.household.{spaceEyebrow,spaceNote}`, `settings.data.dangerMeta`,
  `settings.categories.{tabCustom,systemNote,customNote,countLabel,customEmptyTitle,customEmptyBody,rowMenu}`,
  `members.list.memberMenu`.
- `web/src/features/household/ui/household-page.tsx` — header rendered inline
  (title + "Quản lý không gian **X**" + save state) instead of through
  `CompactPageHeader`; panels stack in one column.
- `web/src/features/household/ui/components/household-overview-card.tsx` —
  rewritten as the "Không gian" panel: eyebrow / name / note, `VND · VI`
  summary, then currency and language as real labelled `Select`s.
- `web/src/features/members/ui/components/member-row.tsx` — rewritten to the
  mockup's 4-column row (44px avatar, source count, status dot, overflow menu).
- `web/src/features/members/ui/components/members-list-section.tsx` — count in
  `num` rather than mono, `UserPlus` on the invite button, rows flush.
- `web/src/features/settings/ui/components/categories-card.tsx` — system/custom
  segmented tabs, two-column grid, star always visible, edit/delete moved into a
  hover-revealed overflow menu, custom empty state.
- `web/src/features/settings/ui/components/data-card.tsx` — split into
  `DataCard` (export) and `DangerCard` (delete, bordered).

## Key decisions

- **The workspace name stays READ-ONLY** even though the mockup makes it an
  input. `PATCH /households/:householdId/config` accepts and writes `currency`
  alone (`backend/src/modules/households/households.{controller,service}.ts`) —
  there is no rename endpoint. An input there would take the edit, look saved,
  and discard it. The field grid is currency + language; the name is the panel's
  heading, which is where the mockup already shows it a second time.
  **To make the mockup's version real, the backend needs `name` on that PATCH.**
- **Save button appears only when the form is dirty**, with "Đã lưu" + a green
  dot otherwise. An always-present Save asks the reader to work out whether they
  have pending changes.
- **Header rendered inline, not via `CompactPageHeader`.** That component
  deliberately has no subtitle slot ("prose under a page title is filler"), and
  this page's second line names the space every panel belongs to — a scope, not
  filler. Rather than widen the shared component's contract for one page, the
  page owns its own header.
- **Categories split into tabs.** One mixed list put 16 unchangeable system rows
  in front of the handful the household can edit, and marked the difference with
  a badge at the END of each row.
- **No overflow menu on a system category row.** The mockup shows one, but its
  only two items would be rename and delete and the backend allows neither — an
  empty menu is worse than none. The star (default pointer) is per-household, so
  it stays on every row.
- **Member exit moved into an overflow menu.** A standing red "Rời khỏi" button
  in a row whose job is to state a fact gave a destructive action resting weight.
- **`DangerCard` is the one bordered panel in the app.** Every other surface
  separates by lightness (§2.2); this is the exception that rule exists for.
- **Kept `settings.categories.title` as "Nhóm sự kiện"** rather than the
  mockup's "Danh mục giao dịch" — "giao dịch" is transaction-tracker vocabulary
  and this product is explicitly not one.
- **Sidebar removed on request.** `settings-rail.tsx` and the panels' anchor ids
  were deleted rather than left dormant, and the `settings.rail.*` keys removed
  with them.

## Mobile app parity notes

- **Shared**: only the i18n keys. `settings.rail.*` was added and removed within
  this task and never shipped.
- **Web-only, do NOT port as-is**: every layout/grid class, the hover-revealed
  overflow (no hover on touch — mobile needs the action visible or behind a
  press), and the `border-alert/34` danger stroke.
- Worth porting for parity: the read-only workspace name (same backend limit
  applies), the dirty-only Save button, and the system/custom category split.
- **If a rename endpoint is added**, both apps can turn the name into a real
  field; the `Settings.householdName` form field already exists and is validated.

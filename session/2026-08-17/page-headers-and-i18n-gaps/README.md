# Page headers reduced to one title line + i18n gaps closed

- **Date**: 2026-08-17
- **Session folder**: `session/2026-08-17/page-headers-and-i18n-gaps/`
- **Status**: done

## What the task is

Two threads, raised together while reading the asset detail screen:

1. **Missing Vietnamese i18n** — event rows rendered raw enum values (`payment_paid`,
   `asset_sale`) because `options.eventType` only covered 5 of the 11 event types, and
   the assets table header rendered the raw key `assets.demo.columns.role`.
2. **Header/copy cleanup** — every page header should be a single title line naming
   what the page is for. Drop the eyebrow lines, the descriptive sentences, and the
   "Nhà mình …" phrasing from titles. Plus a few specific removals on the assets
   screens and the events timeline.

## Changes made

### i18n

- `src/i18n/resources.ts` — `options.eventType` now covers all 11 `MoneyEventItem['type']`
  values in both `vi` and `en` (added `asset_purchase`, `asset_sale`, `payment_paid`,
  `debt_update`, `adjustment`, `other`).
- `src/i18n/resources.ts` — added the missing `assets.demo.columns.role` key
  (vi "Thanh khoản" / en "Liquidity"); the column renders `options.liquidity.*`.
- `src/i18n/resources.ts` — **fixed a structural bug**: the Vietnamese `activity` copy was
  nested inside `dashboard.redesign`, so it resolved as `dashboard.redesign.activity.*`
  (dead keys), while `vi.translation.activity` held *English* strings and
  `en.translation.activity` did not exist at all. The Journal page therefore rendered
  English in both languages. The Vietnamese block now sits at `vi.translation.activity`
  and the English one was added at `en.translation.activity`.

### Page headers (one title line, everywhere)

- `src/app/layout/compact-page-header.tsx` — dropped the `eyebrow` and `description`
  props; renders the title and the page actions only.
- `src/app/layout/page-header.tsx` — **deleted**, it had no remaining callers.
- `src/features/networth/ui/networth-page.tsx`, `goals/ui/goals-page.tsx`,
  `activity/ui/activity-page.tsx`, `household/ui/household-page.tsx` — pass only `title`.
- `src/features/forecast/ui/upcoming-page.tsx`, `events/ui/events-page.tsx`,
  `dashboard/ui/dashboard-page.tsx` — replaced their hand-rolled headers with
  `CompactPageHeader` so every page uses the same heading. The dashboard's as-of date
  moved into the actions slot, keeping it on the title line.
- `src/features/debts/ui/debt-detail-page.tsx` — dropped the `Nợ · <lender type>` eyebrow
  (and the now-unused `LENDER_LABELS` map); the status badge stays.
- `src/features/goals/ui/goal-detail-page.tsx` — dropped the eyebrow above the goal name;
  the priority badge stays.
- Titles rewritten to name the page's function, in both locales:
  `networth` "Tài sản & Nợ", `goals` "Mục tiêu", `household` "Cài đặt",
  `activity` "Nhật ký", `events` "Sự kiện tài chính", `upcoming` "Sắp tới" (unchanged).
  The sidebar item `nav.household` is now "Cài đặt" / "Settings" to match its page.

### Assets screens

- `src/features/assets/ui/asset-detail-page.tsx` — removed the asset-type + liquidity
  chips above the title, and the "Cập nhật số dư" button (it opened the same edit dialog
  as "Sửa" right beside it). The price-update button stays for market-priced assets.
- `src/features/assets/ui/components/asset-list.tsx` — removed the "Chi tiết" link; the
  whole row is now the navigation target (`role="button"` + Enter/Space), with the
  actions column stopping propagation so the menu still works.
- `src/features/assets/ui/components/assets-list-section.tsx` — removed the
  "Ai đang giữ và nguồn tiền được cập nhật lần cuối khi nào." subtitle.

### Debt detail localised

- `src/features/debts/ui/debt-detail-page.tsx` — the page was written entirely in
  hardcoded Vietnamese, so the `en` locale showed Vietnamese throughout. Every display
  string now goes through `t()` under a new `debts.detail.*` namespace (both locales),
  the `FREQUENCY_LABELS` / `CALC_LABELS` maps were replaced by `debts.form.frequency.*`
  and `debts.detail.calc.*`, and the date helpers take the resolved locale instead of a
  hardcoded `'vi-VN'` (same pattern as `asset-detail-page.tsx`).
- `src/features/debts/model/debts-form.ts` — dropped `getStatusLabel`, which returned
  hardcoded Vietnamese. The status badge reads `options.debtStatus.*`, a new option group
  mirroring `options.assetStatus`.
- Instalment and month counts use i18next plural keys (`_one` / `_other` in `en`), which
  is why the vi/en key sets differ for `debts.detail.loan.installments` and
  `remainingMonths` — the same shape as the existing `home.coverage.sourceCount`.

### Events timeline

- `src/features/events/ui/components/record-card.tsx` — the row title is just the event
  title now; the actor is carried by the avatar circle alone (with a `title` tooltip)
  instead of being repeated as a "Cả nhà · …" prefix.

Dead i18n keys removed alongside the UI that used them: the `eyebrow` / `description`
entries for the networth, goals, household, activity, events-history and upcoming
headers, plus `assets.detail.balanceUpdateAction` and `assets.demo.sourcesDescription`.

## Key decisions

- **One shared header component.** Rather than trim each page's bespoke header, every
  page now routes through `CompactPageHeader`, so "one title line" cannot drift back.
- **Titles name the function, not the feeling.** "Nhà mình đang có và đang nợ những gì"
  became "Tài sản & Nợ". The warm household voice still belongs in body copy — this was
  only about titles.
- **Data was kept, copy was cut.** The dashboard's as-of date and the goal deadline line
  are data, so they survived; eyebrows and descriptive sentences did not.
- **Row click over an explicit link.** Nothing else in the row navigates, so the row
  itself is the affordance; only the actions column opts out of it.
- Verified with `npm run build` (typecheck gate) and `npm run lint` — the copy check
  passes and no touched file is flagged. The remaining lint errors are pre-existing
  `set-state-in-effect` warnings in files this task did not open.

## Mobile app parity notes

- Port the `options.eventType` completions and `assets.demo.columns.role` verbatim —
  the mobile app reads the same enum values from the API.
- Port the `activity` block fix: any repo that copied `resources.ts` inherited the same
  misplaced-Vietnamese / missing-English structure.
- Port the `debts.detail.*` and `options.debtStatus` namespaces — the mobile debt detail
  screen was built from the same hardcoded-Vietnamese source and has the same gap.
- The header simplification is a shared product decision (one title line, functional
  wording), so mobile screen headers should follow. `CompactPageHeader` itself is
  web-specific markup — port the rule, not the component.
- The row-click-to-navigate behaviour on the asset list should become a plain row press
  on mobile; the `role="button"` / keyboard handling is web-only.

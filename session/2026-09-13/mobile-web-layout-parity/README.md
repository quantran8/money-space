# Mobile UI parity with the web at mobile viewport

- **Date**: 2026-09-13
- **Session folder**: `session/2026-09-13/mobile-web-layout-parity/`
- **Status**: in-progress

## What the task is

Bring the Expo app's UI in line with **the web app rendered at mobile viewport
(~390px)**, which the user named as the source of truth for this task — not the
`.dc.html` styleguide, and not the web's desktop layout. Scope is the whole app.

Reading rule used throughout: a base Tailwind utility IS the mobile value;
anything behind `sm:` / `md:` / `lg:` / `xl:` is desktop and must NOT be ported;
anything marked `lg:hidden` is mobile-only and MUST exist in RN.

## Changes made

Shell and cross-cutting primitives (these lift every screen at once):

- `mobile/src/components/ui/whatif-fab.tsx` — **new**. The floating what-if
  button the web shows on every mobile screen (56pt, `right-4`, ink fill,
  `bottom = safe-area + 88`). `source` comes from the pathname via core's
  `sourceForPathname`, exactly as on the web.
- `mobile/app/(tabs)/_layout.tsx` — mounted `WhatIfFab`; tab label now renders in
  Urbanist at 11px instead of the system face; item padding `py-2.5` + a 4px
  icon→label gap to match the web bar's item box.
- `mobile/src/components/ui/panel.tsx` — `PanelHeader` title `t-body font-medium`
  (16) → **`t-title`** (24), the rank the web gives every section header.
- `mobile/src/components/ui/screen.tsx` — page title `t-subtitle` (20) →
  **`t-metric`** (28) with the web's page tracking; `Sections` gap
  `s-section-gap` (20) → **`s-card-gap`** (12), the gap the web stacks panels at.
- `mobile/src/components/ui/account-header.tsx` — header gutter insets to 20 to
  match the web's `px-5` (page gutter stays 16); the settings gear now lights to
  `text-ink` when its own destination is open.
- `mobile/src/features/dashboard/ui/financial-picture-section.tsx` — section
  title → `t-title`; hero `t-hero` (56) → **`t-display`** (72) with the web's
  `-.045em` tracking; hero unit `t-subtitle` → `t-metric`; block order corrected
  to **hero → ring → coverage** (was hero → coverage → ring); removed the in-card
  what-if link, now that the FAB carries it globally as on the web.
- `mobile/app/(tabs)/index.tsx` — dropped the `onSimulate` wiring and the
  now-unused `useWhatIfStore` import.

Home sections the user flagged against screenshots of the web at phone width:

- `mobile/src/features/dashboard/ui/spending-section.tsx` — **new**. "Chi tiêu
  tháng này" as its own panel between the forecast and the goals, matching the
  web: two `t-figure` direction totals on tinted discs, then up to three recent
  movements with category discs, then "Xem tất cả giao dịch". The quiet
  `RecordedThisMonth` strip it replaces was deleted from `upcoming-section`, so
  the fact keeps exactly one home (§2.10).
- `mobile/src/features/dashboard/ui/upcoming-section.tsx` — added `HorizonTotals`
  (Vào / Ra, each with its own count) under the low point, and the "Điều gì sẽ
  xảy ra" sub-heading above the event rows.
- `mobile/src/features/dashboard/ui/money-sources-section.tsx` — added the
  "Phân bổ theo nguồn" heading and `HolderColumn` ("Ai đang nắm tài sản"), one
  expandable group per holder with a toned disc, source count and total.
  `holderGroups` was already on core's `useDashboardPage`; mobile just never
  read it.

Tài sản, against a screenshot of the web's assets tab at phone width:

- `mobile/src/features/assets/components/asset-type-icon.tsx` — **new**. The
  leading glyph per asset type, the web's lucide set mapped to Expo vector
  equivalents. It frees the metadata line for holder and freshness.
- `mobile/src/features/assets/components/assets-list-section.tsx` — the heading
  and its toolbar moved onto the CANVAS and each liquidity group became its own
  `Panel` (was: everything inside one panel, so cards sat inside a card). Search
  and the liquidity filter now share one row, the filter as a `Select` rather
  than a full-width `Segmented`. Rows gained the type glyph, the holder initials
  disc and the ⋯ menu (edit / buy more / sell / delete, gated as on the web).
  Staleness no longer tones the amount — it qualifies the figure's age, which
  the meta line states, and an amber amount reads as "this money needs
  attention".
- `mobile/src/features/assets/components/assets-summary.tsx` — panel title is
  `assets.demo.netWorth`; the hero went `t-metric` → **`t-hero`**; the two
  operands went from two `Sunk` tiles back to the web's two quiet `t-caption`
  spans; added the "Theo thanh khoản" heading and the per-bucket **% share**
  column, with the colour swatch leading each row.
- `mobile/src/components/ui/states.tsx` — `EmptyState` now DRAWS its message.
  It was passing the sentence as the icon's `accessibilityLabel` only, so every
  empty state on mobile showed a glyph and no words where the web prints one.

**Bug fixed: a ⋯ menu tap opened the detail screen.** `GroupedRow` rendered its
`right` slot INSIDE the row's `Pressable`, making the menu a target inside a
target, so the press fell through to `onPress`. `right` is now a sibling of the
pressable. This was latent in `debt-row` and `event-record-row` too — both put
an `ActionSheet` there beside an `onPress` — so one primitive fix covers all
three surfaces.

Cài đặt (Gia đình hub), against a screenshot of the web's settings page:

- `mobile/src/features/settings/ui/categories-section.tsx` — **new**. "Nhóm sự
  kiện", the section mobile was missing entirely: Hệ thống / Riêng tabs with
  counts, the per-tab note, the row list with its coloured glyph disc, the
  `Mặc định` badge, the star toggle and a ⋯ menu on custom rows only (a system
  row's only two items are rename and delete, and the backend allows neither).
- `mobile/src/features/settings/ui/category-form-sheet.tsx` — **new**. Add and
  rename, with the live preview row, the name field, the web's 12 colour
  swatches and the grouped glyph picker. Core already had full CRUD in
  `useEventCategories`; nothing was added to core.
- `mobile/src/features/billing/ui/plan-pill.tsx` — **new**. "Gói Miễn phí" with
  its crown and amber ring, beside the space name, opening the paywall. This was
  the hub's missing door to billing — and removing the now-dead
  `SubscriptionSection` import it replaces took the lint warnings 3 → 2.
- `mobile/src/features/household/ui/household-identity-section.tsx` — gained the
  `settings.household.spaceTitle` header, the "N thành viên · N nguồn tiền"
  line, and now takes `children`: **members render INSIDE the space card** under
  a divider, because they belong to the space and a second panel read as a
  second subject. Currency and language moved OUT into a new
  `OtherSettingsSection` (`settings.other.title`) — they change how every number
  reads, which is a different question from "what is this space and who is in
  it", and folding them in made one card answer two things.
- `mobile/src/features/members/ui/members-section.tsx` — takes `asBlock`, the
  same flag the web's `MembersListSection` carries, to render without a panel.
- `mobile/src/features/billing/ui/redeem-sheet.tsx` — **new**. The activation
  code in its own sheet, a SIBLING of the paywall: `openRedeem` closes that one
  as it opens this, so the two are never stacked, and backing out without a code
  reopens the wall. The paywall's "Đã có mã?" now swaps sheets instead of
  navigating to `/subscription` and losing the wall. `redeemOpen` / `openRedeem`
  / `closeRedeem` were already in core's paywall store, unused by mobile.
- `mobile/src/features/billing/ui/redeem-code-form.tsx` — takes `withHeading`,
  off inside the sheet whose header already states the title.
- `mobile/src/features/billing/ui/paywall-sheet.tsx` — rebuilt to the web's
  shape on the user's instruction ("cứ dựng như trên web"): the header is the
  fixed `billing.paywall.eyebrow` / `headerSubtitle` pair rather than a
  per-reason title (which wall was hit still shows — the benefits list reorders
  to lead with it); plans became **selectable cards** with the price leading,
  the discount chip, the struck-through compare-at and the savings line, the
  chosen one ringed in `action`; and one CTA naming the choice
  (`billing.paywall.cta`) replaced a buy button per plan. The trial button moved
  **below** the paid CTA, as on the web.

  The CTA, the trial button, its note and the code link all live in the BODY
  with the plans, as on the web — only `restore` is pinned to the sheet's
  footer, because Apple requires it. "Đã có mã kích hoạt?" is a quiet underlined
  link rather than a third button competing with the two above it.

  One departure from the web, forced by store policy: the CTA calls `buy()`
  rather than opening a PayOS checkout. It always renders (§22.10 — `Button` has
  no `disabled` prop by design); with no store product the press is a no-op and
  the `mobileNote` below says why.

Gates after each batch: `tsc` and `expo lint` unchanged from baseline, and
`expo export --platform ios` bundles. The bundle check is load-bearing here —
typecheck does not validate icon glyph names, and two invalid ones (Ionicons has
no bare diagonal arrow) were caught only by it.

Gates: `npx tsc --noEmit` and `npx expo lint` both clean — the one remaining tsc
error (`auto-price-row.tsx` `setAutoPrice`) and the three lint warnings are all
pre-existing and untouched by this work.

## Key decisions

- **Icons stay on `@expo/vector-icons`** (user's explicit instruction). The tab
  glyphs were briefly realigned to the web's lucide set (House / CalendarClock /
  Target / Wallet / Timeline) and **reverted**: `grid`, `calendar`, `flag`,
  `wallet`, `receipt` keep their current Ionicons identities, and the
  outline↔solid focus swap stays. Only non-icon bar properties were changed.
- The what-if FAB replaces the in-card link rather than joining it. Core's
  `sourceForPathname` documents a single entry point — "the FAB, present on every
  screen" — so two entry points would have made `whatif_run.source` ambiguous.
- `PanelHeader` and `Screen` were fixed at the primitive rather than per screen:
  53 `PanelHeader` call sites and 15 `Sections` call sites inherit the fix.

## Remaining backlog

Five parallel audits produced **172 numbered differences**. What is NOT yet done,
roughly highest-value first. Each item below was verified against both codebases.

**Whole sections missing on mobile**

- Dashboard: `OverdueSection` is a top-level panel on web (position 2, red
  `alert-tint`); mobile nests it inside Upcoming in amber `attention-soft`.
- Dashboard: the money-location bar chart drops the x-axis scale the web draws
  (`0,0 / 90,0 / 176,4 tr` with vertical rules) — visible in the screenshots.
- Events: `MemberTotals` ("Chi tiêu theo người") — core already exports
  `byMember`; mobile never destructures it.
- Events: the search box and pagination (PAGE_SIZE 7); Upcoming: pagination
  (PAGE_SIZE 10) and the `showing {from,to,total}` line.
- Settings: `DataCard` (export), `LeaveSpaceCard`, and `OrderHistory` on the
  subscription screen. Also the space name as a heading-plus-pencil (mobile has
  a permanent field), the "N thành viên · N nguồn tiền" line, and the owner chip
  on a member row.
- Onboarding: the whole **join** branch (`JoinByCodePanel`) and
  `OnboardingHeader` — without the latter the screen is a dead end with no
  sign-out.
- Auth: `AuthMobileHeader` (the `lg:hidden` logo) is the clearest mobile-only
  element missing from RN.
- Goals list: **priority grouping** (`high`/`medium`/`low` headings) — mobile
  renders one flat list; also the search field and its `emptySearch` state.
- Asset detail: **buy more** (`assets.purchase.title`) and **early withdrawal**
  (`assets.withdraw.action`) have no entry point at all; chart `high`/`low`.
- Debt detail: the schedule counts row (paid/remaining) and the `viewJournal`
  link; networth: the `debts.demo.addSchedule` link.

**Actions that contradict a documented web decision**

Each of these web call sites carries a comment explaining the choice, so any
change should be a deliberate reversal, not a silent port:

- `auto-price-row.tsx` renders a **Switch**; the web renders no control at all
  ("There is deliberately no switch") — mobile's is a real behavioural fork.
- Debt detail shows status as a filled `StatusChip`; the web uses a dot + word
  precisely because "a filled pill gave it the weight of a control".
- Goals cards sit **inside** a Panel on mobile; the web puts them on the canvas
  ("Goals are CARDS on the canvas, not rows inside a panel").
- Asset detail repeats the asset **type** in the header, which the web removed
  because it belongs in Thông tin.
- Debt detail repeats interest + method in the details list, which the web keeps
  out ("one fact in one place").

**Formatter drift (`formatVndShort` where the web uses `formatVndExact`)**

Mobile rounds figures that other figures on the same card are derived from, so
the card cannot be reconciled by hand — the exact failure the web comments warn
about. Sites: asset hero value, cost basis and P&L, `goal-progress-change`
(where compact prints the same number on both sides of the arrow), and the debt
outstanding figure. Asset detail additionally drops the **FX conversion** for a
foreign-quoted position, so a USD holding's cost basis and P&L are wrong.

**Section order**

- Debt detail is Overview → Loan → Schedule; the web is Overview → **Schedule**
  → **Terms**, because the terms explain the schedule above them.

**Behaviour gaps worth treating as bugs**

- `range-picker` has no entitlement gating: a Free user taps a locked horizon and
  gets no paywall (web gates on `limits.forecastHorizons` with a Crown row).
- `join.tsx` always shows `equalMembers` and never disables Accept, so a revoked
  or expired invite still renders a live Accept button.
- Events rows tint every expense with `attention`; the web keeps amounts ink.
- Asset detail computes a foreign-quoted position's cost basis without applying
  `positionFxToVnd`, so a USD-quoted holding reports a wrong cost basis and P&L.
- `goal-road-section` derives `gapAtNow` from `lastClosed.gap` (that month's own
  gap) where the web uses the cumulative distance from the plan line — two
  different quantities, so the two clients print different numbers.

**Systemic spacing**

- Web panel bodies start at `.s-head-body` = 28px below the header; mobile uses
  `mt-4` (16) at nearly every call site.

## Mobile app parity notes

This task runs in the opposite direction to the usual entry here — it ports the
web's mobile-width layout INTO `mobile/`, rather than recording a web change for
a later mobile port. Nothing here needs porting back to the web.

Do NOT port to mobile: `AuthBrandPanel` and the desktop what-if pill (both
`lg:`-only), and the web's desktop sidebar nav order, which differs from the
bottom bar's and is not the source of truth.

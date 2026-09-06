# Mobile parity catch-up: everything web shipped after 2026-08-31

- **Date**: 2026-09-05
- **Session folder**: `session/2026-09-05/mobile-parity-catchup/`
- **Status**: done

## What the task is

"Port các session trong web đã làm nhưng mobile chưa implement" — then, when
asked which of the five gaps to close, "all".

The last mobile catch-up was
[2026-08-31](../../2026-08-31/mobile-design-v5-and-section-parity/), which
cleared every parity note up to that date. Auditing the 123 session logs since
showed the post-08-31 work splits cleanly: most tasks changed mobile in the
same pass, and exactly five did not.

## Changes made

### 0. The pre-existing typecheck blocker

- `mobile/app/debts/[debtId].tsx` — dropped `repaymentEstimate` from the
  `DebtFormSheet` call and the hook destructure. The prop was never declared on
  `DebtFormSheetProps`, so this was the one standing `tsc` error (reported by
  two earlier sessions, unfixed). `debts-tab.tsx` never passed it, and the sheet
  reads `fixedPaymentAmount` off the form — which core's `use-debts-page`
  already keeps synced with the estimate — so the prop was dead, not missing.
  **Mobile now typechecks clean.**

### 1. Category icons and colours (from [2026-09-03](../../2026-09-03/category-icons-and-colors/))

None of this had reached the Expo app; `mobile/src` had no `*category*` file.

- `src/features/events/ui/components/category-icon.tsx` — **new**, generated
  from the web file so the two cannot disagree. 79 keys, verified identical to
  web's, all 16 seeded keys present, and every icon confirmed to exist in
  `lucide-react-native`.
- `src/features/events/ui/components/category-disc.tsx` — **new**. One
  component for the disc so a timeline and an upcoming list cannot draw it two
  ways. Glyph always white; unknown `iconKey` falls back to the dashed circle.
- `GroupedRow` gained a `leading` slot; `Select` gained `leading` on its option
  type (drawn in the list AND on the closed trigger).
- Discs now render on the events timeline, the forecast timeline, the overdue
  rows, and both category pickers.
- `CashflowEventFormSheet` gained a **category field it never had**. The schema
  has always required `category`; mobile simply never asked, so every expected
  item silently took the household's default.

Items 5 and 6 of that note needed no work: mobile has no category-management
UI (so no `code` field to remove) and no placeholder-note fallback.

### 2. Money-events tab + account header (from [2026-09-03](../../2026-09-03/mobile-layout-events-tab-and-account-header/))

Written *for* mobile, applied only to web.

- `app/events.tsx` → `app/(tabs)/events.tsx`. It stops being a pushed route:
  `withoutTabBar` and the `BackLink` are gone, and the doc comment arguing it is
  "deliberately not a sixth tab" now states why it IS one.
- `app/(tabs)/_layout.tsx` — fifth tab is `events` (`nav.events`, `Timeline`).
  Household stays a route under the tabs via `href: null`, so `/household` deep
  links still resolve — it is just no longer a bar item. Still five tabs.
- `src/components/ui/account-header.tsx` — **new**: avatar + name + settings
  gear. Opt-in through `Screen`'s `withAccountHeader`, on for the five tabs and
  the dashboard skeleton (so the row does not pop in after load).
- The Household hub's `HubLink` to `/events` is gone — a second door to a tab.

### 3. State-change motion (from [2026-09-05](../../2026-09-05/app-wide-state-change-motion/))

- `src/components/ui/motion.tsx` — **new**. `Collapse`, `SwitchPane`,
  `AppearGroup`/`AppearItem`, plus `useReducedMotion`. Same 160–260ms budget and
  4–12px movement as web.
- Applied: `Collapsible` unrolls instead of blinking; the networth Tài sản ↔ Nợ
  switch and the activity list's loading→empty→data swap use `SwitchPane`;
  `Sections` staggers its children, which reaches all 14 screens at once.

### 4. Asset purchase summary + debt formatting (from [2026-09-04](../../2026-09-04/money-formatting-exact-vs-compact/))

- `packages/core/.../asset-quantity-form.ts` — **new** `buildPurchaseSummary`.
  The weighted-average cost basis was living in web's dialog; it is domain
  arithmetic, so it moved to core and **web was refactored onto it** rather
  than mobile reimplementing it.
- `asset-quantity-sheet.tsx` — mobile had no purchase summary at all: a
  purchase was committed without ever showing the total or the re-averaged cost
  basis. Both now render, inline under a divider.
- Debt outstanding / original / repaid / instalment amounts went
  `formatVndShort` → `formatVndExact` on **both** platforms. These are
  reconciled against real statements, which is exactly the 2026-09-04 test.
  Chart axes and tooltips stay compact, per that session's own rule.
- Deleted `formatVndShortLocal` (core) — exported, zero consumers.
  `formatCompact` in `debts.repository.ts` was checked and is live; kept.

### 5. Duplicate / attention menu entries (from [2026-09-05](../../2026-09-05/remove-duplicate-attention-from-event-menu/))

Confirmed with the user that the web product decision applies to mobile, then
did all three steps that session laid out:

1. Removed both entries from `event-record-row.tsx` and the props above them.
2. Dropped the handlers through `events-timeline-section.tsx` and the screen.
3. Only then deleted `toggleEventAttention` / `duplicateEvent` from
   `use-events-page.ts` and the two i18n keys from **both** locales — they were
   web-dead and mobile-live until step 1.

## Key decisions

- **The disc is not the avatar mobile deliberately dropped.** `EventRecordRow`
  removed the initial-in-a-circle because it is a claim about WHO spent, which
  the Voice rules forbid. A category answers what the money was FOR, on a row
  whose title is free text — without it nothing on the row says what kind of
  spending it was.
- **The icon map is generated from web's, not hand-copied.** The KEYS are the
  cross-client contract: a key present on one platform and absent on the other
  renders a different glyph for the same category. Parity is asserted, not
  assumed.
- **`AppearGroup` counts its own indices.** Pages have conditional sections
  (`{forecast ? … : null}`), so hand-numbered stagger delays would need
  renumbering on every change and a wrong number is invisible until watched.
- **`Sections` carries the stagger, not 14 call sites.** Every screen already
  routes its sections through it; wrapping them individually would be the same
  decision made fourteen times, differently.
- **The purchase math went to core, and web was moved onto it.** Copying it into
  mobile would have left the same weighted average written twice, free to drift.
- **Settings reachability was checked before the tab swap.** Mobile folds
  settings into Gia đình rather than having a `/settings` route, so the header
  gear routes to `/(tabs)/household` — not to web's `/settings`, which does not
  exist here.
- **Debt formatting was fixed on both platforms, not mobile alone.** Mobile
  already matched web; changing only mobile would have manufactured a
  divergence out of a shared open follow-up.

## Verification

`pnpm verify` — all four gates:

```
web build (tsc -b + vite)   ✓  2,212 kB
web lint + check-copy       ✓  0 errors (13 pre-existing warnings)
mobile tsc --noEmit         ✓  0 errors  ← was 1 before this task
mobile check-copy + lint    ✓  0 errors (1 pre-existing warning)
```

`npx expo export --platform ios` ✓ 8.3 MB `.hbc` — run after the tab move and
again after the motion work, since Metro catches route and native-module
problems `tsc` cannot.

**Not done:** no run on a simulator or device. The motion primitives are the
first use of `react-native-reanimated` in this app (it was a dependency but
unused), so `Collapse`'s measured-height animation and the `Sections` stagger
are verified by bundle and typecheck only — they want a look on a device.

## Mobile app parity notes

Direction reversed: this task IS the mobile catch-up. What the **web** should
know:

- `buildPurchaseSummary` is in core now and web reads it. The purchase total and
  cost basis must not be re-derived in either client again.
- `mobile/src/features/events/ui/components/category-icon.tsx` mirrors web's
  file key-for-key. **Adding a glyph means adding it to both**, or the same
  category shows a different icon per platform.
- `toggleEventAttention` / `duplicateEvent` and
  `events.redesign.actions.{duplicate,attention}` are **gone from core**. Both
  clients now offer only Sửa and Xoá on a money event.
- Debt amounts are `formatVndExact` on both platforms now; the 2026-09-04
  follow-up on that is closed.
- Mobile's fifth tab is Sự kiện, matching web's bottom nav. Settings is reached
  from the account header on both.

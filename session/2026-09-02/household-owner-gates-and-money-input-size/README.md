# Household owner gates, default-category ordering, member status, money input size

- **Date**: 2026-09-02
- **Session folder**: `session/2026-09-02/household-owner-gates-and-money-input-size/`
- **Status**: done

## What the task is

Four requests, in the order they arrived:

1. Hide "mời thành viên" from anyone who is not the household creator.
2. Originally: gate the default-category choice on ownership too — **revised
   mid-task** to the opposite: any member may set the default category and
   create new ones. Only inviting is creator-only.
3. The default category always sorts to the front of the list.
4. Drop the active/pending status indicator from the member rows.
5. The money input's font size was wrong.

## Changes made

**Backend**

- `src/modules/money-event-categories/money-event-categories.service.ts` —
  `listCategories` now sorts the default row to the front after overlaying
  `isDefault`. `Array.sort` is stable, so everything after it keeps the
  repository's `sortOrder`/`label` order.
- The controller was briefly given `@RequireHouseholdCreator()` on
  `PUT /default` and then reverted: per the revision, categories are a
  money-level concern where both partners are equal.

**Web**

- `web/src/features/members/ui/components/members-list-section.tsx` — invite
  button now requires `isViewerOwner`.
- `web/src/features/members/ui/components/member-row.tsx` — removed the
  status dot + "Đang hoạt động / Chờ" cell and the now-empty fourth grid
  column (`sm:grid-cols-[minmax(0,1fr)_auto_auto_44px]` →
  `…_auto_44px]`). `cn` import dropped with it. `isActive` stays: it still
  gates whether the row has an exit at all.
- `web/src/features/settings/ui/components/categories-card.tsx` — each tab
  re-applies default-first, because splitting system/custom re-groups the
  rows the API already ordered.
- `web/src/components/ui/event-field.tsx` — `EventMoneyInput` dropped from
  `t-figure` (40px) to `t-body` + `font-medium`.
- `web/src/features/{whatif,debts,cashflow}/…` — removed the local size
  overrides that existed only to undo that 40px.

**Core (shared)**

- `packages/core/src/features/events/hooks/use-events-page.ts` —
  `categoryOptions` sorts default-first explicitly rather than relying on the
  server's order silently.

**Mobile**

- `mobile/src/features/members/ui/members-section.tsx` — all three invite
  entry points (header action, `EmptyState` action, solo prompt) gated on
  `isViewerOwner`.
- `mobile/src/features/members/ui/member-row.tsx` — `StatusChip` removed,
  import dropped.

**What-if cashflow bars**

- `web/src/features/whatif/ui/components/whatif-result-blocks.tsx`,
  `mobile/src/features/whatif/ui/whatif-result-blocks.tsx` — the "Trước khoản
  chi" bar moved from `--committed` (hairline grey, which read as a disabled
  track) to `--data-primary`, the same fill the "Sau khoản chi" bar already
  had. Tracks unchanged.

**Bottom nav active state**

- **Net effect: no change shipped.** Several approaches were tried and all
  reverted; the bottom nav is byte-identical to where it started. Kept in this
  log because the dead ends are the useful part — see Key decisions.

## Key decisions

- **Inviting is creator-only; categories are not.** Inviting is one of the
  three lifecycle operations the backend already guards against `createdBy`
  (see `require-household-creator.decorator.ts`), so a non-creator's button
  could only ever return 403. Categories carry no such guard, and the user
  explicitly chose to keep them open: both partners are equal in everything
  that touches the money.
- **Default-first is applied in three places, not one.** The service orders
  the API response; the settings card re-applies it because the system/custom
  split re-groups the rows; `categoryOptions` re-applies it so the picker does
  not silently depend on server order.
- **The money input size was design drift, not a preference.** `design/02-components.md`
  §21 says "Money input normal control size. Không hero-size input.", and
  Components.dc renders "Số tiền" at 16px in all three states. Three of the
  five `EventMoneyInput` call sites were already overriding `t-figure` back
  down by hand — the fix belonged in the component.
- Removing the member status leaves `member.status` in use for the exit menu
  only. A pending member still has no leave/remove action.
- **The what-if bars are a composition, not a verdict.** They are one
  measurement drawn twice, so both take `--data-primary` and the drop reads as
  LENGTH. Explicitly not `--positive`/`--alert`: §4 reserves those for a
  consequence that really is good or really is a deficit, and this bar is drawn
  the same way whichever it turns out to be. The figure above it carries the
  result tone.
- **The bottom nav's active state is unchanged: `--ink` + medium weight.**
  Four approaches were tried and rejected, in order:
  1. `--action` instead of `--ink`. Correct per §4's "active nav", but in the
     default theme both are `#0f1011`, so it changed nothing visible.
  2. A new `--action-active` blue token. Reverted — §8 already answers this
     (the desktop rail marks its active item with a "dark filled circle"), and
     inventing a token to solve a solved problem is drift.
  3. Filling lucide's glyphs at 18% alpha, then solid, with `Target` → `Flag`
     so the fill would not collapse its concentric rings.
  4. **The blocker, and why this stopped:** lucide is a stroke-only set. It
     ships no filled variants (a `grep` for `filled|solid` over its icon
     directory returns one unrelated glyph). Filling an outline icon is not the
     same as a properly drawn filled one — the House becomes a solid blob
     because its door is *drawn over* the shape rather than *knocked out* of
     it, while glyphs with less interior detail barely change. The result looks
     broken and uneven across the five tabs.
- **Getting the real filled look needs a dual-weight icon family** (Phosphor's
  `weight="fill"`, or hand-drawn solid SVGs for the five nav glyphs). That was
  judged not worth a new dependency on both platforms; the outline nav stays.
- `Target` was restored as the Goals glyph. `Flag` existed only to survive a
  solid fill, and `Target` is still the goals mark in the what-if goal-impact
  block and the asset goal-usage section — one concept, one glyph.

## Mobile app parity notes

Already done in this task — mobile was changed alongside web, so there is
nothing outstanding.

- **Ported**: the invite owner gate (three entry points on mobile vs one on
  web), the member status removal, and the what-if bar fill — all done on both
  platforms in this task.
- **Free via core**: the default-category ordering — `use-events-page.ts` and
  the backend response are shared, so mobile's pickers get it with no UI work.
- **Not applicable to mobile**: the `EventMoneyInput` size fix. Mobile's
  `money-input.tsx` already renders at normal control size and documents why
  ("a big number is output, not input"); do not port the web change there.
- **Web-only**: the grid-column change in `member-row.tsx` (`sm:grid-cols-…`)
  — mobile's row is a stacked flex layout with no column to remove.

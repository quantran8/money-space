# Scrollbar causing layout jump on tab change

- **Date**: 2026-09-05
- **Session folder**: `session/2026-09-05/scrollbar-layout-jump/`
- **Status**: done

## What the task is

Two related symptoms, reported one after the other:

1. Layout jumped sideways on every tab change — the scrollbar appeared on tall
   routes and vanished on short ones.
2. After fixing (1): a scrollbar still flashed on and off on pages whose content
   was **not long enough to scroll at all**.

Both are web-only. `<main>` in `app-shell.tsx` is the scroll container.

## Root causes (two different bugs)

**(1) No reserved gutter.** `app-shell.tsx:419` had `overflow-y-auto` with no
`scrollbar-gutter`. The content under it is `mx-auto max-w-[1280px]`, so losing
~15px of container width moved the centred column by half that.

Measured in headless Chrome with classic scrollbars: the centred column sat at
`400` on a short page and `392.5` on a tall one — a **7.5px jump** per route change.

**(2) The page enter animation created scrollable overflow.** `pageVariants` used
`y: 8 → 0`, i.e. it started the page 8px DOWN. The wrapper is `min-h-full`, so it
already stands exactly as tall as the scroll container — pushing it down put
those 8px past the bottom edge, which counts as scrollable overflow.

Measured: at rest `scrollHeight 713 === clientHeight 713` (no scrollbar); during
the transition `scrollHeight 721 > 713` — a scrollbar for the transition's 220ms.

This one was INTRODUCED-adjacent, not new: the down-drift predates this session,
but fix (1) made it visible by giving the scrollbar a permanent gutter to flash in.

## Changes made

- `web/src/app/layout/app-shell.tsx` — `[scrollbar-gutter:stable]` on `<main>`.
- `web/src/components/ui/motion.tsx` — `pageVariants` now drifts UP
  (`y: -8 → 0`) instead of down. Upward overflow is not scrollable, so the page
  settles into place without ever becoming scrollable.

## Key decisions

- **The drift direction is load-bearing**, not cosmetic. Documented in the
  variant's comment so nobody "fixes" the sign back.
- **`AppearItem` (`y: 10`) was left alone.** It was tested for the same failure
  and did not reproduce: its rows sit inside padded pages that scroll anyway, so
  the offset has room. Changing it would be churn.
- **`scrollbar-gutter: stable` costs width permanently** on platforms with
  classic scrollbars. Accepted — that is the trade the fix is made of. On macOS
  with the default overlay scrollbars the scrollbar has zero width, so nothing is
  reserved and nothing jumped there to begin with.
- Dialog/sheet scroll containers were NOT touched. They are separate surfaces and
  do not shift on tab change.

## Verification

Reproduced and confirmed in headless Chrome (forced classic 15px scrollbars,
since headless defaults to zero-width overlay scrollbars and cannot show the bug):

| case | scrollbar | centred column |
|---|---|---|
| short page, OLD down-drift | **shown** (bug) | 52.5 |
| short page, NEW up-drift | none | 52.5 |
| short page at rest | none | 52.5 |
| tall page at rest | shown (correct) | 52.5 |
| tall page, NEW up-drift | shown (correct) | 52.5 |

Jump between short and tall: **0px** (was 7.5px). Tall pages still scroll.

`pnpm build` ✓, `pnpm lint` 0 errors (13 pre-existing warnings).

## Mobile app parity notes

**Do not port.** Both fixes are web/DOM-specific — `scrollbar-gutter` is a CSS
property with no RN equivalent, and RN's ScrollView does not reserve scrollbar
width or turn a transform into scrollable overflow. Mobile has neither symptom.

# App-wide state-change motion

- **Date**: 2026-09-05
- **Session folder**: `session/2026-09-05/app-wide-state-change-motion/`
- **Status**: done

## What the task is

State changes across the app were pure show/hide — no motion. The user reported
this as an app-wide problem ("khi đổi state chỉ là ẩn hiện mà không hề có motion").

The cause was not a missing motion system. `components/ui/motion.tsx` already
defined the full vocabulary (easing, page/item variants, `AppearGroup`,
`CountUp`, `RevealSequence`). It was simply almost unused:

| | files using motion | total tsx |
|---|---|---|
| web | 3 | 170 |
| mobile | 3 | 108 |

The specific defect was that the app contained exactly **one** `AnimatePresence`
(`source-freshness-list.tsx`). Without it React unmounts on the next frame, so
every `{open ? <div/> : null}` could only ever blink.

Scope for this pass (user decision): **web only**, shared primitives plus
list/row enter. `CountUp` and the design-doc conflict below were left untouched.

## Changes made

- `components/ui/motion.tsx` — added two primitives:
  - `Collapse` — height + opacity via `AnimatePresence`, generalized from the
    already-correct `source-freshness-list` implementation.
  - `SwitchPane` — `mode="wait"` swap for one surface replacing another.
- `components/ui/form-22.tsx` — the shared `Disclosure` now uses `Collapse`.
  Highest-leverage change: it fans out to settings, asset form, goals, events.
- `features/goals/ui/components/goal-scheduled-outflows-section.tsx` — `Collapse`
  (chevron was already animated; only the body was missing).
- `features/events/ui/components/actual-record-form.tsx` — `Collapse`.
- `features/cashflow/ui/components/goal-impact-notice.tsx` — `Collapse`.
- `features/dashboard/ui/dashboard-page.tsx` — `AppearGroup` / `AppearItem`.
- `features/goals/ui/goals-page.tsx` — `AppearGroup` / `AppearItem`.
- `features/events/ui/events-page.tsx` — `AppearGroup` / `AppearItem`.
- `features/networth/ui/networth-page.tsx` — `SwitchPane` on the assets/debts tab.
- `features/activity/ui/activity-page.tsx` — `SwitchPane` on loading/empty/data.

## Key decisions

- **Fix the primitive, not the call sites.** `Disclosure` in `form-22.tsx` is
  shared, so one change covers many screens. Only disclosures that hand-rolled
  their own toggle were edited individually.
- **`Collapse` copies an existing in-repo pattern** rather than inventing one.
  Height carries the movement, `overflow-hidden` clips, opacity runs shorter
  (0.16s vs 0.24s) so text is not readable mid-slide.
- **`SwitchPane` uses `mode="wait"`**, not a crossfade: two panes of different
  heights overlapping makes the container jump.
- **Dialogs stay outside `AppearGroup`.** They own their own enter animation and
  must not inherit a mount stagger.
- **The events timeline tab was deliberately NOT given `SwitchPane`** — that tab
  filters one list rather than swapping panes, so a swap would fight the list.
- `prefers-reduced-motion` is already handled globally in `index.css` and inside
  the motion primitives; nothing new was needed.

## Open conflict (NOT resolved — needs a product decision)

`design/01-foundations.md` §12 says *"không animate money number đếm lên"* with a
120–450ms budget. `CountUp` in `motion.tsx` runs **1.1s** and carries a detailed
comment arguing it is a deliberate exception.

`design-v5-styleguide/Main.dc.html` — which normally outranks `design/*.md` —
says nothing about motion, so it cannot arbitrate. The user chose to leave this
untouched for now. If motion rules are ever written into the v5 styleguide, this
is the first thing that needs settling.

## Mobile app parity notes

**Not ported — mobile is still unfixed.** Mobile has the same problem at the same
scale (3 of 108 files) and was explicitly excluded from this pass.

To reach parity the mobile app needs Reanimated equivalents of:

- `Collapse` — the disclosure/expand primitive (highest leverage, same as web).
- `SwitchPane` — tab and loading→data swaps.
- `AppearGroup` / `AppearItem` — list and section enter.

Web-specific, do NOT port:
- `AnimatePresence` itself — RN needs `Layout`/`entering`/`exiting` from
  `react-native-reanimated` instead.
- The CSS `prefers-reduced-motion` block in `index.css`; RN must read
  `AccessibilityInfo.isReduceMotionEnabled()`.

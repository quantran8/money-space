# What-if result UI — consequence-first rebuild

- **Date**: 2026-08-31
- **Session folder**: `session/2026-08-31/whatif-result-ui-consequence-first/`
- **Status**: done

## What the task is

Rebuild the what-if result blocks to a supplied mockup (v9). The mockup
reorders the answer around CONSEQUENCE rather than around the balance figure,
splits the two kinds of consequence into their own cards, and adds a "where
did this money come from" block with a semantic split plus a per-wallet
disclosure.

The result **stays in the modal**. A fullscreen version was built and then
reverted: see "Rejected" below.

The sidebar in the mockup was explicitly **not** applied — what-if is a
contextual sheet, not a route (§26D), and it has no chrome of its own.

## Changes made

### Backend — expose the funding source

- `backend/src/modules/forecast/forecast.service.ts`
  - New `WhatIfWalletDraw` and `WhatIfFundingSource` types.
  - `whatIf()` now derives `fundingSource` from the SAME `drain` that
    `goalImpact` is costed from, and returns it on the result.
  - Wallet names come off `beforeForecast.liquidSources`; wallets that gave
    nothing up are dropped; the rest sort most-drained first.
  - `free` is computed by SUBTRACTION (covered − pace − setAside) rather than
    re-derived from claims, so it cannot drift from the goal block.
- `backend/src/modules/forecast/forecast.service.spec.ts` — three tests for the
  invariants: the parts sum to the covered spend, the wallet list sums to the
  same figure and never lists an untouched wallet, and a spend larger than every
  wallet reports the rest as `uncovered` instead of padding `free`.

### Web — motion

- `web/src/components/ui/motion.tsx` — three new primitives: `CountUp` (a figure
  that counts from 0 on mount, caller-owned `format`), `GrowBar` (a bar that
  grows to its share), and `RevealSequence` (children revealed one at a time,
  each waiting for the previous to finish).

### Core — shared types + copy

- `packages/core/src/features/whatif/model/whatif.types.ts` — `WhatIfWalletDraw`,
  `WhatIfFundingSource`, and the `fundingSource` field on `WhatIfResult`.
- `packages/core/src/i18n/resources.ts` — new `whatif.impact`, `whatif.bills`,
  `whatif.goals`, `whatif.source` and `whatif.cashflow` groups, in **both**
  `vi` and `en`.

### Web — the UI

- `web/src/features/whatif/ui/components/whatif-result-blocks.tsx` — rewritten;
  sections now use the design-system `Panel` + `PanelHeader` (`t-title` h2,
  20px padding, `s-card-gap` between cards) instead of hand-rolled
  `rounded-card bg-card p-5` and a bold `t-body` line.
- `web/src/features/whatif/ui/whatif-sheet.tsx` — result state only: the dialog
  becomes `flex max-w-[56rem] max-h-[92dvh] overflow-hidden`, and the body
  becomes a canvas-grounded scroll region. The form state is untouched.

## Key decisions

- **Order is by consequence, not by magnitude.** The old version led with the
  lowest projected balance. That is the engine's most important number but not
  the reader's first question: someone weighing a purchase wants to know what it
  breaks. New order: impact summary → bills → goals → funding source → balance
  bridge → assumptions.
- **Bills before goals.** A bill going unpaid is an obligation; a goal slipping
  is a promise the household made to itself. Same reason bills carry `alert` and
  goals carry `attention` (§16).
- **Funding source is EVIDENCE, so it sits at position 4.** It explains where
  the costs in blocks 2 and 3 came from. Leading with it would open the answer
  on bookkeeping.
- **Semantic split leads, wallets are disclosed.** "Did this cost me anything
  that was promised" is what decides whether a purchase feels affordable. The
  household named no wallet — the simulation chose — so the literal account
  breakdown sits behind a toggle rather than in the headline.
- **Time leads each goal row, money follows.** "Giảm 3tr" says what leaves;
  "chậm 12 ngày" says what it costs, and the second decides the purchase. A goal
  with no declared pace says "chưa tính được" rather than showing a fabricated
  number.
- **The goal delay total names its own coverage** (`3/4 tính được`) whenever some
  goals have no pace. A bare total would read as though it covered all of them.
- **Two rows visible, the rest behind a disclosure.** The summary strip above
  already counts everything, so nothing that changes the answer is hidden.
- **`uncovered` keeps its own line, separate from the split.** "The money is not
  there" and "a later bill goes unpaid" are different facts; only the covered
  part is split, so the three parts always sum to what actually left.
- **No verdict anywhere.** `resultType` still only picks a colour. `pnpm lint`'s
  copy check passes.

### Modal sizing

- **The dialog sizes to what it is holding.** `max-w-lg` (32rem) is right for
  three fields and far too narrow for five consequence sections: the bills and
  goals rows carry a name, a pair of figures and a shortfall on ONE line, and at
  32rem they wrap into a stack nobody can read across. Result state gets
  `max-w-[56rem] max-h-[92dvh]`; the form keeps the default.
- **No `sm:` prefix on those classes.** `ResponsiveDialog` swaps Dialog for a
  full-width Sheet below 768px in JS, so they never reach a phone. A prefix
  would have been noise, and `cn`'s `twMerge` is what lets them override the
  primitive's own `max-w-lg` / `max-h-[90dvh]`.
- **The result body gets `--canvas` as its ground.** This was the bug that made
  the sections unreadable: `DialogContent` is `--card` (white) and so is every
  `Panel` in the result, so five cards rendered white-on-white and read as one
  wall of numbers. Cards separate by LIGHTNESS alone in this system (§2.2 — no
  borders, no shadows), so without the canvas step underneath there was nothing
  drawing a boundary. `-mx-6 px-6` lets the ground reach the dialog's edges
  while the content stays on the `p-6` grid.
- **The body is the scroll container, not the dialog.** The dialog scrolling
  itself put the scrollbar on its outer edge — outside the rounded corner, over
  the shadow. It now gets `overflow-hidden` and the body takes `flex-1
  overflow-y-auto`.
- **The dialog switches `grid` → `flex` in result state.** Required for the
  above: the primitive's auto grid rows will not shrink below their content, so
  `min-h-0` on the body could never make it the scroll container while the
  dialog stayed a grid. `twMerge` keeps the primitive's `gap-6`, so
  header/body/footer spacing is unchanged.

### Rejected: the fullscreen answer

Built, reviewed on screen, and reverted at the user's call — recorded so nobody
rebuilds it.

- The answer was moved out of the modal into a full-bleed Radix overlay with its
  own header. Two attempts at the ground: flat `bg-canvas` (read as a grey slab,
  because it painted out the `shell-backdrop` gradient and the glass rail), then
  a reconstruction of the shell itself.
- Even reconstructed it did not read as a page — it kept the mockup's 900px
  column on a very wide viewport, which looks like a floating modal with large
  empty margins. Matching the shell properly would have meant adopting
  `max-w-[1280px]` and `CompactPageHeader`, i.e. rebuilding a route without
  having one.
- **The decision: keep the modal, just make it bigger.** What-if is a contextual
  action, and a wider dialog gets the rows onto one line, which was the actual
  problem.


### Motion

- **Only figures whose SIZE is the point animate.** "+32 ngày", the shortfalls,
  the balances, the funding total — watching a number climb is what makes the
  magnitude land. Dates, ids and the dense inline metadata on each row stay
  static: every figure on a screen animating at once is a slot machine.
- **An em-dash never counts.** "Chưa tính được" has no magnitude, so
  `DomainSummary` takes an optional `count` and falls back to the static value.
- **Timings are deliberately outside the file's own 160–260ms budget.** That
  budget governs ENTER transitions, where longer reads as lag. Here the duration
  IS the content — the reader is meant to watch the climb. The phases now ADD
  UP, which they did not at first: card enter 0.42s → 0.12s beat → count/bar
  1.1s = 1.64s, inside a 1.9s step. `SECTION_ENTER` and `SECTION_COUNT_DELAY`
  are exported so callers pass the same delay down instead of guessing.
- **A counting number needs its own curve.** The shared `easeOut` is expo
  ([0.22, 1, 0.36, 1]) — ~90% done within the first fifth of its duration. For a
  card sliding 10px that is right; for a number it blurs through its whole range
  instantly then crawls the last tenth, reading as fast AND sluggish at once.
  Added `easeCount` ([0.33, 0.35, 0.2, 1]).
- **A stagger was the wrong tool, and `AppearGroup` was abandoned for this
  screen.** `staggerChildren` offsets children by a fixed amount and lets them
  OVERLAP; with figures counting for 1.6s every section ended up running at
  once, so the screen twitched however far the offset was pushed. Three rounds
  of user feedback ("đang chạy quá nhanh", "giảm chậm hẳn lại", then "cần
  animation trong từng section xong rồi mới hiện section tiếp theo") — the fix
  was not a bigger number, it was sequencing. `RevealSequence` does not MOUNT a
  section until the one above it has settled.
- **Mounting everything up front broke the inner animations, and needed a
  reveal signal to fix.** With every child mounted at t=0, each `CountUp` and
  `GrowBar` fired immediately — five sections down, a figure finished counting
  seconds before its card was ever visible, so the numbers looked static.
  `RevealSequence` now publishes a `RevealedContext` per section; `CountUp`,
  `GrowBar` and the funding-stack wipe all hold still until it says they are
  showing. `useRevealed()` is exported for one-off `motion` elements.
  `CountUp`'s first paint is 0 (not the final value) for the same reason —
  showing the answer then snapping back to 0 is worse than not animating.
- **`RevealSequence` keeps every child MOUNTED and fades them in** rather than
  slicing the list. This was the actual cause of "không mượt": `DialogContent`
  centres itself with `top-1/2 -translate-y-1/2`, so growing the container
  re-centred and JUMPED the whole dialog on every reveal. Mounting everything up
  front means the body reaches full height on the first frame and a revealed
  section fills space that already exists. Hidden children carry `aria-hidden`
  and `inert`, so nothing invisible is tabbable or read aloud.
- **The sequence is skippable on any interaction** (pointer, wheel, touch,
  key). Six sections at 1.9s puts the last one ~9.5s out. The pacing is a
  courtesy, not a gate.
- **The funding stack wipes in as ONE bar**, not slice-by-slice: the slices are
  shares of a single spend, so growing them apart would animate through
  compositions that never existed.
- **`CountUp` opts out of `prefers-reduced-motion` itself.** The CSS block for
  that setting cannot reach a JS-driven interpolation, so it renders the final
  value as its initial state — which also means first paint is always the real
  figure.

## Mobile app parity notes

- `mobile/src/features/whatif/ui/whatif-result-blocks.tsx` has NOT been updated —
  it still renders the old shape. It compiles fine because `fundingSource` is
  additive, but it does not show the new blocks.
- To port: the block order, the bills/goals split, and the funding-source block.
  All the data and all the copy keys are already in `packages/core`, so the port
  is UI-only.
- The result stays inside the existing sheet on mobile too — the sizing change is
  desktop-only by construction, since the mobile Sheet is already full-width.
- Web-specific, do NOT port verbatim: the `lucide-react` icon imports (mobile
  uses its own icon set), the CSS grid layouts, the `<button>`-based
  disclosures, and the `motion/react` primitives (React Native needs Reanimated
  or `Animated`). The motion *rules* above do port — what animates, what never
  does, and the pacing.

## Gotcha for the next person

There is **no prettier config in this repo**. Running bare `npx prettier --write`
reformats to prettier's defaults (double quotes, semicolons), which is the
opposite of the house style. If you must run it:
`npx prettier --no-semi --single-quote --print-width 90`.

# Goal impact notice — visual impact v3

- **Date**: 2026-08-21
- **Session folder**: `session/2026-08-21/goal-impact-notice-v3/`
- **Status**: done

## What the task is

Update the goal-impact notice inside the cashflow event form to match a supplied
mockup ("Money Space — Visual impact v3"). The mockup reframes the block: the bar now
shows the SPEND divided across where the money comes from, and only the consequences
that actually moved get a before → after row.

## Changes made

- `src/features/cashflow/ui/components/spend-impact-bar.tsx` — rewritten. Was the
  WALLET with the spend marked off inside it (4 slices); is now the SPEND at full
  width divided into its two sources, 40px tall, with each slice labelled in place
  when it is wide enough (≥14%) to hold a figure legibly.
- `src/features/cashflow/ui/components/goal-impact-notice.tsx` — rewritten around the
  mockup's structure: spend + "lấy từ" header, the allocation bar with a legend only
  when there are two slices, then before → after `ChangeRow`s for what moved, an
  optional per-goal list, the explaining sentence, and the "wallet still has money"
  line.
- `src/features/goals/model/spend-impact.ts` — added `paceBefore` / `setAsideBefore`
  per goal and `totalPaceBefore` / `totalSetAsideBefore` overall.
- `src/features/whatif/ui/components/whatif-result-blocks.tsx` — updated to the bar's
  new props (it is the second consumer; the typechecker caught it).
- `src/i18n/resources.ts` — new keys in `vi` and `en`; removed six now-orphaned ones
  (`titlePace`, `titleSetAside`, `goalPace`, `goalSetAside`, `whyNoFree`,
  `whySomeFree`) and reworded `goalBoth`, whose `{{name}}` is now rendered beside it.

## Key decisions

- **The bar changed what it MEASURES, not just how it looks.** Drawing the wallet
  answered "how big is this next to the balance" — a real question, but not the one
  this block exists for, and at small amounts it answered it as an unreadable sliver.
  The mockup's framing ("5,0 triệu được lấy từ đâu") is the mechanism itself: pace
  first, set-aside only once the pace is gone. Full width for the spend makes that
  split legible at any amount.
- **Only changed consequences get a row.** A spend inside this month's contribution
  moves one figure, so it shows one row; printing "303,6 → 303,6" for the goal total
  would manufacture a consequence. The goal-total row appears only once set-aside
  money is genuinely reached.
- **`totalPaceBefore` sums across EVERY goal on the wallet, including unaffected
  ones.** It answers "what was this month's contribution holding" — a fact about the
  wallet, not about the spend. My first attempt summed `paceReduction`, which is what
  the spend TAKES; that would have rendered "17,1 → 0" for every amount, since the
  before figure would always equal the reduction.
- **Set-aside money is `--attention`, never `--alert`** (§16). The mockup uses amber
  for the same reason: scheduling a bill is not an error. The bar's second slice and
  the delta both follow it.
- **No backend change.** `computeSpendImpact`'s RULE is unchanged — the new fields are
  derived display values, so the client copy still agrees with the server's figures of
  record. `spend-impact.spec.ts` (13 tests) passes untouched.
- Verified against both of the mockup's demo cases on a TCB wallet (25,9tr set aside,
  20tr/month pace, 17,1tr of room left): 5tr gives pace 17,1 → 12,1 with set-aside
  untouched; 20tr gives pace 17,1 → 0 and set-aside −2,9, and the bar splits
  17,1 + 2,9 — matching the mockup's 85,5% / 14,5%.

## Mobile app parity notes

- The reframing is the part to port: the bar is the SPEND allocated across sources,
  not the wallet with a slice removed. Same for what-if, which shares the component.
- The "only rows that moved" rule matters more on a phone, where an invented
  no-op row costs a whole screen line.
- `paceBefore` / `setAsideBefore` are client-side derived values in the shared
  `spend-impact` model — mirror them wherever mobile keeps its copy of that rule.
- New i18n keys must be mirrored; six removed keys can be dropped there too.

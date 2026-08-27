# Cashflow delta chart: stepAfter → monotone

- **Date**: 2026-08-27
- **Session folder**: `session/2026-08-27/cashflow-chart-smooth-curve/`
- **Status**: done

## What the task is

While aligning the marketing landing page's dashboard scene with the real app,
the user asked for the "Dòng tiền 30 ngày tới" chart to read as a softer line.
Given the choice between diverging (landing smooth / app stepped) or changing
both, the user chose to change the app too, so the two stay in sync.

## Changes made

- `web/src/features/dashboard/ui/components/upcoming-section.tsx` —
  `CashflowDeltaChart`'s `<Line type="stepAfter">` is now `type="monotone"`.
  The doc comment above the component was rewritten: it previously argued FOR
  stepping ("a balance does not drift between events"), so leaving it would have
  contradicted the code.

Nothing else changed — the zero baseline, the amber low-point dot, the mono
axis ticks and the tooltip are all untouched.

## Key decisions

- **`monotone`, not a plain spline.** Monotone interpolation never overshoots,
  so the curve cannot dip below the lowest data point or rise above the highest.
  This matters here: the low-point dot must remain the visual minimum, and a
  smoothed curve must not invent a trough that no cashflow event produced.
- **Why stepping was defensible and still dropped.** `stepAfter` was literally
  truer to the mechanism — a balance holds flat, then moves the day something is
  paid. The counter-argument that won: at 30 points in 190px the risers read as
  noise, and the question this chart answers is how deep the dip goes and
  roughly when. The exact per-day sequence is already answered, precisely, by
  the event rail sitting immediately beside it — so the chart was paying for
  precision the section already provides elsewhere.
- The landing page (`family-finance-v3.1/landingpage.html`) mirrors this with
  Chart.js `cubicInterpolationMode:'monotone'` + `tension:0.4`, which is the
  closest equivalent to recharts' monotone.

## Mobile app parity notes

- If the mobile app renders a cashflow delta chart, apply the same
  interpolation change so the two clients read identically.
- The reasoning is chart-shape only — no calculation, no data-model, and no
  copy changed, so there is nothing to sync in `packages/core` or in
  `../memory/`.

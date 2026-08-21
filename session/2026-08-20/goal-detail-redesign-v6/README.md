# Goal detail redesign v6

- **Date**: 2026-08-20
- **Session folder**: `session/2026-08-20/goal-detail-redesign-v6/`
- **Status**: done

## What the task is

Rebuild the goal detail page to match the v6 mockup the user supplied. The mockup
restructures the page around four sections instead of the previous hero + plan +
allocations + monthly table:

1. Hero — current state only (priority eyebrow, big figure / target, progress bar,
   "còn X" + "mong muốn đạt vào MM/YYYY").
2. **Đường tới mục tiêu** — a new forecast section: a chart comparing the pace the
   household is on against the pace needed to hit the target date, plus a
   conclusion card carrying the verdict and the required monthly figure.
3. **Nguồn tạo tiến độ** — the allocations list redrawn as sunk cards (icon, kind
   badge, per-row headline figure) instead of a shared-column table.
4. **Nhịp góp** — the monthly section split into a running-month card, a 6-month
   bar chart, and a paginated full history table.

## Changes made

- `src/features/goals/ui/components/goal-road-section.tsx` — **new**. The forecast
  section: SVG chart (current-pace line vs. needed-pace dashed line, target-date
  marker, axis labels), pace verdict badge, conclusion sentence and required
  monthly figure, plus the collapsible "cách tính" panel moved over from the old
  plan panel.
- `src/features/goals/ui/goal-detail-page.tsx` — hero reduced to current state
  only; the three projection metrics and the whole `Kế hoạch` panel removed and
  replaced by `<GoalRoadSection/>`. Dropped the now-unused `PictureMetric`,
  `MetricCell`, `PanelSplit`, `hasProjectedDate` and `explainOpen` state.
- `src/features/goals/ui/components/goal-allocations-section.tsx` — rows became
  cards. Each row picks an icon from the asset type, shows a contribution/holding
  badge, and states its own headline figure under its own label. Added the mobile
  "thêm tài sản" button at the end of the list.
- `src/features/goals/ui/components/goal-monthly-progress-section.tsx` — added the
  running-month card and the 6-month bar chart above the table; the table is now
  paginated (5 rows/page, newest first) instead of rendering every month.
- `src/i18n/resources.ts` — new `goals.detail.road.*` block, plus additions to
  `goals.detail.picture.*`, `goals.allocations.*` and `goals.monthly.*`. Both `vi`
  and `en` filled. Renamed a few section titles to the mockup's wording
  ("Nguồn tạo tiến độ", "Nhịp góp") and relabelled the monthly table columns.

## Key decisions

- **The forecast got its own section rather than staying in the hero.** The hero
  was carrying three numbers of three different kinds (a date the household chose,
  a date the app computed, a rate the app computed) side by side, which left the
  reader to work out which answered what. The question they actually ask is a
  comparison — *is this pace going to get us there in time?* — so it is drawn as
  one, and the conclusion card restates it in words.
- **The chart x-axis spans from this month to whichever is later**, the projected
  completion or the target date, so both endpoints are always on screen. When
  there is no declared pace no current-pace line is drawn at all — inventing a
  slope for a pace nobody set would be a guess drawn as a fact, which is the same
  rule `hasProjectedDate` already enforces for the date.
- **A date already in the past clamps to a short visible run (`MIN_RUN`)** rather
  than a zero-length line, so a past-due goal still renders a labelled line.
- **Allocation rows are cards, not table lines.** A wallet answers "how much goes
  in each month"; gold answers "how much is held right now". Shared columns forced
  one of the two to be read under the wrong heading.
- **Bars scale against max(actual, rate), not against the rate**, so a month that
  beat the declared rate is not clipped at the dashed line.
- Behind/short states stay on `--attention`, never `--alert`, per design.md §16 —
  a savings pace falling short is information, not a fault. The running month
  still says what is LEFT rather than what is missing.

## Mobile app parity notes

- Port the four-section structure and the i18n keys (`goals.detail.road.*` and the
  additions under `picture` / `allocations` / `monthly`).
- The chart geometry helpers in `goal-road-section.tsx` (`buildChart`,
  `monthIndexFrom`, `MIN_RUN` clamping) are pure and transfer directly; only the
  SVG rendering is web-specific.
- Table pagination is a web affordance — mobile should prefer incremental loading
  over prev/next buttons, but keep the newest-first ordering.

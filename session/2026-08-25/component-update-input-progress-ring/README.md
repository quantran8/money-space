# Component update — Input, Progress, Money composition ring

- **Date**: 2026-08-25
- **Session folder**: `session/2026-08-25/component-update-input-progress-ring/`
- **Status**: done

## What the task is

Three v5 styleguide specs (Input / FormField, Progress, Composition Ring) had
moved ahead of the shipped components. The task was to bring the code back in
line with them, then update the two styleguide canvases that document those
components.

## Changes made

- `web/src/components/ui/input.tsx` — leaves the wash fill for **white + a 1px
  `--committed` border**. Focus is now a blue (`--data-primary`) border plus a
  3px soft ring instead of a 2px ink outline. Invalid keeps the same ring form
  in `--alert`. Disabled is the only variant that still gets a fill.
- `web/src/index.css` — the global `input:focus-visible` ink outline now excludes
  `[data-slot='input']`, so the primitive's own focus ring is not double-drawn.
- `web/src/components/ui/progress.tsx` — the tick bar is now a **fixed pitch**:
  a 2px tick every 6px, painted as a repeating gradient on a track layer and a
  width-clipped fill layer that share the same left anchor. Same `currentColor`
  retinting contract, so no caller changed.

  This landed in two passes. The first followed the styleguide literally — 40
  discrete `<span>` ticks in a CSS grid with a 5px gap — and shipped a bar that
  was visibly too thin and too sparse. The 5px gap turned out to be *on top of*
  the column pitch, not instead of it, so the real gap was 6–17px around a 1px
  mark and only 6–14% of the bar was ink. Worse, a fixed tick count has to divide
  the container, so density fell as the bar got wider: at 620px the bar was
  nearly invisible while at 300px it looked fine. Holding the pitch constant and
  letting the tick count follow the width fixes both — ink density stays ~33% at
  every width from 240px to 720px.
- `web/src/components/ui/money-composition-ring.tsx` — **new**, replaces
  `money-composition-bar.tsx` (deleted). Same `CompositionSegment[]` input and
  the same legend grid; the horizontal strip becomes a conic-gradient donut with
  the flexible share in the hole. Adds one required prop, `centerLabel`.
- `web/src/features/dashboard/ui/components/financial-picture-section.tsx`,
  `web/src/features/assets/ui/components/asset-goal-usage-section.tsx` — switched
  to `MoneyCompositionRing` and pass `centerLabel`.
- `packages/core/src/i18n/resources.ts` — new `ringCenter` key under
  `home.picture.composition` ("linh hoạt" / "flexible") and
  `assets.detail.goals` ("còn tự do" / "still free"), both vi and en. The
  existing `flexible` / `free` labels were too long for the ring centre.
- `design-v5-styleguide/Components.dc.html` — the Field/Input, Progress and
  composition blocks redrawn to match, with the rationale in each `rule` line.
  **`AppComponents.dc.html` was then merged into this file and deleted**, and the
  result flattened into a single deduplicated inventory: no part-one/part-two
  split, and every block documents a component the app actually ships. The two
  files had overlapped on six components (Button, Field/Input, Status indicator/
  StatusChip, Composition, Source coverage/SourceFreshnessList); the AppComponents
  version won each time because it names its source file and carries the
  rationale. The five blocks that existed only in Components (KPI card, Data row,
  Dense table, Empty state, Forecast chart) were converted into the same
  `.sec` / `.src` / `.rule` shape. 18 sections, no duplicates.
- `design-v5-styleguide/canvas.json` — two artboards become one
  (`Components.dc.html`, h 2320 → 3480, retitled "Components —
  web/src/components/ui"); the `note-appcomponents` annotation was repositioned
  and reworded for the merged board.

## Key decisions

- **Input goes white-on-border, not wash.** Inside a `--card` white panel a
  wash-filled control read as a second surface level rather than as a field.
  The border does the "this is a control" job without spending a lightness step.
- **Focus is blue, not ink.** At `--radius-control` (14px) a 2px ink outline
  read as a disabled slab. The blue border + soft ring is still a real, visible
  focus indicator — the a11y signal is redrawn, never removed — which is why the
  global outline rule had to opt the primitive out rather than stack on top.
- **Progress holds a fixed pitch, not a fixed tick count.** The count is the
  thing that must flex; the pitch is what the eye actually reads. A fixed count
  divides the container, so the gap grows with the column and the same control
  looks dense in a card and sparse in a wide panel — two bars on one screen stop
  looking like the same component. The earlier worry about gradients (that phase
  drift makes the same value draw a different number of marks) is real but does
  not matter here: at 50–120 ticks nobody counts them, the bar reads as a
  proportion, and constant density is what makes that proportion legible.
  Anchoring track and fill to the same left edge keeps their ticks in phase, so
  none slides or half-appears as the value animates — verified by rendering all
  8 values × 6 widths headless and inspecting the result rather than reasoning
  about it.
- **The tick is 2px, not 1px.** At 1px the mark is lighter than the gap on every
  display, and the row reads as empty space with flecks in it rather than a scale.
- **Ring, not pie.** The hole is what makes it a ratio gauge rather than a slice
  chart, and it gives the headline share a place to be read *before* the legend.
- **Callers that set their own `h-*` still win.** Most `<Progress>` call sites
  pass `h-6`; the tick grid stretches, so their geometry is unchanged. The pace
  marker in `goals-section.tsx` is positioned against its own wrapper, not the
  Progress root, so it was unaffected.
- Tones are unchanged throughout: committed neutral, flexible `--data-primary`,
  action colour still never encodes data (v5 §4).

- **The two styleguide artboards are now one document, framed in the present
  tense.** They documented the same components from two angles — the language and
  the shipped inventory — so every component change had to be made twice, in two
  files that could drift. The merged board drops the v4→v5 migration framing
  ("Changed.", "Kept as-is", "Unchanged by v5") that the AppComponents half
  carried: the board now states what each component *is*, since the migration it
  described is the shipped code. References to numbered spec sections (§5, §11,
  §16) were kept — those cite the design system, not a diff. `money-space-design-system-v5.html` is a frozen export
  snapshot and still contains the old two-file bundle; it was deliberately not
  rewritten.

## Mobile app parity notes

The mobile app keeps its own copies and was **not** touched:

- `mobile/src/components/ui/money-composition-bar.tsx` → needs the same
  bar-to-ring rewrite, plus the `centerLabel` prop at its two call sites
  (`features/dashboard/ui/financial-picture-section.tsx`,
  `features/assets/components/asset-goal-usage.tsx`) and the export in
  `mobile/src/components/ui/index.ts`.
- Mobile's Input and Progress equivalents need the same two treatments. For
  Progress, port the *fixed pitch* (2px/6px), not a tick count — RN has no
  repeating-gradient, so this needs a measured width and a computed tick array.
- The `ringCenter` i18n keys are already in shared core, so mobile picks them up
  with no copy work.
- Web-specific, do NOT port: the `index.css` `[data-slot='input']` focus-outline
  exclusion (a DOM/CSS concern with no RN equivalent), and the CSS-grid /
  `conic-gradient` techniques — RN needs SVG or a different layout primitive for
  both the ring and the ticks.

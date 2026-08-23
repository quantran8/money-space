/**
 * View-model shapes produced by the derivation layer and consumed by whichever
 * component renders them.
 *
 * They live in core, not next to a component, because the same derivations feed
 * a web chart and a React Native one. Nothing here is platform-specific: no
 * colours, no class names — just the numbers and the labels a renderer needs.
 */

/** One slice of the money composition bar (design v4.2 — committed → flexible). */
export type CompositionSegment = {
  key: string
  label: string
  amount: number
  /** 0–100, already rounded by the caller. Used for the spoken label. */
  percent: number
  /** How the share is WRITTEN, e.g. "<1%" — rounding must not read as none or all. */
  percentLabel?: string
  tone: 'committed' | 'flexible'
}

/** One row of the coverage / data-freshness block. */
export type SourceFreshnessRow = {
  id: string
  name: string
  /** What this source contributes to the figure above. Omit to show only the age. */
  value?: number
  /** Days since the value was last confirmed. `null` = never. */
  days: number | null
  /** Past the household's OWN update frequency, not a fixed number of days. */
  isStale: boolean
}

import type { ReactNode } from 'react'


type MetricCellProps = {
  /** Short metric label, e.g. "Dùng ngay". */
  label: string
  /** The value, rendered with money-number tracking. */
  value: ReactNode
  /** Optional tiny hint below the value — keep it to one short line. */
  hint?: string
  className?: string
}

/**
 * A single metric inside a card (v5 02-components §3, §4).
 *
 * Holds only label + value + optional tiny hint. Metric cells at the same
 * level must share this treatment — never highlight one metric on its own.
 *
 * v5 removed the sunk box this used to sit in: a rounded box inside a card is
 * the nested-surface pattern §2.2 forbids outright. The metric now sits
 * directly on the card, and callers separate several of them with spacing or a
 * `divider` — if the relation reads without a background, that background
 * should not exist (03-patterns §6).
 */
export function MetricCell({ label, value, hint, className }: MetricCellProps) {
  return (
    <div className={className}>
      <p className="t-body-sm text-ink2">{label}</p>
      <p className="money-number mt-1.5 t-metric">{value}</p>
      {hint ? <p className="mt-1 t-caption text-ink3">{hint}</p> : null}
    </div>
  )
}

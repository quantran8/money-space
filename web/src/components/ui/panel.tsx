import * as React from 'react'

import { cn } from '@money-space/core/shared/lib/utils'

/** Any non-ASCII character — i.e. Vietnamese text that must not use mono. */
function hasDiacritics(value: string): boolean {
  for (const char of value) {
    if (char.codePointAt(0)! > 127) return true
  }
  return false
}

/**
 * The v4.0 surface primitives (design.md §2.1, §11.1–11.2).
 *
 * Three surfaces, separated by LIGHTNESS only: `--app` (page) → `--panel`
 * (section) → `--sunk` (totals, charts, inputs, results). There is no fourth
 * level, and none of them carries a border or a shadow — once strokes were
 * removed (§2.2–2.4) the lightness step became the only thing drawing a
 * boundary, which is why nesting a third surface inside a `Sunk` reads as mush.
 *
 * Use these instead of `Card`, whose radius/border/shadow belong to v3.x.
 */
export function Panel({ className, ...props }: React.ComponentProps<'section'>) {
  return <section className={cn('card-surface s-card', className)} {...props} />
}

/**
 * Section header: title left, ONE piece of metadata or a single action link
 * right (§11.1). Deliberately has no subtitle slot — a default subtitle on a
 * dashboard section is filler (§2.10, §16.4).
 */
export function PanelHeader({
  title,
  meta,
  action,
  className,
}: {
  title: React.ReactNode
  /** Right-aligned metadata, e.g. "13/08 — 12/09 · 4 khoản". */
  meta?: React.ReactNode
  /** Right-aligned action link. Mutually exclusive with `meta` in practice. */
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-baseline justify-between gap-4', className)}>
      <h2 className="t-title">{title}</h2>
      {action ??
        (meta ? (
          // Mono only touches ASCII (§10.1): a Vietnamese `meta` keeps its
          // accents and the sans face, which `.label-vi` provides. Mono metadata
          // (dates, counts) is unaffected — it has no diacritics to lose.
          <span
            className={cn(
              't-caption text-ink3',
              // v5 §5.1: mono is a treatment for ASCII, not a semantic role, and
              // must never touch accented Vietnamese. Metadata is plain sans.
              typeof meta === 'string' && hasDiacritics(meta) ? 'label-vi' : 'num',
            )}
          >
            {meta}
          </span>
        ) : null)}
    </div>
  )
}

/**
 * The two-column split used inside a section (§7.2): left is the ANSWER (big
 * number, summary), right is the DETAIL (table, legend, breakdown). Collapses
 * to one column below `lg`, answer first.
 */
export function PanelSplit({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        's-head-body s-split-gap grid lg:grid-cols-[minmax(0,380px)_1fr]',
        className,
      )}
      {...props}
    />
  )
}

/**
 * A wash block — a CONTROL surface: fields, a small chart bed, a compact
 * utility control (v5 01-foundations §2.4). It is NOT a card level: never use
 * it to wrap an empty state, a summary metric, a list item or a whole section
 * inside a card.
 */
export function Sunk({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('wash', className)} {...props} />
}

/**
 * The canonical "Tổng …" row: label left, value right.
 *
 * v5 makes this an INLINE SUMMARY under the table (02-components §11) rather
 * than a sunk block — a divider plus a weighted value carries the relation, and
 * a wash strip is reserved for when the summary must separate from a genuinely
 * dense list.
 */
export function TotalRow({
  label,
  value,
  className,
}: {
  label: React.ReactNode
  value: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('mt-4', className)}>
      <div className="divider" />
      <div className="mt-3 flex items-baseline justify-between gap-4">
        <span className="t-body-sm text-ink2">{label}</span>
        <span className="num t-body font-medium">{value}</span>
      </div>
    </div>
  )
}

/**
 * A small mono uppercase label. Only ASCII — Vietnamese diacritics render badly
 * in IBM Plex Mono (§10.1). Vietnamese labels still get `.label`'s size and
 * tracking via CSS, but the font falls back through the stack, so keep the
 * string short either way.
 */
export function Label({ className, ...props }: React.ComponentProps<'p'>) {
  return <p className={cn('label', className)} {...props} />
}

import * as React from 'react'

import { cn } from '@/shared/lib/utils'

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
  return <section className={cn('panel p-5 sm:p-8', className)} {...props} />
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
      <h2 className="section-title text-[16px]">{title}</h2>
      {action ?? (meta ? <span className="font-mono text-[11px] text-ink3">{meta}</span> : null)}
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
        'mt-7 grid gap-x-14 gap-y-9 lg:grid-cols-[minmax(0,380px)_1fr]',
        className,
      )}
      {...props}
    />
  )
}

/**
 * A sunk block. Used for totals rows, chart wells, inputs and result panes.
 * A total is a sunk block set 20px below its table (§7.1) — never a table row
 * with a rule above it (§11.2).
 */
export function Sunk({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('sunk', className)} {...props} />
}

/** The canonical "Tổng …" row: label left, value right, in a sunk block. */
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
    <Sunk className={cn('mt-5 flex items-baseline justify-between gap-4 px-4 py-3.5', className)}>
      <span className="text-[13px] text-ink2">{label}</span>
      <span className="num text-[17px] font-medium">{value}</span>
    </Sunk>
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

import { Text, View } from 'react-native'

import { cn } from '@money-space/core/shared/lib/utils'

import type { ReactNode } from 'react'

/**
 * Panel, Sunk and Label — the surfaces of design v5 §2.
 *
 * A panel carries **no border and no shadow**: the only thing separating it
 * from the page is lightness (`--canvas` → `--card`). There is no fourth
 * level, so a block inside a sunk block needs a different idea, not a darker
 * fill.
 *
 * v5 changes what `Sunk` MEANS: it is a control surface — a field, a hover
 * row, a chart bed — not a tier of card. A whole section never wears it.
 */

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  // p-5 is the mobile padding (§7). Desktop's 32 never applies on a phone.
  return <View className={cn('rounded-card bg-card p-5', className)}>{children}</View>
}

/**
 * Section header: title on the left, and **exactly one** thing on the right —
 * metadata or an action, never both, never a subtitle. Needing both means the
 * section is doing two jobs.
 */
export function PanelHeader({
  title,
  right,
  className,
}: {
  title: string
  right?: ReactNode
  className?: string
}) {
  return (
    <View className={cn('flex-row items-center justify-between gap-3', className)}>
      <Text className="t-body font-medium text-ink">{title}</Text>
      {right}
    </View>
  )
}

/** A block sunk into a panel. Never used for a whole section. */
export function Sunk({ children, className }: { children: ReactNode; className?: string }) {
  return <View className={cn('rounded-control bg-wash p-4', className)}>{children}</View>
}

/**
 * `.ui-label` from §5: 11px, 500, wide tracking, uppercase, ink3.
 *
 * Deliberately NOT the mono face. v5 separates the semantic role from the
 * font: mono is a treatment for ASCII metadata, and uppercase Vietnamese with
 * diacritics rendered in IBM Plex Mono is Vietnamese with the language removed.
 */
export function Label({ children, className }: { children: string; className?: string }) {
  return (
    <Text
      className={cn('t-caption-sm font-medium uppercase text-ink3', className)}
      style={{ letterSpacing: 0.66 }}
    >
      {children}
    </Text>
  )
}

/**
 * A money figure. Tabular numerals are mandatory (§6) — without them a column
 * of amounts does not line up and cannot be compared down the page.
 *
 * `step` picks a rank on the v5 scale rather than a pixel size: the step
 * carries size, weight and tracking together, which is what kept the same
 * figure from rendering three different ways across the app. Money steps are
 * weight 400 — never `font-medium` on top of one.
 */
export function Money({
  children,
  className,
  step = 'metric',
}: {
  children: string
  className?: string
  step?: 'hero' | 'figure' | 'metric' | 'subtitle'
}) {
  return (
    <Text
      className={cn(`t-${step}`, 'text-ink', className)}
      style={{ fontVariant: ['tabular-nums'] }}
    >
      {children}
    </Text>
  )
}

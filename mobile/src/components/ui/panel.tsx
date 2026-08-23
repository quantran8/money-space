import { Text, View } from 'react-native'

import { cn } from '@money-space/core/shared/lib/utils'

import type { ReactNode } from 'react'

/**
 * Panel, Sunk and Label — the three surfaces of design v4.2 §2.
 *
 * A panel carries **no border and no shadow**: the only thing separating it
 * from the page is lightness (`--app` → `--panel` → `--sunk`). There is no
 * fourth level, so a block inside a sunk block needs a different idea, not a
 * darker fill.
 */

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  // p-5 is the mobile padding (§7). Desktop's 32 never applies on a phone.
  return <View className={cn('rounded-panel bg-panel p-5', className)}>{children}</View>
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
      <Text className="text-[16px] font-medium text-ink">{title}</Text>
      {right}
    </View>
  )
}

/** A block sunk into a panel. Never used for a whole section. */
export function Sunk({ children, className }: { children: ReactNode; className?: string }) {
  return <View className={cn('rounded-sunk bg-sunk p-4', className)}>{children}</View>
}

/**
 * `.ui-label` from §5: 11px, 500, wide tracking, uppercase, ink3.
 *
 * Deliberately NOT the mono face. v4.2 separates the semantic role from the
 * font: mono is a treatment for ASCII metadata, and uppercase Vietnamese with
 * diacritics rendered in IBM Plex Mono is Vietnamese with the language removed.
 */
export function Label({ children, className }: { children: string; className?: string }) {
  return (
    <Text
      className={cn('text-[11px] font-medium uppercase text-ink3', className)}
      style={{ letterSpacing: 0.66 }}
    >
      {children}
    </Text>
  )
}

/**
 * A money figure. Tabular numerals are mandatory (§6) — without them a column
 * of amounts does not line up and cannot be compared down the page.
 */
export function Money({
  children,
  className,
  size = 22,
}: {
  children: string
  className?: string
  size?: number
}) {
  return (
    <Text
      className={cn('font-medium text-ink', className)}
      style={{
        fontSize: size,
        fontVariant: ['tabular-nums'],
        // Negative tracking applies to numbers only, never to Vietnamese text.
        letterSpacing: size >= 40 ? -size * 0.04 : -size * 0.03,
      }}
    >
      {children}
    </Text>
  )
}

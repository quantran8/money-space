import { Text, View } from 'react-native'

import { cn } from '@money-space/core/shared/lib/utils'

import type { ReactNode } from 'react'

/**
 * A named group inside a panel.
 *
 * Marked by a plain label, never a tint block: section → sub-section → metric
 * is a hierarchy of type and spacing, not of surfaces. Three nested surfaces
 * was the v4 pattern v5 removes outright.
 */
export function SubSection({
  label,
  right,
  children,
  className,
}: {
  label: string
  right?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <View className={cn('gap-3.5', className)}>
      <View className="flex-row items-center justify-between gap-3">
        <Text className="t-caption font-medium text-ink3">{label}</Text>
        {right}
      </View>
      {children}
    </View>
  )
}

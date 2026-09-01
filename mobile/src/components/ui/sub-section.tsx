import { Text, View } from 'react-native'

import { cn } from '@money-space/core/shared/lib/utils'

import type { ReactNode } from 'react'

/**
 * A named group inside a panel.
 *
 * Sits on the sunk surface with a 13px group label. There is no fourth
 * surface, so a sub-section cannot contain another one — if the content needs
 * that much nesting, it is a second section.
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
    <View className={cn('rounded-control bg-wash p-4', className)}>
      <View className="flex-row items-center justify-between gap-3">
        <Text className="t-body-sm font-medium text-ink2">{label}</Text>
        {right}
      </View>
      <View className="mt-3">{children}</View>
    </View>
  )
}

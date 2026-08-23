import { Pressable, Text, View } from 'react-native'
import { ChevronDown, ChevronUp } from 'lucide-react-native'

import { cn } from '@money-space/core/shared/lib/utils'

import { TOUCH_TARGET, colors } from '@/theme/tokens'

import type { ReactNode } from 'react'

/**
 * The optional half of a form, folded away (§22.2).
 *
 * A form shows 3–4 fields by default; everything that is genuinely optional
 * lives behind exactly ONE of these. Never a second level — a disclosure inside
 * a disclosure is a form that has not decided what it is asking.
 */
export function Disclosure({
  open,
  onToggle,
  label,
  children,
  className,
}: {
  open: boolean
  onToggle: () => void
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <View className={className}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={{ minHeight: TOUCH_TARGET }}
        className="flex-row items-center gap-1.5"
      >
        <Text className="text-[14px] font-medium text-interactive">{label}</Text>
        {open ? (
          <ChevronUp size={16} color={colors.interactive} strokeWidth={1.75} />
        ) : (
          <ChevronDown size={16} color={colors.interactive} strokeWidth={1.75} />
        )}
      </Pressable>

      {/* Unmounted while closed, not hidden: a collapsed field that still holds
          focus or still validates is a field the user cannot see or fix. */}
      {open ? <View className={cn('gap-4')}>{children}</View> : null}
    </View>
  )
}

import { Pressable, Text, View } from 'react-native'

import { cn } from '@money-space/core/shared/lib/utils'

import { TOUCH_TARGET } from '@/theme/tokens'

/**
 * An on/off toggle with its label — one setting per row.
 *
 * Not `Checkbox`: a checkbox says "include this in a set", a switch says "this
 * behaviour is on". Turning interest on for a loan reveals the rate fields, so
 * it is a mode, not a selection.
 *
 * The whole row is the target (§9, 44pt) — a 30pt track you can see but only
 * barely hit is a target that only looks big enough.
 */
export function Switch({
  value,
  onChange,
  label,
  hint,
  className,
}: {
  value: boolean
  onChange: (next: boolean) => void
  label: string
  /** One line of scope or consequence. Omit when the label already says it. */
  hint?: string
  className?: string
}) {
  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      style={{ minHeight: TOUCH_TARGET }}
      className={cn('flex-row items-center gap-3', className)}
    >
      <View className="flex-1">
        <Text className="text-[13px] font-medium text-ink">{label}</Text>
        {hint ? <Text className="mt-0.5 text-[12px] leading-4 text-ink3">{hint}</Text> : null}
      </View>

      {/* The track steps up a surface when on and takes the interactive
          colour — this IS an action's state, which is what colour is for. */}
      <View
        className={cn(
          'h-[26px] w-[44px] justify-center rounded-full px-[3px]',
          value ? 'bg-interactive' : 'bg-committed',
        )}
      >
        <View
          className={cn('h-5 w-5 rounded-full bg-panel', value ? 'self-end' : 'self-start')}
        />
      </View>
    </Pressable>
  )
}

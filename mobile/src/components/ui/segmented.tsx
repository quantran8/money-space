import { Pressable, Text, View } from 'react-native'

import { cn } from '@money-space/core/shared/lib/utils'

import { TOUCH_TARGET } from '@/theme/tokens'

/**
 * A segmented control: pick one of a few short options.
 *
 * Used instead of a dropdown wherever the whole choice fits on screen — a sheet
 * that opens to show three items costs a tap and hides the alternatives. Past
 * about four options, or with long labels, use a picker instead.
 */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
  className,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (next: T) => void
  label?: string
  className?: string
}) {
  return (
    <View className={className}>
      {label ? <Text className="mb-1.5 text-[13px] text-ink2">{label}</Text> : null}

      <View className="flex-row gap-1 rounded-sunk bg-sunk p-1">
        {options.map((option) => {
          const active = option.value === value
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              style={{ minHeight: TOUCH_TARGET - 8 }}
              className={cn(
                'flex-1 items-center justify-center rounded-control px-3',
                // The selected segment steps UP a surface rather than taking a
                // fill colour — colour marks what needs action, not what is on.
                active ? 'bg-panel' : 'bg-transparent',
              )}
            >
              <Text
                className={cn('text-[14px]', active ? 'font-medium text-ink' : 'text-ink2')}
              >
                {option.label}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

import { Pressable, Text, View } from 'react-native'

import { cn } from '@money-space/core/shared/lib/utils'

import { TOUCH_TARGET } from '@/theme/tokens'

/**
 * A segmented control: pick one of a few short options.
 *
 * Used instead of a dropdown wherever the whole choice fits on screen — a sheet
 * that opens to show three items costs a tap and hides the alternatives. Past
 * about four options, or with long labels, use a `Select` instead.
 *
 * **Every label stays on one line.** With four segments across 375pt, one
 * two-word label ("Dùng ngay") wrapped while its neighbours did not, which left
 * the row uneven and the selected segment taller than the rest. Three things
 * hold the line now: the padding and type step down as the count goes up, the
 * label is capped at one line, and it shrinks to fit rather than wrapping.
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
  // Four segments have roughly 80pt each on the narrowest phone; two have 170.
  // The tighter the split, the less room the label has to spend on padding.
  const dense = options.length >= 4

  return (
    <View className={className}>
      {label ? <Text className="mb-2 t-body-sm text-ink2">{label}</Text> : null}

      <View className="flex-row gap-1 rounded-control bg-wash p-1">
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
                'flex-1 items-center justify-center rounded-control',
                dense ? 'px-1' : 'px-3',
                // The selected segment steps UP a surface rather than taking a
                // fill colour — colour marks what needs action, not what is on.
                active ? 'bg-card' : 'bg-transparent',
              )}
            >
              <Text
                // One line, always. `adjustsFontSizeToFit` gives the longest
                // label a little headroom before it would have to truncate;
                // without both, a label either wraps or gets an ellipsis, and
                // a half-read filter name is worse than a slightly smaller one.
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.85}
                className={cn(
                  dense ? 't-body-sm' : 't-body-sm',
                  active ? 'font-medium text-ink' : 'text-ink2',
                )}
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

import { Text, View } from 'react-native'

import { cn } from '@money-space/core/shared/lib/utils'

/**
 * One labelled number inside a section.
 *
 * Metric cells at the same level must all look the same — highlighting one on
 * its own turns a comparison into a claim. If a figure genuinely outranks the
 * others, it belongs outside the group, as the section's own anchor.
 *
 * `hint` is where the assumption goes ("Theo dữ liệu hiện có"). Every derived
 * number has to be explainable, and the hint is where that gets said.
 */
export function MetricCell({
  label,
  value,
  hint,
  tone = 'default',
  className,
}: {
  label: string
  value: string
  hint?: string
  /** Colour marks what needs action — never a neutral figure. */
  tone?: 'default' | 'attention' | 'alert'
  className?: string
}) {
  const valueTone = {
    default: 'text-ink',
    attention: 'text-attention',
    alert: 'text-alert',
  }[tone]

  return (
    <View className={cn('rounded-sunk bg-sunk p-4', className)}>
      <Text className="text-[14px] text-ink2">{label}</Text>
      <Text
        className={cn('mt-1 text-[22px] font-medium', valueTone)}
        style={{ fontVariant: ['tabular-nums'], letterSpacing: -0.66 }}
      >
        {value}
      </Text>
      {hint ? <Text className="mt-1 text-[11px] leading-4 text-ink3">{hint}</Text> : null}
    </View>
  )
}

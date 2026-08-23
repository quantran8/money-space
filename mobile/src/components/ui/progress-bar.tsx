import { View } from 'react-native'

import { cn } from '@money-space/core/shared/lib/utils'

import { colors } from '@/theme/tokens'

/**
 * A thin bar showing how far along something is.
 *
 * The track is `--committed` and the fill is `--interactive`: the same two
 * weights the composition bar uses (§10), so "money that already has a job"
 * reads the same wherever it appears. It is deliberately NOT a hue pair —
 * colour marks what needs action, and being 40% of the way to a goal does not.
 *
 * The fill keeps a minimum width so a goal just started still shows a mark
 * rather than an empty track, which reads as "nothing recorded" (§23).
 */
export function ProgressBar({
  /** 0–100. Clamped here so a caller cannot overflow the track. */
  percent,
  label,
  height = 4,
  tone = 'interactive',
  className,
}: {
  percent: number
  /** Screen-reader description — colour is never the only channel (§9). */
  label?: string
  height?: number
  tone?: 'interactive' | 'attention'
  className?: string
}) {
  const value = Math.min(Math.max(Number.isFinite(percent) ? percent : 0, 0), 100)

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value) }}
      className={cn('overflow-hidden rounded-full', className)}
      style={{ height, backgroundColor: colors.committed }}
    >
      <View
        style={{
          height,
          width: `${value}%`,
          minWidth: value > 0 ? 3 : 0,
          borderRadius: height,
          backgroundColor: tone === 'attention' ? colors.attention : colors.interactive,
        }}
      />
    </View>
  )
}

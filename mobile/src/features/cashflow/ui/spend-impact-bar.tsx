import { Text, View } from 'react-native'

import { cn } from '@money-space/core/shared/lib/utils'

import { colors } from '@/theme/tokens'

/**
 * The SPEND, split across where the money comes from.
 *
 * Not the wallet with the spend marked off inside it — that answers "how big is
 * this next to the balance", which is a real question but not the one being
 * asked here, and at small amounts it answers it as a sliver nobody can read.
 * The question this block exists for is *where does this money come from*, so
 * the bar is the spend itself at full width, divided into the parts that pay
 * for it.
 *
 * Two parts, in the order the money gives way:
 *
 *  1. **fromPace** — this month's contribution, given up first. `--interactive`:
 *     a month of saving paused is the ordinary case, not a wound.
 *  2. **fromSetAside** — money already behind a goal, only once the pace is
 *     gone. `--attention`, never `--alert`: the goal moving backwards is worth
 *     marking, but the household is scheduling a bill, not making a mistake
 *     (§16).
 *
 * A slice is labelled in place only when it is wide enough to hold the figure
 * legibly — a clipped number is worse than none, and the lines beside the bar
 * carry every figure either way. That is also why the whole thing is hidden
 * from the screen reader (§24): it would otherwise read each amount twice.
 */
export function SpendImpactBar({
  fromPace,
  fromSetAside,
  formatAmount,
  className,
}: {
  fromPace: number
  fromSetAside: number
  /** Renders a slice's own figure for the in-bar label. Money is the caller's (§6). */
  formatAmount: (value: number) => string
  className?: string
}) {
  const parts = [
    { key: 'pace', amount: fromPace, fill: colors.interactive },
    { key: 'setAside', amount: fromSetAside, fill: colors.attention },
  ].filter((part) => part.amount > 0)

  const total = parts.reduce((sum, part) => sum + part.amount, 0)
  if (total <= 0) return null

  return (
    <View
      className={cn('h-9 flex-row overflow-hidden rounded-control', className)}
      style={{ backgroundColor: colors.sunk }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {parts.map((part) => {
        const share = (part.amount / total) * 100
        return (
          <View
            key={part.key}
            className="items-center justify-center px-2"
            style={{ flexGrow: part.amount, flexBasis: 0, minWidth: 3, backgroundColor: part.fill }}
          >
            {/* A phone slice needs more room than a desktop one before a
                figure fits: 14% of 375pt is 52pt, which clips "12,1 tr". */}
            {share >= 26 ? (
              <Text
                className="text-[11px] font-medium text-white"
                numberOfLines={1}
                style={{ fontVariant: ['tabular-nums'] }}
              >
                {formatAmount(part.amount)}
              </Text>
            ) : null}
          </View>
        )
      })}
    </View>
  )
}

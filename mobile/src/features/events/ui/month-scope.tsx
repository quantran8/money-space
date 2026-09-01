import { Pressable, Text, View } from 'react-native'
import { ChevronLeft, ChevronRight } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'

import { cn } from '@money-space/core/shared/lib/utils'

import { dateLocale, monthLabel, shiftMonth } from '@/features/events/lib/event-months'
import { TOUCH_TARGET, colors } from '@/theme/tokens'

/**
 * The month every figure on the Events screen is computed for.
 *
 * It sits at the TOP of the screen, above the summary, rather than inside the
 * timeline where it used to live. A scope control below the figures it governs
 * leaves the summary's month implied — the reader has to scroll past the totals
 * to find out which month they are (§34: the range is named once, where it is
 * set, and not restated in each section header).
 *
 * A stepper rather than a picker: a ledger is read one month either side of the
 * one you are in far more often than it is jumped across a year.
 */
export function MonthScope({
  month,
  onChange,
  className,
}: {
  month: string
  onChange: (monthKey: string) => void
  className?: string
}) {
  const { t, i18n } = useTranslation()
  const locale = dateLocale(i18n.resolvedLanguage)

  return (
    <View className={cn('flex-row items-center justify-between', className)}>
      <MonthStep
        label={t('events.history.previousMonth')}
        onPress={() => onChange(shiftMonth(month, -1))}
        direction="previous"
      />
      <Text className="flex-1 text-center t-body font-medium text-ink" numberOfLines={1}>
        {monthLabel(month, locale)}
      </Text>
      <MonthStep
        label={t('events.history.nextMonth')}
        onPress={() => onChange(shiftMonth(month, 1))}
        direction="next"
      />
    </View>
  )
}

function MonthStep({
  label,
  onPress,
  direction,
}: {
  label: string
  onPress: () => void
  direction: 'previous' | 'next'
}) {
  const Icon = direction === 'previous' ? ChevronLeft : ChevronRight
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{ minHeight: TOUCH_TARGET, minWidth: TOUCH_TARGET }}
      className="items-center justify-center rounded-control active:bg-wash"
    >
      <Icon size={18} color={colors.ink2} strokeWidth={1.75} />
    </Pressable>
  )
}

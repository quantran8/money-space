import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { Check, ChevronDown } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'

import type { ForecastRange } from '@money-space/core/features/forecast/model/forecast-range'
import { cn } from '@money-space/core/shared/lib/utils'

import { BottomSheet } from '@/components/ui'
import { formatDayMonth } from '@/features/forecast/lib/forecast-dates'
import { TOUCH_TARGET, colors } from '@/theme/tokens'

/**
 * The presets, in the order a household reaches for them: rolling windows
 * first — "what is coming" is the page's question — then the calendar periods
 * that bills and salary actually land in.
 */
const PRESETS: { key: string; range: ForecastRange }[] = [
  { key: 'days7', range: { kind: 'rolling', days: 7 } },
  { key: 'days30', range: { kind: 'rolling', days: 30 } },
  { key: 'days60', range: { kind: 'rolling', days: 60 } },
  { key: 'thisMonth', range: { kind: 'month', offset: 0 } },
  { key: 'nextMonth', range: { kind: 'month', offset: 1 } },
]

/** Where the rolling windows end and the calendar periods begin. */
const DIVIDER_BEFORE = 'thisMonth'

const isSameRange = (a: ForecastRange, b: ForecastRange): boolean => {
  if (a.kind !== b.kind) return false
  if (a.kind === 'rolling' && b.kind === 'rolling') return a.days === b.days
  if (a.kind === 'month' && b.kind === 'month') return a.offset === b.offset
  return true
}

/**
 * The one control that sets the period every figure on this page is computed
 * for (§34 — range context lives here, not restated in each section header).
 *
 * This replaces `HorizonSelector`, which offered the four raw API horizons as a
 * segmented strip. A horizon is not the question a household asks: "tháng này"
 * is, and it does not map to 7/30/60/90. The horizon is now DERIVED from the
 * range in core, and this control names periods instead of day counts.
 *
 * The web opens a popover with a two-panel calendar for `custom`. There is no
 * custom option here: a two-month range calendar does not fit a phone, and the
 * presets cover every question the page is for. `custom` still renders
 * correctly if one arrives from a deep link — it just cannot be created here.
 */
export function RangePicker({
  range,
  onChange,
  bounds,
}: {
  range: ForecastRange
  onChange: (next: ForecastRange) => void
  /** The resolved window, shown under the label so the dates are never implied. */
  bounds: { start: string; end: string }
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  const activePreset = PRESETS.find((preset) => isSameRange(preset.range, range))
  const label = activePreset ? t(`upcoming.range.${activePreset.key}`) : t('upcoming.range.custom')

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={t('upcoming.range.label')}
        style={{ minHeight: TOUCH_TARGET }}
        className="flex-row items-center justify-between gap-4 rounded-control border border-committed bg-card px-4 py-2 active:bg-canvas"
      >
        <View className="min-w-0">
          <Text className="t-body-sm font-medium text-ink">{label}</Text>
          <Text className="font-mono t-caption text-ink3">
            {`${formatDayMonth(bounds.start)} — ${formatDayMonth(bounds.end)}`}
          </Text>
        </View>
        <ChevronDown size={16} color={colors.ink2} strokeWidth={1.75} />
      </Pressable>

      <BottomSheet open={open} onClose={() => setOpen(false)} title={t('upcoming.range.label')}>
        <View className="gap-0.5">
          {PRESETS.map((preset) => {
            const active = isSameRange(preset.range, range)
            return (
              <View key={preset.key}>
                {/* Functional: rolling windows above, calendar periods below. */}
                {preset.key === DIVIDER_BEFORE ? <View className="my-2 h-px bg-divider" /> : null}
                <Pressable
                  onPress={() => {
                    onChange(preset.range)
                    setOpen(false)
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  style={{ minHeight: TOUCH_TARGET }}
                  className={cn(
                    'flex-row items-center justify-between gap-3 rounded-control px-3',
                    active ? 'bg-wash' : 'active:bg-canvas',
                  )}
                >
                  <Text className={cn('t-body-sm text-ink', active && 'font-medium')}>
                    {t(`upcoming.range.${preset.key}`)}
                  </Text>
                  {active ? <Check size={16} color={colors.ink} strokeWidth={1.75} /> : null}
                </Pressable>
              </View>
            )
          })}
        </View>
      </BottomSheet>
    </>
  )
}

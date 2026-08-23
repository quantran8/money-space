import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { cn } from '@money-space/core/shared/lib/utils'

import { BottomSheet, Button, CaveatNote, DateField, Field } from '@/components/ui'
import { isoPlusDays } from '@/features/forecast/lib/forecast-dates'
import { TOUCH_TARGET } from '@/theme/tokens'

export type PostponeCashflowSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventName: string
  /** The date being moved off. Presets count from here. */
  expectedDate: string
  isSubmitting?: boolean
  onConfirm: (newExpectedDate: string, note?: string) => void
}

/** Counted from the current expected date — a postpone is a shift, not a new plan. */
const PRESETS = [
  { key: 'oneWeek', days: 7 },
  { key: 'twoWeeks', days: 14 },
  { key: 'oneMonth', days: 30 },
]

/**
 * Move an event's date without resolving it.
 *
 * Postponing is deliberately NOT the same as completing or cancelling: the
 * money is still owed, but the date is no longer trusted. That is why the
 * forecast keeps a `postponed` occurrence on the timeline and out of the
 * running balance (memory/cashflow-events.md) — and why this sheet says so
 * before the household commits to it.
 *
 * Nothing is resolved on the household's behalf here either. The new date is
 * always a choice: the presets are shortcuts to the picker below them, not a
 * default the sheet applies by itself.
 *
 * The primary button is NEVER disabled (§22.10) — it validates and says what is
 * missing instead.
 */
export function PostponeCashflowSheet({
  open,
  onOpenChange,
  eventName,
  expectedDate,
  isSubmitting = false,
  onConfirm,
}: PostponeCashflowSheetProps) {
  const { t } = useTranslation()
  const [date, setDate] = useState(expectedDate)
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | undefined>()

  function handleConfirm() {
    if (!date || date <= expectedDate) {
      setError(t('upcoming.postpone.dateMustBeLater'))
      return
    }
    onConfirm(date, note.trim() || undefined)
  }

  return (
    <BottomSheet
      open={open}
      onClose={() => onOpenChange(false)}
      title={t('upcoming.postpone.title')}
      footer={
        <View className="gap-2">
          <Button onPress={handleConfirm} loading={isSubmitting}>
            {t('upcoming.postpone.submit')}
          </Button>
          <Button variant="secondary" onPress={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
        </View>
      }
    >
      <View className="gap-4">
        <Text className="text-[14px] leading-5 text-ink">
          {t('upcoming.postpone.description', { name: eventName })}
        </Text>

        {/* Wrapped chips, each clearing 44pt. */}
        <View className="flex-row flex-wrap gap-1.5">
          {PRESETS.map((preset) => {
            const value = isoPlusDays(expectedDate, preset.days)
            const active = date === value
            return (
              <Pressable
                key={preset.key}
                onPress={() => {
                  setDate(value)
                  setError(undefined)
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={{ minHeight: TOUCH_TARGET - 8 }}
                className={cn(
                  'justify-center rounded-full px-3.5',
                  active ? 'bg-interactive' : 'bg-sunk',
                )}
              >
                <Text
                  className={cn(
                    'text-[12px] font-medium',
                    active ? 'text-white' : 'text-ink2',
                  )}
                >
                  {t(`upcoming.postpone.presets.${preset.key}`)}
                </Text>
              </Pressable>
            )
          })}
        </View>

        <DateField
          label={t('upcoming.postpone.newDate')}
          value={date}
          onChange={(next) => {
            setDate(next)
            setError(undefined)
          }}
          error={error}
        />

        <Field
          label={t('upcoming.postpone.note')}
          placeholder={t('upcoming.postpone.notePlaceholder')}
          value={note}
          onChangeText={setNote}
          multiline
          numberOfLines={2}
          style={{ height: 72, paddingTop: 11, textAlignVertical: 'top' }}
        />

        {/* The consequence, stated before it happens: the amount stops moving
            the projected balance, because its date is no longer trusted. */}
        <CaveatNote>{t('upcoming.postpone.consequence')}</CaveatNote>
      </View>
    </BottomSheet>
  )
}

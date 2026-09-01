import { useMemo, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { ChevronLeft, ChevronRight } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'

import { cn } from '@money-space/core/shared/lib/utils'

import { BottomSheet } from '@/components/ui/bottom-sheet'
import { TOUCH_TARGET, colors } from '@/theme/tokens'

/**
 * Month-granularity counterpart to {@link DateField}.
 *
 * The platform date picker has no month-only mode, so this is a year-paged grid
 * of twelve cells in a sheet — the same shape as the web MonthPicker. Values
 * stay ISO `yyyy-mm-dd` with the day held at `01`; a caller that needs a real
 * day merges one in.
 */

/** Display form: `08/2026`. ASCII, so the mono face is safe here. */
function display(iso: string): string {
  const [year, month] = iso.split('-')
  return year && month ? `${month}/${year}` : ''
}

export function MonthField({
  label,
  value,
  onChange,
  error,
  className,
}: {
  label?: string
  /** ISO `yyyy-mm-dd`; only the year and month are read. */
  value: string
  onChange: (iso: string) => void
  error?: string
  className?: string
}) {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)

  // Intl is available on both platforms (Hermes ships full ICU), so the month
  // names follow the app's language without a date library.
  const monthNames = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(i18n.resolvedLanguage === 'vi' ? 'vi-VN' : 'en-US', {
      month: 'short',
    })
    return Array.from({ length: 12 }, (_, index) => formatter.format(new Date(2026, index, 1)))
  }, [i18n.resolvedLanguage])

  const [year, month] = value.split('-').map(Number)
  const selectedYear = year || undefined
  const selectedMonth = month || undefined

  // Which year the grid shows, which is not the selected year: the household
  // can page through years without committing to one.
  const [viewYear, setViewYear] = useState(() => selectedYear ?? new Date().getFullYear())

  return (
    <View className={className}>
      {label ? <Text className="mb-1.5 t-body-sm text-ink2">{label}</Text> : null}

      <Pressable
        onPress={() => {
          // Reopening lands on the chosen month rather than wherever the last
          // browse left off.
          setViewYear(selectedYear ?? new Date().getFullYear())
          setOpen(true)
        }}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: display(value) }}
        style={{ minHeight: TOUCH_TARGET }}
        className={cn(
          'justify-center rounded-control border px-3.5',
          error ? 'border-alert-ink bg-card' : 'border-divider bg-wash',
        )}
      >
        <Text className={cn('font-mono t-body', value ? 'text-ink' : 'text-ink3')}>
          {value ? display(value) : 'mm/yyyy'}
        </Text>
      </Pressable>

      {error ? <Text className="mt-1.5 t-caption text-alert-ink">{error}</Text> : null}

      <BottomSheet open={open} onClose={() => setOpen(false)} title={label ?? t('common.selectMonth')}>
        <View className="mb-2 flex-row items-center justify-between">
          <Pressable
            onPress={() => setViewYear((current) => current - 1)}
            accessibilityRole="button"
            accessibilityLabel={t('common.previousYear')}
            style={{ minHeight: TOUCH_TARGET, minWidth: TOUCH_TARGET }}
            className="items-center justify-center rounded-control active:bg-wash"
          >
            <ChevronLeft size={18} color={colors.ink3} strokeWidth={1.75} />
          </Pressable>
          <Text className="t-body font-medium text-ink">{viewYear}</Text>
          <Pressable
            onPress={() => setViewYear((current) => current + 1)}
            accessibilityRole="button"
            accessibilityLabel={t('common.nextYear')}
            style={{ minHeight: TOUCH_TARGET, minWidth: TOUCH_TARGET }}
            className="items-center justify-center rounded-control active:bg-wash"
          >
            <ChevronRight size={18} color={colors.ink3} strokeWidth={1.75} />
          </Pressable>
        </View>

        <View className="flex-row flex-wrap">
          {Array.from({ length: 12 }, (_, index) => {
            const monthNumber = index + 1
            const isSelected = selectedYear === viewYear && selectedMonth === monthNumber
            return (
              <View key={monthNumber} className="w-1/3 p-1">
                <Pressable
                  onPress={() => {
                    onChange(`${viewYear}-${String(monthNumber).padStart(2, '0')}-01`)
                    setOpen(false)
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  style={{ minHeight: TOUCH_TARGET }}
                  className={cn(
                    'items-center justify-center rounded-control',
                    isSelected ? 'bg-action' : 'bg-wash',
                  )}
                >
                  <Text
                    className={cn('t-body-sm font-medium', isSelected ? 'text-white' : 'text-ink')}
                  >
                    {monthNames[index]}
                  </Text>
                </Pressable>
              </View>
            )
          })}
        </View>
      </BottomSheet>
    </View>
  )
}

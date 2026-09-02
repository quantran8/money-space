import { useState } from 'react'
import { Platform, Pressable, Text, View } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'

import { cn } from '@money-space/core/shared/lib/utils'

import { TOUCH_TARGET, colors } from '@/theme/tokens'

/**
 * A date field backed by the platform picker.
 *
 * Values cross the API as ISO `yyyy-mm-dd` and are parsed as **local** dates,
 * not UTC. `new Date('2026-08-23')` is midnight UTC, which in Vietnam is
 * already the 23rd but in a negative-offset zone would render as the 22nd —
 * a payment date that silently moves a day is not acceptable.
 */

function toIso(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function fromIso(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number)
  if (!year || !month || !day) return new Date()
  return new Date(year, month - 1, day)
}

/** Display form: `23/08/2026`. ASCII, so the mono face is safe here. */
function display(iso: string): string {
  const [year, month, day] = iso.split('-')
  return year && month && day ? `${day}/${month}/${year}` : ''
}

export function DateField({
  label,
  value,
  onChange,
  error,
  className,
}: {
  label?: string
  /** ISO `yyyy-mm-dd`. */
  value: string
  onChange: (iso: string) => void
  error?: string
  className?: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <View className={className}>
      {label ? <Text className="mb-1.5 t-body-sm text-ink2">{label}</Text> : null}

      <Pressable
        onPress={() => setOpen(true)}
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
          {value ? display(value) : 'dd/mm/yyyy'}
        </Text>
      </Pressable>

      {error ? <Text className="mt-1.5 t-caption text-alert-ink">{error}</Text> : null}

      {open ? (
        <DateTimePicker
          value={value ? fromIso(value) : new Date()}
          mode="date"
          // Android shows its own dialog and closes itself on pick; the iOS
          // inline picker would stay open, so both are dismissed here once a
          // day is chosen.
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          accentColor={colors.interactive}
          onChange={(event, date) => {
            setOpen(false)
            if (event.type === 'dismissed') return
            if (date) onChange(toIso(date))
          }}
        />
      ) : null}
    </View>
  )
}

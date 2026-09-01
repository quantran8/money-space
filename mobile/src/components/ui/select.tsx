import { useMemo, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { Check, ChevronDown } from 'lucide-react-native'

import { cn } from '@money-space/core/shared/lib/utils'

import { BottomSheet } from '@/components/ui/bottom-sheet'
import { Field } from '@/components/ui/field'
import { TOUCH_TARGET, colors } from '@/theme/tokens'

export type SelectOption<T extends string> = {
  value: T
  label: string
  /** Optional group heading — options are rendered under their group. */
  group?: string
}

/**
 * Pick one option from a list, in a sheet.
 *
 * Use `Segmented` when there are two or three short options and they all fit
 * on screen; a sheet that opens to reveal three items costs a tap and hides
 * the alternatives. This is for the longer lists — asset types, categories,
 * members — and it grows a search box once the list is long enough to scroll
 * past what a thumb wants to flick.
 */
export function Select<T extends string>({
  label,
  value,
  options,
  onChange,
  placeholder,
  error,
  searchable,
  searchPlaceholder,
  className,
}: {
  label?: string
  value: T | null
  options: SelectOption<T>[]
  onChange: (next: T) => void
  placeholder?: string
  error?: string
  /** Defaults to on past 8 options. */
  searchable?: boolean
  searchPlaceholder?: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const showSearch = searchable ?? options.length > 8
  const selected = options.find((option) => option.value === value)

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return options
    return options.filter((option) => option.label.toLowerCase().includes(term))
  }, [options, query])

  // Preserve the caller's ordering; only insert headings where the group changes.
  const rows = useMemo(() => {
    const out: ({ kind: 'group'; label: string } | { kind: 'option'; option: SelectOption<T> })[] = []
    let current: string | undefined
    for (const option of filtered) {
      if (option.group && option.group !== current) {
        out.push({ kind: 'group', label: option.group })
        current = option.group
      }
      out.push({ kind: 'option', option })
    }
    return out
  }, [filtered])

  return (
    <View className={className}>
      {label ? <Text className="mb-1.5 t-body-sm text-ink2">{label}</Text> : null}

      <Pressable
        onPress={() => {
          setQuery('')
          setOpen(true)
        }}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: selected?.label }}
        style={{ minHeight: TOUCH_TARGET }}
        className={cn(
          'flex-row items-center justify-between gap-2 rounded-control border px-3.5',
          error ? 'border-alert-ink bg-card' : 'border-divider bg-wash',
        )}
      >
        <Text
          className={cn('flex-1 t-body', selected ? 'text-ink' : 'text-ink3')}
          numberOfLines={1}
        >
          {selected?.label ?? placeholder ?? ''}
        </Text>
        <ChevronDown size={16} color={colors.ink3} strokeWidth={1.75} />
      </Pressable>

      {error ? <Text className="mt-1.5 t-caption text-alert-ink">{error}</Text> : null}

      <BottomSheet open={open} onClose={() => setOpen(false)} title={label}>
        {showSearch ? (
          <Field
            className="mb-2"
            value={query}
            onChangeText={setQuery}
            placeholder={searchPlaceholder}
            autoCorrect={false}
            autoCapitalize="none"
          />
        ) : null}

        {rows.map((row) =>
          row.kind === 'group' ? (
            <Text
              key={`group:${row.label}`}
              className="mb-1 mt-3 t-caption-sm font-medium uppercase text-ink3"
              style={{ letterSpacing: 0.66 }}
            >
              {row.label}
            </Text>
          ) : (
            <Pressable
              key={row.option.value}
              onPress={() => {
                onChange(row.option.value)
                setOpen(false)
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: row.option.value === value }}
              style={{ minHeight: TOUCH_TARGET }}
              className="flex-row items-center justify-between gap-3 rounded-control px-1 active:bg-wash"
            >
              <Text className="flex-1 t-body text-ink">{row.option.label}</Text>
              {row.option.value === value ? (
                <Check size={18} color={colors.interactive} strokeWidth={2} />
              ) : null}
            </Pressable>
          ),
        )}
      </BottomSheet>
    </View>
  )
}

import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Check, ChevronDown } from 'lucide-react-native'

import { cn } from '@money-space/core/shared/lib/utils'
import type {
  SymbolAssetClass,
  SymbolReference,
} from '@money-space/core/features/assets/api/symbols.repository'
import { useSymbolSearch } from '@money-space/core/features/assets/hooks/use-symbol-search'

import { BottomSheet, Field, Skeleton } from '@/components/ui'
import { TOUCH_TARGET, colors } from '@/theme/tokens'

/**
 * Pick a tradeable instrument — a stock, a coin, a gold product, a currency.
 *
 * The kit's `Select` takes a fixed option list; this one searches the backend
 * as the user types, so it cannot be that primitive. It is still built only
 * from the kit (`BottomSheet` + `Field`) rather than hand-rolled markup, and it
 * stays in the assets feature because the async source is asset-specific — the
 * next feature that needs one will want a different endpoint, not this one.
 *
 * Picking from the list is what makes the holding priceable: a typed symbol the
 * providers do not recognise would value at nothing.
 */
export function SymbolPicker({
  label,
  assetClass,
  value,
  onChange,
  onSelectSymbol,
  placeholder,
  error,
  className,
}: {
  label: string
  assetClass: SymbolAssetClass | undefined
  value: string
  onChange: (symbol: string) => void
  /** Fired with the full reference so the caller can carry venue + unit across. */
  onSelectSymbol?: (reference: SymbolReference) => void
  placeholder?: string
  error?: string
  className?: string
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const { symbols, isFetching } = useSymbolSearch(assetClass, search, open)

  function handleSelect(item: SymbolReference) {
    onChange(item.symbol)
    onSelectSymbol?.(item)
    setOpen(false)
    setSearch('')
  }

  return (
    <View className={className}>
      <Text className="mb-1.5 text-[13px] text-ink2">{label}</Text>

      <Pressable
        onPress={() => {
          setSearch('')
          setOpen(true)
        }}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: value }}
        style={{ minHeight: TOUCH_TARGET }}
        className={cn(
          'flex-row items-center justify-between gap-2 rounded-sunk border px-3.5',
          error ? 'border-alert bg-panel' : 'border-transparent bg-sunk',
        )}
      >
        <Text className={cn('flex-1 text-[16px]', value ? 'text-ink' : 'text-ink3')} numberOfLines={1}>
          {value || placeholder || ''}
        </Text>
        <ChevronDown size={16} color={colors.ink3} strokeWidth={1.75} />
      </Pressable>

      {error ? <Text className="mt-1.5 text-[12px] text-alert">{error}</Text> : null}

      <BottomSheet open={open} onClose={() => setOpen(false)} title={label}>
        <Field
          value={search}
          onChangeText={setSearch}
          placeholder={t('assets.form.symbolSearchPlaceholder')}
          autoCorrect={false}
          autoCapitalize="characters"
        />

        <View className="mt-2">
          {isFetching && symbols.length === 0 ? (
            <View className="gap-2">
              {[0, 1, 2, 3].map((index) => (
                <Skeleton key={index} height={44} />
              ))}
            </View>
          ) : symbols.length === 0 ? (
            <Text className="px-1 py-6 text-center text-[13px] text-ink2">
              {t('assets.form.symbolNoResults')}
            </Text>
          ) : (
            symbols.map((item) => (
              <Pressable
                key={`${item.assetClass}:${item.symbol}:${item.exchange}`}
                onPress={() => handleSelect(item)}
                accessibilityRole="button"
                accessibilityState={{ selected: item.symbol === value }}
                style={{ minHeight: TOUCH_TARGET }}
                className="flex-row items-center justify-between gap-3 rounded-control px-1 py-1.5 active:bg-sunk"
              >
                <View className="flex-1">
                  <Text className="text-[15px] text-ink">{item.symbol}</Text>
                  {/* An instrument name can be Vietnamese ("Vàng miếng SJC"),
                      so this line is the sans face, never mono. */}
                  {item.name ? (
                    <Text className="mt-0.5 text-[12px] text-ink3" numberOfLines={1}>
                      {item.exchange ? `${item.name} · ${item.exchange}` : item.name}
                    </Text>
                  ) : null}
                </View>
                {item.symbol === value ? (
                  <Check size={18} color={colors.interactive} strokeWidth={2} />
                ) : null}
              </Pressable>
            ))
          )}
        </View>
      </BottomSheet>
    </View>
  )
}

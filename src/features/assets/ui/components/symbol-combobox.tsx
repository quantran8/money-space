import { useState } from 'react'
import { Check, ChevronDown, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type {
  SymbolAssetClass,
  SymbolReference,
} from '@/features/assets/api/symbols.repository'
import { useSymbolSearch } from '@/features/assets/hooks/use-symbol-search'
import { cn } from '@/shared/lib/utils'

type SymbolComboboxProps = {
  assetClass: SymbolAssetClass | undefined
  value: string
  onChange: (symbol: string) => void
  /** Fired with the full reference when a suggestion is picked (for prefill). */
  onSelectSymbol?: (symbol: SymbolReference) => void
}

/**
 * Searchable symbol picker for stock/crypto asset creation. Opens showing the
 * curated default list; filters via the backend (Twelve Data) as the user
 * types. Selecting a row fills the symbol and lets the caller prefill unit /
 * currency. Falls back to whatever the user typed so a symbol not in the list
 * can still be entered.
 */
export function SymbolCombobox({
  assetClass,
  value,
  onChange,
  onSelectSymbol,
}: SymbolComboboxProps) {
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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          className="flex w-full items-center justify-between gap-2 text-[17px] font-medium text-foreground outline-none"
        >
          <span className={cn(!value && 'text-[hsl(var(--muted-foreground))]')}>
            {value || t('assets.form.symbolPlaceholder')}
          </span>
          <ChevronDown className="size-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] min-w-[260px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            value={search}
            onValueChange={setSearch}
            placeholder={t('assets.form.symbolSearchPlaceholder')}
          />
          <CommandList>
            {isFetching && symbols.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                {t('common.loading')}
              </div>
            ) : (
              <CommandEmpty>{t('assets.form.symbolNoResults')}</CommandEmpty>
            )}
            <CommandGroup>
              {symbols.map((item) => (
                <CommandItem
                  key={`${item.assetClass}:${item.symbol}`}
                  value={item.symbol}
                  onSelect={() => handleSelect(item)}
                  className="flex items-center gap-2"
                >
                  <Check
                    className={cn(
                      'size-4 shrink-0',
                      value.toUpperCase() === item.symbol.toUpperCase()
                        ? 'opacity-100'
                        : 'opacity-0',
                    )}
                  />
                  <span className="font-semibold">{item.symbol}</span>
                  <span className="truncate text-sm text-muted-foreground">
                    {item.name}
                  </span>
                  {item.exchange ? (
                    <span className="ml-auto shrink-0 text-xs text-muted-foreground/70">
                      {item.exchange}
                    </span>
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

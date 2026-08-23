import { useRef, useState } from 'react'
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
} from '@money-space/core/features/assets/api/symbols.repository'
import { useSymbolSearch } from '@money-space/core/features/assets/hooks/use-symbol-search'
import { cn } from '@money-space/core/shared/lib/utils'

type SymbolComboboxProps = {
  assetClass: SymbolAssetClass | undefined
  value: string
  onChange: (symbol: string) => void
  /** Fired with the full reference when a suggestion is picked (for prefill). */
  onSelectSymbol?: (symbol: SymbolReference) => void
  /** Shown on the trigger before anything is picked. */
  placeholder?: string
}

/**
 * Searchable instrument picker for every market-priced class — equities,
 * crypto, precious metals and foreign currency. Opens on the curated default
 * list and filters through the backend as the user types; each row is an
 * instrument the price feed can actually quote.
 *
 * Selecting a row fills the symbol and hands the caller the full reference so
 * it can carry the venue/brand and unit across.
 */
export function SymbolCombobox({
  assetClass,
  value,
  onChange,
  onSelectSymbol,
  placeholder,
}: SymbolComboboxProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const { symbols, isFetching } = useSymbolSearch(assetClass, search, open)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSelect(item: SymbolReference) {
    onChange(item.symbol)
    onSelectSymbol?.(item)
    setOpen(false)
    setSearch('')
  }

  return (
    // `modal` keeps the list's clicks from reaching a parent Dialog's
    // interact-outside handler. Without it the popover is portaled outside the
    // dialog's DOM, the dialog reads every click on a row as an outside click,
    // and the list closes the instant it is touched — nothing can be picked.
    // Same reason `DatePicker` sets it.
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          className="flex w-full items-center justify-between gap-2 text-[17px] font-medium text-foreground outline-none"
        >
          <span className={cn('truncate text-left', !value && 'text-ink2')}>
            {value || placeholder || t('assets.form.symbolPlaceholder')}
          </span>
          <ChevronDown className="size-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-(--radix-popover-trigger-width) min-w-[260px] p-0"
        align="start"
        // Rendered in place, not portaled to <body>: this popover holds a
        // search box, and the parent Dialog's focus guard yanks focus back out
        // of anything outside its DOM — which left the field unfocusable and
        // every keystroke swallowed. Staying inside the dialog keeps it within
        // the focus trap. (`DatePicker` portals fine because a calendar needs
        // no typing.)
        unportalled
      >
        <Command shouldFilter={false}>
          <CommandInput
            ref={inputRef}
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
                  {/* Title + brand only. `name` is the same phrase spelled out
                      again for metals, and three columns in a dialog-width
                      popover wrapped the title one word per line. */}
                  <span className="truncate font-medium">{item.symbol}</span>
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

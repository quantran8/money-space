import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
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
import { CATEGORY_ICON_GROUPS } from '@/features/events/ui/components/category-icon'
import { CategorySelectItem } from '@/features/events/ui/components/category-select-item'
import { cn } from '@money-space/core/shared/lib/utils'

export type CategoryComboboxOption = {
  value: string
  label: string
  iconKey?: string | null
  iconColor?: string | null
}

type CategoryComboboxProps = {
  value: string
  onValueChange: (value: string) => void
  options: CategoryComboboxOption[]
  placeholder: string
  className?: string
  listClassName?: string
}

function normalizeSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase()
}

/**
 * Searchable category picker for event forms.
 *
 * It renders in place so its input remains inside the parent dialog's focus
 * trap. The option list is deliberately short: custom categories can make the
 * list arbitrarily long, but the picker must stay within the dialog.
 */
export function CategoryCombobox({
  value,
  onValueChange,
  options,
  placeholder,
  className,
  listClassName,
}: CategoryComboboxProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const selected = options.find((option) => option.value === value)
  const knownIconKeys = new Set(
    CATEGORY_ICON_GROUPS.flatMap((group) => Object.keys(group.icons)),
  )
  const groups = CATEGORY_ICON_GROUPS.map((group) => ({
    key: group.labelKey,
    label: t(group.labelKey),
    options: options.filter((option) => {
      if (option.iconKey && option.iconKey in group.icons) return true
      return group.labelKey === 'settings.categories.iconGroup.other' &&
        (!option.iconKey || !knownIconKeys.has(option.iconKey))
    }),
  }))

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen) setSearch('')
  }

  function handleSelect(nextValue: string) {
    onValueChange(nextValue)
    handleOpenChange(false)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange} modal>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'flex w-full items-center justify-between gap-2 outline-none',
            className,
          )}
        >
          {selected ? (
            <CategorySelectItem
              label={selected.label}
              iconKey={selected.iconKey}
              iconColor={selected.iconColor}
            />
          ) : (
            <span className="truncate text-ink3">{placeholder}</span>
          )}
          <ChevronDown className="size-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        collisionPadding={16}
        className="w-(--radix-popover-trigger-width) p-0"
        unportalled
      >
        <Command
          filter={(itemValue, query, keywords) => {
            const haystack = normalizeSearch([itemValue, ...(keywords ?? [])].join(' '))
            return haystack.includes(normalizeSearch(query)) ? 1 : 0
          }}
        >
          <CommandInput
            value={search}
            onValueChange={setSearch}
            placeholder={t('common.searchCategories')}
            autoFocus
          />
          <CommandList className={cn('max-h-44', listClassName)}>
            <CommandEmpty>{t('common.noCategoriesFound')}</CommandEmpty>
            {groups.map((group) =>
              group.options.length > 0 ? (
                <CommandGroup
                  key={group.key}
                  heading={group.label}
                  className="[&_[cmdk-group-heading]]:font-sans [&_[cmdk-group-heading]]:normal-case [&_[cmdk-group-heading]]:tracking-normal [&_[cmdk-group-items]]:grid [&_[cmdk-group-items]]:grid-cols-2 [&_[cmdk-group-items]]:gap-1"
                >
                  {group.options.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={`${option.label} ${option.value}`}
                      keywords={[option.value]}
                      onSelect={() => handleSelect(option.value)}
                      className="min-w-0 flex-col justify-center gap-1.5 px-2 py-3 text-center data-[selected=true]:bg-transparent data-[selected=true]:text-ink"
                    >
                      <CategorySelectItem
                        label={option.label}
                        iconKey={option.iconKey}
                        iconColor={option.iconColor}
                        layout="stacked"
                        selected={option.value === value}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : null,
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

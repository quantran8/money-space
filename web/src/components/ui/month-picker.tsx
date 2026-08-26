'use client'

import { useState } from 'react'
import { format, isValid, parseISO } from 'date-fns'
import { enUS, vi } from 'date-fns/locale'
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@money-space/core/shared/lib/utils'

type MonthPickerProps = {
  /** `YYYY-MM-DD`; the day is held at `01` since only the month is chosen. */
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  /**
   * How the chosen month reads on the trigger. Defaults to `MM/yyyy`, which is
   * what a form field wants; a page-level scope control passes a spelled-out
   * month instead, because there the label IS the heading for everything under
   * it.
   */
  formatLabel?: (date: Date) => string
  'aria-invalid'?: boolean
}

function parseMonth(value: string) {
  if (!value) return undefined

  const date = parseISO(value)
  return isValid(date) ? date : undefined
}

/**
 * Month-granularity counterpart to {@link DatePicker}.
 *
 * `react-day-picker` has no month-only mode — its `captionLayout` dropdowns
 * still require picking a day — so this is the Popover + Button pair the
 * DatePicker is built from, with a 12-cell grid in place of the day grid. The
 * native `<input type="month">` it replaces rendered the browser's own panel,
 * which ignored both the design tokens and the Vietnamese locale.
 */
export function MonthPicker({
  value,
  onChange,
  placeholder,
  className,
  formatLabel,
  'aria-invalid': ariaInvalid,
}: MonthPickerProps) {
  const { i18n, t } = useTranslation()
  const selected = parseMonth(value)
  const locale = i18n.resolvedLanguage === 'vi' ? vi : enUS
  const resolvedPlaceholder = placeholder ?? t('common.selectMonth')

  const [open, setOpen] = useState(false)
  // Which year the grid is showing, which is not the selected year: the
  // household can page through years without committing to one.
  const [viewYear, setViewYear] = useState(
    () => selected?.getFullYear() ?? new Date().getFullYear()
  )

  const selectedYear = selected?.getFullYear()
  const selectedMonth = selected?.getMonth()

  return (
    // `modal` keeps the popover's clicks from reaching a parent Dialog's
    // interact-outside handler — same reason as the DatePicker.
    <Popover
      modal
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        // Reopening lands on the chosen month rather than wherever the last
        // browse left off.
        if (next) setViewYear(selected?.getFullYear() ?? new Date().getFullYear())
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            'h-11 w-full justify-start rounded-control border border-committed bg-card px-4 text-left t-body-sm hover:bg-card [&_svg]:text-ink3',
            !selected && 'text-ink3',
            ariaInvalid && 'outline-2 outline-alert',
            className
          )}
          aria-invalid={ariaInvalid}
        >
          <CalendarIcon className="mr-2 size-4 text-ink3" />
          {selected
            ? (formatLabel ?? ((date: Date) => format(date, 'MM/yyyy')))(selected)
            : resolvedPlaceholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <div className="bg-card p-3 text-ink">
          <div className="relative flex h-8 items-center justify-center">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setViewYear((year) => year - 1)}
              aria-label={t('common.previousYear')}
              className="absolute left-0 size-8 rounded-control bg-transparent p-0 text-ink3 hover:bg-wash hover:text-ink"
            >
              <ChevronLeftIcon className="size-4" />
            </Button>
            <span className="select-none t-body-sm font-medium">{viewYear}</span>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setViewYear((year) => year + 1)}
              aria-label={t('common.nextYear')}
              className="absolute right-0 size-8 rounded-control bg-transparent p-0 text-ink3 hover:bg-wash hover:text-ink"
            >
              <ChevronRightIcon className="size-4" />
            </Button>
          </div>

          <div className="mt-2 grid grid-cols-3 gap-1">
            {Array.from({ length: 12 }, (_, month) => {
              const isSelected =
                selectedYear === viewYear && selectedMonth === month

              return (
                <Button
                  key={month}
                  type="button"
                  variant="ghost"
                  data-selected={isSelected}
                  onClick={() => {
                    onChange(
                      `${viewYear}-${String(month + 1).padStart(2, '0')}-01`
                    )
                    setOpen(false)
                  }}
                  className={cn(
                    'h-9 w-full rounded-control px-2 t-body-sm text-ink transition-colors hover:bg-wash hover:text-ink',
                    'data-[selected=true]:bg-action data-[selected=true]:text-white'
                  )}
                >
                  {format(new Date(viewYear, month, 1), 'LLL', { locale })}
                </Button>
              )
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

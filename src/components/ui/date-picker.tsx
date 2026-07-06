'use client'

import { format, isValid, parseISO } from 'date-fns'
import { enUS, vi } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

type DatePickerProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  'aria-invalid'?: boolean
}

function parseDate(value: string) {
  if (!value) return undefined

  const date = parseISO(value)
  return isValid(date) ? date : undefined
}

function formatDateValue(date: Date) {
  return format(date, 'yyyy-MM-dd')
}

export function DatePicker({
  value,
  onChange,
  placeholder,
  className,
  'aria-invalid': ariaInvalid,
}: DatePickerProps) {
  const { i18n, t } = useTranslation()
  const selected = parseDate(value)
  const locale = i18n.resolvedLanguage === 'vi' ? vi : enUS
  const resolvedPlaceholder = placeholder ?? t('common.selectDate')

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            'h-11 w-full justify-start rounded-[22px] px-4 text-left text-sm font-normal shadow-none [&_svg]:text-muted-foreground',
            !selected && 'text-muted-foreground',
            ariaInvalid &&
              'border-[hsl(var(--status-red))] focus-visible:ring-[hsl(var(--status-red))]',
            className
          )}
          aria-invalid={ariaInvalid}
        >
          <CalendarIcon className="mr-2 size-4 text-muted-foreground" />
          {selected ? format(selected, 'P', { locale }) : resolvedPlaceholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto rounded-[24px] p-0">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          className="min-w-[22rem]"
          locale={locale}
          onSelect={(date) => {
            if (date) onChange(formatDateValue(date))
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

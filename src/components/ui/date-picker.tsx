'use client'

import { format, isValid, parseISO } from 'date-fns'
import { CalendarIcon } from 'lucide-react'

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
  placeholder = "Chọn ngày",
  className,
  'aria-invalid': ariaInvalid,
}: DatePickerProps) {
  const selected = parseDate(value)

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
          {selected ? format(selected, 'dd/MM/yyyy') : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto rounded-[24px] p-0">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          className="min-w-[22rem]"
          onSelect={(date) => {
            if (date) onChange(formatDateValue(date))
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

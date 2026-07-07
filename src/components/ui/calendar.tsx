import * as React from 'react'
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from 'lucide-react'
import { DayButton, DayPicker, getDefaultClassNames } from 'react-day-picker'

import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/shared/lib/utils'

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = 'label',
  buttonVariant = 'ghost',
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>['variant']
}) {
  const defaultClassNames = getDefaultClassNames()
  const localeCode = props.locale?.code ?? 'default'

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        'group/calendar bg-card p-4 [--cell-size:2.65rem] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent',
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString(localeCode, { month: 'short' }),
        ...formatters,
      }}
      classNames={{
        root: cn(defaultClassNames.root, 'w-fit'),
        months: cn(
          defaultClassNames.months,
          'relative flex flex-col gap-4 md:flex-row'
        ),
        month: cn(defaultClassNames.month, 'flex w-full flex-col gap-4'),
        nav: cn(
          defaultClassNames.nav,
          'absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1'
        ),
        button_previous: cn(
          defaultClassNames.button_previous,
          buttonVariants({ variant: buttonVariant }),
          'size-8 select-none rounded-full border border-transparent bg-transparent p-0 text-muted-foreground shadow-none hover:bg-secondary hover:text-foreground aria-disabled:opacity-50'
        ),
        button_next: cn(
          defaultClassNames.button_next,
          buttonVariants({ variant: buttonVariant }),
          'size-8 select-none rounded-full border border-transparent bg-transparent p-0 text-muted-foreground shadow-none hover:bg-secondary hover:text-foreground aria-disabled:opacity-50'
        ),
        month_caption: cn(
          defaultClassNames.month_caption,
          'flex h-10 w-full items-center justify-center px-10'
        ),
        dropdowns: cn(
          defaultClassNames.dropdowns,
          'flex h-[--cell-size] w-full items-center justify-center gap-1.5 text-sm font-medium'
        ),
        dropdown_root: cn(
          defaultClassNames.dropdown_root,
          'has-focus:border-ring has-focus:ring-ring/50 relative rounded-2xl border border-input shadow-none has-focus:ring-2'
        ),
        dropdown: cn(
          defaultClassNames.dropdown,
          'absolute inset-0 bg-popover opacity-0'
        ),
        caption_label: cn(
          defaultClassNames.caption_label,
          'select-none font-medium',
          captionLayout === 'label'
            ? 'text-[1.6rem] tracking-[-0.04em]'
            : 'flex h-8 items-center gap-1 rounded-2xl pl-2 pr-1 text-sm [&>svg]:size-3.5 [&>svg]:text-muted-foreground'
        ),
        month_grid: cn(defaultClassNames.month_grid, 'w-full border-collapse'),
        weekdays: cn(defaultClassNames.weekdays, 'mt-3 grid grid-cols-7 gap-1.5'),
        weekday: cn(
          defaultClassNames.weekday,
          'flex size-[--cell-size] select-none items-center justify-center rounded-full text-[0.92rem] font-medium text-muted-foreground'
        ),
        week: cn(defaultClassNames.week, 'mt-1.5 grid grid-cols-7 gap-1.5'),
        week_number_header: cn(
          defaultClassNames.week_number_header,
          'w-[--cell-size] select-none'
        ),
        week_number: cn(
          defaultClassNames.week_number,
          'select-none text-[0.8rem] text-muted-foreground'
        ),
        day: cn(
          defaultClassNames.day,
          'group/day relative size-[--cell-size] select-none p-0 text-center'
        ),
        range_start: cn(
          defaultClassNames.range_start,
          'rounded-l-full bg-secondary'
        ),
        range_middle: cn(defaultClassNames.range_middle, 'rounded-none bg-secondary'),
        range_end: cn(defaultClassNames.range_end, 'rounded-r-full bg-secondary'),
        today: cn(
          defaultClassNames.today,
          'rounded-full text-foreground [&>button]:border [&>button]:border-border [&>button]:bg-secondary [&>button]:text-foreground'
        ),
        outside: cn(
          defaultClassNames.outside,
          'text-muted-foreground opacity-45 aria-selected:text-muted-foreground'
        ),
        disabled: cn(
          defaultClassNames.disabled,
          'text-muted-foreground opacity-35'
        ),
        hidden: cn(defaultClassNames.hidden, 'invisible'),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          )
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === 'left') {
            return (
              <ChevronLeftIcon className={cn('size-4', className)} {...props} />
            )
          }

          if (orientation === 'right') {
            return (
              <ChevronRightIcon
                className={cn('size-4', className)}
                {...props}
              />
            )
          }

          return (
            <ChevronDownIcon className={cn('size-4', className)} {...props} />
          )
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-[--cell-size] items-center justify-center text-center">
                {children}
              </div>
            </td>
          )
        },
        ...components,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames()

  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        defaultClassNames.day,
        'flex size-[--cell-size] min-w-[--cell-size] flex-col items-center justify-center gap-1 rounded-full p-0 text-base font-normal leading-none text-foreground transition-colors hover:bg-secondary hover:text-foreground data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-secondary data-[range-middle=true]:text-foreground data-[range-start=true]:rounded-full data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:rounded-full data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-2 group-data-[focused=true]/day:ring-ring [&>span]:text-xs [&>span]:opacity-70',
        className
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }

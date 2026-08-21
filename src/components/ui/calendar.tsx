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
        'group/calendar bg-panel p-3 text-ink [--cell-size:2.25rem] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent',
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString(localeCode, { month: 'short' }),
        // `vi` renders weekday heads as "Th 2".."Th 7"/"CN", which are too wide
        // for a `--cell-size` column and wrapped onto two lines. Vietnamese
        // calendars conventionally shorten these to "T2".."T7", so drop the
        // space rather than shrink the grid.
        ...(localeCode.startsWith('vi')
          ? {
              formatWeekdayName: (date: Date) =>
                date.getDay() === 0 ? 'CN' : `T${date.getDay() + 1}`,
            }
          : {}),
        ...formatters,
      }}
      classNames={{
        root: cn(defaultClassNames.root, 'w-fit'),
        months: cn(
          defaultClassNames.months,
          'relative flex flex-col gap-4 md:flex-row'
        ),
        month: cn(defaultClassNames.month, 'flex w-fit flex-col gap-3'),
        nav: cn(
          defaultClassNames.nav,
          'absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1'
        ),
        button_previous: cn(
          defaultClassNames.button_previous,
          buttonVariants({ variant: buttonVariant }),
          'size-(--cell-size) select-none rounded-control bg-transparent p-0 text-ink3 hover:bg-sunk hover:text-ink aria-disabled:opacity-50'
        ),
        button_next: cn(
          defaultClassNames.button_next,
          buttonVariants({ variant: buttonVariant }),
          'size-(--cell-size) select-none rounded-control bg-transparent p-0 text-ink3 hover:bg-sunk hover:text-ink aria-disabled:opacity-50'
        ),
        month_caption: cn(
          defaultClassNames.month_caption,
          'flex h-(--cell-size) w-full items-center justify-center px-[calc(var(--cell-size)+0.5rem)]'
        ),
        dropdowns: cn(
          defaultClassNames.dropdowns,
          'flex h-(--cell-size) w-full items-center justify-center gap-1.5 text-sm font-medium'
        ),
        dropdown_root: cn(
          defaultClassNames.dropdown_root,
          'relative rounded-control bg-sunk'
        ),
        dropdown: cn(
          defaultClassNames.dropdown,
          'absolute inset-0 bg-panel opacity-0'
        ),
        caption_label: cn(
          defaultClassNames.caption_label,
          'select-none font-medium',
          captionLayout === 'label'
            ? 'text-sm'
            : 'flex h-8 items-center gap-1 rounded-control pl-2 pr-1 text-sm [&>svg]:size-3.5 [&>svg]:text-ink3'
        ),
        month_grid: cn(defaultClassNames.month_grid, 'w-fit table-fixed border-separate border-spacing-0.5'),
        weekdays: cn(defaultClassNames.weekdays, ''),
        weekday: cn(
          defaultClassNames.weekday,
          // `whitespace-nowrap` matters for `vi`, whose heads are wider than
          // the English "Su".."Sa" and otherwise wrap onto two lines.
          'w-(--cell-size) select-none whitespace-nowrap p-0 pb-1 text-center align-middle text-[0.8rem] font-normal text-ink3'
        ),
        week: cn(defaultClassNames.week, ''),
        week_number_header: cn(
          defaultClassNames.week_number_header,
          'w-(--cell-size) select-none'
        ),
        week_number: cn(
          defaultClassNames.week_number,
          'select-none text-[0.8rem] text-ink3'
        ),
        day: cn(
          defaultClassNames.day,
          'group/day relative h-(--cell-size) w-(--cell-size) select-none p-0 text-center align-middle'
        ),
        range_start: cn(
          defaultClassNames.range_start,
          'rounded-l-control bg-accent-soft'
        ),
        range_middle: cn(defaultClassNames.range_middle, 'rounded-none bg-accent-soft'),
        range_end: cn(defaultClassNames.range_end, 'rounded-r-control bg-accent-soft'),
        today: cn(
          defaultClassNames.today,
          'rounded-control text-ink [&>button]:bg-sunk [&>button]:text-ink'
        ),
        outside: cn(
          defaultClassNames.outside,
          'text-ink3 opacity-45 aria-selected:text-ink3'
        ),
        disabled: cn(
          defaultClassNames.disabled,
          'text-ink3 opacity-35'
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
              <div className="flex size-(--cell-size) items-center justify-center text-center">
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
        // `size="icon"` is deliberately NOT passed: it pins the button to
        // `size-11`, which overrode `--cell-size` and stretched every cell.
        // Height comes from the grid instead, as upstream does.
        'mx-auto flex size-full flex-col items-center justify-center gap-1 rounded-control p-0 text-sm font-normal leading-none text-ink transition-colors hover:bg-sunk hover:text-ink data-[selected-single=true]:bg-accent data-[selected-single=true]:text-white data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-accent-soft data-[range-middle=true]:text-ink data-[range-start=true]:rounded-l-control data-[range-start=true]:bg-accent data-[range-start=true]:text-white data-[range-end=true]:rounded-r-control data-[range-end=true]:bg-accent data-[range-end=true]:text-white group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:outline-2 group-data-[focused=true]/day:outline-accent group-data-[focused=true]/day:outline-offset-2 [&>span]:text-xs [&>span]:opacity-70',
        className
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }

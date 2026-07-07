import { Copy, MoreHorizontal, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { MoneyEventItem } from '@/features/events/model/events'
import { monthKeyOf } from '@/features/events/model/events-month'

type EventRow = MoneyEventItem & {
  id: string
}

type EventsDataTableProps = {
  events: EventRow[]
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
  emptyMessage: string
}

function getAmountTone(direction: MoneyEventItem['direction']) {
  if (direction === 'inflow') return 'text-[hsl(var(--status-green))]'
  if (direction === 'outflow') return 'text-[hsl(var(--status-red))]'
  return 'text-[hsl(var(--accent))]'
}

function getDirectionMark(direction: MoneyEventItem['direction']) {
  if (direction === 'inflow') return { glyph: '+', className: 'bg-[hsla(var(--status-green),0.12)] text-[hsl(var(--status-green))]' }
  if (direction === 'outflow') return { glyph: '−', className: 'bg-[hsla(var(--status-red),0.1)] text-[hsl(var(--status-red))]' }
  return { glyph: '↗', className: 'bg-[hsla(var(--status-blue),0.1)] text-[hsl(var(--status-blue))]' }
}

type MonthGroup = {
  key: string
  label: string
  events: EventRow[]
}

export function EventsDataTable({
  events,
  onDuplicate,
  onDelete,
  emptyMessage,
}: EventsDataTableProps) {
  const { t } = useTranslation()

  const groups: MonthGroup[] = []
  const indexByKey = new Map<string, number>()
  for (const event of events) {
    const key = monthKeyOf(event.isoDate)
    const [year, month] = key.split('-')
    const existing = indexByKey.get(key)
    if (existing === undefined) {
      indexByKey.set(key, groups.length)
      groups.push({
        key,
        label: t('events.table.monthGroup', { month: Number(month), year }),
        events: [event],
      })
    } else {
      groups[existing].events.push(event)
    }
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-border/80 bg-white">
      {groups.length ? (
        groups.map((group) => (
          <div key={group.key}>
            <div className="border-b border-border bg-[hsl(var(--muted))]/60 px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {group.label}
            </div>
            {group.events.map((event) => {
              const mark = getDirectionMark(event.direction)
              return (
                <div
                  key={event.id}
                  className="grid gap-4 border-b border-border px-5 py-5 last:border-b-0 md:grid-cols-[1fr_150px_130px] md:items-center"
                >
                  <div className="flex gap-4">
                    <div
                      className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full text-base font-semibold ${mark.className}`}
                      aria-hidden
                    >
                      {mark.glyph}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{event.title}</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{event.note}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge>{t(`options.eventType.${event.type}`)}</Badge>
                        <Badge variant="outline">
                          {t(`options.eventCategory.${event.category}`, {
                            defaultValue: event.category,
                          })}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground md:text-right">{event.date}</div>
                  <div className="flex items-center justify-between gap-2 md:justify-end">
                    <p
                      className={`money-number text-xl font-semibold ${getAmountTone(event.direction)}`}
                    >
                      {event.amount}
                    </p>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-9 rounded-full text-muted-foreground hover:text-foreground"
                          aria-label={t('events.table.openActions', { title: event.title })}
                        >
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuLabel>{t('events.table.rowActions')}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onDuplicate(event.id)}>
                          <Copy />
                          {t('events.table.duplicate')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDelete(event.id)}
                          className="text-[hsl(var(--status-red))] focus:text-[hsl(var(--status-red))]"
                        >
                          <Trash2 />
                          {t('events.table.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )
            })}
          </div>
        ))
      ) : (
        <p className="px-5 py-16 text-center text-sm text-muted-foreground">{emptyMessage}</p>
      )}
      <p className="px-5 py-5 text-sm leading-6 text-muted-foreground">{t('events.table.note')}</p>
    </div>
  )
}

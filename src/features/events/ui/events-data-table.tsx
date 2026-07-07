import { type ColumnDef } from '@tanstack/react-table'
import { Copy, MoreHorizontal, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { MoneyEventItem } from '@/features/events/model/events'
type EventRow = MoneyEventItem & {
  id: string
}

type EventsDataTableProps = {
  events: EventRow[]
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
}

function getAmountTone(direction: MoneyEventItem['direction']) {
  if (direction === 'inflow') return 'text-[hsl(var(--status-green))]'
  if (direction === 'outflow') return 'text-[hsl(var(--status-red))]'
  return 'text-[hsl(var(--accent))]'
}

export function EventsDataTable({
  events,
  onDuplicate,
  onDelete,
}: EventsDataTableProps) {
  const { t } = useTranslation()

  const columns: ColumnDef<EventRow>[] = [
    {
      accessorKey: 'title',
      header: () => <span className="pl-1">{t('events.table.event')}</span>,
      cell: ({ row }) => (
        <div className="space-y-1.5 pl-1">
          <p className="font-medium text-foreground">{row.original.title}</p>
          <p className="max-w-md text-sm leading-6 text-muted-foreground">{row.original.note}</p>
        </div>
      ),
    },
    {
      accessorKey: 'type',
      header: t('events.table.category'),
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-2">
          <Badge>{t(`options.eventType.${row.original.type}`)}</Badge>
          <Badge variant="outline">
            {t(`options.eventCategory.${row.original.category}`, { defaultValue: row.original.category })}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: 'amount',
      header: () => <div className="text-right">{t('events.table.amount')}</div>,
      cell: ({ row }) => (
        <p className={`money-number text-right text-xl ${getAmountTone(row.original.direction)}`}>
          {row.original.amount}
        </p>
      ),
    },
    {
      accessorKey: 'date',
      header: () => <div className="text-right">{t('events.table.date')}</div>,
      cell: ({ row }) => (
        <div className="text-right text-sm text-muted-foreground">{row.original.date}</div>
      ),
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">{t('events.table.actions')}</span>,
      cell: ({ row }) => (
        <div className="flex justify-end pr-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-9 rounded-full text-muted-foreground hover:text-foreground"
                aria-label={t('events.table.openActions', { title: row.original.title })}
              >
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel>{t('events.table.rowActions')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDuplicate(row.original.id)}>
                <Copy />
                {t('events.table.duplicate')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(row.original.id)}
                className="text-[hsl(var(--status-red))] focus:text-[hsl(var(--status-red))]"
              >
                <Trash2 />
                {t('events.table.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ]

  return (
    <div className="rounded-3xl border border-border/80 bg-white">
      <DataTable
        columns={columns}
        data={events}
        emptyMessage={t('events.table.empty')}
      />
      <p className="px-5 pb-5 text-sm leading-6 text-muted-foreground">
        {t('events.table.note')}
      </p>
    </div>
  )
}

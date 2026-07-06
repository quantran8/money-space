import { type ColumnDef } from '@tanstack/react-table'
import { Copy, MoreHorizontal, Trash2 } from 'lucide-react'

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
import type { MoneyEventItem } from '@/lib/mock-data'
import { eventCategoryLabels, eventTypeLabels } from '@/lib/mock-data'

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
  const columns: ColumnDef<EventRow>[] = [
    {
      accessorKey: 'title',
      header: () => <span className="pl-1">Event</span>,
      cell: ({ row }) => (
        <div className="space-y-1.5 pl-1">
          <p className="font-medium text-foreground">{row.original.title}</p>
          <p className="max-w-md text-sm leading-6 text-muted-foreground">{row.original.note}</p>
        </div>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Phân loại',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-2">
          <Badge>{eventTypeLabels[row.original.type]}</Badge>
          <Badge variant="outline">
            {eventCategoryLabels[row.original.category] ?? row.original.category}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: 'amount',
      header: () => <div className="text-right">Số tiền</div>,
      cell: ({ row }) => (
        <p className={`money-number text-right text-xl ${getAmountTone(row.original.direction)}`}>
          {row.original.amount}
        </p>
      ),
    },
    {
      accessorKey: 'date',
      header: () => <div className="text-right">Ngày</div>,
      cell: ({ row }) => (
        <div className="text-right text-sm text-muted-foreground">{row.original.date}</div>
      ),
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <div className="flex justify-end pr-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-9 rounded-full text-muted-foreground hover:text-foreground"
                aria-label={`Mở action cho ${row.original.title}`}
              >
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel>Row actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDuplicate(row.original.id)}>
                <Copy />
                Nhân bản event
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(row.original.id)}
                className="text-[hsl(var(--status-red))] focus:text-[hsl(var(--status-red))]"
              >
                <Trash2 />
                Xóa khỏi timeline
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ]

  return (
    <div className="rounded-[26px] border border-border/80 bg-white">
      <DataTable
        columns={columns}
        data={events}
        emptyMessage="Chưa có money event nào. Thêm một khoản lớn để bắt đầu timeline."
      />
      <p className="px-5 pb-5 text-sm leading-6 text-muted-foreground">
        Chỉ cần ghi những khoản đủ lớn hoặc đủ quan trọng để cả hai cùng hiểu vì sao snapshot
        thay đổi.
      </p>
    </div>
  )
}

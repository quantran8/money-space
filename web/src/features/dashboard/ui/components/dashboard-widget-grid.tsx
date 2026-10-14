import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  SortableContext,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Columns2, GripVertical, RectangleHorizontal, X } from 'lucide-react'

import type {
  DashboardWidgetId,
  DashboardWidgetItem,
  DashboardWidgetSize,
} from '@money-space/core/features/dashboard/model/dashboard-layout'
import { cn } from '@money-space/core/shared/lib/utils'

type Props = {
  layout: DashboardWidgetItem[]
  editing: boolean
  render: (id: DashboardWidgetId) => ReactNode
  onReorder: (next: DashboardWidgetItem[]) => void
  onResize: (id: DashboardWidgetId, size: DashboardWidgetSize) => void
  onRemove: (id: DashboardWidgetId) => void
}

export function DashboardWidgetGrid({
  layout,
  editing,
  render,
  onReorder,
  onResize,
  onRemove,
}: Props) {
  // A short press-and-hold on touch keeps the page scrollable.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const from = layout.findIndex((w) => w.id === active.id)
    const to = layout.findIndex((w) => w.id === over.id)
    if (from < 0 || to < 0) return
    onReorder(arrayMove(layout, from, to))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={layout.map((w) => w.id)} strategy={rectSortingStrategy}>
        <div className="grid gap-3 xl:grid-cols-2">
          {layout.map((item) => (
            <WidgetSlot
              key={item.id}
              item={item}
              editing={editing}
              onResize={onResize}
              onRemove={onRemove}
            >
              {render(item.id)}
            </WidgetSlot>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

function WidgetSlot({
  item,
  editing,
  children,
  onResize,
  onRemove,
}: {
  item: DashboardWidgetItem
  editing: boolean
  children: ReactNode
  onResize: Props['onResize']
  onRemove: Props['onRemove']
}) {
  const { t } = useTranslation()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: !editing,
  })

  // A widget that renders nothing (e.g. no overdue items) leaves no empty cell.
  if (!editing && !children) return null

  const nextSize: DashboardWidgetSize = item.size === 'full' ? 'half' : 'full'

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        'relative min-w-0',
        item.size === 'full' && 'xl:col-span-2',
        isDragging && 'z-10 opacity-80',
        editing && 'rounded-lg outline-2 outline-dashed outline-offset-2 outline-action/40',
      )}
    >
      {editing ? (
        <div className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-pill bg-canvas p-1">
          <button
            type="button"
            aria-label={t('home.layout.drag')}
            className="flex size-11 cursor-grab touch-none items-center justify-center rounded-pill text-ink hover:bg-wash active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-4" />
          </button>
          <button
            type="button"
            aria-label={t(nextSize === 'half' ? 'home.layout.half' : 'home.layout.full')}
            title={t(nextSize === 'half' ? 'home.layout.half' : 'home.layout.full')}
            className="hidden size-11 items-center justify-center rounded-pill text-ink hover:bg-wash xl:flex"
            onClick={() => onResize(item.id, nextSize)}
          >
            {nextSize === 'half' ? (
              <Columns2 className="size-4" />
            ) : (
              <RectangleHorizontal className="size-4" />
            )}
          </button>
          <button
            type="button"
            aria-label={t('home.layout.remove')}
            title={t('home.layout.remove')}
            className="flex size-11 items-center justify-center rounded-pill text-ink hover:bg-wash"
            onClick={() => onRemove(item.id)}
          >
            <X className="size-4" />
          </button>
        </div>
      ) : null}
      {/* Content stays inert while arranging so a drag never opens a row. */}
      <div className={cn(editing && 'pointer-events-none select-none')}>
        {children ?? (
          <div className="t-body-sm flex min-h-24 items-center justify-center rounded-lg text-ink2">
            {t(`home.layout.widget.${item.id}`)}
          </div>
        )}
      </div>
    </div>
  )
}

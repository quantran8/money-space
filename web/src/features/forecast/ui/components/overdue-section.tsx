import { ArrowUpRight, Loader2, MoreHorizontal, Pencil, Trash2, TriangleAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label, Panel, PanelHeader } from '@/components/ui/panel'
import type { OverdueSummary } from '@money-space/core/features/forecast/model/forecast-overdue'
import { formatVndCellSigned } from '@money-space/core/shared/lib/format-money'
import { cn } from '@money-space/core/shared/lib/utils'

/**
 * Khoản quá hạn — its own card, on Home directly under the hero and on the
 * Upcoming page above the timeline.
 *
 * It used to live inside §12.2 as a collapsed strip under the event rail, on
 * the reasoning that an overdue item is the same sequence as an upcoming one.
 * That reasoning holds for the ARITHMETIC — these are still owed, still inside
 * `startingLiquidBalance` and everything projected from it — but not for the
 * READING. Everything else on Home is something to know; this is the only
 * thing on the page waiting on a person, and folded shut at the bottom of the
 * right-hand column it was the least visible item on the page.
 *
 * So it sits second, above the forecast that already counts it: the household
 * sees what is waiting before it reads figures that assume it settled. It
 * renders nothing when nothing is waiting, which is why it can hold this
 * position without costing a permanent card.
 *
 * Alert tone, and only here (§5.2, §25): a date that has passed with no
 * confirmation is a fact about the calendar, not a judgement — the block names
 * what is waiting and what it comes to, and never says what anyone should do.
 */
export function OverdueSection({
  overdue,
  onComplete,
  onEdit,
  onDelete,
  pendingId,
  showViewAll = true,
}: {
  overdue: OverdueSummary
  /** Marks one occurrence resolved. The ONLY way an item leaves this list (§18). */
  onComplete?: (sourceEventId: string, occurrenceDate: string) => void
  /**
   * Sửa/xoá khoản gốc — cùng menu ⋯ như hàng trên dòng thời gian, vì một khoản
   * quá hạn thường sai ngày hoặc sai số chứ không phải đã trả (§18).
   */
  onEdit?: (sourceEventId: string) => void
  onDelete?: (sourceEventId: string) => void
  /** The row currently being confirmed, so only ITS button shows a spinner. */
  pendingId?: string | null
  /**
   * Home links out to the full list; the Upcoming page IS that list, so it
   * turns the link off rather than pointing the reader at the page they are on.
   */
  showViewAll?: boolean
}) {
  const { t } = useTranslation()

  if (overdue.totalCount === 0) return null

  return (
    <Panel>
      <PanelHeader
        title={t('home.upcoming.overdue.title')}
        action={
          showViewAll ? (
            <Link
              to="/upcoming"
              className="inline-flex min-h-11 items-center gap-1 t-body font-medium text-action"
            >
              {t('home.upcoming.overdue.viewAll')}
              <ArrowUpRight className="size-4 shrink-0" strokeWidth={1.8} aria-hidden />
            </Link>
          ) : undefined
        }
      />

      {/* The summary line, stated once at the top: how many, how old, and that
          the figures below already count them. Everything under it is the same
          facts per item, so this is the only place the totals appear (§2.10). */}
      <div className="mt-5 flex items-start gap-3 rounded-control bg-alert-tint p-4">
        <TriangleAlert
          className="mt-[2px] size-5 shrink-0 text-alert-ink"
          strokeWidth={1.7}
          aria-hidden
        />
        <div className="min-w-0">
          <p className="t-body-sm font-medium text-alert-ink">
            {overdue.oldestDays === undefined
              ? t('home.upcoming.overdue.count', { count: overdue.totalCount })
              : t('home.upcoming.overdue.summary', {
                  count: overdue.totalCount,
                  days: overdue.oldestDays,
                })}
          </p>
          <p className="mt-1 t-caption leading-5 text-ink2">
            {t('home.upcoming.overdue.note')}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <Label>{t('home.upcoming.overdue.listLabel')}</Label>

        <ul className="mt-2">
          {overdue.rows.map((row) => (
            <OverdueRowItem
              key={row.key}
              row={row}
              onComplete={onComplete}
              onEdit={onEdit}
              onDelete={onDelete}
              pending={pendingId === row.sourceEventId}
            />
          ))}
        </ul>

        {overdue.totalCount > overdue.rows.length ? (
          <p className="mt-3 t-caption text-ink2">
            {t('home.upcoming.overdue.more', {
              count: overdue.totalCount - overdue.rows.length,
            })}
          </p>
        ) : null}
      </div>
    </Panel>
  )
}

/**
 * One waiting item: when it fell due, what it is, how late it is, what it comes
 * to, and the button that resolves it.
 *
 * The age sits beside the amount rather than under the name because it is the
 * one field that ranks these rows against each other — the list is sorted by
 * it, and a reader scanning for "the oldest" should not have to read names.
 */
function OverdueRowItem({
  row,
  onComplete,
  onEdit,
  onDelete,
  pending,
}: {
  row: OverdueSummary['rows'][number]
  onComplete?: (sourceEventId: string, occurrenceDate: string) => void
  onEdit?: (sourceEventId: string) => void
  onDelete?: (sourceEventId: string) => void
  pending: boolean
}) {
  const { t } = useTranslation()

  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 border-t border-divider py-3 first:border-t-0 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto_32px] sm:gap-x-6">
      <div className="flex min-w-0 items-baseline gap-3">
        {/* When it FELL DUE, not the day the forecast lists it under. Absent
            when the source event is not loaded — better no date than today's. */}
        <span className="num shrink-0 font-mono t-caption-sm text-ink3">
          {row.dueDate ? formatDayMonth(row.dueDate) : ''}
        </span>
        <span className="truncate t-body-sm font-medium">{row.name}</span>
      </div>

      {row.daysOverdue === undefined ? (
        <span className="hidden sm:block" />
      ) : (
        <span className="col-start-1 row-start-2 flex items-center gap-2 t-caption whitespace-nowrap text-ink2 sm:col-start-2 sm:row-start-1">
          <span className="size-1.5 shrink-0 rounded-full bg-alert" aria-hidden />
          {t('home.upcoming.overdue.age', { count: row.daysOverdue })}
        </span>
      )}

      <span
        className={cn(
          'num col-start-2 row-start-2 justify-self-end t-body-sm font-medium whitespace-nowrap sm:col-start-3 sm:row-start-1',
          row.signedAmount > 0 ? 'text-positive-ink' : 'text-alert-ink',
        )}
      >
        {formatVndCellSigned(row.signedAmount)}{' '}
        {/* §10.4 — the unit is stated beside the figure, never baked in. */}
        <span className="font-mono t-caption-sm text-ink3">
          {t('units.million')}
        </span>
      </span>

      {onComplete ? (
        <button
          type="button"
          // `row.date` — day 0 — is the idempotency key the API expects, NOT
          // `row.dueDate`, which is only what we show (§18).
          onClick={() => onComplete(row.sourceEventId, row.date)}
          disabled={pending}
          className="col-span-2 col-start-1 row-start-3 inline-flex min-h-11 items-center justify-center gap-1.5 rounded-control bg-action px-4 t-body font-medium text-action-inverse transition-opacity hover:opacity-90 disabled:opacity-60 sm:col-span-1 sm:col-start-4 sm:row-start-1 sm:justify-self-end"
        >
          {pending ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              {t('home.upcoming.overdue.marking')}
            </>
          ) : (
            t('home.upcoming.overdue.markDone')
          )}
        </button>
      ) : null}

      {/* "Đã xong" ở lại là nút riêng — nó là hành động duy nhất đưa khoản này
          ra khỏi danh sách, nên không giấu sau menu. Sửa và xoá thì vào ⋯,
          giống hệt hàng trên dòng thời gian (§12.2). */}
      {onEdit || onDelete ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={t('upcoming.rowActions.label')}
            className="col-start-2 row-start-1 flex size-8 items-center justify-center justify-self-end rounded-full text-ink3 outline-none transition hover:bg-card hover:text-ink sm:col-start-5 sm:row-start-1"
          >
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onEdit ? (
              <DropdownMenuItem onClick={() => onEdit(row.sourceEventId)}>
                <Pencil className="mr-2 size-4" />
                {t('upcoming.rowActions.edit')}
              </DropdownMenuItem>
            ) : null}
            {onDelete ? (
              <DropdownMenuItem
                className="text-alert-ink focus:text-alert-ink"
                onClick={() => onDelete(row.sourceEventId)}
              >
                <Trash2 className="mr-2 size-4" />
                {t('upcoming.rowActions.delete')}
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </li>
  )
}

/** "24/08" — mono-safe ASCII, per §10.1. */
function formatDayMonth(isoDate: string): string {
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})/)
  return match ? `${match[3]}/${match[2]}` : isoDate
}

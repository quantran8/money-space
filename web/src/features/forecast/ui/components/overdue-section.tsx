import { ArrowUpRight, Loader2, MoreHorizontal, Pencil, Trash2, TriangleAlert, UserRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Panel, PanelHeader } from '@/components/ui/panel'
import {
  CATEGORY_ICON_DEFAULT_COLOR,
  CATEGORY_ICON_FALLBACK,
  CATEGORY_ICONS,
} from '@/features/events/ui/components/category-icon'
import type { ForecastCategoryVisual } from '@/features/forecast/ui/components/forecast-timeline'
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
  ownerNameByEventId = {},
  categoryVisualByEventId = {},
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
  ownerNameByEventId?: Record<string, string | undefined>
  categoryVisualByEventId?: Record<string, ForecastCategoryVisual | undefined>
}) {
  const { t } = useTranslation()

  if (overdue.totalCount === 0) return null

  return (
    <Panel>
      <PanelHeader
        title={t('home.upcoming.overdue.title')}
        meta={
          showViewAll
            ? undefined
            : t('upcoming.timeline.count', { count: overdue.totalCount })
        }
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
      <div className="mt-4 rounded-control bg-alert-tint px-4 py-3.5">
        <div className="flex items-center gap-2 text-alert-ink">
          <TriangleAlert
            className="size-4 shrink-0"
            strokeWidth={1.7}
            aria-hidden
          />
          <p className="t-body-sm font-medium">
            {overdue.oldestDays === undefined
              ? t('home.upcoming.overdue.count', { count: overdue.totalCount })
              : t('home.upcoming.overdue.summary', {
                  count: overdue.totalCount,
                  days: overdue.oldestDays,
                })}
          </p>
        </div>
        <p className="mt-2 max-w-[760px] t-body-sm leading-5 text-ink2">
          {t('home.upcoming.overdue.note')}
        </p>
      </div>

      <div className="mt-3">
        <ul className="space-y-1">
          {overdue.rows.map((row) => (
            <OverdueRowItem
              key={row.key}
              row={row}
              onComplete={onComplete}
              onEdit={onEdit}
              onDelete={onDelete}
              pending={pendingId === row.sourceEventId}
              ownerName={ownerNameByEventId[row.sourceEventId]}
              categoryVisual={categoryVisualByEventId[row.sourceEventId]}
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
  ownerName,
  categoryVisual,
}: {
  row: OverdueSummary['rows'][number]
  onComplete?: (sourceEventId: string, occurrenceDate: string) => void
  onEdit?: (sourceEventId: string) => void
  onDelete?: (sourceEventId: string) => void
  pending: boolean
  ownerName?: string
  categoryVisual?: ForecastCategoryVisual
}) {
  const { t } = useTranslation()
  // Generated from its debt and regenerated on every schedule change, so a hand
  // edit here would be undone. "Đã xong" stays: recording a payment is not an
  // edit of the plan.
  const isDebtDerived = Boolean(row.debtId)
  const CategoryIcon =
    (categoryVisual?.iconKey && CATEGORY_ICONS[categoryVisual.iconKey]) ||
    CATEGORY_ICON_FALLBACK

  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-control px-3 py-3 transition-colors hover:bg-wash sm:grid-cols-[72px_minmax(0,1fr)_170px_auto]">
      <span className="num t-body-sm text-ink2">
        {row.dueDate ? formatDayMonth(row.dueDate) : ''}
      </span>

      <div className="col-span-2 flex min-w-0 items-center gap-3 sm:col-span-1">
        <span
          className="grid size-10 shrink-0 place-items-center rounded-pill text-white"
          style={{
            backgroundColor:
              categoryVisual?.iconColor ?? CATEGORY_ICON_DEFAULT_COLOR,
          }}
          title={categoryVisual?.label}
        >
          <CategoryIcon className="size-4" strokeWidth={1.75} aria-hidden />
        </span>
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="truncate t-body font-medium">{row.name}</span>
            {row.daysOverdue === undefined ? null : (
              <span className="shrink-0 rounded-pill bg-alert-tint px-2 py-0.5 t-caption-sm font-medium text-alert-ink">
                {t('home.upcoming.overdue.age', { count: row.daysOverdue })}
              </span>
            )}
          </div>
          <span className="mt-0.5 flex min-w-0 items-center gap-1.5 t-caption text-ink3">
            <UserRound className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
            <span className="truncate">
              {ownerName ?? t('upcoming.timeline.householdOwner')}
            </span>
          </span>
        </div>
      </div>

      <span
        className={cn(
          'num col-start-1 row-start-3 t-subtitle whitespace-nowrap text-ink sm:col-start-3 sm:row-start-1 sm:justify-self-end',
        )}
      >
        {formatVndCellSigned(row.signedAmount)}{' '}
        {/* §10.4 — the unit is stated beside the figure, never baked in. */}
        <span className="font-mono t-caption-sm text-ink3">
          {t('units.million')}
        </span>
      </span>

      <div className="col-start-2 row-start-3 flex items-center justify-self-end sm:col-start-4 sm:row-start-1">
        {onComplete ? (
          <button
            type="button"
            onClick={() => onComplete(row.sourceEventId, row.date)}
            disabled={pending}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-control bg-action px-4 t-body-sm font-medium text-action-inverse transition-opacity hover:opacity-90 disabled:opacity-60"
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

        {(onEdit || onDelete) && !isDebtDerived ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label={t('upcoming.rowActions.label')}
              className="flex size-11 items-center justify-center rounded-control text-ink2 outline-none transition-colors hover:bg-wash hover:text-ink"
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
      </div>
    </li>
  )
}

/** "24/08" — mono-safe ASCII, per §10.1. */
function formatDayMonth(isoDate: string): string {
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})/)
  return match ? `${match[3]}/${match[2]}` : isoDate
}

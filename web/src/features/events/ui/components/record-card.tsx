import { MoreVertical, User, Wallet } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  formatRecordAmount,
  type FinancialRecordItem,
} from '@money-space/core/features/events/model/events-form'
import {
  CATEGORY_ICON_DEFAULT_COLOR,
  CATEGORY_ICON_FALLBACK,
  CATEGORY_ICONS,
} from '@/features/events/ui/components/category-icon'
import { formatVndExact, formatVndShort } from '@money-space/core/shared/lib/format-money'
import { cn } from '@money-space/core/shared/lib/utils'

type RecordCardProps = {
  record: FinancialRecordItem
  /** The record's category, resolved by the caller from its `categoryId`
   *  against the household's category list: the translated label plus the disc's
   *  glyph key and fill. Undefined (an unknown or missing category) renders the
   *  fallback glyph on a neutral disc with no subtitle — normal, and it must
   *  never leave a hole in the list. */
  categoryVisual?: {
    label: string
    iconKey: string | null
    iconColor: string | null
  }
  /**
   * The wallet balance at this event, when it is negative. Editing a back-dated
   * event replays the wallet from its opening balance, so a correction upstream
   * can leave this row sitting on money the wallet never had (see
   * wallet-replay-on-edit). Absent means the balance here is fine.
   */
  overdraftBalance?: number
  onEditEvent: (id: string) => void
  onDuplicateEvent: (id: string) => void
  onToggleEventAttention: (id: string) => void
  onDeleteEvent: (id: string) => void
}

export function RecordCard({
  record,
  categoryVisual,
  overdraftBalance,
  onEditEvent,
  onDuplicateEvent,
  onToggleEventAttention,
  onDeleteEvent,
}: RecordCardProps) {
  const { t } = useTranslation()
  // The subtitle is the category — but only when the title is something else.
  // With no note the title IS the category label (core's fallback), and printing
  // it again underneath just stacked the same word twice.
  const categoryLabel = record.titleIsCategory ? null : categoryVisual?.label ?? null
  const actor = record.ownerName || t('events.history.householdActor')
  const relatedName = record.fromAssetName || record.toAssetName
  const amount = formatRecordAmount(record, formatVndShort)
  const overdraftHint =
    overdraftBalance === undefined
      ? null
      : t('events.history.overdraftBadgeHint', {
          // Exact: the copy tells the reader to go find a missing or
          // mis-entered transaction, which needs a matchable figure.
          amount: formatVndExact(Math.abs(overdraftBalance)),
        })
  // Member access, not a helper call: read as `CATEGORY_ICONS[key] ?? FALLBACK`
  // directly — see category-icon.tsx. A capitalized binding assigned from a
  // CALL trips `react-hooks/static-components` (it can't tell a lookup from a
  // component factory); a plain member expression is the same lookup and stays
  // legible to it. The glyph is CATEGORY, not event type (spending vs. income
  // vs. transfer): "what kind of thing this is" reads clearer than "which way
  // money moved", and it is what the household already sees on the category
  // picker.
  const CategoryIcon = (categoryVisual?.iconKey && CATEGORY_ICONS[categoryVisual.iconKey]) || CATEGORY_ICON_FALLBACK
  const needsAttention = record.isAttentionNeeded || record.status === 'overdue'

  return (
    <article className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-5 rounded-control px-2 py-3 transition-colors hover:bg-canvas">
      {/* Everything that says WHAT happened, left. */}
      <div className="flex min-w-0 items-start gap-3">
        {/* Category identity lives in the disc fill; the glyph stays white for
            every category, including the fallback state. */}
        <span
          className="grid size-11 shrink-0 place-items-center rounded-pill text-white"
          style={{
            backgroundColor:
              categoryVisual?.iconColor ?? CATEGORY_ICON_DEFAULT_COLOR,
          }}
          role="img"
          aria-label={categoryVisual?.label ?? undefined}
          title={categoryVisual?.label ?? undefined}
        >
          <CategoryIcon className="size-5" strokeWidth={1.75} />
        </span>

        <div className="min-w-0 flex-1 pt-0.5">
          <h4 className="truncate t-body-sm font-medium leading-5">{record.title}</h4>
          {categoryLabel ? (
            <p className={cn('truncate t-caption', needsAttention ? 'text-attention-ink' : 'text-ink3')}>
              {categoryLabel}
            </p>
          ) : null}
          <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            <span className="flex min-w-0 items-center gap-1 t-caption text-ink3">
              <User className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
              <span className="truncate">{actor}</span>
            </span>
            {relatedName ? (
              <span className="flex min-w-0 items-center gap-1 t-caption text-ink3">
                <Wallet className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
                <span className="truncate">{relatedName}</span>
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* The amount and the row's one action, right. */}
      <div className="flex shrink-0 items-center gap-2 pt-0.5">
        {overdraftHint ? (
          <span
            className="shrink-0 rounded-control bg-attention px-2 py-0.5 t-caption-sm font-medium text-attention-ink"
            title={overdraftHint}
          >
            {t('events.history.overdraftBadge')}
          </span>
        ) : null}
        <p className="num min-w-[88px] whitespace-nowrap text-right t-body-sm font-medium">
          {amount}
        </p>
        <DropdownMenu>
          <DropdownMenuTrigger
            className="grid size-11 place-items-center rounded-control text-ink2 transition-colors hover:bg-card hover:text-ink"
            aria-label={t('events.redesign.timeline.actions')}
          >
            <MoreVertical className="size-[18px]" strokeWidth={1.75} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {record.canEdit !== false ? <DropdownMenuItem onSelect={() => onEditEvent(record.id)}>{t('common.edit')}</DropdownMenuItem> : null}
            <DropdownMenuItem onSelect={() => onDuplicateEvent(record.id)}>{t('events.redesign.actions.duplicate')}</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onToggleEventAttention(record.id)}>{t('events.redesign.actions.attention')}</DropdownMenuItem>
            <DropdownMenuItem className="text-alert-ink focus:text-alert-ink" onSelect={() => onDeleteEvent(record.id)}>{t('common.delete')}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </article>
  )
}

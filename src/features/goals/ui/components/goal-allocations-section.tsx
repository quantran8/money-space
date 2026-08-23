import { MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Panel, PanelHeader } from '@/components/ui/panel'
import type { GoalAllocationRecord } from '@/features/goals/api/goals.repository'
import { formatAmount } from '@/features/goals/model/goals-form'

export type AllocationAssetOption = {
  value: string
  label: string
  name: string
  balance: number
  /** Seeds the share's role (wallet → contribution). */
  type?: string
}

type GoalAllocationsSectionProps = {
  allocations: GoalAllocationRecord[]
  assetOptions: AllocationAssetOption[]
  isBusy: boolean
  canAdd: boolean
  onAdd: () => void
  onEdit: (allocation: GoalAllocationRecord) => void
  onRemove: (allocationId: string) => void
}

/**
 * "Nguồn tạo tiến độ" — which assets move this goal, and how each one does it.
 *
 * This is the panel `protected_reserves` never had: a household could declare a
 * figure once and then had no screen on which to change it, so the number
 * quietly outlived the intention behind it. Every row is removable, and adding
 * goes through the same dialog flow every other create in the app uses.
 *
 * ## Why two columns rather than one list
 *
 * The two kinds of source do not answer the same question. A holding answers
 * *how much is behind this right now* — a stock of value, which the market
 * moves. A wallet answers *how much goes in each month* — a rate, which the
 * household sets. Interleaving them in one list forced a reader to check each
 * row's badge before they knew which question its number answered, and put a
 * "162,0 tr" directly above a "20,0 tr" that meant something entirely different.
 *
 * Split, each column gets a heading and a total of its own, and every figure
 * under that heading is the same kind of thing. The rows can then be quiet —
 * name, one number — because the column already said what the number means.
 *
 * A `fixed` share is capped at the asset's live value when the asset is worth
 * less than was declared. The row says so rather than silently showing the
 * smaller number — the household did nothing wrong, and the gap is the point.
 */
export function GoalAllocationsSection({
  allocations,
  assetOptions,
  isBusy,
  canAdd,
  onAdd,
  onEdit,
  onRemove,
}: GoalAllocationsSectionProps) {
  const { t } = useTranslation()

  const holdings = allocations.filter((row) => row.role !== 'contribution')
  const contributions = allocations.filter((row) => row.role === 'contribution')

  const holdingsTotal = holdings.reduce((sum, row) => sum + row.currentValue, 0)
  // A wallet with no declared rate contributes nothing to the pace; summing it
  // as zero is right, and the row itself says the rate is unset.
  const monthlyTotal = contributions.reduce((sum, row) => sum + (row.monthlyContribution ?? 0), 0)

  const nameFor = (row: GoalAllocationRecord) =>
    assetOptions.find((option) => option.value === row.assetId)?.name ?? row.assetId

  return (
    <Panel>
      <PanelHeader
        title={t('goals.allocations.title')}
        action={
          <button
            type="button"
            onClick={onAdd}
            disabled={!canAdd || isBusy}
            className="hidden min-h-11 items-center gap-1.5 text-[13px] font-medium text-accent disabled:text-ink3 sm:inline-flex"
          >
            <Plus className="size-4" strokeWidth={1.75} />
            {t('goals.allocations.addSource')}
          </button>
        }
      />

      {/* Assets behind the goal, but nothing to pay into it month to month.
          Usually because the asset that was its last wallet got deleted — the
          goal survives that now instead of blocking the delete, so this is
          where the household finds out. Shown above the columns because it
          explains why the contribution column is missing entirely. */}
      {allocations.length > 0 && contributions.length === 0 ? (
        <div className="mt-6 rounded-sunk bg-sunk px-4 py-3 text-[13px] leading-5 text-ink2">
          <p>{t('goals.allocations.noWalletTitle')}</p>
          <Button
            type="button"
            variant="secondary"
            className="mt-3 h-10 px-4 text-[13px]"
            disabled={!canAdd || isBusy}
            onClick={onAdd}
          >
            {t('goals.allocations.addWallet')}
          </Button>
        </div>
      ) : null}

      {allocations.length === 0 ? (
        // A statement with no button leaves a brand-new asset-backed goal
        // reading as 0% with nothing to do about it. The invitation belongs
        // where the household is already looking.
        <div className="mt-6 rounded-sunk bg-sunk px-4 py-10 text-center">
          <p className="text-[13px] text-ink2">{t('goals.allocations.empty')}</p>
          <Button
            type="button"
            variant="secondary"
            className="mt-4 h-10 px-4 text-[13px]"
            disabled={!canAdd || isBusy}
            onClick={onAdd}
          >
            {t('goals.allocations.addSource')}
          </Button>
        </div>
      ) : (
        <div className="mt-7 grid gap-x-14 gap-y-9 lg:grid-cols-2">
          {/* Held value. Its total is the stock of money behind the goal. */}
          {holdings.length > 0 ? (
            <SourceColumn
              label={t('goals.allocations.holdingsLabel')}
              total={formatAmount(holdingsTotal)}
              count={t('goals.allocations.sourceCount', { count: holdings.length })}
            >
              {holdings.map((row) => (
                <SourceRow
                  key={row.id}
                  name={nameFor(row)}
                  // What the household declared, in the words they declared it:
                  // a percentage stays a percentage, a whole asset says so.
                  note={
                    row.kind === 'percent'
                      ? t('goals.allocations.percentOfValue', { percent: row.percent ?? 0 })
                      : row.currentValue >= row.assetValue
                        ? t('goals.allocations.wholeAsset')
                        : t('goals.allocations.partOfAsset')
                  }
                  value={formatAmount(row.currentValue)}
                  // The declared claim outruns what the asset now holds: the row
                  // reports the real figure and says why it moved.
                  warning={
                    row.kind === 'fixed' &&
                    row.allocatedAmount !== null &&
                    row.currentValue < row.allocatedAmount
                      ? t('goals.allocations.capped')
                      : null
                  }
                  onEdit={() => onEdit(row)}
                  onRemove={() => onRemove(row.id)}
                />
              ))}
            </SourceColumn>
          ) : null}

          {/* Monthly rate. Its total is the pace, which is what drives the
              projected finish date on the chart above. */}
          {contributions.length > 0 ? (
            <SourceColumn
              label={t('goals.allocations.recurringLabel')}
              total={t('goals.allocations.perMonth', { amount: formatAmount(monthlyTotal) })}
              count={t('goals.allocations.sourceCount', { count: contributions.length })}
            >
              {contributions.map((row) => (
                <SourceRow
                  key={row.id}
                  name={nameFor(row)}
                  note={t('goals.allocations.monthlySource')}
                  value={
                    row.monthlyContribution != null && row.monthlyContribution > 0
                      ? formatAmount(row.monthlyContribution)
                      : t('goals.allocations.noMonthly')
                  }
                  // Money already sitting in the wallet for this goal counts
                  // toward progress too — it just is not part of the rate.
                  warning={null}
                  sub={
                    row.currentValue > 0
                      ? t('goals.allocations.setAside', { amount: formatAmount(row.currentValue) })
                      : null
                  }
                  onEdit={() => onEdit(row)}
                  onRemove={() => onRemove(row.id)}
                />
              ))}
            </SourceColumn>
          ) : null}
        </div>
      )}

      {/* A holding's figure moves without the household touching it. Saying so
          once, under the column it applies to, is what stops the goal's
          progress looking arbitrary. */}
      {holdings.length > 0 ? (
        <p className="mt-7 text-[11px] text-ink3">{t('goals.allocations.marketNote')}</p>
      ) : null}

      {/* Mobile has no room for a header action, so the invitation sits at the
          end of the list — where the household finishes reading it. */}
      {allocations.length > 0 ? (
        <button
          type="button"
          onClick={onAdd}
          disabled={!canAdd || isBusy}
          className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-control bg-sunk text-[13px] font-medium text-accent disabled:text-ink3 sm:hidden"
        >
          <Plus className="size-4" strokeWidth={1.75} />
          {t('goals.allocations.addSource')}
        </button>
      ) : null}
    </Panel>
  )
}

/** One kind of source: a heading, the total for that kind, and its rows. */
function SourceColumn({
  label,
  total,
  count,
  children,
}: {
  label: string
  total: string
  count: string
  children: React.ReactNode
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-4">
        <div className="min-w-0">
          <p className="label-vi">{label}</p>
          <div className="money-number mt-2 text-[22px]">{total}</div>
        </div>
        <span className="label-vi shrink-0">{count}</span>
      </div>

      <div className="mt-5 space-y-1">{children}</div>
    </div>
  )
}

/**
 * One source. Quiet by design — the column heading above already said what kind
 * of number this is, so the row only has to name the asset and state it.
 */
function SourceRow({
  name,
  note,
  value,
  sub,
  warning,
  onEdit,
  onRemove,
}: {
  name: string
  note: string
  value: string
  sub?: string | null
  warning: string | null
  onEdit: () => void
  onRemove: () => void
}) {
  const { t } = useTranslation()

  return (
    <div className="flex items-center justify-between gap-4 rounded-control px-3 py-2.5 transition-colors hover:bg-sunk">
      <div className="min-w-0">
        <div className="truncate text-[14px]">{name}</div>
        <div className="mt-0.5 truncate text-[11px] text-ink3">{note}</div>
        {warning ? (
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-attention">
            <span className="size-1.5 shrink-0 rounded-full bg-attention" />
            {warning}
          </div>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <div className="text-right">
          <div className="num text-[14px] font-medium">{value}</div>
          {sub ? <div className="num mt-0.5 text-[11px] text-ink3">{sub}</div> : null}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="size-9 shrink-0 text-ink3 hover:bg-panel"
              aria-label={t('goals.allocations.menuFor', { name })}
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {/* Without this, changing "50tr of my stocks" to 80tr meant
                removing the row and adding it back — and the add dialog hides
                already-allocated assets, so that round trip was not even
                obvious. */}
            <DropdownMenuItem onSelect={onEdit}>
              <Pencil className="size-4" /> {t('common.edit')}
            </DropdownMenuItem>
            <DropdownMenuItem className="text-alert focus:text-alert" onSelect={onRemove}>
              <Trash2 className="size-4" /> {t('goals.allocations.remove')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

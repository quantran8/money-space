import {
  Banknote,
  ChartNoAxesCombined,
  Gem,
  Landmark,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Panel, PanelHeader, TotalRow } from '@/components/ui/panel'
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
 * The rows are cards rather than table lines because the two kinds of source do
 * not answer the same question. A wallet answers *how much goes in each month*;
 * gold answers *how much is held right now*, and the market decides that figure,
 * not the household. Laying them in shared columns forced one of the two to be
 * read under the wrong heading — so each row states its own headline figure and
 * says which kind it is.
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
  const total = allocations.reduce((sum, row) => sum + row.currentValue, 0)

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
            {t('goals.allocations.add')}
          </button>
        }
      />

      <div className="mt-6 space-y-2">
        {allocations.length === 0 ? (
          // A statement with no button leaves a brand-new asset-backed goal
          // reading as 0% with nothing to do about it. The invitation belongs
          // where the household is already looking.
          <div className="rounded-sunk bg-sunk px-4 py-10 text-center">
            <p className="text-[13px] text-ink2">{t('goals.allocations.empty')}</p>
            <Button
              type="button"
              variant="secondary"
              className="mt-4 h-10 px-4 text-[13px]"
              disabled={!canAdd || isBusy}
              onClick={onAdd}
            >
              {t('goals.allocations.add')}
            </Button>
          </div>
        ) : null}

        {allocations.map((row) => (
          <AllocationRow
            key={row.id}
            row={row}
            asset={assetOptions.find((option) => option.value === row.assetId)}
            onEdit={() => onEdit(row)}
            onRemove={() => onRemove(row.id)}
          />
        ))}
      </div>

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
          {t('goals.allocations.add')}
        </button>
      ) : null}

      {/* The ACTUAL total. What scheduled outflows will leave it at is said once,
          in `GoalScheduledOutflowsSection`, not restated here. */}
      {allocations.length > 0 ? (
        <TotalRow label={t('goals.allocations.totalLabel')} value={formatAmount(total)} />
      ) : null}
    </Panel>
  )
}

function AllocationRow({
  row,
  asset,
  onEdit,
  onRemove,
}: {
  row: GoalAllocationRecord
  asset: AllocationAssetOption | undefined
  onEdit: () => void
  onRemove: () => void
}) {
  const { t } = useTranslation()
  const isContribution = row.role === 'contribution'
  const name = asset?.name ?? row.assetId
  // The declared claim outruns what the asset now holds: the row reports the
  // real figure and says why it moved.
  const capped =
    row.kind === 'fixed' && row.allocatedAmount !== null && row.currentValue < row.allocatedAmount
  const monthly = row.monthlyContribution ?? null

  return (
    <article className="rounded-sunk bg-sunk p-4 sm:p-5">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-control bg-panel text-ink2">
            <AssetIcon type={asset?.type} role={row.role} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h3 className="truncate text-[14px] font-medium">{name}</h3>
              <span className="rounded-full bg-panel px-2 py-1 text-[10px] text-ink2">
                {isContribution
                  ? t('goals.allocations.badgeContribution')
                  : t('goals.allocations.badgeHolding')}
              </span>
            </div>
            <p className="num mt-1 text-[11px] text-ink3">
              {isContribution
                ? t('goals.allocations.assetHolding', { value: formatAmount(row.assetValue) })
                : t('goals.allocations.assetCurrentValue', {
                    value: formatAmount(row.assetValue),
                  })}
            </p>
          </div>
        </div>

        <div className="flex items-start justify-between gap-5 sm:justify-end">
          <div className="text-left sm:text-right">
            {/* A wallet's headline figure is its monthly pace; a holding's is
                what it is worth to the goal today. Same slot, different
                question — so the label says which one is being answered. */}
            <p className="text-[11px] text-ink3">
              {isContribution
                ? t('goals.allocations.monthlyLabelShort')
                : t('goals.allocations.countedLabelShort')}
            </p>
            <p className="money-number mt-1 text-[16px]">
              {isContribution
                ? monthly != null && monthly > 0
                  ? formatAmount(monthly)
                  : t('goals.allocations.noMonthly')
                : formatAmount(row.currentValue)}
            </p>
            <p className="num mt-1 text-[11px] text-ink3">
              {isContribution
                ? t('goals.allocations.setAside', { amount: formatAmount(row.currentValue) })
                : row.kind === 'percent'
                  ? t('goals.allocations.percentOfValue', { percent: row.percent ?? 0 })
                  : formatAmount(row.allocatedAmount ?? 0)}
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="size-9 shrink-0 hover:bg-panel"
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

      {capped ? (
        <p className="mt-3 flex items-center gap-2 pl-12 text-[11px] text-attention">
          <span className="size-1.5 shrink-0 rounded-full bg-attention" />
          {t('goals.allocations.capped')}
        </p>
      ) : null}

      {/* A holding's figure moves without the household touching it. Saying so
          on the row is what stops the goal's progress looking arbitrary. */}
      {!isContribution ? (
        <p className="mt-3 pl-12 text-[11px] text-ink3">{t('goals.allocations.marketNote')}</p>
      ) : null}
    </article>
  )
}

/** The asset's own kind, falling back to what its role in the goal implies. */
const ICON_BY_ASSET_TYPE: Record<string, LucideIcon> = {
  cash: Banknote,
  bank_account: Landmark,
  saving_deposit: Landmark,
  certificate_of_deposit: Landmark,
  gold: Gem,
  stock: ChartNoAxesCombined,
  fund: ChartNoAxesCombined,
  bond: ChartNoAxesCombined,
  crypto: ChartNoAxesCombined,
  investment: ChartNoAxesCombined,
}

function AssetIcon({ type, role }: { type: string | undefined; role: string }) {
  const Icon =
    (type ? ICON_BY_ASSET_TYPE[type] : undefined) ?? (role === 'contribution' ? Wallet : Gem)
  return <Icon className="size-4" strokeWidth={1.75} />
}

import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
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
 * Which assets count towards an asset-backed goal, and by how much (§11.1).
 *
 * This is the panel `protected_reserves` never had: a household could declare a
 * figure once and then had no screen on which to change it, so the number
 * quietly outlived the intention behind it. Every row is removable, and adding
 * goes through the same dialog flow every other create in the app uses.
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
            className="text-[13px] font-medium text-accent disabled:text-ink3"
          >
            {t('goals.allocations.add')}
          </button>
        }
      />

      {/* Column header (§11.3) — desktop only; the mobile rows stack instead. */}
      {allocations.length > 0 ? (
        <div className="mt-7 hidden grid-cols-[1.4fr_1fr_.9fr_56px] px-3 lg:grid">
          <p className="label">{t('goals.allocations.columns.asset')}</p>
          <p className="label">{t('goals.allocations.columns.share')}</p>
          <p className="label text-right">{t('goals.allocations.columns.counted')}</p>
          <span />
        </div>
      ) : null}

      <div className="mt-2 space-y-1">
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

        {allocations.map((row) => {
          const asset = assetOptions.find((option) => option.value === row.assetId)
          // The declared claim outruns what the asset now holds: the row reports
          // the real figure and says why it moved.
          const capped =
            row.kind === 'fixed' &&
            row.allocatedAmount !== null &&
            row.currentValue < row.allocatedAmount

          return (
            <article
              key={row.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 rounded-control px-3 py-3 transition-colors hover:bg-sunk lg:grid-cols-[1.4fr_1fr_.9fr_56px] lg:items-center"
            >
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium">
                  {asset?.name ?? row.assetId}
                </p>
                <p className="mt-1 text-[11px] text-ink3">{formatAmount(row.assetValue)}</p>
              </div>

              <p className="num mt-2 text-[12px] lg:mt-0">
                {row.kind === 'percent'
                  ? `${row.percent}%`
                  : formatAmount(row.allocatedAmount ?? 0)}
              </p>

              <div className="col-start-2 row-start-1 text-right lg:col-auto lg:row-auto">
                <p className="num text-[14px] font-medium">{formatAmount(row.currentValue)}</p>
                {capped ? (
                  <p className="mt-1 text-[11px] text-attention">
                    {t('goals.allocations.capped')}
                  </p>
                ) : null}
              </div>

              <div className="col-start-2 row-start-2 flex items-start justify-end lg:col-auto lg:row-auto">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8"
                      aria-label={t('common.actions')}
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {/* Without this, changing "50tr of my stocks" to 80tr meant
                        removing the row and adding it back — and the add dialog
                        hides already-allocated assets, so that round trip was
                        not even obvious. */}
                    <DropdownMenuItem onSelect={() => onEdit(row)}>
                      <Pencil className="size-4" /> {t('common.edit')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-alert focus:text-alert"
                      onSelect={() => onRemove(row.id)}
                    >
                      <Trash2 className="size-4" /> {t('goals.allocations.remove')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </article>
          )
        })}
      </div>

      {allocations.length > 0 ? (
        <TotalRow label={t('goals.allocations.totalLabel')} value={formatAmount(total)} />
      ) : null}
    </Panel>
  )
}

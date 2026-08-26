import { MoreHorizontal, Pencil, Trash2, HandCoins } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AssetTypeIcon } from '@/features/assets/ui/components/asset-type-icon'
import {
  computeCurrentValue,
  isSellableAssetType,
  type Asset,
} from '@money-space/core/features/assets/model/assets'
import { formatVndCell } from '@money-space/core/shared/lib/format-money'
import { cn } from '@money-space/core/shared/lib/utils'

type AssetSourceRowProps = {
  asset: Asset
  asOf: string
  holderLabel: string
  holderInitials: string
  onOpen?: (assetId: string) => void
  onEdit: (assetId: string) => void
  onSell?: (assetId: string) => void
  onDelete: (assetId: string) => void
}

/**
 * One money source, inside its liquidity group.
 *
 * This replaces a six-column table row. The table gave `owner`, `role` and
 * `updated` a full column each, which set the page's minimum width to 840px and
 * made every narrow screen scroll sideways — while `role` repeated the heading
 * of the card the row now sits in. What is left is the three things that differ
 * between two rows of the same group: what it is (icon), who holds it, and how
 * stale the figure is.
 */
export function AssetSourceRow({
  asset,
  asOf,
  holderLabel,
  holderInitials,
  onOpen,
  onEdit,
  onSell,
  onDelete,
}: AssetSourceRowProps) {
  const { t } = useTranslation()
  const value = computeCurrentValue(asset, asOf)
  const isSold = asset.status === 'sold'
  const canSell = !isSold && isSellableAssetType(asset.type)
  const freshness = formatFreshness(asset.valueUpdatedAt, t)

  return (
    <div className="group grid grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-x-3 rounded-control py-3 transition hover:bg-wash sm:px-2">
      <div
        className="grid size-8 place-items-center text-ink2"
        role="img"
        aria-label={t(`options.assetType.${asset.type}`)}
      >
        <AssetTypeIcon type={asset.type} className="size-5" />
      </div>

      <button
        type="button"
        onClick={() => onOpen?.(asset.id)}
        className="min-w-0 max-w-full rounded-control text-left outline-none focus-visible:ring-2 focus-visible:ring-action"
      >
        <span className="block truncate t-body-sm font-medium">{asset.name}</span>
        <span className="mt-1 flex items-center gap-2">
          <span
            className="grid size-6 shrink-0 place-items-center rounded-full bg-wash t-caption-sm font-medium text-ink2"
            aria-label={t('assets.demo.heldBy', { name: holderLabel })}
          >
            {holderInitials}
          </span>
          <span className={cn('truncate t-caption', freshness.stale ? 'text-attention' : 'text-ink3')}>
            {freshness.label}
          </span>
        </span>
      </button>

      <div className="flex items-center gap-1">
        <span
          className={cn(
            'num whitespace-nowrap t-body-sm font-medium',
            isSold && 'text-ink3 line-through',
          )}
        >
          {value === null ? t('assets.list.priceUnavailable') : formatVndCell(value)}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="s-tap size-8 text-ink3"
              aria-label={t('assets.demo.optionsFor', { name: asset.name })}
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => onEdit(asset.id)}>
              <Pencil className="size-4" />
              {t('common.edit')}
            </DropdownMenuItem>
            {canSell && onSell ? (
              <DropdownMenuItem onSelect={() => onSell(asset.id)}>
                <HandCoins className="size-4" />
                {t('assets.sale.action')}
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem
              className="text-alert focus:text-alert"
              onSelect={() => onDelete(asset.id)}
            >
              <Trash2 className="size-4" />
              {t('common.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

function formatFreshness(
  value: string | undefined,
  t: (key: string, params?: Record<string, unknown>) => string,
) {
  if (!value) return { label: t('time.never'), stale: true }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return { label: t('time.never'), stale: true }
  const days = Math.max(0, Math.floor((Date.now() - date.getTime()) / 86_400_000))
  if (days === 0) return { label: t('time.today'), stale: false }
  return { label: t('time.daysAgo', { count: days }), stale: days > 30 }
}

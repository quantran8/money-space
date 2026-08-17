import { HandCoins, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { computeCurrentValue, isSellableAssetType, type Asset } from '@/features/assets/model/assets'
import type { MemberItem } from '@/features/members/model/members.types'
import { formatVndCell } from '@/shared/lib/format-money'
import { cn } from '@/shared/lib/utils'

type AssetListProps = {
  assets: Asset[]
  members: MemberItem[]
  asOf: string
  onOpen?: (assetId: string) => void
  onEdit: (assetId: string) => void
  onSell?: (assetId: string) => void
  onDelete: (assetId: string) => void
}

export function AssetList({
  assets,
  members,
  asOf,
  onOpen,
  onEdit,
  onSell,
  onDelete,
}: AssetListProps) {
  const { t } = useTranslation()
  const memberNameById = new Map(members.map((member) => [member.id, member.name]))

  return (
    <div className="mt-7">
      <div className="hidden grid-cols-[1.5fr_.8fr_.8fr_1fr_.8fr_110px] px-3 lg:grid">
        <p className="label">{t('assets.demo.columns.source')}</p>
        <p className="label">{t('assets.demo.columns.owner')}</p>
        <p className="label">{t('assets.demo.columns.role')}</p>
        <p className="label">{t('assets.demo.columns.updated')}</p>
        <p className="label text-right">{t('assets.demo.columns.balance')}</p>
        <span />
      </div>

      <div className="mt-2 space-y-1">
        {assets.map((asset) => {
          const value = computeCurrentValue(asset, asOf)
          const isSold = asset.status === 'sold'
          const canSell = !isSold && isSellableAssetType(asset.type)
          const freshness = formatFreshness(asset.valueUpdatedAt, t)

          return (
            <article
              key={asset.id}
              role="button"
              tabIndex={0}
              onClick={() => onOpen?.(asset.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onOpen?.(asset.id)
                }
              }}
              className="grid cursor-pointer grid-cols-[minmax(0,1fr)_auto] gap-x-4 rounded-control px-3 py-3 transition-colors hover:bg-sunk lg:grid-cols-[1.5fr_.8fr_.8fr_1fr_.8fr_110px] lg:items-center"
            >
              <div className="min-w-0 text-left">
                <p className="truncate text-[13px] font-medium">{asset.name}</p>
                <p className="mt-1 text-[11px] text-ink3">{t(`options.assetType.${asset.type}`)}</p>
              </div>

              <p className="mt-2 text-[12px] text-ink2 lg:mt-0">
                {asset.holderMemberId
                  ? memberNameById.get(asset.holderMemberId) ?? t('assets.demo.householdOwner')
                  : t('assets.demo.householdOwner')}
              </p>
              <p className="mt-1 text-[12px] lg:mt-0">{t(`options.liquidity.${asset.liquidity}`)}</p>
              <p className={cn('mt-1 text-[12px] lg:mt-0', freshness.stale ? 'text-attention' : 'text-ink2')}>
                {freshness.label}
              </p>
              <p className={cn('num col-start-2 row-start-1 text-right text-[14px] font-medium lg:col-auto lg:row-auto', isSold && 'text-ink3 line-through')}>
                {value === null ? t('assets.list.priceUnavailable') : formatVndCell(value)}
              </p>

              <div
                className="col-start-2 row-start-2 row-span-4 flex items-start justify-end gap-1 lg:col-auto lg:row-auto"
                onClick={(event) => event.stopPropagation()}
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-8" aria-label={t('common.actions')}>
                      <MoreVertical className="size-4" />
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
                    <DropdownMenuItem className="text-alert focus:text-alert" onSelect={() => onDelete(asset.id)}>
                      <Trash2 className="size-4" />
                      {t('common.delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </article>
          )
        })}
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

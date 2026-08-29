import { HandCoins, MoreVertical, Pencil, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { computeCurrentValue, isSellableAssetType, type Asset } from '@money-space/core/features/assets/model/assets'
import type { MemberItem } from '@money-space/core/features/members/model/members.types'
import { formatVndCell } from '@money-space/core/shared/lib/format-money'
import { cn } from '@money-space/core/shared/lib/utils'

type AssetListProps = {
  assets: Asset[]
  members: MemberItem[]
  asOf: string
  onOpen?: (assetId: string) => void
  onEdit: (assetId: string) => void
  onSell?: (assetId: string) => void
  /** Buy more of a held position — re-averages its cost basis. */
  onBuyMore?: (assetId: string) => void
  onDelete: (assetId: string) => void
}

export function AssetList({
  assets,
  members,
  asOf,
  onOpen,
  onEdit,
  onSell,
  onBuyMore,
  onDelete,
}: AssetListProps) {
  const { t } = useTranslation()
  const memberNameById = new Map(members.map((member) => [member.id, member.name]))

  return (
    // A real table: the header and every row share ONE set of column widths.
    // These used to be two independent `grid-cols-[…]` declarations that had to
    // be kept in step by hand, and they had already drifted — the header carried
    // none of the row's `gap-x-4`, so every heading sat a little left of the
    // column it named. `min-w` makes the container SCROLL on a narrow screen
    // rather than squeezing six columns to an unreadable width.
    <Table className="mt-7 min-w-[840px]">
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          {/* `.label-vi`, not `TableHead`'s default `.label`: these headings are
              accented Vietnamese, and mono renders diacritics poorly (§10.1). */}
          <TableHead className="label-vi">{t('assets.demo.columns.source')}</TableHead>
          <TableHead className="label-vi">{t('assets.demo.columns.owner')}</TableHead>
          <TableHead className="label-vi">{t('assets.demo.columns.role')}</TableHead>
          <TableHead className="label-vi">{t('assets.demo.columns.updated')}</TableHead>
          <TableHead className="label-vi text-right">
            {t('assets.demo.columns.balance')}
          </TableHead>
          <TableHead className="w-14" />
        </TableRow>
      </TableHeader>

      <TableBody>
        {assets.map((asset) => {
          const value = computeCurrentValue(asset, asOf)
          const isSold = asset.status === 'sold'
          const canSell = !isSold && isSellableAssetType(asset.type)
          // Buying more re-averages a cost basis, so it needs a position to
          // average INTO — a balance asset has none.
          const canBuyMore = !isSold && !!asset.marketPosition
          const freshness = formatFreshness(asset.valueUpdatedAt, t)

          return (
            <TableRow
              key={asset.id}
              className="cursor-pointer"
              onClick={() => onOpen?.(asset.id)}
            >
              <TableCell>
                {/* The row's keyboard equivalent. A `<tr>` cannot be focused or
                    announced as a control, so the click handler alone would
                    leave keyboard and screen-reader users with no way in. The
                    asset TYPE moves under the name here rather than taking a
                    column of its own — it qualifies the name, and reads as part
                    of it. */}
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    onOpen?.(asset.id)
                  }}
                  className="min-w-0 max-w-full rounded-control text-left outline-none focus-visible:ring-2 focus-visible:ring-action"
                >
                  <span className="block truncate t-body-sm font-medium">{asset.name}</span>
                  <span className="mt-1 block truncate t-caption-sm text-ink3">
                    {t(`options.assetType.${asset.type}`)}
                  </span>
                </button>
              </TableCell>

              <TableCell className="t-caption text-ink2">
                {(asset.holderMemberId ? memberNameById.get(asset.holderMemberId) : undefined) ??
                  t('assets.demo.householdOwner')}
              </TableCell>
              <TableCell className="t-caption">
                {t(`options.liquidity.${asset.liquidity}`)}
              </TableCell>
              <TableCell
                className={cn('t-caption', freshness.stale ? 'text-attention-ink' : 'text-ink2')}
              >
                {freshness.label}
              </TableCell>
              <TableCell
                className={cn(
                  'num text-right t-body-sm font-medium',
                  isSold && 'text-ink3 line-through',
                )}
              >
                {value === null ? t('assets.list.priceUnavailable') : formatVndCell(value)}
              </TableCell>

              <TableCell className="w-14 text-right">
                {/* Stops the row's own navigation: opening the menu is not a
                    request to leave the page. */}
                <div onClick={(event) => event.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="s-tap size-8"
                        aria-label={t('common.actions')}
                      >
                        <MoreVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => onEdit(asset.id)}>
                        <Pencil className="size-4" />
                        {t('common.edit')}
                      </DropdownMenuItem>
                      {canBuyMore && onBuyMore ? (
                        <DropdownMenuItem onSelect={() => onBuyMore(asset.id)}>
                          <Plus className="size-4" />
                          {t('assets.purchase.title')}
                        </DropdownMenuItem>
                      ) : null}
                      {canSell && onSell ? (
                        <DropdownMenuItem onSelect={() => onSell(asset.id)}>
                          <HandCoins className="size-4" />
                          {t('assets.sale.action')}
                        </DropdownMenuItem>
                      ) : null}
                      <DropdownMenuItem
                        className="text-alert-ink focus:text-alert-ink"
                        onSelect={() => onDelete(asset.id)}
                      >
                        <Trash2 className="size-4" />
                        {t('common.delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
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

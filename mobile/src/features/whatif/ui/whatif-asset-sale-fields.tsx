import { Pressable, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import type { useWhatIfAssetSale } from '@money-space/core/features/whatif/hooks/use-whatif-asset-sale'
import { formatVndExact, formatVndShort } from '@money-space/core/shared/lib/format-money'

import { Button, DecimalInput, MoneyInput, Select, Sunk } from '@/components/ui'
import { TOUCH_TARGET } from '@/theme/tokens'

/** One holding being sold: which asset, and how much of it. */
function SaleLine({
  line,
  index,
  assetOptions,
  onRemove,
  onAssetChange,
  onQuantityChange,
  onAmountChange,
}: {
  line: ReturnType<typeof useWhatIfAssetSale>['lines'][number]
  index: number
  assetOptions: { value: string; label: string; group: string }[]
  onRemove?: () => void
  onAssetChange: (assetId: string) => void
  onQuantityChange: (quantity: string) => void
  onAmountChange: (amount: string) => void
}) {
  const { t } = useTranslation()
  const { draft, option, errors, remainingAfterSale } = line

  return (
    <View className="gap-4 rounded-control border border-divider p-3">
      {/* The line's own header: what it is, and the one action that applies to
          it. Only from the second line down — removing the only line would
          leave a funding step that funds nothing. */}
      {onRemove ? (
        <View className="flex-row items-center justify-between gap-3">
          <Text className="t-caption font-medium text-ink3">
            {t('whatif.assetSale.lineLabel', { index: index + 1 })}
          </Text>
          <Pressable
            onPress={onRemove}
            accessibilityRole="button"
            accessibilityLabel={t('whatif.assetSale.removeLine', { index: index + 1 })}
            // §9: 44pt minimum applies to every action. The visible circle is
            // smaller; the target around it is not.
            style={{ minHeight: TOUCH_TARGET, minWidth: TOUCH_TARGET }}
            className="items-end justify-center active:opacity-80"
          >
            {/* `alert` is the FILL token; the glyph on it takes `alert-ink`. */}
            <View className="size-6 items-center justify-center rounded-full bg-alert">
              <Text className="t-caption text-alert-ink">−</Text>
            </View>
          </Pressable>
        </View>
      ) : null}

      <Select
        label={t('whatif.assetSale.asset')}
        value={draft.assetId || null}
        options={assetOptions}
        onChange={onAssetChange}
        placeholder={t('whatif.assetSale.assetPlaceholder')}
        error={errors.assetId}
      />

      {/* A market asset is sold in ITS OWN UNIT — you cannot sell 86,4tr of
          gold, you sell 6 chỉ. Pre-filled with enough to cover the shortfall. */}
      {option?.isMarket ? (
        <DecimalInput
          label={t('whatif.assetSale.quantity')}
          value={draft.quantity}
          onChange={onQuantityChange}
          error={errors.quantity}
          suffix={option.unit}
        />
      ) : (
        <MoneyInput
          label={t('whatif.assetSale.amount')}
          value={draft.amount}
          onChange={onAmountChange}
          error={errors.amount}
        />
      )}

      {option ? (
        <View className="gap-1">
          {option.isMarket ? (
            <>
              <Text className="t-caption-sm text-ink3">
                {t('whatif.assetSale.holdingQuantity', {
                  quantity: option.heldQuantity,
                  unit: option.unit,
                })}
              </Text>
              {line.proceeds > 0 && !errors.quantity ? (
                <Text className="t-caption-sm text-ink2">
                  {t('whatif.assetSale.proceeds', {
                    amount: formatVndShort(line.proceeds),
                  })}
                </Text>
              ) : null}
            </>
          ) : (
            <Text className="t-caption-sm text-ink3">
              {t('whatif.assetSale.holdingValue', {
                value: formatVndShort(option.currentValue),
              })}
            </Text>
          )}
          {/* What the goals hold of this asset, BEFORE committing — so the goal
              cost is chosen knowingly rather than discovered afterwards. */}
          {option.goalClaimedAmount > 0 ? (
            <Text className="t-caption-sm text-ink2">
              {t('whatif.assetSale.goalClaimed', {
                amount: formatVndShort(option.goalClaimedAmount),
              })}
            </Text>
          ) : null}
        </View>
      ) : null}

      {option && remainingAfterSale !== null && !errors.amount && !errors.quantity ? (
        <Sunk>
          <Text className="t-body-sm leading-5">
            {t('whatif.assetSale.preview', {
              name: option.label,
              // Exact: the line reads "X → Y · +Z" where Z is X − Y, so the
              // three must reconcile. Compact printed the same figure on both
              // sides of the arrow for any sale under the rounding step.
              before: formatVndExact(option.currentValue),
              after: formatVndExact(remainingAfterSale),
              amount: formatVndExact(option.currentValue - remainingAfterSale),
            })}
          </Text>
        </Sunk>
      ) : null}
    </View>
  )
}

/**
 * The optional funding step: which assets to sell, and how much of each.
 *
 * **Not the wallet picker what-if bans.** That ban is about which account the
 * SPEND comes out of — routing the engine does better from the household's own
 * goal ranking, and which is unchanged here. This asks what to convert INTO
 * usable money, which the engine cannot answer: gold vs stocks is a preference,
 * not a derivable fact. Optional, second, and only offered after a shortfall.
 *
 * Several lines, one shared destination: no single holding need cover the gap,
 * and a household selling two things for one purchase banks the cash together.
 * Nothing here is ever recorded.
 */
export function WhatIfAssetSaleFields({
  sale,
  shortfall,
}: {
  sale: ReturnType<typeof useWhatIfAssetSale>
  /** The gap these fields were opened to close. 0 hides the lead line. */
  shortfall: number
}) {
  const { t } = useTranslation()
  const { options, walletOptions, lines, errors } = sale

  if (options.length === 0) {
    return (
      <Text className="t-body-sm leading-5 text-ink2">
        {t('whatif.assetSale.empty')}
      </Text>
    )
  }

  const assetOptions = options.map((option) => ({
    value: option.value,
    label: t('whatif.assetSale.optionValue', {
      name: option.label,
      value: formatVndShort(option.currentValue),
    }),
    group: option.group,
  }))
  const covered = sale.proceeds >= shortfall

  return (
    <View className="gap-4">
      {/* The step now opens straight off `Xem thử`, so it has to say WHY it is
          on screen — otherwise the household lands on a pre-filled quantity
          with no statement of the gap it was filled to cover. */}
      {shortfall > 0 ? (
        <Text className="t-body-sm leading-5 text-alert-ink">
          {t('whatif.shortfall.lead', { amount: formatVndShort(shortfall) })}
        </Text>
      ) : null}

      {lines.map((line, index) => (
        <SaleLine
          key={line.draft.key}
          line={line}
          index={index}
          assetOptions={assetOptions}
          onRemove={lines.length > 1 ? () => sale.removeLine(line.draft.key) : undefined}
          onAssetChange={(assetId) => sale.setLineAssetId(line.draft.key, assetId)}
          onQuantityChange={(quantity) => sale.setLineQuantity(line.draft.key, quantity)}
          onAmountChange={(amount) => sale.setLineAmount(line.draft.key, amount)}
        />
      ))}

      {/* One holding is often not enough — 300tr of gold and 250tr of stocks
          against a 500tr gap. Offered, never pre-added. */}
      {sale.canAddLine ? (
        <Button variant="secondary" onPress={sale.addLine}>
          {t('whatif.assetSale.addLine')}
        </Button>
      ) : null}

      {/* Which account the money lands in — a real sale names one, and it
          decides which goals the cash is sitting in front of. Shared by every
          line: two sales for one purchase are banked together. */}
      <Select
        label={t('whatif.assetSale.wallet')}
        value={sale.draft.toAssetId || null}
        options={walletOptions.map((wallet) => ({
          value: wallet.value,
          label: t('whatif.assetSale.walletOption', {
            name: wallet.label,
            balance: formatVndShort(wallet.balance),
          }),
        }))}
        onChange={sale.setToAssetId}
        placeholder={t('whatif.assetSale.walletPlaceholder')}
        error={errors.toAssetId}
      />

      {/* Says the number was filled in for them and is theirs to change. */}
      {sale.proceeds > 0 ? (
        <View className="gap-1">
          <Text className="t-caption-sm text-ink3">
            {t('whatif.assetSale.estimated')}
          </Text>
          <Text className="t-body-sm leading-5 text-ink2">
            {t(
              covered
                ? 'whatif.assetSale.coversShortfall'
                : 'whatif.assetSale.stillShort',
              { amount: formatVndShort(Math.max(0, shortfall - sale.proceeds)) },
            )}
          </Text>
        </View>
      ) : null}

      <Text className="t-caption-sm text-ink3">{t('whatif.assetSale.noFee')}</Text>
    </View>
  )
}

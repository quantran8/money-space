import { Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import type { useWhatIfAssetSale } from '@money-space/core/features/whatif/hooks/use-whatif-asset-sale'
import { formatVndShort } from '@money-space/core/shared/lib/format-money'

import { DecimalInput, MoneyInput, Select, Sunk } from '@/components/ui'

/**
 * The optional funding step: which asset to sell, and how much of it.
 *
 * **Not the wallet picker what-if bans.** That ban is about which account the
 * SPEND comes out of — routing the engine does better from the household's own
 * goal ranking, and which is unchanged here. This asks what to convert INTO
 * usable money, which the engine cannot answer: gold vs stocks is a preference,
 * not a derivable fact. Optional, second, and only offered after a shortfall.
 *
 * Value only, never quantity — goal progress is a function of value, and the
 * household thinks "bán 300tr chứng khoán". Nothing here is ever recorded.
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
  const { options, walletOptions, selected, draft, errors, remainingAfterSale } = sale

  if (options.length === 0) {
    return (
      <Text className="t-body-sm leading-5 text-ink2">
        {t('whatif.assetSale.empty')}
      </Text>
    )
  }

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

      <Select
        label={t('whatif.assetSale.asset')}
        value={draft.assetId || null}
        options={options.map((option) => ({
          value: option.value,
          label: t('whatif.assetSale.optionValue', {
            name: option.label,
            value: formatVndShort(option.currentValue),
          }),
          group: option.group,
        }))}
        onChange={sale.setAssetId}
        placeholder={t('whatif.assetSale.assetPlaceholder')}
        error={errors.assetId}
      />

      {/* A market asset is sold in ITS OWN UNIT — you cannot sell 86,4tr of
          gold, you sell 6 chỉ. Pre-filled with enough to cover the shortfall. */}
      {selected?.isMarket ? (
        <DecimalInput
          label={t('whatif.assetSale.quantity')}
          value={draft.quantity}
          onChange={sale.setQuantity}
          error={errors.quantity}
          suffix={selected.unit}
        />
      ) : (
        <MoneyInput
          label={t('whatif.assetSale.amount')}
          value={draft.amount}
          onChange={sale.setAmount}
          error={errors.amount}
        />
      )}

      {/* Which account the money lands in — a real sale names one, and it
          decides which goals the cash is sitting in front of. */}
      <Select
        label={t('whatif.assetSale.wallet')}
        value={draft.toAssetId || null}
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

      {selected ? (
        <View className="gap-1">
          {selected.isMarket ? (
            <>
              <Text className="t-caption-sm text-ink3">
                {t('whatif.assetSale.holdingQuantity', {
                  quantity: selected.heldQuantity,
                  unit: selected.unit,
                })}
              </Text>
              {sale.proceeds > 0 && !errors.quantity ? (
                <Text className="t-caption-sm text-ink2">
                  {t('whatif.assetSale.proceeds', {
                    amount: formatVndShort(sale.proceeds),
                  })}
                </Text>
              ) : null}
            </>
          ) : (
            <Text className="t-caption-sm text-ink3">
              {t('whatif.assetSale.holdingValue', {
                value: formatVndShort(selected.currentValue),
              })}
            </Text>
          )}
          {/* What the goals hold of this asset, BEFORE committing — so the goal
              cost is chosen knowingly rather than discovered afterwards. */}
          {selected.goalClaimedAmount > 0 ? (
            <Text className="t-caption-sm text-ink2">
              {t('whatif.assetSale.goalClaimed', {
                amount: formatVndShort(selected.goalClaimedAmount),
              })}
            </Text>
          ) : null}
        </View>
      ) : null}

      {/* Says the number was filled in for them and is theirs to change. */}
      {selected && sale.proceeds > 0 && !errors.quantity && !errors.amount ? (
        <Text className="t-caption-sm text-ink3">{t('whatif.assetSale.estimated')}</Text>
      ) : null}

      {selected && remainingAfterSale !== null && !errors.amount && !errors.quantity ? (
        <Sunk>
          <Text className="t-body-sm leading-5">
            {t('whatif.assetSale.preview', {
              name: selected.label,
              before: formatVndShort(selected.currentValue),
              after: formatVndShort(remainingAfterSale),
              amount: formatVndShort(selected.currentValue - remainingAfterSale),
            })}
          </Text>
        </Sunk>
      ) : null}

      <Text className="t-caption-sm text-ink3">{t('whatif.assetSale.noFee')}</Text>
    </View>
  )
}

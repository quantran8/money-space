import { useMemo, useState } from 'react'
import { Text, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'

import {
  useAssetDetail,
  type AssetEventEntry,
} from '@money-space/core/features/assets/hooks/use-asset-detail'
import { useAssetsPage } from '@money-space/core/features/assets/hooks/use-assets-page'
import {
  canUpdatePriceManually,
  isSellableAssetType,
} from '@money-space/core/features/assets/model/assets'
import { AS_OF } from '@money-space/core/features/assets/model/assets-form'
import { formatDate } from '@money-space/core/features/debts/model/debts-form'
import { useMembers } from '@money-space/core/features/members/hooks/use-members'
import { formatVndShort } from '@money-space/core/shared/lib/format-money'

import {
  ActionSheet,
  BackLink,
  EmptyState,
  GroupedRow,
  Label,
  Money,
  Panel,
  PanelHeader,
  RowMeta,
  RowMetaMono,
  Screen,
  Sections,
  Segmented,
  Skeleton,
  StatusChip,
  SummaryStrip,
} from '@/components/ui'
import { AssetFormSheet } from '@/features/assets/components/asset-form-sheet'
import { AssetGoalUsage } from '@/features/assets/components/asset-goal-usage'
import { AssetPriceUpdateSheet } from '@/features/assets/components/asset-price-update-sheet'
import { AssetSaleSheet } from '@/features/assets/components/asset-sale-sheet'
import { AssetValueChart } from '@/features/assets/components/asset-value-chart'
import { SavingWithdrawalPanel } from '@/features/assets/components/saving-withdrawal-panel'

/**
 * Months of history the chart shows. A string union because `Segmented` keys
 * options by value, and it doubles as the `inRange*` translation-key suffix.
 */
type ChartRange = '1' | '6' | '12'

/** Past this many the markers collide and the line stops being readable. */
const MAX_CHART_MARKERS = 4

/**
 * One asset: what it is worth, how it got there, and what it is promised to.
 *
 * A separate route from the list on purpose — an asset is a thing in its own
 * right once you open it, and a deep link has to be able to land here.
 */
export default function AssetDetailScreen() {
  const { assetId } = useLocalSearchParams<{ assetId: string }>()
  const router = useRouter()
  const { t } = useTranslation()

  const [priceSheetOpen, setPriceSheetOpen] = useState(false)
  const [chartRange, setChartRange] = useState<ChartRange>('1')

  const { asset, currentValue, relatedEvents, valueHistory, isLoading } = useAssetDetail(assetId)
  const { members } = useMembers()
  const {
    asOf,
    total: householdAssetTotal,
    form,
    setValue,
    mode,
    walletOptions,
    isEditing,
    editingAsset,
    isSubmitting,
    submit,
    formOpen,
    openEdit,
    handleFormOpenChange,
    openSale,
    sale,
  } = useAssetsPage()

  const filteredHistory = useMemo(() => {
    if (valueHistory.length === 0) return []
    const latest = new Date(valueHistory[valueHistory.length - 1].isoDate)
    const threshold = new Date(latest)
    threshold.setMonth(threshold.getMonth() - Number(chartRange))
    return valueHistory.filter((point) => new Date(point.isoDate) >= threshold)
  }, [chartRange, valueHistory])

  /**
   * How much the total moved across the visible range, first point to last.
   * Deliberately the WHOLE move — price and quantity together — because that is
   * what the line draws. The markers below are what separate the two causes.
   */
  const { rangeDelta, rangeDeltaPercent } = useMemo(() => {
    if (filteredHistory.length < 2) return { rangeDelta: 0, rangeDeltaPercent: null }
    const first = filteredHistory[0].value
    const last = filteredHistory[filteredHistory.length - 1].value
    return {
      rangeDelta: last - first,
      // A range starting at zero has no percentage to give — a new asset going
      // 0 → 50tr is not "+∞%", it is simply new.
      rangeDeltaPercent: first > 0 ? ((last - first) / first) * 100 : null,
    }
  }, [filteredHistory])

  /**
   * Holding changes inside the range, from the money events that caused them.
   * Without these the line is ambiguous: a step up reads as the market moving
   * when it may have been a purchase.
   */
  const chartMarkers = useMemo(() => {
    if (filteredHistory.length === 0) return []
    const from = filteredHistory[0].isoDate
    const to = filteredHistory[filteredHistory.length - 1].isoDate
    const inRange = relatedEvents.filter((entry) => entry.isoDate >= from && entry.isoDate <= to)
    // Keep the LARGEST moves, not the most recent: taking the tail would strip
    // every marker off the left half of a busy chart.
    const kept =
      inRange.length <= MAX_CHART_MARKERS
        ? inRange
        : [...inRange]
            .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
            .slice(0, MAX_CHART_MARKERS)
    return kept
      .slice()
      .sort((a, b) => (a.isoDate < b.isoDate ? -1 : a.isoDate > b.isoDate ? 1 : 0))
      .map((entry) => ({
        isoDate: entry.isoDate,
        label: `${entry.amount >= 0 ? '+' : '−'}${formatVndShort(Math.abs(entry.amount))}`,
      }))
  }, [filteredHistory, relatedEvents])

  if (isLoading && !asset) {
    return (
      <Screen withoutTabBar>
        <BackLink label={t('assets.detail.back')} onPress={() => router.back()} />
        <View className="mt-4 gap-3">
          <Skeleton height={28} />
          <Skeleton height={180} />
        </View>
      </Screen>
    )
  }

  if (!asset) {
    return (
      <Screen withoutTabBar>
        <BackLink label={t('assets.detail.back')} onPress={() => router.back()} />
        <Panel className="mt-4">
          <Text className="text-[16px] font-medium text-ink">
            {t('assets.detail.notFound.title')}
          </Text>
          <Text className="mt-1.5 text-[14px] leading-5 text-ink2">
            {t('assets.detail.notFound.description')}
          </Text>
        </Panel>
      </Screen>
    )
  }

  const isMarketPriced = asset.valuationMode === 'market_priced'
  const isBalanceAsset = asset.type === 'cash' || asset.type === 'bank_account'
  const isAutoPriced = asset.valuationMode !== 'manual'
  const isSold = asset.status === 'sold'
  const canUpdatePrice = !isSold && canUpdatePriceManually(asset.type)
  const canSell = !isSold && isSellableAssetType(asset.type)

  const position = asset.marketPosition
  const quantity = position?.quantity ?? 0
  const currentUnitPrice = quantity > 0 ? currentValue / quantity : 0
  const costBasis = position?.purchasePrice
    ? position.purchasePrice * quantity
    : (asset.calculationTerm?.principalAmount ?? currentValue)
  const profitLoss = currentValue - costBasis
  const profitLossPercent = costBasis > 0 ? (profitLoss / costBasis) * 100 : 0
  const share = householdAssetTotal > 0 ? (currentValue / householdAssetTotal) * 100 : 0
  const holderName = asset.holderMemberId
    ? members.find((member) => member.id === asset.holderMemberId)?.name
    : undefined
  const updatedAt = asset.valueUpdatedAt ? displayDate(asset.valueUpdatedAt) : null

  return (
    <Screen>
      <BackLink label={t('assets.detail.back')} onPress={() => router.back()} />

      <View className="mb-4 mt-3 flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-[22px] font-medium leading-7 text-ink">{asset.name}</Text>
          <View className="mt-1.5 flex-row items-center gap-3">
            <RowMeta>{t(`options.assetType.${asset.type}`)}</RowMeta>
            {/* Sold is a real lifecycle state, not a deletion — the record is
                kept so the household can still see what it once held. */}
            {isSold ? <StatusChip label={t('options.assetStatus.sold')} tone="neutral" /> : null}
          </View>
        </View>

        {/* Edit / sell / re-price behind one 44pt target, in reading order with
            the irreversible one nowhere near the thumb's first stop. */}
        <ActionSheet
          title={t('common.actions')}
          accessibilityLabel={t('common.actions')}
          items={[
            { key: 'edit', label: t('common.edit'), onPress: () => openEdit(asset.id) },
            ...(canUpdatePrice
              ? [
                  {
                    key: 'price',
                    label: t('assets.priceUpdate.action'),
                    onPress: () => setPriceSheetOpen(true),
                  },
                ]
              : []),
            ...(canSell
              ? [
                  {
                    key: 'sell',
                    label: t('assets.sale.action'),
                    onPress: () => openSale(asset.id),
                  },
                ]
              : []),
          ]}
        />
      </View>

      <Sections>
        {/* What it is worth, what it cost, and how much of the household's
            picture it occupies — readings of the same holding, so one panel. */}
        <Panel>
          <PanelHeader
            title={t(isBalanceAsset ? 'assets.detail.overview' : 'assets.detail.hero.title')}
            // Freshness is the scope of every figure below it, so it is the one
            // thing beside the title — not an action (§2.1).
            right={updatedAt ? <RowMetaMono>{updatedAt}</RowMetaMono> : undefined}
          />

          <View className="mt-5">
            <Label>
              {t(isBalanceAsset ? 'assets.detail.hero.balance' : 'assets.detail.hero.currentValue')}
            </Label>
            <Money className="mt-1.5" size={40}>
              {formatVndShort(currentValue)}
            </Money>

            {/* Quantity × unit price, stated together: for a market holding the
                headline is the product of the two, and saying both is what
                makes it checkable. */}
            {isMarketPriced && position && quantity > 0 ? (
              <RowMeta>
                {`${position.quantity} ${position.unit} · ${formatVndShort(currentUnitPrice)} / ${position.unit}`}
              </RowMeta>
            ) : null}
          </View>

          <SummaryStrip
            className="mt-5"
            items={[
              ...(isMarketPriced
                ? [
                    {
                      key: 'costBasis',
                      label: t('assets.detail.hero.costBasis'),
                      value: formatVndShort(costBasis),
                    },
                    {
                      key: 'profitLoss',
                      label: t(
                        profitLoss < 0
                          ? 'assets.detail.hero.estimatedLoss'
                          : 'assets.detail.hero.estimatedProfit',
                      ),
                      value: `${profitLoss >= 0 ? '+' : '−'}${formatVndShort(Math.abs(profitLoss))}`,
                      // Alert only for a real loss; a gain is not "good news"
                      // the app colours in, it is just the number.
                      tone: (profitLoss < 0 ? 'alert' : 'default') as 'alert' | 'default',
                    },
                  ]
                : []),
              {
                key: 'share',
                label: t('assets.detail.hero.shareOfTotal'),
                value: `${round1(share)}%`,
              },
            ]}
          />

          {isMarketPriced && costBasis > 0 ? (
            <RowMetaMono>
              {`${profitLossPercent >= 0 ? '+' : '−'}${round1(Math.abs(profitLossPercent))}%`}
            </RowMetaMono>
          ) : null}
        </Panel>

        {/* Value over time. The one chart in this feature worth drawing on a
            phone — see the note in `asset-value-chart.tsx`. */}
        <Panel>
          <PanelHeader
            title={t(
              isBalanceAsset ? 'assets.detail.chart.balanceTitle' : 'assets.detail.chart.title',
            )}
          />

          <Segmented
            className="mt-4"
            value={chartRange}
            onChange={setChartRange}
            options={[
              { value: '1' as const, label: t('assets.detail.chart.range1') },
              { value: '6' as const, label: t('assets.detail.chart.range6') },
              { value: '12' as const, label: t('assets.detail.chart.range12') },
            ]}
          />

          <View className="mt-4">
            <AssetValueChart
              points={filteredHistory}
              liquidity={asset.liquidity}
              markers={chartMarkers}
            />
          </View>

          {filteredHistory.length >= 2 ? (
            <View className="mt-4">
              <Label>{t('assets.detail.chart.rangeDelta')}</Label>
              <Money
                className={
                  rangeDelta < 0 ? 'text-alert' : rangeDelta > 0 ? 'text-interactive' : undefined
                }
                size={22}
              >
                {`${rangeDelta > 0 ? '+' : rangeDelta < 0 ? '−' : ''}${formatVndShort(Math.abs(rangeDelta))}`}
              </Money>
              {rangeDeltaPercent !== null ? (
                <RowMetaMono>
                  {`${rangeDeltaPercent >= 0 ? '+' : '−'}${round1(Math.abs(rangeDeltaPercent))}%`}
                </RowMetaMono>
              ) : null}

              {/* What moved it. The line alone cannot separate a price rally
                  from a purchase, so this names the holding changes. */}
              <Text className="mt-3 text-[12px] leading-5 text-ink2">
                {`${t(`assets.detail.chart.inRange${chartRange}`)}: ${
                  chartMarkers.length > 0
                    ? chartMarkers.map((marker) => marker.label).join(' · ')
                    : t('assets.detail.chart.noChange')
                }`}
              </Text>
            </View>
          ) : null}
        </Panel>

        {/* The reference facts. A definition list on the web; here each is one
            grouped row, label left and value right, which is the same shape
            without a table. */}
        <Panel>
          <PanelHeader title={t('assets.detail.info.roleTitle')} />

          <View className="mt-3">
            {position ? (
              <>
                <InfoRow
                  label={t('assets.detail.info.quantity')}
                  value={`${position.quantity} ${position.unit}`}
                />
                {position.purchasePrice ? (
                  <InfoRow
                    label={t('assets.detail.info.averagePurchasePrice')}
                    value={formatVndShort(position.purchasePrice)}
                  />
                ) : null}
              </>
            ) : (
              <InfoRow
                label={t('assets.detail.info.type')}
                value={t(`options.assetType.${asset.type}`)}
              />
            )}

            {/* Who is RESPONSIBLE for the money — never who spent it. */}
            <InfoRow
              label={t('assets.detail.info.holder')}
              value={holderName ?? t('assets.demo.householdOwner')}
            />
            <InfoRow
              label={t('assets.detail.info.countedIn')}
              value={t(
                asset.liquidity === 'usable_now'
                  ? 'assets.detail.info.countedYes'
                  : 'assets.detail.info.countedNo',
              )}
            />
            {asset.areaSqm ? (
              <InfoRow label={t('assets.detail.info.area')} value={`${asset.areaSqm} m²`} />
            ) : null}

            {asset.calculationTerm ? (
              <>
                <InfoRow
                  label={t('assets.detail.info.interestRate')}
                  value={`${asset.calculationTerm.interestRate}%`}
                />
                <InfoRow
                  label={t('assets.detail.info.interestPayment')}
                  value={t(`options.interestPayment.${asset.calculationTerm.interestPayment}`)}
                />
                {asset.calculationTerm.maturityDate ? (
                  <InfoRow
                    label={t('assets.detail.info.maturity')}
                    value={formatDate(asset.calculationTerm.maturityDate)}
                  />
                ) : null}
              </>
            ) : null}

            {!isBalanceAsset ? (
              <InfoRow
                label={t('assets.detail.info.priceSource')}
                value={t(
                  isAutoPriced ? 'assets.detail.info.automatic' : 'assets.detail.info.manual',
                )}
              />
            ) : null}
            {/* No "Cập nhật" row here: the overview header already carries it,
                and §5 allows one fact exactly one place. */}
            {isSold && asset.soldAt ? (
              <InfoRow label={t('assets.detail.info.soldAt')} value={formatDate(asset.soldAt)} />
            ) : null}
          </View>

          {asset.note ? (
            <View className="mt-4">
              <Label>{t('assets.detail.notes.eyebrow')}</Label>
              <Text className="mt-1.5 text-[14px] leading-5 text-ink2">{asset.note}</Text>
            </View>
          ) : null}
        </Panel>

        <AssetGoalUsage assetId={asset.id} onOpenGoal={(goalId) => router.push(`/goals/${goalId}`)} />

        {asset.type === 'saving_deposit' && asset.calculationTerm?.maturityDate ? (
          <SavingWithdrawalPanel term={asset.calculationTerm} />
        ) : null}

        {/* The events that touched this asset. A four-column table on the web;
            grouped rows here, leading with what changed and by how much. */}
        <Panel>
          <PanelHeader
            title={t('assets.detail.events.title')}
            right={
              relatedEvents.length > 0 ? (
                <RowMetaMono>
                  {t('assets.detail.events.count', { count: relatedEvents.length })}
                </RowMetaMono>
              ) : undefined
            }
          />

          {relatedEvents.length > 0 ? (
            <View className="mt-2">
              {relatedEvents.map((entry) => (
                <EventRow key={entry.id} entry={entry} />
              ))}
            </View>
          ) : (
            <EmptyState className="mt-4" message={t('assets.detail.events.empty')} />
          )}
        </Panel>
      </Sections>

      <AssetFormSheet
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        form={form}
        setValue={setValue}
        mode={mode}
        walletOptions={walletOptions}
        isEditing={isEditing}
        editingAsset={editingAsset}
        isSubmitting={isSubmitting}
        onSubmit={submit}
      />

      <AssetSaleSheet
        open={sale.saleOpen}
        onOpenChange={sale.handleOpenChange}
        asset={sale.sellingAsset}
        asOf={asOf || AS_OF}
        form={sale.form}
        walletOptions={sale.walletOptions}
        isMarketAsset={sale.isMarketAsset}
        currentQuantity={sale.currentQuantity}
        previewNet={sale.previewNet}
        isSubmitting={sale.isSubmitting}
        isEditing={sale.isEditing}
        onSubmit={sale.submit}
      />

      {canUpdatePrice ? (
        <AssetPriceUpdateSheet
          // Remounted per open so the field re-seeds from the stored price
          // rather than keeping whatever was typed and abandoned last time.
          key={`${asset.id}-${priceSheetOpen ? 'open' : 'closed'}`}
          open={priceSheetOpen}
          onOpenChange={setPriceSheetOpen}
          asset={asset}
        />
      ) : null}
    </Screen>
  )
}

/** One reference fact: label left, value right. */
function InfoRow({ label, value }: { label: string; value: string }) {
  return <GroupedRow title={label} value={value} valueTone="default" />
}

function EventRow({ entry }: { entry: AssetEventEntry }) {
  const { t } = useTranslation()
  const isPositive = entry.amount >= 0

  return (
    <GroupedRow
      title={entry.title}
      meta={<RowMeta>{t(`options.eventType.${entry.type}`, { defaultValue: entry.type })}</RowMeta>}
      value={`${isPositive ? '+' : '−'}${formatVndShort(Math.abs(entry.amount))}`}
      // Money direction takes no hue by default (§3): the sign says it, and
      // colour stays for what needs acting on.
      valueTone="default"
      valueMeta={displayDate(entry.isoDate)}
    />
  )
}

/** `23/08/2026` — ASCII only, safe for the mono treatment `valueMeta` uses. */
function displayDate(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split('-')
  return year && month && day ? `${day}/${month}/${year}` : ''
}

/** One decimal place, comma separator — never more precision than the input. */
function round1(value: number): string {
  return (Math.round(value * 10) / 10).toString().replace('.', ',')
}

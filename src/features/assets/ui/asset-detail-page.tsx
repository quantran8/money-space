import { ChevronLeft, Pencil, RefreshCw } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAssetDetail, type AssetEventEntry } from '@/features/assets/hooks/use-asset-detail'
import { useAssetsPage } from '@/features/assets/hooks/use-assets-page'
import { canUpdatePriceManually } from '@/features/assets/model/assets'
import { AssetFormDialog } from '@/features/assets/ui/components/asset-form-dialog'
import { AssetGoalUsageSection } from '@/features/assets/ui/components/asset-goal-usage-section'
import { AssetPriceUpdateDialog } from '@/features/assets/ui/components/asset-price-update-dialog'
import { AssetValueChart } from '@/features/assets/ui/components/asset-value-chart'
import { SavingWithdrawalPanel } from '@/features/assets/ui/components/saving-withdrawal-panel'
import { formatDate } from '@/features/debts/model/debts-form'
import { useMembers } from '@/features/members/hooks/use-members'
import { formatVndShort } from '@/shared/lib/format-money'
import { cn } from '@/shared/lib/utils'

type ChartRange = 1 | 6 | 12

/** Past this many, the labels collide and the line stops being readable. */
const MAX_CHART_MARKERS = 4

function SummaryValue({ value, sign = '' }: { value: number; sign?: string }) {
  const formatted = formatVndShort(Math.abs(value))
  const match = formatted.match(/^(.+)\s+(triệu|tỷ)$/)

  return (
    <div className="mt-4 flex flex-wrap items-baseline gap-x-2.5">
      <span className="money-number text-[48px] leading-none sm:text-[56px]">
        {sign}
        {match?.[1] ?? formatted}
      </span>
      {match?.[2] ? <span className="text-[15px] font-medium text-ink2">{match[2]}</span> : null}
    </div>
  )
}

function MetricValue({ value, sign = '' }: { value: number; sign?: string }) {
  const formatted = formatVndShort(Math.abs(value))
  const match = formatted.match(/^(.+)\s+(triệu|tỷ)$/)

  return (
    <div className="mt-3 flex flex-wrap items-baseline gap-x-2">
      <span className="money-number text-[25px] leading-none">
        {sign}
        {match?.[1] ?? formatted}
      </span>
      {match?.[2] ? <span className="text-[13px] font-medium text-ink2">{match[2]}</span> : null}
    </div>
  )
}

/** One reference fact in the role panel: label left, value right. */
function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-8">
      <dt className="text-ink3">{label}</dt>
      <dd className="max-w-[65%] text-right font-medium">{value}</dd>
    </div>
  )
}

function ActivityRow({ entry, locale }: { entry: AssetEventEntry; locale: string }) {
  const { t } = useTranslation()
  const isPositive = entry.amount >= 0

  return (
    <tr className="group transition-colors hover:bg-sunk">
      <td className="rounded-l-control py-3 pl-2 font-mono text-[11px] text-ink3">
        {new Date(entry.isoDate).toLocaleDateString(locale)}
      </td>
      <td className="max-w-[280px] py-3">
        <p className="truncate font-medium">{entry.title}</p>
        {entry.note && entry.note !== entry.title ? (
          <p className="mt-1 truncate text-[11px] text-ink3">{entry.note}</p>
        ) : null}
      </td>
      <td className="py-3 text-ink2">
        {t(`options.eventType.${entry.type}`, { defaultValue: entry.type })}
      </td>
      <td
        className={cn(
          'money-number rounded-r-control py-3 pr-2 text-right font-medium',
          isPositive && 'text-accent',
        )}
      >
        {isPositive ? '+' : '−'}
        {formatVndShort(Math.abs(entry.amount))}
      </td>
    </tr>
  )
}

/** The mobile form of `ActivityRow` — same data, stacked. */
function ActivityCard({ entry, locale }: { entry: AssetEventEntry; locale: string }) {
  const { t } = useTranslation()
  const isPositive = entry.amount >= 0

  return (
    <div className="sunk px-4 py-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-mono text-[10px] text-ink3">
          {new Date(entry.isoDate).toLocaleDateString(locale)}
        </span>
        <span className={cn('money-number text-[12px]', isPositive && 'text-accent')}>
          {isPositive ? '+' : '−'}
          {formatVndShort(Math.abs(entry.amount))}
        </span>
      </div>
      <p className="mt-2 text-[13px]">{entry.title}</p>
      <p className="mt-1 text-[11px] text-ink3">
        {t(`options.eventType.${entry.type}`, { defaultValue: entry.type })}
      </p>
    </div>
  )
}

function formatUpdatedAt(value: string, locale: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  const time = date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
  const day = date.toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `${time} · ${day}`
}

export function AssetDetailPage() {
  const { assetId } = useParams<{ assetId: string }>()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const [priceDialogOpen, setPriceDialogOpen] = useState(false)
  const [chartRange, setChartRange] = useState<ChartRange>(1)
  const locale = i18n.resolvedLanguage?.startsWith('en') ? 'en-US' : 'vi-VN'

  const { asset, currentValue, relatedEvents, valueHistory, isLoading } =
    useAssetDetail(assetId)
  const { members } = useMembers()
  const {
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
  } = useAssetsPage()

  const filteredHistory = useMemo(() => {
    if (valueHistory.length === 0) return []
    const latest = new Date(valueHistory[valueHistory.length - 1].isoDate)
    const threshold = new Date(latest)
    threshold.setMonth(threshold.getMonth() - chartRange)
    return valueHistory.filter((point) => new Date(point.isoDate) >= threshold)
  }, [chartRange, valueHistory])

  /**
   * How much the total moved across the visible range, first point to last.
   *
   * Deliberately the WHOLE move, price and quantity together — that is what the
   * line draws, and reporting only the price part beside it would describe a
   * different chart. The note underneath is what separates the two causes.
   */
  const { rangeDelta, rangeDeltaPercent } = useMemo(() => {
    if (filteredHistory.length < 2) return { rangeDelta: 0, rangeDeltaPercent: null }
    const first = filteredHistory[0].value
    const last = filteredHistory[filteredHistory.length - 1].value
    return {
      rangeDelta: last - first,
      // A range that starts at zero has no percentage to give — a new asset
      // going 0 → 50tr is not "+∞%", it is simply new.
      rangeDeltaPercent: first > 0 ? ((last - first) / first) * 100 : null,
    }
  }, [filteredHistory])

  /**
   * Holding changes inside the visible range, taken from the money events that
   * caused them — the value-history series carries no quantity of its own.
   *
   * Without these the line is ambiguous: a step up reads as the market moving
   * when it may have been a purchase. Capped so a busy range does not turn the
   * chart into a wall of labels.
   */
  const chartMarkers = useMemo(() => {
    if (filteredHistory.length === 0) return []
    const from = filteredHistory[0].isoDate
    const to = filteredHistory[filteredHistory.length - 1].isoDate
    const inRange = relatedEvents
      .filter((entry) => entry.isoDate >= from && entry.isoDate <= to)
      .slice()
      .reverse()
    // Keep the largest moves rather than the most recent ones. Taking the tail
    // would strip every marker off the left half of a busy chart and leave it
    // looking as though nothing happened there.
    const kept =
      inRange.length <= MAX_CHART_MARKERS
        ? inRange
        : [...inRange]
            .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
            .slice(0, MAX_CHART_MARKERS)
            .sort((a, b) => (a.isoDate < b.isoDate ? -1 : a.isoDate > b.isoDate ? 1 : 0))
    return kept.map((entry) => ({
      isoDate: entry.isoDate,
      label: `${entry.amount >= 0 ? '+' : '−'}${formatVndShort(Math.abs(entry.amount))}`,
    }))
  }, [filteredHistory, relatedEvents])

  if (isLoading && !asset) {
    return (
      <div className="space-y-4">
        <div className="h-9 w-40 animate-pulse rounded-control bg-sunk" />
        <div className="h-52 animate-pulse rounded-panel bg-panel" />
      </div>
    )
  }

  if (!asset) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" className="-ml-2 gap-1" onClick={() => navigate('/networth')}>
          <ChevronLeft className="size-4" />
          {t('assets.detail.back')}
        </Button>
        <Card className="py-10 text-center">
          <h1 className="text-lg font-medium">{t('assets.detail.notFound.title')}</h1>
          <p className="mt-1 text-sm text-ink2">{t('assets.detail.notFound.description')}</p>
        </Card>
      </div>
    )
  }

  const isMarketPriced = asset.valuationMode === 'market_priced'
  const isBalanceAsset = asset.type === 'cash' || asset.type === 'bank_account'
  const isAutoPriced = asset.valuationMode !== 'manual'
  const isSold = asset.status === 'sold'
  const canUpdatePrice = !isSold && canUpdatePriceManually(asset.type)
  const position = asset.marketPosition
  const quantity = position?.quantity ?? 0
  const currentUnitPrice = quantity > 0 ? currentValue / quantity : 0
  const costBasis = position?.purchasePrice
    ? position.purchasePrice * quantity
    : asset.calculationTerm?.principalAmount ?? currentValue
  const profitLoss = currentValue - costBasis
  const profitLossPercent = costBasis > 0 ? (profitLoss / costBasis) * 100 : 0
  const share = householdAssetTotal > 0 ? (currentValue / householdAssetTotal) * 100 : 0
  const holderName = asset.holderMemberId
    ? members.find((member) => member.id === asset.holderMemberId)?.name
    : undefined
  const updatedAt = asset.valueUpdatedAt ? formatUpdatedAt(asset.valueUpdatedAt, locale) : null
  function handlePrimaryUpdate() {
    if (!asset) return
    setPriceDialogOpen(true)
  }

  return (
    <div className="space-y-4 pb-3">
      <header className="px-1 py-1 sm:px-0">
        <button
          type="button"
          className="-ml-2 inline-flex min-h-11 items-center gap-2 rounded-control px-2 text-[13px] font-medium text-accent hover:bg-accent-soft"
          onClick={() => navigate('/networth')}
        >
          <ChevronLeft className="size-4" strokeWidth={1.75} />
          {t('assets.detail.back')}
        </button>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="page-title truncate text-[22px] leading-tight">{asset.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-sunk px-2 py-1 text-[10px] text-ink2">
                {t(`options.assetType.${asset.type}`)}
              </span>
              {isSold ? (
                <span className="rounded-full bg-sunk px-2 py-1 text-[10px] font-medium text-ink2">
                  {t('options.assetStatus.sold')}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {canUpdatePrice ? (
              <Button
                variant="secondary"
                className="h-10 px-4 text-[13px]"
                onClick={handlePrimaryUpdate}
              >
                <RefreshCw className="size-4" strokeWidth={1.75} />
                {t('assets.priceUpdate.action')}
              </Button>
            ) : null}
            <Button
              variant="secondary"
              className="h-10 px-4 text-[13px]"
              onClick={() => openEdit(asset.id)}
            >
              <Pencil className="size-4" strokeWidth={1.75} />
              {t('common.edit')}
            </Button>
          </div>
        </div>
      </header>

      {/* Value and performance in one row: what it is worth, what it cost,
          what that difference is, and how much of the household's picture it
          occupies. They are four readings of the same holding, so they share a
          row rather than being split across panels. */}
      <Card>
        <div className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-2">
          <h2 className="section-title text-[16px]">
            {t(isBalanceAsset ? 'assets.detail.overview' : 'assets.detail.hero.title')}
          </h2>
          {updatedAt ? (
            <p className="text-[12px] text-ink3">
              {t(
                isBalanceAsset
                  ? 'assets.detail.balanceUpdatedAt'
                  : 'assets.detail.priceUpdatedAt',
                { value: updatedAt },
              )}
            </p>
          ) : null}
        </div>

        <div
          className={cn(
            'mt-7 grid gap-7 lg:items-end',
            isMarketPriced
              ? 'lg:grid-cols-[minmax(0,1.25fr)_repeat(3,minmax(120px,.7fr))]'
              : 'lg:grid-cols-[minmax(0,1.25fr)_minmax(120px,.7fr)]',
          )}
        >
          <div className="min-w-0">
            <p className="label">
              {t(isBalanceAsset ? 'assets.detail.hero.balance' : 'assets.detail.hero.currentValue')}
            </p>
            <SummaryValue value={currentValue} />
            {/* Quantity and unit price on one line: for a market asset the
                headline figure is a product of the two, and stating them
                together is what makes it checkable. */}
            {isMarketPriced && position && quantity > 0 ? (
              <p className="mt-4 text-[12px] text-ink2">
                <Trans
                  i18nKey="assets.detail.hero.holdingLine"
                  values={{
                    quantity: position.quantity.toLocaleString(locale),
                    unit: position.unit,
                    price: formatVndShort(currentUnitPrice),
                  }}
                  components={[<span key="price" className="num font-medium text-ink" />]}
                />
              </p>
            ) : null}
          </div>

          {isMarketPriced ? (
            <>
              <div className="min-w-0">
                <p className="label">{t('assets.detail.hero.costBasis')}</p>
                <MetricValue value={costBasis} />
              </div>
              <div
                className={cn(
                  'min-w-0',
                  profitLoss < 0 ? 'text-alert' : profitLoss > 0 ? 'text-accent' : undefined,
                )}
              >
                <p className="label">
                  {t(
                    profitLoss < 0
                      ? 'assets.detail.hero.estimatedLoss'
                      : 'assets.detail.hero.estimatedProfit',
                  )}
                </p>
                <MetricValue value={profitLoss} sign={profitLoss >= 0 ? '+' : '−'} />
                <p className="money-number mt-2 text-[12px]">
                  {profitLossPercent >= 0 ? '+' : '−'}
                  {Math.abs(profitLossPercent).toLocaleString(locale, { maximumFractionDigits: 1 })}%
                </p>
              </div>
            </>
          ) : null}

          <div className="min-w-0">
            <p className="label">{t('assets.detail.hero.shareOfTotal')}</p>
            <div className="mt-3 flex items-baseline gap-x-1.5">
              <span className="money-number text-[25px] leading-none">
                {share.toLocaleString(locale, { maximumFractionDigits: 1 })}
              </span>
              <span className="text-[13px] font-medium text-ink2">%</span>
            </div>
          </div>
        </div>
      </Card>

      {/* The value over time, and beside it the one sentence that reads it:
          how much the total moved across the range, and what moved it. The line
          alone cannot separate a price rally from a purchase, so the markers and
          this note do. */}
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="section-title text-[16px]">
              {t(isBalanceAsset ? 'assets.detail.chart.balanceTitle' : 'assets.detail.chart.title')}
            </h2>
            <p className="mt-1 text-[11px] text-ink3">
              {t(
                isBalanceAsset
                  ? 'assets.detail.chart.balanceDescription'
                  : 'assets.detail.chart.description',
              )}
            </p>
          </div>
          <div
            className="sunk flex h-9 items-center p-1 text-[11px]"
            role="group"
            aria-label={t('assets.detail.chart.rangeLabel')}
          >
            {([1, 6, 12] as ChartRange[]).map((range) => (
              <button
                key={range}
                type="button"
                aria-pressed={chartRange === range}
                className={cn(
                  'h-7 rounded-[7px] px-3 transition-colors',
                  chartRange === range ? 'bg-panel font-medium text-ink' : 'text-ink2',
                )}
                onClick={() => setChartRange(range)}
              >
                {t(`assets.detail.chart.range${range}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_240px]">
          <div className="sunk min-w-0 overflow-hidden p-4 sm:p-5">
            <AssetValueChart
              points={filteredHistory}
              liquidity={asset.liquidity}
              markers={chartMarkers}
            />
          </div>

          <div className="flex flex-col justify-between gap-6">
            <div>
              <p className="text-[12px] text-ink2">{t('assets.detail.chart.rangeDelta')}</p>
              <p
                className={cn(
                  'money-number mt-1 text-[22px]',
                  rangeDelta < 0 ? 'text-alert' : rangeDelta > 0 ? 'text-accent' : undefined,
                )}
              >
                {rangeDelta > 0 ? '+' : rangeDelta < 0 ? '−' : ''}
                {formatVndShort(Math.abs(rangeDelta))}
              </p>
              {rangeDeltaPercent !== null ? (
                <p className="money-number mt-1 text-[12px] text-ink3">
                  {rangeDeltaPercent >= 0 ? '+' : '−'}
                  {Math.abs(rangeDeltaPercent).toLocaleString(locale, {
                    maximumFractionDigits: 1,
                  })}
                  %
                </p>
              ) : null}
            </div>

            <div className="space-y-4 text-[12px]">
              <div>
                <p className="text-ink3">{t(`assets.detail.chart.inRange${chartRange}`)}</p>
                <p className="mt-1 leading-5 text-ink2">
                  {chartMarkers.length > 0
                    ? chartMarkers.map((marker) => marker.label).join(' · ')
                    : t('assets.detail.chart.noChange')}
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="h-[2px] w-5 rounded-full bg-accent" />
                  <span>{t('assets.detail.chart.legendValue')}</span>
                </div>
                {chartMarkers.length > 0 ? (
                  <div className="flex items-center gap-2 text-ink2">
                    <span className="flex h-4 w-5 items-center justify-center">
                      <span className="size-2 rounded-full border-2 border-ink3 bg-panel" />
                    </span>
                    <span>{t('assets.detail.chart.legendQuantity')}</span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Reference on the left, live question on the right. "How much of this
          is actually ours to use" is what people come to the asset page to ask,
          so it sits beside the facts rather than below them. */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="section-title text-[16px]">{t('assets.detail.info.roleTitle')}</h2>
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)] lg:gap-14">
          <dl className="space-y-5 text-[13px]">
            {position ? (
              <>
                <InfoRow
                  label={t('assets.detail.info.quantity')}
                  value={`${position.quantity.toLocaleString(locale)} ${position.unit}`}
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
                value={
                  isAutoPriced
                    ? t('assets.detail.info.automatic')
                    : t('assets.detail.info.manual')
                }
              />
            ) : null}
            {updatedAt ? (
              <InfoRow label={t('assets.detail.info.updatedLabel')} value={updatedAt} />
            ) : null}
            {isSold && asset.soldAt ? (
              <InfoRow label={t('assets.detail.info.soldAt')} value={formatDate(asset.soldAt)} />
            ) : null}
            {asset.note ? (
              <div>
                <dt className="text-[12px] text-ink3">{t('assets.detail.notes.eyebrow')}</dt>
                <dd className="mt-2 text-[13px] leading-5 text-ink2">{asset.note}</dd>
              </div>
            ) : null}
          </dl>

          <AssetGoalUsageSection assetId={asset.id} />
        </div>
      </Card>

      {asset.type === 'saving_deposit' &&
      asset.calculationTerm &&
      asset.calculationTerm.maturityDate ? (
        <SavingWithdrawalPanel term={asset.calculationTerm} />
      ) : null}

      <Card>
        <div className="flex items-center justify-between gap-4">
          <h2 className="section-title text-[16px]">{t('assets.detail.events.title')}</h2>
          {relatedEvents.length > 0 ? (
            <span className="num text-[11px] text-ink3">
              {t('assets.detail.events.count', { count: relatedEvents.length })}
            </span>
          ) : null}
        </div>

        {relatedEvents.length > 0 ? (
          <>
            <div className="mt-5 hidden overflow-x-auto md:block">
              <table className="table-dense w-full min-w-[640px] text-[13px]">
                <thead>
                  <tr className="label">
                    <th className="pb-3 text-left font-normal">
                      {t('assets.detail.events.date')}
                    </th>
                    <th className="pb-3 text-left font-normal">
                      {t('assets.detail.events.event')}
                    </th>
                    <th className="pb-3 text-left font-normal">
                      {t('assets.detail.events.type')}
                    </th>
                    <th className="pb-3 text-right font-normal">
                      {t('assets.detail.events.effect')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {relatedEvents.map((entry) => (
                    <ActivityRow key={entry.id} entry={entry} locale={locale} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Four columns do not survive a phone. The same rows become cards
                that lead with what changed and by how much. */}
            <div className="mt-4 space-y-2 md:hidden">
              {relatedEvents.map((entry) => (
                <ActivityCard key={entry.id} entry={entry} locale={locale} />
              ))}
            </div>
          </>
        ) : (
          <p className="sunk mt-5 px-4 py-8 text-center text-[13px] text-ink2">
            {t('assets.detail.events.empty')}
          </p>
        )}
      </Card>

      <AssetFormDialog
        key={formOpen ? (isEditing ? 'edit-open' : 'create-open') : 'closed'}
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
      {canUpdatePrice ? (
        <AssetPriceUpdateDialog
          key={`${asset.id}-${priceDialogOpen ? 'open' : 'closed'}`}
          open={priceDialogOpen}
          onOpenChange={setPriceDialogOpen}
          asset={asset}
        />
      ) : null}
    </div>
  )
}

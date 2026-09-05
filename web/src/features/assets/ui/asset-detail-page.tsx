import { ChevronLeft, Pencil, Plus, RefreshCw, Timeline } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Panel, PanelHeader } from '@/components/ui/panel'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAssetDetail, type AssetEventEntry } from '@money-space/core/features/assets/hooks/use-asset-detail'
import { useAssetsPage } from '@money-space/core/features/assets/hooks/use-assets-page'
import {
  canUpdatePriceManually,
  isWalletAssetType,
} from '@money-space/core/features/assets/model/assets'
import { AssetFormDialog } from '@/features/assets/ui/components/asset-form-dialog'
import { AssetPurchaseDialog } from '@/features/assets/ui/components/asset-purchase-dialog'
import { AssetGoalUsageSection } from '@/features/assets/ui/components/asset-goal-usage-section'
import { AssetPriceUpdateDialog } from '@/features/assets/ui/components/asset-price-update-dialog'
import { AssetValueChart } from '@/features/assets/ui/components/asset-value-chart'
import { SavingWithdrawalPanel } from '@/features/assets/ui/components/saving-withdrawal-panel'
import { EVENT_TYPE_ICONS } from '@/features/events/ui/components/event-type-icon'
import { formatDate } from '@money-space/core/features/debts/model/debts-form'
import { useMembers } from '@money-space/core/features/members/hooks/use-members'
import type { MemberItem } from '@money-space/core/features/members/model/members.types'
import { formatVndExact, formatVndShort } from '@money-space/core/shared/lib/format-money'
import { cn } from '@money-space/core/shared/lib/utils'

type ChartRange = 1 | 6 | 12

/** Past this many, the labels collide and the line stops being readable. */
const MAX_CHART_MARKERS = 4

/**
 * A person, as a single letter.
 *
 * Names repeat down a column and are the widest thing in it, while the question
 * a reader actually asks of that column is "was this me or them" — which one
 * letter answers. The full name stays on the label and the tooltip.
 */
function PersonMark({ name, label }: { name: string; label: string }) {
  return (
    <span
      className="grid size-8 shrink-0 place-items-center rounded-full bg-wash t-caption-sm font-medium text-ink2"
      role="img"
      aria-label={label}
      title={label}
    >
      {name.trim().charAt(0).toLocaleUpperCase() || 'M'}
    </span>
  )
}

/** One reference fact: label left, value right, in the info grid's two columns. */
function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <>
      <dt className="text-ink2">{label}</dt>
      <dd className="min-w-0 justify-self-end text-right font-medium">{value}</dd>
    </>
  )
}

function ActivityRow({
  entry,
  locale,
  actorName,
}: {
  entry: AssetEventEntry
  locale: string
  actorName: string
}) {
  const { t } = useTranslation()
  const isPositive = entry.amount >= 0
  const TypeIcon = EVENT_TYPE_ICONS[entry.type]
  const typeLabel = t(`options.eventType.${entry.type}`, { defaultValue: entry.type })

  return (
    <TableRow>
      <TableCell className="num whitespace-nowrap text-ink2">
        {new Date(entry.isoDate).toLocaleDateString(locale)}
      </TableCell>
      <TableCell className="max-w-[320px]">
        {/* The type is the glyph, not a column of its own: it repeats down the
            table and a word per row said less than the shape does. */}
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="grid size-6 shrink-0 place-items-center text-ink3"
            role="img"
            aria-label={typeLabel}
            title={typeLabel}
          >
            <TypeIcon className="size-[17px]" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium">{entry.title}</p>
            {entry.note && entry.note !== entry.title ? (
              <p className="mt-1 truncate t-caption-sm text-ink3">{entry.note}</p>
            ) : null}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <PersonMark name={actorName} label={t('assets.detail.events.actor', { name: actorName })} />
      </TableCell>
      <TableCell className="money-number whitespace-nowrap text-right font-medium">
        {isPositive ? '+' : '−'}
        {formatVndShort(Math.abs(entry.amount))}
      </TableCell>
    </TableRow>
  )
}

/** The mobile form of `ActivityRow` — same data, stacked. */
function ActivityCard({
  entry,
  locale,
  actorName,
}: {
  entry: AssetEventEntry
  locale: string
  actorName: string
}) {
  const { t } = useTranslation()
  const isPositive = entry.amount >= 0
  const TypeIcon = EVENT_TYPE_ICONS[entry.type]
  const typeLabel = t(`options.eventType.${entry.type}`, { defaultValue: entry.type })

  return (
    <article className="flex items-center gap-3 rounded-control px-2 py-2 transition-colors hover:bg-canvas">
      <span
        className="grid size-6 shrink-0 place-items-center text-ink3"
        role="img"
        aria-label={typeLabel}
        title={typeLabel}
      >
        <TypeIcon className="size-[17px]" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate t-body-sm font-medium">{entry.title}</p>
        <div className="mt-1 flex items-center gap-2">
          <PersonMark name={actorName} label={t('assets.detail.events.actor', { name: actorName })} />
          <span className="num t-caption text-ink3">
            {new Date(entry.isoDate).toLocaleDateString(locale)}
          </span>
        </div>
      </div>
      <p className="money-number shrink-0 whitespace-nowrap t-body-sm font-medium">
        {isPositive ? '+' : '−'}
        {formatVndShort(Math.abs(entry.amount))}
      </p>
    </article>
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
    openPurchase,
    // Aliased: `quantity` is already the P&L holding lower in this file.
    quantity: quantityFlow,
  } = useAssetsPage()

  const filteredHistory = useMemo(() => {
    if (valueHistory.length === 0) return []
    const latest = new Date(valueHistory[valueHistory.length - 1].isoDate)
    const threshold = new Date(latest)
    threshold.setMonth(threshold.getMonth() - chartRange)
    return valueHistory.filter((point) => new Date(point.isoDate) >= threshold)
  }, [chartRange, valueHistory])

  /**
   * How much the total moved across the visible range, first point to last,
   * and the band it moved inside.
   *
   * Deliberately the WHOLE move, price and quantity together — that is what the
   * line draws, and reporting only the price part beside it would describe a
   * different chart. The markers below are what separate the two causes.
   */
  const { rangeDelta, rangeDeltaPercent, rangeHigh, rangeLow } = useMemo(() => {
    if (filteredHistory.length === 0) {
      return { rangeDelta: 0, rangeDeltaPercent: null, rangeHigh: null, rangeLow: null }
    }
    const values = filteredHistory.map((point) => point.value)
    const first = values[0]
    const last = values[values.length - 1]
    return {
      rangeDelta: values.length < 2 ? 0 : last - first,
      // A range that starts at zero has no percentage to give — a new asset
      // going 0 → 50tr is not "+∞%", it is simply new.
      rangeDeltaPercent: values.length >= 2 && first > 0 ? ((last - first) / first) * 100 : null,
      rangeHigh: Math.max(...values),
      rangeLow: Math.min(...values),
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

  /**
   * Who recorded each event. The API sends an auth profile id, not a name, so a
   * creator who has left the household goes unnamed rather than being reported
   * under a stale one; system entries (interest accrual) have no actor at all.
   */
  const actorFor = useMemo(() => {
    const byProfile = new Map<string, MemberItem>(
      members.map((member) => [member.profileId, member]),
    )
    return (entry: AssetEventEntry) =>
      (entry.createdById ? byProfile.get(entry.createdById)?.name : undefined) ??
      t('assets.detail.events.householdActor')
  }, [members, t])

  if (isLoading && !asset) {
    return (
      <div className="s-card-gap flex flex-col">
        <div className="h-9 w-40 animate-pulse rounded-control bg-wash" />
        <div className="h-52 animate-pulse rounded-card bg-card" />
      </div>
    )
  }

  if (!asset) {
    return (
      <div className="s-section-gap flex flex-col">
        <Button variant="ghost" className="-ml-2 gap-1" onClick={() => navigate('/networth')}>
          <ChevronLeft className="size-4" />
          {t('assets.detail.back')}
        </Button>
        <Panel className="py-8 text-center">
          <h1 className="t-subhead font-medium">{t('assets.detail.notFound.title')}</h1>
          <p className="mt-1 t-body-sm text-ink2">{t('assets.detail.notFound.description')}</p>
        </Panel>
      </div>
    )
  }

  const isMarketPriced = asset.valuationMode === 'market_priced'
  const isBalanceAsset = isWalletAssetType(asset.type)
  const isAutoPriced = asset.valuationMode !== 'manual'
  const isSold = asset.status === 'sold'
  const canUpdatePrice = !isSold && canUpdatePriceManually(asset.type)
  const canBuyMore = !isSold && !!asset.marketPosition
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
  const holderLabel = holderName ?? t('assets.demo.householdOwner')
  const updatedAt = asset.valueUpdatedAt ? formatUpdatedAt(asset.valueUpdatedAt, locale) : null
  const percentText = (value: number) =>
    `${value >= 0 ? '+' : '−'}${Math.abs(value).toLocaleString(locale, { maximumFractionDigits: 1 })}%`

  /**
   * The readings that sit beside the headline value.
   *
   * Only a market-priced holding has a cost to compare against, so profit and
   * cost basis are its alone; share of the household picture is true of every
   * asset and is always last.
   */
  const secondaryMetrics = [
    ...(isMarketPriced
      ? [
          {
            label: t('assets.detail.hero.costBasis'),
            // Exact, not compact: this sits beside the profit/loss computed
            // FROM it, and at the compact scale a 70.000đ loss rounds both
            // figures to the same "15,1 tr" — the card then reads as a loss
            // between two identical numbers. See `formatVndExact`.
            value: formatVndExact(costBasis),
            note: null as string | null,
            tone: undefined as string | undefined,
          },
          {
            label: t(
              profitLoss < 0
                ? 'assets.detail.hero.estimatedLoss'
                : 'assets.detail.hero.estimatedProfit',
            ),
            value: `${profitLoss > 0 ? '+' : profitLoss < 0 ? '−' : ''}${formatVndExact(Math.abs(profitLoss))}`,
            note: percentText(profitLossPercent),
            // Colour marks what needs a look (§5.2). A loss does; a gain is the
            // expected case and stays ink.
            tone: profitLoss < 0 ? 'text-alert-ink' : undefined,
          },
        ]
      : []),
    {
      label: t('assets.detail.hero.share'),
      value: `${share.toLocaleString(locale, { maximumFractionDigits: 1 })}%`,
      note: null as string | null,
      tone: undefined as string | undefined,
    },
  ]

  function handlePrimaryUpdate() {
    if (!asset) return
    setPriceDialogOpen(true)
  }

  return (
    <div className="flex flex-col pb-3">
      <header>
        <button
          type="button"
          className="-ml-2 inline-flex min-h-11 items-center gap-2 rounded-control px-2 t-body-sm text-ink2 transition-colors hover:text-ink"
          onClick={() => navigate('/networth')}
        >
          <ChevronLeft className="size-[17px]" strokeWidth={1.75} />
          {t('assets.detail.back')}
        </button>

        <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="t-page-tracking truncate t-metric leading-tight">{asset.name}</h1>
            {/* Only `sold` survives here. The asset TYPE was a chip beside it,
                but a type is reference — it belongs in Thông tin, where it now
                always appears — while "đã bán" changes what every figure below
                means and has to be visible from the title. */}
            {isSold ? (
              <span className="mt-2 inline-block rounded-full bg-wash px-2 py-1 t-caption-sm font-medium text-ink2">
                {t('options.assetStatus.sold')}
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {/* Buying more re-averages a cost basis, so it needs a position to
                average into — a balance asset has none. */}
            {canBuyMore ? (
              <Button onClick={() => openPurchase(asset.id)}>
                <Plus className="size-[17px]" strokeWidth={1.75} />
                {t('assets.purchase.title')}
              </Button>
            ) : null}
            {canUpdatePrice ? (
              <Button
                variant={canBuyMore ? 'secondary' : 'default'}
                onClick={handlePrimaryUpdate}
              >
                <RefreshCw className="size-[17px]" strokeWidth={1.75} />
                {t('assets.priceUpdate.action')}
              </Button>
            ) : null}
            <Button
              variant="ghost"
              className="rounded-control px-3 text-ink [&_svg]:text-ink3"
              onClick={() => openEdit(asset.id)}
            >
              <Pencil className="size-[17px]" strokeWidth={1.75} />
              {t('common.edit')}
            </Button>
          </div>
        </div>
      </header>

      <div className="s-card-gap mt-5 flex flex-col">
        {/* What it is worth, what it cost, what that difference is, and how much
            of the household's picture it occupies. Four readings of one holding,
            so they share a row — and the current value is the only one at hero
            size, because it is the one the page exists to state. */}
        <Panel>
          <PanelHeader
            title={t(isBalanceAsset ? 'assets.detail.overview' : 'assets.detail.hero.valueTitle')}
            meta={updatedAt ?? undefined}
          />

          <div className="s-head-body grid gap-8 lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.5fr)] lg:gap-12">
            <div className="min-w-0">
              <p className="t-body-sm text-ink2">
                {t(isBalanceAsset ? 'assets.detail.hero.balance' : 'assets.detail.hero.currentValue')}
              </p>
              {/* Exact for a market holding and a balance: the first is the
                  product of the quantity and unit price stated right below it,
                  the second is a real account balance — both are known to the
                  đồng and both sit beside figures derived FROM them (cost basis,
                  profit/loss), so a rounded hero is the one number in the set
                  that cannot be reconciled. A manual estimate keeps the compact
                  scale: §6 forbids showing more precision than the input. */}
              <p className="money-number mt-2 t-figure lg:t-hero">
                {isAutoPriced || isBalanceAsset
                  ? formatVndExact(currentValue)
                  : formatVndShort(currentValue)}
              </p>
              {/* Quantity and unit price on one line: for a market asset the
                  headline figure is a product of the two, and stating them
                  together is what makes it checkable — so the unit price is
                  exact. Compact, "1 chỉ · 15,1 tr / chỉ" sat under a hero of
                  "15,1 tr" while the real value was 15.050.000đ, and the one
                  line meant to let the reader verify the total was the line
                  that could not be multiplied back. */}
              {isMarketPriced && position && quantity > 0 ? (
                <p className="mt-2 t-caption text-ink3">
                  <Trans
                    i18nKey="assets.detail.hero.holdingLine"
                    values={{
                      quantity: position.quantity.toLocaleString(locale),
                      unit: position.unit,
                      price: formatVndExact(currentUnitPrice),
                    }}
                    components={{ 1: <span className="num" /> }}
                  />
                </p>
              ) : null}
            </div>

            <div className="grid gap-8 self-end sm:grid-cols-2 lg:grid-cols-3">
              {secondaryMetrics.map((metric) => (
                <div key={metric.label} className="min-w-0">
                  <p className="t-caption text-ink3">{metric.label}</p>
                  <p className={cn('money-number mt-2 t-metric', metric.tone)}>{metric.value}</p>
                  {metric.note ? (
                    <p className={cn('num mt-1 t-caption', metric.tone ?? 'text-ink3')}>
                      {metric.note}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </Panel>

        {/* The value over time, and beside it the numbers that read it: how far
            it moved and the band it moved inside. The line alone cannot separate
            a price rally from a purchase, so the markers do — listed only when
            there is something to separate. */}
        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="t-title">
              {t(
                isBalanceAsset
                  ? 'assets.detail.chart.balanceTitle'
                  : 'assets.detail.chart.movementTitle',
              )}
            </h2>
            <div
              className="inline-flex rounded-control bg-wash p-1"
              role="group"
              aria-label={t('assets.detail.chart.rangeLabel')}
            >
              {([1, 6, 12] as ChartRange[]).map((range) => (
                <button
                  key={range}
                  type="button"
                  aria-pressed={chartRange === range}
                  className={cn(
                    'min-h-9 rounded-[10px] px-3 t-caption transition-colors',
                    chartRange === range ? 'bg-card font-medium text-ink' : 'text-ink2',
                  )}
                  onClick={() => setChartRange(range)}
                >
                  {t(`assets.detail.chart.range${range}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="s-head-body grid gap-8 lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-12">
            {/* No wash bed under the line. The chart is the card's content, not
                a control sitting inside it, and a second surface behind it made
                the axis labels sit on a tint the rest of the page does not use. */}
            <div className="min-w-0 overflow-hidden">
              <AssetValueChart
                points={filteredHistory}
                liquidity={asset.liquidity}
                markers={chartMarkers}
              />
            </div>

            <div className="flex flex-col gap-7">
              <div>
                <p className="t-caption text-ink3">{t('assets.detail.chart.change')}</p>
                <p
                  className={cn(
                    'money-number mt-1 t-figure',
                    rangeDelta < 0 ? 'text-alert-ink' : undefined,
                  )}
                >
                  {rangeDelta > 0 ? '+' : rangeDelta < 0 ? '−' : ''}
                  {formatVndShort(Math.abs(rangeDelta))}
                </p>
                {rangeDeltaPercent !== null ? (
                  <p className="num mt-1 t-caption text-ink3">{percentText(rangeDeltaPercent)}</p>
                ) : null}
              </div>

              {rangeHigh !== null ? (
                <div>
                  <p className="t-caption text-ink3">{t('assets.detail.chart.high')}</p>
                  <p className="money-number mt-1 t-body font-medium">
                    {formatVndShort(rangeHigh)}
                  </p>
                </div>
              ) : null}

              {rangeLow !== null ? (
                <div>
                  <p className="t-caption text-ink3">{t('assets.detail.chart.low')}</p>
                  <p className="money-number mt-1 t-body font-medium">{formatVndShort(rangeLow)}</p>
                </div>
              ) : null}

              {chartMarkers.length > 0 ? (
                <div>
                  <p className="t-caption text-ink3">
                    {t(`assets.detail.chart.inRange${chartRange}`)}
                  </p>
                  <p className="num mt-1 t-caption leading-5 text-ink2">
                    {chartMarkers.map((marker) => marker.label).join(' · ')}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title={t('assets.detail.info.title')} />

          <div className="s-head-body min-w-0">
            <div>
              <dl className="grid grid-cols-[minmax(0,1fr)_minmax(0,auto)] gap-x-8 gap-y-4 t-body-sm">
                <InfoRow
                  label={t('assets.detail.info.type')}
                  value={t(`options.assetType.${asset.type}`)}
                />
                {position ? (
                  <>
                    <InfoRow
                      label={t('assets.detail.info.quantity')}
                      value={`${position.quantity.toLocaleString(locale)} ${position.unit}`}
                    />
                    {position.purchasePrice ? (
                      <InfoRow
                        label={t('assets.detail.info.averagePurchasePrice')}
                        // A stored per-unit price, exact to the đồng.
                        value={formatVndExact(position.purchasePrice)}
                      />
                    ) : null}
                  </>
                ) : null}
                <InfoRow
                  label={t('assets.detail.info.holder')}
                  value={
                    <span className="flex items-center justify-end gap-2">
                      <PersonMark name={holderLabel} label={holderLabel} />
                      <span className="truncate">{holderLabel}</span>
                    </span>
                  }
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
                {isSold && asset.soldAt ? (
                  <InfoRow
                    label={t('assets.detail.info.soldAt')}
                    value={formatDate(asset.soldAt)}
                  />
                ) : null}
              </dl>

              {/* Outside the `dl`: a note is prose, not a label/value pair, and
                  in a two-column grid it would take one of the two cells. */}
              {asset.note ? (
                <div className="mt-5">
                  <p className="t-caption text-ink3">{t('assets.detail.notes.eyebrow')}</p>
                  <p className="mt-2 t-body-sm leading-5 text-ink2">{asset.note}</p>
                </div>
              ) : null}
            </div>
          </div>
        </Panel>

        <AssetGoalUsageSection assetId={asset.id} />

        {asset.type === 'saving_deposit' &&
        asset.calculationTerm &&
        asset.calculationTerm.maturityDate ? (
          <SavingWithdrawalPanel term={asset.calculationTerm} />
        ) : null}

        <Panel>
          <PanelHeader
            title={t('assets.detail.events.title')}
            meta={
              relatedEvents.length > 0
                ? t('assets.detail.events.count', { count: relatedEvents.length })
                : undefined
            }
          />

          {relatedEvents.length > 0 ? (
            <>
              {/* The shared `Table` primitive rather than a hand-rolled
                  `<table>`, so this list is built the same way as every other
                  one. Hidden below `md` because four columns genuinely do not
                  fit a phone — the rows below are a real reflow, not a fallback
                  for a horizontal scroll. */}
              <div className="s-head-body hidden md:block">
                <Table className="min-w-[640px] t-body-sm">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      {/* `.label-vi`: accented Vietnamese headings, which mono
                          renders poorly (§10.1). */}
                      <TableHead className="label-vi">{t('assets.detail.events.date')}</TableHead>
                      <TableHead className="label-vi">{t('assets.detail.events.event')}</TableHead>
                      <TableHead className="label-vi">{t('assets.detail.events.person')}</TableHead>
                      <TableHead className="label-vi text-right">
                        {t('assets.detail.events.effect')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {relatedEvents.map((entry) => (
                      <ActivityRow
                        key={entry.id}
                        entry={entry}
                        locale={locale}
                        actorName={actorFor(entry)}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Four columns do not survive a phone. The same rows become the
                  timeline's own shape: glyph, what changed, by how much. */}
              <div className="mt-5 flex flex-col gap-1 md:hidden">
                {relatedEvents.map((entry) => (
                  <ActivityCard
                    key={entry.id}
                    entry={entry}
                    locale={locale}
                    actorName={actorFor(entry)}
                  />
                ))}
              </div>
            </>
          ) : (
            <EmptyState icon={Timeline} className="mt-5">
              {t('assets.detail.events.empty')}
            </EmptyState>
          )}
        </Panel>
      </div>

      <AssetPurchaseDialog
        open={quantityFlow.mode === 'purchase'}
        onOpenChange={quantityFlow.handleOpenChange}
        asset={quantityFlow.asset}
        currentQuantity={quantityFlow.currentQuantity}
        walletOptions={quantityFlow.walletOptions}
        form={quantityFlow.purchaseForm}
        isSubmitting={quantityFlow.isSubmitting}
        onSubmit={quantityFlow.submitPurchase}
      />

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

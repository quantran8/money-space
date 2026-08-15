import { ChevronLeft, Pencil, RefreshCw } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAssetDetail, type AssetEventEntry } from '@/features/assets/hooks/use-asset-detail'
import { useAssetsPage } from '@/features/assets/hooks/use-assets-page'
import { canUpdatePriceManually } from '@/features/assets/model/assets'
import { AssetFormDialog } from '@/features/assets/ui/components/asset-form-dialog'
import { AssetPriceUpdateDialog } from '@/features/assets/ui/components/asset-price-update-dialog'
import { AssetValueChart } from '@/features/assets/ui/components/asset-value-chart'
import { SavingWithdrawalPanel } from '@/features/assets/ui/components/saving-withdrawal-panel'
import { formatDate } from '@/features/debts/model/debts-form'
import { useMembers } from '@/features/members/hooks/use-members'
import { formatVndShort } from '@/shared/lib/format-money'
import { cn } from '@/shared/lib/utils'

type ChartRange = 1 | 6 | 12

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

function InfoRow({
  label,
  value,
  emphasized = false,
}: {
  label: string
  value: ReactNode
  emphasized?: boolean
}) {
  return (
    <div
      className={cn(
        'flex items-baseline justify-between gap-5 px-4 py-3',
        emphasized && 'sunk py-3.5',
      )}
    >
      <dt className="text-[12px] text-ink2">{label}</dt>
      <dd className="max-w-[65%] text-right text-[13px] font-medium">{value}</dd>
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
    if (canUpdatePrice) setPriceDialogOpen(true)
    else openEdit(asset.id)
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
            <div className="flex flex-wrap items-center gap-2 text-[13px] text-ink2">
              <span>{t(`options.assetType.${asset.type}`)}</span>
              <span className="sunk px-2.5 py-1 text-[11px] font-medium text-ink2">
                {t(`options.liquidity.${asset.liquidity}`)}
              </span>
              {isSold ? (
                <span className="sunk px-2.5 py-1 text-[11px] font-medium text-ink2">
                  {t('options.assetStatus.sold')}
                </span>
              ) : null}
            </div>
            <h1 className="page-title mt-2 truncate text-[32px] leading-tight">{asset.name}</h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {!isSold && (canUpdatePrice || isBalanceAsset) ? (
              <Button
                variant="secondary"
                className="h-10 px-4 text-[13px]"
                onClick={handlePrimaryUpdate}
              >
                <RefreshCw className="size-4" strokeWidth={1.75} />
                {isBalanceAsset
                  ? t('assets.detail.balanceUpdateAction')
                  : t('assets.priceUpdate.action')}
              </Button>
            ) : null}
            <Button className="h-10 px-4 text-[13px]" onClick={() => openEdit(asset.id)}>
              <Pencil className="size-4" strokeWidth={1.75} />
              {t('common.edit')}
            </Button>
          </div>
        </div>
      </header>

      <Card>
        <div className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-2">
          <h2 className="section-title text-[16px]">{t('assets.detail.overview')}</h2>
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

        <div className="mt-8 grid gap-7 lg:grid-cols-[minmax(280px,.95fr)_minmax(0,1.45fr)] lg:items-end">
          <div className="min-w-0">
            <p className="label">
              {t(isBalanceAsset ? 'assets.detail.hero.balance' : 'assets.detail.hero.currentValue')}
            </p>
            <SummaryValue value={currentValue} />
            {isMarketPriced && position && quantity > 0 ? (
              <div className="mt-5 flex flex-wrap items-baseline gap-2">
                <span className="text-[12px] text-ink3">{t('assets.detail.hero.marketPrice')}</span>
                <span className="money-number text-[14px]">
                  {formatVndShort(currentUnitPrice)} / {position.unit}
                </span>
              </div>
            ) : null}
          </div>

          {isMarketPriced ? (
            <div className="grid gap-5 sm:grid-cols-3 lg:gap-7">
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
              <div className="min-w-0">
                <p className="label">{t('assets.detail.hero.share')}</p>
                <div className="mt-3 flex items-baseline gap-x-1.5">
                  <span className="money-number text-[25px] leading-none">
                    {share.toLocaleString(locale, { maximumFractionDigits: 1 })}
                  </span>
                  <span className="text-[13px] font-medium text-ink2">%</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="min-w-0 lg:max-w-[260px]">
              <p className="label">{t('assets.detail.hero.share')}</p>
              <div className="mt-3 flex items-baseline gap-x-1.5">
                <span className="money-number text-[25px] leading-none">
                  {share.toLocaleString(locale, { maximumFractionDigits: 1 })}
                </span>
                <span className="text-[13px] font-medium text-ink2">%</span>
              </div>
            </div>
          )}
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(340px,.75fr)]">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="section-title text-[16px]">
              {t(isBalanceAsset ? 'assets.detail.chart.balanceTitle' : 'assets.detail.chart.title')}
            </h2>
            <div className="sunk flex h-9 items-center p-1 text-[11px]">
              {([1, 6, 12] as ChartRange[]).map((range) => (
                <button
                  key={range}
                  type="button"
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
          <div className="sunk mt-6 overflow-hidden p-4 sm:p-5">
            <AssetValueChart points={filteredHistory} liquidity={asset.liquidity} />
          </div>
        </Card>

        <Card>
          <h2 className="section-title text-[16px]">{t('assets.detail.info.title')}</h2>
          <dl className="mt-6 grid gap-1">
            {position ? (
              <>
                <InfoRow
                  emphasized
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
                emphasized
                label={t('assets.detail.info.type')}
                value={t(`options.assetType.${asset.type}`)}
              />
            )}
            <InfoRow
              label={t('assets.detail.info.holder')}
              value={holderName ?? t('assets.demo.householdOwner')}
            />
            <InfoRow
              label={t('assets.detail.info.sharing')}
              value={t(`options.sharingLevel.${asset.visibilityLevel ?? 'detail'}`)}
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
              <InfoRow label={t('assets.detail.info.soldAt')} value={formatDate(asset.soldAt)} />
            ) : null}
            <div className="mt-2 px-4 py-3">
              <dt className="text-[12px] text-ink2">{t('assets.detail.notes.eyebrow')}</dt>
              <dd className="mt-2 text-[13px] leading-5 text-ink3">
                {asset.note || t('common.noNote')}
              </dd>
            </div>
          </dl>
        </Card>
      </div>

      {asset.type === 'saving_deposit' &&
      asset.calculationTerm &&
      asset.calculationTerm.maturityDate ? (
        <SavingWithdrawalPanel term={asset.calculationTerm} />
      ) : null}

      <Card>
        <h2 className="section-title text-[16px]">{t('assets.detail.events.title')}</h2>

        {relatedEvents.length > 0 ? (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[640px] text-[13px]">
              <thead>
                <tr className="label">
                  <th className="pb-3 pl-2 text-left font-normal">
                    {t('assets.detail.events.date')}
                  </th>
                  <th className="pb-3 text-left font-normal">
                    {t('assets.detail.events.event')}
                  </th>
                  <th className="pb-3 text-left font-normal">
                    {t('assets.detail.events.type')}
                  </th>
                  <th className="pb-3 pr-2 text-right font-normal">
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

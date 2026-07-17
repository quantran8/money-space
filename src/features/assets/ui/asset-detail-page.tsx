import { ChevronLeft, Pencil, RefreshCw, Sparkles } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
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
import { formatVndShort } from '@/shared/lib/format-money'
import { cn } from '@/shared/lib/utils'

type ChartRange = 1 | 6 | 12

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-semibold">{value}</span>
    </div>
  )
}

function HeroMetric({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="border-l border-white/10 pl-4">
      <p className="text-xs text-white/40">{label}</p>
      <p className="money-number mt-3 text-xl font-semibold">{value}</p>
      {note ? <p className="mt-1 text-xs text-white/30">{note}</p> : null}
    </div>
  )
}

function ActivityRow({ entry, locale }: { entry: AssetEventEntry; locale: string }) {
  const { t } = useTranslation()
  const isPositive = entry.amount >= 0
  return (
    <div className="grid gap-3 py-4 first:pt-0 last:pb-0 md:grid-cols-[110px_1fr_150px_120px] md:items-center">
      <p className="text-xs text-muted-foreground">
        {new Date(entry.isoDate).toLocaleDateString(locale)}
      </p>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{entry.title}</p>
        {entry.note && entry.note !== entry.title ? (
          <p className="mt-1 truncate text-xs text-muted-foreground">{entry.note}</p>
        ) : null}
      </div>
      <p className="text-sm text-muted-foreground">
        {t(`options.eventType.${entry.type}`, { defaultValue: entry.type })}
      </p>
      <p
        className={cn(
          'money-number text-sm font-semibold md:text-right',
          isPositive && 'text-[hsl(var(--status-green))]',
        )}
      >
        {isPositive ? '+' : '-'}
        {formatVndShort(Math.abs(entry.amount))}
      </p>
    </div>
  )
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
  const {
    total: householdAssetTotal,
    form,
    setValue,
    mode,
    walletOptions,
    isEditing,
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
        <div className="h-9 w-40 animate-pulse rounded-full bg-muted" />
        <div className="h-52 animate-pulse rounded-[28px] bg-muted" />
      </div>
    )
  }

  if (!asset) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" className="-ml-2 gap-1" onClick={() => navigate('/assets')}>
          <ChevronLeft className="size-4" />
          {t('assets.detail.back')}
        </Button>
        <Card className="py-10 text-center">
          <h1 className="text-lg font-semibold">{t('assets.detail.notFound.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('assets.detail.notFound.description')}
          </p>
        </Card>
      </div>
    )
  }

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
  const firstVisibleValue = filteredHistory[0]?.value ?? currentValue
  const periodChange =
    firstVisibleValue > 0 ? ((currentValue - firstVisibleValue) / firstVisibleValue) * 100 : 0
  const holdingLabel = position
    ? `${position.quantity} ${position.unit}`
    : asset.areaSqm
      ? `${asset.areaSqm} m²`
      : t(`options.assetType.${asset.type}`)
  const updatedAt = asset.valueUpdatedAt
    ? new Date(asset.valueUpdatedAt).toLocaleString(locale, {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          className="-ml-2 w-fit gap-1"
          onClick={() => navigate('/assets')}
        >
          <ChevronLeft className="size-4" />
          {t('assets.detail.back')}
        </Button>

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm text-muted-foreground">
                {t('assets.detail.heading', { type: t(`options.assetType.${asset.type}`) })}
              </p>
              <Badge variant="secondary">{t(`options.liquidity.${asset.liquidity}`)}</Badge>
              {isAutoPriced ? (
                <Badge variant="secondary">
                  <Sparkles className="mr-1 size-3" />
                  {t('assets.list.autoPriced')}
                </Badge>
              ) : null}
              {isSold ? <Badge variant="secondary">{t('options.assetStatus.sold')}</Badge> : null}
            </div>
            <h1 className="page-title mt-2 text-3xl font-semibold sm:text-4xl">{asset.name}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{holdingLabel}</p>
          </div>

          <div className="flex flex-col items-start gap-3 md:items-end">
            <div className="flex flex-wrap gap-2">
              {canUpdatePrice ? (
                <Button variant="outline" onClick={() => setPriceDialogOpen(true)}>
                  <RefreshCw className="mr-2 size-4" />
                  {t('assets.priceUpdate.action')}
                </Button>
              ) : null}
              <Button onClick={() => openEdit(asset.id)}>
                <Pencil className="mr-2 size-4" />
                {t('common.edit')}
              </Button>
            </div>
            {updatedAt ? (
              <p className="text-xs text-muted-foreground">
                {t('assets.detail.updatedAt', { value: updatedAt })}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <section className="rounded-[28px] bg-[#1d1d1f] p-6 text-white shadow-[0_14px_38px_rgba(0,0,0,0.08)] sm:p-8">
        <div className="grid gap-8 xl:grid-cols-[1.2fr_1fr] xl:items-end">
          <div>
            <p className="text-sm font-medium text-white/45">
              {t('assets.detail.hero.currentValue')}
            </p>
            <p className="money-number mt-4 text-5xl font-semibold tracking-[-0.055em] sm:text-6xl">
              {formatVndShort(currentValue)}
            </p>
            <p className="mt-5 text-sm text-white/45">
              {position && quantity > 0
                ? t('assets.detail.hero.currentPrice', {
                    value: formatVndShort(currentUnitPrice),
                    unit: position.unit,
                  })
                : t('assets.detail.hero.valuationDescription')}
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-3 sm:gap-3">
            <HeroMetric
              label={t('assets.detail.hero.costBasis')}
              value={formatVndShort(costBasis)}
              note={
                position?.purchasePrice
                  ? t('assets.detail.hero.perUnit', {
                      value: formatVndShort(position.purchasePrice),
                    })
                  : undefined
              }
            />
            <HeroMetric
              label={t('assets.detail.hero.profitLoss')}
              value={`${profitLoss >= 0 ? '+' : '-'}${formatVndShort(Math.abs(profitLoss))}`}
              note={`${profitLossPercent >= 0 ? '+' : ''}${profitLossPercent.toLocaleString(locale, {
                maximumFractionDigits: 1,
              })}%`}
            />
            <HeroMetric
              label={t('assets.detail.hero.share')}
              value={`${share.toLocaleString(locale, { maximumFractionDigits: 1 })}%`}
              note={t('assets.detail.hero.shareNote')}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="section-title text-xl font-semibold">
                {t('assets.detail.chart.title')}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {t('assets.detail.chart.description')}
              </p>
            </div>
            <div className="inline-flex w-fit rounded-xl bg-muted p-1">
              {([1, 6, 12] as ChartRange[]).map((range) => (
                <button
                  key={range}
                  type="button"
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-xs font-medium',
                    chartRange === range ? 'bg-card shadow-sm' : 'text-muted-foreground',
                  )}
                  onClick={() => setChartRange(range)}
                >
                  {t(`assets.detail.chart.range${range}`)}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground">{t('assets.detail.chart.current')}</p>
              <p className="money-number mt-1 text-2xl font-semibold">
                {formatVndShort(currentValue)}
              </p>
            </div>
            <p
              className={cn(
                'text-sm font-medium',
                periodChange >= 0
                  ? 'text-[hsl(var(--status-green))]'
                  : 'text-[hsl(var(--status-red))]',
              )}
            >
              {periodChange >= 0 ? '+' : ''}
              {periodChange.toLocaleString(locale, { maximumFractionDigits: 1 })}%
            </p>
          </div>
          <div className="mt-4">
            <AssetValueChart points={filteredHistory} liquidity={asset.liquidity} />
          </div>
        </Card>

        <Card className="xl:col-span-4">
          <h2 className="section-title text-xl font-semibold">
            {t('assets.detail.info.title')}
          </h2>
          <div className="mt-5 divide-y divide-border">
            <InfoRow label={t('assets.detail.info.type')} value={t(`options.assetType.${asset.type}`)} />
            <InfoRow
              label={t('assets.detail.info.liquidity')}
              value={t(`options.liquidity.${asset.liquidity}`)}
            />
            {position ? (
              <>
                <InfoRow
                  label={t('assets.detail.info.holding')}
                  value={`${position.quantity} ${position.unit}`}
                />
                {position.purchasePrice ? (
                  <InfoRow
                    label={t('assets.detail.info.averagePurchasePrice')}
                    value={formatVndShort(position.purchasePrice)}
                  />
                ) : null}
              </>
            ) : null}
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
            <InfoRow
              label={t('assets.detail.info.priceSource')}
              value={
                isAutoPriced
                  ? t('assets.detail.info.automatic')
                  : t('assets.detail.info.manual')
              }
            />
            {isSold && asset.soldAt ? (
              <InfoRow label={t('assets.detail.info.soldAt')} value={formatDate(asset.soldAt)} />
            ) : null}
          </div>
        </Card>
      </section>

      {asset.type === 'saving_deposit' &&
      asset.calculationTerm &&
      asset.calculationTerm.maturityDate ? (
        <SavingWithdrawalPanel term={asset.calculationTerm} />
      ) : null}

      <section className="grid gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-8">
          <h2 className="section-title text-xl font-semibold">
            {t('assets.detail.events.title')}
          </h2>

          {relatedEvents.length > 0 ? (
            <div className="mt-5 divide-y divide-border">
              {relatedEvents.map((entry) => (
                <ActivityRow key={entry.id} entry={entry} locale={locale} />
              ))}
            </div>
          ) : (
            <p className="mt-5 rounded-2xl bg-muted px-4 py-8 text-center text-sm text-muted-foreground">
              {t('assets.detail.events.empty')}
            </p>
          )}
        </Card>

        <Card className="xl:col-span-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="section-title text-xl font-semibold">
                {t('assets.detail.notes.title')}
              </h2>
            </div>
            <Button variant="ghost" size="sm" onClick={() => openEdit(asset.id)}>
              {t('common.edit')}
            </Button>
          </div>
          <div className="mt-5 rounded-2xl bg-muted p-4">
            <p className="text-sm leading-6 text-muted-foreground">
              {asset.note || t('common.noNote')}
            </p>
          </div>
        </Card>
      </section>

      <AssetFormDialog
        key={formOpen ? (isEditing ? 'edit-open' : 'create-open') : 'closed'}
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        form={form}
        setValue={setValue}
        mode={mode}
        walletOptions={walletOptions}
        isEditing={isEditing}
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

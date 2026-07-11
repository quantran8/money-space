import { ArrowDownLeft, ArrowUpRight, ChevronLeft, Pencil, Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useAssetDetail } from '@/features/assets/hooks/use-asset-detail'
import type { AssetEventEntry } from '@/features/assets/hooks/use-asset-detail'
import { useAssetsPage } from '@/features/assets/hooks/use-assets-page'
import { AssetFormDialog } from '@/features/assets/ui/components/asset-form-dialog'
import { AssetValueChart } from '@/features/assets/ui/components/asset-value-chart'
import { SavingWithdrawalPanel } from '@/features/assets/ui/components/saving-withdrawal-panel'
import { formatDate } from '@/features/debts/model/debts-form'
import { formatVndShort } from '@/shared/lib/format-money'

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium text-foreground">{value}</span>
    </div>
  )
}

function EventRow({ entry }: { entry: AssetEventEntry }) {
  const { t } = useTranslation()
  const isInflow = entry.amount > 0
  return (
    <li className="flex items-center gap-3 py-3">
      <div
        className={
          isInflow
            ? 'flex size-9 shrink-0 items-center justify-center rounded-full bg-[hsla(var(--status-green),0.12)]'
            : 'flex size-9 shrink-0 items-center justify-center rounded-full bg-[hsla(var(--status-orange),0.12)]'
        }
      >
        {isInflow ? (
          <ArrowDownLeft className="size-4 text-[hsl(var(--status-green))]" strokeWidth={1.8} />
        ) : (
          <ArrowUpRight className="size-4 text-[hsl(var(--status-orange))]" strokeWidth={1.8} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{entry.title}</p>
        <p className="text-xs text-muted-foreground">
          {t(`options.eventType.${entry.type}`, { defaultValue: entry.type })} ·{' '}
          {formatDate(entry.isoDate)}
        </p>
      </div>
      <span
        className={
          isInflow
            ? 'money-number shrink-0 text-sm font-semibold text-[hsl(var(--status-green))]'
            : 'money-number shrink-0 text-sm font-semibold text-[hsl(var(--status-orange))]'
        }
      >
        {isInflow ? '+' : '-'}
        {formatVndShort(Math.abs(entry.amount))}
      </span>
    </li>
  )
}

export function AssetDetailPage() {
  const { assetId } = useParams<{ assetId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const {
    asset,
    currentValue,
    relatedEvents,
    valueHistory,
    totalInflow,
    totalOutflow,
    isLoading,
  } = useAssetDetail(assetId)

  // Reuse the assets page's form machinery so editing opens the dialog in place.
  const {
    form,
    setValue,
    mode,
    previewValue,
    walletOptions,
    isEditing,
    isSubmitting,
    submit,
    formOpen,
    openEdit,
    handleFormOpenChange,
  } = useAssetsPage()

  if (isLoading && !asset) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 animate-pulse rounded-full bg-muted" />
        <div className="h-40 animate-pulse rounded-[24px] bg-muted" />
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
        <div className="rounded-[24px] border border-border/80 bg-card px-6 py-10 text-center">
          <p className="text-lg font-semibold text-foreground">{t('assets.detail.notFound.title')}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('assets.detail.notFound.description')}
          </p>
        </div>
      </div>
    )
  }

  const isAutoPriced = asset.valuationMode !== 'manual'
  const isSold = asset.status === 'sold'

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          className="-ml-2 w-fit gap-1"
          onClick={() => navigate('/assets')}
        >
          <ChevronLeft className="size-4" />
          {t('assets.detail.back')}
        </Button>

        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="page-title text-3xl font-semibold tracking-[-0.03em]">{asset.name}</h1>
              <Badge variant="outline">{t(`options.assetType.${asset.type}`)}</Badge>
              <Badge>{t(`options.liquidity.${asset.liquidity}`)}</Badge>
              {isAutoPriced ? (
                <Badge className="bg-[hsla(var(--accent),0.12)] text-[hsl(var(--accent))]">
                  <Sparkles className="mr-1 size-3" />
                  {t('assets.list.autoPriced')}
                </Badge>
              ) : null}
              {isSold ? (
                <Badge className="bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
                  {t('options.assetStatus.sold')}
                </Badge>
              ) : null}
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {asset.note || t('common.noNote')}
            </p>
          </div>

          <Button onClick={() => openEdit(asset.id)}>
            <Pencil className="mr-2 size-4" />
            {t('common.edit')}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-7">
          <Card>
            <div className="mb-6">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                {t('assets.detail.chart.eyebrow')}
              </p>
              <h2 className="section-title mt-1 text-2xl font-semibold">
                {t('assets.detail.chart.title')}
              </h2>
              <p className="money-number mt-1 text-xl font-semibold text-foreground">
                {formatVndShort(currentValue)}
              </p>
            </div>
            <AssetValueChart points={valueHistory} liquidity={asset.liquidity} />
          </Card>

          <Card>
            <p className="text-[15px] font-semibold tracking-[-0.02em] text-foreground">
              {t('assets.detail.info.title')}
            </p>
            <div className="mt-1">
              <Row label={t('assets.detail.info.currentValue')} value={`${formatVndShort(currentValue)} đ`} />
              <Separator />
              <Row label={t('assets.detail.info.type')} value={t(`options.assetType.${asset.type}`)} />
              <Separator />
              <Row label={t('assets.detail.info.liquidity')} value={t(`options.liquidity.${asset.liquidity}`)} />

              {asset.marketPosition ? (
                <>
                  <Separator />
                  <Row
                    label={t('assets.detail.info.holding')}
                    value={`${asset.marketPosition.quantity} ${asset.marketPosition.unit} · ${asset.marketPosition.symbol}`}
                  />
                </>
              ) : null}

              {asset.calculationTerm ? (
                <>
                  <Separator />
                  <Row
                    label={t('assets.detail.info.interestRate')}
                    value={`${asset.calculationTerm.interestRate}%/năm`}
                  />
                  <Separator />
                  <Row
                    label={t('assets.detail.info.interestPayment')}
                    value={t(
                      `options.interestPayment.${asset.calculationTerm.interestPayment}`,
                    )}
                  />
                  {asset.type === 'saving_deposit' ? (
                    <>
                      <Separator />
                      <Row
                        label={t('assets.detail.info.nonTermRate')}
                        value={`${asset.calculationTerm.nonTermRate}%/năm`}
                      />
                    </>
                  ) : null}
                  {asset.calculationTerm.maturityDate ? (
                    <>
                      <Separator />
                      <Row
                        label={t('assets.detail.info.maturity')}
                        value={formatDate(asset.calculationTerm.maturityDate)}
                      />
                    </>
                  ) : null}
                </>
              ) : null}

              {isSold && asset.soldAt ? (
                <>
                  <Separator />
                  <Row label={t('assets.detail.info.soldAt')} value={formatDate(asset.soldAt)} />
                </>
              ) : null}
            </div>
          </Card>

          {asset.type === 'saving_deposit' &&
          asset.calculationTerm &&
          asset.calculationTerm.maturityDate ? (
            <SavingWithdrawalPanel term={asset.calculationTerm} />
          ) : null}
        </div>

        <div className="space-y-4 lg:col-span-5">
          <Card>
            <div className="flex items-center justify-between gap-2">
              <p className="text-[15px] font-semibold tracking-[-0.02em] text-foreground">
                {t('assets.detail.events.title')}
              </p>
              {relatedEvents.length > 0 ? (
                <span className="text-xs text-muted-foreground">
                  {t('assets.detail.events.count', { count: relatedEvents.length })}
                </span>
              ) : null}
            </div>

            {relatedEvents.length > 0 ? (
              <>
                <div className="mt-3 flex gap-3">
                  <div className="flex-1 rounded-[16px] bg-[hsla(var(--status-green),0.08)] px-3 py-2">
                    <p className="text-xs text-muted-foreground">{t('assets.detail.events.inflow')}</p>
                    <p className="money-number text-sm font-semibold text-[hsl(var(--status-green))]">
                      +{formatVndShort(totalInflow)}
                    </p>
                  </div>
                  <div className="flex-1 rounded-[16px] bg-[hsla(var(--status-orange),0.08)] px-3 py-2">
                    <p className="text-xs text-muted-foreground">{t('assets.detail.events.outflow')}</p>
                    <p className="money-number text-sm font-semibold text-[hsl(var(--status-orange))]">
                      -{formatVndShort(totalOutflow)}
                    </p>
                  </div>
                </div>
                <ul className="mt-1 divide-y divide-border/70">
                  {relatedEvents.map((entry) => (
                    <EventRow key={entry.id} entry={entry} />
                  ))}
                </ul>
              </>
            ) : (
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {t('assets.detail.events.empty')}
              </p>
            )}
          </Card>
        </div>
      </div>

      <AssetFormDialog
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        form={form}
        setValue={setValue}
        mode={mode}
        previewValue={previewValue}
        walletOptions={walletOptions}
        isEditing={isEditing}
        isSubmitting={isSubmitting}
        onSubmit={submit}
      />
    </div>
  )
}

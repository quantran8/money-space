import { useTranslation } from 'react-i18next'

import { Label, Panel, PanelHeader } from '@/components/ui/panel'
import { formatVndScale } from '@money-space/core/shared/lib/format-money'

type AssetsSummaryStripProps = {
  total: number
  assetCount: number
  totalDebt: number
  debtCount: number
  asOf: string
}

export function AssetsSummaryStrip({
  total,
  assetCount,
  totalDebt,
  debtCount,
  asOf,
}: AssetsSummaryStripProps) {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage?.startsWith('en') ? 'en-US' : 'vi-VN'
  const updatedAt = new Date(asOf).toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  return (
    <Panel>
      <PanelHeader title={t('assets.demo.overview')} meta={updatedAt} />
      <div className="mt-7 grid gap-5 sm:grid-cols-3 sm:gap-0">
        <Metric
          label={t('assets.demo.assets')}
          value={formatVndScale(total)}
          note={t('assets.demo.assetCount', { count: assetCount })}
          className="sm:pr-7"
        />
        <Metric
          label={t('assets.demo.debt')}
          value={formatVndScale(totalDebt)}
          note={t('assets.demo.debtCount', { count: debtCount })}
          className="sm:border-l sm:border-divider sm:px-7"
        />
        <Metric
          label={t('assets.demo.netWorth')}
          value={formatVndScale(total - totalDebt)}
          note={t('assets.demo.netWorthNote')}
          className="sm:border-l sm:border-divider sm:pl-7"
        />
      </div>
    </Panel>
  )
}

function Metric({
  label,
  value,
  note,
  className,
}: {
  label: string
  value: string
  note: string
  className?: string
}) {
  return (
    <div className={className}>
      <Label>{label}</Label>
      <p className="money-number mt-2 text-[30px]">{value}</p>
      <p className="mt-2 text-[12px] leading-5 text-ink2">{note}</p>
    </div>
  )
}

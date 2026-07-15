import { useTranslation } from 'react-i18next'

import type { AssetTotals } from '@/features/assets/model/assets-form'
import { liquidityColors } from '@/shared/constants/colors'
import { formatVndShort } from '@/shared/lib/format-money'

type AssetsSummaryStripProps = {
  totals: AssetTotals
  total: number
  asOf: string
}

export function AssetsSummaryStrip({ totals, total, asOf }: AssetsSummaryStripProps) {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage?.startsWith('en') ? 'en-US' : 'vi-VN'
  const updatedAt = new Date(asOf).toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const buckets = [
    { key: 'usableNow', value: totals.usable_now, color: liquidityColors.usable_now },
    {
      key: 'reserve',
      value: totals.not_immediately_usable,
      color: liquidityColors.not_immediately_usable,
    },
    { key: 'longTerm', value: totals.long_term, color: liquidityColors.long_term },
  ] as const

  return (
    <section className="overflow-hidden rounded-[28px] bg-[#1d1d1f] p-6 text-white shadow-[0_14px_38px_rgba(0,0,0,0.08)] sm:p-8">
      <div className="grid gap-8 xl:grid-cols-[1.15fr_1fr] xl:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-medium text-white/45">{t('assets.strip.total')}</p>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/55">
              {t('assets.strip.updatedAt', { value: updatedAt })}
            </span>
          </div>
          <p className="money-number mt-4 text-5xl font-semibold tracking-[-0.055em] text-white sm:text-6xl">
            {formatVndShort(total)}
          </p>
          <p className="mt-4 max-w-lg text-sm leading-6 text-white/45">
            {t('assets.strip.description')}
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-3 sm:gap-3">
          {buckets.map((bucket) => {
            const share = total > 0 ? Math.round((bucket.value / total) * 100) : 0
            return (
              <div key={bucket.key} className="border-l border-white/10 pl-4">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full" style={{ backgroundColor: bucket.color }} />
                  <p className="text-xs text-white/45">{t(`assets.strip.${bucket.key}`)}</p>
                </div>
                <p className="money-number mt-3 text-xl font-semibold text-white">
                  {formatVndShort(bucket.value)}
                </p>
                <p className="mt-1 text-xs text-white/30">
                  {t('assets.strip.share', { value: share })}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

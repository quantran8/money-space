import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { AssetTotals } from '@/features/assets/model/assets-form'
import { snapshotTotal } from '@/features/assets/model/assets'
import type { AssetSnapshotPoint } from '@/features/assets/model/assets.types'
import { liquidityColors } from '@/shared/constants/colors'
import { formatVndShort } from '@/shared/lib/format-money'

type AssetsSummaryStripProps = {
  totals: AssetTotals
  total: number
  asOf: string
  snapshots: AssetSnapshotPoint[]
}

export function AssetsSummaryStrip({ totals, total, asOf, snapshots }: AssetsSummaryStripProps) {
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
  const firstSnapshotTotal = snapshots[0] ? snapshotTotal(snapshots[0]) : null
  const change = firstSnapshotTotal === null ? null : total - firstSnapshotTotal
  const changeIsPositive = (change ?? 0) >= 0
  const ChangeIcon = changeIsPositive ? ArrowUpRight : ArrowDownRight

  return (
    <section className="relative overflow-hidden rounded-[34px] border border-white/80 bg-[linear-gradient(125deg,#ffffff_12%,#f2f8ff_58%,#effbf5_100%)] p-6 text-foreground shadow-[0_20px_60px_rgba(34,74,110,0.08)] sm:p-9 lg:p-10">
      <div className="pointer-events-none absolute -right-20 -top-28 size-80 rounded-full bg-[#8fd8ff]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-1/3 size-80 rounded-full bg-[#8ee8b5]/20 blur-3xl" />
      <div className="relative">
      <div className="grid gap-8 xl:grid-cols-[1.15fr_1fr] xl:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-medium text-muted-foreground">{t('assets.strip.total')}</p>
            <span className="rounded-full border border-white/80 bg-white/55 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-[0_4px_16px_rgba(34,74,110,0.04)] backdrop-blur-xl">
              {t('assets.strip.updatedAt', { value: updatedAt })}
            </span>
          </div>
          <div className="mt-5 flex flex-wrap items-end gap-4">
            <p className="money-number text-[52px] font-semibold leading-none tracking-[-0.065em] text-[#111214] sm:text-[68px]">
              {formatVndShort(total)}
            </p>
            {change !== null ? (
              <span className={`mb-1 inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold sm:text-sm ${changeIsPositive ? 'border-emerald-200/70 bg-emerald-100/70 text-emerald-700' : 'border-red-200/70 bg-red-100/70 text-red-700'}`}>
                <ChangeIcon className="size-4" />
                {t('assets.strip.changeFromFirst', {
                  value: `${changeIsPositive ? '+' : ''}${formatVndShort(change)}`,
                })}
              </span>
            ) : null}
          </div>
          <p className="mt-4 max-w-lg text-sm leading-6 text-muted-foreground">
            {t('assets.strip.description')}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {buckets.map((bucket) => {
            const share = total > 0 ? Math.round((bucket.value / total) * 100) : 0
            return (
              <div key={bucket.key} className="rounded-[22px] border border-white/80 bg-white/55 p-4 shadow-[0_10px_30px_rgba(34,74,110,0.06)] backdrop-blur-xl">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full" style={{ backgroundColor: bucket.color }} />
                  <p className="text-xs font-medium text-muted-foreground">{t(`assets.strip.${bucket.key}`)}</p>
                </div>
                <p className="money-number mt-3 text-xl font-semibold text-foreground">
                  {formatVndShort(bucket.value)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('assets.strip.share', { value: share })}
                </p>
              </div>
            )
          })}
        </div>
      </div>
      </div>
    </section>
  )
}

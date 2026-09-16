import type { ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight, ReceiptText, WalletCards } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Panel } from '@/components/ui/panel'
import { AssetCompositionChart } from '@/features/assets/ui/components/asset-composition-chart'
import type { AssetTotals } from '@money-space/core/features/assets/model/assets-form'
import {
  isPreviousDayOf,
  toneForValueChange,
} from '@money-space/core/features/assets/model/assets'
import type { AssetValueChangeTotal } from '@money-space/core/features/assets/model/assets.types'
import { liquidityRampColors } from '@money-space/core/shared/constants/colors'
import {
  formatPercentSigned,
  formatVndScale,
} from '@money-space/core/shared/lib/format-money'
import { cn } from '@money-space/core/shared/lib/utils'

type AssetsSummaryStripProps = {
  total: number
  totals: AssetTotals
  totalDebt: number
  asOf: string
  /** Assets tab only: a market move says nothing about the debts half. */
  valueChange?: AssetValueChangeTotal | null
}

/** A bare `YYYY-MM-DD` as a short local date. */
function formatDayLabel(isoDate: string, locale: string) {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
  })
}

/** Two-sided colouring — see memory/asset-valuation.md. */
function dayChangeToneClass(delta: number): string | undefined {
  const tone = toneForValueChange(delta)
  if (tone === 'positive') return 'text-positive-ink'
  if (tone === 'alert') return 'text-alert-ink'
  return undefined
}

/** One "Tổng …" tile: wash bed, icon, label, figure. */
function MetricTile({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="wash p-4">
      <div className="flex items-center gap-2">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-control bg-card text-ink2">
          {icon}
        </span>
        <span className="t-body-sm text-ink2">{label}</span>
      </div>
      <p className="money-number mt-4 t-metric">{value}</p>
    </div>
  )
}

/**
 * Net worth as the hero, its two operands as tiles, and the liquidity split.
 * See memory/assets.md, "The net-worth strip leads with one figure".
 */
export function AssetsSummaryStrip({
  total,
  totals,
  totalDebt,
  asOf,
  valueChange = null,
}: AssetsSummaryStripProps) {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage?.startsWith('en') ? 'en-US' : 'vi-VN'
  // Scale, not exact: this sits beside the hero and is never reconciled here.
  const dayChangeText = valueChange
    ? `${valueChange.delta > 0 ? '+' : valueChange.delta < 0 ? '−' : ''}${formatVndScale(Math.abs(valueChange.delta))}${
        valueChange.deltaPercent === null
          ? ''
          : ` · ${formatPercentSigned(valueChange.deltaPercent, locale)}`
      }`
    : ''
  const changeTone = valueChange ? toneForValueChange(valueChange.delta) : null
  const updatedAt = new Date(asOf).toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  return (
    // Padding sits on each half, not on the card: the divider between the two
    // columns has to reach the card's edges to read as a split.
    <Panel className="overflow-hidden p-0">
      {/* The card's one title, spanning both halves: the liquidity split is
          detail supporting this figure, not a section of its own. */}
      <div className="flex items-center justify-between gap-4 px-5 pt-5 sm:px-6">
        <h2 className="t-subtitle">{t('assets.demo.netWorth')}</h2>
        <span className="num shrink-0 t-caption text-ink3">
          {t('assets.strip.updatedAt', { value: updatedAt })}
        </span>
      </div>

      <div className="grid lg:grid-cols-[0.92fr_1.08fr]">
        <div className="border-b border-divider px-5 pb-5 pt-4 sm:px-6 sm:pb-6 lg:border-b-0 lg:border-r">
          <div>
            <div className="min-w-0">
              <p className="money-number t-hero">{formatVndScale(total - totalDebt)}</p>

              {valueChange ? (
                <p
                  className={cn(
                    'mt-4 inline-flex items-center gap-2 rounded-pill px-3 py-2 t-body-sm',
                    changeTone === 'positive'
                      ? 'bg-positive-tint'
                      : changeTone === 'alert'
                        ? 'bg-alert-tint'
                        : 'bg-wash',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-5 shrink-0 items-center justify-center rounded-pill bg-card',
                      dayChangeToneClass(valueChange.delta),
                    )}
                  >
                    {valueChange.delta < 0 ? (
                      <ArrowDownRight className="size-3.5" />
                    ) : (
                      <ArrowUpRight className="size-3.5" />
                    )}
                  </span>
                  <span className={cn('num font-medium', dayChangeToneClass(valueChange.delta))}>
                    {dayChangeText}
                  </span>
                  <span className="t-caption text-ink3">
                    {isPreviousDayOf(valueChange.previousDate ?? '', asOf)
                      ? t('assets.summary.dayChangeSuffix')
                      : t('assets.summary.changeSinceSuffix', {
                          date: formatDayLabel(valueChange.previousDate ?? '', locale),
                        })}
                    {/* The total covers only the holdings that had a baseline. */}
                    {valueChange.missingCount > 0
                      ? ` ${t('assets.summary.dayChangePartial', {
                          count: valueChange.missingCount,
                        })}`
                      : ''}
                  </span>
                </p>
              ) : null}
            </div>
          </div>

          {/* The two operands the headline is made of, each in its own tile. */}
          <div className="mt-7 grid grid-cols-2 gap-3">
            <MetricTile
              icon={<WalletCards className="size-4" />}
              label={t('assets.demo.totalAssetsLabel')}
              value={formatVndScale(total)}
            />
            <MetricTile
              icon={<ReceiptText className="size-4" />}
              label={t('assets.demo.totalDebtLabel')}
              value={formatVndScale(totalDebt)}
            />
          </div>
        </div>

        {/* No heading of its own — the card is titled once, above. Centred:
            this half is shorter than the left, so it would otherwise ride up
            against the top of the divider. */}
        <div className="flex flex-col justify-center px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
          {/* The single-hue ramp, not the three-token default: beside the
              net-worth hero this block is a breakdown, not a set of
              categories, and one accent stepping down reads as one quantity
              split three ways. */}
          <AssetCompositionChart
            totals={totals}
            colors={liquidityRampColors}
            legendLabel={t('assets.demo.byLiquidity')}
          />
        </div>
      </div>
    </Panel>
  )
}

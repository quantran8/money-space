import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { MoneyCompositionBar } from '@/components/ui/money-composition-bar'
import { Label, Panel, PanelSplit } from '@/components/ui/panel'
import { SourceFreshnessList } from '@/components/ui/source-freshness-list'
import { buildCoverage, buildMoneyComposition } from '@/features/dashboard/model/home-derivations'
import type { DataFreshnessResult } from '@/features/freshness/model/freshness.types'
import type { FlexibleMoneyResult } from '@/features/forecast/model/forecast.types'
import { formatVndScale, splitVndScale } from '@/shared/lib/format-money'
import { cn } from '@/shared/lib/utils'

/**
 * Home section 1 — Bức tranh hôm nay (§12.1).
 *
 * Carries the largest visual anchor on the page: flexible money at 64px, with
 * its unit set separately and smaller so the figure itself is what the eye
 * lands on. The order inside is fixed and not negotiable on mobile either
 * (§15): hero → what it is out of → which sources it came from → how the money
 * splits. The source block must never fall below the fold, because every number
 * here is an output of those same sources (§2.15).
 *
 * v11 drops the two status chips that used to sit above the hero. They stated a
 * verdict ("Nhà mình đang ổn") before the reader had seen anything to verify it
 * against, and both axes they carried are now shown as facts instead: staleness
 * is named source by source in the block below, and the state of the month is
 * the low point in §12.2, which says what happens and when.
 */
export function FinancialPictureSection({
  flexibleMoney,
  freshness,
  onQuickUpdate,
}: {
  flexibleMoney: FlexibleMoneyResult
  freshness?: DataFreshnessResult
  onQuickUpdate: () => void
}) {
  const { t } = useTranslation()

  const composition = buildMoneyComposition(flexibleMoney, {
    committed: t('home.picture.composition.committed'),
    flexible: t('home.picture.composition.flexible'),
  })
  const coverage = freshness ? buildCoverage(freshness) : undefined

  const flexible = flexibleMoney.lowestProjectedBalance
  const isNegative = flexible < 0
  const hero = splitVndScale(flexible)

  /** "35 ngày" / "hôm nay" / "chưa cập nhật" — always a number when there is one (§10.5). */
  const formatAge = (days: number | null) => {
    if (days === null) return t('time.never')
    if (days <= 0) return t('time.today')
    if (days === 1) return t('time.yesterday')
    return t('time.daysAgo', { count: days })
  }

  return (
    <Panel>
      <h2 className="section-title text-[16px]">{t('home.picture.title')}</h2>

      <PanelSplit>
        <div>
          <Label>{t('home.picture.flexibleLabel')}</Label>

          {/* Never dimmed when data is stale — this is still the best figure
              the household has (§2.15). */}
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <span
              className={cn(
                'num text-[52px] leading-[.9] font-medium tracking-[-.04em] sm:text-[64px]',
                isNegative && 'text-alert',
              )}
            >
              {hero.amount}
            </span>
            {hero.unit ? (
              <span
                className={cn(
                  'pb-1 text-[22px] font-medium sm:text-[28px]',
                  isNegative && 'text-alert',
                )}
              >
                {hero.unit}
              </span>
            ) : null}
          </div>

          <p className="mt-3 text-[13px] leading-5 text-ink2">
            {t('home.picture.totals', { cash: formatVndScale(composition.totalLiquid) })}
          </p>

          {coverage && coverage.total > 0 ? (
            <SourceFreshnessList
              rows={coverage.rows}
              formatAge={formatAge}
              formatValue={formatVndScale}
              summary={
                coverage.oldestDays === null
                  ? t('home.coverage.summaryNoAge', { count: coverage.total })
                  : t('home.coverage.summary', {
                      count: coverage.total,
                      days: coverage.oldestDays,
                    })
              }
              action={
                coverage.hasStale ? (
                  <button
                    type="button"
                    onClick={onQuickUpdate}
                    className="text-[13px] font-medium text-accent"
                  >
                    {t('home.coverage.action')}
                  </button>
                ) : undefined
              }
              overflow={
                coverage.total > coverage.rows.length ? (
                  <Link to="/networth" className="text-[13px] font-medium text-accent">
                    {t('home.coverage.more', { count: coverage.total - coverage.rows.length })}
                  </Link>
                ) : undefined
              }
              footnote={t('home.coverage.excluded')}
            />
          ) : null}
        </div>

        <div>
          <MoneyCompositionBar
            segments={composition.segments}
            formatAmount={formatVndScale}
            ariaLabel={t('home.picture.composition.aria', {
              committed: formatVndScale(composition.segments[0].amount),
              flexible: formatVndScale(composition.segments[1].amount),
            })}
          />
        </div>
      </PanelSplit>
    </Panel>
  )
}

import { useTranslation } from 'react-i18next'

import { MoneyCompositionBar } from '@/components/ui/money-composition-bar'
import { Label, Panel } from '@/components/ui/panel'
import { SourceCoverageStrip } from '@/components/ui/source-coverage-strip'
import { StatusChip } from '@/components/ui/status-chip'
import {
  buildCoverage,
  buildMoneyComposition,
} from '@/features/dashboard/model/home-derivations'
import type { DataFreshnessResult } from '@/features/freshness/model/freshness.types'
import type {
  FinancialStateResult,
  FlexibleMoneyResult,
} from '@/features/forecast/model/forecast.types'
import { formatVndScale } from '@/shared/lib/format-money'
import { cn } from '@/shared/lib/utils'

/**
 * Home section 1 — Bức tranh hôm nay (§12.1).
 *
 * Carries the largest visual anchor on the page: flexible money at 64px. The
 * order inside is fixed and not negotiable on mobile either — chips → hero →
 * coverage strip → composition (§15). The coverage strip must never fall below
 * the fold, because every number here is an output of those same sources.
 *
 * The two chips at the top are INDEPENDENT axes (§1.2): the household can be
 * fine on stale data, or in trouble on fresh data. They are never merged.
 */
export function FinancialPictureSection({
  flexibleMoney,
  financialState,
  freshness,
  netWorth,
  onQuickUpdate,
}: {
  flexibleMoney: FlexibleMoneyResult
  financialState?: FinancialStateResult
  freshness?: DataFreshnessResult
  /** Only shown when the household has non-liquid assets or debts. */
  netWorth?: number
  onQuickUpdate: () => void
}) {
  const { t } = useTranslation()

  const composition = buildMoneyComposition(flexibleMoney, {
    committed: t('home.picture.composition.committed'),
    protect: t('home.picture.composition.protect'),
    flexible: t('home.picture.composition.flexible'),
  })
  const coverage = freshness ? buildCoverage(freshness) : undefined

  const flexible = flexibleMoney.flexibleMoneyHorizon
  const isNegative = flexible < 0

  return (
    <Panel>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <StatusChip tone={financialStateTone(financialState?.state)}>
          {t(`home.state.${financialState?.state ?? 'incomplete'}`)}
        </StatusChip>

        {coverage && coverage.hasStale ? (
          <StatusChip tone="attention">
            {t('home.state.sourcesNeedUpdate', { count: coverage.staleCount })}
          </StatusChip>
        ) : null}
      </div>

      <div className="mt-7 grid gap-x-14 gap-y-9 lg:grid-cols-[minmax(0,380px)_1fr]">
        <div>
          <Label>{t('home.picture.flexibleLabel')}</Label>

          {/* Never dimmed when data is stale — this is still the best figure
              the household has (§2.15). */}
          <div className="mt-4 flex flex-wrap items-baseline gap-3">
            <span
              className={cn(
                'num text-[64px] leading-[.86] font-medium tracking-[-.04em]',
                isNegative && 'text-alert',
              )}
            >
              {formatVndScale(flexible)}
            </span>
          </div>

          <p className="mt-5 text-[13px] text-ink2">
            {netWorth === undefined
              ? t('home.picture.totals', {
                  cash: formatVndScale(composition.totalLiquid),
                })
              : t('home.picture.totalsWithNetWorth', {
                  cash: formatVndScale(composition.totalLiquid),
                  netWorth: formatVndScale(netWorth),
                })}
          </p>

          {coverage && coverage.total > 0 ? (
            <SourceCoverageStrip
              sources={coverage.sources}
              ariaLabel={
                coverage.hasStale
                  ? t('home.coverage.aria', {
                      total: coverage.total,
                      fresh: coverage.freshCount,
                      stale: coverage.staleCount,
                    })
                  : t('home.coverage.ariaAllFresh', { total: coverage.total })
              }
              summary={
                coverage.hasStale ? (
                  <>
                    {t('home.coverage.mixed', {
                      total: coverage.total,
                      fresh: coverage.freshCount,
                      stale: coverage.staleCount,
                    })}
                  </>
                ) : (
                  t('home.coverage.allFresh', { total: coverage.total })
                )
              }
              caveat={
                coverage.hasStale && coverage.staleNames.length > 0
                  ? coverage.staleNames.length <= 2
                    ? t('home.coverage.caveat', { names: coverage.staleNames.join(' và ') })
                    : t('home.coverage.caveatOverflow', {
                        names: coverage.staleNames.slice(0, 2).join(', '),
                        count: coverage.staleNames.length - 2,
                      })
                  : undefined
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
            />
          ) : null}
        </div>

        <div className="lg:pt-1">
          <MoneyCompositionBar
            segments={composition.segments}
            formatAmount={formatVndScale}
            ariaLabel={t('home.picture.composition.aria', {
              committed: formatVndScale(composition.segments[0].amount),
              protect: formatVndScale(composition.segments[1].amount),
              flexible: formatVndScale(composition.segments[2].amount),
            })}
          />

        </div>
      </div>
    </Panel>
  )
}

function financialStateTone(state?: FinancialStateResult['state']) {
  if (state === 'tight') return 'alert' as const
  if (state === 'watch') return 'attention' as const
  if (state === 'on_track') return 'accent' as const
  return 'neutral' as const
}

import { Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import {
  buildCoverage,
  buildMoneyComposition,
} from '@money-space/core/features/dashboard/model/home-derivations'
import { canProjectBalance } from '@money-space/core/features/forecast/model/forecast-presentation'
import type { FlexibleMoneyResult } from '@money-space/core/features/forecast/model/forecast.types'
import type { DataFreshnessResult } from '@money-space/core/features/freshness/model/freshness.types'
import { formatVndScale, splitVndScale } from '@money-space/core/shared/lib/format-money'
import { cn } from '@money-space/core/shared/lib/utils'

import { Label, MoneyCompositionRing, Panel } from '@/components/ui'
import { CoverageBlock } from '@/features/freshness/ui/coverage-block'

/**
 * Home section 1 — Bức tranh hôm nay (§12.1).
 *
 * The page's one visual anchor: flexible money, set larger than anything else
 * on the screen, with its unit smaller and separate so the eye lands on the
 * figure rather than on "triệu".
 *
 * The internal order is fixed and does not negotiate on a phone (§15):
 * hero → what it is out of → which sources it came from → how the money splits.
 * The coverage block must never fall below the fold, because every number above
 * it is an output of those same sources (§2.15) — which is why it is collapsed
 * rather than moved.
 *
 * The web renders the hero and the composition ring as two columns. At 335pt
 * there is one column, and the ring goes UNDER the hero: the hero is what is
 * read first and the ring is what explains it, so stacking them keeps the
 * reading order the split was expressing.
 */
export function FinancialPictureSection({
  flexibleMoney,
  freshness,
  onQuickUpdate,
  isConfirming = false,
}: {
  flexibleMoney: FlexibleMoneyResult
  freshness?: DataFreshnessResult
  onQuickUpdate: () => void
  isConfirming?: boolean
}) {
  const { t } = useTranslation()

  const composition = buildMoneyComposition(flexibleMoney, {
    committed: t('home.picture.composition.committed'),
    flexible: t('home.picture.composition.flexible'),
  })
  const coverage = freshness ? buildCoverage(freshness) : undefined

  /**
   * The hero, with goal money taken out.
   *
   * `lowestProjectedBalance` only removes bills, so money already set aside
   * behind a goal was being offered back as free money. Both terms are measured
   * at the same point by the server, so nothing is subtracted twice.
   *
   * **NOT clamped.** A negative figure means more is committed than is held,
   * and that is the signal this screen exists to show. `buildMoneyComposition`
   * floors its bar SEGMENTS at 0 because a bar is a split of what exists; that
   * is a rule about widths and grants no licence to clamp this number.
   */
  const flexible =
    flexibleMoney.lowestProjectedBalance - (flexibleMoney.goalCommitments ?? 0)

  /**
   * ...but only when there is a balance to subtract FROM. With no `usable_now`
   * asset the chain starts from a 0 that no wallet stands behind, so the hero
   * would render the outflows negated — money the household never said it had.
   * Withheld and named, never guessed (§23).
   */
  const canProject = canProjectBalance(flexibleMoney.usableNowAssetCount)
  const isNegative = canProject && flexible < 0
  const hero = canProject ? splitVndScale(flexible) : { amount: '—', unit: '' }

  return (
    <Panel>
      <Text className="t-title text-ink">{t('home.picture.title')}</Text>

      <View className="mt-7">
        <Label>{t('home.picture.flexibleLabel')}</Label>

        {/* Never dimmed when a source is stale — this is still the best figure
            the household has, and a caveat names what is missing (§23). */}
        <View className="mt-2.5 flex-row flex-wrap items-end gap-x-2">
          <Text
            className={cn('t-display', isNegative ? 'text-alert-ink' : 'text-ink')}
            // The web hero overrides the step's tracking with -.045em.
            style={{ fontVariant: ['tabular-nums'], letterSpacing: -3.24 }}
          >
            {hero.amount}
          </Text>
          {hero.unit ? (
            <Text
              className={cn(
                'pb-2 t-metric',
                isNegative ? 'text-alert-ink' : 'text-ink',
              )}
            >
              {hero.unit}
            </Text>
          ) : null}
        </View>

        <Text className="mt-2.5 t-body-sm leading-5 text-ink2">
          {canProject
            ? t('home.picture.totals', { cash: formatVndScale(composition.totalLiquid) })
            : t('home.picture.noSource')}
        </Text>
      </View>

      <MoneyCompositionRing
        className="mt-8"
        segments={composition.segments}
        formatAmount={formatVndScale}
        centerLabel={t('home.picture.composition.ringCenter')}
        ariaLabel={t('home.picture.composition.aria', {
          committed: formatVndScale(composition.segments[0].amount),
          flexible: formatVndScale(composition.segments[1].amount),
        })}
      />

      {/* Last in the section, as on the web: the sources both the hero and the
          ring are computed from, naming what the figures above rest on. */}
      {coverage ? (
        <CoverageBlock
          className="mt-6"
          coverage={coverage}
          onQuickUpdate={onQuickUpdate}
          isUpdating={isConfirming}
        />
      ) : null}

    </Panel>
  )
}

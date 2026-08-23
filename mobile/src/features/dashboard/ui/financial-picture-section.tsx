import { Pressable, Text, View } from 'react-native'
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

import { Label, MoneyCompositionBar, Panel } from '@/components/ui'
import { CoverageBlock } from '@/features/freshness/ui/coverage-block'
import { TOUCH_TARGET } from '@/theme/tokens'

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
 * The web renders the hero and the composition bar as two columns. At 335pt
 * there is one column, and the bar goes UNDER the hero: the hero is what is
 * read first and the bar is what explains it, so stacking them keeps the
 * reading order the split was expressing.
 */
export function FinancialPictureSection({
  flexibleMoney,
  freshness,
  onQuickUpdate,
  isConfirming = false,
  onSimulate,
}: {
  flexibleMoney: FlexibleMoneyResult
  freshness?: DataFreshnessResult
  onQuickUpdate: () => void
  isConfirming?: boolean
  /** Opens what-if. Omitted → the entry is not offered (§2.9). */
  onSimulate?: () => void
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
      <Text className="text-[16px] font-medium text-ink">{t('home.picture.title')}</Text>

      <View className="mt-5">
        <Label>{t('home.picture.flexibleLabel')}</Label>

        {/* Never dimmed when a source is stale — this is still the best figure
            the household has, and a caveat names what is missing (§23). */}
        <View className="mt-2.5 flex-row flex-wrap items-end gap-x-2">
          <Text
            className={cn('text-[48px] font-medium', isNegative ? 'text-alert' : 'text-ink')}
            style={{
              fontVariant: ['tabular-nums'],
              letterSpacing: -1.92,
              lineHeight: 50,
            }}
          >
            {hero.amount}
          </Text>
          {hero.unit ? (
            <Text
              className={cn(
                'pb-1 text-[20px] font-medium',
                isNegative ? 'text-alert' : 'text-ink',
              )}
            >
              {hero.unit}
            </Text>
          ) : null}
        </View>

        <Text className="mt-2.5 text-[14px] leading-5 text-ink2">
          {canProject
            ? t('home.picture.totals', { cash: formatVndScale(composition.totalLiquid) })
            : t('home.picture.noSource')}
        </Text>
      </View>

      {/* The sources both the hero and the bar are computed from, so the block
          spans the whole section rather than sitting beside either one. */}
      {coverage ? (
        <CoverageBlock
          className="mt-5"
          coverage={coverage}
          onQuickUpdate={onQuickUpdate}
          isUpdating={isConfirming}
        />
      ) : null}

      <MoneyCompositionBar
        className="mt-5"
        segments={composition.segments}
        formatValue={formatVndScale}
      />

      {/* What-if is an ACTION inside this section, never a sixth section: a
          consequence must not render before the household asks for it (§2.9).
          The sheet itself belongs to the what-if feature. */}
      {onSimulate ? (
        <Pressable
          onPress={onSimulate}
          accessibilityRole="button"
          style={{ minHeight: TOUCH_TARGET }}
          className="mt-2 justify-center active:opacity-70"
        >
          <Text className="text-[14px] font-medium text-interactive">
            {t('home.picture.simulate')}
          </Text>
        </Pressable>
      ) : null}
    </Panel>
  )
}

import { Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { canProjectBalance } from '@money-space/core/features/forecast/model/forecast-presentation'
import type { ForecastResult } from '@money-space/core/features/forecast/model/forecast.types'
import { formatMoney } from '@money-space/core/shared/lib/format-money'
import { cn } from '@money-space/core/shared/lib/utils'

import { Button, Money, Panel, PanelHeader, SummaryStrip } from '@/components/ui'
import { formatDayMonth } from '@/features/forecast/lib/forecast-dates'

/**
 * Incoming · outgoing · the projected low point (§26).
 *
 * The low point is the section's ANCHOR, not one tile of three. Design §12
 * forbids styling up one cell of a metric group — if a figure genuinely
 * outranks the others it sits outside the group, which is exactly the case
 * here: it is the primary read of the whole screen, and "vào" / "ra" are the
 * context for it.
 *
 * ## Two things this must never do
 *
 * **Never clamp.** `lowestProjectedBalance` may be negative and stays negative;
 * the red figure is the signal the product exists to show.
 *
 * **Never fabricate a zero.** With no `usable_now` wallet there is no balance
 * for a projection to be about — zero wallets is NOT a wallet holding 0đ, but
 * both sum to a `startingLiquidBalance` of 0 (`canProjectBalance`). That is
 * design §6.3 dependency-missing, not empty: the events stay on screen, the
 * metric says "Chưa tính được", one line names what is missing and one action
 * fixes it. `Tiền vào` / `Tiền ra` are unaffected — they are sums of real
 * events and do not need a balance to exist.
 */
export function ForecastSummary({
  forecast,
  onAddSource,
}: {
  forecast: ForecastResult
  /** Offered only in the dependency-missing state, where it is the fix. */
  onAddSource?: () => void
}) {
  const { t } = useTranslation()

  const hasLiquidSource = canProjectBalance(forecast.usableNowAssetCount)
  const isShortfall = forecast.lowestProjectedBalance < 0

  return (
    <Panel>
      <PanelHeader
        title={t('upcoming.summary.title')}
        right={
          <Text className="font-mono text-[11px] text-ink3">
            {`${formatDayMonth(forecast.asOfDate)}–${formatDayMonth(forecast.horizonEndDate)}`}
          </Text>
        }
      />

      <View className="mt-5">
        <Text className="text-[13px] text-ink2">{t('upcoming.summary.lowest')}</Text>

        {hasLiquidSource ? (
          <>
            {/* Never clamped, never `Math.max(0, …)`. A negative low point is
                the point of the screen, and `--alert` is reserved for exactly
                this — an actual projected shortfall, nothing else. */}
            <Money className={cn('mt-1', isShortfall && 'text-alert')} size={30}>
              {formatMoney(forecast.lowestProjectedBalance)}
            </Money>
            <Text className="mt-1 text-[12px] leading-5 text-ink2">
              {t('upcoming.summary.lowestNote', {
                date: formatDayMonth(forecast.lowestProjectedBalanceDate),
              })}
            </Text>
          </>
        ) : (
          <>
            {/* Words, not an em dash. "—" as the primary answer reads as zero
                (§6.3); the sentence below says what is actually missing. */}
            <Text className="mt-1 text-[19px] font-medium text-ink2">
              {t('home.upcoming.lowestUnavailable')}
            </Text>
            <Text className="mt-1 text-[12px] leading-5 text-ink2">
              {t('upcoming.summary.lowestNoSource')}
            </Text>
            {onAddSource ? (
              <Button className="mt-3 self-start px-4" variant="ghost" onPress={onAddSource}>
                {t('home.upcoming.addSource')}
              </Button>
            ) : null}
          </>
        )}
      </View>

      <SummaryStrip
        className="mt-5"
        items={[
          {
            key: 'incoming',
            label: t('upcoming.summary.incoming'),
            value: formatMoney(forecast.totals.upcomingIncomeAmount),
          },
          {
            key: 'outgoing',
            label: t('upcoming.summary.outgoing'),
            value: formatMoney(forecast.totals.upcomingOutgoingAmount),
          },
        ]}
      />

      {/* Each strip tile gets one line, so the two scope notes sit under the
          strip rather than crowding a 47%-wide tile with money in it. */}
      <View className="mt-2 gap-0.5">
        <Text className="text-[11px] leading-4 text-ink3">
          {t('upcoming.summary.incomingNote')}
        </Text>
        <Text className="text-[11px] leading-4 text-ink3">
          {t('upcoming.summary.outgoingNote', {
            required: formatMoney(forecast.totals.requiredOutgoingAmount),
          })}
        </Text>
      </View>
    </Panel>
  )
}

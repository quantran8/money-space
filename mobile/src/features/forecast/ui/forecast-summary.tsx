import { Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { canProjectBalance } from '@money-space/core/features/forecast/model/forecast-presentation'
import type { RangeSummary } from '@money-space/core/features/forecast/model/forecast-range'
import type { ForecastResult } from '@money-space/core/features/forecast/model/forecast.types'
import { formatVndShort } from '@money-space/core/shared/lib/format-money'
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
 *
 * Every figure is read from `summary`, the window the RANGE PICKER selected —
 * not from `forecast.totals`, which covers the whole fetched horizon. Those two
 * disagree whenever the range is anything but the default, and showing a total
 * for a period the label does not name is the failure §34 is about.
 */
export function ForecastSummary({
  forecast,
  summary,
  onAddSource,
}: {
  forecast: ForecastResult
  /** Figures for the SELECTED window, not the whole fetched horizon. */
  summary: RangeSummary
  /** Offered only in the dependency-missing state, where it is the fix. */
  onAddSource?: () => void
}) {
  const { t } = useTranslation()

  const hasLiquidSource = canProjectBalance(forecast.usableNowAssetCount)
  const isShortfall = summary.lowest < 0

  return (
    <Panel>
      {/* The range is NOT restated here. It is set once in the picker above and
          shown there; repeating it in a section header is the same fact twice
          (§34). */}
      <PanelHeader title={t('upcoming.summary.title')} />

      <View className="mt-5">
        <Text className="t-body-sm text-ink2">{t('upcoming.summary.lowest')}</Text>

        {hasLiquidSource ? (
          <>
            {/* Never clamped, never `Math.max(0, …)`. A negative low point is
                the point of the screen, and `--alert` is reserved for exactly
                this — an actual projected shortfall, nothing else. */}
            <Money className={cn('mt-1', isShortfall && 'text-alert-ink')} step="metric">
              {formatVndShort(summary.lowest)}
            </Money>
            <Text className="mt-1 t-caption leading-5 text-ink2">
              {t('upcoming.summary.lowestNote', {
                date: formatDayMonth(summary.lowestDate),
              })}
            </Text>
          </>
        ) : (
          <>
            {/* Words, not an em dash. "—" as the primary answer reads as zero
                (§6.3); the sentence below says what is actually missing. */}
            <Text className="mt-1 t-subtitle text-ink2">
              {t('home.upcoming.lowestUnavailable')}
            </Text>
            <Text className="mt-1 t-caption leading-5 text-ink2">
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
            value: formatVndShort(summary.incoming),
          },
          {
            key: 'outgoing',
            label: t('upcoming.summary.outgoing'),
            value: formatVndShort(summary.outgoing),
          },
        ]}
      />

      {/* Each strip tile gets one line, so the two scope notes sit under the
          strip rather than crowding a 47%-wide tile with money in it. */}
      <View className="mt-2 gap-0.5">
        <Text className="t-caption-sm leading-4 text-ink3">
          {summary.incomingCount === 0
            ? t('upcoming.summary.noneKnown')
            : t('upcoming.summary.knownCount', { count: summary.incomingCount })}
        </Text>
        <Text className="t-caption-sm leading-4 text-ink3">
          {summary.outgoingCount === 0
            ? t('upcoming.summary.noneKnown')
            : t('upcoming.summary.knownCount', { count: summary.outgoingCount })}
        </Text>
      </View>

      {/* The window asked for runs past what can be projected, so the figures
          above describe a shorter period than the label. Said plainly rather
          than left for the reader to infer from a date (§23, §48). */}
      {summary.truncated ? (
        <Text className="mt-4 t-caption leading-5 text-attention-ink">
          {t('upcoming.summary.truncated', { date: formatDayMonth(summary.coveredEnd) })}
        </Text>
      ) : null}
    </Panel>
  )
}

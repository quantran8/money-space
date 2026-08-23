import { Pressable, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import type { CoverageSummary } from '@money-space/core/features/dashboard/model/home-derivations'
import { formatVndScale } from '@money-space/core/shared/lib/format-money'

import { Collapsible, RowMeta } from '@/components/ui'
import { TOUCH_TARGET } from '@/theme/tokens'

/**
 * `Cần cập nhật` — the sources the hero is computed FROM, named and counted
 * (§11.5, §2.15).
 *
 * It sits directly under the hero inside `Bức tranh hôm nay`, never below the
 * fold and never as a section of its own: every figure in that panel is an
 * output of these sources, so a block that qualifies them cannot be scrolled
 * away from the numbers it qualifies.
 *
 * Collapsed by default. The summary line states the two facts on its own — how
 * many sources, and how old the oldest is — so opening the list is for the
 * reader checking the arithmetic, not for the one reading the answer. On a
 * phone that is not a nicety: an open table of every source pushes `30 ngày
 * tới` off the screen entirely.
 *
 * The rows come from `buildCoverage`, which filters on `liquidity ===
 * 'usable_now'` and nothing else. That is the household's own per-asset
 * decision, so a bank account they set aside is absent here and a gold bar they
 * would sell is present — filtering by asset type would quietly overrule them.
 */
export function CoverageBlock({
  coverage,
  onQuickUpdate,
  isUpdating = false,
  className,
}: {
  coverage: CoverageSummary
  /** Confirms every stale source is unchanged (§14.5). Not a value edit. */
  onQuickUpdate: () => void
  isUpdating?: boolean
  className?: string
}) {
  const { t } = useTranslation()

  if (coverage.total === 0) return null

  return (
    <View className={className}>
      <Collapsible
        showLabel={t('home.coverage.show')}
        hideLabel={t('home.coverage.hide')}
        summary={
          // Built from parts rather than one interpolated string: the count and
          // the age are two separate facts, and each is weighted on its own.
          <View className="flex-row flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
            <Text className="text-[14px] font-medium text-ink">
              {t('home.coverage.sourceCount', { count: coverage.total })}
            </Text>
            {coverage.oldestDays !== null ? (
              <>
                <Text className="text-[14px] text-ink3">·</Text>
                <Text className="text-[14px] text-ink2">{t('home.coverage.oldest')}</Text>
                {/* Amber only once the oldest source is past the household's
                    OWN threshold — never a fixed number of days (§5.2). */}
                <Age days={coverage.oldestDays} tone={coverage.hasStale ? 'attention' : 'ink'} />
              </>
            ) : null}
          </View>
        }
      >
        <View className="gap-1">
          {coverage.rows.map((row) => (
            <View key={row.id} className="flex-row items-center gap-3 py-1.5">
              <View className="flex-1">
                <Text className="text-[14px] text-ink" numberOfLines={1}>
                  {row.name}
                </Text>
                <View className="mt-0.5 flex-row">
                  <Age days={row.days} tone={row.isStale ? 'attention' : 'ink3'} small />
                </View>
              </View>

              {/* Money never truncates: it gets its own right-aligned lane and
                  the name is what clips if either has to (§6). */}
              {row.value === undefined ? null : (
                <Text
                  className="text-[14px] text-ink2"
                  style={{ fontVariant: ['tabular-nums'] }}
                >
                  {formatVndScale(row.value)}
                </Text>
              )}
            </View>
          ))}
        </View>

        <Text className="mt-3 text-[11px] leading-4 text-ink3">
          {t('home.coverage.excluded')}
        </Text>
      </Collapsible>

      {/* The one action the block offers, outside the fold so it is reachable
          without opening the list. "Vẫn như cũ", never a nag: a stale value is
          a fact about the data, not a failing of the household. */}
      {coverage.hasStale ? (
        <Pressable
          onPress={isUpdating ? undefined : onQuickUpdate}
          accessibilityRole="button"
          accessibilityState={{ busy: isUpdating }}
          style={{ minHeight: TOUCH_TARGET }}
          className="justify-center active:opacity-70"
        >
          <Text className="text-[14px] font-medium text-interactive">
            {isUpdating ? t('home.upcoming.overdue.marking') : t('home.coverage.action')}
          </Text>
        </Pressable>
      ) : null}
    </View>
  )
}

/**
 * "6 ngày trước" / "hôm nay" / "chưa cập nhật".
 *
 * Always spoken, never a bare integer — and therefore never mono: these are
 * Vietnamese phrases with diacritics, and IBM Plex Mono must not touch them
 * (§5). `RowMetaMono` is for dates and counts, which this is not.
 */
function Age({
  days,
  tone,
  small = false,
}: {
  days: number | null
  tone: 'ink' | 'ink3' | 'attention'
  small?: boolean
}) {
  const { t } = useTranslation()

  const label =
    days === null
      ? t('time.never')
      : days <= 0
        ? t('time.today')
        : days === 1
          ? t('time.yesterday')
          : t('time.daysAgo', { count: days })

  const color = { ink: 'text-ink', ink3: 'text-ink3', attention: 'text-attention' }[tone]
  const weight = tone === 'attention' || tone === 'ink' ? 'font-medium' : ''

  return small ? (
    <RowMeta>
      <Text className={`${color} ${weight}`}>{label}</Text>
    </RowMeta>
  ) : (
    <Text className={`text-[14px] ${color} ${weight}`}>{label}</Text>
  )
}

import { Pressable, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import type { GoalTrack } from '@money-space/core/features/dashboard/model/home-derivations'
import { formatVndScale } from '@money-space/core/shared/lib/format-money'
import { cn } from '@money-space/core/shared/lib/utils'

import { MetricCell, Panel, PanelHeader, ProgressBar } from '@/components/ui'
import { colors, TOUCH_TARGET } from '@/theme/tokens'

/**
 * Home section 3 — Mục tiêu chính (§12.3).
 *
 * A straight track per goal, never a ring. A ring shows one goal well and three
 * goals not at all: the eye cannot compare arc lengths, and the shape leaves
 * nowhere to put the only mark that matters here — where progress needs to be
 * TODAY for the goal to land on time. On a straight track that mark is a tick,
 * and "behind" becomes a distance read without arithmetic.
 *
 * The pair of amounts under the name is what says how far along a goal is; a
 * percentage alone hides whether 60% is of 200 triệu or of 5 tỷ. The percentage
 * is metadata, and it sits under the fraction rather than in a third column —
 * at 335pt a name, two money values and a percentage on one row is how money
 * ends up truncated (§6).
 */
export function GoalsSection({
  tracks,
  goalCount,
  earmarkedForGoals,
  onViewAll,
  onOpenGoal,
}: {
  tracks: GoalTrack[]
  goalCount: number
  /** Money already pointed at a goal. Display only — net worth is unchanged. */
  earmarkedForGoals?: number
  onViewAll: () => void
  onOpenGoal: (goalId: string) => void
}) {
  const { t } = useTranslation()

  const hasMilestone = tracks.some((track) => track.requiredPercent !== undefined)
  // Only once money has actually been pointed at a goal — a household with
  // none does not need a cell reading 0 (§23).
  const showSplit = typeof earmarkedForGoals === 'number' && earmarkedForGoals > 0

  return (
    <Panel>
      <PanelHeader
        title={t('home.goals.title')}
        right={
          <Pressable
            onPress={onViewAll}
            accessibilityRole="button"
            style={{ minHeight: TOUCH_TARGET }}
            className="justify-center active:opacity-70"
          >
            <Text className="text-[13px] font-medium text-interactive">
              {goalCount > tracks.length
                ? t('home.goals.viewAll', { count: goalCount })
                : t('home.goals.details')}
            </Text>
          </Pressable>
        }
      />

      {/* Where the household's money stands relative to its goals. Deliberately
          NOT framed as a deduction: nothing has been spent — this only says how
          much already has a job. */}
      {showSplit ? (
        <MetricCell
          className="mt-5"
          label={t('home.goals.earmarked')}
          value={formatVndScale(earmarkedForGoals)}
        />
      ) : null}

      <View className="mt-4 gap-1">
        {tracks.map((track) => (
          <GoalTrackRow key={track.id} track={track} onPress={() => onOpenGoal(track.id)} />
        ))}
      </View>

      {hasMilestone ? (
        <View className="mt-4 flex-row items-center gap-2">
          <View
            className="h-3 w-0.5 rounded-full"
            style={{ backgroundColor: colors.ink }}
          />
          <Text className="flex-1 text-[12px] leading-4 text-ink3">
            {t('home.goals.milestoneLegend')}
          </Text>
        </View>
      ) : null}
    </Panel>
  )
}

function GoalTrackRow({ track, onPress }: { track: GoalTrack; onPress: () => void }) {
  const { t } = useTranslation()

  // A goal with something in it must never read as 0% — that is the difference
  // between "not started" and "started", which is the whole point early on.
  const percentLabel =
    track.percent === 0 && track.current > 0
      ? t('home.goals.underOnePercent')
      : `${track.percent}%`

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={track.name}
      style={{ minHeight: TOUCH_TARGET }}
      className="rounded-sunk px-3 py-3 active:bg-sunk"
    >
      <View className="flex-row items-center gap-2">
        <Text className="flex-1 text-[14px] font-medium text-ink" numberOfLines={1}>
          {track.name}
        </Text>
        {track.isMain ? (
          <Text className="shrink-0 rounded-full bg-interactive-soft px-2 py-0.5 text-[10px] font-medium text-interactive">
            {t('home.goals.mainBadge')}
          </Text>
        ) : null}
      </View>

      <View className="mt-1.5 flex-row items-baseline gap-2">
        <Text
          className="flex-1 text-[12px] text-ink2"
          style={{ fontVariant: ['tabular-nums'] }}
        >
          {formatVndScale(track.current)} / {formatVndScale(track.target)}
        </Text>
        <Text
          className={cn(
            'font-mono text-[11px]',
            track.behind ? 'text-attention' : 'text-ink3',
          )}
        >
          {percentLabel}
        </Text>
      </View>

      {/* The track and the milestone share one box so the tick lands on the
          same scale as the fill. */}
      <View className="mt-2 justify-center" style={{ height: 12 }}>
        <ProgressBar
          percent={track.percent}
          tone={track.behind ? 'attention' : 'interactive'}
          label={
            track.requiredPercent === undefined
              ? t('home.goals.trackAria', { percent: track.percent })
              : t('home.goals.trackAriaWithMilestone', {
                  percent: track.percent,
                  required: track.requiredPercent,
                })
          }
        />

        {/* Where progress must stand TODAY to land on the target date, derived
            only from figures the household itself declared. A goal without a
            declared pace gets no milestone rather than being judged against a
            number nobody set (§2.16). */}
        {track.requiredPercent === undefined ? null : (
          <View
            className="absolute h-3 w-0.5 rounded-full"
            style={{
              left: `${track.requiredPercent}%`,
              backgroundColor: colors.ink,
            }}
          />
        )}
      </View>
    </Pressable>
  )
}

import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { Panel, PanelHeader } from '@/components/ui/panel'
import type { GoalTrack } from '@money-space/core/features/dashboard/model/home-derivations'
import { formatVndScale } from '@money-space/core/shared/lib/format-money'
import { cn } from '@money-space/core/shared/lib/utils'

/**
 * Home section 3 — Mục tiêu (§12.3).
 *
 * A straight track per goal, never a ring. A ring shows one goal well and three
 * goals not at all: the eye cannot compare arc lengths, and the shape leaves
 * nowhere to put the only mark that matters here — where progress needs to be
 * TODAY for the goal to land on time. On a straight track that mark is a tick,
 * and "behind" becomes a distance the household reads without doing arithmetic.
 *
 * Percentages are metadata, set in mono at the right. The pair of amounts
 * underneath the name is what actually says how far along a goal is; a
 * percentage alone hides whether 60% is of 200 triệu or of 5 tỷ.
 */
export function GoalsSection({
  tracks,
  goalCount,
  earmarkedForGoals,
}: {
  tracks: GoalTrack[]
  goalCount: number
  /** Money already pointed at a goal. See DashboardOverview — display only. */
  earmarkedForGoals?: number
}) {
  const { t } = useTranslation()

  const hasMilestone = tracks.some((track) => track.requiredPercent !== undefined)
  // Shown only once money has actually been pointed at a goal — a household
  // with no goals does not need a cell reading 0.
  const showSplit =
    typeof earmarkedForGoals === 'number' && earmarkedForGoals > 0

  return (
    <Panel className="h-full">
      <PanelHeader
        title={t('home.goals.title')}
        action={
          <Link
            to="/goals"
            className="inline-flex min-h-11 shrink-0 items-center gap-2 t-body font-medium text-action"
          >
            <span className="text-ink3">{t('home.goals.count', { count: goalCount })}</span>
            {goalCount > tracks.length
              ? t('home.goals.viewAll', { count: goalCount })
              : t('home.goals.details')}
          </Link>
        }
      />

      {/* Where the household's money stands relative to its goals. Deliberately
          NOT framed as a deduction: nothing has been spent and net worth is
          unchanged — this only says how much already has a job.

          Stated as a figure with its label beside it rather than in a metric
          cell: this is the section's one summary number, and a bordered cell
          made it read as a peer of the goal rows below it rather than as the
          total they add up to. */}
      {showSplit ? (
        <div className="mt-6 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
          <span className="num t-figure leading-none tracking-[-.03em]">
            {formatVndScale(earmarkedForGoals!)}
          </span>
          <span className="t-body-sm text-ink2">{t('home.goals.earmarked')}</span>
        </div>
      ) : null}

      <div className="mt-5">
        {tracks.map((track, index) => (
          <div key={track.id} className={cn(index > 0 && 'border-t border-divider')}>
            <GoalTrackRow track={track} />
          </div>
        ))}
      </div>

      {hasMilestone ? (
        <p className="mt-5 flex items-center gap-2 t-caption text-ink3">
          <span className="inline-block h-3 w-[2px] shrink-0 rounded-full bg-ink" />
          {t('home.goals.milestoneLegend')}
        </p>
      ) : null}
    </Panel>
  )
}

function GoalTrackRow({ track }: { track: GoalTrack }) {
  const { t } = useTranslation()

  const tone = track.behind ? 'text-attention' : 'text-ink3'
  // A goal with something in it must never read as 0% — that is the difference
  // between "not started" and "started", which is the whole point early on.
  const percentLabel =
    track.percent === 0 && track.current > 0 ? t('home.goals.underOnePercent') : `${track.percent}%`

  return (
    <div className="rounded-control px-3 py-4 transition-colors hover:bg-wash">
      {/* Name and pace on one line, then the track, then the pair of amounts
          under it. Stacked rather than in three fixed columns: the track needs
          the full row width for the milestone tick to be placeable at all, and
          at 220px the name column was truncating goals that had room to spare. */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <p className="min-w-0 truncate t-body-sm font-medium">{track.name}</p>
        {track.isMain ? (
          /* Same treatment as the goals list (§2.10 — one concept, one
             look); the row sits on `--sunk` on hover, so a sunk badge
             would disappear into it. */
          <span className="shrink-0 rounded-full bg-accent-soft px-2 py-0.5 t-caption-sm font-medium text-action">
            {t('home.goals.mainBadge')}
          </span>
        ) : null}

        {/* Pace as a fact, never a verdict: it names where the goal stands
            against the household's OWN declared pace, and a goal with no
            declared pace gets no dot rather than being judged (§16). */}
        {track.requiredPercent === undefined ? null : (
          <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 t-caption font-medium text-ink2">
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                track.behind ? 'bg-attention' : 'bg-positive',
              )}
            />
            {track.behind ? t('home.goals.paceBehind') : t('home.goals.paceOnTrack')}
          </span>
        )}
      </div>

      <div
        className="goal-progress relative mt-2"
        data-behind={track.behind ? 'true' : undefined}
        style={{ '--progress': `${track.percent}%` } as CSSProperties}
        role="img"
        aria-label={
          track.requiredPercent === undefined
            ? t('home.goals.trackAria', { percent: track.percent })
            : t('home.goals.trackAriaWithMilestone', {
                percent: track.percent,
                required: track.requiredPercent,
              })
        }
      >
        {track.requiredPercent === undefined ? null : (
          /* Pace marker: full-height so it reads against the ticks. */
          <span
            className="absolute inset-y-0 z-10 w-[2px] rounded-full bg-ink"
            style={{ left: `${track.requiredPercent}%` }}
          />
        )}
      </div>

      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="num t-caption text-ink2">
          <span className="font-medium text-ink">{formatVndScale(track.current)}</span> /{' '}
          {formatVndScale(track.target)}
        </p>
        <span className={cn('font-mono t-caption-sm', tone)}>{percentLabel}</span>
      </div>
    </div>
  )
}

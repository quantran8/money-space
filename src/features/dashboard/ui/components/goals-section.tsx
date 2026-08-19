import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { Panel, PanelHeader } from '@/components/ui/panel'
import type { GoalTrack } from '@/features/dashboard/model/home-derivations'
import { MetricCell } from '@/components/ui/metric-cell'
import { formatVndScale } from '@/shared/lib/format-money'
import { cn } from '@/shared/lib/utils'

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
  unassigned,
}: {
  tracks: GoalTrack[]
  goalCount: number
  /** Money already pointed at a goal. See DashboardOverview — display only. */
  earmarkedForGoals?: number
  /** What is left over. */
  unassigned?: number
}) {
  const { t } = useTranslation()

  const hasMilestone = tracks.some((track) => track.requiredPercent !== undefined)
  // Shown only once there is something to split — a household with no goals
  // does not need to be told that all of its money is unassigned.
  const showSplit =
    typeof earmarkedForGoals === 'number' &&
    typeof unassigned === 'number' &&
    earmarkedForGoals > 0

  return (
    <Panel>
      <PanelHeader
        title={t('home.goals.title')}
        action={
          <Link
            to="/goals"
            className="inline-flex min-h-11 items-center text-[13px] font-medium text-accent"
          >
            {goalCount > tracks.length
              ? t('home.goals.viewAll', { count: goalCount })
              : t('home.goals.details')}
          </Link>
        }
      />

      {/* Where the household's money stands relative to its goals. Deliberately
          NOT framed as a deduction: nothing has been spent and net worth is
          unchanged — this only says how much already has a job. Two metric
          cells so it reads at the same level as every other pair of figures
          in the app (§11.2 — a breakdown lives on `--sunk`). */}
      {showSplit ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <MetricCell
            label={t('home.goals.earmarked')}
            value={formatVndScale(earmarkedForGoals!)}
          />
          <MetricCell
            label={t('home.goals.unassigned')}
            value={formatVndScale(unassigned!)}
          />
        </div>
      ) : null}

      <div className="mt-5 space-y-1">
        {tracks.map((track) => (
          <GoalTrackRow key={track.id} track={track} />
        ))}
      </div>

      {hasMilestone ? (
        <p className="mt-5 flex items-center gap-2 text-[12px] text-ink3">
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
    <div className="rounded-sunk px-3 py-4 transition-colors hover:bg-sunk">
      <div className="grid gap-3 sm:grid-cols-[220px_1fr_52px] sm:items-center">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-[14px] font-medium">{track.name}</p>
            {track.isMain ? (
              /* Same treatment as the goals list (§2.10 — one concept, one
                 look); the row sits on `--sunk` on hover, so a sunk badge
                 would disappear into it. */
              <span className="shrink-0 rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-medium text-accent">
                {t('home.goals.mainBadge')}
              </span>
            ) : null}
          </div>
          <p className="num mt-1.5 text-[12px] text-ink2">
            {formatVndScale(track.current)} / {formatVndScale(track.target)}
          </p>
        </div>

        <div
          className="relative h-1.5 rounded-full bg-sunk"
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
          <div
            className={cn(
              'seg h-full min-w-[3px] rounded-full',
              track.behind ? 'bg-attention' : 'bg-accent',
            )}
            style={{ width: `${track.percent}%` }}
          />
          {track.requiredPercent === undefined ? null : (
            <span
              className="absolute -top-[3px] h-3 w-[2px] rounded-full bg-ink"
              style={{ left: `${track.requiredPercent}%` }}
            />
          )}
        </div>

        <div className={cn('font-mono text-[11px] sm:text-right', tone)}>{percentLabel}</div>
      </div>
    </div>
  )
}

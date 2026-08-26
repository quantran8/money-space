import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Panel } from '@/components/ui/panel'
import type { ScheduledOutflowImpact } from '@money-space/core/features/goals/api/goals.repository'
import { formatAmount } from '@money-space/core/features/goals/model/goals-form'

/**
 * What money already scheduled to leave this goal's wallets will cost it.
 *
 * ## Why one section instead of a note on every figure
 *
 * A scheduled outflow moves several numbers on this screen at once — the total
 * held, this month's pace, the wallet each card reports. The first attempt hung
 * a projected figure off each of them, and it read badly: the same fact restated
 * three times, never explained once, with the cause — a named bill, on a date —
 * having nowhere to live. The household was left assembling the story from
 * fragments.
 *
 * So every figure elsewhere stays ACTUAL (the wallet as it stands; money that
 * has not moved has not been spent), and this is the single place that says what
 * is coming and why.
 *
 * ## Why it collapses
 *
 * The headline — a date, a wallet, an amount, and where the goal lands after —
 * is the whole answer for a household that just wants to know the damage. The
 * before/after breakdown is for the one who wants to check the arithmetic, and
 * keeping it folded stops a single scheduled bill from outweighing the goal's
 * own figures on the page above it.
 *
 * ## What it deliberately does NOT touch
 *
 * The long-range projection — the finish date and the "20,0 tr/tháng" line on
 * the chart — keeps using the DECLARED pace. A squeezed month is this month
 * only: the wallet refills, and projecting a one-month dip across years would
 * report a pessimistic finish date the household never chose. This section says
 * the month is short; it does not re-forecast the goal.
 *
 * Renders nothing when nothing is scheduled — the server sends `null`, so a
 * household with no bills never sees a speculative block.
 */
export function GoalScheduledOutflowsSection({
  impact,
  target,
}: {
  impact: ScheduledOutflowImpact | null
  /** The goal's target, so before/after can be stated as a percentage too. */
  target: number
}) {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)

  if (!impact || impact.events.length === 0) return null

  const locale = i18n.resolvedLanguage?.startsWith('en') ? 'en-US' : 'vi-VN'
  const percent = (value: number) =>
    target > 0
      ? new Intl.NumberFormat(locale, {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        }).format(Math.min(Math.max((value / target) * 100, 0), 100))
      : null

  // The single most useful event to name in the summary: the largest, since it
  // is the one most worth recognising and possibly changing.
  const lead = [...impact.events].sort((a, b) => b.amount - a.amount)[0]

  return (
    <Panel>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full flex-wrap items-start justify-between gap-4 text-left"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="t-title">
              {t('goals.scheduledOutflows.heading')}
            </h2>
            <span className="rounded-full bg-attention-soft px-2 py-0.5 t-caption-sm font-medium text-attention">
              {t('goals.scheduledOutflows.count', { count: impact.events.length })}
            </span>
          </div>

          {/* The whole answer on one line: when, from which wallet, how much,
              and where the goal stands afterwards. */}
          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 t-body-sm">
            <span className="font-mono t-caption-sm text-ink3">{dayMonth(lead.expectedDate)}</span>
            <span className="font-medium">{lead.assetName}</span>
            <span className="text-ink3">·</span>
            <span className="num font-medium text-alert">
              −{formatAmount(impact.outflowAmount)}
            </span>
            <span className="text-ink3">·</span>
            <span className="text-ink2">{t('goals.scheduledOutflows.after')}</span>
            <span className="num font-medium">
              {formatAmount(impact.projectedAmount)}
              {percent(impact.projectedAmount) ? ` · ${percent(impact.projectedAmount)}%` : ''}
            </span>
          </div>
        </div>

        <span className="flex shrink-0 items-center gap-2 pt-0.5 t-caption text-ink3">
          <span className="hidden sm:inline">
            {open ? t('goals.scheduledOutflows.hide') : t('goals.scheduledOutflows.show')}
          </span>
          <ChevronDown
            className={`size-4 transition-transform ${open ? 'rotate-180' : ''}`}
            strokeWidth={1.75}
          />
        </span>
      </button>

      {open ? (
        <div className="mt-7">
          <p className="t-body-sm leading-5 text-ink2">
            {t('goals.scheduledOutflows.description')}
          </p>

          {/* Before and after, side by side. Stating both in full beats a
              strikethrough pair: the household reads two complete pictures
              rather than reconstructing one from edits to the other. */}
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {/* Only the "after" half is tinted. Wash here was making the pair
                look symmetrical, which is decoration — the contrast IS the
                message, so the unchanged side stays on the panel (§2.4). */}
            <div className="p-4">
              <p className="label-vi">{t('goals.scheduledOutflows.beforeLabel')}</p>
              <ImpactFigures
                held={impact.currentAmount}
                pace={impact.currentPace}
                target={target}
                percent={percent}
              />
            </div>

            <div className="rounded-control bg-attention-soft p-4">
              <div className="flex items-baseline justify-between gap-4">
                <p className="label-vi text-attention">{t('goals.scheduledOutflows.afterLabel')}</p>
                <span className="num t-caption-sm font-medium text-attention">
                  −{formatAmount(impact.outflowAmount)}
                </span>
              </div>
              <ImpactFigures
                held={impact.projectedAmount}
                pace={impact.projectedPace}
                target={target}
                percent={percent}
              />
            </div>
          </div>

          {/* The bills themselves. Naming them is what makes the block explain
              rather than merely assert — the household can recognise the spend
              and go change it if the trade is not one they want. */}
          <ul className="mt-4 space-y-2 border-t border-divider pt-4">
            {impact.events.map((event) => (
              <li
                key={event.id}
                className="flex items-baseline justify-between gap-4 t-caption leading-5"
              >
                <span className="min-w-0 truncate text-ink2">
                  <span className="font-mono t-caption-sm text-ink3">
                    {dayMonth(event.expectedDate)}
                  </span>{' '}
                  {event.name}
                  <span className="text-ink3">
                    {' · '}
                    {t('goals.scheduledOutflows.fromWallet', { wallet: event.assetName })}
                  </span>
                </span>
                <span className="num shrink-0 text-ink2">{formatAmount(event.amount)}</span>
              </li>
            ))}
          </ul>

          <p className="mt-3 t-caption leading-5 text-ink3">
            {t('goals.scheduledOutflows.paceNote')}
          </p>
        </div>
      ) : null}
    </Panel>
  )
}

/** The same four readings on both sides, so the two columns line up row by row. */
function ImpactFigures({
  held,
  pace,
  target,
  percent,
}: {
  held: number
  pace: number
  target: number
  percent: (value: number) => string | null
}) {
  const { t } = useTranslation()
  const remaining = Math.max(target - held, 0)
  const share = percent(held)

  return (
    <dl className="mt-4 space-y-3 t-body-sm">
      <Figure label={t('goals.scheduledOutflows.totalLabel')} value={formatAmount(held)} />
      <Figure label={t('goals.scheduledOutflows.remainingLabel')} value={formatAmount(remaining)} />
      {share ? (
        <Figure label={t('goals.scheduledOutflows.percentLabel')} value={`${share}%`} />
      ) : null}
      <Figure label={t('goals.scheduledOutflows.paceLabel')} value={formatAmount(pace)} />
    </dl>
  )
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-ink2">{label}</dt>
      <dd className="num font-medium">{value}</dd>
    </div>
  )
}

/** `'2026-08-25'` → `'25/08'`. */
function dayMonth(iso: string): string {
  const [, month, day] = iso.split('-')
  return month && day ? `${day.slice(0, 2)}/${month}` : iso
}

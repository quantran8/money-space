import { ArrowUpRight, CalendarClock, ChevronRight, MessageCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import type { UpcomingPaymentItem } from '@/features/payments/model/payments.types'
import { dueDate } from '@/features/dashboard/model/dashboard'

type DiscussItem = {
  to: string
  title: string
  line: string
}

type AttentionSectionProps = {
  payments: UpcomingPaymentItem[]
  upcomingCount: number
  upcomingTotalLabel: string
  discussItem: DiscussItem | null
  discussCount: number
}

/** Parse a "10/07/2026"-style due string into just the day number for the pill. */
function dayOf(due: string) {
  const day = dueDate(due).split('/')[0]?.replace(/\D/g, '')
  return day && day.length ? day : '·'
}

/**
 * "Cần chú ý" + "Cần bàn" (mockup `#attention`): a warm-toned priority panel
 * listing the nearest upcoming payments, beside a dark "to discuss" card wired
 * to the single most material open item (largest debt, else the main goal).
 */
export function AttentionSection({
  payments,
  upcomingCount,
  upcomingTotalLabel,
  discussItem,
  discussCount,
}: AttentionSectionProps) {
  const { t } = useTranslation()
  const visible = payments.slice(0, 3)
  const remaining = Math.max(0, payments.length - visible.length)

  return (
    <section
      aria-labelledby="attention-title"
      className="rounded-[28px] bg-[hsla(var(--status-orange),0.05)] p-5 sm:p-6"
    >
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-full bg-card text-[hsl(var(--status-orange))] shadow-sm">
            <CalendarClock className="size-5" strokeWidth={1.8} />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[hsl(var(--status-orange))]">
              {t('dashboard.sections.attention.eyebrow')}
            </p>
            <h2
              id="attention-title"
              className="section-title mt-1.5 text-2xl font-semibold sm:text-3xl"
            >
              {t('dashboard.sections.attention.title')}
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
              {t('dashboard.sections.attention.summary', {
                count: upcomingCount,
                amount: upcomingTotalLabel,
              })}
            </p>
          </div>
        </div>
        <Link
          to="/payments"
          className="inline-flex min-h-11 shrink-0 items-center gap-1 self-start rounded-full bg-card px-4 text-sm font-medium text-[hsl(var(--status-orange))] shadow-sm transition hover:opacity-80"
        >
          {t('dashboard.sections.attention.viewAll')}
          <ChevronRight className="size-4" strokeWidth={1.8} />
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.45fr_1fr]">
        {/* Upcoming payments list */}
        <div className="divide-y divide-[hsl(var(--border))] overflow-hidden rounded-2xl bg-card">
          {visible.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
              {t('dashboard.sections.attention.empty')}
            </p>
          ) : (
            visible.map((payment, index) => (
              <Link
                key={payment.id}
                to="/payments"
                className="group flex min-h-[76px] w-full items-center gap-4 px-4 py-3.5 text-left transition hover:bg-black/[0.025]"
              >
                <span
                  className={
                    index === 0
                      ? 'flex size-9 shrink-0 items-center justify-center rounded-full bg-[hsla(var(--status-orange),0.14)] text-[hsl(var(--status-orange))]'
                      : 'flex size-9 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
                  }
                >
                  <span className="text-xs font-bold">{dayOf(payment.due)}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold">{payment.name}</span>
                  <span className="mt-1 block text-sm text-[hsl(var(--muted-foreground))]">
                    {index === 0
                      ? `${t('dashboard.sections.attention.nearest')} · ${dueDate(payment.due)}`
                      : dueDate(payment.due)}
                  </span>
                </span>
                {payment.amount ? (
                  <span className="shrink-0 text-sm font-semibold">{payment.amount}</span>
                ) : null}
                <ChevronRight
                  className="size-4 shrink-0 text-[hsl(var(--muted-foreground))] transition-transform group-hover:translate-x-0.5"
                  strokeWidth={1.8}
                />
              </Link>
            ))
          )}

          {remaining > 0 ? (
            <Link
              to="/payments"
              className="flex min-h-12 items-center justify-center gap-1 px-4 text-sm font-medium text-[hsl(var(--status-orange))] transition hover:bg-[hsla(var(--status-orange),0.05)]"
            >
              {t('dashboard.sections.attention.more', { count: remaining })}
              <ChevronRight className="size-4" strokeWidth={1.8} />
            </Link>
          ) : null}
        </div>

        {/* To discuss */}
        <div className="flex flex-col rounded-2xl bg-[hsl(var(--foreground))] p-5 text-[hsl(var(--background))]">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-white/55">
              <MessageCircle className="size-4" strokeWidth={1.8} />
              {t('dashboard.sections.discuss.title')}
            </span>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold">
              {t('dashboard.sections.discuss.count', { count: discussCount })}
            </span>
          </div>

          {discussItem ? (
            <>
              <div className="mt-10">
                <p className="text-xl font-semibold tracking-[-0.02em]">{discussItem.title}</p>
                <p className="mt-2 text-sm leading-6 text-white/60">{discussItem.line}</p>
              </div>
              <Link
                to={discussItem.to}
                className="mt-8 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[hsl(var(--background))] px-4 text-sm font-semibold text-[hsl(var(--foreground))] transition hover:opacity-90"
              >
                {t('dashboard.sections.discuss.action')}
                <ArrowUpRight className="size-4" strokeWidth={1.8} />
              </Link>
            </>
          ) : (
            <p className="mt-10 text-sm leading-6 text-white/60">
              {t('dashboard.sections.discuss.empty')}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

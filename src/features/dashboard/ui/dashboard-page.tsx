import type { ReactNode } from 'react'
import { ChevronRight, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { AppearGroup, AppearItem } from '@/components/ui/motion'
import { Progress } from '@/components/ui/progress'
import { useDashboardOverview } from '@/features/dashboard/hooks/use-dashboard-overview'
import { useMembers } from '@/features/members/hooks/use-members'
import { NetWorthSparkline } from '@/features/dashboard/ui/net-worth-sparkline'
import { cn } from '@/shared/lib/utils'

function SectionCard({
  title,
  subtitle,
  to,
  className,
  children,
}: {
  title: string
  subtitle: string
  to: string
  className?: string
  children: ReactNode
}) {
  const { t } = useTranslation()

  return (
    <Card className={cn('flex h-full flex-col rounded-[28px] p-5 md:p-6', className)}>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="section-title text-lg font-semibold md:text-xl">{title}</h2>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{subtitle}</p>
        </div>

        <Link
          to={to}
          className="inline-flex items-center whitespace-nowrap text-sm font-semibold text-[hsl(var(--accent))]"
        >
          {t('common.view')}
          <ChevronRight className="ml-0.5 size-4" strokeWidth={1.8} />
        </Link>
      </div>

      <div className="flex-1">{children}</div>
    </Card>
  )
}

function shortDate(value: string) {
  return value.replace('/2026', '')
}

function dueDate(value: string) {
  return value.replace(' Jul', '/07')
}

function parseCompactMillions(value: string) {
  return Number(value.replace('M', '').replace(',', '.'))
}

function formatCompactMillions(value: number) {
  const normalized = Number.isInteger(value) ? String(value) : value.toFixed(1)
  return `${normalized.replace('.', ',')}M`
}

export function DashboardPage() {
  const { t } = useTranslation()
  const { members } = useMembers()
  const {
    snapshot,
    payments,
    goals,
    assetGroups,
    recentEvents: moneyEvents,
    assetTrend,
  } = useDashboardOverview()

  const mainGoal = goals[0]
  const statusVariant =
    snapshot.attentionCount > 2
      ? 'tense'
      : snapshot.attentionCount > 0
        ? 'attention'
        : 'stable'
  const statusKey = `dashboard.status.${statusVariant}`
  const statusLineKey = `dashboard.hero.statusLine.${statusVariant}`
  const statusLabel = t(statusKey)
  const activeMembers = members.filter((member) => member.status === 'active')
  const invitedMembers = members.filter((member) => member.status === 'invited')
  const membersSubtitle = t('members.list.title', {
    active: activeMembers.length,
    invited: invitedMembers.length,
  })
  const attentionTotal = formatCompactMillions(
    payments.reduce((sum, payment) => sum + parseCompactMillions(payment.amount), 0),
  )

  // The hero breaks the total down into the three liquidity buckets so the user
  // sees not just how much, but where the money sits. Sourced from the same
  // asset groups the assets page uses; each row links into the assets detail.
  const breakdown = [
    { label: t('dashboard.sections.money.liquid'), value: assetGroups[0]?.value ?? '24,5M' },
    { label: t('dashboard.sections.money.reserve'), value: assetGroups[1]?.value ?? '86M' },
    { label: t('assets.strip.longTerm'), value: assetGroups[2]?.value ?? '374M' },
  ]

  return (
    <AppearGroup className="space-y-4">
      <AppearItem>
        <div className="px-1">
          <h1 className="section-title text-2xl font-semibold tracking-[-0.03em] md:text-3xl">
            {t('dashboard.title')}
          </h1>
        </div>
      </AppearItem>

      <AppearItem>
        <Card className="apple-shadow overflow-hidden rounded-[28px] p-5 md:p-7">
          <div className="grid gap-6 lg:grid-cols-12 lg:items-stretch">
            {/* Left: total net worth and supporting metrics grouped together
                so the headline and its breakdown read as one block. */}
            <div className="flex min-w-0 flex-1 flex-col lg:col-span-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  className={cn(
                    statusKey === 'dashboard.status.stable' &&
                      'bg-[hsla(var(--status-green),0.1)] text-[hsl(var(--status-green))]',
                    statusKey === 'dashboard.status.attention' &&
                      'bg-[hsla(var(--status-orange),0.12)] text-[hsl(var(--status-orange))]',
                    statusKey === 'dashboard.status.tense' &&
                      'bg-[hsla(var(--status-red),0.1)] text-[hsl(var(--status-red))]',
                  )}
                >
                  {statusLabel}
                </Badge>
                <span className="text-sm text-[hsl(var(--muted-foreground))]">
                  {t('dashboard.updatedAt', { date: shortDate(snapshot.updatedAt) })}
                </span>
              </div>

              <p className="mt-4 text-sm font-medium text-[hsl(var(--muted-foreground))]">
                {t('dashboard.hero.netWorthLabel')}
              </p>
              <p className="money-number mt-2 text-5xl leading-none md:text-6xl">
                {snapshot.netWorthDisplay}
                <span className="ml-2 align-baseline text-2xl text-[hsl(var(--muted-foreground))] md:text-3xl">
                  đ
                </span>
              </p>
              <p className="mt-3 max-w-md text-sm md:text-base text-[hsl(var(--muted-foreground))]">
                {t(statusLineKey)}
              </p>

              <div className="mt-6 flex flex-col gap-3">
                <Link
                  to="/assets"
                  className="divide-y divide-[hsl(var(--border))] overflow-hidden rounded-[24px] bg-[hsl(var(--muted))]"
                >
                  {breakdown.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between gap-3 px-4 py-3.5"
                    >
                      <span className="text-sm text-[hsl(var(--muted-foreground))]">
                        {item.label}
                      </span>
                      <strong className="money-number text-lg">{item.value} đ</strong>
                    </div>
                  ))}
                </Link>

                <Link
                  to="/events"
                  className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-full bg-[hsl(var(--primary))] px-5 text-sm font-semibold text-[hsl(var(--primary-foreground))] shadow-[0_8px_24px_rgba(0,0,0,0.04)] transition-opacity hover:opacity-90"
                >
                  <RefreshCw className="size-4" strokeWidth={1.8} />
                  {t('dashboard.heroButton')}
                </Link>
              </div>
            </div>

            {/* Right: trend chart gets its own column so it reads as the
                visual companion to the headline block on larger screens. */}
            <div className="flex min-h-[190px] flex-col rounded-[24px] bg-[hsl(var(--muted))] p-4 md:p-5 lg:col-span-8">
              <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
                {t('dashboard.sections.money.trend')}
              </p>
              <div className="mt-3 flex flex-1 items-center">
                <NetWorthSparkline snapshots={assetTrend} />
              </div>
            </div>
          </div>
        </Card>
      </AppearItem>

      {/* Row 1 — this-week priority + most recent movement. */}
      <AppearItem>
        <div className="grid gap-4 lg:grid-cols-2">
          <SectionCard
            title={t('dashboard.sections.attention.title')}
            subtitle={t('dashboard.sections.attention.subtitle')}
            to="/payments"
          >
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[24px] bg-[hsl(var(--muted))] px-4 py-3.5">
                  <p className="text-xs font-medium uppercase tracking-[0.08em] text-[hsl(var(--muted-foreground))]">
                    {t('dashboard.sections.attention.totalCount')}
                  </p>
                  <p className="mt-1 text-lg font-semibold tracking-[-0.02em]">
                    {t('dashboard.metrics.paymentsCount', { count: payments.length })}
                  </p>
                </div>

                <div className="rounded-[24px] bg-[hsl(var(--muted))] px-4 py-3.5">
                  <p className="text-xs font-medium uppercase tracking-[0.08em] text-[hsl(var(--muted-foreground))]">
                    {t('dashboard.sections.attention.totalAmount')}
                  </p>
                  <p className="money-number mt-1 text-lg">{attentionTotal} đ</p>
                </div>
              </div>

              <div className="divide-y divide-[hsl(var(--border))] overflow-hidden rounded-[24px] bg-[hsl(var(--muted))]">
              {payments.slice(0, 3).map((payment) => (
                <Link
                  key={payment.name}
                  to="/payments"
                  className="flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-[hsl(var(--secondary))]"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium tracking-[-0.01em]">{payment.name}</p>
                    <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                      {dueDate(payment.due)}
                    </p>
                  </div>
                  {payment.amount ? (
                    <span className="money-number shrink-0 text-base">{payment.amount}</span>
                  ) : null}
                </Link>
              ))}
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title={t('dashboard.sections.recent.title')}
            subtitle={`${moneyEvents[0].title} · ${moneyEvents[0].date}`}
            to="/events"
          >
            <div className="divide-y divide-[hsl(var(--border))] overflow-hidden rounded-[24px] bg-[hsl(var(--muted))]">
              {moneyEvents.slice(0, 2).map((event) => (
                <Link
                  key={`${event.title}-${event.date}`}
                  to="/events"
                  className="flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-[hsl(var(--secondary))]"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium tracking-[-0.01em]">{event.title}</p>
                    <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{event.date}</p>
                  </div>
                  <p className="money-number shrink-0 text-base">{event.amount}</p>
                </Link>
              ))}
            </div>
          </SectionCard>
        </div>
      </AppearItem>

      {/* Row 2 — long-term plan + household members. */}
      <AppearItem>
        <div className="grid gap-4 lg:grid-cols-12">
          <SectionCard
            title={t('dashboard.sections.longTerm.title')}
            subtitle={t('dashboard.sections.longTerm.subtitle')}
            to="/goals"
            className="lg:col-span-8"
          >
            <div className="flex h-full flex-col justify-center rounded-[24px] bg-[hsl(var(--muted))] p-5">
              <div className="flex items-end justify-between gap-3">
                <p className="text-lg font-semibold tracking-[-0.02em] md:text-xl">
                  {mainGoal.name}
                </p>
                <p className="money-number text-3xl md:text-4xl">{mainGoal.progress}%</p>
              </div>
              <Progress value={mainGoal.progress} className="mt-4 h-2" />
            </div>
          </SectionCard>

          <SectionCard
            title={t('nav.members')}
            subtitle={membersSubtitle}
            to="/members"
            className="lg:col-span-4"
          >
            <div className="divide-y divide-[hsl(var(--border))] overflow-hidden rounded-[24px] bg-[hsl(var(--muted))]">
              {members.slice(0, 3).map((member) => (
                <Link
                  key={member.id}
                  to="/members"
                  className="flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-[hsl(var(--secondary))]"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--background))] text-xs font-semibold tracking-[-0.01em]">
                      {member.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium tracking-[-0.01em]">{member.name}</p>
                      <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                        {member.lastActive}
                      </p>
                    </div>
                  </div>
                  <Badge
                    className={cn(
                      member.status === 'active'
                        ? 'bg-[hsla(var(--status-green),0.1)] text-[hsl(var(--status-green))]'
                        : 'bg-[hsla(var(--status-orange),0.12)] text-[hsl(var(--status-orange))]',
                    )}
                  >
                    {member.status === 'active'
                      ? t('members.strip.active')
                      : t('members.list.pending')}
                  </Badge>
                </Link>
              ))}
            </div>
          </SectionCard>
        </div>
      </AppearItem>
    </AppearGroup>
  )
}

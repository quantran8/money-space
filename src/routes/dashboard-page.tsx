import type { ReactNode } from 'react'
import {
  ArrowRight,
  Bell,
  RefreshCw,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import {
  assetGroups,
  attentionItems,
  dashboardGoals as goals,
  dashboardSnapshot as snapshot,
  moneyEvents,
  upcomingPayments as payments,
} from '@/lib/mock-data'

type MetricCellProps = {
  label: string
  value: string
  className?: string
}

function MetricCell({ label, value, className }: MetricCellProps) {
  return (
    <div className={cn('rounded-2xl bg-white p-4', className)}>
      <p className="text-sm text-[hsl(var(--muted-foreground))]">{label}</p>
      <p className="money-number mt-2 text-2xl font-bold">{value}</p>
    </div>
  )
}

function SectionCard({
  title,
  subtitle,
  to,
  children,
}: {
  title: string
  subtitle: string
  to: string
  children: ReactNode
}) {
  return (
    <section className="rounded-[32px] bg-white p-6 shadow-[0_8px_24px_rgba(0,0,0,0.04)] md:p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">{title}</h2>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{subtitle}</p>
        </div>

        <Link
          to={to}
          className="inline-flex items-center whitespace-nowrap text-sm font-semibold text-[hsl(var(--accent))]"
        >
          Xem
          <ArrowRight className="ml-1 size-4" />
        </Link>
      </div>

      {children}
    </section>
  )
}

function SubSectionLink({
  title,
  to,
  children,
  className,
  titleClassName,
}: {
  title: string
  to: string
  children: ReactNode
  className?: string
  titleClassName?: string
}) {
  return (
    <Link
      to={to}
      className={cn(
        'block rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] p-5 transition-colors hover:bg-[hsl(var(--muted))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]',
        className,
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className={cn('text-sm font-semibold text-[hsl(var(--muted-foreground))]', titleClassName)}>
          {title}
        </h3>
        <ArrowRight className="size-4 text-[hsl(var(--muted-foreground))]" />
      </div>
      {children}
    </Link>
  )
}

function shortDate(value: string) {
  return value.replace('/2026', '')
}

function dueDate(value: string) {
  return value.replace(' Jul', '/07')
}

function amountGap(current: string, target: string) {
  const currentValue = Number(current.replace(/[^\d.]/g, ''))
  const targetValue = Number(target.replace(/[^\d.]/g, ''))

  if (!Number.isFinite(currentValue) || !Number.isFinite(targetValue)) {
    return 'Đang tính'
  }

  return `${Math.max(targetValue - currentValue, 0)}M`
}

const longTermAssets = assetGroups.find((group) => group.name === 'Dài hạn')?.value ?? '374M'
const primaryAssets = assetGroups
  .find((group) => group.name === 'Dài hạn')
  ?.note.split(',')
  .slice(0, 2)
  .map((item) => item.trim())
  .join(', ') ?? 'Vàng, đầu tư'
const nearestPayment = payments[0]
const firstAttention = attentionItems[0]
const mainGoal = goals[0]
const goalGap = amountGap(mainGoal.current, mainGoal.target)
const status = snapshot.attentionCount > 2 ? 'Căng' : snapshot.attentionCount > 0 ? 'Cần chú ý' : 'Ổn'

export function DashboardPage() {
  return (
    <div className="space-y-5">
      <section className="grid gap-4 lg:grid-cols-12">
        <Card className="rounded-[32px] p-6 shadow-[0_8px_24px_rgba(0,0,0,0.04)] md:p-8 lg:col-span-9">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  className={cn(
                    status === 'Ổn' &&
                      'bg-[hsla(var(--status-green),0.1)] text-[hsl(var(--status-green))]',
                    status === 'Cần chú ý' &&
                      'bg-[hsla(var(--status-orange),0.12)] text-[hsl(var(--status-orange))]',
                    status === 'Căng' &&
                      'bg-[hsla(var(--status-red),0.1)] text-[hsl(var(--status-red))]',
                  )}
                >
                  {status}
                </Badge>
                <span className="text-sm text-[hsl(var(--muted-foreground))]">
                  Cập nhật {shortDate(snapshot.updatedAt)}
                </span>
              </div>
              <h1 className="page-title mt-4 text-4xl font-semibold sm:text-[2.8rem]">
                Tình hình nhà mình
              </h1>
            </div>

            <Link
              to="/events"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[hsl(var(--primary))] px-5 text-sm font-semibold text-[hsl(var(--primary-foreground))] shadow-[0_8px_24px_rgba(0,0,0,0.04)] transition-opacity hover:opacity-90"
            >
              <RefreshCw className="size-4" />
              Cập nhật
            </Link>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl bg-[hsl(var(--secondary))] p-5">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Dùng ngay</p>
              <p className="money-number mt-2 text-2xl font-bold">{snapshot.liquidDisplay}</p>
            </div>
            <div className="rounded-3xl bg-[hsl(var(--secondary))] p-5">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Sắp trả</p>
              <p className="mt-2 text-2xl font-semibold">{payments.length} khoản</p>
            </div>
            <div className="rounded-3xl bg-[hsl(var(--secondary))] p-5">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Cần bàn</p>
              <p className="mt-2 text-2xl font-semibold">{snapshot.attentionCount} việc</p>
            </div>
          </div>
        </Card>

        <Link
          to="/events"
          className="hidden rounded-[28px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] lg:col-span-3 lg:block"
        >
          <Card className="flex h-full min-h-[180px] flex-col justify-between rounded-[32px] bg-[hsl(var(--foreground))] p-6 text-white">
            <div className="flex items-center justify-between">
              <p className="text-sm text-white/70">Nhanh</p>
              <Bell className="size-5 text-white/80" />
            </div>
            <div>
              <p className="section-title text-3xl font-semibold">Cập nhật</p>
              <p className="mt-2 text-sm text-white/70">Mất 2 phút</p>
            </div>
          </Card>
        </Link>
      </section>

      <SectionCard title="Tiền nhà mình" subtitle="Dùng ngay đủ tháng này" to="/assets">
        <div className="grid gap-4 lg:grid-cols-2">
          <SubSectionLink title="Thanh khoản" to="/assets">
            <div className="grid gap-3 sm:grid-cols-2">
              <MetricCell label="Dùng ngay" value={snapshot.liquidDisplay} />
              <MetricCell label="Dự phòng" value={snapshot.savings} />
            </div>
          </SubSectionLink>

          <SubSectionLink title="Tổng tài sản" to="/assets">
            <div className="grid gap-3 sm:grid-cols-2">
              <MetricCell label="Tài sản" value={longTermAssets} />
              <MetricCell label="Nợ" value={snapshot.debt} />
            </div>
          </SubSectionLink>
        </div>
      </SectionCard>

      <SectionCard title="Cần chú ý" subtitle="Có vài việc nên xem trong tuần này" to="/payments">
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <SubSectionLink
            title="Sắp trả"
            to="/payments"
            className="border-[hsla(var(--status-orange),0.18)] bg-[hsla(var(--status-orange),0.1)]"
            titleClassName="text-[hsl(var(--status-orange))]"
          >
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[hsl(var(--status-orange))]">
                {payments.length} khoản
              </span>
            </div>

            <div className="mt-5">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Gần nhất</p>
              <p className="mt-1 text-xl font-bold">{nearestPayment.name}</p>
              <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                {dueDate(nearestPayment.due)} · {nearestPayment.amount}
              </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-2 text-sm">
              {payments.slice(1, 3).map((payment) => (
                <span key={payment.name} className="rounded-full bg-white px-3 py-2">
                  {payment.name} {dueDate(payment.due)}
                </span>
              ))}
            </div>
          </SubSectionLink>

          <SubSectionLink title="Cần bàn" to="/events">
            <div className="mt-1">
              <p className="text-3xl font-bold">{snapshot.attentionCount} việc</p>
              <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                {firstAttention.title.replace(' hơi lớn so với mức tiền dùng ngay', '')}
              </p>
            </div>
            <span className="mt-6 inline-flex rounded-full bg-[hsl(var(--foreground))] px-4 py-3 text-sm font-semibold text-white">
              Bàn thêm
            </span>
          </SubSectionLink>
        </div>
      </SectionCard>

      <SectionCard title="Kế hoạch dài hạn" subtitle="Mục tiêu chính đang tiến triển tốt" to="/goals">
        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <SubSectionLink title="Mục tiêu chính" to="/goals">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">Mục tiêu chính</p>
                <p className="mt-2 text-2xl font-bold">{mainGoal.name}</p>
              </div>
              <p className="money-number text-4xl font-bold">{mainGoal.progress}%</p>
            </div>
            <Progress value={mainGoal.progress} className="mt-6" />
          </SubSectionLink>

          <div className="grid gap-3">
            <SubSectionLink title="Còn thiếu" to="/goals">
              <p className="money-number text-2xl font-bold">{goalGap}</p>
            </SubSectionLink>

            <SubSectionLink title="Tài sản chính" to="/assets">
              <p className="text-xl font-bold">{primaryAssets}</p>
            </SubSectionLink>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Gần đây"
        subtitle={`${moneyEvents[0].title} · ${moneyEvents[0].date}`}
        to="/events"
      >
        <Link
          to="/events"
          className="block rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] p-5 transition-colors hover:bg-[hsl(var(--muted))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold">Hoạt động mới</h3>
            <ArrowRight className="size-4 text-[hsl(var(--muted-foreground))]" />
          </div>
          <div className="space-y-3">
            {moneyEvents.slice(0, 3).map((event) => (
              <div
                key={`${event.title}-${event.date}`}
                className="flex items-center justify-between gap-4 rounded-2xl bg-white p-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{event.title}</p>
                  <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{event.date}</p>
                </div>
                <p className="money-number shrink-0 text-xl">{event.amount}</p>
              </div>
            ))}
          </div>
        </Link>
      </SectionCard>
    </div>
  )
}

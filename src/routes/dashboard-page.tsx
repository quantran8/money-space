import {
  ArrowRight,
  Bell,
  CircleAlert,
  CircleCheckBig,
  Clock3,
  Landmark,
  PiggyBank,
  Sparkles,
  Wallet,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { PageHeader } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { env } from '@/lib/env'
import {
  assetGroups,
  attentionItems,
  dashboardGoals as goals,
  dashboardSnapshot as snapshot,
  moneyEvents,
  upcomingPayments as payments,
} from '@/lib/mock-data'

export function DashboardPage() {
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={`Cập nhật gần nhất · ${snapshot.updatedAt}`}
        title="Tình hình nhà mình"
        description="Xem nhanh tình hình tài chính chung: còn bao nhiêu, sắp phải trả gì, và có khoản nào cần chú ý."
        actions={
          <>
            <button className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
              <Bell className="size-5" />
            </button>
            <Link to="/events">
              <Button className="px-5 py-3 text-sm font-semibold">+ Ghi nhận sự kiện</Button>
            </Link>
          </>
        }
      />

      <section className="grid gap-4 lg:grid-cols-12">
        <Card className="apple-shadow lg:col-span-7">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Nhà mình đang thế nào?</p>
              <h2 className="section-title mt-1 text-3xl font-semibold">Ổn</h2>
            </div>

            <Badge className="bg-[hsla(var(--status-green),0.1)] text-[hsl(var(--status-green))]">
              Theo dữ liệu hiện có
            </Badge>
          </div>

          <p className="max-w-xl text-sm leading-6 text-[hsl(var(--muted-foreground))]">
            Không có khoản quá hạn. Có 2 khoản sắp tới trong 30 ngày cần theo dõi và{' '}
            {moneyEvents.length} sự kiện tài chính gần đây giải thích biến động snapshot.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <div className="rounded-[22px] bg-[hsla(var(--status-green),0.1)] p-4">
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Trạng thái</p>
              <p className="mt-2 text-lg font-semibold text-[hsl(var(--status-green))]">Ổn</p>
            </div>
            <div className="surface-muted rounded-[22px] p-4">
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Sắp tới</p>
              <p className="mt-2 text-lg font-semibold">2 khoản</p>
            </div>
            <div className="rounded-[22px] bg-[hsla(var(--status-orange),0.1)] p-4">
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Cần chú ý</p>
              <p className="mt-2 text-lg font-semibold text-[hsl(var(--status-orange))]">
                {snapshot.attentionCount} khoản
              </p>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-5">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Tiền có thể dùng ngay</p>
              <h3 className="mt-1 text-lg font-semibold">Tiền mặt + tài khoản</h3>
            </div>

            <div className="surface-muted flex h-10 w-10 items-center justify-center rounded-full">
              <Wallet className="size-5" />
            </div>
          </div>

          <div className="flex items-end gap-2">
            <p className="money-number text-6xl leading-none">{snapshot.liquid}</p>
            <p className="pb-2 text-lg font-medium text-[hsl(var(--muted-foreground))]">M đ</p>
          </div>

          <div className="surface-muted mt-6 rounded-[22px] p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[hsl(var(--muted-foreground))]">Tiền mặt</span>
              <span className="font-medium">{snapshot.liquidSplit.cash}</span>
            </div>
            <Separator className="my-3" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-[hsl(var(--muted-foreground))]">Tài khoản có thể dùng</span>
              <span className="font-medium">{snapshot.liquidSplit.account}</span>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-4">
          <div className="mb-6 flex items-start justify-between">
            <div className="surface-muted flex h-10 w-10 items-center justify-center rounded-full">
              <PiggyBank className="size-5" />
            </div>
            <Badge className="bg-[hsla(var(--status-green),0.1)] text-[hsl(var(--status-green))]">
              Tốt
            </Badge>
          </div>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Dự phòng</p>
          <p className="section-title mt-1 text-3xl font-semibold">{snapshot.savings}</p>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">Tiết kiệm & quỹ an toàn</p>
        </Card>

        <Card className="lg:col-span-4">
          <div className="mb-6 flex items-start justify-between">
            <div className="surface-muted flex h-10 w-10 items-center justify-center rounded-full">
              <CircleAlert className="size-5" />
            </div>
            <Badge>Trong ngưỡng</Badge>
          </div>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Tổng nợ</p>
          <p className="section-title mt-1 text-3xl font-semibold">{snapshot.debt}</p>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">Khoản phải trả còn lại</p>
        </Card>

        <Card className="lg:col-span-4">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">Khoản cần chú ý</h3>
              <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Khoản nên cùng xem</p>
            </div>
            <Badge className="bg-[hsla(var(--status-orange),0.1)] text-[hsl(var(--status-orange))]">
              1 khoản
            </Badge>
          </div>
          <p className="text-sm leading-6 text-[hsl(var(--muted-foreground))]">
            {attentionItems[0].reason}
          </p>
          <Link
            to="/events"
            className="mt-5 inline-flex items-center text-sm font-medium text-[hsl(var(--accent))]"
          >
            Xem các khoản cần trao đổi
            <ArrowRight className="ml-2 size-4" />
          </Link>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Khoản sắp tới</p>
              <h3 className="section-title mt-1 text-2xl font-semibold">
                Những khoản nên để ý trong 30 ngày
              </h3>
            </div>
            <Clock3 className="size-5 text-[hsl(var(--status-orange))]" />
          </div>
          <div className="mt-6 space-y-4">
            {payments.map((payment) => (
              <div key={payment.name} className="surface-muted rounded-[22px] px-4 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">{payment.name}</p>
                    <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                      Đến hạn {payment.due} · {payment.owner}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="money-number text-2xl">{payment.amount}</p>
                    <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Cần theo dõi</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Link
            to="/payments"
            className="mt-5 inline-flex items-center text-sm font-medium text-[hsl(var(--accent))]"
          >
            Xem tất cả khoản sắp tới
            <ArrowRight className="ml-2 size-4" />
          </Link>
        </Card>

        <Card className="lg:col-span-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Hạ tầng dữ liệu</p>
              <h3 className="mt-1 text-lg font-semibold">Nguồn dữ liệu</h3>
            </div>
            <Sparkles className="size-5 text-[hsl(var(--accent))]" />
          </div>
          <div className="mt-6 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-[hsl(var(--muted-foreground))]">Supabase</span>
              <Badge>{env.hasSupabase ? 'Đã cấu hình' : 'Mock data'}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[hsl(var(--muted-foreground))]">Snapshot</span>
              <span className="font-medium">{snapshot.updatedAt}</span>
            </div>
            <p className="leading-6 text-[hsl(var(--muted-foreground))]">
              Khi thêm env, dashboard có thể đọc trực tiếp `snapshots`, `assets`,
              `upcoming_payments` và `money_events`.
            </p>
          </div>
        </Card>

        <Card className="lg:col-span-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Mục tiêu tài chính</p>
              <h3 className="section-title mt-1 text-2xl font-semibold">Tiến độ mục tiêu chung</h3>
            </div>
            <CircleCheckBig className="size-5 text-[hsl(var(--accent))]" />
          </div>
          <div className="mt-6 space-y-5">
            {goals.map((goal) => (
              <div key={goal.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{goal.name}</p>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    {goal.current} / {goal.target}
                  </p>
                </div>
                <Progress value={goal.progress} />
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Mục tiêu {goal.deadline}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Tài sản</p>
              <h3 className="section-title mt-1 text-2xl font-semibold">Tiền nhà mình đang nằm ở đâu</h3>
            </div>
            <Landmark className="size-5 text-[hsl(var(--accent))]" />
          </div>
          <div className="mt-6 space-y-3">
            {assetGroups.map((group) => (
              <div key={group.name} className="rounded-[22px] border bg-white px-4 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">{group.name}</p>
                    <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{group.note}</p>
                  </div>
                  <p className="money-number text-2xl">{group.value}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-7">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Cần trao đổi</p>
              <h3 className="section-title mt-1 text-2xl font-semibold">Những khoản nên cùng xem lại</h3>
            </div>
            <CircleAlert className="size-5 text-[hsl(var(--status-orange))]" />
          </div>
          <div className="mt-6 space-y-3">
            {attentionItems.map((item) => (
              <div key={item.title} className="surface-muted rounded-[22px] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{item.title}</p>
                  <Badge>{item.level}</Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
                  {item.reason}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-7">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Sự kiện gần đây</p>
              <h3 className="section-title mt-1 text-2xl font-semibold">
                Điều gì vừa làm snapshot thay đổi
              </h3>
            </div>
            <Sparkles className="size-5 text-[hsl(var(--accent))]" />
          </div>
          <div className="mt-6 space-y-3">
            {moneyEvents.map((event) => (
              <div
                key={`${event.title}-${event.date}`}
                className="flex items-center justify-between rounded-[22px] border bg-white px-4 py-4"
              >
                <div>
                  <p className="font-medium">{event.title}</p>
                  <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{event.note}</p>
                </div>
                <div className="text-right">
                  <p className="money-number text-xl">{event.amount}</p>
                  <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{event.date}</p>
                </div>
              </div>
            ))}
          </div>
          <Link
            to="/events"
            className="mt-5 inline-flex items-center text-sm font-medium text-[hsl(var(--accent))]"
          >
            Xem tất cả money events
            <ArrowRight className="ml-2 size-4" />
          </Link>
        </Card>

        <Card className="lg:col-span-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Nhịp cập nhật</p>
              <h3 className="section-title mt-1 text-2xl font-semibold">Cập nhật nhanh mỗi tuần</h3>
            </div>
            <PiggyBank className="size-5 text-[hsl(var(--foreground))]" />
          </div>
          <div className="mt-5 space-y-4 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
            <p>Không cần nhập từng khoản nhỏ. Chỉ cần cập nhật nhanh các điểm này:</p>
            <ul className="space-y-2">
              <li>Tiền dùng được hiện tại còn bao nhiêu</li>
              <li>Có khoản lớn nào vừa phát sinh không</li>
              <li>Có khoản nào sắp phải trả trong 7 ngày tới không</li>
              <li>Có gì cần để cả hai cùng trao đổi không</li>
            </ul>
          </div>
          <Button className="mt-6 w-full">Bắt đầu tạo snapshot mới</Button>
          <Link
            to="/events"
            className="mt-3 inline-flex items-center justify-center text-sm font-medium text-[hsl(var(--accent))]"
          >
            Hoặc thêm một money event trước
            <ArrowRight className="ml-2 size-4" />
          </Link>
        </Card>
      </section>
    </div>
  )
}

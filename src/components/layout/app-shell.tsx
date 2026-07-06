import {
  CalendarDays,
  ChartNoAxesCombined,
  Home,
  ReceiptText,
  Settings,
  Target,
  Users,
  Wallet,
} from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'

import type { ComponentType } from 'react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type NavItem = {
  to: string
  label: string
  icon: ComponentType<{ className?: string; strokeWidth?: number }>
  disabled?: boolean
}

const navItems: NavItem[] = [
  { to: '/', label: 'Tổng quan', icon: Home },
  { to: '/assets', label: 'Tài sản', icon: Wallet },
  { to: '/payments', label: 'Khoản sắp tới', icon: CalendarDays },
  { to: '/goals', label: 'Mục tiêu', icon: Target },
  { to: '/events', label: 'Sự kiện tài chính', icon: ReceiptText },
  { to: '/members', label: 'Thành viên', icon: Users },
  { to: '/settings', label: 'Cài đặt', icon: Settings },
]

export function AppShell() {
  return (
    <div className="dashboard-shell mx-auto flex min-h-screen">
      <aside className="hidden w-[264px] border-r border-border px-4 py-5 lg:block">
        <div className="mb-9 flex items-center gap-3 px-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <ChartNoAxesCombined className="size-5" strokeWidth={1.8} />
          </div>

          <div>
            <p className="text-base font-semibold tracking-tight">Money Space</p>
            <p className="text-xs text-muted-foreground">Family finance</p>
          </div>
        </div>

        <nav className="space-y-1">
          {navItems.map(({ to, label, icon: Icon, disabled }) => (
            <NavLink
              key={to}
              to={disabled ? '#' : to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                  disabled && 'pointer-events-none opacity-55',
                )
              }
            >
              <Icon className="size-4" strokeWidth={1.8} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <Card className="fixed bottom-5 w-[232px]">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sm font-semibold">
              MN
            </div>

            <div>
              <p className="text-sm font-medium">Nhà Minh</p>
              <p className="text-xs text-muted-foreground">2 thành viên</p>
            </div>
          </div>

          <Button variant="secondary" className="w-full">
            Quản lý nhà
          </Button>
        </Card>
      </aside>

      <main className="flex-1">
        <div className="mx-auto max-w-screen-2xl px-5 py-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

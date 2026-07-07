import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import {
  CalendarDays,
  ChartNoAxesCombined,
  Home,
  Menu,
  ReceiptText,
  Settings,
  Target,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { NavLink, Outlet } from 'react-router-dom'

import type { ComponentType } from 'react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/shared/lib/utils'

type NavItem = {
  to: string
  labelKey: string
  icon: ComponentType<{ className?: string; strokeWidth?: number }>
  disabled?: boolean
}

const navItems: NavItem[] = [
  { to: '/', labelKey: 'nav.dashboard', icon: Home },
  { to: '/assets', labelKey: 'nav.assets', icon: Wallet },
  { to: '/payments', labelKey: 'nav.payments', icon: CalendarDays },
  { to: '/goals', labelKey: 'nav.goals', icon: Target },
  { to: '/events', labelKey: 'nav.events', icon: ReceiptText },
  { to: '/members', labelKey: 'nav.members', icon: Users },
  { to: '/settings', labelKey: 'nav.settings', icon: Settings },
]

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation()

  return (
    <nav className="space-y-1">
      {navItems.map(({ to, labelKey, icon: Icon, disabled }) => (
        <NavLink
          key={to}
          to={disabled ? '#' : to}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'apple-shadow-soft bg-card text-foreground'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
              disabled && 'pointer-events-none opacity-55',
            )
          }
        >
          <Icon className="size-4" strokeWidth={1.8} />
          <span>{t(labelKey)}</span>
        </NavLink>
      ))}
    </nav>
  )
}

export function AppShell() {
  const { t } = useTranslation()
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-[264px] shrink-0 border-r border-border px-4 py-5 lg:block">
        <div className="mb-9 flex items-center gap-3 px-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <ChartNoAxesCombined className="size-5" strokeWidth={1.8} />
          </div>

          <div>
            <p className="text-base font-semibold tracking-tight">Money Space</p>
            <p className="text-xs text-muted-foreground">{t('shell.subtitle')}</p>
          </div>
        </div>

        <NavLinks />

        <Card className="fixed bottom-5 w-[232px]">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sm font-semibold">
              MN
            </div>

            <div>
              <p className="text-sm font-medium">{t('shell.householdName')}</p>
              <p className="text-xs text-muted-foreground">{t('shell.householdMembers')}</p>
            </div>
          </div>

          <Button variant="secondary" className="w-full">
            {t('shell.manageHousehold')}
          </Button>
        </Card>
      </aside>

      <main className="flex-1">
        <Dialog.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
          <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-card/80 px-4 py-3 backdrop-blur-xl lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <ChartNoAxesCombined className="size-4" strokeWidth={1.8} />
            </div>
            <p className="text-base font-semibold tracking-tight">Money Space</p>

            <Dialog.Trigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t('shell.openMenu')}
                className="ml-auto shrink-0"
              >
                <Menu className="size-5" strokeWidth={1.8} />
              </Button>
            </Dialog.Trigger>
          </header>

          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 lg:hidden" />
            <Dialog.Content
              className="fixed inset-y-0 right-0 z-50 flex w-[280px] max-w-[82vw] flex-col gap-6 border-l border-border bg-card px-4 py-5 shadow-[-16px_0_50px_rgba(0,0,0,0.14)] outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right data-[state=closed]:duration-200 data-[state=open]:duration-300 lg:hidden"
            >
              <div className="flex items-center gap-3 px-2">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <ChartNoAxesCombined className="size-5" strokeWidth={1.8} />
                </div>
                <div>
                  <Dialog.Title className="text-base font-semibold tracking-tight">
                    Money Space
                  </Dialog.Title>
                  <p className="text-xs text-muted-foreground">{t('shell.subtitle')}</p>
                </div>
                <Dialog.Close
                  className="ml-auto rounded-full p-1 text-muted-foreground opacity-70 outline-none transition hover:bg-secondary hover:opacity-100"
                  aria-label={t('shell.closeMenu')}
                >
                  <X className="size-4" />
                </Dialog.Close>
              </div>

              <NavLinks onNavigate={() => setDrawerOpen(false)} />

              <Card className="mt-auto">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sm font-semibold">
                    MN
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t('shell.householdName')}</p>
                    <p className="text-xs text-muted-foreground">
                      {t('shell.householdMembers')}
                    </p>
                  </div>
                </div>
                <Button variant="secondary" className="w-full">
                  {t('shell.manageHousehold')}
                </Button>
              </Card>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        <div className="mx-auto max-w-screen-2xl px-5 py-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

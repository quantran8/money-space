import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { motion } from 'motion/react'
import {
  Calculator,
  CalendarDays,
  CircleDollarSign,
  Landmark,
  LayoutGrid,
  Menu,
  Target,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

import { MobileBottomNav } from '@/app/layout/mobile-bottom-nav'
import { WhatIfSheet } from '@/features/whatif/ui/whatif-sheet'

import type { ComponentType } from 'react'

import { pageTransition, pageVariants } from '@/components/ui/motion'
import { useMembers } from '@/features/members/hooks/use-members'
import { useActiveHousehold } from '@/shared/hooks/use-active-household'
import { cn } from '@/shared/lib/utils'
import { useWhatIfStore } from '@/shared/stores/whatif-store'

type NavItem = {
  to: string
  labelKey: string
  icon: ComponentType<{ className?: string; strokeWidth?: number }>
}

/**
 * Sidebar nav, grouped by what the household is DOING (design.md §7.4, §8).
 *
 * The groups are not decoration: "Bức tranh" answers where we stand, "Quyết
 * định" is what the product is actually paid for, "Nhà mình" is the shared
 * record. Icons use stroke 1.75 and appear only here and on buttons (§18).
 */
const NAV_GROUPS: { labelKey: string; items: NavItem[] }[] = [
  {
    labelKey: 'nav.group.picture',
    items: [
      { to: '/', labelKey: 'nav.dashboard', icon: LayoutGrid },
      { to: '/upcoming', labelKey: 'nav.upcoming', icon: CalendarDays },
      { to: '/assets', labelKey: 'nav.assets', icon: Wallet },
      { to: '/debts', labelKey: 'nav.debts', icon: Landmark },
    ],
  },
  {
    labelKey: 'nav.group.decisions',
    items: [{ to: '/goals', labelKey: 'nav.goals', icon: Target }],
  },
  {
    labelKey: 'nav.group.household',
    items: [
      { to: '/events', labelKey: 'nav.events', icon: CircleDollarSign },
      { to: '/household', labelKey: 'nav.household', icon: Users },
    ],
  },
]

function NavItemLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const { t } = useTranslation()
  const { to, labelKey, icon: Icon } = item

  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      // `end` keeps "/" from matching every nested route.
      end={to === '/'}
      // `aria-current` drives the active style via the .nav-item CSS (§21) and
      // is what a screen reader announces — one attribute, both jobs.
      className="nav-item"
    >
      <Icon className="size-4 shrink-0" strokeWidth={1.75} />
      <span className="truncate">{t(labelKey)}</span>
    </NavLink>
  )
}

function NavGroups({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation()

  return (
    <>
      {NAV_GROUPS.map((group, index) => (
        <div key={group.labelKey} className={index === 0 ? 'mt-7' : 'mt-6'}>
          <p className="label mb-2 px-3">{t(group.labelKey)}</p>
          <nav className="space-y-0.5">
            {group.items.map((item) => (
              <NavItemLink key={item.to} item={item} onNavigate={onNavigate} />
            ))}
          </nav>
        </div>
      ))}
    </>
  )
}

/** The sole what-if entry point, directly under the sidebar logo. */
function SimulateButton({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation()

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-11 w-full items-center justify-center gap-2 rounded-lg text-[14px] font-medium text-white"
      style={{ background: 'var(--accent)' }}
    >
      <Calculator className="size-4" strokeWidth={1.75} />
      {t('home.picture.simulate')}
    </button>
  )
}

/** The two-people cluster at the foot of the sidebar (§7.4). */
function HouseholdFooter() {
  const { t } = useTranslation()
  const { activeHousehold } = useActiveHousehold()
  const { members } = useMembers()

  const active = members.filter((member) => member.status === 'active')
  const shown = active.slice(0, 2)

  return (
    <div className="flex items-center gap-2.5">
      <div className="flex shrink-0">
        {shown.length > 0 ? (
          shown.map((member, index) => (
            <span
              key={member.id}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full bg-panel text-[10px] text-ink2',
                index > 0 && '-ml-2',
              )}
            >
              {member.name.trim().charAt(0).toUpperCase()}
            </span>
          ))
        ) : (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-panel text-[10px] text-ink2">
            {activeHousehold?.name?.trim().charAt(0).toUpperCase() ?? 'M'}
          </span>
        )}
      </div>

      <div className="min-w-0">
        <p className="truncate text-[12px]">
          {activeHousehold?.name ?? t('shell.householdName')}
        </p>
        {active.length > 0 ? (
          <p className="font-mono text-[10px] text-ink3">{active.length}</p>
        ) : null}
      </div>
    </div>
  )
}

/**
 * App shell (§8, §13).
 *
 * The sidebar sits DIRECTLY on `--app` with no surface and no right border —
 * the page background is what separates it from the content (§2.1, §7.4).
 */
export function AppShell() {
  const { t } = useTranslation()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const openWhatIf = useWhatIfStore((store) => store.openWhatIf)

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-[240px] shrink-0 flex-col px-4 py-5 lg:flex">
        <div className="flex items-center gap-2.5 px-3 pb-5">
          <span
            className="flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-medium text-white"
            style={{ background: 'var(--accent)' }}
          >
            M
          </span>
          <span className="text-[15px] font-medium tracking-[.01em]">Money Space</span>
        </div>

        <SimulateButton onClick={() => openWhatIf({ source: 'other' })} />

        <NavGroups />

        <div className="mt-auto px-3 pt-6">
          <HouseholdFooter />
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <Dialog.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
          <header className="sticky top-0 z-30 flex items-center gap-3 bg-app/90 px-5 py-3 backdrop-blur-xl lg:hidden">
            <span
              className="flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-medium text-white"
              style={{ background: 'var(--accent)' }}
            >
              M
            </span>
            <p className="text-[15px] font-medium">Money Space</p>

            <Dialog.Trigger asChild>
              <button
                type="button"
                aria-label={t('shell.openMenu')}
                className="ml-auto flex size-11 shrink-0 items-center justify-center rounded-lg text-ink2"
              >
                <Menu className="size-5" strokeWidth={1.75} />
              </button>
            </Dialog.Trigger>
          </header>

          <Dialog.Portal>
            <Dialog.Overlay
              className="fixed inset-0 z-50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 lg:hidden"
              style={{ background: 'var(--scrim)' }}
            />
            <Dialog.Content className="panel fixed inset-y-0 right-0 z-50 flex w-[280px] max-w-[82vw] flex-col rounded-none px-4 py-5 outline-none data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=closed]:duration-200 data-[state=open]:animate-in data-[state=open]:slide-in-from-right data-[state=open]:duration-300 lg:hidden">
              <div className="flex items-center gap-2.5 px-3">
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-medium text-white"
                  style={{ background: 'var(--accent)' }}
                >
                  M
                </span>
                <Dialog.Title className="text-[15px] font-medium">Money Space</Dialog.Title>
                <Dialog.Close
                  className="ml-auto flex size-9 items-center justify-center rounded-lg text-ink3"
                  aria-label={t('shell.closeMenu')}
                >
                  <X className="size-4" strokeWidth={1.75} />
                </Dialog.Close>
              </div>

              <div className="mt-5">
                <SimulateButton
                  onClick={() => {
                    setDrawerOpen(false)
                    openWhatIf({ source: 'other' })
                  }}
                />
              </div>

              <NavGroups onNavigate={() => setDrawerOpen(false)} />

              <div className="mt-auto px-3 pt-6">
                <HouseholdFooter />
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        <motion.div
          key={location.pathname}
          initial="initial"
          animate="animate"
          variants={pageVariants}
          transition={pageTransition}
          className="mx-auto w-full max-w-[1220px] px-5 py-5 pb-24 lg:px-7 lg:pb-6"
        >
          <Outlet />
        </motion.div>
      </main>

      {/* What-if is deliberately not a route (§2.9). Its sheet is mounted once
          here and opened only by the sidebar CTA. */}
      <MobileBottomNav />
      <WhatIfSheet />
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { motion } from 'motion/react'
import {
  Calculator,
  CalendarDays,
  CircleDollarSign,
  LayoutGrid,
  LogOut,
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
import { useLogout } from '@money-space/core/features/auth/hooks/use-logout'
import { useMembers } from '@money-space/core/features/members/hooks/use-members'
import { useActiveHousehold } from '@money-space/core/shared/hooks/use-active-household'
import { cn } from '@money-space/core/shared/lib/utils'
import { useWhatIfStore } from '@money-space/core/shared/stores/whatif-store'

type NavItem = {
  to: string
  labelKey: string
  icon: ComponentType<{ className?: string; strokeWidth?: number }>
  /** Extra route prefixes that should keep this item highlighted. */
  alsoActiveOn?: string[]
}

/**
 * Sidebar nav, grouped by what the household is DOING (design.md §7.4, §8).
 *
 * The groups are not decoration: "Bức tranh" answers where we stand, "Quyết
 * định" is what the product is actually paid for, "Gia đình" is the shared
 * record. Icons use stroke 1.75 and appear only here and on buttons (§18).
 */
const NAV_GROUPS: { labelKey: string; items: NavItem[] }[] = [
  {
    labelKey: 'nav.group.picture',
    items: [
      { to: '/', labelKey: 'nav.dashboard', icon: LayoutGrid },
      { to: '/upcoming', labelKey: 'nav.upcoming', icon: CalendarDays },
      // Assets and debts are one route and one destination.
      { to: '/networth', labelKey: 'nav.assetsDebts', icon: Wallet, alsoActiveOn: ['/assets', '/debts'] },
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
  const { pathname } = useLocation()
  const { to, labelKey, icon: Icon, alsoActiveOn } = item

  // A merged item stays lit on its sibling routes too — /debts must not leave
  // the sidebar with nothing selected.
  const activeElsewhere = (alsoActiveOn ?? []).some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )

  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      // `end` keeps "/" from matching every nested route.
      end={to === '/'}
      // `aria-current` drives the active style via the .nav-item CSS (§21) and
      // is what a screen reader announces — one attribute, both jobs.
      className="nav-item"
      aria-current={activeElsewhere ? 'page' : undefined}
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
                'flex h-7 w-7 items-center justify-center rounded-full bg-card text-[10px] text-ink2',
                index > 0 && '-ml-2',
              )}
            >
              {member.name.trim().charAt(0).toUpperCase()}
            </span>
          ))
        ) : (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-card text-[10px] text-ink2">
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
 * The foot of both sidebars: who this household is, and the one way out of the
 * app. Sign-out is not confirmed — nothing is lost by it, and a confirm dialog
 * on a reversible action is friction, not safety.
 */
function SidebarFooter({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation()
  const logout = useLogout()

  return (
    <div className="pt-6">
      <div className="px-3">
        <HouseholdFooter />
      </div>

      <button
        type="button"
        className="nav-item mt-3 w-full"
        onClick={() => {
          onNavigate?.()
          void logout()
        }}
      >
        <LogOut className="size-4 shrink-0" strokeWidth={1.75} />
        <span className="truncate">{t('shell.logout')}</span>
      </button>
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
  const scrollRef = useRef<HTMLElement>(null)

  // `<main>` is the scroll container now, and it is NOT remounted between
  // routes — without this, opening a page from halfway down a long list would
  // land on it already scrolled. The inner `motion.div` remounts; this element
  // does not.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
  }, [location.pathname])

  return (
    // `h-dvh` + `overflow-hidden`: the shell owns the viewport and the sidebar
    // never scrolls with the page. `dvh` rather than `vh` so the mobile address
    // bar can't push the bottom nav out of reach.
    <div className="flex h-dvh overflow-hidden">
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

        {/* Only the nav scrolls if it outgrows the viewport — the logo, the
            what-if CTA and the footer stay put. */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <NavGroups />
        </div>

        <SidebarFooter />
      </aside>

      <main ref={scrollRef} className="min-w-0 flex-1 overflow-y-auto">
        <Dialog.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
          <header className="sticky top-0 z-30 flex items-center gap-3 bg-canvas/90 px-5 py-3 backdrop-blur-xl lg:hidden">
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

              <div className="min-h-0 flex-1 overflow-y-auto">
                <NavGroups onNavigate={() => setDrawerOpen(false)} />
              </div>

              <SidebarFooter onNavigate={() => setDrawerOpen(false)} />
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

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
 * Sidebar nav — one flat list.
 *
 * It used to carry three group headings over six destinations, one of them
 * heading a single item. That is more label than nav: the headings named a
 * taxonomy the household never asked about, and the list is short enough to
 * scan without them. Order still encodes priority (04-recipes §2): where we
 * stand, then what is coming, then the shared record.
 */
const NAV_ITEMS: NavItem[] = [
  { to: '/', labelKey: 'nav.dashboard', icon: LayoutGrid },
  { to: '/upcoming', labelKey: 'nav.upcoming', icon: CalendarDays },
  // Assets and debts are one route and one destination.
  { to: '/networth', labelKey: 'nav.assetsDebts', icon: Wallet, alsoActiveOn: ['/assets', '/debts'] },
  { to: '/goals', labelKey: 'nav.goals', icon: Target },
  { to: '/events', labelKey: 'nav.events', icon: CircleDollarSign },
  { to: '/household', labelKey: 'nav.household', icon: Users },
]

/**
 * One rail item (v5 04-recipes §15).
 *
 * Icon-only, so `aria-label` and `title` are mandatory — §15 allows an icon
 * rail only when the icons are distinct AND both are present. The drawer keeps
 * labelled rows: a small screen is not where discoverability gets traded away.
 */
function RailItem({ item }: { item: NavItem }) {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const { to, labelKey, icon: Icon, alsoActiveOn } = item

  const activeElsewhere = (alsoActiveOn ?? []).some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
  const label = t(labelKey)

  return (
    <NavLink
      to={to}
      end={to === '/'}
      className="rail-item"
      aria-label={label}
      title={label}
      aria-current={activeElsewhere ? 'page' : undefined}
    >
      <Icon className="size-[19px] shrink-0" strokeWidth={1.5} />
    </NavLink>
  )
}

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
  return (
    <nav className="mt-5 space-y-0.5">
      {NAV_ITEMS.map((item) => (
        <NavItemLink key={item.to} item={item} onNavigate={onNavigate} />
      ))}
    </nav>
  )
}

/** The sole what-if entry point, directly under the sidebar logo. */
function SimulateButton({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation()

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-11 w-full items-center justify-center gap-2 rounded-pill bg-action t-body-sm font-medium text-action-inverse"
    >
      <Calculator className="size-4" strokeWidth={1.5} />
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
                'flex h-7 w-7 items-center justify-center rounded-full bg-card t-caption-sm text-ink2',
                index > 0 && '-ml-2',
              )}
            >
              {member.name.trim().charAt(0).toUpperCase()}
            </span>
          ))
        ) : (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-card t-caption-sm text-ink2">
            {activeHousehold?.name?.trim().charAt(0).toUpperCase() ?? 'M'}
          </span>
        )}
      </div>

      <div className="min-w-0">
        <p className="truncate t-caption">
          {activeHousehold?.name ?? t('shell.householdName')}
        </p>
        {active.length > 0 ? (
          <p className="font-mono t-caption-sm text-ink3">{active.length}</p>
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
/**
 * The rail foot: what-if, then the household mark and sign-out. Icon-only, so
 * each carries a label and a tooltip like every other rail item (§15).
 */
function RailFooter({ onSimulate }: { onSimulate: () => void }) {
  const { t } = useTranslation()
  const logout = useLogout()

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={onSimulate}
        className="flex size-11 items-center justify-center rounded-pill bg-action text-action-inverse"
        aria-label={t('home.picture.simulate')}
        title={t('home.picture.simulate')}
      >
        <Calculator className="size-[19px]" strokeWidth={1.5} />
      </button>

      <button
        type="button"
        className="rail-item"
        onClick={() => void logout()}
        aria-label={t('shell.logout')}
        title={t('shell.logout')}
      >
        <LogOut className="size-[19px] shrink-0" strokeWidth={1.5} />
      </button>
    </div>
  )
}

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
 * App shell (v5 01-foundations §2.2, §3; 04-recipes §15).
 *
 * The shell backdrop carries a soft tint in the hero hue so the glass sidebar
 * has something to refract — it is a BACKDROP, not a surface: no card sits on
 * it. The content area keeps `--canvas` as its ground, and cards sit DIRECTLY
 * on canvas with no sheet or wrapper panel between them (§2.2).
 *
 * Glass is chrome only. Navigation is translucent; the thing being navigated
 * is opaque.
 *
 * The blue (`--hero`) is not a page background. It belongs to the hero CARD
 * only — one surface, inside the page, carrying page identity and context (§3).
 *
 * v5 §15 permits a labelled sidebar over an icon rail when navigation cannot be
 * read by icon alone — "không hy sinh discoverability chỉ để giống visual
 * reference". Six destinations across three groups is exactly that case, so the
 * labels stay; only the surfaces change.
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
    <div className="shell-backdrop flex h-dvh overflow-hidden">
      <aside className="glass glass-edge hidden w-[72px] shrink-0 flex-col items-center py-5 lg:flex">
        <span
          className="flex size-9 items-center justify-center rounded-pill bg-action t-body-sm font-medium text-action-inverse"
          aria-label="Money Space"
          title="Money Space"
        >
          M
        </span>

        <nav className="mt-6 flex flex-col items-center gap-1.5">
          {NAV_ITEMS.map((item) => (
            <RailItem key={item.to} item={item} />
          ))}
        </nav>

        <div className="flex-1" />

        <RailFooter onSimulate={() => openWhatIf({ source: 'other' })} />
      </aside>

      <main ref={scrollRef} className="min-w-0 flex-1 overflow-y-auto">
        <Dialog.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
          <header className="flex items-center gap-3 px-5 py-3 lg:hidden">
            <span className="flex size-7 items-center justify-center rounded-pill bg-action t-caption font-medium text-action-inverse">
              M
            </span>
            <p className="t-body-sm font-medium">Money Space</p>

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
            <Dialog.Content className="glass fixed inset-y-0 right-0 z-50 flex w-[280px] max-w-[82vw] flex-col rounded-none px-4 py-5 outline-none data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=closed]:duration-200 data-[state=open]:animate-in data-[state=open]:slide-in-from-right data-[state=open]:duration-300 lg:hidden">
              <div className="flex items-center gap-2.5 px-3">
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-md t-caption-sm font-medium text-white"
                  style={{ background: 'var(--accent)' }}
                >
                  M
                </span>
                <Dialog.Title className="t-body-sm font-medium">Money Space</Dialog.Title>
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
          className="flex min-h-full flex-col"
        >
          {/* Canvas is the ground for everything. Cards sit directly on it —
              no sheet, no wrapper panel (01-foundations §2.2). */}
          {/* Cards sit on `--canvas`; the tinted backdrop stays behind the
              chrome only, so no card is ever asked to read against it. */}
          <div className="min-h-full flex-1 bg-canvas s-page pb-24 lg:pb-8">
            <div className="mx-auto w-full max-w-[1280px]">
              <Outlet />
            </div>
          </div>
        </motion.div>
      </main>

      {/* What-if is deliberately not a route (§2.9). Its sheet is mounted once
          here and opened only by the sidebar CTA. */}
      <MobileBottomNav />
      <WhatIfSheet />
    </div>
  )
}

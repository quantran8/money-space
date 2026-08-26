import { useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import {
  Calculator,
  CalendarClock,
  House,
  LogOut,
  Settings,
  Target,
  Timeline,
  Wallet,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

import { MobileBottomNav } from '@/app/layout/mobile-bottom-nav'
import { WhatIfSheet } from '@/features/whatif/ui/whatif-sheet'

import type { ComponentType } from 'react'

import { pageTransition, pageVariants } from '@/components/ui/motion'
import { useLogout } from '@money-space/core/features/auth/hooks/use-logout'
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
  { to: '/', labelKey: 'nav.dashboard', icon: House },
  { to: '/upcoming', labelKey: 'nav.upcoming', icon: CalendarClock },
  // Assets and debts are one route and one destination.
  { to: '/networth', labelKey: 'nav.assetsDebts', icon: Wallet, alsoActiveOn: ['/assets', '/debts'] },
  { to: '/goals', labelKey: 'nav.goals', icon: Target },
  { to: '/events', labelKey: 'nav.events', icon: Timeline },
  { to: '/household', labelKey: 'nav.household', icon: Settings },
]

/**
 * One rail item (v5 04-recipes §15).
 *
 * Icon-only, so `aria-label` and `title` are mandatory — §15 allows an icon
 * rail only when the icons are distinct AND both are present. Small screens do
 * not use this rail at all — they get the labelled bottom tab bar.
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
 * Navigation is per-breakpoint, and each breakpoint gets exactly one: the icon
 * rail on desktop, the labelled bottom tab bar on mobile. There is no drawer —
 * a hamburger beside a tab bar is two answers to the same question.
 */
export function AppShell() {
  const location = useLocation()
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
        {/* Mobile identity only. The hamburger and its drawer are gone: the
            bottom tab bar already carries navigation, and two nav affordances
            on one screen make the reader choose between them. Everything the
            drawer alone used to hold has moved — sign-out to /household,
            what-if to the bar's floating button. */}
        <header className="flex items-center gap-3 px-5 py-3 lg:hidden">
          <span className="flex size-7 items-center justify-center rounded-pill bg-action t-caption font-medium text-action-inverse">
            M
          </span>
          <p className="t-body-sm font-medium">Money Space</p>
        </header>

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
          here; the rail foot opens it on desktop, the bar's floating button on
          mobile. */}
      <MobileBottomNav />
      <WhatIfSheet />
    </div>
  )
}

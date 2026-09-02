import { useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import {
  Calculator,
  CalendarClock,
  ChevronsUpDown,
  House,
  LogOut,
  PanelLeft,
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

import { AppLogo } from '@/components/ui/app-logo'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { pageTransition, pageVariants } from '@/components/ui/motion'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import { useLogout } from '@money-space/core/features/auth/hooks/use-logout'
import { useSession } from '@money-space/core/features/auth/hooks/use-session'
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
  { to: '/', labelKey: 'nav.dashboard', icon: House },
  { to: '/upcoming', labelKey: 'nav.upcoming', icon: CalendarClock },
  // Assets and debts are one route and one destination.
  { to: '/networth', labelKey: 'nav.assetsDebts', icon: Wallet, alsoActiveOn: ['/assets', '/debts'] },
  { to: '/goals', labelKey: 'nav.goals', icon: Target },
  { to: '/events', labelKey: 'nav.events', icon: Timeline },
  { to: '/household', labelKey: 'nav.household', icon: Settings },
]

/**
 * One nav item.
 *
 * Collapsed it is icon-only, which v5 §15 allows only when the icons are
 * distinct AND both `aria-label` and a tooltip are present — so both are set
 * here regardless of state, and `SidebarMenuButton` shows the tooltip only
 * while collapsed.
 */
function NavMenuItem({ item }: { item: NavItem }) {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const { to, labelKey, icon: Icon, alsoActiveOn } = item

  // Active is computed here rather than left to NavLink's `className` render
  // prop. Under `asChild`, Slot merges the parent's className with the child's
  // by STRING concatenation — handed a function it stringifies the source, so
  // the whole arrow expression landed in the class attribute and the active
  // pill never applied. `end` semantics are reproduced by hand instead.
  const isActive =
    (to === '/' ? pathname === '/' : pathname === to || pathname.startsWith(`${to}/`)) ||
    (alsoActiveOn ?? []).some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    )
  const label = t(labelKey)

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild tooltip={label} isActive={isActive}>
        <NavLink
          to={to}
          end={to === '/'}
          aria-label={label}
          title={label}
          aria-current={isActive ? 'page' : undefined}
        >
          <Icon className="shrink-0" strokeWidth={1.5} />
          <span className="truncate">{label}</span>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

/**
 * The initials fallback. `displayName` is optional and `fullName` may be the
 * only thing set, so this walks both before falling back to the email local
 * part — an avatar with a "?" in it reads as a broken account, not an empty one.
 */
function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
}

/**
 * The account row at the sidebar foot: avatar, name, email — click for the
 * menu that holds sign-out.
 *
 * Sign-out used to sit in the rail as a bare icon. That put a destructive,
 * rarely-used action at the same weight as the six destinations above it, one
 * mis-click from ending the session. Behind an account menu it is where people
 * already look for it, and the row earns its space by showing WHO is signed in
 * — the one thing a shared household picture should never leave ambiguous.
 */
function SidebarAccount() {
  const { t } = useTranslation()
  const logout = useLogout()
  const { user } = useSession()

  const name = user?.displayName ?? user?.fullName ?? user?.email?.split('@')[0] ?? t('shell.guest')
  const email = user?.email ?? ''
  const initials = initialsOf(name)

  const avatar = user?.avatarUrl ? (
    <img
      data-account-avatar
      src={user.avatarUrl}
      alt=""
      className="size-8 shrink-0 rounded-pill object-cover"
    />
  ) : (
    <span
      data-account-avatar
      aria-hidden
      className="flex size-8 shrink-0 items-center justify-center rounded-pill bg-accent-soft t-caption text-ink"
    >
      {initials}
    </span>
  )

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              tooltip={name}
              aria-label={t('shell.accountMenu')}
              // Collapsed, the row becomes the avatar disc alone. The button
              // hides its non-icon children in the rail, and the avatar is a
              // `span`/`img`, so it is exempted explicitly here rather than
              // relying on that rule to guess which child is the picture.
              className={cn(
                "gap-2.5",
                // Collapsed it matches the other rail items: a 44px target with the
                // avatar centred in it.
                "group-data-[collapsible=icon]:size-11 group-data-[collapsible=icon]:p-0",
                "[&_img[data-account-avatar]]:!block [&_span[data-account-avatar]]:!flex",
              )}
            >
              {avatar}
              {/* min-w-0 so a long email truncates rather than pushing the
                  chevron out of the row. */}
              <span className="flex min-w-0 flex-1 flex-col text-left">
                <span className="t-body-sm truncate">{name}</span>
                {email && <span className="t-caption truncate text-ink3">{email}</span>}
              </span>
              {/* The chevron is an svg, so the button's "hide everything that
                  is not an icon" rule keeps it — it needs its own. Collapsed,
                  the row is just the avatar disc: a caret crammed beside it
                  reads as a second glyph, not as an affordance. */}
              <ChevronsUpDown
                className="ml-auto size-4 shrink-0 text-ink3 group-data-[collapsible=icon]:hidden"
                strokeWidth={1.5}
              />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          {/* Opens to the RIGHT, out over the page, in both states — shadcn's
              placement. `side="top"` put the menu back inside the sidebar's own
              column, sitting on the nav it was launched from; the panel is
              240px and the menu 224px, so it covered the rail almost exactly
              and read as part of it rather than as something on top. */}
          <DropdownMenuContent
            align="end"
            side="right"
            sideOffset={12}
            className="w-56"
          >
            <DropdownMenuLabel className="flex items-center gap-2.5 font-normal">
              {avatar}
              <span className="flex min-w-0 flex-col">
                <span className="t-body-sm truncate">{name}</span>
                {email && <span className="t-caption truncate text-ink3">{email}</span>}
              </span>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem onSelect={() => void logout()}>
              <LogOut strokeWidth={1.5} />
              {t('shell.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

/**
 * The head: the mark and the wordmark. The collapse toggle is NOT here — it
 * lives in the content header, outside the panel, so it stays reachable in both
 * states. A trigger inside the sidebar vanishes with the labels exactly when it
 * is needed most.
 */
function SidebarHead() {
  const { t } = useTranslation()
  const { state, toggleSidebar } = useSidebar()
  const collapsed = state === 'collapsed'

  if (collapsed) {
    // Collapsed, the mark IS the toggle. The rail has no room for a separate
    // control, and the logo is the one thing already sitting in that spot —
    // swapping it on hover keeps the affordance where the eye already is
    // instead of hiding it on the panel's edge.
    return (
      <button
        type="button"
        onClick={toggleSidebar}
        aria-label={t('shell.openMenu')}
        title={t('shell.openMenu')}
        // 44px target (§11), with the 36px mark centred inside it: as a real
        // button now, it has to clear the touch floor the rail items do.
        className="group/mark relative mx-auto flex size-11 shrink-0 items-center justify-center rounded-[11px]"
      >
        <AppLogo className="size-9 rounded-[11px] transition-opacity group-hover/mark:opacity-0" />
        {/* Sits exactly over the mark rather than replacing it in the DOM, so
            the swap costs no layout and cannot shift the rail. */}
        <PanelLeft
          aria-hidden
          className="absolute size-[19px] text-ink2 opacity-0 transition-opacity group-hover/mark:opacity-100"
          strokeWidth={1.5}
        />
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2.5">
      <span className="flex shrink-0" aria-label="Oursight" title="Oursight" role="img">
        <AppLogo className="size-9 rounded-[11px]" />
      </span>
      <p className="t-body-sm truncate font-medium">Oursight</p>
      <button
        type="button"
        onClick={toggleSidebar}
        aria-label={t('shell.closeMenu')}
        title={t('shell.closeMenu')}
        className="ml-auto flex size-8 shrink-0 items-center justify-center rounded-pill text-ink2 transition-colors hover:bg-white/75 hover:text-ink"
      >
        <PanelLeft className="size-[18px]" strokeWidth={1.5} />
      </button>
    </div>
  )
}

function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="py-4">
        <SidebarHead />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {NAV_ITEMS.map((item) => (
              <NavMenuItem key={item.to} item={item} />
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="pb-5">
        <SidebarAccount />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
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
 * Navigation is per-breakpoint, and each breakpoint gets exactly one: the
 * sidebar on desktop, the labelled bottom tab bar on mobile. There is no
 * drawer — a hamburger beside a tab bar is two answers to the same question.
 *
 * The sidebar is shadcn's, collapsible between a 240px labelled panel and the
 * 72px icon rail the spec fixes at 68–76px. Both states are sanctioned by
 * 04-product-recipes §Desktop; the collapsed one is what the shell shipped
 * before, so nothing is lost by defaulting to labels.
 */
export function AppShell() {
  const { t } = useTranslation()
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
    <SidebarProvider defaultOpen={false} className="shell-backdrop h-dvh overflow-hidden">
      <AppSidebar />

      <main ref={scrollRef} className="min-w-0 flex-1 overflow-y-auto bg-canvas">
        {/* Mobile identity only. The hamburger and its drawer are gone: the
            bottom tab bar already carries navigation, and two nav affordances
            on one screen make the reader choose between them. Everything the
            drawer alone used to hold has moved — sign-out to /household,
            what-if to the bar's floating button. */}
        <header className="flex items-center gap-3 px-5 py-3 lg:hidden">
          <AppLogo className="size-7 rounded-[9px]" />
          <p className="t-body-sm font-medium">Oursight</p>
        </header>

        {/* What-if is a GLOBAL action, not a page one: it is available from
            every screen and belongs to no route (§2.9). It is the desktop
            counterpart of the mobile bar's floating button — same treatment,
            opposite breakpoint — rather than a top-right control, because four
            pages already put their own action in that corner and a global
            button would land on top of them.

            `fixed`, so it stays put while `<main>` scrolls beneath it. */}
        <button
          type="button"
          onClick={() => openWhatIf({ source: 'other' })}
          aria-label={t('home.picture.simulate')}
          title={t('home.picture.simulate')}
          className={cn(
            'fixed right-12 bottom-7 z-30 hidden items-center gap-2 rounded-pill',
            'bg-action px-5 py-3.5 t-body-sm text-action-inverse shadow-lg lg:flex',
          )}
        >
          <Calculator className="size-5 shrink-0" strokeWidth={1.5} />
          {t('home.picture.simulate')}
        </button>

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
          <div className="min-h-full flex-1 s-page pb-24 lg:pb-8">
            <div className="mx-auto w-full max-w-[1280px]">
              <Outlet />
            </div>
          </div>
        </motion.div>
      </main>

      {/* What-if is deliberately not a route (§2.9). Its sheet is mounted once
          here; the foot opens it on desktop, the bar's floating button on
          mobile. */}
      <MobileBottomNav />
      <WhatIfSheet />
    </SidebarProvider>
  )
}

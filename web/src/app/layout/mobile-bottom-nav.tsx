import { CalendarDays, LayoutGrid, Target, Users, Wallet } from 'lucide-react'
import type { ComponentType } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, useLocation } from 'react-router-dom'

import { cn } from '@money-space/core/shared/lib/utils'

type BottomNavItem = {
  to: string
  labelKey: string
  icon: ComponentType<{ className?: string; strokeWidth?: number }>
  /** Extra route prefixes that should keep this item highlighted. */
  alsoActiveOn?: string[]
}

/**
 * Mobile bottom nav — the FIVE primary destinations only (Phase 10). The three
 * secondary ones stay in the drawer: a bottom bar with eight targets is a bar
 * nobody can hit.
 */
const items: BottomNavItem[] = [
  { to: '/', labelKey: 'nav.dashboard', icon: LayoutGrid },
  { to: '/upcoming', labelKey: 'nav.upcoming', icon: CalendarDays },
  { to: '/goals', labelKey: 'nav.goals', icon: Target },
  {
    to: '/networth',
    labelKey: 'nav.assetsDebts',
    icon: Wallet,
    // The asset/debt detail routes belong to this destination too.
    alsoActiveOn: ['/assets', '/debts'],
  },
  { to: '/household', labelKey: 'nav.household', icon: Users },
]

export function MobileBottomNav() {
  const { t } = useTranslation()
  const { pathname } = useLocation()

  return (
    <nav
      className={cn(
        'fixed inset-x-0 bottom-0 z-30 flex items-stretch justify-around',
        // Bottom nav is one of the two places §2.4 still allows a divider — the
        // bar floats over scrolling content and needs an edge to sit on.
        'border-t border-divider bg-card lg:hidden',
        // Clear the home indicator on iOS.
        'pb-[env(safe-area-inset-bottom)]',
      )}
    >
      {items.map(({ to, labelKey, icon: Icon, alsoActiveOn }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            cn(
              // 44px minimum touch target (§24).
              'flex min-h-11 flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[11px] transition-colors',
              // A merged item stays lit on its sibling routes too.
              isActive ||
                (alsoActiveOn ?? []).some(
                  (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
                )
                ? 'font-medium text-ink'
                : 'text-ink2',
            )
          }
        >
          <Icon className="size-5" strokeWidth={1.75} />
          <span className="truncate px-1">{t(labelKey)}</span>
        </NavLink>
      ))}
    </nav>
  )
}

import { Calculator, CalendarClock, House, Target, Timeline, Wallet } from 'lucide-react'
import type { ComponentType } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, useLocation } from 'react-router-dom'

import { cn } from '@money-space/core/shared/lib/utils'
import { useWhatIfStore } from '@money-space/core/shared/stores/whatif-store'

type BottomNavItem = {
  to: string
  labelKey: string
  icon: ComponentType<{ className?: string; strokeWidth?: number }>
  /** Extra route prefixes that should keep this item highlighted. */
  alsoActiveOn?: string[]
}

/**
 * Mobile bottom nav — the FIVE primary destinations only (Phase 10). The rest
 * live elsewhere: a bottom bar with eight targets is a bar nobody can hit.
 *
 * The fifth tab is the money-events record, not Settings. Settings is a
 * once-a-month errand and it now has its own icon in the mobile header; the
 * shared record is what the household opens daily, and it was the one
 * destination reachable on desktop but not here.
 */
const items: BottomNavItem[] = [
  { to: '/', labelKey: 'nav.dashboard', icon: House },
  { to: '/upcoming', labelKey: 'nav.upcoming', icon: CalendarClock },
  { to: '/goals', labelKey: 'nav.goals', icon: Target },
  {
    to: '/networth',
    labelKey: 'nav.assetsDebts',
    icon: Wallet,
    // The asset/debt detail routes belong to this destination too.
    alsoActiveOn: ['/assets', '/debts'],
  },
  { to: '/events', labelKey: 'nav.events', icon: Timeline },
]

export function MobileBottomNav() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const openWhatIf = useWhatIfStore((store) => store.openWhatIf)

  return (
    <>
      {/* What-if is not a route (§2.9), so it cannot be a tab — it is an action.
          It used to live in the mobile drawer; with the drawer gone this button
          is its only entry point on small screens, so it sits above the bar
          rather than inside it: a floating action reads as "do a thing", which
          is what it is, and it keeps the five tabs at full width. */}
      <button
        type="button"
        onClick={() => openWhatIf({ source: 'other' })}
        aria-label={t('home.picture.simulate')}
        title={t('home.picture.simulate')}
        className={cn(
          'fixed right-4 z-30 flex size-14 items-center justify-center rounded-pill',
          'bg-action text-action-inverse shadow-lg lg:hidden',
          // Clears the bar (its own height plus the home indicator) so the
          // button never covers a tab label.
          'bottom-[calc(env(safe-area-inset-bottom)+5.5rem)]',
        )}
      >
        <Calculator className="size-6" strokeWidth={1.5} />
      </button>

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
              'flex min-h-11 flex-1 flex-col items-center justify-center gap-1 py-2.5 t-caption-sm transition-colors',
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
    </>
  )
}

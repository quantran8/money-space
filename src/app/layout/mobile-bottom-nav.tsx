import { CalendarClock, Home, Target, Users, Wallet } from 'lucide-react'
import type { ComponentType } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'

import { cn } from '@/shared/lib/utils'

type BottomNavItem = {
  to: string
  labelKey: string
  icon: ComponentType<{ className?: string; strokeWidth?: number }>
}

/**
 * Mobile bottom nav — the FIVE primary destinations only (Phase 10). The three
 * secondary ones stay in the drawer: a bottom bar with eight targets is a bar
 * nobody can hit.
 */
const items: BottomNavItem[] = [
  { to: '/', labelKey: 'nav.dashboard', icon: Home },
  { to: '/upcoming', labelKey: 'nav.upcoming', icon: CalendarClock },
  { to: '/goals', labelKey: 'nav.goals', icon: Target },
  { to: '/assets', labelKey: 'nav.assets', icon: Wallet },
  { to: '/household', labelKey: 'nav.household', icon: Users },
]

export function MobileBottomNav() {
  const { t } = useTranslation()

  return (
    <nav
      className={cn(
        'fixed inset-x-0 bottom-0 z-30 flex items-stretch justify-around',
        'border-t border-border bg-card/90 backdrop-blur-xl lg:hidden',
        // Clear the home indicator on iOS.
        'pb-[env(safe-area-inset-bottom)]',
      )}
    >
      {items.map(({ to, labelKey, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            cn(
              'flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors',
              isActive ? 'text-foreground' : 'text-muted-foreground',
            )
          }
        >
          <Icon className="size-5" strokeWidth={1.8} />
          <span className="truncate px-1">{t(labelKey)}</span>
        </NavLink>
      ))}
    </nav>
  )
}

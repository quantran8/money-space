import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'

import { cn } from '@/shared/lib/utils'

export function AssetsDebtTabs() {
  const { t } = useTranslation()

  return (
    <nav className="flex w-fit items-center gap-1 rounded-sunk bg-sunk p-1" aria-label={t('assets.tabs.label')}>
      {([
        ['/assets', 'nav.assets'],
        ['/debts', 'nav.debts'],
      ] as const).map(([to, labelKey]) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              'rounded-control px-4 py-2 text-[13px] transition-colors',
              isActive ? 'bg-panel font-medium text-ink' : 'text-ink2 hover:text-ink',
            )
          }
        >
          {t(labelKey)}
        </NavLink>
      ))}
    </nav>
  )
}

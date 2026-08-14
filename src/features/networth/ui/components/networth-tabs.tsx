import { useTranslation } from 'react-i18next'

import { cn } from '@/shared/lib/utils'

export type NetWorthTab = 'assets' | 'debts'

const TABS: { value: NetWorthTab; labelKey: string }[] = [
  { value: 'assets', labelKey: 'nav.assets' },
  { value: 'debts', labelKey: 'nav.debts' },
]

/**
 * Assets / debts switch. These were two routes with a NavLink tab bar; now
 * they are one route and the tab is plain state, so this is a real tablist
 * rather than navigation.
 */
export function NetWorthTabs({
  value,
  onChange,
}: {
  value: NetWorthTab
  onChange: (tab: NetWorthTab) => void
}) {
  const { t } = useTranslation()

  return (
    <div
      role="tablist"
      aria-label={t('assets.tabs.label')}
      className="flex w-fit items-center gap-1 rounded-sunk bg-sunk p-1"
    >
      {TABS.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={value === tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            'rounded-control px-4 py-2 text-[13px] transition-colors',
            value === tab.value ? 'bg-panel font-medium text-ink' : 'text-ink2 hover:text-ink',
          )}
        >
          {t(tab.labelKey)}
        </button>
      ))}
    </div>
  )
}

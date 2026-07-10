import { useTranslation } from 'react-i18next'

import { cn } from '@/shared/lib/utils'
import type { AuthTab } from '@/features/auth/model/auth-form'

type AuthTabsProps = {
  tab: AuthTab
  onTabChange: (tab: AuthTab) => void
}

export function AuthTabs({ tab, onTabChange }: AuthTabsProps) {
  const { t } = useTranslation()

  return (
    <div className="rounded-full bg-[hsl(var(--muted))] p-1">
      <div className="grid grid-cols-2 gap-1">
        <TabButton active={tab === 'login'} onClick={() => onTabChange('login')}>
          {t('auth.tabs.login')}
        </TabButton>
        <TabButton active={tab === 'signup'} onClick={() => onTabChange('signup')}>
          {t('auth.tabs.signup')}
        </TabButton>
      </div>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full px-4 py-2.5 text-sm font-semibold transition-colors',
        active
          ? 'bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-[0_8px_24px_rgba(0,0,0,0.04)]'
          : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]',
      )}
    >
      {children}
    </button>
  )
}

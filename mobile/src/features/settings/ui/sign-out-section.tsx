import { Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { useLogout } from '@money-space/core/features/auth/hooks/use-logout'

import { Button, Panel, PanelHeader } from '@/components/ui'

/**
 * Signing out of the space.
 *
 * It used to be reachable only from the nav drawer, which no longer exists —
 * the tab bar is the navigation now. This hub answers "who is in this space and
 * how is it set up", and leaving it is part of that question, so the action
 * belongs here rather than in a menu.
 *
 * `secondary`, not the primary or the destructive treatment: signing out loses
 * nothing and is fully reversible by signing back in. The one irreversible
 * action on this screen is deleting the household, and it keeps the alert tone
 * to itself.
 */
export function SignOutSection() {
  const { t } = useTranslation()
  const logout = useLogout()

  return (
    <Panel>
      <PanelHeader
        title={t('shell.logout')}
        right={<Text className="t-caption text-ink3">{t('shell.logoutMeta')}</Text>}
      />

      <Text className="mt-4 t-body-sm leading-5 text-ink2">
        {t('shell.logoutDescription')}
      </Text>

      <View className="mt-4 flex-row">
        {/* The web pairs this with a LogOut glyph. `Button` here is text-only
            by design — one Button, one way to label it — and widening the
            primitive for a single call site is how a kit stops being a kit. */}
        <Button variant="secondary" className="px-4" onPress={() => void logout()}>
          {t('shell.logout')}
        </Button>
      </View>
    </Panel>
  )
}

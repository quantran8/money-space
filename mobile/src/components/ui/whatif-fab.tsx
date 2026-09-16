import Ionicons from '@expo/vector-icons/Ionicons'
import { Pressable } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { sourceForPathname } from '@money-space/core/features/whatif/model/whatif-source'
import { useLocation } from '@money-space/core/shared/navigation'
import { useWhatIfStore } from '@money-space/core/shared/stores/whatif-store'

import { colors, overlayShadow } from '@/theme/tokens'

/** Web's `bottom-[calc(env(safe-area-inset-bottom)+5.5rem)]` — clears the bar. */
const BAR_CLEARANCE = 88

/**
 * What-if, reachable from every tab — the counterpart of the web's mobile FAB.
 *
 * It is an action, not a route, so it cannot be a sixth tab (§8) and does not
 * belong in the bar. `source` comes from the pathname because this is the only
 * entry point, so it can only mean "which screen was open when it was pressed".
 */
export function WhatIfFab() {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const { pathname } = useLocation()
  const openWhatIf = useWhatIfStore((store) => store.openWhatIf)

  return (
    <Pressable
      onPress={() => openWhatIf({ source: sourceForPathname(pathname) })}
      accessibilityRole="button"
      accessibilityLabel={t('home.picture.simulate')}
      style={{
        position: 'absolute',
        right: 16,
        bottom: insets.bottom + BAR_CLEARANCE,
        width: 56,
        height: 56,
        backgroundColor: colors.action,
        ...overlayShadow,
      }}
      className="items-center justify-center rounded-pill active:opacity-90"
    >
      <Ionicons name="calculator-outline" size={24} color={colors.actionInverse} />
    </Pressable>
  )
}

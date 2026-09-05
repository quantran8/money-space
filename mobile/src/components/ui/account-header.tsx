import { Image, Pressable, Text, View } from 'react-native'
import { Settings } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'

import { useSession } from '@money-space/core/features/auth/hooks/use-session'
import { useNavigate } from '@money-space/core/shared/navigation'

import { TOUCH_TARGET, colors } from '@/theme/tokens'

/** "Quan Tran" → "QT"; a single word → its first two letters. */
function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
}

/**
 * Who is signed in, and the way to settings — the row above every tab's title.
 *
 * On a phone an app mark and a wordmark are a row spent telling the reader
 * which app they just opened. "Whose account is this" is the question a SHARED
 * household picture must never leave ambiguous, and it fits the same space.
 *
 * Identity only: no account menu. Signing out is destructive and already has a
 * home on Gia đình, and putting it in the chrome would be one mis-tap from
 * ending the session.
 *
 * The gear goes to `/(tabs)/household`, NOT to a settings route — mobile folds
 * settings into Gia đình rather than giving it a screen of its own. Once the
 * fifth tab became Sự kiện, this icon is how that destination is reached.
 */
export function AccountHeader() {
  const { t } = useTranslation()
  const { user } = useSession()
  const navigate = useNavigate()

  const name =
    user?.displayName ?? user?.fullName ?? user?.email?.split('@')[0] ?? t('shell.guest')

  return (
    <View className="mb-3 flex-row items-center gap-2.5">
      <AccountAvatar name={name} avatarUrl={user?.avatarUrl ?? null} />

      {/* Truncates rather than pushing the gear off the row. */}
      <Text className="min-w-0 flex-1 t-body-sm font-medium text-ink" numberOfLines={1}>
        {name}
      </Text>

      <Pressable
        onPress={() => navigate('/(tabs)/household')}
        accessibilityRole="button"
        accessibilityLabel={t('nav.settings')}
        // 44pt (§24), pulled flush with the page gutter so the glyph lines up
        // with the content below it.
        style={{ width: TOUCH_TARGET, height: TOUCH_TARGET, marginRight: -12 }}
        className="items-center justify-center rounded-pill active:bg-wash"
      >
        <Settings size={20} color={colors.ink2} strokeWidth={1.75} />
      </Pressable>
    </View>
  )
}

/**
 * The picture when there is one, initials when there is not.
 *
 * The `protect` ring is load-bearing, not trim. An unringed disc filled with
 * `accentSoft` measures 1.01:1 against `canvas` — and this row sits directly
 * on canvas — so it dissolved into the background and a photo bled into it.
 * `divider` is no fix at 1.01:1 either. `protect` is the strongest neutral
 * structural token, and `committed` under the initials gives the disc a body
 * of its own on every surface.
 */
function AccountAvatar({ name, avatarUrl }: { name: string; avatarUrl: string | null }) {
  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        accessibilityIgnoresInvertColors
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: colors.protect,
        }}
      />
    )
  }

  return (
    <View
      accessible={false}
      style={{
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.protect,
        backgroundColor: colors.committed,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text className="t-caption text-ink">{initialsOf(name)}</Text>
    </View>
  )
}

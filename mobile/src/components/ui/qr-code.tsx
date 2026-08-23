import { View } from 'react-native'
import QRCodeSvg from 'react-native-qrcode-svg'

import { cn } from '@money-space/core/shared/lib/utils'

import { colors } from '@/theme/tokens'

/**
 * A scannable code.
 *
 * Rendered on a **white** plate regardless of the surrounding surface, and with
 * a quiet zone: a scanner needs the light modules to be genuinely light and the
 * code to be surrounded by clear space, so this is one of the few places the
 * app's own palette does not get a vote. `--sunk` behind a code is a code that
 * some cameras will refuse.
 *
 * `ecl="M"` is the library default and the right one here: the code carries a
 * join URL with a UUID in it, so a higher correction level would push the
 * module count up and the modules themselves smaller on a phone screen — which
 * costs more scans than the redundancy buys back.
 */
export function QrCode({
  value,
  size = 232,
  accessibilityLabel,
  className,
}: {
  value: string
  size?: number
  accessibilityLabel?: string
  className?: string
}) {
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      className={cn('items-center justify-center rounded-sunk bg-white p-3', className)}
    >
      <QRCodeSvg
        value={value}
        size={size}
        color={colors.ink}
        backgroundColor="#FFFFFF"
        quietZone={8}
      />
    </View>
  )
}

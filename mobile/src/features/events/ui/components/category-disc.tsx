import { View } from 'react-native'

import {
  CATEGORY_ICON_DEFAULT_COLOR,
  CATEGORY_ICON_FALLBACK,
  CATEGORY_ICONS,
} from '@/features/events/ui/components/category-icon'

/**
 * The coloured disc a category wears wherever an event is listed.
 *
 * One component rather than the markup repeated per surface: the disc is the
 * only thing carrying "what kind of spending this is" on a row whose title is
 * a free-text note, so a timeline and an upcoming list disagreeing about its
 * size or its fallback would read as two different meanings.
 *
 * The glyph is ALWAYS white — only the disc changes colour. A category picks
 * its fill freely, so tinting the glyph as well would put an arbitrary hue on
 * an arbitrary hue. A category with no colour falls back to a neutral, and an
 * `iconKey` this build has never seen (written by a newer client) falls back
 * to the dashed circle rather than rendering a hole.
 *
 * This is NOT the avatar disc mobile deliberately dropped from
 * `EventRecordRow` — an initial is a claim about WHO spent, which the Voice
 * rules forbid. A category says what the money was FOR.
 */
export function CategoryDisc({
  visual,
  size = 36,
}: {
  /**
   * Structurally core's `CategoryVisual`, with the fields optional so a
   * forecast row — whose map is built from the cashflow form's category
   * options and can miss an uncategorised event entirely — satisfies it too.
   */
  visual?: { iconKey?: string | null; iconColor?: string | null }
  /** 36 on a list row; a forecast row uses 32 beside its stacked lines. */
  size?: number
}) {
  const Icon = (visual?.iconKey && CATEGORY_ICONS[visual.iconKey]) || CATEGORY_ICON_FALLBACK

  return (
    <View
      accessible={false}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: visual?.iconColor ?? CATEGORY_ICON_DEFAULT_COLOR,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon size={Math.round(size * 0.44)} color="#ffffff" strokeWidth={1.75} />
    </View>
  )
}

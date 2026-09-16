/**
 * Mirror of `web/src/features/events/ui/components/category-icon.tsx`, drawn
 * with `@expo/vector-icons`.
 *
 * The KEYS are the contract — a category's `iconKey` is stored by the backend
 * and read by both clients, so a key present here and absent there (or vice
 * versa) renders a different glyph for the same row on the two platforms. Add
 * to both files or neither.
 */

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'

import { colors } from '@/theme/tokens'

/** A Material Community glyph name — what a category's key resolves to. */
export type CategoryGlyphName = React.ComponentProps<typeof MaterialCommunityIcons>['name']


/**
 * Every glyph a category can wear, grouped by theme rather than one-per-code.
 *
 * A household picks from a THEME (housing, transport, food, ...) and each
 * theme offers several plausible icons, not a single fixed one — two
 * households both categorizing "Ăn uống" may reasonably reach for the fork,
 * the coffee cup, or the pizza slice, and none of those readings is wrong.
 * `CATEGORY_ICON_GROUPS` is the picker's source of truth for that grouping;
 * `CATEGORY_ICONS` (flattened from it, plus a few standalone glyphs with no
 * natural group) is the flat key → component lookup every render site uses.
 *
 * Keyed by the stored key rather than by category CODE, which is what lets a
 * household's own custom category carry any glyph in the set — a code-based
 * map only ever covers the seeded system rows. Keys stay the kebab-case lucide
 * names the web still writes — they are the stored contract, so only the glyph
 * each one resolves to changed here. The 16 keys the
 * system categories were seeded with (see the backend migration) are each
 * still present, just no longer the only option for their theme.
 *
 * The backend shape-checks the key but does NOT pin the valid set — the client
 * owns this map, so an unrecognized key must resolve to `CATEGORY_ICON_FALLBACK`
 * rather than nothing. Read a single icon as
 * `CATEGORY_ICONS[key] ?? CATEGORY_ICON_FALLBACK` at the call site — see
 * the web's `category-icon.tsx` for the same map: the two must stay in
 * lockstep, because the KEYS are the cross-client contract, not the file.
 */
export const CATEGORY_ICON_GROUPS: { labelKey: string; icons: Record<string, CategoryGlyphName> }[] = [
  {
    labelKey: 'settings.categories.iconGroup.housing',
    icons: {
      house: 'home',
      home: 'home-variant',
      building: 'office-building',
      warehouse: 'warehouse',
    },
  },
  {
    labelKey: 'settings.categories.iconGroup.transport',
    icons: {
      bus: 'bus',
      'bus-front': 'bus-side',
      car: 'car',
      'car-taxi-front': 'taxi',
      bike: 'bike',
      fuel: 'gas-station',
      luggage: 'bag-suitcase',
    },
  },
  {
    labelKey: 'settings.categories.iconGroup.food',
    icons: {
      'utensils-crossed': 'silverware-fork-knife',
      coffee: 'coffee',
      pizza: 'pizza',
      apple: 'food-apple',
      carrot: 'carrot',
    },
  },
  {
    labelKey: 'settings.categories.iconGroup.health',
    icons: {
      'heart-pulse': 'heart-pulse',
      stethoscope: 'stethoscope',
      pill: 'pill',
      cross: 'hospital-box',
      syringe: 'needle',
      hospital: 'hospital-building',
      activity: 'pulse',
    },
  },
  {
    labelKey: 'settings.categories.iconGroup.family',
    icons: {
      users: 'account-group',
      user: 'account',
      baby: 'baby-carriage',
      dog: 'dog',
      cat: 'cat',
      'paw-print': 'paw',
    },
  },
  {
    labelKey: 'settings.categories.iconGroup.protection',
    icons: {
      'shield-check': 'shield-check',
      umbrella: 'umbrella',
    },
  },
  {
    labelKey: 'settings.categories.iconGroup.money',
    icons: {
      'piggy-bank': 'piggy-bank',
      wallet: 'wallet',
      coins: 'cash-multiple',
      'hand-coins': 'hand-coin',
      'credit-card': 'credit-card',
      receipt: 'receipt',
      'file-text': 'file-document',
    },
  },
  {
    labelKey: 'settings.categories.iconGroup.investing',
    icons: {
      'trending-up': 'trending-up',
      'trending-down': 'trending-down',
      'bar-chart': 'chart-bar',
      'line-chart': 'chart-line',
      'chart-pie': 'chart-pie',
      percent: 'percent',
      gem: 'diamond-stone',
    },
  },
  {
    labelKey: 'settings.categories.iconGroup.debt',
    icons: {
      landmark: 'bank',
    },
  },
  {
    labelKey: 'settings.categories.iconGroup.income',
    icons: {
      'arrow-down-left': 'arrow-bottom-left',
      briefcase: 'briefcase',
    },
  },
  {
    labelKey: 'settings.categories.iconGroup.repair',
    icons: {
      wrench: 'wrench',
      hammer: 'hammer',
      drill: 'screwdriver',
      'pen-tool': 'fountain-pen',
    },
  },
  {
    labelKey: 'settings.categories.iconGroup.household',
    icons: {
      'shopping-basket': 'basket',
      'shopping-cart': 'cart',
      'shopping-bag': 'shopping',
      store: 'storefront',
      shirt: 'tshirt-crew',
      scissors: 'content-cut',
      watch: 'watch',
    },
  },
  {
    labelKey: 'settings.categories.iconGroup.children',
    icons: {
      backpack: 'bag-personal',
      'graduation-cap': 'school',
      'book-open': 'book-open-variant',
      school: 'school',
    },
  },
  {
    labelKey: 'settings.categories.iconGroup.travel',
    icons: {
      plane: 'airplane',
      'plane-takeoff': 'airplane-takeoff',
      globe: 'earth',
      tent: 'tent',
    },
  },
  {
    labelKey: 'settings.categories.iconGroup.leisure',
    icons: {
      music: 'music',
      film: 'movie',
      'gamepad-2': 'gamepad-variant',
      dumbbell: 'dumbbell',
      trophy: 'trophy',
      'party-popper': 'party-popper',
      cake: 'cake-variant',
      gift: 'gift',
      sparkles: 'shimmer',
      flame: 'fire',
      laptop: 'laptop',
    },
  },
  {
    labelKey: 'settings.categories.iconGroup.other',
    icons: {
      'circle-dashed': 'circle-outline',
    },
  },
]

export const CATEGORY_ICONS: Record<string, CategoryGlyphName> = Object.fromEntries(
  CATEGORY_ICON_GROUPS.flatMap((group) => Object.entries(group.icons)),
)

/**
 * What a category with no glyph — or an unrecognized one — renders as. A
 * category created by a newer client can carry a key this build has never
 * heard of; a row seeded before the column existed carries none at all. Both
 * are normal, and neither may render a hole in the list.
 */
export const CATEGORY_ICON_FALLBACK: CategoryGlyphName = 'circle-outline'

/** Accessible fallback fill: category glyphs are always white; only the disc changes. */
export const CATEGORY_ICON_DEFAULT_COLOR = colors.ink3

/** Every key a household can pick from, flattened out of the groups above. */
export const CATEGORY_ICON_KEYS = Object.keys(CATEGORY_ICONS)

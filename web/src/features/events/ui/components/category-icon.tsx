import {
  Activity,
  Apple,
  ArrowDownLeft,
  Baby,
  Backpack,
  BarChart,
  Bike,
  BookOpen,
  Briefcase,
  Building,
  Bus,
  BusFront,
  Cake,
  Car,
  CarTaxiFront,
  Carrot,
  Cat,
  ChartPie,
  CircleDashed,
  Coffee,
  Coins,
  CreditCard,
  Cross,
  Dog,
  Drill,
  Dumbbell,
  FileText,
  Film,
  Flame,
  Fuel,
  Gamepad2,
  Gem,
  Gift,
  Globe,
  GraduationCap,
  Hammer,
  HandCoins,
  HeartPulse,
  Home,
  Hospital,
  House,
  Landmark,
  Laptop,
  LineChart,
  Luggage,
  Music,
  PartyPopper,
  PawPrint,
  PenTool,
  Percent,
  PiggyBank,
  Pill,
  Pizza,
  Plane,
  PlaneTakeoff,
  Receipt,
  School,
  Scissors,
  ShieldCheck,
  Shirt,
  ShoppingBag,
  ShoppingBasket,
  ShoppingCart,
  Sparkles,
  Stethoscope,
  Store,
  Syringe,
  Tent,
  TrendingDown,
  TrendingUp,
  Trophy,
  Umbrella,
  User,
  Users,
  UtensilsCrossed,
  Wallet,
  Warehouse,
  Watch,
  Wrench,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

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
 * map only ever covers the seeded system rows. Keys are kebab-case lucide
 * names, so adding one is a one-line change on both sides. The 16 keys the
 * system categories were seeded with (see the backend migration) are each
 * still present, just no longer the only option for their theme.
 *
 * The backend shape-checks the key but does NOT pin the valid set — the client
 * owns this map, so an unrecognized key must resolve to `CATEGORY_ICON_FALLBACK`
 * rather than nothing. Read a single icon as
 * `CATEGORY_ICONS[key] ?? CATEGORY_ICON_FALLBACK` at the call site — see
 * `event-type-icon.tsx` for why this isn't a helper function: a capitalized
 * binding assigned from a CALL trips `react-hooks/static-components`, which
 * cannot tell a lookup from a component factory.
 */
export const CATEGORY_ICON_GROUPS: { labelKey: string; icons: Record<string, LucideIcon> }[] = [
  {
    labelKey: 'settings.categories.iconGroup.housing',
    icons: {
      house: House,
      home: Home,
      building: Building,
      warehouse: Warehouse,
    },
  },
  {
    labelKey: 'settings.categories.iconGroup.transport',
    icons: {
      bus: Bus,
      'bus-front': BusFront,
      car: Car,
      'car-taxi-front': CarTaxiFront,
      bike: Bike,
      fuel: Fuel,
      luggage: Luggage,
    },
  },
  {
    labelKey: 'settings.categories.iconGroup.food',
    icons: {
      'utensils-crossed': UtensilsCrossed,
      coffee: Coffee,
      pizza: Pizza,
      apple: Apple,
      carrot: Carrot,
    },
  },
  {
    labelKey: 'settings.categories.iconGroup.health',
    icons: {
      'heart-pulse': HeartPulse,
      stethoscope: Stethoscope,
      pill: Pill,
      cross: Cross,
      syringe: Syringe,
      hospital: Hospital,
      activity: Activity,
    },
  },
  {
    labelKey: 'settings.categories.iconGroup.family',
    icons: {
      users: Users,
      user: User,
      baby: Baby,
      dog: Dog,
      cat: Cat,
      'paw-print': PawPrint,
    },
  },
  {
    labelKey: 'settings.categories.iconGroup.protection',
    icons: {
      'shield-check': ShieldCheck,
      umbrella: Umbrella,
    },
  },
  {
    labelKey: 'settings.categories.iconGroup.money',
    icons: {
      'piggy-bank': PiggyBank,
      wallet: Wallet,
      coins: Coins,
      'hand-coins': HandCoins,
      'credit-card': CreditCard,
      receipt: Receipt,
      'file-text': FileText,
    },
  },
  {
    labelKey: 'settings.categories.iconGroup.investing',
    icons: {
      'trending-up': TrendingUp,
      'trending-down': TrendingDown,
      'bar-chart': BarChart,
      'line-chart': LineChart,
      'chart-pie': ChartPie,
      percent: Percent,
      gem: Gem,
    },
  },
  {
    labelKey: 'settings.categories.iconGroup.debt',
    icons: {
      landmark: Landmark,
    },
  },
  {
    labelKey: 'settings.categories.iconGroup.income',
    icons: {
      'arrow-down-left': ArrowDownLeft,
      briefcase: Briefcase,
    },
  },
  {
    labelKey: 'settings.categories.iconGroup.repair',
    icons: {
      wrench: Wrench,
      hammer: Hammer,
      drill: Drill,
      'pen-tool': PenTool,
    },
  },
  {
    labelKey: 'settings.categories.iconGroup.household',
    icons: {
      'shopping-basket': ShoppingBasket,
      'shopping-cart': ShoppingCart,
      'shopping-bag': ShoppingBag,
      store: Store,
      shirt: Shirt,
      scissors: Scissors,
      watch: Watch,
    },
  },
  {
    labelKey: 'settings.categories.iconGroup.children',
    icons: {
      backpack: Backpack,
      'graduation-cap': GraduationCap,
      'book-open': BookOpen,
      school: School,
    },
  },
  {
    labelKey: 'settings.categories.iconGroup.travel',
    icons: {
      plane: Plane,
      'plane-takeoff': PlaneTakeoff,
      globe: Globe,
      tent: Tent,
    },
  },
  {
    labelKey: 'settings.categories.iconGroup.leisure',
    icons: {
      music: Music,
      film: Film,
      'gamepad-2': Gamepad2,
      dumbbell: Dumbbell,
      trophy: Trophy,
      'party-popper': PartyPopper,
      cake: Cake,
      gift: Gift,
      sparkles: Sparkles,
      flame: Flame,
      laptop: Laptop,
    },
  },
  {
    labelKey: 'settings.categories.iconGroup.other',
    icons: {
      'circle-dashed': CircleDashed,
    },
  },
]

export const CATEGORY_ICONS: Record<string, LucideIcon> = Object.fromEntries(
  CATEGORY_ICON_GROUPS.flatMap((group) => Object.entries(group.icons)),
)

/**
 * What a category with no glyph — or an unrecognized one — renders as. A
 * category created by a newer client can carry a key this build has never
 * heard of; a row seeded before the column existed carries none at all. Both
 * are normal, and neither may render a hole in the list.
 */
export const CATEGORY_ICON_FALLBACK: LucideIcon = CircleDashed

/** Accessible fallback fill: category glyphs are always white; only the disc changes. */
export const CATEGORY_ICON_DEFAULT_COLOR = '#64748b'

/** Every key a household can pick from, flattened out of the groups above. */
export const CATEGORY_ICON_KEYS = Object.keys(CATEGORY_ICONS)

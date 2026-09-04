import {
  CATEGORY_ICON_DEFAULT_COLOR,
  CATEGORY_ICON_FALLBACK,
  CATEGORY_ICONS,
} from '@/features/events/ui/components/category-icon'
import { cn } from '@money-space/core/shared/lib/utils'

/**
 * A category's disc + label, for use inside a `<SelectItem>` — the same disc
 * every category-carrying row draws (`RecordCard`, the Settings card), sized
 * to the Settings row's scale so the glyph reads at select-row height, not
 * shrunk down to fit beside the text.
 */
export function CategorySelectItem({
  label,
  iconKey,
  iconColor,
  layout = 'inline',
  selected = false,
}: {
  label: string
  iconKey?: string | null
  iconColor?: string | null
  layout?: 'inline' | 'stacked'
  selected?: boolean
}) {
  const Icon = (iconKey && CATEGORY_ICONS[iconKey]) || CATEGORY_ICON_FALLBACK

  return (
    <span
      className={cn(
        'flex min-w-0 items-center',
        layout === 'stacked' ? 'w-full flex-col gap-1.5 text-center' : 'gap-2',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'flex shrink-0 items-center justify-center rounded-pill border',
          layout === 'stacked' ? 'size-10' : 'size-7',
          selected ? 'border-data-primary' : 'border-transparent',
          'text-white',
        )}
        style={{ backgroundColor: iconColor ?? CATEGORY_ICON_DEFAULT_COLOR }}
      >
        <Icon className={layout === 'stacked' ? 'size-5' : 'size-4'} strokeWidth={1.75} />
      </span>
      <span className={cn('truncate', layout === 'stacked' && 'w-full')}>{label}</span>
    </span>
  )
}

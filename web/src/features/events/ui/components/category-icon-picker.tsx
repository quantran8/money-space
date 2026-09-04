import { ChevronDown, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  CATEGORY_ICON_DEFAULT_COLOR,
  CATEGORY_ICON_FALLBACK,
  CATEGORY_ICON_GROUPS,
  CATEGORY_ICONS,
} from '@/features/events/ui/components/category-icon'
import { cn } from '@money-space/core/shared/lib/utils'

/** A starting palette, not a restriction — the swatch row is a shortcut onto
 *  the native colour input below it, which accepts anything. */
const CATEGORY_COLOR_SWATCHES = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#84cc16',
  '#22c55e',
  '#14b8a6',
  '#0ea5e9',
  '#3b82f6',
  '#8b5cf6',
  '#d946ef',
  '#ec4899',
  '#64748b',
]

type CategoryIconPickerProps = {
  iconKey: string | null
  onIconKeyChange: (iconKey: string | null) => void
  iconColor: string | null
  onIconColorChange: (iconColor: string | null) => void
  /** Set inside a Dialog (the add-category form) so focus stays trapped there —
   *  see `unportalled` on `PopoverContent`. */
  unportalled?: boolean
  /** The create dialog uses a labelled field trigger and keeps colour choices
   *  visible beside it. Inline editing retains the compact disc trigger. */
  variant?: 'compact' | 'field'
}

/**
 * The glyph + fill a household picks for a custom category's disc.
 *
 * The glyph is limited to `CATEGORY_ICON_KEYS` — the fixed set the client
 * actually renders (`category-icon.tsx`) — rather than a free-text key field:
 * a typo'd key is indistinguishable from a real one until it silently falls
 * back, and there is no preview to catch it against. The FILL is the opposite:
 * a free hex choice, because a colour (unlike a glyph key) can't be typo'd into
 * something invalid — any value the native color input returns is already a
 * valid one. The glyph stays white; picking a fill changes only its disc.
 */
export function CategoryIconPicker({
  iconKey,
  onIconKeyChange,
  iconColor,
  onIconColorChange,
  unportalled,
  variant = 'compact',
}: CategoryIconPickerProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const SelectedIcon = (iconKey && CATEGORY_ICONS[iconKey]) || CATEGORY_ICON_FALLBACK
  const visibleGroups = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return CATEGORY_ICON_GROUPS

    return CATEGORY_ICON_GROUPS.map((group) => ({
      ...group,
      icons: t(group.labelKey).toLowerCase().includes(normalizedQuery)
        ? group.icons
        : Object.fromEntries(
            Object.entries(group.icons).filter(([key]) => key.includes(normalizedQuery)),
          ),
    })).filter((group) => Object.keys(group.icons).length > 0)
  }, [query, t])

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) setQuery('')
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={t('settings.categories.iconLabel')}
          title={t('settings.categories.iconLabel')}
          className={cn(
            'shrink-0 rounded-control transition-colors',
            variant === 'field'
              ? 'group flex h-12 w-full items-center gap-3 bg-wash px-3 text-left hover:bg-committed'
              : 'flex size-11 items-center justify-center hover:opacity-90',
            variant === 'compact' && 'text-white',
          )}
          style={
            variant === 'compact'
              ? { backgroundColor: iconColor ?? CATEGORY_ICON_DEFAULT_COLOR }
              : undefined
          }
        >
          {variant === 'field' ? (
            <>
              <span
                className="flex size-8 shrink-0 items-center justify-center rounded-[10px] text-white"
                style={{
                  backgroundColor: iconColor ?? CATEGORY_ICON_DEFAULT_COLOR,
                }}
              >
                <SelectedIcon className="size-[18px]" strokeWidth={1.75} />
              </span>
              <span className="min-w-0 flex-1 t-body-sm text-ink">
                {t('settings.categories.chooseIcon')}
              </span>
              <ChevronDown className="size-4 text-ink3 transition-transform group-data-[state=open]:rotate-180" />
            </>
          ) : (
            <SelectedIcon className="size-5" strokeWidth={1.75} />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        unportalled={unportalled}
        className={cn(
          'p-3',
          variant === 'field' ? 'w-[min(360px,calc(100vw-3rem))]' : 'w-[288px] p-2',
        )}
      >
        {variant === 'field' ? (
          <label className="flex h-11 items-center gap-2 rounded-control border border-committed px-3 focus-within:border-data-primary focus-within:shadow-[0_0_0_3px_rgba(115,164,215,0.16)]">
            <Search className="size-4 shrink-0 text-ink3" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('settings.categories.searchIcons')}
              className="min-w-0 flex-1 bg-transparent t-body-sm text-ink outline-none placeholder:text-ink3"
              autoFocus
            />
          </label>
        ) : (
          <p className="px-1 pb-1.5 t-caption-sm text-ink3">{t('settings.categories.iconLabel')}</p>
        )}
        {/* Grouped by theme rather than one flat grid — with several icons per
            category now (a household picking "Ăn uống" might reach for the
            fork, the coffee cup, or the pizza slice), a single ungrouped grid
            of ~90 glyphs would be a wall nobody could scan. Capped so the
            popover never grows past a comfortable scroll. */}
        <div
          className={cn(
            'max-h-[280px] space-y-3 overflow-y-auto pr-1',
            variant === 'field' && 'mt-3',
          )}
        >
          {visibleGroups.map((group) => (
            <div key={group.labelKey}>
              <p className="px-1 pb-1 t-caption-sm text-ink3">{t(group.labelKey)}</p>
              <div
                className={cn(
                  'grid gap-1',
                  variant === 'field' ? 'grid-cols-7' : 'grid-cols-6',
                )}
              >
                {Object.entries(group.icons).map(([key, Icon]) => {
                  const isSelected = key === iconKey
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        onIconKeyChange(isSelected ? null : key)
                        if (variant === 'field') setOpen(false)
                      }}
                      aria-pressed={isSelected}
                      aria-label={key}
                      title={key}
                      className={cn(
                        'flex size-9 items-center justify-center rounded-control transition-colors',
                        isSelected
                          ? 'bg-action text-action-inverse'
                          : 'text-ink2 hover:bg-wash hover:text-ink',
                      )}
                    >
                      <Icon className="size-4" strokeWidth={1.75} />
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
          {visibleGroups.length === 0 ? (
            <p className="px-2 py-8 text-center t-body-sm text-ink3">
              {t('settings.categories.noIconsFound')}
            </p>
          ) : null}
        </div>

        {variant === 'compact' ? (
          <>
            <p className="mt-3 px-1 pb-1.5 t-caption-sm text-ink3">
              {t('settings.categories.colorLabel')}
            </p>
            <CategoryColorPicker
              iconColor={iconColor}
              onIconColorChange={onIconColorChange}
              compact
            />
          </>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}

export function CategoryColorPicker({
  iconColor,
  onIconColorChange,
  compact = false,
}: {
  iconColor: string | null
  onIconColorChange: (iconColor: string | null) => void
  compact?: boolean
}) {
  const { t } = useTranslation()

  return (
    <div
      className={cn(
        'flex flex-wrap items-center',
        compact ? 'gap-1.5 px-1' : 'min-h-12 gap-2',
      )}
    >
      {CATEGORY_COLOR_SWATCHES.map((swatch) => (
        <button
          key={swatch}
          type="button"
          onClick={() => onIconColorChange(swatch)}
          aria-pressed={swatch === iconColor}
          aria-label={swatch}
          title={swatch}
          className={cn(
            'relative grid shrink-0 place-items-center rounded-control transition-colors hover:bg-wash',
            compact ? 'size-6 rounded-pill' : 'size-11',
          )}
        >
          <span
            className={cn(
              'block rounded-pill ring-1 ring-inset ring-black/10',
              compact ? 'size-6' : 'size-7',
              swatch === iconColor && 'ring-2 ring-ink ring-offset-[3px]',
            )}
            style={{ backgroundColor: swatch }}
          />
        </button>
      ))}
      {/* The native picker, so a swatch is a shortcut rather than a limit —
          any colour it returns is already valid, nothing to typo. */}
      <label
        className={cn(
          'relative flex shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-control transition-colors hover:bg-wash',
          compact ? 'size-6 rounded-pill ring-1 ring-inset ring-divider' : 'size-11',
        )}
        title={t('settings.categories.customColor')}
      >
        <input
          type="color"
          value={iconColor ?? '#64748b'}
          onChange={(event) => onIconColorChange(event.target.value)}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
          aria-label={t('settings.categories.customColor')}
        />
        <span
          aria-hidden
          className={cn('pointer-events-none rounded-pill', compact ? 'size-full' : 'size-7')}
          style={{
            background:
              'conic-gradient(from 0deg, red, yellow, lime, cyan, blue, magenta, red)',
          }}
        />
      </label>
      {iconColor ? (
        <button
          type="button"
          onClick={() => onIconColorChange(null)}
          className={cn(
            'ml-auto t-caption-sm text-ink3 underline-offset-2 hover:text-ink hover:underline',
            !compact && 'sr-only',
          )}
        >
          {t('settings.categories.clearColor')}
        </button>
      ) : null}
    </div>
  )
}

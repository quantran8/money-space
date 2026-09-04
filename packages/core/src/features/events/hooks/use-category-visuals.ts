import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { useEventCategories } from '#/features/events/hooks/use-event-categories'

export type CategoryVisual = {
  label: string
  iconKey: string | null
  iconColor: string | null
}

/**
 * Category id → everything a row needs to render it: the translated label and
 * the disc's glyph key + fill.
 *
 * Events carry only a `categoryId` (a real FK) — the code the i18n key is built
 * from, and the glyph/colour, live on the category row. Every surface that
 * shows a recorded or expected event needs the same resolution, so it lives
 * here rather than being rebuilt per page. Resolving the glyph key to an actual
 * icon component stays a UI concern (the web app's `category-icon.tsx`).
 */
export function useCategoryVisuals(): Record<string, CategoryVisual> {
  const { t } = useTranslation()
  const { categories } = useEventCategories()

  return useMemo(
    () =>
      Object.fromEntries(
        categories.map((category) => [
          category.id,
          {
            label: t(`options.eventCategory.${category.code}`, {
              defaultValue: category.label,
            }),
            iconKey: category.iconKey,
            iconColor: category.iconColor,
          },
        ]),
      ),
    [categories, t],
  )
}

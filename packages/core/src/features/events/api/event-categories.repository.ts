import { apiRequest } from '#/shared/api/http'

export type EventCategoryItem = {
  id: string
  /** NULL for system/global categories; a household id for custom ones. */
  householdId: string | null
  /** Stable per-household-scope code. No longer stored on events (they carry
   *  `categoryId` now) but still the i18n key: `options.eventCategory.<code>`. */
  code: string
  /** Seed/default-language label; UI prefers the localized name by code. */
  label: string
  /** Glyph key (a kebab-case lucide name), resolved to a component by the web
   *  app's `category-icon.tsx`. NULL when the category has picked none. */
  iconKey: string | null
  /** Disc fill (hex string). NULL renders the client's neutral default; the
   *  glyph itself always draws white over whatever this is. */
  iconColor: string | null
  /** System rows are shared and read-only (cannot be edited/deleted). */
  isSystem: boolean
  sortOrder: number
  /** The household's default category, auto-selected in the money-event form.
   *  At most one per household; computed per-household (not a stored row flag). */
  isDefault: boolean
}

type EventCategoryListResponse = {
  householdId: string
  items: EventCategoryItem[]
  total: number
}

export type EventCategoryPayload = {
  /** Display label. The backend ALWAYS derives the code from this — the client
   *  never sends or sees a code at creation. */
  label: string
  /** Omit to leave unset; `null` clears an existing glyph. */
  iconKey?: string | null
  /** Omit to leave unset; `null` clears a custom fill back to the default. */
  iconColor?: string | null
  sortOrder?: number
}

export function listEventCategories(householdId: string) {
  return apiRequest<EventCategoryListResponse>(
    `/households/${householdId}/money-event-categories`,
  )
}

export function createEventCategory(householdId: string, payload: EventCategoryPayload) {
  return apiRequest<EventCategoryItem>(
    `/households/${householdId}/money-event-categories`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  )
}

export function updateEventCategory(
  householdId: string,
  categoryId: string,
  payload: Partial<EventCategoryPayload>,
) {
  return apiRequest<EventCategoryItem>(
    `/households/${householdId}/money-event-categories/${categoryId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  )
}

export function deleteEventCategory(householdId: string, categoryId: string) {
  return apiRequest<{ deleted: boolean; categoryId: string }>(
    `/households/${householdId}/money-event-categories/${categoryId}`,
    {
      method: 'DELETE',
    },
  )
}

/** Set (or clear, with `null`) the household's default category by ID.
 *  Works for system and custom categories; returns the updated category list. */
export function setDefaultEventCategory(householdId: string, categoryId: string | null) {
  return apiRequest<EventCategoryListResponse>(
    `/households/${householdId}/money-event-categories/default`,
    {
      method: 'PUT',
      body: JSON.stringify({ categoryId }),
    },
  )
}

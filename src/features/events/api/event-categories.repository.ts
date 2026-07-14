import { apiRequest } from '@/shared/api/http'

export type EventCategoryItem = {
  id: string
  /** NULL for system/global categories; a household id for custom ones. */
  householdId: string | null
  /** Stable code stored on money_events.category; also the i18n key. */
  code: string
  /** Seed/default-language label; UI prefers the localized name by code. */
  label: string
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
  code: string
  label: string
  sortOrder?: number
}

export function listEventCategories(householdId: string) {
  return apiRequest<EventCategoryListResponse>(
    `/api/households/${householdId}/money-event-categories`,
  )
}

export function createEventCategory(householdId: string, payload: EventCategoryPayload) {
  return apiRequest<EventCategoryItem>(
    `/api/households/${householdId}/money-event-categories`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  )
}

export function updateEventCategory(
  householdId: string,
  categoryId: string,
  payload: Partial<Omit<EventCategoryPayload, 'code'>>,
) {
  return apiRequest<EventCategoryItem>(
    `/api/households/${householdId}/money-event-categories/${categoryId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  )
}

export function deleteEventCategory(householdId: string, categoryId: string) {
  return apiRequest<{ deleted: boolean; categoryId: string }>(
    `/api/households/${householdId}/money-event-categories/${categoryId}`,
    {
      method: 'DELETE',
    },
  )
}

/** Set (or clear, with `code: null`) the household's default category by CODE.
 *  Works for system and custom categories; returns the updated category list. */
export function setDefaultEventCategory(householdId: string, code: string | null) {
  return apiRequest<EventCategoryListResponse>(
    `/api/households/${householdId}/money-event-categories/default`,
    {
      method: 'PUT',
      body: JSON.stringify({ code }),
    },
  )
}

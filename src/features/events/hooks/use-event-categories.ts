import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createEventCategory,
  deleteEventCategory,
  listEventCategories,
  setDefaultEventCategory,
  updateEventCategory,
  type EventCategoryItem,
  type EventCategoryPayload,
} from '@/features/events/api/event-categories.repository'
import { queryKeys } from '@/shared/api/query-keys'
import { useActiveHousehold } from '@/shared/hooks/use-active-household'

const EMPTY_CATEGORIES: EventCategoryItem[] = []

export function useEventCategories() {
  const queryClient = useQueryClient()
  const { activeHouseholdId } = useActiveHousehold()

  const query = useQuery({
    queryKey: activeHouseholdId
      ? queryKeys.eventCategories(activeHouseholdId)
      : ['event-categories', 'inactive'],
    queryFn: () => listEventCategories(activeHouseholdId!),
    enabled: !!activeHouseholdId,
  })

  const invalidate = async () => {
    if (!activeHouseholdId) return
    await queryClient.invalidateQueries({
      queryKey: queryKeys.eventCategories(activeHouseholdId),
    })
  }

  return {
    categories: query.data?.items ?? EMPTY_CATEGORIES,
    activeHouseholdId,
    ...query,
    createCategory: useMutation({
      mutationFn: (payload: EventCategoryPayload) =>
        createEventCategory(activeHouseholdId!, payload),
      onSuccess: invalidate,
    }),
    updateCategory: useMutation({
      mutationFn: ({
        categoryId,
        payload,
      }: {
        categoryId: string
        payload: Partial<Omit<EventCategoryPayload, 'code'>>
      }) => updateEventCategory(activeHouseholdId!, categoryId, payload),
      onSuccess: invalidate,
    }),
    deleteCategory: useMutation({
      mutationFn: (categoryId: string) =>
        deleteEventCategory(activeHouseholdId!, categoryId),
      onSuccess: invalidate,
    }),
    setDefaultCategory: useMutation({
      // `code = null` clears the default.
      mutationFn: (code: string | null) =>
        setDefaultEventCategory(activeHouseholdId!, code),
      onSuccess: invalidate,
    }),
  }
}

import { Pencil } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { PlanPill } from '@/features/settings/ui/components/plan-pill'
import type { Settings } from '@money-space/core/features/settings/model/settings-form'

type SpaceIdentityProps = {
  form: UseFormReturn<Settings>
  memberCount: number
  sourceCount: number
  isSaving: boolean
  onSave: () => void
}

/**
 * The space's name, what it holds, and the plan it is on.
 *
 * The name reads as a heading until you ask to edit it. An always-live input
 * asks the reader to notice a field where they expected a title; the pencil
 * makes editing a decision instead of a default.
 */
export function SpaceIdentity({
  form,
  memberCount,
  sourceCount,
  isSaving,
  onSave,
}: SpaceIdentityProps) {
  const { t } = useTranslation()
  const {
    register,
    getValues,
    setValue,
    trigger,
    formState: { errors },
  } = form
  const [isEditing, setIsEditing] = useState(false)
  // What the field held when editing began, so Huỷ can put it back.
  const committedName = useRef(getValues('householdName'))
  const inputRef = useRef<HTMLInputElement | null>(null)
  const editButtonRef = useRef<HTMLButtonElement | null>(null)
  const name = form.watch('householdName')

  useEffect(() => {
    if (isEditing) inputRef.current?.select()
  }, [isEditing])

  function startEditing() {
    committedName.current = getValues('householdName')
    setIsEditing(true)
  }

  function cancelEditing() {
    // `shouldDirty` off: putting the old name back is not a pending change, and
    // marking it one leaves the header's Save showing with nothing to commit.
    setValue('householdName', committedName.current)
    setIsEditing(false)
    editButtonRef.current?.focus()
  }

  async function commitEditing() {
    if (!(await trigger('householdName'))) return
    setIsEditing(false)
    editButtonRef.current?.focus()
    onSave()
  }

  const { ref: registerRef, ...nameField } = register('householdName')

  return (
    <div className="flex items-start justify-between gap-5">
      <div className="min-w-0 flex-1">
        {isEditing ? (
          <div className="flex max-w-[520px] items-center gap-2">
            <input
              {...nameField}
              ref={(node) => {
                registerRef(node)
                inputRef.current = node
              }}
              maxLength={60}
              autoComplete="off"
              aria-label={t('settings.household.name')}
              aria-invalid={Boolean(errors.householdName)}
              className="h-11 min-w-0 flex-1 rounded-control border border-committed bg-card px-3 t-body text-ink outline-none transition-[border-color,box-shadow] duration-150 focus-visible:border-data-primary focus-visible:shadow-[0_0_0_3px_rgba(115,164,215,0.16)] aria-[invalid=true]:border-alert-ink aria-[invalid=true]:shadow-[0_0_0_3px_var(--alert-tint)]"
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  void commitEditing()
                }
                if (event.key === 'Escape') {
                  event.preventDefault()
                  cancelEditing()
                }
              }}
            />
            <Button
              type="button"
              size="sm"
              disabled={isSaving}
              onClick={() => void commitEditing()}
            >
              {t('settings.header.save')}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={cancelEditing}>
              {t('common.cancel')}
            </Button>
          </div>
        ) : (
          <div className="flex min-w-0 items-center gap-1">
            <h2 className="truncate t-subhead">{name}</h2>
            <Button
              ref={editButtonRef}
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 text-ink3"
              aria-label={t('settings.household.editName')}
              onClick={startEditing}
            >
              <Pencil className="size-4" strokeWidth={1.75} />
            </Button>
          </div>
        )}

        {errors.householdName?.message && isEditing ? (
          <p className="mt-2 t-caption text-alert-ink">{errors.householdName.message}</p>
        ) : (
          <p className="mt-1 t-caption text-ink3">
            {t('members.list.count', { count: memberCount })}
            {' · '}
            {t('members.list.holdsSources', { count: sourceCount })}
          </p>
        )}
      </div>

      <PlanPill />
    </div>
  )
}

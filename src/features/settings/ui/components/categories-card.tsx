import { Check, Pencil, Plus, Star, Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Input } from '@/components/ui/input'
import { useEventCategories } from '@/features/events/hooks/use-event-categories'
import type { EventCategoryItem } from '@/features/events/api/event-categories.repository'
import { getErrorMessage } from '@/shared/lib/get-error-message'

// Mirror the backend CODE_PATTERN so the UI rejects bad codes before the request.
const CODE_PATTERN = /^[a-z][a-z0-9_]*$/

export function CategoriesCard() {
  const { t } = useTranslation()
  const { categories, createCategory, updateCategory, deleteCategory, setDefaultCategory } =
    useEventCategories()

  const [newCode, setNewCode] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingLabel, setEditingLabel] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<EventCategoryItem | null>(null)

  // Localized display name for a category — follows the user's language via the
  // code, falling back to the row's DB label for custom categories.
  const displayName = (category: EventCategoryItem) =>
    t(`options.eventCategory.${category.code}`, { defaultValue: category.label })

  const canAdd = useMemo(
    () => CODE_PATTERN.test(newCode.trim().toLowerCase()) && newLabel.trim().length > 0,
    [newCode, newLabel],
  )

  async function handleAdd() {
    if (!canAdd) return
    try {
      await createCategory.mutateAsync({
        code: newCode.trim().toLowerCase(),
        label: newLabel.trim(),
      })
      setNewCode('')
      setNewLabel('')
      toast.success(t('settings.categories.created'))
    } catch (error) {
      toast.error(getErrorMessage(error, t('settings.categories.createError')))
    }
  }

  function startEdit(category: EventCategoryItem) {
    setEditingId(category.id)
    setEditingLabel(category.label)
  }

  async function handleSaveEdit(category: EventCategoryItem) {
    const label = editingLabel.trim()
    if (!label) return
    try {
      await updateCategory.mutateAsync({ categoryId: category.id, payload: { label } })
      setEditingId(null)
      toast.success(t('settings.categories.updated'))
    } catch (error) {
      toast.error(getErrorMessage(error, t('settings.categories.updateError')))
    }
  }

  async function handleToggleDefault(category: EventCategoryItem) {
    try {
      // Toggle: clicking the current default clears it; otherwise make this the
      // household's (single) default.
      await setDefaultCategory.mutateAsync(category.isDefault ? null : category.code)
      toast.success(
        category.isDefault
          ? t('settings.categories.defaultCleared')
          : t('settings.categories.defaultSet'),
      )
    } catch (error) {
      toast.error(getErrorMessage(error, t('settings.categories.defaultError')))
    }
  }

  async function handleDelete(category: EventCategoryItem) {
    try {
      await deleteCategory.mutateAsync(category.id)
      setDeleteTarget(null)
      toast.success(t('settings.categories.deleted'))
    } catch (error) {
      toast.error(getErrorMessage(error, t('settings.categories.deleteError')))
    }
  }

  return (
    <Card>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="section-title text-xl font-semibold">
            {t('settings.categories.title')}
          </h2>
        </div>
      </div>

      <ul className="divide-y divide-border">
        {categories.length === 0 ? (
          <li className="rounded-[18px] bg-[hsl(var(--muted))] px-4 py-3 text-sm text-[hsl(var(--muted-foreground))]">
            {t('settings.categories.empty')}
          </li>
        ) : null}

        {categories.map((category) => {
          const isEditing = editingId === category.id
          return (
            <li
              key={category.id}
              className="flex items-center gap-2 py-3 first:pt-0"
            >
              {isEditing ? (
                <Input
                  value={editingLabel}
                  onChange={(event) => setEditingLabel(event.target.value)}
                  className="h-9"
                  autoFocus
                />
              ) : (
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-foreground">
                      {displayName(category)}
                    </p>
                    {category.isDefault ? (
                      <Badge variant="secondary" className="shrink-0">
                        {t('settings.categories.default')}
                      </Badge>
                    ) : null}
                  </div>
                  {!category.isSystem ? (
                    <p className="truncate text-xs text-[hsl(var(--muted-foreground))]">
                      {category.code}
                    </p>
                  ) : null}
                </div>
              )}

              {/* Default toggle — available for system AND custom rows (the
                  default is a per-household pointer, not a row flag). Hidden
                  while inline-editing a label. */}
              {!isEditing ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleToggleDefault(category)}
                  disabled={setDefaultCategory.isPending}
                  aria-pressed={category.isDefault}
                  aria-label={
                    category.isDefault
                      ? t('settings.categories.unsetDefault')
                      : t('settings.categories.setDefault')
                  }
                  className={
                    category.isDefault ? 'text-[hsl(var(--accent))]' : 'text-muted-foreground'
                  }
                >
                  <Star className={category.isDefault ? 'size-4 fill-current' : 'size-4'} />
                </Button>
              ) : null}

              {category.isSystem ? (
                <Badge variant="secondary">{t('settings.categories.system')}</Badge>
              ) : isEditing ? (
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleSaveEdit(category)}
                    disabled={!editingLabel.trim() || updateCategory.isPending}
                    aria-label={t('common.saveChanges')}
                  >
                    <Check className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingId(null)}
                    aria-label={t('common.cancel')}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => startEdit(category)}
                    aria-label={t('common.edit')}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteTarget(category)}
                    className="text-[hsl(var(--status-red))] hover:bg-[hsla(var(--status-red),0.06)]"
                    aria-label={t('common.delete')}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              )}
            </li>
          )
        })}
      </ul>

      {/* Add a custom category. */}
      <details className="mt-4 border-t border-border pt-4">
        <summary className="cursor-pointer list-none text-sm font-medium text-muted-foreground">
          {t('settings.categories.manage')}
        </summary>
        <div className="mt-4 space-y-2">
        <p className="text-sm font-medium text-foreground">
          {t('settings.categories.addTitle')}
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <Input
            value={newLabel}
            onChange={(event) => setNewLabel(event.target.value)}
            placeholder={t('settings.categories.namePlaceholder')}
            aria-label={t('settings.categories.nameLabel')}
          />
          <Input
            value={newCode}
            onChange={(event) => setNewCode(event.target.value)}
            placeholder={t('settings.categories.codePlaceholder')}
            aria-label={t('settings.categories.codeLabel')}
          />
        </div>
        <p className="text-xs text-[hsl(var(--muted-foreground))]">
          {t('settings.categories.codeHint')}
        </p>
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={handleAdd}
          disabled={!canAdd || createCategory.isPending}
        >
          <Plus className="mr-2 size-4" />
          {t('settings.categories.addAction')}
        </Button>
        </div>
      </details>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={t('settings.categories.deleteTitle')}
        description={t('settings.categories.deleteDescription', {
          name: deleteTarget ? displayName(deleteTarget) : '',
        })}
        confirmDisabled={deleteCategory.isPending}
        onConfirm={() => (deleteTarget ? handleDelete(deleteTarget) : undefined)}
      />
    </Card>
  )
}

import { Check, Pencil, Plus, Star, Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Panel } from '@/components/ui/panel'
import { useEventCategories } from '@money-space/core/features/events/hooks/use-event-categories'
import type { EventCategoryItem } from '@money-space/core/features/events/api/event-categories.repository'
import { getErrorMessage } from '@money-space/core/shared/lib/get-error-message'

// Mirror the backend CODE_PATTERN so the UI rejects bad codes before the request.
const CODE_PATTERN = /^[a-z][a-z0-9_]*$/

export function CategoriesCard() {
  const { t } = useTranslation()
  const { categories, createCategory, updateCategory, deleteCategory, setDefaultCategory } =
    useEventCategories()

  const [newCode, setNewCode] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [addOpen, setAddOpen] = useState(false)
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
      setAddOpen(false)
      toast.success(t('settings.categories.created'))
    } catch (error) {
      toast.error(getErrorMessage(error, t('settings.categories.createError')))
    }
  }

  function handleAddOpenChange(open: boolean) {
    setAddOpen(open)
    if (!open) {
      setNewCode('')
      setNewLabel('')
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
    <Panel>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="section-title text-[16px]">{t('settings.categories.title')}</h2>
          <p className="mt-2 max-w-[680px] text-[12px] leading-5 text-ink2">
            {t('settings.categories.description')}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="font-mono text-[11px] text-ink3">
            {t('household.merged.categoryCount', {
              system: categories.filter((category) => category.isSystem).length,
              custom: categories.filter((category) => !category.isSystem).length,
            })}
          </span>
          <Button type="button" variant="secondary" size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="size-3.5" />
            {t('settings.categories.addAction')}
          </Button>
        </div>
      </div>

      <ul className="mt-7 grid gap-x-8 gap-y-1 md:grid-cols-2">
        {categories.length === 0 ? (
          <li className="rounded-sunk bg-sunk px-4 py-8 text-center text-[13px] text-ink2 md:col-span-2">
            {t('settings.categories.empty')}
          </li>
        ) : null}

        {categories.map((category) => {
          const isEditing = editingId === category.id
          return (
            <li
              key={category.id}
              className="flex min-h-12 items-center gap-2 rounded-sunk px-3 py-2 transition-colors hover:bg-sunk"
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
                    <p className="truncate text-[13px] font-medium text-foreground">
                      {displayName(category)}
                    </p>
                    {category.isDefault ? (
                      <Badge variant="secondary" className="shrink-0 text-[10px]">
                        {t('settings.categories.default')}
                      </Badge>
                    ) : null}
                  </div>
                  {!category.isSystem ? (
                    <p className="truncate text-[10px] text-ink3">
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
                    category.isDefault ? 'text-accent' : 'text-muted-foreground'
                  }
                >
                  <Star className={category.isDefault ? 'size-4 fill-current' : 'size-4'} />
                </Button>
              ) : null}

              {category.isSystem ? (
                <Badge variant="secondary" className="text-[10px] text-ink3">{t('settings.categories.system')}</Badge>
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
                    className="text-alert hover:bg-alert-tint"
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

      <Dialog open={addOpen} onOpenChange={handleAddOpenChange}>
        <DialogContent className="max-w-md gap-5">
          <DialogHeader>
            <DialogTitle>{t('settings.categories.addTitle')}</DialogTitle>
            <DialogDescription>{t('settings.categories.codeHint')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <label className="block">
              <span className="label">{t('settings.categories.nameLabel')}</span>
              <Input
                value={newLabel}
                onChange={(event) => setNewLabel(event.target.value)}
                placeholder={t('settings.categories.namePlaceholder')}
                className="mt-2"
                autoFocus
              />
            </label>
            <label className="block">
              <span className="label">{t('settings.categories.codeLabel')}</span>
              <Input
                value={newCode}
                onChange={(event) => setNewCode(event.target.value)}
                placeholder={t('settings.categories.codePlaceholder')}
                className="mt-2"
              />
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => handleAddOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              onClick={handleAdd}
              disabled={!canAdd || createCategory.isPending}
            >
              <Plus className="size-4" />
              {t('settings.categories.addAction')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
    </Panel>
  )
}

import { Check, MoreHorizontal, Pencil, Plus, Star, Trash2, X } from 'lucide-react'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Panel, PanelHeader } from '@/components/ui/panel'
import { cn } from '@money-space/core/shared/lib/utils'
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
  const [tab, setTab] = useState<'system' | 'custom'>('system')

  // Localized display name for a category — follows the user's language via the
  // code, falling back to the row's DB label for custom categories.
  const displayName = (category: EventCategoryItem) =>
    t(`options.eventCategory.${category.code}`, { defaultValue: category.label })

  // The default leads its tab. The API already returns it first, but the split
  // below re-groups the rows, so each list re-applies it: the row the household
  // reaches for should not sit mid-alphabet in either tab.
  const defaultFirst = (items: EventCategoryItem[]) =>
    [...items].sort((a, b) => Number(b.isDefault) - Number(a.isDefault))

  const systemCategories = useMemo(
    () => defaultFirst(categories.filter((category) => category.isSystem)),
    [categories],
  )
  const customCategories = useMemo(
    () => defaultFirst(categories.filter((category) => !category.isSystem)),
    [categories],
  )
  const visible = tab === 'system' ? systemCategories : customCategories

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
      <PanelHeader
        title={t('settings.categories.title')}
        action={
          <Button type="button" variant="secondary" size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="size-4" strokeWidth={1.75} />
            {t('settings.categories.addAction')}
          </Button>
        }
      />

      {/*
        System and custom are two different things, not two flags on one list.
        A single mixed list put sixteen rows the household cannot change in
        front of the handful it can, and marked the difference with a badge at
        the end of each row — the reader had to scan every row to find their
        own. The segmented control puts that question first.
      */}
      <div className="s-head-body flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex w-fit items-center gap-1 rounded-control bg-wash p-1" role="tablist">
          <TabButton
            isActive={tab === 'system'}
            count={systemCategories.length}
            label={t('settings.categories.system')}
            onClick={() => setTab('system')}
          />
          <TabButton
            isActive={tab === 'custom'}
            count={customCategories.length}
            label={t('settings.categories.tabCustom')}
            onClick={() => setTab('custom')}
          />
        </div>
        <p className="t-caption text-ink3">
          {t(tab === 'system' ? 'settings.categories.systemNote' : 'settings.categories.customNote')}
        </p>
      </div>

      {visible.length === 0 ? (
        <div className="mt-7">
          <p className="t-subtitle">
            {t(tab === 'custom' ? 'settings.categories.customEmptyTitle' : 'settings.categories.empty')}
          </p>
          {tab === 'custom' ? (
            <p className="mt-2 max-w-[560px] t-body-sm leading-5 text-ink2">
              {t('settings.categories.customEmptyBody')}
            </p>
          ) : null}
        </div>
      ) : (
        <>
          <div className="mt-7 flex items-baseline justify-between gap-4">
            <p className="t-subtitle">
              {t(tab === 'system' ? 'settings.categories.system' : 'settings.categories.tabCustom')}
            </p>
            <p className="num t-caption text-ink3">
              {t('settings.categories.countLabel', { count: visible.length })}
            </p>
          </div>

          <ul className="mt-3 grid gap-x-6 gap-y-1 md:grid-cols-2">
            {visible.map((category) => {
              const isEditing = editingId === category.id
              const name = displayName(category)
              return (
                <li
                  key={category.id}
                  className="group flex min-h-[52px] items-center gap-1 rounded-control py-1 pl-3 pr-1 transition-colors hover:bg-canvas"
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
                        <p className="truncate t-body-sm">{name}</p>
                        {category.isDefault ? (
                          <Badge variant="secondary" className="shrink-0 t-caption-sm">
                            {t('settings.categories.default')}
                          </Badge>
                        ) : null}
                      </div>
                      {!category.isSystem ? (
                        <p className="truncate t-caption-sm text-ink3">{category.code}</p>
                      ) : null}
                    </div>
                  )}

                  {isEditing ? (
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
                    <>
                      {/* The default toggle is available on system rows too —
                          the default is a per-household pointer, not a row
                          flag — so it stays visible rather than fading in with
                          the overflow. Every member gets it: categories are
                          about the money, and both partners are equal there. */}
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
                        className={cn('shrink-0', category.isDefault ? 'text-action' : 'text-ink3')}
                      >
                        <Star className={category.isDefault ? 'size-4 fill-current' : 'size-4'} />
                      </Button>

                      {/* No menu on a system row: rename and delete are the
                          only two items in it, and the backend allows neither.
                          An empty overflow is worse than none. */}
                      {!category.isSystem ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="shrink-0 text-ink2 opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
                              aria-label={t('settings.categories.rowMenu', { name })}
                            >
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => startEdit(category)}>
                              <Pencil className="size-4" />
                              {t('common.edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-alert-ink focus:text-alert-ink"
                              onSelect={() => setDeleteTarget(category)}
                            >
                              <Trash2 className="size-4" />
                              {t('common.delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <span className="size-11 shrink-0" aria-hidden />
                      )}
                    </>
                  )}
                </li>
              )
            })}
          </ul>
        </>
      )}

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

function TabButton({
  isActive,
  label,
  count,
  onClick,
}: {
  isActive: boolean
  label: string
  count: number
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={onClick}
      className={cn(
        'inline-flex min-h-9 items-center gap-2 rounded-[10px] px-3 t-body-sm transition-colors',
        isActive ? 'bg-card font-medium text-ink' : 'text-ink2 hover:text-ink',
      )}
    >
      {label}
      <span className="num t-caption text-ink3">{count}</span>
    </button>
  )
}

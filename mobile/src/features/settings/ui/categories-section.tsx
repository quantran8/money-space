import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useMemo, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import type { EventCategoryItem } from '@money-space/core/features/events/api/event-categories.repository'
import { useEventCategories } from '@money-space/core/features/events/hooks/use-event-categories'
import { getErrorMessage } from '@money-space/core/shared/lib/get-error-message'
import { notify } from '@money-space/core/shared/notify'

import {
  ActionSheet,
  Button,
  ConfirmDialog,
  Panel,
  PanelHeader,
  Segmented,
  Skeleton,
  type ActionSheetItem,
} from '@/components/ui'
import {
  CATEGORY_ICON_DEFAULT_COLOR,
  CATEGORY_ICON_FALLBACK,
  CATEGORY_ICONS,
} from '@/features/events/ui/components/category-icon'
import { CategoryFormSheet } from '@/features/settings/ui/category-form-sheet'
import { TOUCH_TARGET, colors } from '@/theme/tokens'

type Tab = 'system' | 'custom'

/**
 * Nhóm sự kiện — the household's spending and income categories.
 *
 * System and custom are two different things, not two flags on one list. A
 * single mixed list put sixteen rows the household cannot change in front of
 * the handful it can; the segmented control puts that question first.
 *
 * The default is a per-household POINTER, not a row flag, so the star is
 * offered on system rows too — and to every member, because categories are
 * about the money and both partners are equal there.
 */
export function CategoriesSection() {
  const { t } = useTranslation()
  const {
    categories,
    isLoading,
    createCategory,
    updateCategory,
    deleteCategory,
    setDefaultCategory,
  } = useEventCategories()

  const [tab, setTab] = useState<Tab>('system')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<EventCategoryItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<EventCategoryItem | null>(null)

  const displayName = (category: EventCategoryItem) =>
    t(`options.eventCategory.${category.code}`, { defaultValue: category.label })

  /* The default leads its tab. The API returns it first, but the split below
     re-groups the rows, so each list re-applies it: the row the household
     reaches for should not sit mid-alphabet in either tab. */
  const { system, custom } = useMemo(() => {
    const byDefaultFirst = (items: EventCategoryItem[]) =>
      [...items].sort((a, b) => Number(b.isDefault) - Number(a.isDefault))
    return {
      system: byDefaultFirst(categories.filter((category) => category.isSystem)),
      custom: byDefaultFirst(categories.filter((category) => !category.isSystem)),
    }
  }, [categories])

  const visible = tab === 'system' ? system : custom

  async function handleToggleDefault(category: EventCategoryItem) {
    try {
      // Tapping the current default CLEARS it; otherwise this becomes the
      // household's single default.
      await setDefaultCategory.mutateAsync(category.isDefault ? null : category.id)
      notify.success(
        category.isDefault
          ? t('settings.categories.defaultCleared')
          : t('settings.categories.defaultSet'),
      )
    } catch (error) {
      notify.error(getErrorMessage(error, t('settings.categories.defaultError')))
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await deleteCategory.mutateAsync(deleteTarget.id)
      setDeleteTarget(null)
      notify.success(t('settings.categories.deleted'))
    } catch (error) {
      notify.error(getErrorMessage(error, t('settings.categories.deleteError')))
    }
  }

  const rowActions = (category: EventCategoryItem): ActionSheetItem[] => [
    {
      key: 'edit',
      label: t('common.edit'),
      onPress: () => {
        setEditing(category)
        setFormOpen(true)
      },
    },
    {
      key: 'delete',
      label: t('common.delete'),
      onPress: () => setDeleteTarget(category),
      destructive: true,
    },
  ]

  return (
    <>
      <Panel>
        <PanelHeader
          title={t('settings.categories.title')}
          right={
            <Button
              variant="secondary"
              className="px-3.5"
              onPress={() => {
                setEditing(null)
                setFormOpen(true)
              }}
            >
              {t('settings.categories.addAction')}
            </Button>
          }
        />

        <Segmented
          className="mt-6"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'system' as const, label: `${t('settings.categories.system')} ${system.length}` },
            {
              value: 'custom' as const,
              label: `${t('settings.categories.tabCustom')} ${custom.length}`,
            },
          ]}
        />

        <Text className="mt-3 t-caption leading-5 text-ink3">
          {t(
            tab === 'system'
              ? 'settings.categories.systemNote'
              : 'settings.categories.customNote',
          )}
        </Text>

        {isLoading ? (
          <View className="mt-6 gap-2">
            {[0, 1, 2, 3].map((index) => (
              <Skeleton key={index} height={52} />
            ))}
          </View>
        ) : visible.length === 0 ? (
          <View className="mt-7">
            <Text className="t-subtitle text-ink">
              {t(
                tab === 'custom'
                  ? 'settings.categories.customEmptyTitle'
                  : 'settings.categories.empty',
              )}
            </Text>
            {tab === 'custom' ? (
              <Text className="mt-2 t-body-sm leading-5 text-ink2">
                {t('settings.categories.customEmptyBody')}
              </Text>
            ) : null}
          </View>
        ) : (
          <>
            <View className="mt-7 flex-row items-baseline justify-between gap-4">
              <Text className="t-subtitle text-ink">
                {t(
                  tab === 'system'
                    ? 'settings.categories.system'
                    : 'settings.categories.tabCustom',
                )}
              </Text>
              <Text className="font-mono t-caption text-ink3">
                {t('settings.categories.countLabel', { count: visible.length })}
              </Text>
            </View>

            <View className="mt-3">
              {visible.map((category) => (
                <CategoryRow
                  key={category.id}
                  category={category}
                  name={displayName(category)}
                  isBusy={setDefaultCategory.isPending}
                  onToggleDefault={() => void handleToggleDefault(category)}
                  actions={rowActions(category)}
                />
              ))}
            </View>
          </>
        )}
      </Panel>

      {formOpen ? (
        <CategoryFormSheet
          // Keyed so a new target is a NEW mount: the fields are seeded once
          // from the category and must not carry over from the last one edited.
          key={editing?.id ?? 'new'}
          open
          category={editing}
          isSubmitting={createCategory.isPending || updateCategory.isPending}
          onOpenChange={(open) => {
            setFormOpen(open)
            if (!open) setEditing(null)
          }}
          onSubmit={async (payload) => {
            try {
              if (editing) {
                await updateCategory.mutateAsync({ categoryId: editing.id, payload })
                notify.success(t('settings.categories.updated'))
              } else {
                await createCategory.mutateAsync(payload)
                notify.success(t('settings.categories.created'))
              }
              setFormOpen(false)
              setEditing(null)
            } catch (error) {
              notify.error(
                getErrorMessage(
                  error,
                  t(
                    editing
                      ? 'settings.categories.updateError'
                      : 'settings.categories.createError',
                  ),
                ),
              )
            }
          }}
        />
      ) : null}

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title={t('settings.categories.deleteTitle')}
        consequence={t('settings.categories.deleteDescription', {
          name: deleteTarget ? displayName(deleteTarget) : '',
        })}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        loading={deleteCategory.isPending}
        onConfirm={() => void handleDelete()}
      />
    </>
  )
}

function CategoryRow({
  category,
  name,
  isBusy,
  onToggleDefault,
  actions,
}: {
  category: EventCategoryItem
  name: string
  isBusy: boolean
  onToggleDefault: () => void
  actions: ActionSheetItem[]
}) {
  const { t } = useTranslation()
  const glyph = (category.iconKey && CATEGORY_ICONS[category.iconKey]) || CATEGORY_ICON_FALLBACK

  return (
    <View className="flex-row items-center gap-2.5 py-1" style={{ minHeight: 52 }}>
      {/* The glyph is always white — a category picks its fill freely, so
          tinting the glyph too would put an arbitrary hue on an arbitrary hue. */}
      <View
        accessible={false}
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: category.iconColor ?? CATEGORY_ICON_DEFAULT_COLOR,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <MaterialCommunityIcons name={glyph} size={16} color="#ffffff" />
      </View>

      <View className="min-w-0 flex-1">
        <View className="flex-row items-center gap-2">
          <Text className="shrink t-body-sm text-ink" numberOfLines={1}>
            {name}
          </Text>
          {category.isDefault ? (
            <View className="rounded-pill bg-wash px-2 py-0.5">
              <Text className="t-caption-sm text-ink2">
                {t('settings.categories.default')}
              </Text>
            </View>
          ) : null}
        </View>
        {!category.isSystem ? (
          <Text className="font-mono t-caption-sm text-ink3" numberOfLines={1}>
            {category.code}
          </Text>
        ) : null}
      </View>

      {/* Offered on system rows too: the default is a per-household pointer,
          not a row flag. */}
      <Pressable
        onPress={onToggleDefault}
        disabled={isBusy}
        accessibilityRole="button"
        accessibilityState={{ selected: category.isDefault }}
        accessibilityLabel={t(
          category.isDefault
            ? 'settings.categories.unsetDefault'
            : 'settings.categories.setDefault',
        )}
        style={{ width: TOUCH_TARGET, height: TOUCH_TARGET }}
        className="items-center justify-center active:opacity-70"
      >
        <MaterialCommunityIcons
          name={category.isDefault ? 'star' : 'star-outline'}
          size={18}
          color={category.isDefault ? colors.action : colors.ink3}
        />
      </Pressable>

      {/* No menu on a system row: rename and delete are its only two items and
          the backend allows neither. An empty overflow is worse than none. */}
      {!category.isSystem ? (
        <ActionSheet
          title={name}
          accessibilityLabel={t('settings.categories.rowMenu', { name })}
          items={actions}
        />
      ) : (
        <View style={{ width: TOUCH_TARGET }} />
      )}
    </View>
  )
}

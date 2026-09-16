import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import type {
  EventCategoryItem,
  EventCategoryPayload,
} from '@money-space/core/features/events/api/event-categories.repository'

import { BottomSheet, Button, Field } from '@/components/ui'
import {
  CATEGORY_ICON_DEFAULT_COLOR,
  CATEGORY_ICON_FALLBACK,
  CATEGORY_ICONS,
  CATEGORY_ICON_GROUPS,
} from '@/features/events/ui/components/category-icon'
import { colors } from '@/theme/tokens'

/** The web's swatch row, unchanged — a category's fill is a free choice. */
const COLOR_SWATCHES = [
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

const NEW_CATEGORY_ICON = 'shopping-cart'
const NEW_CATEGORY_COLOR = '#73a4d7'

const MAX_LABEL = 30

/**
 * Add or rename a category: a glyph, a fill and a name.
 *
 * A system row never reaches here — the backend allows neither rename nor
 * delete on one, so the section offers no menu on it.
 */
export function CategoryFormSheet({
  open,
  category,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  /** The row being renamed, or null to create one. */
  category: EventCategoryItem | null
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (payload: EventCategoryPayload) => void
}) {
  const { t } = useTranslation()

  const [label, setLabel] = useState(category?.label ?? '')
  const [iconKey, setIconKey] = useState<string | null>(
    category?.iconKey ?? NEW_CATEGORY_ICON,
  )
  const [iconColor, setIconColor] = useState<string | null>(
    category?.iconColor ?? NEW_CATEGORY_COLOR,
  )

  const trimmed = label.trim()
  const glyph = (iconKey && CATEGORY_ICONS[iconKey]) || CATEGORY_ICON_FALLBACK

  return (
    <BottomSheet
      open={open}
      onClose={() => onOpenChange(false)}
      title={t(category ? 'settings.categories.editTitle' : 'settings.categories.addTitle')}
      footer={
        <View className="gap-2">
          {/* §22.10: never disabled — an empty name is answered on press. */}
          <Button
            loading={isSubmitting}
            onPress={() => {
              if (!trimmed) return
              onSubmit({ label: trimmed, iconKey, iconColor })
            }}
          >
            {t(category ? 'common.saveChanges' : 'settings.categories.addAction')}
          </Button>
          <Button variant="secondary" onPress={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
        </View>
      }
    >
      {/* What the row will look like, before it exists. */}
      <View className="flex-row items-center gap-3 rounded-control bg-wash p-3.5">
        <View
          accessible={false}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: iconColor ?? CATEGORY_ICON_DEFAULT_COLOR,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialCommunityIcons name={glyph} size={18} color="#ffffff" />
        </View>
        <Text className="flex-1 t-body-sm text-ink" numberOfLines={1}>
          {trimmed || t('settings.categories.newCategory')}
        </Text>
      </View>

      <Field
        className="mt-5"
        label={t('settings.categories.nameLabel')}
        placeholder={t('settings.categories.namePlaceholder')}
        hint={t('settings.categories.nameHint')}
        value={label}
        onChangeText={setLabel}
        maxLength={MAX_LABEL}
      />

      <Text className="mt-5 t-body-sm text-ink2">{t('settings.categories.colorLabel')}</Text>
      <View className="mt-2 flex-row flex-wrap gap-2">
        {COLOR_SWATCHES.map((swatch) => (
          <Pressable
            key={swatch}
            onPress={() => setIconColor(swatch)}
            accessibilityRole="button"
            accessibilityState={{ selected: iconColor === swatch }}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: swatch,
              borderWidth: iconColor === swatch ? 2 : 0,
              borderColor: colors.ink,
            }}
          />
        ))}
      </View>

      <Text className="mt-5 t-body-sm text-ink2">{t('settings.categories.iconLabel')}</Text>
      {/* Nested scroll: the glyph set is long and the sheet already scrolls, so
          the picker gets a bounded height of its own rather than pushing the
          name field off the screen. */}
      <ScrollView
        className="mt-2"
        style={{ maxHeight: 220 }}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
      >
        {CATEGORY_ICON_GROUPS.map((group) => (
          <View key={group.labelKey} className="mb-4">
            <Text className="t-caption text-ink3">{t(group.labelKey)}</Text>
            <View className="mt-2 flex-row flex-wrap gap-2">
              {Object.entries(group.icons).map(([key, name]) => (
                <Pressable
                  key={key}
                  onPress={() => setIconKey(key)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: iconKey === key }}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: iconKey === key ? colors.actionSoft : colors.wash,
                    borderWidth: iconKey === key ? 1 : 0,
                    borderColor: colors.ink,
                  }}
                >
                  <MaterialCommunityIcons name={name} size={18} color={colors.ink2} />
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </BottomSheet>
  )
}

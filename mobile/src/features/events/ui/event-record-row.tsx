import { useTranslation } from 'react-i18next'

import {
  formatRecordAmount,
  getTimelineRowTypeLabel,
  type FinancialRecordItem,
} from '@money-space/core/features/events/model/events-form'
import { formatVndShort } from '@money-space/core/shared/lib/format-money'

import { ActionSheet, GroupedRow, RowMeta } from '@/components/ui'

import type { ActionSheetItem } from '@/components/ui'

/**
 * One recorded money event.
 *
 * The web row is a four-column grid (avatar · title · amount · "…" menu). The
 * avatar goes: an initial in a circle is a claim about WHO did this, and on a
 * ledger of a household's own money that reads as attribution rather than
 * record-keeping (§Voice — never a log of each other's spending). The wallet
 * the money moved through is the useful context, and it is already on the meta
 * line.
 *
 * The dropdown becomes an ActionSheet: a menu anchored to an 18pt icon opens
 * under the thumb that is covering it, and every entry here clears 44pt in a
 * sheet instead.
 */
export function EventRecordRow({
  record,
  onEdit,
  onDuplicate,
  onToggleAttention,
  onDelete,
}: {
  record: FinancialRecordItem
  onEdit: (id: string) => void
  onDuplicate: (id: string) => void
  onToggleAttention: (id: string) => void
  onDelete: (id: string) => void
}) {
  const { t } = useTranslation()

  const typeLabel = t(`options.eventType.${record.eventType}`, {
    defaultValue: getTimelineRowTypeLabel(record),
  })
  const relatedName = record.fromAssetName || record.toAssetName
  const meta = relatedName ? `${typeLabel} · ${relatedName}` : typeLabel

  const items: ActionSheetItem[] = [
    // A system / dedicated-flow event (asset purchase, debt update) has no
    // generic edit — core decides, via `canEdit`.
    ...(record.canEdit !== false
      ? [{ key: 'edit', label: t('common.edit'), onPress: () => onEdit(record.id) }]
      : []),
    {
      key: 'duplicate',
      label: t('events.redesign.actions.duplicate'),
      onPress: () => onDuplicate(record.id),
    },
    {
      key: 'attention',
      label: t('events.redesign.actions.attention'),
      onPress: () => onToggleAttention(record.id),
    },
    {
      key: 'delete',
      label: t('common.delete'),
      onPress: () => onDelete(record.id),
      destructive: true,
    },
  ]

  return (
    <GroupedRow
      title={record.title}
      // Vietnamese asset names and type labels live here, so the sans face —
      // mono must never touch accented text (§5).
      meta={<RowMeta>{meta}</RowMeta>}
      value={formatRecordAmount(record, formatVndShort)}
      // Outflow reads attention, everything else the neutral ink. Colour marks
      // direction here, and never a verdict on the amount.
      valueTone={record.direction === 'outflow' ? 'attention' : 'default'}
      right={
        <ActionSheet
          title={record.title}
          accessibilityLabel={t('events.redesign.timeline.actions')}
          items={items}
        />
      }
    />
  )
}

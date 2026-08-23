import { Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { Button, Panel, PanelHeader } from '@/components/ui'

/**
 * Deleting the shared space.
 *
 * §22.11 shapes every part of this:
 *
 *  - **Honest verb.** "Xoá không gian" is what actually happens — the
 *    household row, and everything hanging off it, stops existing for both
 *    people. Not "Đóng", not "Lưu trữ".
 *  - **The consequence is numeric, and one line.** "Xoá 2 thành viên và 7
 *    nguồn tiền" is a sentence someone can weigh; "Bạn có chắc không?" is not.
 *  - **A text button in the row, no bordered danger zone.** A red-outlined box
 *    is a decoration that says "be careful" without saying what happens. The
 *    sentence above the button already did that job, and the confirmation
 *    sheet does it again with the real numbers.
 *
 * Export is absent. The web renders a button for it that calls nothing — there
 * is no export endpoint — and a control that does nothing on a phone is worse
 * than one on a desktop, because there is no console to notice it in. It comes
 * back when the endpoint does.
 */
export function HouseholdDataSection({
  consequence,
  onDelete,
}: {
  /** One line, with the real counts in it. */
  consequence: string
  onDelete: () => void
}) {
  const { t } = useTranslation()

  return (
    <Panel>
      {/* `settings.data.title` is "Xuất hoặc xóa dữ liệu" on the web, and half
          of that is not true here — see the note above about export. */}
      <PanelHeader title={t('household.merged.householdData')} />

      <View className="mt-4">
        <Text className="text-[14px] font-medium text-ink">{t('settings.data.delete')}</Text>
        <Text className="mt-1.5 text-[13px] leading-5 text-ink2">{consequence}</Text>
        <Button className="-ml-2 mt-1 self-start px-2" variant="destructive" onPress={onDelete}>
          {t('settings.data.deleteAction')}
        </Button>
      </View>
    </Panel>
  )
}

import { Text, View } from 'react-native'

import { BottomSheet } from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'

/**
 * Confirmation for an action that cannot be undone.
 *
 * Two rules from §22.11:
 *  - **Use the honest verb.** "Đóng mục tiêu", not a generic "Xoá", when
 *    closing is what actually happens.
 *  - **State the consequence numerically**, in one line. "Việc này sẽ gỡ 3
 *    khoản phân bổ" tells the reader something; "Bạn có chắc không?" does not.
 */
export function ConfirmDialog({
  open,
  onClose,
  title,
  consequence,
  confirmLabel,
  cancelLabel,
  onConfirm,
  loading = false,
  destructive = true,
}: {
  open: boolean
  onClose: () => void
  title: string
  /** One line, with the real numbers in it. */
  consequence?: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  loading?: boolean
  destructive?: boolean
}) {
  return (
    <BottomSheet open={open} onClose={onClose} title={title}>
      {consequence ? (
        <Text className="text-[14px] leading-5 text-ink2">{consequence}</Text>
      ) : null}

      <View className="mt-6 gap-2">
        {/* A text button in the row, not a bordered "danger zone" — the
            surrounding copy already says what this does. */}
        <Button
          variant={destructive ? 'destructive' : 'primary'}
          onPress={onConfirm}
          loading={loading}
        >
          {confirmLabel}
        </Button>
        <Button variant="secondary" onPress={onClose}>
          {cancelLabel}
        </Button>
      </View>
    </BottomSheet>
  )
}

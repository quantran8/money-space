import { formatDecimalDisplay, sanitizeDecimalInput } from '@money-space/core/shared/lib/number-format'

import { Field } from '@/components/ui/field'

/**
 * A decimal field — quantities, rates, areas. NOT money.
 *
 * The comma is the decimal separator, the way it is written in Vietnam ("5,5
 * chỉ", "4,8 %/năm"). `MoneyInput` is the whole-đồng sibling and groups
 * thousands instead; the two are deliberately separate, because a quantity that
 * silently grouped would read "1.5" as one and a half thousand.
 *
 * A `suffix` is the unit, and it belongs beside the number rather than in the
 * label — "Số lượng" with "cổ" after the field says what is being counted at
 * the moment of typing.
 */
export function DecimalInput({
  label,
  value,
  onChange,
  error,
  placeholder,
  suffix,
  className,
}: {
  label?: string
  /** Raw string with a comma decimal ("5,5"). */
  value: string
  onChange: (raw: string) => void
  error?: string
  placeholder?: string
  suffix?: string
  className?: string
}) {
  return (
    <Field
      className={className}
      label={label}
      placeholder={placeholder}
      value={formatDecimalDisplay(value)}
      onChangeText={(next) => onChange(sanitizeDecimalInput(next))}
      error={error}
      // `decimal-pad` rather than `numeric`: it offers the separator key and
      // nothing else, so there is no way to type a sign or an exponent into a
      // field that cannot hold one.
      keyboardType="decimal-pad"
      hint={suffix}
    />
  )
}

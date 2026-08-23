import { formatIntegerDisplay, sanitizeIntegerInput } from '@money-space/core/shared/lib/number-format'
import { formatMoney } from '@money-space/core/shared/lib/format-money'

import { Field } from '@/components/ui/field'

/**
 * A whole-đồng money field.
 *
 * Form state always holds a plain digit string ("20000"); the field shows it
 * grouped ("20.000"). There is no "20M" shorthand — the sanitiser strips the
 * suffix, so typing it would silently mean 20đ.
 *
 * The read-out line below is **mandatory for VND** (§22.5): a one-zero slip is
 * a real, common error and there is nothing else on screen that would catch
 * it. It is also why the input stays at normal size — a big number is output,
 * not input.
 */
export function MoneyInput({
  label,
  value,
  onChange,
  error,
  placeholder,
  className,
}: {
  label?: string
  /** Raw digits, no separators. */
  value: string
  onChange: (raw: string) => void
  error?: string
  placeholder?: string
  className?: string
}) {
  const digits = sanitizeIntegerInput(value)
  const amount = digits === '' ? null : Number(digits)

  return (
    <Field
      className={className}
      label={label}
      placeholder={placeholder}
      value={formatIntegerDisplay(value)}
      onChangeText={(next) => onChange(sanitizeIntegerInput(next))}
      error={error}
      keyboardType="number-pad"
      // Reads back what was actually typed, in words the household uses.
      hint={amount !== null && amount > 0 ? formatMoney(amount) : undefined}
    />
  )
}

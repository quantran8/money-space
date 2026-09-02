import type { ReactNode } from 'react'

import { cn } from '@money-space/core/shared/lib/utils'

/**
 * The what-if sheet's own field, local to this feature on purpose.
 *
 * The shared `EventField` nests its label INSIDE a `px-5 py-4` block and gives
 * the control no focus treatment — right for the create/edit dialogs it was
 * built for, where a field is a heavy committed row. The what-if form is the
 * opposite: two throwaway inputs on a question nothing saves, so the label sits
 * ABOVE a light 44px control that answers to focus.
 *
 * Kept here rather than added as an `EventField` variant because it is one
 * screen's look; promoting it would restyle six sibling dialogs by implication.
 */
export function WhatIfField({
  label,
  htmlFor,
  children,
  trailing,
}: {
  label: string
  htmlFor?: string
  children: ReactNode
  trailing?: ReactNode
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block t-body-sm text-ink2">
        {label}
      </label>
      {/*
        `focus-within` rather than `focus`: the ring belongs to the BOX, but the
        focus lands on the borderless control inside it.
      */}
      <div
        className={cn(
          'mt-2 flex h-11 items-center gap-3 rounded-control border border-committed bg-card px-4',
          'transition-[border-color,box-shadow] duration-150',
          // The same focus signal the `Input` primitive draws, so this field is
          // not a second opinion about what a focused control looks like.
          'focus-within:border-data-primary focus-within:shadow-[0_0_0_3px_rgba(115,164,215,0.16)]',
        )}
      >
        {children}
        {trailing}
      </div>
    </div>
  )
}

/**
 * Trigger className for the `DatePicker` inside a {@link WhatIfField}.
 *
 * Differs from the shared `eventDateTriggerClass` in one deliberate way: it
 * KEEPS the calendar icon. The events version hides it (`[&_svg]:hidden`)
 * because its field block already reads as an editable row; here the control is
 * a 44px box that otherwise gives no sign it opens a picker.
 *
 * `order-last` + `ml-auto` move the icon from the button's leading edge to the
 * field's trailing edge, which is where the mock puts it and where the amount
 * field's `đ` already sits.
 */
export const whatIfDateTriggerClass =
  'h-auto w-full justify-start gap-0 rounded-none border-0 bg-transparent p-0 t-body text-ink hover:bg-transparent [&_svg]:order-last [&_svg]:ml-auto [&_svg]:mr-0 [&_svg]:size-4 [&_svg]:text-ink3'

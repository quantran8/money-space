import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@money-space/core/shared/lib/utils'

/**
 * Buttons carry NO shadow — nothing in the page floats (v5 §8).
 *
 * The primary action is INK, not green: v5 §4 splits interaction from data
 * semantics, so green now means a genuinely good consequence and never "this is
 * clickable". `outline` and `secondary` stay the same borderless wash fill — a
 * stroke is not how a control is marked (§9) — and `ghost` is the plain text
 * action v5 §7 prefers over inventing a bordered secondary button.
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-pill text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-action focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-action text-action-inverse hover:bg-ink2',
        destructive: 'bg-alert text-white hover:bg-alert/90',
        outline: 'bg-wash text-ink hover:bg-committed',
        secondary: 'bg-wash text-ink hover:bg-committed',
        ghost: 'text-action hover:bg-wash',
        link: 'text-action underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 px-5 py-2',
        sm: 'h-9 px-4 text-xs',
        lg: 'h-12 px-6 text-base',
        icon: 'size-11',
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }

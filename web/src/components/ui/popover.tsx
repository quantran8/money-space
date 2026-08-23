'use client'

import * as React from 'react'
import * as PopoverPrimitive from '@radix-ui/react-popover'

import { cn } from '@money-space/core/shared/lib/utils'

const Popover = PopoverPrimitive.Root

const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverAnchor = PopoverPrimitive.Anchor

/**
 * A popover floats above the page, so like a modal it keeps a real shadow
 * (design.md §2.3). It still has no border — the shadow plus the panel-white
 * fill against the tinted `--app` background is what lifts it off (§2.2).
 */
const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> & {
    /**
     * Render in place instead of portaling to `document.body`.
     *
     * Needed when the popover contains a focusable control (a search box) and
     * lives inside a modal Dialog: the dialog's focus guard pulls focus back
     * out of anything portaled outside its DOM, so the field silently swallows
     * every keystroke. Rendering inside the dialog keeps it within the trap.
     */
    unportalled?: boolean
  }
>(({ className, align = 'center', sideOffset = 8, unportalled, ...props }, ref) => {
  const Wrapper = unportalled ? React.Fragment : PopoverPrimitive.Portal
  return (
    <Wrapper>
      <PopoverPrimitive.Content
      ref={ref}
      data-slot="popover-content"
      align={align}
      sideOffset={sideOffset}
      className={cn(
        'z-50 w-72 overflow-hidden rounded-panel bg-panel p-4 text-ink shadow-[0_16px_40px_rgba(0,0,0,0.14)] outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-popover-content-transform-origin]',
        className
      )}
        {...props}
      />
    </Wrapper>
  )
})
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor }

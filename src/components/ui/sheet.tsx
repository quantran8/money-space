import * as React from 'react'
import * as SheetPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'

import { clearStuckBodyPointerEvents } from '@/shared/lib/pointer-events'
import { cn } from '@/shared/lib/utils'

function Sheet({
  open,
  onOpenChange,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Root>) {
  // Covers controlled close (Cancel/Save buttons flipping `open` externally),
  // where Radix's onOpenChange does NOT fire.
  React.useEffect(() => {
    if (open === false) clearStuckBodyPointerEvents()
  }, [open])

  return (
    <SheetPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        // Covers user-initiated close (X / overlay / Esc).
        if (!next) clearStuckBodyPointerEvents()
        onOpenChange?.(next)
      }}
      {...props}
    />
  )
}

const SheetTrigger = SheetPrimitive.Trigger

const SheetClose = SheetPrimitive.Close

const SheetPortal = SheetPrimitive.Portal

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    ref={ref}
    data-slot="sheet-overlay"
    className={cn(
      'fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className,
    )}
    {...props}
  />
))
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Content
      ref={ref}
      data-slot="sheet-content"
      className={cn(
        'fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col gap-6 overflow-y-auto rounded-t-[28px] border-t bg-card p-6 pb-8 shadow-[0_-16px_50px_rgba(0,0,0,0.14)] outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom data-[state=closed]:duration-200 data-[state=open]:duration-300',
        className,
      )}
      {...props}
    >
      <div className="mx-auto -mt-2 mb-1 h-1.5 w-10 shrink-0 rounded-full bg-border" />
      {children}
      <SheetPrimitive.Close
        className="absolute right-5 top-5 rounded-full p-1 text-muted-foreground opacity-70 outline-none transition hover:bg-secondary hover:opacity-100 focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent))]"
        aria-label="Close"
      >
        <X className="size-4" />
      </SheetPrimitive.Close>
    </SheetPrimitive.Content>
  </SheetPortal>
))
SheetContent.displayName = SheetPrimitive.Content.displayName

function SheetHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sheet-header"
      className={cn('flex flex-col gap-1 pr-8', className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn('flex flex-col-reverse gap-2', className)}
      {...props}
    />
  )
}

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    data-slot="sheet-title"
    className={cn('section-title text-2xl font-semibold', className)}
    {...props}
  />
))
SheetTitle.displayName = SheetPrimitive.Title.displayName

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    data-slot="sheet-description"
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
))
SheetDescription.displayName = SheetPrimitive.Description.displayName

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
}

import * as React from 'react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useIsDesktop } from '@/shared/lib/use-media-query'
import { cn } from '@money-space/core/shared/lib/utils'

const ResponsiveDialogContext = React.createContext<boolean>(true)

function useIsDesktopDialog() {
  return React.useContext(ResponsiveDialogContext)
}

type ResponsiveDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

/**
 * Renders its content as a centered Dialog on desktop and a bottom Sheet on
 * mobile. Use for long/multi-field forms. Small quick actions should stay
 * inline rather than open this.
 */
function ResponsiveDialog({ open, onOpenChange, children }: ResponsiveDialogProps) {
  const isDesktop = useIsDesktop()
  const Root = isDesktop ? Dialog : Sheet
  return (
    <ResponsiveDialogContext.Provider value={isDesktop}>
      <Root open={open} onOpenChange={onOpenChange}>
        {children}
      </Root>
    </ResponsiveDialogContext.Provider>
  )
}

function ResponsiveDialogContent({
  className,
  ...props
}: React.ComponentProps<typeof DialogContent>) {
  const isDesktop = useIsDesktopDialog()
  const Content = isDesktop ? DialogContent : SheetContent
  return <Content className={className} {...props} />
}

function ResponsiveDialogHeader(props: React.ComponentProps<'div'>) {
  const isDesktop = useIsDesktopDialog()
  const Header = isDesktop ? DialogHeader : SheetHeader
  return <Header {...props} />
}

/**
 * The sticky action bar, with the padding a PADDED shell needs.
 *
 * The default assumes the surrounding `ResponsiveDialogContent` keeps its own
 * padding (`p-6` on the dialog, `p-6 pb-8` on the sheet). The negative SIDE
 * margins pull the bar back out to both edges so its border and background span
 * the modal, then re-apply that padding inside. A modal that renders `p-0` with
 * its own inner scroll area is already flush and passes `fullBleed`.
 *
 * There is deliberately NO negative bottom margin. The bar is the last thing in
 * the scroll container, so the container's own bottom padding is what the
 * content scrolls into — pulling the bar down over that padding shortened the
 * scroll range by exactly the bar's height, leaving the final field stranded
 * underneath it with no way to scroll it clear.
 */
function ResponsiveDialogFooter({
  className,
  fullBleed = false,
  ...props
}: React.ComponentProps<'div'> & { fullBleed?: boolean }) {
  const isDesktop = useIsDesktopDialog()
  const Footer = isDesktop ? DialogFooter : SheetFooter
  return (
    <Footer
      className={cn(
        !fullBleed && '-mx-6 mt-2 px-6 py-3',
        className,
      )}
      {...props}
    />
  )
}

function ResponsiveDialogTitle(props: React.ComponentProps<typeof DialogTitle>) {
  const isDesktop = useIsDesktopDialog()
  const Title = isDesktop ? DialogTitle : SheetTitle
  return <Title {...props} />
}

function ResponsiveDialogDescription(
  props: React.ComponentProps<typeof DialogDescription>,
) {
  const isDesktop = useIsDesktopDialog()
  const Description = isDesktop ? DialogDescription : SheetDescription
  return <Description {...props} />
}

export {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
}

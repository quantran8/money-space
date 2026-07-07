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
import { cn } from '@/shared/lib/utils'

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

function ResponsiveDialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  const isDesktop = useIsDesktopDialog()
  const Footer = isDesktop ? DialogFooter : SheetFooter
  return <Footer className={cn(!isDesktop && 'pt-2', className)} {...props} />
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

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { PanelLeft } from 'lucide-react'

import { Button, type ButtonProps } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useMediaQuery } from '@/shared/lib/use-media-query'
import { cn } from '@money-space/core/shared/lib/utils'

/**
 * shadcn sidebar, adapted to v5.
 *
 * Two things differ from the upstream component, both deliberate:
 *   - it reads `cn` from the shared core package and reuses this repo's
 *     `useMediaQuery` rather than shipping a second copy of each;
 *   - the `--sidebar-*` palette maps onto v5 tokens (index.css), so the glass
 *     rail keeps the look the styleguide signed off on. Upstream's flat opaque
 *     panel would put a stroke and a solid fill on chrome that v5 says is
 *     translucent.
 *
 * Collapsed width is 72px, not shadcn's 48px: the design spec fixes the rail at
 * 68–76px, and 44px tap targets need the room.
 */
const SIDEBAR_COOKIE_NAME = 'sidebar_state'
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_WIDTH = '15rem'
const SIDEBAR_WIDTH_ICON = '4.5rem'
const SIDEBAR_KEYBOARD_SHORTCUT = 'b'

/** The persisted open/closed state, or null when nothing was stored yet. */
function readStoredOpen(): boolean | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${SIDEBAR_COOKIE_NAME}=([^;]*)`))
  if (!match) return null
  return match[1] === 'true'
}

type SidebarContextProps = {
  state: 'expanded' | 'collapsed'
  open: boolean
  setOpen: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContextProps | null>(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) throw new Error('useSidebar must be used within a SidebarProvider.')
  return context
}

function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  className,
  style,
  children,
  ...props
}: React.ComponentProps<'div'> & {
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  // The rail is desktop-only chrome; below `lg` the app uses the bottom tab bar,
  // so "mobile" here means the same breakpoint the shell hides the rail at.
  const isMobile = !useMediaQuery('(min-width: 1024px)')

  // The cookie is READ here, not only written. Upstream persists the state and
  // then restores it server-side from the request headers; this app is a SPA
  // with no such pass, so without this read the sidebar reopened on every
  // reload and the user's choice was silently discarded.
  const [_open, _setOpen] = React.useState(() => readStoredOpen() ?? defaultOpen)
  const open = openProp ?? _open
  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === 'function' ? value(open) : value
      if (setOpenProp) setOpenProp(openState)
      else _setOpen(openState)

      document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
    },
    [setOpenProp, open],
  )

  const toggleSidebar = React.useCallback(() => {
    setOpen((o) => !o)
  }, [setOpen])

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        toggleSidebar()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleSidebar])

  const state = open ? 'expanded' : 'collapsed'

  const contextValue = React.useMemo<SidebarContextProps>(
    () => ({ state, open, setOpen, isMobile, toggleSidebar }),
    [state, open, setOpen, isMobile, toggleSidebar],
  )

  return (
    <SidebarContext.Provider value={contextValue}>
      <TooltipProvider delayDuration={0}>
        <div
          data-slot="sidebar-wrapper"
          style={
            {
              '--sidebar-width': SIDEBAR_WIDTH,
              '--sidebar-width-icon': SIDEBAR_WIDTH_ICON,
              ...style,
            } as React.CSSProperties
          }
          className={cn('group/sidebar-wrapper flex w-full', className)}
          {...props}
        >
          {children}
        </div>
      </TooltipProvider>
    </SidebarContext.Provider>
  )
}

function Sidebar({
  side = 'left',
  variant = 'sidebar',
  collapsible = 'offcanvas',
  className,
  children,
  ...props
}: React.ComponentProps<'div'> & {
  side?: 'left' | 'right'
  variant?: 'sidebar' | 'floating' | 'inset'
  collapsible?: 'offcanvas' | 'icon' | 'none'
}) {
  const { isMobile, state } = useSidebar()

  if (collapsible === 'none') {
    return (
      <div
        data-slot="sidebar"
        className={cn('flex h-full w-(--sidebar-width) flex-col', className)}
        {...props}
      >
        {children}
      </div>
    )
  }

  // No mobile drawer: below `lg` the app navigates by the bottom tab bar, and
  // v5 §15 is explicit that one breakpoint gets exactly one nav affordance. The
  // upstream component opens a Sheet here; this one simply renders nothing, so
  // the rail is desktop chrome and only that.
  if (isMobile) return null

  return (
    <div
      className="group peer hidden text-sidebar-foreground lg:block"
      data-state={state}
      data-collapsible={state === 'collapsed' ? collapsible : ''}
      data-variant={variant}
      data-side={side}
      data-slot="sidebar"
    >
      {/* The gap element: it reserves the sidebar's width in the flex row so
          the content shifts as the rail expands, while the panel itself is
          fixed and never scrolls with the page. */}
      <div
        data-slot="sidebar-gap"
        className={cn(
          'relative w-(--sidebar-width) bg-transparent transition-[width] duration-200 ease-linear',
          'group-data-[collapsible=offcanvas]:w-0',
          'group-data-[side=right]:rotate-180',
          variant === 'floating' || variant === 'inset'
            ? 'group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+1rem)]'
            : 'group-data-[collapsible=icon]:w-(--sidebar-width-icon)',
        )}
      />
      <div
        data-slot="sidebar-container"
        className={cn(
          'fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-200 ease-linear lg:flex',
          side === 'left'
            ? 'left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]'
            : 'right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]',
          variant === 'floating' || variant === 'inset'
            ? 'p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+1rem+2px)]'
            : 'group-data-[collapsible=icon]:w-(--sidebar-width-icon)',
          className,
        )}
        {...props}
      >
        <div
          data-sidebar="sidebar"
          data-slot="sidebar-inner"
          className={cn(
            'flex h-full w-full flex-col',
            // v5: navigation is glass, and a full-height panel is lit on the
            // edge that meets the content (index.css .glass-edge).
            variant === 'sidebar' && 'glass glass-edge',
            variant === 'floating' && 'glass rounded-lg',
          )}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

function SidebarTrigger({
  className,
  onClick,
  ...props
}: ButtonProps) {
  const { toggleSidebar } = useSidebar()

  return (
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      variant="ghost"
      size="icon"
      className={cn('size-8', className)}
      onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event)
        toggleSidebar()
      }}
      {...props}
    >
      <PanelLeft className="size-[18px]" strokeWidth={1.5} />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
}

/** The hit strip on the sidebar's outer edge — drag-free, click to toggle. */
function SidebarRail({ className, ...props }: React.ComponentProps<'button'>) {
  const { toggleSidebar } = useSidebar()

  return (
    <button
      data-sidebar="rail"
      data-slot="sidebar-rail"
      aria-label="Toggle Sidebar"
      tabIndex={-1}
      onClick={toggleSidebar}
      title="Toggle Sidebar"
      className={cn(
        'absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear lg:flex',
        'after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] hover:after:bg-hair',
        'group-data-[side=left]:-right-4 group-data-[side=right]:left-0',
        '[[data-side=left]_&]:cursor-w-resize [[data-side=right]_&]:cursor-e-resize',
        '[[data-side=left][data-state=collapsed]_&]:cursor-e-resize',
        '[[data-side=right][data-state=collapsed]_&]:cursor-w-resize',
        className,
      )}
      {...props}
    />
  )
}

function SidebarInset({ className, ...props }: React.ComponentProps<'main'>) {
  return (
    <main
      data-slot="sidebar-inset"
      className={cn('relative flex min-h-svh min-w-0 flex-1 flex-col', className)}
      {...props}
    />
  )
}

function SidebarHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-header"
      data-sidebar="header"
      className={cn('flex flex-col gap-2 p-3', className)}
      {...props}
    />
  )
}

function SidebarFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-footer"
      data-sidebar="footer"
      className={cn('flex flex-col gap-2 p-3', className)}
      {...props}
    />
  )
}

function SidebarSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="sidebar-separator"
      data-sidebar="separator"
      className={cn('mx-2 w-auto bg-hair', className)}
      {...props}
    />
  )
}

function SidebarContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-content"
      data-sidebar="content"
      className={cn(
        'flex min-h-0 flex-1 flex-col gap-2 overflow-auto',
        'group-data-[collapsible=icon]:overflow-hidden',
        className,
      )}
      {...props}
    />
  )
}

function SidebarGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-group"
      data-sidebar="group"
      className={cn('relative flex w-full min-w-0 flex-col p-2', className)}
      {...props}
    />
  )
}

function SidebarGroupLabel({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<'div'> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'div'

  return (
    <Comp
      data-slot="sidebar-group-label"
      data-sidebar="group-label"
      className={cn(
        'flex h-8 shrink-0 items-center rounded-md px-2 t-caption text-ink3',
        'transition-[margin,opacity] duration-200 ease-linear',
        'group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0',
        className,
      )}
      {...props}
    />
  )
}

function SidebarMenu({ className, ...props }: React.ComponentProps<'ul'>) {
  return (
    <ul
      data-slot="sidebar-menu"
      data-sidebar="menu"
      className={cn('flex w-full min-w-0 flex-col gap-1', className)}
      {...props}
    />
  )
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<'li'>) {
  return (
    <li
      data-slot="sidebar-menu-item"
      data-sidebar="menu-item"
      className={cn('group/menu-item relative', className)}
      {...props}
    />
  )
}

/**
 * A menu button. Active is a filled pill in `--action` — v5 keeps that as the
 * one place ink fills a background in navigation, because an icon alone cannot
 * carry "you are here" by weight (index.css .rail-item).
 *
 * Height is 44px, the §11 touch floor, and collapsed it becomes a 44px circle
 * centred in the 72px rail.
 */
const sidebarMenuButtonVariants = cva(
  cn(
    'peer/menu-button group/btn relative flex w-full items-center gap-3 overflow-hidden rounded-pill',
    'px-3 text-left transition-[background,color] duration-150',
    // No `outline-hidden` and no ring: index.css §24 already gives every focused
    // link and button a 2px --action outline, and focus is the one place this
    // system always allows a stroke. Upstream's `outline-hidden` + ring idiom
    // removed that global outline and replaced it with a ring this palette does
    // not define, so a keyboard user tabbing the nav saw nothing at all.
    'focus-visible:outline-2 focus-visible:outline-action focus-visible:outline-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    '[&>svg]:size-[19px] [&>svg]:shrink-0',
    // Collapsed: a 44px circle, centred, and everything that is not the icon
    // is REMOVED rather than squeezed. Without the `[&>*:not(svg):not(img)]`
    // rule the labels stayed in the 72px rail as truncated stubs ("T.", "S."),
    // which reads as broken text, not as an icon rail.
    'group-data-[collapsible=icon]:size-11 group-data-[collapsible=icon]:justify-center',
    'group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:px-0',
    'group-data-[collapsible=icon]:gap-0',
    'group-data-[collapsible=icon]:[&>*:not(svg):not(img)]:hidden',
  ),
  {
    variants: {
      variant: {
        default: cn(
          'text-ink2 hover:bg-white/75 hover:text-ink',
          // The active fill stays in the collapsed rail too. 02-components.md
          // §8 specifies the rail as "active item = dark filled circle", and
          // index.css says why: an icon alone cannot carry "you are here" by
          // weight. --ink2 → --ink on a 1.5-weight 19px glyph is not a
          // difference anyone reads, so the disc is the signal.
          'data-[active=true]:bg-action data-[active=true]:text-action-inverse',
        ),
      },
      size: {
        default: 'h-11 t-body-sm',
        sm: 'h-9 t-caption',
        lg: 'h-12 t-body',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

function SidebarMenuButton({
  asChild = false,
  isActive = false,
  variant = 'default',
  size = 'default',
  tooltip,
  className,
  ...props
}: React.ComponentProps<'button'> & {
  asChild?: boolean
  isActive?: boolean
  tooltip?: string | React.ComponentProps<typeof TooltipContent>
} & VariantProps<typeof sidebarMenuButtonVariants>) {
  const Comp = asChild ? Slot : 'button'
  const { isMobile, state } = useSidebar()

  const button = (
    <Comp
      data-slot="sidebar-menu-button"
      data-sidebar="menu-button"
      data-size={size}
      data-active={isActive}
      className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
      {...props}
    />
  )

  if (!tooltip) return button

  const tooltipProps = typeof tooltip === 'string' ? { children: tooltip } : tooltip

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      {/* Only the collapsed rail is icon-only, and that is the only state that
          needs the tooltip — §15 requires it there, and expanded the label is
          already on screen. */}
      <TooltipContent side="right" align="center" hidden={state !== 'collapsed' || isMobile} {...tooltipProps} />
    </Tooltip>
  )
}

function SidebarMenuAction({
  className,
  asChild = false,
  showOnHover = false,
  ...props
}: React.ComponentProps<'button'> & { asChild?: boolean; showOnHover?: boolean }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="sidebar-menu-action"
      data-sidebar="menu-action"
      className={cn(
        'absolute top-1.5 right-1 flex aspect-square w-8 items-center justify-center rounded-md',
        'text-ink2 transition-transform hover:bg-white/75 hover:text-ink',
        '[&>svg]:size-4 [&>svg]:shrink-0',
        'group-data-[collapsible=icon]:hidden',
        showOnHover &&
          'group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 md:opacity-0',
        className,
      )}
      {...props}
    />
  )
}

function SidebarMenuBadge({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-menu-badge"
      data-sidebar="menu-badge"
      className={cn(
        'pointer-events-none absolute right-2 flex h-5 min-w-5 select-none items-center justify-center',
        'rounded-md px-1 t-caption-sm tabular-nums text-ink2',
        'peer-data-[active=true]/menu-button:text-action-inverse',
        'group-data-[collapsible=icon]:hidden',
        className,
      )}
      {...props}
    />
  )
}

const SKELETON_WIDTHS = [72, 54, 86, 61, 78]

function SidebarMenuSkeleton({
  className,
  showIcon = false,
  index = 0,
  ...props
}: React.ComponentProps<'div'> & { showIcon?: boolean; index?: number }) {
  // Varied widths so a column of skeletons doesn't read as a table. Upstream
  // rolls `Math.random()` here; that is an impure render (and a width that
  // changes on every re-render), so the variation is a fixed cycle instead —
  // callers pass `index` when they render more than one.
  const width = `${SKELETON_WIDTHS[index % SKELETON_WIDTHS.length]}%`

  return (
    <div
      data-slot="sidebar-menu-skeleton"
      data-sidebar="menu-skeleton"
      className={cn('flex h-11 items-center gap-3 rounded-pill px-3', className)}
      {...props}
    >
      {showIcon && <Skeleton className="size-5 rounded-md" />}
      <Skeleton className="h-4 max-w-(--skeleton-width) flex-1" style={{ '--skeleton-width': width } as React.CSSProperties} />
    </div>
  )
}

function SidebarMenuSub({ className, ...props }: React.ComponentProps<'ul'>) {
  return (
    <ul
      data-slot="sidebar-menu-sub"
      data-sidebar="menu-sub"
      className={cn(
        'mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-hair px-2.5 py-0.5',
        'group-data-[collapsible=icon]:hidden',
        className,
      )}
      {...props}
    />
  )
}

function SidebarMenuSubItem({ className, ...props }: React.ComponentProps<'li'>) {
  return (
    <li
      data-slot="sidebar-menu-sub-item"
      data-sidebar="menu-sub-item"
      className={cn('group/menu-sub-item relative', className)}
      {...props}
    />
  )
}

function SidebarMenuSubButton({
  asChild = false,
  size = 'md',
  isActive = false,
  className,
  ...props
}: React.ComponentProps<'a'> & {
  asChild?: boolean
  size?: 'sm' | 'md'
  isActive?: boolean
}) {
  const Comp = asChild ? Slot : 'a'

  return (
    <Comp
      data-slot="sidebar-menu-sub-button"
      data-sidebar="menu-sub-button"
      data-size={size}
      data-active={isActive}
      className={cn(
        'flex h-9 min-w-0 items-center gap-2 overflow-hidden rounded-md px-2 text-ink2',
        'hover:bg-white/75 hover:text-ink',
        'data-[active=true]:bg-white/75 data-[active=true]:text-ink',
        '[&>svg]:size-4 [&>svg]:shrink-0',
        size === 'sm' && 't-caption',
        size === 'md' && 't-body-sm',
        'group-data-[collapsible=icon]:hidden',
        className,
      )}
      {...props}
    />
  )
}

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
}

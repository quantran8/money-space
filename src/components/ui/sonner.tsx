import { Toaster as Sonner } from 'sonner'

type ToasterProps = React.ComponentProps<typeof Sonner>

/**
 * A toast floats above the page, so like a modal it keeps a real shadow
 * (design.md §2.3). No border: the panel fill plus the shadow is what lifts it
 * off the tinted `--app` background (§2.2).
 */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:border-none group-[.toaster]:bg-panel group-[.toaster]:text-ink group-[.toaster]:rounded-panel group-[.toaster]:shadow-[0_16px_40px_rgba(0,0,0,0.14)]',
          description: 'group-[.toast]:text-ink2',
          actionButton: 'group-[.toast]:bg-accent group-[.toast]:text-white',
          cancelButton: 'group-[.toast]:bg-sunk group-[.toast]:text-ink2',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }

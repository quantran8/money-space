import logoUrl from '@/assets/logo.png'

import { cn } from '@money-space/core/shared/lib/utils'

/**
 * The Money Space app mark, authored once so every surface — auth, the desktop
 * rail, the mobile header, the favicon — shows the same artwork.
 *
 * The source file is a square tile that already carries its own rounded corner
 * and pale ground, so the element only needs sizing and clipping: never put it
 * on a coloured box, or the tile's own ground shows as a seam.
 */
export function AppLogo({ className }: { className?: string }) {
  return (
    <img
      src={logoUrl}
      alt=""
      aria-hidden="true"
      draggable={false}
      className={cn('block shrink-0 rounded-[12px] object-cover select-none', className)}
    />
  )
}

import type { ReactNode } from 'react'


type SubSectionProps = {
  /** Group label, e.g. "Thanh khoản" / "Tổng tài sản". */
  title: string
  /** Optional trailing element (badge, tiny hint) aligned to the label. */
  aside?: ReactNode
  children: ReactNode
  className?: string
}

/**
 * A meaning group inside a card (v5 02-components §4, 03-patterns §6).
 *
 * Section → sub-section → metric survives as a HIERARCHY, but v5 removed the
 * tinted block that used to carry it: three nested surfaces is exactly the
 * pattern §2.2 rules out. The group is now a label plus spacing, which is what
 * §6 means by hierarchy from type and alignment rather than from containers.
 */
export function SubSection({ title, aside, children, className }: SubSectionProps) {
  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[12px] font-medium tracking-[0.02em] text-ink3">{title}</p>
        {aside}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  )
}

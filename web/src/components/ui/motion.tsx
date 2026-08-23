import { motion, type HTMLMotionProps, type Transition, type Variants } from 'motion/react'

/**
 * Shared motion primitives for the app.
 *
 * Animation is treated like the rest of the design system: the easing curve,
 * durations and enter offsets live here so every animated surface reads the
 * same, rather than each page hand-tuning its own transition. Prefer these
 * over inline `motion.div` config; reach for raw `motion/react` only for
 * one-off cases these don't cover.
 *
 * Motion budget (keep every value inside these ranges):
 *   - duration: 160–260ms
 *   - movement: 4–12px
 */

/** Apple-like "ease-out-expo" curve used across the app. */
export const easeOut: Transition['ease'] = [0.22, 1, 0.36, 1]

/** Page-level enter: a soft fade + small upward drift. */
export const pageTransition: Transition = { duration: 0.22, ease: easeOut }

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
}

/** Card / list-row enter: same feel, slightly larger drift. */
export const itemVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
}

const itemTransition: Transition = { duration: 0.2, ease: easeOut }

/** Parent that staggers its animated children on mount. */
export const staggerContainerVariants: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.05 } },
}

/**
 * A container whose direct `AppearItem` children fade/slide in with a small
 * stagger on mount. Use for dashboard card grids, asset rows, payment rows.
 */
export function AppearGroup({ children, ...props }: HTMLMotionProps<'div'>) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={staggerContainerVariants}
      {...props}
    >
      {children}
    </motion.div>
  )
}

/** A single item that fades/slides in. Inherits stagger from `AppearGroup`. */
export function AppearItem({ children, ...props }: HTMLMotionProps<'div'>) {
  return (
    <motion.div variants={itemVariants} transition={itemTransition} {...props}>
      {children}
    </motion.div>
  )
}

/**
 * A number whose value transitions with a small "updated" nudge whenever it
 * changes. Pass a stable `value`; the animation re-fires on each new value.
 */
export function AnimatedNumber({
  value,
  className,
}: {
  value: string | number
  className?: string
}) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: easeOut }}
      className={className}
    >
      {value}
    </motion.span>
  )
}

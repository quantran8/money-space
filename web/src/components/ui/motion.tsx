import {
  Children,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  animate,
  AnimatePresence,
  motion,
  MotionValue,
  useReducedMotion,
  type HTMLMotionProps,
  type Transition,
  type Variants,
} from 'motion/react'

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

/**
 * The curve for a value the reader is meant to READ while it changes.
 *
 * `easeOut` above is expo: it is at ~90% within the first fifth of its
 * duration. For a card sliding 10px that is exactly right — the movement is
 * over before it can be noticed. For a number it is wrong twice over: the
 * figure blurs through almost its whole range instantly, then crawls the last
 * tenth, so it reads as fast AND sluggish at once.
 *
 * This is a gentler ease-out that spends its time evenly enough to follow.
 */
export const easeCount: Transition['ease'] = [0.33, 0.35, 0.2, 1]

/** Page-level enter: a soft fade + small drift. */
export const pageTransition: Transition = { duration: 0.22, ease: easeOut }

/**
 * The drift is NEGATIVE, and that sign is load-bearing.
 *
 * The page wrapper is `min-h-full`, so it already stands exactly as tall as the
 * scroll container. Offsetting it DOWN pushed those 8px past the bottom edge,
 * which counts as scrollable overflow — so every route change flashed a
 * scrollbar on and off for the length of the transition, on pages with nothing
 * to scroll. Upward overflow is not scrollable, so drifting up settles into
 * place without ever making the page scrollable.
 */
export const pageVariants: Variants = {
  initial: { opacity: 0, y: -8 },
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
 * Content that unrolls from under its trigger instead of appearing outright.
 *
 * The one thing React cannot do alone: an unmounted child is gone on the next
 * frame, so a disclosure written as `{open ? <div/> : null}` can only ever
 * blink. `AnimatePresence` keeps it mounted long enough to leave.
 *
 * Height carries the movement and `overflow-hidden` clips it mid-transition.
 * Opacity runs shorter than height so the text is not readable while it is
 * still sliding.
 */
export function Collapse({
  open,
  children,
  className,
}: {
  open: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <AnimatePresence initial={false}>
      {open ? (
        <motion.div
          key="collapse"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{
            height: { duration: 0.24, ease: easeOut },
            opacity: { duration: 0.16, ease: easeOut },
          }}
          className="overflow-hidden"
        >
          <div className={className}>{children}</div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

/**
 * One surface swapped for another in the same slot — a tab body, a step, a
 * result replacing a form.
 *
 * `mode="wait"` so the outgoing pane finishes before the incoming one starts;
 * crossfading two panes of different heights makes the container jump.
 * Re-fires on each new `activeKey`.
 */
export function SwitchPane({
  activeKey,
  children,
  className,
}: {
  activeKey: string
  children: ReactNode
  className?: string
}) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={activeKey}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.18, ease: easeOut }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
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

/**
 * Whether the surrounding `RevealSequence` section has been revealed yet.
 *
 * `true` outside a sequence, so `CountUp` and `GrowBar` behave normally
 * anywhere else — a primitive should not need a provider to work.
 *
 * This exists because `RevealSequence` mounts every child up front (see there
 * for why) and only fades them in. Without a signal, a counting figure five
 * sections down would start the moment the screen opened and be finished long
 * before anyone saw its card — which is exactly the bug this fixes: the numbers
 * were animating, just never while visible.
 */
const RevealedContext = createContext(true)

/**
 * Whether the surrounding `RevealSequence` section is showing.
 *
 * For a one-off `motion` element that has to hold still until its section
 * arrives, the way `CountUp` and `GrowBar` already do. Returns `true` outside a
 * sequence.
 */
export function useRevealed() {
  return useContext(RevealedContext)
}

/**
 * A number that counts up to its value on mount.
 *
 * For a figure whose SIZE is the point — "+32 ngày", "−4,2 tr". Watching it
 * climb is what makes the magnitude land; a number that simply appears is read
 * as a label, one that arrives at 32 is read as a cost. Use it only where that
 * is true: a date or an id counting up is noise, and every figure on a screen
 * animating at once is a slot machine.
 *
 * The count runs to 1.1s, far past the 160–260ms budget at the top of this
 * file. That budget governs ENTER transitions, where anything longer reads as
 * lag — here the duration IS the content: the reader is meant to WATCH the
 * figure climb, and at enter-speed there is nothing to watch. Deliberately the
 * only exception in this file.
 *
 * It eases on `easeCount`, not `easeOut`. See that constant: an expo curve
 * makes a counting number read as fast and sluggish at the same time, which is
 * most of what "not smooth" means here.
 *
 * `delay` exists so the count can start once its card has finished arriving.
 * Running both at once means the figure changes while the surface under it is
 * still moving, and the two motions fight.
 *
 * Inside a `RevealSequence` it waits to be revealed before counting at all —
 * mount is not the same moment as becoming visible there.
 *
 * `format` receives the running value, so the caller keeps ownership of how the
 * number reads (money scale, "+" sign, units) and the interpolation never has
 * to guess at it.
 *
 * Honours `prefers-reduced-motion` by rendering the final value outright: the
 * CSS block for that setting cannot reach a JS-driven interpolation, so this
 * has to opt out itself.
 */
export function CountUp({
  value,
  format,
  className,
  duration = 1.1,
  delay = 0,
}: {
  value: number
  /** Renders the running value. Defaults to a rounded integer. */
  format?: (current: number) => string
  className?: string
  duration?: number
  /** Seconds to wait before counting — usually the card's own enter. */
  delay?: number
}) {
  const reduced = useReducedMotion()
  const revealed = useContext(RevealedContext)
  const render = format ?? ((current: number) => String(Math.round(current)))

  /**
   * First paint.
   *
   * The FINAL value when there will be no animation — reduced motion, or a
   * value of 0 with nothing to climb — so the real figure is on screen without
   * an effect having to write it back. Otherwise 0, which is where the count
   * starts: showing the answer and then snapping back to 0 to count toward it
   * would be worse than not animating at all.
   */
  const [display, setDisplay] = useState(() => render(reduced ? value : 0))

  // `render` is rebuilt on every parent render when the caller passes an
  // inline `format`, so it is held in a ref rather than depended on — as a
  // dependency it would restart the count continuously. Written in an effect,
  // never during render.
  const renderRef = useRef(render)
  useEffect(() => {
    renderRef.current = render
  })

  useEffect(() => {
    // Not until the surrounding section is actually showing: inside a
    // `RevealSequence` every child is mounted from the start, so counting on
    // mount would finish long before the card became visible.
    if (reduced || !revealed) return

    const motionValue = new MotionValue(0)
    const controls = animate(motionValue, value, {
      duration,
      delay,
      ease: easeCount,
      onUpdate: (current) => setDisplay(renderRef.current(current)),
    })
    return () => controls.stop()
  }, [value, duration, delay, reduced, revealed])

  return <span className={className}>{display}</span>
}

/**
 * A bar that grows to its share on mount.
 *
 * The width IS the figure, so it animates from 0 for the same reason `CountUp`
 * does — a bar that is simply there states a proportion, one that grows states
 * a change. Pass `share` as a percentage.
 *
 * Paced and eased exactly like `CountUp`, because it is usually stating the
 * same figure a second way: a bar on a different curve or duration beside a
 * counting number reads as two unrelated events. It waits on the same reveal
 * signal for the same reason.
 */
export function GrowBar({
  share,
  className,
  delay = 0,
}: {
  share: number
  className?: string
  delay?: number
}) {
  const revealed = useContext(RevealedContext)
  return (
    <motion.div
      className={className}
      initial={{ width: 0 }}
      // Held at 0 until the section is revealed: mounted-but-invisible is not
      // the moment to grow, or the bar is already full when its card arrives.
      animate={{ width: revealed ? `${share}%` : 0 }}
      transition={{ duration: 1.1, ease: easeCount, delay }}
    />
  )
}

/**
 * Reveals its children ONE AT A TIME, each waiting for the previous one to
 * finish before it appears.
 *
 * Different from `AppearGroup`'s stagger, and the difference is the whole
 * point. A stagger offsets each child by a fixed amount and lets them overlap:
 * with five sections whose own figures count for well over a second, every one
 * of them ends up running at the same time and the screen reads as a single
 * twitch. Here a section is not mounted at all until the one above it has
 * settled, so the reader can actually follow each in turn.
 *
 * `stepMs` is how long one section is given, and it has to ADD UP:
 *
 *     card enter (0.42s) + inner delay/count (0.12 + 1.1s) + a beat to read it
 *
 * ≈ 1.9s. Set it below that and the next card starts while this one's figures
 * are still moving, which is the overlap this component exists to remove.
 * `SECTION_ENTER` and `SECTION_COUNT_DELAY` are exported so callers can hand
 * the same delay to the `CountUp`s inside a child instead of guessing.
 *
 * Under `prefers-reduced-motion` everything is revealed at once: sequencing IS
 * motion, and a reader who asked for less of it should not be made to wait
 * seconds for content that is already loaded.
 */
/** How long a section takes to arrive. */
export const SECTION_ENTER = 0.42

/**
 * What a `CountUp` inside a section should wait.
 *
 * The card's enter plus a small beat, so the number starts once the surface
 * under it has stopped moving rather than during it.
 */
export const SECTION_COUNT_DELAY = SECTION_ENTER + 0.12

export function RevealSequence({
  children,
  stepMs = 1900,
  className,
}: {
  children: ReactNode
  stepMs?: number
  className?: string
}) {
  const reduced = useReducedMotion()
  const items = Children.toArray(children)
  const [revealed, setRevealed] = useState(reduced ? items.length : 1)

  useEffect(() => {
    if (reduced || revealed >= items.length) return
    const timer = setTimeout(() => setRevealed((count) => count + 1), stepMs)
    return () => clearTimeout(timer)
  }, [revealed, items.length, stepMs, reduced])

  /**
   * Any interaction reveals the rest at once.
   *
   * A sequence this slow is a courtesy, not a gate: the content is already
   * loaded, and a reader who scrolls, taps or hits a key has told us they are
   * done watching. Making them wait for a section they are trying to reach —
   * one they cannot even scroll to yet, since it is not mounted — would turn
   * the pacing into an obstacle.
   */
  const skip = () => setRevealed(items.length)

  return (
    <div
      className={className}
      onPointerDown={skip}
      onWheel={skip}
      onTouchMove={skip}
      onKeyDown={skip}
    >
      {items.map((child, index) => {
        const shown = index < revealed
        return (
          // Index is the honest key here: the children are a fixed, ordered
          // list written out in the parent's JSX, not data that can reorder.
          //
          // Every child is MOUNTED from the start and hidden with opacity,
          // never unmounted. Slicing the list instead made the container grow
          // on each reveal, and a centred dialog re-centres on every height
          // change — the whole surface jumped each time a section appeared.
          // Holding the full height from the first frame means a revealed
          // section fills space that is already there.
          <motion.div
            key={index}
            initial={false}
            animate={{ opacity: shown ? 1 : 0, y: shown ? 0 : 10 }}
            transition={{ duration: SECTION_ENTER, ease: easeOut }}
            // Nothing invisible is reachable by tab or read aloud: it is not
            // absent, it just has not arrived yet.
            aria-hidden={!shown}
            inert={!shown}
          >
            {/* Descendant `CountUp`s and `GrowBar`s hold still until their own
                section is the one showing. */}
            <RevealedContext.Provider value={shown}>
              {child}
            </RevealedContext.Provider>
          </motion.div>
        )
      })}
    </div>
  )
}

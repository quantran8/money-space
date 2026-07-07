/**
 * Radix layers (DropdownMenu, Dialog, Sheet) set `pointer-events: none` on
 * <body> while an overlay is open and restore it on close. When a menu item
 * opens a dialog in the same tick, the two cleanup passes can race and leave
 * <body> stuck with `pointer-events: none`, making the whole page unclickable.
 *
 * Call this after any such overlay closes to guarantee the body is interactive
 * again. It is a no-op when nothing is stuck.
 */
export function clearStuckBodyPointerEvents() {
  if (typeof document === 'undefined') return

  const clear = () => {
    if (document.body.style.pointerEvents === 'none') {
      document.body.style.pointerEvents = ''
    }
  }

  // Run across several deferred passes so this wins regardless of whether it
  // fires before or after Radix's own restore (which races when a dropdown and
  // a dialog open/close in the same tick), and so a value re-applied during the
  // dialog's exit animation still gets cleared. Passes span past the ~200-300ms
  // close animation.
  clear()
  requestAnimationFrame(clear)
  for (const delay of [0, 60, 120, 250, 400]) {
    setTimeout(clear, delay)
  }
}

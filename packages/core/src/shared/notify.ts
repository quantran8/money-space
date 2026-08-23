/**
 * Transient feedback ("Đã lưu", "Không lưu được"), injected by the host app.
 *
 * Core cannot depend on a toast library directly: the web renders these with
 * sonner, and React Native has no DOM for it to portal into. The surface is
 * deliberately the two calls the app actually makes — anything richer would
 * become a second, competing way to talk to the user.
 */

export type Notifier = {
  success: (message: string) => void
  error: (message: string) => void
}

/** Silent until a host configures one, so core never crashes for want of a UI. */
let notifier: Notifier = {
  success: () => {},
  error: () => {},
}

export function configureNotifier(next: Notifier) {
  notifier = next
}

export const notify: Notifier = {
  success: (message) => notifier.success(message),
  error: (message) => notifier.error(message),
}

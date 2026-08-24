import { toast } from 'sonner'

import type { Notifier } from '@money-space/core/shared/notify'

/**
 * sonner behind core's notifier interface.
 *
 * Safe to install at startup, before anything renders: sonner queues toasts
 * until its `<Toaster />` mounts, so a message raised during boot is not lost.
 */
export const webNotifier: Notifier = {
  success: (message) => toast.success(message),
  error: (message) => toast.error(message),
}

/**
 * Re-register the `persist` mutator against the ESM type entrypoint.
 *
 * zustand ships the mutator registration inside `middleware/persist.d.mts` as
 * `declare module '../vanilla.mjs'` — a runtime specifier. Under
 * `moduleResolution: bundler` we import types from `zustand/vanilla`, which
 * resolves to `esm/vanilla.d.mts`, so the augmentation targets a module name
 * that never matches and silently no-ops. `StoreMutators` stays empty,
 * `StoreMutatorIdentifier` collapses to `never`, and the curried
 * `create<T>()(persist(...))` overload stops accepting the initializer.
 *
 * Upstream bug, present in both 5.0.14 and 5.0.15 (latest). Delete this file
 * once zustand augments the `.d.mts` entrypoint.
 */
import type { PersistOptions } from 'zustand/middleware'

declare module 'zustand/vanilla' {
  interface StoreMutators<S, A> {
    'zustand/persist': WithPersist<S, A>
  }
}

type WithPersist<S, A> = S extends { getState: () => infer T }
  ? S & { persist: StorePersist<T, A> }
  : never

type StorePersist<S, A> = {
  setOptions: (options: Partial<PersistOptions<S, A>>) => void
  clearStorage: () => void
  rehydrate: () => Promise<void> | void
  hasHydrated: () => boolean
  onHydrate: (fn: (state: S) => void) => () => void
  onFinishHydration: (fn: (state: S) => void) => () => void
  getOptions: () => Partial<PersistOptions<S, A>>
}

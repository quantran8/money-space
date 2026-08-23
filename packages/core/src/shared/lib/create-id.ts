/**
 * A client-side id, on every platform core runs on.
 *
 * `crypto.randomUUID()` is not available in React Native: Hermes ships no
 * global `crypto`, so calling it throws rather than returning a bad id — which
 * took down asset creation on mobile at the point of submit. The web keeps the
 * real thing when it is there; the fallback is only ever used for ids the
 * server does not read (a local optimistic object, a React key), so it needs to
 * be unique, not cryptographically random.
 */
export function createId(): string {
  const maybeCrypto = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto
  if (typeof maybeCrypto?.randomUUID === 'function') return maybeCrypto.randomUUID()

  // RFC-4122-shaped, from Math.random. Not a security primitive, and never sent
  // anywhere that treats an id as one.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0
    const value = char === 'x' ? random : (random & 0x3) | 0x8
    return value.toString(16)
  })
}

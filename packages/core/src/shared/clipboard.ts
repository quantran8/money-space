/**
 * Clipboard access, injected by the host app.
 *
 * `navigator.clipboard` does not exist in React Native, so a hook that reached
 * for it directly worked on the web and silently failed on a phone — the
 * invite dialog's "Sao chép" was the visible casualty: it always landed in the
 * catch and told the user copying had failed when nothing had been tried.
 *
 * Same shape as `storage.ts` and `notify.ts`: async, because every native
 * clipboard API is, and the web's is too.
 */

export type ClipboardAdapter = {
  writeText: (text: string) => Promise<void>
  readText: () => Promise<string>
}

/**
 * The browser default, so the web needs no wiring. It throws in a React Native
 * runtime, where `navigator.clipboard` is undefined — which is exactly what
 * `configureClipboard` is for.
 */
const webClipboard: ClipboardAdapter = {
  writeText: (text) => navigator.clipboard.writeText(text),
  readText: () => navigator.clipboard.readText(),
}

let adapter: ClipboardAdapter = webClipboard

export function configureClipboard(next: ClipboardAdapter) {
  adapter = next
}

export const clipboard: ClipboardAdapter = {
  writeText: (text) => adapter.writeText(text),
  readText: () => adapter.readText(),
}

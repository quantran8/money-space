/**
 * Build-time constants injected by Vite's `define` (see vite.config.ts).
 *
 * Without this declaration `tsc -b` fails at the use site rather than here, and
 * the error points at the component instead of the missing global.
 */
declare const __APP_VERSION__: string

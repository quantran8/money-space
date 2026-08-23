/**
 * What-if — "if we spend this, what happens?".
 *
 * One export, because there is one surface: a sheet mounted ONCE in
 * `app/(tabs)/_layout.tsx`. Anything that wants to open it calls
 * `useWhatIfStore().openWhatIf(...)` from core rather than rendering a second
 * copy, so no screen has to prop-drill a handler down to reach it.
 *
 * There is no `/what-if` route, and no scenario is ever saved.
 */

export { WhatIfSheet } from '@/features/whatif/ui/whatif-sheet'
export { WhatIfResultBlocks } from '@/features/whatif/ui/whatif-result-blocks'

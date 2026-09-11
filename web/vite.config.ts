import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import pkg from './package.json' with { type: 'json' }

const core = path.resolve(__dirname, '../packages/core/src')

// https://vite.dev/config/
export default defineConfig({
  // Stamped at build time so a feedback report names the build it came from.
  // Declared for TypeScript in src/globals.d.ts.
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // Order matters: the longer, more specific prefixes must be tried before
      // the bare '@' alias, or '@money-space/core/...' would resolve into src/.
      '@money-space/core': core,
      // Core's own internal alias. Declared here because Vite does not read the
      // package's `imports` field for files outside node_modules.
      '#': core,
      '@': path.resolve(__dirname, './src'),
    },
  },
})

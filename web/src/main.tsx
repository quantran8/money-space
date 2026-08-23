import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from '@/app/App'
import { installAuthBridge } from '@money-space/core/features/auth/api/auth-bridge'
import { initI18n, restoreLanguage } from '@money-space/core/i18n/config'
import { configureEnv } from '@money-space/core/shared/api/env'
import { queryClient } from '@money-space/core/shared/api/query-client'
import { hydrateAuth } from '@money-space/core/shared/stores/auth-store'
import { configureStorage } from '@money-space/core/shared/storage'
import { webStorage } from '@/shared/web-storage'

// Core reads its environment through injection: the web has `import.meta.env`,
// the mobile app has `process.env.EXPO_PUBLIC_*`, and neither expression is
// valid in the other's bundler.
configureEnv({ apiBaseUrl: import.meta.env.VITE_API_BASE_URL })
configureStorage(webStorage)

// Wire the HTTP client to the auth store before any request runs.
installAuthBridge()

initI18n(window.navigator.language)
void restoreLanguage()

// Reads localStorage, so it settles on the first tick — but the gates still
// wait on `hydrated`, which is what lets the same code work on native.
void hydrateAuth()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)

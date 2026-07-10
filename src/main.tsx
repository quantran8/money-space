import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from '@/app/App'
import '@/i18n/config'
import { installAuthBridge } from '@/features/auth/api/auth-bridge'
import { queryClient } from '@/shared/api/query-client'

// Wire the HTTP client to the auth store before any request runs.
installAuthBridge()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)

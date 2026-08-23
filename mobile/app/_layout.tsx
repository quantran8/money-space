import '../global.css'

import { useEffect, useState } from 'react'
import { AppState } from 'react-native'
import { QueryClientProvider, focusManager } from '@tanstack/react-query'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { queryClient } from '@money-space/core/shared/api/query-client'

import { bootstrap } from '@/shared/bootstrap'
import { ToastProvider } from '@/shared/toast'

import type { AppStateStatus } from 'react-native'

/**
 * The query client is configured with `refetchOnWindowFocus: false` because the
 * web has no useful focus signal. On a phone there is one: coming back from the
 * background is exactly when the household's numbers are most likely stale, and
 * the backend has no push channel to tell us otherwise.
 */
function onAppStateChange(status: AppStateStatus) {
  focusManager.setFocused(status === 'active')
}

export default function RootLayout() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    void bootstrap().then(() => setReady(true))
  }, [])

  useEffect(() => {
    const subscription = AppState.addEventListener('change', onAppStateChange)
    return () => subscription.remove()
  }, [])

  // Nothing renders until storage has been read. The auth gate would otherwise
  // see `hydrated: false` on the first frame and there would be no session to
  // show — the splash stays up instead of a screen flashing past.
  if (!ready) return null

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <StatusBar style="dark" />
          {/* Screens paint their own background; a header here would double up
              on the page titles each screen already renders. */}
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#EEF1F3' } }} />
        </ToastProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  )
}

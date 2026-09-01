import '../global.css'

import { useEffect, useState } from 'react'
import { AppState } from 'react-native'
import { QueryClientProvider, focusManager } from '@tanstack/react-query'
import {
  Urbanist_300Light,
  Urbanist_400Regular,
  Urbanist_500Medium,
  useFonts,
} from '@expo-google-fonts/urbanist'
import { IBMPlexMono_400Regular } from '@expo-google-fonts/ibm-plex-mono'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { queryClient } from '@money-space/core/shared/api/query-client'

import { bootstrap } from '@/shared/bootstrap'
import { colors } from '@/theme/tokens'
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

  // v5 §5.1: Urbanist carries the whole UI at 300/400/500, IBM Plex Mono is a
  // treatment for ASCII only. Until they land every `font-*` class falls back
  // to the system face, which is a different metric — so hold the first frame
  // rather than let the app reflow once the fonts arrive.
  const [fontsLoaded] = useFonts({
    Urbanist_300Light,
    Urbanist_400Regular,
    Urbanist_500Medium,
    IBMPlexMono_400Regular,
  })

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
  if (!ready || !fontsLoaded) return null

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <StatusBar style="dark" />
          {/* Screens paint their own background; a header here would double up
              on the page titles each screen already renders. */}
          <Stack
          screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }}
        />
        </ToastProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  )
}

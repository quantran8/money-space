import { Redirect } from 'expo-router'

/**
 * The app opens on the dashboard tab. The gates inside `(tabs)` decide whether
 * the user actually gets there or is sent to sign in / create a household.
 */
export default function Index() {
  return <Redirect href="/(tabs)" />
}

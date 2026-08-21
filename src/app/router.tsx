import { Navigate, createBrowserRouter, useLocation } from 'react-router-dom'

import { AppShell } from '@/app/layout/app-shell'
import { AssetDetailPage } from '@/features/assets/ui/asset-detail-page'
import { AuthCallbackPage } from '@/features/auth/ui/auth-callback-page'
import { LoginPage } from '@/features/auth/ui/login-page'
import { SignupPage } from '@/features/auth/ui/signup-page'
import { RequireAuth } from '@/features/auth/ui/require-auth'
import { DebtDetailPage } from '@/features/debts/ui/debt-detail-page'
import { DashboardPage } from '@/features/dashboard/ui/dashboard-page'
import { NetWorthPage } from '@/features/networth/ui/networth-page'
import { EventsPage } from '@/features/events/ui/events-page'
import { UpcomingPage } from '@/features/forecast/ui/upcoming-page'
import { GoalsPage } from '@/features/goals/ui/goals-page'
import { ActivityPage } from '@/features/activity/ui/activity-page'
import { HouseholdPage } from '@/features/household/ui/household-page'
import { JoinPage } from '@/features/invites/ui/join-page'
import { GoalDetailPage } from '@/features/goals/ui/goal-detail-page'
import { OnboardingPage } from '@/features/onboarding/ui/onboarding-page'
import { RequireHousehold } from '@/features/onboarding/ui/require-household'

/**
 * `/assets` and `/debts` → `/networth`, carrying navigation state across.
 * A plain <Navigate> would drop it, and the events page uses
 * `state: { openCreate: true }` to open the debt form on arrival.
 */
function RedirectToNetWorth() {
  const location = useLocation()
  return <Navigate to="/networth" replace state={location.state} />
}

export const router = createBrowserRouter([
  {
    path: '/auth',
    element: <LoginPage />,
  },
  // Its own route, not a tab: people link straight to signup, and the URL has
  // to say which of the two is showing.
  {
    path: '/auth/signup',
    element: <SignupPage />,
  },
  {
    path: '/auth/callback',
    element: <AuthCallbackPage />,
  },
  {
    path: '/onboarding',
    element: (
      <RequireAuth>
        <OnboardingPage />
      </RequireAuth>
    ),
  },
  /**
   * Where a scanned invite QR lands: `/join?household=…&token=…`.
   *
   * Authenticated but deliberately OUTSIDE `RequireHousehold`. Whoever scans an
   * invite usually has no household yet, and that gate would push them into the
   * create-a-household wizard — the exact opposite of joining one.
   */
  {
    path: '/join',
    element: (
      <RequireAuth>
        <JoinPage />
      </RequireAuth>
    ),
  },
  {
    path: '/',
    element: (
      <RequireAuth>
        <RequireHousehold>
          <AppShell />
        </RequireHousehold>
      </RequireAuth>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      // Assets and debts are ONE route (§: two halves of the same balance
      // sheet). The tab lives in page state, not the URL.
      { path: 'networth', element: <NetWorthPage /> },
      // The detail routes stay separate — an asset and a debt stop being
      // comparable the moment you open one.
      { path: 'assets/:assetId', element: <AssetDetailPage /> },
      { path: 'debts/:debtId', element: <DebtDetailPage /> },
      // The old list routes are gone; keep the redirects so existing links and
      // bookmarks still land somewhere sensible.
      { path: 'assets', element: <RedirectToNetWorth /> },
      { path: 'debts', element: <RedirectToNetWorth /> },
      { path: 'events', element: <EventsPage /> },
      { path: 'upcoming', element: <UpcomingPage /> },
      { path: 'goals', element: <GoalsPage /> },
      { path: 'goals/:goalId', element: <GoalDetailPage /> },
      { path: 'household', element: <HouseholdPage /> },
      // Not a nav item — the bar is pinned at five (§14.9). Reached from Home.
      { path: 'activity', element: <ActivityPage /> },
      // v3.1 redirects (Phase 10): the old routes are gone, not aliased.
      { path: 'payments', element: <Navigate to="/upcoming" replace /> },
      { path: 'members', element: <Navigate to="/household" replace /> },
      { path: 'settings', element: <Navigate to="/household" replace /> },
    ],
  },
])

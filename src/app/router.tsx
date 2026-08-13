import { Navigate, createBrowserRouter } from 'react-router-dom'

import { AppShell } from '@/app/layout/app-shell'
import { AssetDetailPage } from '@/features/assets/ui/asset-detail-page'
import { AssetsPage } from '@/features/assets/ui/assets-page'
import { AuthCallbackPage } from '@/features/auth/ui/auth-callback-page'
import { AuthPage } from '@/features/auth/ui/auth-page'
import { RequireAuth } from '@/features/auth/ui/require-auth'
import { DebtDetailPage } from '@/features/debts/ui/debt-detail-page'
import { DebtsPage } from '@/features/debts/ui/debts-page'
import { DashboardPage } from '@/features/dashboard/ui/dashboard-page'
import { EventsPage } from '@/features/events/ui/events-page'
import { UpcomingPage } from '@/features/forecast/ui/upcoming-page'
import { GoalsPage } from '@/features/goals/ui/goals-page'
import { HouseholdPage } from '@/features/household/ui/household-page'
import { GoalDetailPage } from '@/features/goals/ui/goal-detail-page'
import { OnboardingPage } from '@/features/onboarding/ui/onboarding-page'
import { RequireHousehold } from '@/features/onboarding/ui/require-household'
import { SettingsPage } from '@/features/settings/ui/settings-page'

export const router = createBrowserRouter([
  {
    path: '/auth',
    element: <AuthPage />,
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
      { path: 'assets', element: <AssetsPage /> },
      { path: 'assets/:assetId', element: <AssetDetailPage /> },
      { path: 'debts', element: <DebtsPage /> },
      { path: 'debts/:debtId', element: <DebtDetailPage /> },
      { path: 'events', element: <EventsPage /> },
      { path: 'upcoming', element: <UpcomingPage /> },
      { path: 'goals', element: <GoalsPage /> },
      { path: 'goals/:goalId', element: <GoalDetailPage /> },
      { path: 'household', element: <HouseholdPage /> },
      // v3.1 redirects (Phase 10): the old routes are gone, not aliased.
      { path: 'payments', element: <Navigate to="/upcoming" replace /> },
      { path: 'members', element: <Navigate to="/household" replace /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
])

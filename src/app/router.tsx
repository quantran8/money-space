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
import { GoalsPage } from '@/features/goals/ui/goals-page'
import { MembersPage } from '@/features/members/ui/members-page'
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
      { path: 'goals', element: <GoalsPage /> },
      { path: 'payments', element: <Navigate to="/events" replace /> },
      { path: 'members', element: <MembersPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
])

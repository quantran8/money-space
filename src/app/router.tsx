import { Navigate, createBrowserRouter } from 'react-router-dom'

import { AppShell } from '@/app/layout/app-shell'
import { AssetsPage } from '@/features/assets/ui/assets-page'
import { DebtsPage } from '@/features/debts/ui/debts-page'
import { DashboardPage } from '@/features/dashboard/ui/dashboard-page'
import { EventsPage } from '@/features/events/ui/events-page'
import { GoalsPage } from '@/features/goals/ui/goals-page'
import { MembersPage } from '@/features/members/ui/members-page'
import { SettingsPage } from '@/features/settings/ui/settings-page'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'assets', element: <AssetsPage /> },
      { path: 'debts', element: <DebtsPage /> },
      { path: 'events', element: <EventsPage /> },
      { path: 'goals', element: <GoalsPage /> },
      { path: 'payments', element: <Navigate to="/events" replace /> },
      { path: 'members', element: <MembersPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
])

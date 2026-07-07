import { createBrowserRouter } from 'react-router-dom'

import { AppShell } from '@/app/layout/app-shell'
import { AssetsPage } from '@/features/assets/ui/assets-page'
import { DashboardPage } from '@/features/dashboard/ui/dashboard-page'
import { EventsPage } from '@/features/events/ui/events-page'
import { GoalsPage } from '@/features/goals/ui/goals-page'
import { MembersPage } from '@/features/members/ui/members-page'
import { PaymentsPage } from '@/features/payments/ui/payments-page'
import { SettingsPage } from '@/features/settings/ui/settings-page'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'assets', element: <AssetsPage /> },
      { path: 'events', element: <EventsPage /> },
      { path: 'goals', element: <GoalsPage /> },
      { path: 'payments', element: <PaymentsPage /> },
      { path: 'members', element: <MembersPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
])

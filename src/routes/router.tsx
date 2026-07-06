import { createBrowserRouter } from 'react-router-dom'

import { AppShell } from '@/components/layout/app-shell'
import { AssetsPage } from '@/routes/assets-page'
import { DashboardPage } from '@/routes/dashboard-page'
import { EventsPage } from '@/routes/events-page'
import { GoalsPage } from '@/routes/goals-page'
import { MembersPage } from '@/routes/members-page'
import { PaymentsPage } from '@/routes/payments-page'
import { SettingsPage } from '@/routes/settings-page'

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

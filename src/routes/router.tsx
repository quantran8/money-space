import { createBrowserRouter } from 'react-router-dom'

import { AppShell } from '@/components/layout/app-shell'
import { AssetsPage } from '@/routes/assets-page'
import { DashboardPage } from '@/routes/dashboard-page'
import { EventsPage } from '@/routes/events-page'
import { GoalsPage } from '@/routes/goals-page'
import { PaymentsPage } from '@/routes/payments-page'

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
    ],
  },
])

import { RouterProvider } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'

import { router } from '@/app/router'
import { Toaster } from '@/components/ui/sonner'

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-center" />
      <Analytics />
    </>
  )
}

export default App

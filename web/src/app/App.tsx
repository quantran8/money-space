import { RouterProvider } from 'react-router-dom'

import { router } from '@/app/router'
import { Toaster } from '@/components/ui/sonner'

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-center" />
    </>
  )
}

export default App

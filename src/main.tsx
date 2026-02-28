import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App } from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      retry: 1,
    },
  },
})

// Seed demo data on first run — pick the right seeder based on backend
const useFirestore = import.meta.env.VITE_USE_FIRESTORE === 'true'

if (useFirestore) {
  import('./infrastructure/firebase/firestoreSeed').then(({ seedFirestore, seedFirestoreDailyWork }) => {
    seedFirestore().catch(console.error)
    seedFirestoreDailyWork().catch(console.error)
  })
} else {
  import('./infrastructure/db/seed').then(({ seedDatabase, seedDailyWork }) => {
    seedDatabase().catch(console.error)
    seedDailyWork().catch(console.error)
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
)

import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { GlobalSearch } from '@/presentation/components/shared/GlobalSearch'
import { usePlans } from '@/presentation/hooks/useData'
import { useUIStore } from '@/presentation/store/uiStore'

export function Layout() {
  const { data: plans = [] } = usePlans()
  const { activePlanId, setActivePlanId } = useUIStore()

  // Auto-select first plan once — done here (not in pages) to avoid
  // "setState during render" issues from Zustand + React 18 Strict Mode
  useEffect(() => {
    if (!activePlanId && plans.length > 0) {
      setActivePlanId(plans[0].id)
    }
  }, [activePlanId, plans, setActivePlanId])

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top search bar */}
        <div className="flex items-center justify-end px-4 py-2 bg-white border-b border-gray-100 shrink-0">
          <GlobalSearch />
        </div>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

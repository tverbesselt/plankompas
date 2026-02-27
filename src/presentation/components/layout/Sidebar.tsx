import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  FolderOpen,
  BarChart3,
  FileUp,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import clsx from 'clsx'
import { useUIStore } from '@/presentation/store/uiStore'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/plannen', icon: FolderOpen, label: 'Actieplannen' },
  { to: '/rapporten', icon: BarChart3, label: 'Rapporten' },
  { to: '/import-export', icon: FileUp, label: 'Import / Export' },
  { to: '/beheer', icon: Settings, label: 'Beheer' },
]

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useUIStore()

  return (
    <aside
      className={clsx(
        'flex flex-col bg-primary-900 text-white transition-all duration-200',
        sidebarOpen ? 'w-56' : 'w-16'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-center bg-white border-b border-primary-700 min-h-[64px] px-3 py-3">
        {sidebarOpen ? (
          <img
            src="https://www.cvoantwerpen.be/wp-content/uploads/2024/02/cvo-nieuw.png"
            alt="GO! CVO Antwerpen"
            className="h-10 w-auto object-contain"
          />
        ) : (
          <span className="text-xs font-black text-primary-600 leading-none tracking-tight">GO!</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors mx-2 rounded-lg',
                isActive
                  ? 'bg-primary-700 text-white'
                  : 'text-primary-200 hover:bg-primary-800 hover:text-white'
              )
            }
          >
            <Icon size={18} className="shrink-0" />
            {sidebarOpen && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="flex items-center justify-center py-3 border-t border-primary-700 text-primary-300 hover:text-white"
      >
        {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
      </button>
    </aside>
  )
}

import { User, Bell } from 'lucide-react'
import { useAuthStore } from '@/presentation/store/uiStore'
import { ROLE_LABELS } from '@/domain/types'

interface Props {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function Header({ title, subtitle, actions }: Props) {
  const { currentUserName, currentUserRole } = useAuthStore()

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b bg-white min-h-[56px]">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {actions}
        <button className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
          <Bell size={18} />
        </button>
        <div className="flex items-center gap-2 pl-3 border-l">
          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center">
            <User size={16} className="text-white" />
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-900 leading-tight">{currentUserName}</p>
            <p className="text-xs text-gray-500">{ROLE_LABELS[currentUserRole]}</p>
          </div>
        </div>
      </div>
    </header>
  )
}

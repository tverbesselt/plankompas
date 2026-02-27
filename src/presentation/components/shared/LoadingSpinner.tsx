import clsx from 'clsx'
import type { LucideIcon } from 'lucide-react'

interface Props {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  label?: string
}

export function LoadingSpinner({ size = 'md', className, label }: Props) {
  const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' }
  return (
    <div className={clsx('flex flex-col items-center justify-center gap-2', className)}>
      <div className={clsx('animate-spin rounded-full border-2 border-primary-200 border-t-primary-600', sizes[size])} />
      {label && <p className="text-sm text-gray-500">{label}</p>}
    </div>
  )
}

export function PageLoading() {
  return (
    <div className="flex h-full items-center justify-center py-20">
      <LoadingSpinner size="lg" label="Laden…" />
    </div>
  )
}

export function EmptyState({ title, description, icon: Icon }: { title: string; description?: string; icon?: LucideIcon }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {Icon && <Icon size={40} className="text-gray-300 mb-3" />}
      <h3 className="text-base font-medium text-gray-700">{title}</h3>
      {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
    </div>
  )
}

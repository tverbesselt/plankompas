import { STATUS_LABELS, STATUS_COLORS } from '@/domain/types'
import type { ObjectiveStatus } from '@/domain/types'
import clsx from 'clsx'

interface Props {
  status: ObjectiveStatus
  size?: 'sm' | 'md'
}

export function StatusBadge({ status, size = 'md' }: Props) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full font-medium',
        STATUS_COLORS[status],
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}

interface SelectProps {
  value: ObjectiveStatus
  onChange: (v: ObjectiveStatus) => void
  className?: string
}

export function StatusSelect({ value, onChange, className }: SelectProps) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value as ObjectiveStatus)}
      className={clsx('rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500', className)}
    >
      {Object.entries(STATUS_LABELS).map(([k, label]) => (
        <option key={k} value={k}>{label}</option>
      ))}
    </select>
  )
}

import clsx from 'clsx'
import type { ReactNode } from 'react'

interface FieldProps {
  label: string
  required?: boolean
  error?: string
  hint?: string
  children: ReactNode
  className?: string
}

export function FormField({ label, required, error, hint, children, className }: FieldProps) {
  return (
    <div className={clsx('space-y-1', className)}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}
export function Input({ error, className, ...props }: InputProps) {
  return (
    <input
      className={clsx(
        'block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500',
        error ? 'border-red-400' : 'border-gray-300',
        className
      )}
      {...props}
    />
  )
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}
export function Textarea({ error, className, ...props }: TextareaProps) {
  return (
    <textarea
      className={clsx(
        'block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none',
        error ? 'border-red-400' : 'border-gray-300',
        className
      )}
      {...props}
    />
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
  options: { value: string; label: string }[]
  placeholder?: string
}
export function Select({ error, options, placeholder, className, ...props }: SelectProps) {
  return (
    <select
      className={clsx(
        'block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white',
        error ? 'border-red-400' : 'border-gray-300',
        className
      )}
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

// Multi-value text input (comma-separated → array)
interface TagsInputProps {
  value: string[]
  onChange: (v: string[]) => void
  placeholder?: string
  error?: boolean
}
export function TagsInput({ value, onChange, placeholder, error }: TagsInputProps) {
  const raw = value.join(', ')
  return (
    <input
      value={raw}
      onChange={e => onChange(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
      placeholder={placeholder ?? 'Gescheiden door komma'}
      className={clsx(
        'block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500',
        error ? 'border-red-400' : 'border-gray-300'
      )}
    />
  )
}

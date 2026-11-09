import type { ReactNode } from 'react'
import { InlineError } from './InlineError'

type FieldProps = {
  label?: string
  placeholder?: string
  type?: string
  rightIcon?: ReactNode
  className?: string
  textarea?: boolean
  rows?: number
  value?: string
  onChange?: (value: string) => void
  error?: string
  inputMode?: 'text' | 'numeric' | 'decimal' | 'email'
  autoComplete?: string
}

const baseInput =
  'w-full rounded-2xl border bg-transparent px-4 text-[15px] font-medium text-ink outline-none placeholder:text-slate-400 focus:border-brand'

export function Field({
  label,
  placeholder,
  type = 'text',
  rightIcon,
  className = '',
  textarea = false,
  rows = 4,
  value,
  onChange,
  error,
  inputMode,
  autoComplete,
}: FieldProps) {
  const borderClass = error ? 'border-red-400' : 'border-[#d8e1ea]'

  return (
    <label className={`block ${className}`}>
      {label && <span className="mb-2 block text-[16px] font-bold text-ink">{label}</span>}
      <span className="relative block">
        {textarea ? (
          <textarea
            placeholder={placeholder}
            rows={rows}
            value={value}
            onChange={(event) => onChange?.(event.target.value)}
            className={`min-h-[120px] resize-none py-3 ${baseInput} ${borderClass}`}
          />
        ) : (
          <input
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={(event) => onChange?.(event.target.value)}
            inputMode={inputMode}
            autoComplete={autoComplete}
            className={`h-[52px] ${baseInput} ${borderClass}`}
          />
        )}
        {rightIcon && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">{rightIcon}</span>
        )}
      </span>
      {error && <InlineError>{error}</InlineError>}
    </label>
  )
}

type SelectFieldProps = {
  label: string
  options: string[]
  defaultValue?: string
  value?: string
  onChange?: (value: string) => void
  error?: string
  className?: string
}

export function SelectField({
  label,
  options,
  defaultValue,
  value,
  onChange,
  error,
  className = '',
}: SelectFieldProps) {
  const borderClass = error ? 'border-red-400' : 'border-[#d8e1ea]'

  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-[16px] font-bold text-ink">{label}</span>
      <select
        defaultValue={defaultValue}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        className={`h-[52px] w-full appearance-none rounded-2xl border bg-transparent px-4 text-[15px] font-medium text-ink outline-none focus:border-brand ${borderClass}`}
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
      {error && <InlineError>{error}</InlineError>}
    </label>
  )
}

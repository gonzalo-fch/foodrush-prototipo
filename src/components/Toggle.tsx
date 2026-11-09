import { useState } from 'react'

type ToggleProps = {
  defaultOn?: boolean
  checked?: boolean
  onChange?: (checked: boolean) => void
  label?: string
}

export function Toggle({ defaultOn = true, checked, onChange, label }: ToggleProps) {
  const [internal, setInternal] = useState(defaultOn)
  const isControlled = checked !== undefined
  const on = isControlled ? checked : internal

  function toggle() {
    const next = !on
    if (!isControlled) setInternal(next)
    onChange?.(next)
  }

  return (
    <label className="flex items-center gap-3">
      {label && <span className="text-[15px] font-semibold text-ink">{label}</span>}
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={toggle}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
          on ? 'bg-brand-strong' : 'bg-slate-300'
        }`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${
            on ? 'translate-x-[22px]' : 'translate-x-0.5'
          }`}
        />
      </button>
    </label>
  )
}

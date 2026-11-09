import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type ButtonProps = {
  children: ReactNode
  to?: string
  onClick?: () => void
  className?: string
  type?: 'button' | 'submit'
  disabled?: boolean
}

const primaryClass =
  'flex h-[52px] w-full items-center justify-center rounded-2xl bg-brand-strong px-5 text-[17px] font-extrabold text-white shadow-sm transition active:scale-[0.99] disabled:opacity-50'

const outlineClass =
  'flex h-[52px] w-full items-center justify-center rounded-2xl border-2 border-brand bg-transparent px-5 text-[17px] font-extrabold text-brand transition active:scale-[0.99]'

export function PrimaryButton({
  children,
  to,
  onClick,
  className = '',
  type = 'button',
  disabled = false,
}: ButtonProps) {
  if (to) {
    return (
      <Link to={to} className={`${primaryClass} ${className}`}>
        {children}
      </Link>
    )
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${primaryClass} ${className}`}
    >
      {children}
    </button>
  )
}

export function OutlineButton({ children, to, onClick, className = '', type = 'button' }: ButtonProps) {
  if (to) {
    return (
      <Link to={to} className={`${outlineClass} ${className}`}>
        {children}
      </Link>
    )
  }

  return (
    <button type={type} onClick={onClick} className={`${outlineClass} ${className}`}>
      {children}
    </button>
  )
}

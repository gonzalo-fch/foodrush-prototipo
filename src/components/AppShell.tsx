import type { ReactNode } from 'react'

type AppShellProps = {
  children: ReactNode
  className?: string
}

export function AppShell({ children, className = '' }: AppShellProps) {
  return (
    <div className="min-h-dvh bg-[#e8edf1]">
      <div
        className={`relative mx-auto min-h-dvh w-full max-w-[430px] bg-page shadow-[0_0_60px_rgba(15,23,42,0.12)] ${className}`}
      >
        {children}
      </div>
    </div>
  )
}

import { AlertCircle } from 'lucide-react'
import type { ReactNode } from 'react'

export function InlineError({ children }: { children: ReactNode }) {
  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-red-500">
      <AlertCircle size={14} className="shrink-0" />
      {children}
    </p>
  )
}

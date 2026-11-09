import { X } from 'lucide-react'
import type { ReactNode } from 'react'

type ModalProps = {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

export function Modal({ open, title, onClose, children }: ModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/40 px-5">
      <div className="max-h-[85dvh] w-full max-w-[360px] overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[19px] font-extrabold text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500"
          >
            <X size={18} />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
}

import type { ReactNode } from 'react'

type ConfirmDialogProps = {
  open: boolean
  title: string
  message: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'primary'
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'danger',
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/40 px-5">
      <div className="w-full max-w-[330px] rounded-2xl bg-white p-5 shadow-2xl">
        <h2 className="text-[19px] font-extrabold text-ink">{title}</h2>
        <div className="mt-2 text-[14px] font-medium leading-relaxed text-slate-500">{message}</div>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-11 flex-1 rounded-xl bg-slate-100 text-[15px] font-bold text-slate-600"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`h-11 flex-1 rounded-xl text-[15px] font-bold text-white ${
              tone === 'danger' ? 'bg-red-500' : 'bg-brand-strong'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

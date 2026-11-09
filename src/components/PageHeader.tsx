import { ArrowLeft, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

type PageHeaderProps = {
  title?: string
  backTo?: string
  close?: boolean
  right?: ReactNode
  bordered?: boolean
}

export function PageHeader({ title, backTo, close = false, right, bordered = true }: PageHeaderProps) {
  const navigate = useNavigate()

  function goBack() {
    if (backTo) {
      navigate(backTo)
    } else {
      navigate(-1)
    }
  }

  return (
    <header
      className={`flex h-14 items-center gap-2 px-4 ${
        bordered ? 'border-b border-slate-200/70' : ''
      }`}
    >
      <button
        type="button"
        onClick={goBack}
        aria-label={close ? 'Cerrar' : 'Volver'}
        className="-ml-1 flex h-9 w-9 items-center justify-center rounded-full text-ink"
      >
        {close ? <X size={24} strokeWidth={2} /> : <ArrowLeft size={24} strokeWidth={2} />}
      </button>
      <h1 className="flex-1 truncate text-center text-[19px] font-extrabold text-ink">{title}</h1>
      <div className="flex h-9 w-9 items-center justify-end">{right}</div>
    </header>
  )
}

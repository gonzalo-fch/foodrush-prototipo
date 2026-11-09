import { AlertCircle, CheckCircle2, Info } from 'lucide-react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

type ToastTone = 'success' | 'error' | 'info'

type Toast = {
  id: number
  message: string
  tone: ToastTone
}

type ToastContextValue = {
  showToast: (message: string, tone?: ToastTone) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
}

const tones = {
  success: 'text-green-600',
  error: 'text-red-500',
  info: 'text-brand',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null)

  const showToast = useCallback((message: string, tone: ToastTone = 'success') => {
    setToast({ id: Date.now(), message, tone })
  }, [])

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(null), 2800)
    return () => window.clearTimeout(timeout)
  }, [toast])

  const Icon = toast ? icons[toast.tone] : null

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && Icon && (
        <div className="pointer-events-none fixed bottom-[96px] left-1/2 z-[70] w-[calc(100%-2rem)] max-w-[398px] -translate-x-1/2">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl">
            <Icon size={22} className={tones[toast.tone]} />
            <p className="text-[14px] font-bold text-ink">{toast.message}</p>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast debe usarse dentro de ToastProvider')
  }
  return context
}

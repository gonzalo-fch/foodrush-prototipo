import { Lock, SearchX } from 'lucide-react'
import { AppShell } from '../components/AppShell'
import { PrimaryButton } from '../components/Buttons'
import { PageHeader } from '../components/PageHeader'

type ErrorStatePageProps = {
  title?: string
  message?: string
  icon?: 'lock' | 'search'
  backTo?: string
  actionLabel?: string
}

export function ErrorStatePage({
  title = 'Acceso denegado',
  message = 'No tienes permisos para acceder a este recurso o la información solicitada no existe.',
  icon = 'lock',
  backTo = '/comercio/inicio',
  actionLabel = 'Volver al inicio',
}: ErrorStatePageProps) {
  const Icon = icon === 'lock' ? Lock : SearchX

  return (
    <AppShell>
      <PageHeader backTo={backTo} bordered={false} />
      <main className="flex flex-col items-center px-8 pt-16 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-red-50 text-red-500">
          <Icon size={44} strokeWidth={1.8} />
        </div>
        <h1 className="mt-6 text-[26px] font-extrabold text-ink">{title}</h1>
        <p className="mt-2 text-[15px] font-medium leading-relaxed text-slate-500">{message}</p>
        <PrimaryButton to={backTo} className="mt-8">
          {actionLabel}
        </PrimaryButton>
      </main>
    </AppShell>
  )
}

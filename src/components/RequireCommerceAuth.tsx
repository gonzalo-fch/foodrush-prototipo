import { Navigate, Outlet } from 'react-router-dom'
import { useCommerceStore } from '../store/CommerceStore'

export function RequireCommerceAuth() {
  const { currentUser, loading } = useCommerceStore()

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#e8edf1]">
        <p className="text-[14px] font-bold text-slate-500">Cargando panel...</p>
      </div>
    )
  }

  if (!currentUser) {
    return <Navigate to="/comercio/login" replace />
  }

  return <Outlet />
}

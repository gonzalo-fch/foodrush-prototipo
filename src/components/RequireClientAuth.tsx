import { Navigate, Outlet } from 'react-router-dom'
import { useClientStore } from '../store/ClientStore'

export function RequireClientAuth() {
  const { currentUser } = useClientStore()

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

import { Navigate, Outlet } from 'react-router-dom'
import { useCommerceStore } from '../store/CommerceStore'

export function RequireCommerceAuth() {
  const { currentUser } = useCommerceStore()

  if (!currentUser) {
    return <Navigate to="/comercio/login" replace />
  }

  return <Outlet />
}

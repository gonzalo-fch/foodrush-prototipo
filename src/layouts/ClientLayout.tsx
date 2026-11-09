import { Outlet } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { BottomNav } from '../components/BottomNav'

export function ClientLayout() {
  return (
    <AppShell>
      <div className="pb-24">
        <Outlet />
      </div>
      <BottomNav />
    </AppShell>
  )
}

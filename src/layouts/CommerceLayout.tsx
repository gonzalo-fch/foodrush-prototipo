import { Outlet } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { CommerceBottomNav } from '../components/CommerceBottomNav'

export function CommerceLayout() {
  return (
    <AppShell>
      <div className="pb-24">
        <Outlet />
      </div>
      <CommerceBottomNav />
    </AppShell>
  )
}

import { Outlet } from 'react-router-dom'
import { CommerceBottomNav } from '../components/CommerceBottomNav'
import { CommerceSidebar } from '../components/CommerceSidebar'

export function CommerceLayout() {
  return (
    <div className="min-h-dvh bg-[#e8edf1]">
      <div className="mx-auto flex min-h-dvh w-full max-w-[430px] bg-page shadow-[0_0_60px_rgba(15,23,42,0.12)] lg:max-w-none lg:bg-transparent lg:shadow-none">
        <CommerceSidebar />
        <div className="min-h-dvh w-full bg-page lg:flex-1">
          <div className="mx-auto min-h-dvh w-full max-w-[430px] pb-24 lg:max-w-[1280px] lg:px-8 lg:pt-8 lg:pb-8">
            <Outlet />
          </div>
        </div>
        <CommerceBottomNav />
      </div>
    </div>
  )
}

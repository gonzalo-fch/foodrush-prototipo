import { Grid2x2, House, ReceiptText, Settings, UtensilsCrossed } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useAppStore } from '../store/AppStore'
import { useCommerceStore } from '../store/CommerceStore'

const items = [
  { id: 'dashboard', label: 'Dashboard', icon: Grid2x2, to: '/comercio/dashboard' },
  { id: 'ventas', label: 'Ventas', icon: ReceiptText, to: '/comercio/ventas' },
  { id: 'inicio', label: 'Inicio', icon: House, to: '/comercio/inicio' },
  { id: 'productos', label: 'Productos', icon: UtensilsCrossed, to: '/comercio/productos' },
  { id: 'ajustes', label: 'Ajustes', icon: Settings, to: '/comercio/ajustes' },
]

export function CommerceBottomNav() {
  const { pathname } = useLocation()
  const { orders } = useAppStore()
  const { storeId } = useCommerceStore()
  const pendingOrders = orders.filter(
    (order) => order.storeId === storeId && order.status === 'pendiente',
  ).length

  return (
    <nav className="fixed bottom-0 left-1/2 z-30 w-full max-w-[430px] -translate-x-1/2 border-t border-black/5 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
      <div className="flex h-[74px] items-start justify-around px-2 pt-2.5">
        {items.map((item) => {
          const Icon = item.icon
          const isActive =
            pathname === item.to ||
            (item.id === 'ventas' && pathname.startsWith('/comercio/pedidos')) ||
            (item.id === 'productos' && pathname.startsWith('/comercio/inventario'))

          return (
            <Link
              key={item.id}
              to={item.to}
              className={`relative flex w-16 flex-col items-center gap-1 transition-colors ${
                isActive ? 'text-brand-strong' : 'text-slate-500'
              }`}
            >
              <span className="relative">
                <Icon size={22} strokeWidth={isActive ? 2.3 : 1.9} />
                {item.id === 'ventas' && pendingOrders > 0 && (
                  <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-strong px-1 text-[9px] font-extrabold leading-none text-white">
                    {pendingOrders}
                  </span>
                )}
              </span>
              <span className={`text-[10.5px] leading-none ${isActive ? 'font-extrabold' : 'font-semibold'}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

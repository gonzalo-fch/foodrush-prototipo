import {
  ClipboardList,
  Grid2x2,
  History,
  House,
  QrCode,
  ReceiptText,
  Settings,
  UtensilsCrossed,
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useAppStore } from '../store/AppStore'
import { useCommerceStore } from '../store/CommerceStore'

const items = [
  { id: 'inicio', label: 'Inicio', icon: House, to: '/comercio/inicio' },
  { id: 'dashboard', label: 'Dashboard', icon: Grid2x2, to: '/comercio/dashboard' },
  { id: 'ventas', label: 'Ventas', icon: ReceiptText, to: '/comercio/ventas' },
  {
    id: 'pedidos',
    label: 'Pedidos',
    icon: ClipboardList,
    to: '/comercio/pedidos',
    badge: true,
  },
  {
    id: 'productos',
    label: 'Productos',
    icon: UtensilsCrossed,
    to: '/comercio/productos',
  },
  {
    id: 'inventario',
    label: 'Inventario',
    icon: History,
    to: '/comercio/inventario',
  },
  { id: 'ajustes', label: 'Ajustes', icon: Settings, to: '/comercio/ajustes' },
]

function isItemActive(pathname: string, item: (typeof items)[number]) {
  if (item.id === 'productos') return pathname.startsWith('/comercio/productos')
  if (item.id === 'pedidos') return pathname.startsWith('/comercio/pedidos')
  if (item.id === 'inventario') return pathname.startsWith('/comercio/inventario')
  return pathname === item.to
}

export function CommerceSidebar() {
  const { pathname } = useLocation()
  const { orders } = useAppStore()
  const { storeId, businessName, open } = useCommerceStore()

  const pendingOrders = orders.filter(
    (order) => order.storeId === storeId && order.status === 'pendiente',
  ).length

  return (
    <aside className="sticky top-0 hidden h-dvh w-[272px] shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
      <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-5">
        <img
          src="/commerce/logo-orange.png"
          alt={businessName}
          className="h-11 w-11 shrink-0 rounded-xl object-cover"
        />
        <div className="min-w-0">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
            FoodRush
          </p>
          <p className="truncate text-[16px] font-extrabold text-ink">
            {businessName || 'Panel comercio'}
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-5">
        {items.map((item) => {
          const Icon = item.icon
          const active = isItemActive(pathname, item)

          return (
            <Link
              key={item.id}
              to={item.to}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-bold transition ${
                active
                  ? 'bg-[#dbe7f3] text-brand-strong'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon size={21} strokeWidth={active ? 2.3 : 1.9} />
              <span className="flex-1">{item.label}</span>
              {item.badge && pendingOrders > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-strong px-1.5 text-[10px] font-extrabold text-white">
                  {pendingOrders}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-slate-200 p-4">
        <div className="flex items-center justify-between px-1">
          <span className="text-[13px] font-medium text-slate-500">Estado</span>
          <span
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-bold ${
              open ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                open ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            {open ? 'Abierto' : 'Cerrado'}
          </span>
        </div>

        <Link
          to="/comercio/escanear"
          className="mt-3 flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-strong text-[14px] font-bold text-white shadow-sm"
        >
          <QrCode size={18} />
          Escanear QR
        </Link>
      </div>
    </aside>
  )
}

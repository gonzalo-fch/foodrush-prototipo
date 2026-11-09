import { Bell, Heart, House, ReceiptText, UserRound } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

const items = [
  { id: 'compras', label: 'Compras', icon: ReceiptText, to: '/mis-compras' },
  { id: 'favoritos', label: 'Favoritos', icon: Heart, to: '/favoritos' },
  { id: 'inicio', label: 'Inicio', icon: House, to: '/catalogo' },
  { id: 'avisos', label: 'Avisos', icon: Bell, to: '/notificaciones' },
  { id: 'perfil', label: 'Perfil', icon: UserRound, to: '/perfil' },
]

export function BottomNav() {
  const { pathname } = useLocation()

  return (
    <nav className="fixed bottom-0 left-1/2 z-30 w-full max-w-[430px] -translate-x-1/2 border-t border-black/5 bg-white pb-[env(safe-area-inset-bottom)]">
      <div className="flex h-[74px] items-start justify-around px-2 pt-2.5">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.to

          return (
            <Link
              key={item.id}
              to={item.to}
              className={`flex w-16 flex-col items-center gap-1 transition-colors ${
                isActive ? 'text-brand' : 'text-muted'
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.2 : 1.9} />
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

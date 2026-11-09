import { PackagePlus, ShoppingBag, SlidersHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '../../components/AppShell'
import { PageHeader } from '../../components/PageHeader'
import { useAppStore } from '../../store/AppStore'
import { useCommerceStore } from '../../store/CommerceStore'
import type { InventoryMovement, MovementType } from '../../types'

const filters: Array<{ id: 'todos' | MovementType; label: string }> = [
  { id: 'todos', label: 'Todos' },
  { id: 'venta', label: 'Ventas' },
  { id: 'ajuste', label: 'Ajustes' },
  { id: 'reposicion', label: 'Reposiciones' },
]

const typeMeta: Record<
  MovementType,
  { label: string; badge: string; icon: typeof ShoppingBag; iconBg: string; iconColor: string }
> = {
  venta: {
    label: 'Venta',
    badge: 'bg-blue-100 text-brand',
    icon: ShoppingBag,
    iconBg: 'bg-[#dbe7f3]',
    iconColor: 'text-brand-strong',
  },
  ajuste: {
    label: 'Ajuste',
    badge: 'bg-amber-100 text-amber-600',
    icon: SlidersHorizontal,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-500',
  },
  reposicion: {
    label: 'Reposición',
    badge: 'bg-green-100 text-green-600',
    icon: PackagePlus,
    iconBg: 'bg-green-50',
    iconColor: 'text-green-600',
  },
}

export function InventoryMovementsPage() {
  const { movements } = useAppStore()
  const { storeId } = useCommerceStore()
  const [filter, setFilter] = useState<'todos' | MovementType>('todos')

  const storeMovements = useMemo(
    () => movements.filter((movement) => movement.storeId === storeId),
    [movements, storeId],
  )

  const filtered = useMemo(
    () =>
      filter === 'todos'
        ? storeMovements
        : storeMovements.filter((item) => item.type === filter),
    [filter, storeMovements],
  )

  return (
    <AppShell>
      <PageHeader title="Movimientos de Inventario" backTo="/comercio/productos" />

      <main className="px-4 pt-4">
        <div className="rounded-xl bg-[#dbe7f3] px-4 py-3 text-[14px] font-medium leading-snug text-slate-600">
          Cada venta descuenta stock y queda ligada al pedido que la originó.
        </div>

        <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto">
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`h-9 shrink-0 rounded-full px-4 text-[13px] font-bold ${
                filter === item.id ? 'bg-brand text-white' : 'bg-[#e4ebf3] text-slate-600'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {filtered.map((movement) => (
            <MovementCard key={movement.id} movement={movement} />
          ))}

          {filtered.length === 0 && (
            <div className="rounded-2xl bg-white/60 px-6 py-8 text-center">
              <p className="text-[15px] font-bold text-ink">No hay movimientos</p>
              <p className="mt-1 text-[13px] font-medium text-slate-500">
                Prueba con otro filtro.
              </p>
            </div>
          )}
        </div>
      </main>
    </AppShell>
  )
}

function MovementCard({ movement }: { movement: InventoryMovement }) {
  const meta = typeMeta[movement.type]
  const Icon = meta.icon
  const positive = movement.quantity > 0

  return (
    <article className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex gap-3">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${meta.iconBg} ${meta.iconColor}`}
        >
          <Icon size={24} strokeWidth={1.9} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h2 className="truncate text-[16px] font-bold text-ink">{movement.productName}</h2>
            <span
              className={`shrink-0 text-[16px] font-extrabold ${
                positive ? 'text-green-600' : 'text-red-500'
              }`}
            >
              {positive ? '+' : ''}
              {movement.quantity}
            </span>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${meta.badge}`}>
              {meta.label}
            </span>
            {movement.orderId && (
              <Link
                to={`/comercio/pedidos/${movement.orderId}`}
                className="text-[12px] font-bold text-brand"
              >
                Pedido #{movement.orderId}
              </Link>
            )}
          </div>

          <p className="mt-1.5 text-[13px] font-medium text-slate-500">{movement.note}</p>
          <p className="mt-0.5 text-[12px] font-medium text-slate-400">{movement.date}</p>
        </div>
      </div>
    </article>
  )
}

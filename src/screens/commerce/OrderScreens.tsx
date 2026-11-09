import {
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  ReceiptText,
  ShoppingBag,
  Store,
  XCircle,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../../components/AppShell'
import { PrimaryButton } from '../../components/Buttons'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { PageHeader } from '../../components/PageHeader'
import { useToast } from '../../components/ToastProvider'
import { formatCLP } from '../../lib/format'
import { useAppStore } from '../../store/AppStore'
import { useCommerceStore } from '../../store/CommerceStore'
import type { Order, OrderStatus } from '../../types'
import { ErrorStatePage } from '../ErrorStatePage'

const saleFilters: Array<{ id: 'todas' | 'nuevas' | 'alertas'; label: string }> = [
  { id: 'todas', label: 'Todas' },
  { id: 'nuevas', label: 'Nuevas Ventas' },
  { id: 'alertas', label: 'Alertas' },
]

function relativeTime(iso?: string) {
  if (!iso) return ''
  const date = new Date(iso)
  const now = new Date()
  const minutes = Math.max(1, Math.floor((now.getTime() - date.getTime()) / 60000))

  if (minutes < 60) return `Hace ${minutes} min`
  const sameDay = date.toDateString() === now.toDateString()
  const hours = Math.floor(minutes / 60)
  if (sameDay) return `Hace ${hours} h`

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) {
    return `Ayer a las ${date.toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit',
    })}`
  }

  return date.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
}

export function SalesPage() {
  const { orders } = useAppStore()
  const { storeId } = useCommerceStore()
  const [filter, setFilter] = useState<'todas' | 'nuevas' | 'alertas'>('todas')

  const filtered = useMemo(() => {
    const sorted = orders
      .filter((order) => order.storeId === storeId)
      .sort(
      (a, b) =>
        new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime(),
    )

    if (filter === 'nuevas') return sorted.filter((order) => order.status === 'pendiente')
    if (filter === 'alertas') return sorted.filter((order) => order.status === 'cancelado')
    return sorted
  }, [filter, orders, storeId])

  return (
    <div>
      <PageHeader title="Ventas" backTo="/comercio/inicio" bordered={false} />

      <div className="flex border-b border-slate-200 px-4">
        {saleFilters.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`relative flex-1 py-3 text-[17px] font-bold ${
              filter === tab.id ? 'text-ink' : 'text-slate-500'
            }`}
          >
            {tab.label}
            {filter === tab.id && (
              <span className="absolute inset-x-0 -bottom-px mx-auto h-[3px] w-20 bg-brand-strong" />
            )}
          </button>
        ))}
      </div>

      <main>
        {filtered.map((order, index) => (
          <SaleRow
            key={order.id}
            order={order}
            highlighted={index === 0 && order.status === 'pendiente'}
          />
        ))}

        {filtered.length === 0 && (
          <div className="px-4 py-8">
            <div className="rounded-2xl bg-white/60 px-6 py-8 text-center">
              <p className="text-[15px] font-bold text-ink">No hay movimientos en esta categoría</p>
              <p className="mt-1 text-[13px] font-medium text-slate-500">
                Las ventas aparecerán aquí cuando los clientes compren.
              </p>
            </div>
          </div>
        )}
      </main>

      <div className="px-4 pt-5">
        <Link
          to="/comercio/pedidos"
          className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#dbe7f3] text-[16px] font-bold text-brand-strong"
        >
          <ReceiptText size={20} />
          Ver listado de pedidos
        </Link>
      </div>
    </div>
  )
}

function SaleRow({ order, highlighted }: { order: Order; highlighted: boolean }) {
  const Icon =
    order.status === 'pendiente'
      ? ShoppingBag
      : order.status === 'retirado'
        ? CheckCircle2
        : XCircle

  const title =
    order.status === 'pendiente'
      ? 'Nueva Venta'
      : order.status === 'retirado'
        ? `Pedido #${order.id} Cerrado`
        : `Pedido #${order.id} Cancelado`

  const body =
    order.status === 'pendiente'
      ? `Total: ${formatCLP(order.total)}\nVenta de ${order.customer}. Pedido #${order.id}.`
      : order.status === 'retirado'
        ? `El pedido de ${order.customer} ha sido completado.`
        : 'El cliente ha cancelado el pedido.'

  return (
    <Link
      to={`/comercio/pedidos/${order.id}`}
      className={`flex gap-3 border-b border-slate-200 px-4 py-4 ${
        highlighted ? 'bg-[#dbe7f3]' : 'bg-page'
      }`}
    >
      <span className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-xl bg-[#b9d3ee] text-brand-strong">
        <Icon size={28} strokeWidth={1.8} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-[18px] font-bold leading-tight text-ink">{title}</h2>
          <span className="shrink-0 text-[14px] font-medium text-brand">
            {relativeTime(order.createdAt)}
          </span>
        </div>
        <p className="mt-0.5 whitespace-pre-line text-[15px] font-medium leading-snug text-slate-500">
          {body}
        </p>
        {highlighted && (
          <span className="ml-auto mt-1 block h-2.5 w-2.5 rounded-full bg-brand-strong" />
        )}
      </div>
    </Link>
  )
}

const statusMeta: Record<
  OrderStatus,
  { label: string; pill: string; dot: string; banner: string; icon: typeof CheckCircle2 }
> = {
  pendiente: {
    label: 'Retiro Pendiente',
    pill: 'bg-green-100 text-green-600',
    dot: 'bg-green-500',
    banner: 'bg-green-50 text-green-600',
    icon: CheckCircle2,
  },
  retirado: {
    label: 'Retirado',
    pill: 'bg-slate-200 text-brand-strong',
    dot: 'bg-brand-strong',
    banner: 'bg-slate-100 text-brand-strong',
    icon: CheckCircle2,
  },
  cancelado: {
    label: 'Cancelado',
    pill: 'bg-red-100 text-red-600',
    dot: 'bg-red-500',
    banner: 'bg-red-50 text-red-500',
    icon: XCircle,
  },
}

const orderFilters: Array<{ id: 'todos' | OrderStatus; label: string }> = [
  { id: 'todos', label: 'Todos' },
  { id: 'pendiente', label: 'Pendientes' },
  { id: 'retirado', label: 'Retirados' },
  { id: 'cancelado', label: 'Cancelados' },
]

export function OrdersPage() {
  const { orders } = useAppStore()
  const { storeId } = useCommerceStore()
  const [filter, setFilter] = useState<'todos' | OrderStatus>('todos')

  const storeOrders = useMemo(
    () => orders.filter((order) => order.storeId === storeId),
    [orders, storeId],
  )

  const filtered = useMemo(
    () =>
      filter === 'todos'
        ? storeOrders
        : storeOrders.filter((order) => order.status === filter),
    [filter, storeOrders],
  )

  return (
    <div>
      <PageHeader title="Pedidos" backTo="/comercio/inicio" bordered={false} />

      <div className="no-scrollbar flex gap-1 overflow-x-auto border-b border-slate-200 px-4">
        {orderFilters.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={`relative shrink-0 px-3 py-3 text-[15px] font-bold ${
              filter === item.id ? 'text-ink' : 'text-slate-500'
            }`}
          >
            {item.label}
            {filter === item.id && (
              <span className="absolute inset-x-2 -bottom-px h-[3px] rounded-full bg-brand-strong" />
            )}
          </button>
        ))}
      </div>

      <main className="space-y-3 px-4 pt-4">
        {filtered.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}

        {filtered.length === 0 && (
          <div className="rounded-2xl bg-white/60 px-6 py-8 text-center">
            <p className="text-[15px] font-bold text-ink">No hay pedidos en este estado</p>
            <p className="mt-1 text-[13px] font-medium text-slate-500">
              Los pedidos aparecerán aquí cuando los clientes compren.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

function OrderCard({ order }: { order: Order }) {
  const meta = statusMeta[order.status]
  const units = order.items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <Link
      to={`/comercio/pedidos/${order.id}`}
      className="block rounded-2xl bg-white p-4 shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="truncate text-[18px] font-bold text-ink">{order.customer}</h2>
          <p className="text-[13px] font-medium text-slate-500">Pedido #{order.id}</p>
          <p className="text-[13px] font-medium text-slate-500">{order.date}</p>
        </div>
        <span
          className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${meta.pill}`}
        >
          <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
          {meta.label}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="text-[13px] font-medium text-slate-500">
          {units} {units === 1 ? 'producto' : 'productos'}
        </span>
        <span className="flex items-center gap-1 text-[17px] font-extrabold text-ink">
          {formatCLP(order.total)}
          <ChevronRight size={19} className="text-slate-400" />
        </span>
      </div>
    </Link>
  )
}

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { orders, completeOrder, cancelOrder } = useAppStore()
  const { storeId } = useCommerceStore()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [confirmCancel, setConfirmCancel] = useState(false)

  const order = orders.find((item) => item.id === id && item.storeId === storeId)

  if (!order) {
    return (
      <ErrorStatePage
        title="Pedido no encontrado"
        message="El pedido no existe o no tienes acceso a la información de otro establecimiento."
        icon="search"
        backTo="/comercio/pedidos"
        actionLabel="Volver a pedidos"
      />
    )
  }

  const meta = statusMeta[order.status]
  const StatusIcon = meta.icon

  return (
    <AppShell>
      <PageHeader title={`Pedido #${order.id}`} backTo="/comercio/pedidos" bordered={false} />

      <main className="px-4 pb-10 pt-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-[20px] font-extrabold text-ink">{order.customer}</h1>
            <span
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${meta.pill}`}
            >
              <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
              {meta.label}
            </span>
          </div>

          <div className="mt-3 space-y-1.5 text-[14px] font-medium text-slate-500">
            <p className="flex items-center gap-2">
              <CalendarDays size={17} />
              {order.date}
            </p>
            <p className="flex items-center gap-2">
              <CreditCard size={17} />
              {order.paymentMethod}
            </p>
            <p className="flex items-center gap-2">
              <Store size={17} />
              {order.store}
            </p>
          </div>
        </div>

        <h2 className="mt-6 text-[20px] font-extrabold text-ink">Productos</h2>

        <div className="mt-3 space-y-3">
          {order.items.map((item) => (
            <div
              key={item.productId}
              className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm"
            >
              <img
                src={item.image}
                alt={item.name}
                className="h-16 w-16 shrink-0 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[16px] font-bold text-ink">{item.name}</p>
                <p className="text-[14px] font-medium text-slate-500">{formatCLP(item.price)}</p>
              </div>
              <span className="shrink-0 text-[15px] font-bold text-ink">x{item.quantity}</span>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[21px] font-extrabold text-ink">Total</span>
            <span className="text-[21px] font-extrabold text-ink">{formatCLP(order.total)}</span>
          </div>
          <div className="my-4 border-t border-slate-200" />
          <div className="flex items-center justify-center gap-2 rounded-xl bg-green-100 py-3 text-[15px] font-bold text-green-600">
            <BadgeCheck size={22} />
            Pagado con {order.paymentMethod}
          </div>
        </div>

        {order.status === 'pendiente' ? (
          <div className="mt-5 space-y-3">
            <PrimaryButton
              onClick={() => {
                completeOrder(order.id)
                showToast('Pedido marcado como entregado')
                navigate('/comercio/pedidos')
              }}
            >
              Marcar como entregado
            </PrimaryButton>
            <button
              type="button"
              onClick={() => setConfirmCancel(true)}
              className="flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-red-50 text-[16px] font-bold text-red-500"
            >
              <XCircle size={20} />
              Cancelar pedido
            </button>
          </div>
        ) : (
          <div
            className={`mt-5 flex items-center justify-center gap-2 rounded-xl py-4 text-[16px] font-bold ${meta.banner}`}
          >
            <StatusIcon size={22} />
            {order.status === 'retirado' ? 'Pedido entregado al cliente' : 'Pedido cancelado'}
          </div>
        )}
      </main>

      <ConfirmDialog
        open={confirmCancel}
        title="Cancelar pedido"
        message={
          <>
            Se cancelará el pedido <strong className="text-ink">#{order.id}</strong> y se repondrá el
            stock de sus productos. Esta acción no se puede deshacer.
          </>
        }
        confirmLabel="Cancelar pedido"
        cancelLabel="Volver"
        onClose={() => setConfirmCancel(false)}
        onConfirm={() => {
          cancelOrder(order.id)
          showToast('Pedido cancelado y stock repuesto', 'info')
          setConfirmCancel(false)
          navigate('/comercio/pedidos')
        }}
      />
    </AppShell>
  )
}

export function QrScannerPage() {
  const { orders } = useAppStore()
  const { storeId } = useCommerceStore()
  const { showToast } = useToast()
  const navigate = useNavigate()

  function simulateScan() {
    const pending = orders.find(
      (order) => order.status === 'pendiente' && order.storeId === storeId,
    )
    if (!pending) {
      showToast('No hay pedidos pendientes para escanear', 'error')
      return
    }
    showToast(`Pedido #${pending.id} escaneado correctamente`)
    navigate(`/comercio/pedidos/${pending.id}`)
  }

  return (
    <AppShell>
      <PageHeader title="Escanear QR de Compra" backTo="/comercio/inicio" bordered={false} />

      <div className="relative">
        <button
          type="button"
          onClick={simulateScan}
          aria-label="Simular escaneo de QR"
          className="block w-full"
        >
          <img
            src="/commerce/qr-scan-bg.png"
            alt="Escanear QR de compra"
            className="h-[calc(100dvh-56px)] w-full object-cover"
          />
        </button>

        <button
          type="button"
          onClick={simulateScan}
          className="absolute bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/95 px-5 py-3 text-[14px] font-extrabold text-brand-strong shadow-lg"
        >
          Simular escaneo de pedido pendiente
        </button>
      </div>
    </AppShell>
  )
}

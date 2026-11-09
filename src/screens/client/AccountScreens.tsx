import {
  Bell,
  ChevronRight,
  Coffee,
  CreditCard,
  FileText,
  Globe,
  HelpCircle,
  Lock,
  LogOut,
  PlusCircle,
  QrCode,
  ShoppingBag,
  Store,
  Tag,
  UserRound,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppShell } from '../../components/AppShell'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { PageHeader } from '../../components/PageHeader'
import { Toggle } from '../../components/Toggle'
import { useToast } from '../../components/ToastProvider'
import { newNotifications, previousNotifications } from '../../data/mock'
import { formatCLP } from '../../lib/format'
import { useAppStore } from '../../store/AppStore'
import { useClientStore } from '../../store/ClientStore'
import type { Order, OrderStatus } from '../../types'

const statusMeta: Record<
  OrderStatus,
  { label: string; pill: string; dot: string }
> = {
  pendiente: {
    label: 'Retiro Pendiente',
    pill: 'bg-green-100 text-green-600',
    dot: 'bg-green-500',
  },
  retirado: {
    label: 'Retirado',
    pill: 'bg-slate-200 text-brand-strong',
    dot: 'bg-brand-strong',
  },
  cancelado: {
    label: 'Cancelado',
    pill: 'bg-red-100 text-red-600',
    dot: 'bg-red-500',
  },
}

export function PurchasesPage() {
  const { showToast } = useToast()
  const { currentUser } = useClientStore()
  const { orders, cancelOrder } = useAppStore()
  const [filter, setFilter] = useState<'todos' | 'retirado' | 'cancelado'>('todos')
  const [toCancel, setToCancel] = useState<Order | null>(null)

  const myOrders = orders.filter((order) => order.customerId === currentUser?.id)
  const filtered =
    filter === 'todos' ? myOrders : myOrders.filter((order) => order.status === filter)

  const tabs: Array<{ id: 'todos' | 'retirado' | 'cancelado'; label: string }> = [
    { id: 'todos', label: 'Todos' },
    { id: 'retirado', label: 'Retirados' },
    { id: 'cancelado', label: 'Cancelados' },
  ]

  return (
    <AppShell>
      <PageHeader title="Mis Compras" backTo="/catalogo" bordered={false} />

      <div className="flex border-b border-slate-200 px-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`relative flex-1 py-3 text-[18px] font-bold ${
              filter === tab.id ? 'text-ink' : 'text-slate-500'
            }`}
          >
            {tab.label}
            {filter === tab.id && (
              <span className="absolute inset-x-0 -bottom-px mx-auto h-[3px] w-16 bg-brand-strong" />
            )}
          </button>
        ))}
      </div>

      <main className="space-y-4 px-4 pt-5">
        {filtered.map((order) => {
          const meta = statusMeta[order.status]

          return (
            <article key={order.id} className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#d5e3f1] text-brand-strong">
                  <Store size={26} strokeWidth={1.8} />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="truncate text-[19px] font-bold text-ink">{order.store}</h2>
                    <span
                      className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-bold ${meta.pill}`}
                    >
                      <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                      {meta.label}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[15px] font-medium text-slate-500">
                    Orden #{order.id}
                  </p>
                  <p className="text-[15px] font-medium text-slate-500">{order.date}</p>
                  <p className="mt-0.5 text-[16px] font-semibold text-slate-600">
                    {formatCLP(order.total)}
                  </p>
                </div>
              </div>

              {order.status === 'pendiente' && (
                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setToCancel(order)}
                    className="h-12 flex-1 rounded-lg bg-red-100 text-[16px] font-bold text-red-500"
                  >
                    Cancelar
                  </button>
                  <Link
                    to={`/qr/${order.id}`}
                    className="flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-brand-strong text-[16px] font-bold text-white"
                  >
                    <QrCode size={19} />
                    Ver QR de retiro
                  </Link>
                </div>
              )}
            </article>
          )
        })}

        {filtered.length === 0 && (
          <div className="rounded-2xl bg-white/60 px-6 py-8 text-center">
            <p className="text-[15px] font-bold text-ink">No hay compras en esta categoría</p>
            <p className="mt-1 text-[13px] font-medium text-slate-500">
              Tus compras confirmadas aparecerán aquí.
            </p>
          </div>
        )}
      </main>

      <ConfirmDialog
        open={Boolean(toCancel)}
        title="Cancelar compra"
        message={
          <>
            ¿Seguro que quieres cancelar la orden{' '}
            <strong className="text-ink">#{toCancel?.id}</strong>? El stock será repuesto y el QR de
            retiro dejará de estar disponible.
          </>
        }
        confirmLabel="Cancelar compra"
        cancelLabel="Volver"
        onClose={() => setToCancel(null)}
        onConfirm={() => {
          if (!toCancel) return
          cancelOrder(toCancel.id)
          showToast('Compra cancelada y stock repuesto', 'info')
          setToCancel(null)
        }}
      />
    </AppShell>
  )
}

const notificationIcons = {
  tag: Tag,
  bag: ShoppingBag,
  card: CreditCard,
  coffee: Coffee,
}

export function NotificationsPage() {
  const { readNotificationIds, markNotificationRead } = useClientStore()

  return (
    <AppShell>
      <PageHeader title="Avisos & Notificaciones" backTo="/catalogo" />

      <main className="px-4 pt-4">
        <h2 className="text-[18px] font-extrabold text-ink">Nuevas</h2>

        <div className="mt-3 overflow-hidden rounded-2xl bg-[#dbe7f3]">
          {newNotifications.map((notification, index) => {
            const Icon = notificationIcons[notification.icon]
            const unread = !readNotificationIds.includes(notification.id)

            return (
              <div key={notification.id}>
                <button
                  type="button"
                  onClick={() => markNotificationRead(notification.id)}
                  className="flex w-full gap-3 px-4 py-4 text-left"
                >
                  <span className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-full bg-white/60 text-brand-strong">
                    <Icon size={27} strokeWidth={1.8} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-[18px] font-bold leading-tight text-ink">
                        {notification.title}
                      </h3>
                      <span className="shrink-0 text-[14px] font-medium text-brand">
                        {notification.time}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[15px] font-medium leading-snug text-slate-500">
                      {notification.body}
                    </p>
                    {unread && (
                      <span className="ml-auto mt-1 block h-2.5 w-2.5 rounded-full bg-brand-strong" />
                    )}
                  </div>
                </button>
                {index < newNotifications.length - 1 && (
                  <div className="ml-20 border-t border-white/70" />
                )}
              </div>
            )
          })}
        </div>

        <h2 className="mt-6 text-[18px] font-extrabold text-ink">Anteriores</h2>

        <div className="mt-3 overflow-hidden rounded-2xl bg-white shadow-sm">
          {previousNotifications.map((notification, index) => {
            const Icon = notificationIcons[notification.icon]
            const unread = !readNotificationIds.includes(notification.id)

            return (
              <div key={notification.id}>
                <button
                  type="button"
                  onClick={() => markNotificationRead(notification.id)}
                  className="flex w-full gap-3 px-4 py-4 text-left"
                >
                  <span className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-full bg-[#b9d3ee] text-brand-strong">
                    <Icon size={27} strokeWidth={1.8} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-[18px] font-bold leading-tight text-ink">
                        {notification.title}
                      </h3>
                      <span className="shrink-0 text-[14px] font-medium text-brand">
                        {notification.time}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[15px] font-medium leading-snug text-slate-500">
                      {notification.body}
                    </p>
                    {unread && (
                      <span className="ml-auto mt-1 block h-2.5 w-2.5 rounded-full bg-brand-strong" />
                    )}
                  </div>
                </button>
                {index < previousNotifications.length - 1 && (
                  <div className="ml-20 border-t border-slate-200" />
                )}
              </div>
            )
          })}
        </div>
      </main>
    </AppShell>
  )
}

type SettingRowProps = {
  icon: typeof UserRound
  label: string
  detail?: string
  right?: ReactNode
  color?: string
  onClick?: () => void
}

function SettingRow({ icon: Icon, label, detail, right, color = 'text-ink', onClick }: SettingRowProps) {
  const content = (
    <>
      <Icon size={24} strokeWidth={1.8} className="shrink-0 text-slate-600" />
      <div className="min-w-0 flex-1">
        <p className={`text-[16px] font-medium ${color}`}>{label}</p>
        {detail && <p className="text-[14px] font-medium text-slate-400">{detail}</p>}
      </div>
      {right ?? <ChevronRight size={22} className="shrink-0 text-slate-500" />}
    </>
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-3 px-1 py-4 text-left"
      >
        {content}
      </button>
    )
  }

  return <div className="flex items-center gap-3 px-1 py-4">{content}</div>
}

export function ProfilePage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { currentUser, pushNotifications, setPushNotifications, logout } = useClientStore()

  const initials =
    currentUser?.name
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() ?? 'FR'

  return (
    <AppShell>
      <PageHeader title="Perfil" backTo="/catalogo" bordered={false} />

      <main className="px-4 pb-10">
        <div className="flex flex-col items-center pt-4">
          <div className="flex h-[132px] w-[132px] items-center justify-center overflow-hidden rounded-full border-[6px] border-slate-400 bg-[#f2b9a2] text-[36px] font-extrabold text-white">
            {currentUser?.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="h-full w-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          <h1 className="mt-4 text-[25px] font-extrabold text-ink">
            {currentUser?.name ?? 'Cliente FoodRush'}
          </h1>
          <p className="text-[15px] font-medium text-slate-500">
            {currentUser?.email ?? 'sin correo'}
          </p>
        </div>

        <h2 className="mt-7 text-[18px] font-extrabold text-ink">Perfil</h2>
        <div className="mt-1 divide-y divide-slate-200">
          <SettingRow
            icon={UserRound}
            label="Información personal"
            onClick={() =>
              showToast(
                `${currentUser?.name ?? 'Cliente'} · ${currentUser?.email ?? 'sin correo'}`,
                'info',
              )
            }
          />
          <SettingRow
            icon={Lock}
            label="Cambiar contraseña"
            onClick={() => showToast('Cambio de contraseña no disponible en el prototipo', 'info')}
          />
        </div>

        <h2 className="mt-6 text-[18px] font-extrabold text-ink">Pagos</h2>
        <div className="mt-1 divide-y divide-slate-200">
          <SettingRow
            icon={CreditCard}
            label="Tarjeta registrada"
            detail="Expira 12/26"
            onClick={() => showToast('Tarjeta Visa **** 1234 · Expira 12/26', 'info')}
          />
          <SettingRow
            icon={PlusCircle}
            label="Añadir nuevo método de pago"
            color="text-slate-500"
            onClick={() => showToast('Agrega una tarjeta desde el flujo de pago', 'info')}
          />
        </div>

        <h2 className="mt-6 text-[18px] font-extrabold text-ink">Preferencias</h2>
        <div className="mt-1 divide-y divide-slate-200">
          <SettingRow
            icon={Bell}
            label="Notificaciones Push"
            right={
              <Toggle checked={pushNotifications} onChange={setPushNotifications} />
            }
          />
          <SettingRow
            icon={Globe}
            label="Idioma"
            onClick={() => showToast('Idioma: Español (demo)', 'info')}
            right={
              <span className="flex items-center gap-2 text-[16px] font-medium text-slate-500">
                Español
                <ChevronRight size={22} />
              </span>
            }
          />
        </div>

        <h2 className="mt-6 text-[18px] font-extrabold text-ink">Cuenta</h2>
        <div className="mt-1 divide-y divide-slate-200">
          <SettingRow
            icon={HelpCircle}
            label="Ayuda y Soporte"
            onClick={() => showToast('Soporte: soporte@foodrush.cl', 'info')}
          />
          <SettingRow
            icon={FileText}
            label="Términos y Condiciones"
            onClick={() => showToast('Términos y condiciones disponibles en la versión final', 'info')}
          />
        </div>

        <button
          type="button"
          onClick={() => {
            logout()
            navigate('/login')
          }}
          className="mt-6 flex h-[54px] w-full items-center justify-center gap-2 rounded-xl bg-red-50 text-[17px] font-bold text-red-500"
        >
          <LogOut size={22} />
          Cerrar Sesión
        </button>
      </main>
    </AppShell>
  )
}

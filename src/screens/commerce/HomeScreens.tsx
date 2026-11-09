import {
  BarChart3,
  Bell,
  Clock,
  CreditCard,
  FileText,
  HelpCircle,
  Lock,
  LogOut,
  QrCode,
  ReceiptText,
  Settings,
  UserRound,
  UtensilsCrossed,
} from 'lucide-react'
import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppShell } from '../../components/AppShell'
import { PrimaryButton } from '../../components/Buttons'
import { Field } from '../../components/Field'
import { Modal } from '../../components/Modal'
import { PageHeader } from '../../components/PageHeader'
import { Toggle } from '../../components/Toggle'
import { useToast } from '../../components/ToastProvider'
import { formatCLP } from '../../lib/format'
import { useAppStore } from '../../store/AppStore'
import { useCommerceStore } from '../../store/CommerceStore'
import type { Order } from '../../types'

function startOfDay(date: Date) {
  const value = new Date(date)
  value.setHours(0, 0, 0, 0)
  return value
}

function periodStart(period: 'hoy' | 'semana' | 'mes') {
  const now = new Date()
  const days = period === 'hoy' ? 1 : period === 'semana' ? 7 : 30
  const start = startOfDay(now)
  start.setDate(start.getDate() - (days - 1))
  return start
}

function ordersInRange(orders: Order[], start: Date, end: Date) {
  return orders.filter((order) => {
    if (!order.createdAt) return false
    const created = new Date(order.createdAt)
    return created >= start && created <= end
  })
}

function delta(current: number, previous: number) {
  if (previous <= 0) return 0
  return Math.round(((current - previous) / previous) * 100)
}

export function CommerceHomePage() {
  const { orders } = useAppStore()
  const { businessName, open, storeId } = useCommerceStore()
  const storeOrders = orders.filter((order) => order.storeId === storeId)

  const pendingOrders = storeOrders.filter((order) => order.status === 'pendiente').length

  const today = startOfDay(new Date())
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const salesToday = ordersInRange(storeOrders, today, tomorrow).reduce(
    (sum, order) => sum + order.total,
    0,
  )
  const salesYesterday = ordersInRange(storeOrders, yesterday, today).reduce(
    (sum, order) => sum + order.total,
    0,
  )
  const salesDelta = delta(salesToday, salesYesterday)

  return (
    <div>
      <header className="flex items-center gap-3 border-b border-slate-200/70 px-4 py-3">
        <img
          src="/commerce/logo-orange.png"
          alt={businessName}
          className="h-12 w-12 rounded-full object-cover"
        />
        <h1 className="min-w-0 flex-1 truncate text-[22px] font-extrabold text-ink">
          {businessName}
        </h1>
        <span
          className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[14px] font-bold ${
            open ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${open ? 'bg-green-500' : 'bg-red-500'}`} />
          {open ? 'Abierto' : 'Cerrado'}
        </span>
      </header>

      <main className="px-4 pt-5">
        <h2 className="text-[25px] font-extrabold text-ink">Resumen del Día</h2>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-[16px] font-medium text-ink">Ventas de Hoy</p>
            <p className="mt-1 text-[30px] font-extrabold leading-none text-[#333333]">
              {formatCLP(salesToday)}
            </p>
            <p
              className={`mt-3 text-[15px] font-bold ${
                salesDelta >= 0 ? 'text-green-600' : 'text-red-500'
              }`}
            >
              {salesDelta >= 0 ? '+' : ''}
              {salesDelta}%
            </p>
          </div>
          <Link to="/comercio/pedidos" className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-[16px] font-medium text-ink">Por Entregar</p>
            <p className="mt-1 text-[30px] font-extrabold leading-none text-[#333333]">
              {pendingOrders}
            </p>
            <p className="mt-3 text-[15px] font-bold text-brand">Ver todos</p>
          </Link>
        </div>

        <h2 className="mt-7 text-[25px] font-extrabold text-ink">Gestiona tu Tienda</h2>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <HomeCard
            to="/comercio/productos"
            icon={<UtensilsCrossed size={30} className="text-brand-strong" />}
            title="Productos"
            description="Añade, edita y gestiona tu inventario."
          />
          <HomeCard
            to="/comercio/ventas"
            icon={
              <span className="relative">
                <ReceiptText size={30} className="text-brand-strong" />
                <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-strong px-1 text-[9px] font-extrabold text-white">
                  {pendingOrders}
                </span>
              </span>
            }
            title="Ventas"
            description="Revisa y administra tus ventas."
          />
          <HomeCard
            to="/comercio/dashboard"
            icon={<BarChart3 size={30} className="text-brand-strong" />}
            title="Dashboard"
            description="Analiza tus ventas y rendimiento."
          />
          <HomeCard
            to="/comercio/ajustes"
            icon={<Settings size={30} className="text-brand-strong" />}
            title="Ajustes"
            description="Configura horarios, pagos y perfil."
          />
        </div>
      </main>

      <div className="pointer-events-none fixed bottom-[92px] left-1/2 z-20 w-full max-w-[430px] -translate-x-1/2 px-4">
        <Link
          to="/comercio/escanear"
          aria-label="Escanear QR"
          className="pointer-events-auto ml-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-strong text-white shadow-lg"
        >
          <QrCode size={30} />
        </Link>
      </div>
    </div>
  )
}

type HomeCardProps = {
  to: string
  icon: ReactNode
  title: string
  description: string
}

function HomeCard({ to, icon, title, description }: HomeCardProps) {
  return (
    <Link to={to} className="flex min-h-[166px] flex-col rounded-2xl bg-white p-4 shadow-sm">
      <span className="flex h-10 items-center">{icon}</span>
      <span className="mt-auto pt-4 text-[19px] font-extrabold text-ink">{title}</span>
      <span className="mt-1 text-[14px] font-medium leading-snug text-slate-500">{description}</span>
    </Link>
  )
}

export function DashboardPage() {
  const { orders } = useAppStore()
  const { storeId } = useCommerceStore()
  const storeOrders = orders.filter((order) => order.storeId === storeId)
  const [period, setPeriod] = useState<'hoy' | 'semana' | 'mes'>('hoy')

  const currentStart = periodStart(period)
  const now = new Date()
  const previousEnd = new Date(currentStart)
  previousEnd.setMilliseconds(-1)
  const previousStart = new Date(currentStart)
  const days = period === 'hoy' ? 1 : period === 'semana' ? 7 : 30
  previousStart.setDate(previousStart.getDate() - days)

  const currentOrders = ordersInRange(storeOrders, currentStart, now)
  const previousOrders = ordersInRange(storeOrders, previousStart, previousEnd)

  const total = currentOrders.reduce((sum, order) => sum + order.total, 0)
  const previousTotal = previousOrders.reduce((sum, order) => sum + order.total, 0)
  const count = currentOrders.length
  const previousCount = previousOrders.length
  const average = count > 0 ? Math.round(total / count) : 0
  const previousAverage = previousCount > 0 ? Math.round(previousTotal / previousCount) : 0
  const net = Math.round(total * 0.97)
  const previousNet = Math.round(previousTotal * 0.97)

  const stats = [
    {
      label: 'Ventas Totales',
      value: formatCLP(total),
      delta: delta(total, previousTotal),
    },
    {
      label: 'N° de Pedidos',
      value: String(count),
      delta: delta(count, previousCount),
    },
    {
      label: 'Venta Promedio',
      value: formatCLP(average),
      delta: delta(average, previousAverage),
    },
    {
      label: 'Ganancia Neta',
      value: formatCLP(net),
      delta: delta(net, previousNet),
    },
  ]

  const buckets = [8, 10, 12, 14, 16, 18]
  const hourlyValues = buckets.map((hour) =>
    currentOrders.reduce((sum, order) => {
      if (!order.createdAt) return sum
      const createdHour = new Date(order.createdAt).getHours()
      return createdHour >= hour && createdHour < hour + 2 ? sum + order.total : sum
    }, 0),
  )
  const maxHourly = Math.max(...hourlyValues, 1)
  const activeBucket = hourlyValues.every((value) => value === 0)
    ? 3
    : hourlyValues.indexOf(Math.max(...hourlyValues))
  const bars = hourlyValues.map((value, index) => {
    const hour = buckets[index]
    const hour12 = hour % 12 || 12
    return {
      label: `${hour12}${hour < 12 ? 'am' : 'pm'}`,
      value,
      active: index === activeBucket,
      height: value === 0 ? 8 : 20 + Math.round((value / maxHourly) * 90),
    }
  })

  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; sold: number; price: number; image: string }>()

    currentOrders.forEach((order) => {
      order.items.forEach((item) => {
        const current = map.get(item.productId)
        if (current) {
          current.sold += item.quantity
        } else {
          map.set(item.productId, {
            name: item.name,
            sold: item.quantity,
            price: item.price,
            image: item.image,
          })
        }
      })
    })

    return Array.from(map.values())
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 3)
  }, [currentOrders])

  return (
    <div>
      <PageHeader title="Dashboard" backTo="/comercio/inicio" />

      <main className="px-4 pt-4">
        <div className="grid grid-cols-3 rounded-xl bg-[#cbd8e6] p-1">
          {(['hoy', 'semana', 'mes'] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setPeriod(item)}
              className={`h-11 rounded-lg text-[16px] font-bold capitalize ${
                period === item ? 'bg-white text-brand shadow-sm' : 'text-slate-500'
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-[15px] font-medium text-slate-500">{stat.label}</p>
              <p className="mt-1 text-[24px] font-extrabold leading-none text-[#333333]">
                {stat.value}
              </p>
              <p
                className={`mt-3 text-[14px] font-bold ${
                  stat.delta >= 0 ? 'text-green-600' : 'text-red-500'
                }`}
              >
                {stat.delta >= 0 ? '+' : ''}
                {stat.delta}%
              </p>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="text-[19px] font-extrabold text-ink">Ventas por Hora</h2>
          <p className="text-[14px] font-medium capitalize text-slate-500">{period}</p>

          <div className="mt-5 flex h-[150px] items-end justify-between gap-3 px-1">
            {bars.map((bar) => (
              <div key={bar.label} className="flex flex-1 flex-col items-center justify-end gap-2">
                <div
                  style={{ height: `${bar.height}px` }}
                  className={`w-full rounded-t-md ${
                    bar.active ? 'bg-brand-strong' : 'bg-[#c9d6e4]'
                  }`}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between px-1 text-[13px] font-medium text-slate-500">
            {bars.map((bar) => (
              <span key={bar.label} className={bar.active ? 'font-bold text-brand-strong' : ''}>
                {bar.label}
              </span>
            ))}
          </div>
        </div>

        <h2 className="mt-6 text-[22px] font-extrabold text-ink">Productos Más Vendidos</h2>

        <div className="mt-4 space-y-3">
          {topProducts.map((product) => (
            <div
              key={product.name}
              className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm"
            >
              <img
                src={product.image}
                alt={product.name}
                className="h-14 w-14 shrink-0 rounded-lg bg-slate-100 object-contain"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[16px] font-bold text-ink">{product.name}</p>
                <p className="text-[14px] font-medium text-slate-500">
                  {product.sold} vendidos
                </p>
              </div>
              <span className="shrink-0 text-[16px] font-extrabold text-[#333333]">
                {formatCLP(product.price)}
              </span>
            </div>
          ))}

          {topProducts.length === 0 && (
            <div className="rounded-2xl bg-white/60 px-6 py-6 text-center">
              <p className="text-[14px] font-medium text-slate-500">
                Sin ventas registradas en este período.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

type SettingRowProps = {
  icon: typeof UserRound
  label: string
  right?: ReactNode
  onClick?: () => void
}

function SettingRow({ icon: Icon, label, right, onClick }: SettingRowProps) {
  const content = (
    <>
      <Icon size={23} strokeWidth={1.8} className="shrink-0 text-slate-600" />
      <span className="flex-1 text-[16px] font-medium text-ink">{label}</span>
      {right ?? <span className="text-slate-400">›</span>}
    </>
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-3 py-4 text-left"
      >
        {content}
      </button>
    )
  }

  return <div className="flex items-center gap-3 py-4">{content}</div>
}

type DialogKind = 'info' | 'password' | 'hours' | null

export function CommerceSettingsPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const {
    businessName,
    businessEmail,
    open,
    creditEnabled,
    debitEnabled,
    newOrdersNotifications,
    cancellationNotifications,
    openTime,
    closeTime,
    logout,
    updateBusiness,
    changePassword,
    setOpen,
    setCreditEnabled,
    setDebitEnabled,
    setNewOrdersNotifications,
    setCancellationNotifications,
    setHours,
  } = useCommerceStore()

  const [dialog, setDialog] = useState<DialogKind>(null)
  const [infoName, setInfoName] = useState(businessName)
  const [infoEmail, setInfoEmail] = useState(businessEmail)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [hoursOpen, setHoursOpen] = useState(openTime)
  const [hoursClose, setHoursClose] = useState(closeTime)

  function openInfo() {
    setInfoName(businessName)
    setInfoEmail(businessEmail)
    setDialog('info')
  }

  function openPassword() {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setPasswordError('')
    setDialog('password')
  }

  function openHours() {
    setHoursOpen(openTime)
    setHoursClose(closeTime)
    setDialog('hours')
  }

  function saveInfo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!infoName.trim() || !infoEmail.includes('@')) {
      showToast('Ingresa un nombre y correo válidos', 'error')
      return
    }
    updateBusiness(infoName, infoEmail)
    showToast('Información del negocio actualizada')
    setDialog(null)
  }

  function savePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden.')
      return
    }
    const result = changePassword(currentPassword, newPassword)
    if (!result.ok) {
      setPasswordError(result.error)
      return
    }
    showToast('Contraseña actualizada correctamente')
    setDialog(null)
  }

  function saveHours(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!hoursOpen || !hoursClose) {
      showToast('Ingresa ambos horarios', 'error')
      return
    }
    setHours(hoursOpen, hoursClose)
    showToast('Horarios actualizados')
    setDialog(null)
  }

  return (
    <AppShell>
      <PageHeader title="Ajustes" backTo="/comercio/inicio" bordered={false} />

      <main className="px-4 pb-10">
        <div className="flex flex-col items-center pt-4">
          <img
            src="/commerce/logo-red.png"
            alt={businessName}
            className="h-[130px] w-[130px] rounded-full border-4 border-slate-400 object-cover"
          />
          <h1 className="mt-4 text-[25px] font-extrabold text-ink">{businessName}</h1>
          <p className="text-[15px] font-medium text-slate-500">{businessEmail}</p>
        </div>

        <h2 className="mt-7 text-[18px] font-extrabold text-ink">Perfil</h2>
        <div className="divide-y divide-slate-200">
          <SettingRow icon={UserRound} label="Información de Negocio" onClick={openInfo} />
          <SettingRow icon={Lock} label="Cambiar contraseña" onClick={openPassword} />
          <SettingRow icon={Clock} label="Horarios de Atención" onClick={openHours} />
          <SettingRow
            icon={Settings}
            label="Estado del negocio"
            right={
              <Toggle
                checked={open}
                onChange={(value) => {
                  setOpen(value)
                  showToast(value ? 'Negocio abierto' : 'Negocio cerrado', 'info')
                }}
              />
            }
          />
        </div>

        <h2 className="mt-6 text-[18px] font-extrabold text-ink">Métodos de pago</h2>
        <div className="divide-y divide-slate-200">
          <SettingRow
            icon={CreditCard}
            label="Tarjeta de Crédito"
            right={
              <Toggle
                checked={creditEnabled}
                onChange={(value) => {
                  setCreditEnabled(value)
                  showToast(
                    value ? 'Pago con crédito habilitado' : 'Pago con crédito deshabilitado',
                    'info',
                  )
                }}
              />
            }
          />
          <SettingRow
            icon={CreditCard}
            label="Tarjeta de Débito"
            right={
              <Toggle
                checked={debitEnabled}
                onChange={(value) => {
                  setDebitEnabled(value)
                  showToast(
                    value ? 'Pago con débito habilitado' : 'Pago con débito deshabilitado',
                    'info',
                  )
                }}
              />
            }
          />
        </div>

        <h2 className="mt-6 text-[18px] font-extrabold text-ink">Notificaciones</h2>
        <div className="divide-y divide-slate-200">
          <SettingRow
            icon={Bell}
            label="Nuevos Pedidos"
            right={
              <Toggle
                checked={newOrdersNotifications}
                onChange={(value) => {
                  setNewOrdersNotifications(value)
                  showToast(
                    value ? 'Notificaciones de pedidos activadas' : 'Notificaciones de pedidos desactivadas',
                    'info',
                  )
                }}
              />
            }
          />
          <SettingRow
            icon={Bell}
            label="Cancelaciones"
            right={
              <Toggle
                checked={cancellationNotifications}
                onChange={(value) => {
                  setCancellationNotifications(value)
                  showToast(
                    value
                      ? 'Notificaciones de cancelaciones activadas'
                      : 'Notificaciones de cancelaciones desactivadas',
                    'info',
                  )
                }}
              />
            }
          />
        </div>

        <h2 className="mt-6 text-[18px] font-extrabold text-ink">Cuenta</h2>
        <div className="divide-y divide-slate-200">
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
            navigate('/comercio/login')
          }}
          className="mt-6 flex h-[54px] w-full items-center justify-center gap-2 rounded-xl bg-red-50 text-[17px] font-bold text-red-500"
        >
          <LogOut size={22} />
          Cerrar Sesión
        </button>
      </main>

      <Modal open={dialog === 'info'} title="Información de Negocio" onClose={() => setDialog(null)}>
        <form onSubmit={saveInfo} className="space-y-4">
          <Field
            label="Nombre del negocio"
            placeholder="Casino Los Notros"
            value={infoName}
            onChange={setInfoName}
          />
          <Field
            label="Correo del negocio"
            placeholder="casinolosnotros@gmail.com"
            type="email"
            value={infoEmail}
            onChange={setInfoEmail}
          />
          <PrimaryButton type="submit">Guardar cambios</PrimaryButton>
        </form>
      </Modal>

      <Modal open={dialog === 'password'} title="Cambiar contraseña" onClose={() => setDialog(null)}>
        <form onSubmit={savePassword} className="space-y-4">
          <Field
            label="Contraseña actual"
            placeholder="Ingresa tu contraseña actual"
            type="password"
            value={currentPassword}
            onChange={(value) => {
              setCurrentPassword(value)
              setPasswordError('')
            }}
          />
          <Field
            label="Nueva contraseña"
            placeholder="Mínimo 6 caracteres"
            type="password"
            value={newPassword}
            onChange={(value) => {
              setNewPassword(value)
              setPasswordError('')
            }}
          />
          <Field
            label="Confirmar contraseña"
            placeholder="Repite la nueva contraseña"
            type="password"
            value={confirmPassword}
            onChange={(value) => {
              setConfirmPassword(value)
              setPasswordError('')
            }}
          />
          {passwordError && <p className="text-[13px] font-semibold text-red-500">{passwordError}</p>}
          <PrimaryButton type="submit">Actualizar contraseña</PrimaryButton>
        </form>
      </Modal>

      <Modal open={dialog === 'hours'} title="Horarios de Atención" onClose={() => setDialog(null)}>
        <form onSubmit={saveHours} className="space-y-4">
          <Field
            label="Apertura"
            type="time"
            value={hoursOpen}
            onChange={setHoursOpen}
          />
          <Field
            label="Cierre"
            type="time"
            value={hoursClose}
            onChange={setHoursClose}
          />
          <PrimaryButton type="submit">Guardar horarios</PrimaryButton>
        </form>
      </Modal>
    </AppShell>
  )
}

import {
  Banknote,
  Check,
  ChevronRight,
  CreditCard,
  Gift,
  Lock,
  Minus,
  Plus,
  Store,
  Trash2,
} from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { AppShell } from '../../components/AppShell'
import { PrimaryButton } from '../../components/Buttons'
import { Field } from '../../components/Field'
import { InlineError } from '../../components/InlineError'
import { PageHeader } from '../../components/PageHeader'
import { StoreBanner } from '../../components/StoreBanner'
import { SummaryCard } from '../../components/SummaryCard'
import { useToast } from '../../components/ToastProvider'
import { useCart } from '../../hooks/useCart'
import { useCheckout } from '../../hooks/useCheckout'
import { formatCLP } from '../../lib/format'
import { useAppStore } from '../../store/AppStore'
import { useClientStore } from '../../store/ClientStore'
import { useCommerceStore } from '../../store/CommerceStore'
import { ErrorStatePage } from '../ErrorStatePage'

const qtyButton = 'flex h-9 w-9 items-center justify-center rounded-full bg-[#dbe7f3] text-brand-strong'

export function CartPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { items, subtotal, selectedStore } = useCart()
  const { setCartQuantity, removeFromCart, clearCart } = useClientStore()
  const { open } = useCommerceStore()
  const [error, setError] = useState('')

  function changeQuantity(productId: string, delta: number) {
    const entry = items.find((item) => item.product.id === productId)
    if (!entry) return

    const next = entry.quantity + delta
    if (next < 1) return
    if (next > entry.product.stock) {
      setError(
        `Solo hay ${entry.product.stock} ${
          entry.product.stock === 1 ? 'unidad' : 'unidades'
        } de ${entry.product.name} disponibles.`,
      )
      return
    }

    setError('')
    setCartQuantity(productId, next)
  }

  function continueToPayment() {
    if (items.length === 0) {
      showToast('Agrega al menos un producto al carrito', 'error')
      return
    }
    if (error) {
      showToast(error, 'error')
      return
    }
    const invalid = items.find((item) => item.quantity > item.product.stock)
    if (invalid) {
      showToast(`Stock insuficiente de ${invalid.product.name}`, 'error')
      return
    }
    if (!open) {
      showToast('El comercio está cerrado en este momento', 'error')
      return
    }
    navigate('/metodo-pago')
  }

  return (
    <AppShell>
      <PageHeader
        title="Mi Carrito"
        backTo="/catalogo"
        right={
          <button
            type="button"
            aria-label="Vaciar carrito"
            onClick={() => {
              clearCart()
              setError('')
            }}
            className="text-brand"
          >
            <Trash2 size={24} />
          </button>
        }
      />

      <main className="px-4 pt-5">
        <StoreBanner storeName={selectedStore.name} />

        {error && <div className="mt-3"><InlineError>{error}</InlineError></div>}

        <div className="mt-5 space-y-4">
          {items.map(({ product, quantity }) => (
            <div key={product.id} className="rounded-2xl bg-white p-3.5 shadow-sm">
              <div className="flex gap-3">
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-[76px] w-[76px] shrink-0 rounded-xl bg-slate-50 object-contain"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate text-[18px] font-bold text-ink">{product.name}</h3>
                      <p className="mt-0.5 text-[16px] font-medium text-slate-500">
                        {formatCLP(product.price)}
                      </p>
                      <p className="mt-0.5 text-[12px] font-medium text-slate-400">
                        {product.stock} disponibles
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => changeQuantity(product.id, -1)}
                        className={qtyButton}
                        aria-label="Disminuir"
                      >
                        <Minus size={18} />
                      </button>
                      <span className="w-4 text-center text-[16px] font-bold text-ink">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => changeQuantity(product.id, 1)}
                        className={qtyButton}
                        aria-label="Aumentar"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      removeFromCart(product.id)
                      setError('')
                    }}
                    className="ml-auto mt-3 flex items-center gap-1.5 text-[15px] font-bold text-red-500"
                  >
                    <Trash2 size={17} />
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}

          {items.length === 0 && (
            <div className="rounded-2xl bg-white/60 px-6 py-8 text-center">
              <p className="text-[15px] font-bold text-ink">Tu carrito está vacío</p>
              <p className="mt-1 text-[13px] font-medium text-slate-500">
                Vuelve al catálogo para agregar productos.
              </p>
              <Link to="/catalogo" className="mt-4 inline-block text-[14px] font-bold text-brand">
                Ir al catálogo
              </Link>
            </div>
          )}
        </div>

        <div className="mt-7 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-[21px] font-extrabold text-ink">Resumen de Compra</h2>
          <div className="mt-5 flex items-center justify-between text-[17px] font-medium text-slate-500">
            <span>Subtotal</span>
            <span>{formatCLP(subtotal)}</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[17px] font-medium text-slate-500">
            <span>Descuentos</span>
            <span>{formatCLP(0)}</span>
          </div>
          <div className="my-4 border-t border-slate-200" />
          <div className="flex items-center justify-between text-[20px] font-extrabold text-ink">
            <span>Total</span>
            <span>{formatCLP(subtotal)}</span>
          </div>
        </div>

        <div className="mt-6 pb-6">
          <PrimaryButton onClick={continueToPayment}>Continuar al Pago</PrimaryButton>
        </div>
      </main>
    </AppShell>
  )
}

export function PaymentMethodPage() {
  const { subtotal, selectedStore } = useCart()
  const completeCheckout = useCheckout()
  const { creditEnabled, debitEnabled, open } = useCommerceStore()
  const cardsAvailable = creditEnabled || debitEnabled

  const methods = [
    {
      label: 'Crédito o Débito',
      icon: CreditCard,
      to: cardsAvailable ? '/eleccion-pago' : undefined,
      disabled: !cardsAvailable,
    },
    { label: 'Edenred', icon: Gift, onClick: () => completeCheckout('Edenred') },
    { label: 'Efectivo', icon: Banknote, onClick: () => completeCheckout('Efectivo') },
  ]

  return (
    <AppShell>
      <PageHeader title="Método de Pago" backTo="/carrito" />

      <main className="px-4 pt-6">
        <h1 className="text-[30px] font-extrabold leading-tight text-ink">
          Elige tu método de pago
        </h1>

        {!open && (
          <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-[14px] font-medium text-amber-600">
            El comercio está cerrado en este momento. No se pueden confirmar compras.
          </div>
        )}

        <SummaryCard subtotal={subtotal} className="mt-5" />

        <div className="mt-6 space-y-3">
          {methods.map((method) => {
            const Icon = method.icon
            const disabled = 'disabled' in method && method.disabled
            const content = (
              <>
                <Icon size={26} strokeWidth={1.8} className="text-slate-500" />
                <span className="flex-1 text-[18px] font-semibold text-ink">{method.label}</span>
                {disabled ? (
                  <span className="text-[12px] font-bold text-slate-400">No disponible</span>
                ) : (
                  <ChevronRight size={22} className="text-slate-400" />
                )}
              </>
            )

            if (method.to) {
              return (
                <Link
                  key={method.label}
                  to={method.to}
                  className={`flex items-center gap-3 rounded-xl bg-white px-4 py-4 shadow-sm ${
                    disabled ? 'pointer-events-none opacity-50' : ''
                  }`}
                >
                  {content}
                </Link>
              )
            }

            return (
              <button
                key={method.label}
                type="button"
                onClick={method.onClick}
                disabled={disabled}
                className={`flex w-full items-center gap-3 rounded-xl bg-white px-4 py-4 text-left shadow-sm ${
                  disabled ? 'opacity-50' : ''
                }`}
              >
                {content}
              </button>
            )
          })}
        </div>

        <StoreBanner storeName={selectedStore.name} className="mt-6" />
      </main>
    </AppShell>
  )
}

export function CardChoicePage() {
  const { subtotal, selectedStore } = useCart()
  const completeCheckout = useCheckout()
  const { creditEnabled, debitEnabled } = useCommerceStore()
  const cardsAvailable = creditEnabled || debitEnabled
  const [card, setCard] = useState<'debito' | 'credito'>(debitEnabled ? 'debito' : 'credito')

  return (
    <AppShell>
      <PageHeader title="Crédito o Débito" backTo="/metodo-pago" />

      <main className="px-4 pt-6">
        <SummaryCard subtotal={subtotal} />

        <h2 className="mt-7 text-[23px] font-extrabold text-ink">Tarjetas Guardadas</h2>

        <div className="mt-4 space-y-3">
          {debitEnabled && (
            <button
              type="button"
              onClick={() => setCard('debito')}
              className={`flex w-full items-center gap-3 rounded-xl bg-white px-4 py-4 text-left ${
                card === 'debito' ? 'border-2 border-brand' : 'border border-slate-200'
              }`}
            >
              <CreditCard size={28} strokeWidth={1.8} className="text-brand-strong" />
              <span className="flex-1">
                <span className="block text-[18px] font-medium text-ink">Débito Visa</span>
                <span className="block text-[15px] font-medium text-brand">**** 1234</span>
              </span>
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                  card === 'debito' ? 'border-brand' : 'border-slate-300'
                }`}
              >
                {card === 'debito' && <span className="h-3 w-3 rounded-full bg-brand" />}
              </span>
            </button>
          )}

          {creditEnabled && (
            <button
              type="button"
              onClick={() => setCard('credito')}
              className={`flex w-full items-center gap-3 rounded-xl bg-white px-4 py-4 text-left ${
                card === 'credito' ? 'border-2 border-brand' : 'border border-slate-200'
              }`}
            >
              <CreditCard size={28} strokeWidth={1.8} className="text-brand-strong" />
              <span className="flex-1">
                <span className="block text-[18px] font-medium text-ink">Crédito Mastercard</span>
                <span className="block text-[15px] font-medium text-brand">**** 5678</span>
              </span>
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                  card === 'credito' ? 'border-brand' : 'border-slate-300'
                }`}
              >
                {card === 'credito' && <span className="h-3 w-3 rounded-full bg-brand" />}
              </span>
            </button>
          )}

          {!cardsAvailable && (
            <div className="rounded-xl bg-amber-50 px-4 py-4 text-[14px] font-medium text-amber-600">
              El comercio no acepta pagos con tarjeta en este momento.
            </div>
          )}

          {cardsAvailable && (
            <>
              <Link
                to="/tarjeta"
                className="flex h-[58px] items-center justify-center rounded-xl border border-slate-300 bg-white text-[18px] font-bold text-ink"
              >
                Pagar con otra tarjeta
              </Link>

              <Link
                to="/tarjeta"
                className="flex h-[58px] items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white text-[18px] font-bold text-ink"
              >
                <Plus size={20} />
                Añadir Nueva Tarjeta
              </Link>
            </>
          )}
        </div>

        <StoreBanner storeName={selectedStore.name} className="mt-6" />

        <p className="mt-5 flex items-center justify-center gap-2 text-[15px] font-medium text-slate-400">
          <Lock size={17} />
          Pago seguro y encriptado.
        </p>

        <div className="mt-4 pb-6">
          <PrimaryButton
            disabled={!cardsAvailable}
            onClick={() =>
              completeCheckout(card === 'debito' ? 'Tarjeta de Débito' : 'Tarjeta de Crédito')
            }
          >
            Pagar {formatCLP(subtotal)}
          </PrimaryButton>
        </div>
      </main>
    </AppShell>
  )
}

export function CardFormPage() {
  const { subtotal, selectedStore } = useCart()
  const completeCheckout = useCheckout()
  const [cardType, setCardType] = useState<'debito' | 'credito'>('credito')
  const [number, setNumber] = useState('')
  const [holder, setHolder] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors: Record<string, string> = {}
    const digits = number.replace(/\s/g, '')

    if (digits.length < 12) nextErrors.number = 'Ingresa un número de tarjeta válido.'
    if (!holder.trim()) nextErrors.holder = 'Ingresa el nombre del titular.'
    if (!/^\d{2}\/\d{2}$/.test(expiry)) nextErrors.expiry = 'Usa el formato MM/AA.'
    if (!/^\d{3,4}$/.test(cvv)) nextErrors.cvv = 'Ingresa un CVV válido.'

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    completeCheckout(cardType === 'debito' ? 'Tarjeta de Débito' : 'Tarjeta de Crédito')
  }

  return (
    <AppShell>
      <PageHeader title="Crédito o Débito" backTo="/eleccion-pago" />

      <form onSubmit={handleSubmit} className="px-4 pt-6">
        <h1 className="text-[30px] font-extrabold leading-tight text-ink">Ingresa tus Datos</h1>

        <SummaryCard subtotal={subtotal} className="mt-5" />

        <div className="mt-6 grid grid-cols-2 rounded-xl bg-[#cbd8e6] p-1">
          <button
            type="button"
            onClick={() => setCardType('debito')}
            className={`h-12 rounded-lg text-[17px] font-bold ${
              cardType === 'debito' ? 'bg-white text-ink shadow-sm' : 'text-brand'
            }`}
          >
            Débito
          </button>
          <button
            type="button"
            onClick={() => setCardType('credito')}
            className={`h-12 rounded-lg text-[17px] font-bold ${
              cardType === 'credito' ? 'bg-white text-ink shadow-sm' : 'text-brand'
            }`}
          >
            Crédito
          </button>
        </div>

        <div className="mt-6 space-y-5">
          <Field
            label="Número de la Tarjeta"
            placeholder="0000 0000 0000 0000"
            inputMode="numeric"
            rightIcon={<CreditCard size={24} className="text-brand-strong" />}
            value={number}
            onChange={(value) => setNumber(value)}
            error={errors.number}
          />
          <Field
            label="Nombre del Titular"
            placeholder="Ingresa el nombre como aparece en la tarjeta"
            value={holder}
            onChange={(value) => setHolder(value)}
            error={errors.holder}
          />
          <div className="flex gap-4">
            <Field
              label="Vencimiento"
              placeholder="MM/AA"
              className="flex-1"
              value={expiry}
              onChange={(value) => setExpiry(value)}
              error={errors.expiry}
            />
            <Field
              label="CVV ?"
              placeholder="123"
              inputMode="numeric"
              className="flex-1"
              value={cvv}
              onChange={(value) => setCvv(value)}
              error={errors.cvv}
            />
          </div>

          <label className="flex items-center justify-between rounded-2xl border border-[#d8e1ea] px-4 py-4">
            <span className="text-[17px] font-medium text-ink">Guardar Tarjeta</span>
            <input type="checkbox" className="h-6 w-6 rounded-full accent-[#004e89]" />
          </label>
        </div>

        <StoreBanner storeName={selectedStore.name} className="mt-6" />

        <p className="mt-5 flex items-center justify-center gap-2 text-[15px] font-medium text-slate-400">
          <Lock size={17} />
          Pago seguro y encriptado.
        </p>

        <div className="mt-4 pb-6">
          <PrimaryButton type="submit">Pagar {formatCLP(subtotal)}</PrimaryButton>
        </div>
      </form>
    </AppShell>
  )
}

export function QrPage() {
  const { id } = useParams<{ id: string }>()
  const { orders } = useAppStore()
  const { currentUser } = useClientStore()
  const order = orders.find((item) => item.id === id)

  if (!order || (order.customerId && order.customerId !== currentUser?.id)) {
    return (
      <ErrorStatePage
        title="Compra no encontrada"
        message="No existe una compra con ese identificador o no tienes acceso a ella."
        icon="lock"
        backTo="/mis-compras"
        actionLabel="Ver mis compras"
      />
    )
  }

  return (
    <AppShell>
      <PageHeader title="QR de Retiro" backTo="/catalogo" close bordered={false} />

      <main className="px-4 pb-8 pt-8 text-center">
        <div className="mx-auto flex h-[100px] w-[100px] items-center justify-center rounded-full bg-[#d5e3f1] text-brand-strong">
          <Check size={52} strokeWidth={2.4} />
        </div>

        <h1 className="mt-5 text-[32px] font-extrabold text-ink">¡Compra Exitosa!</h1>

        <div className="mx-auto mt-6 inline-flex rounded-xl bg-white p-3 shadow-sm">
          <QRCodeSVG value={`foodrush://compra/${order.id}`} size={220} level="M" />
        </div>

        <p className="mt-3 text-[16px] font-medium text-slate-400">ID Compra: #{order.id}</p>

        <div className="mt-7 flex items-start gap-3 rounded-xl bg-[#cbd8e6] px-4 py-4 text-left">
          <Store size={24} className="mt-0.5 shrink-0 text-brand-strong" />
          <p className="text-[17px] font-medium leading-snug text-slate-600">
            Presenta este código QR en{' '}
            <span className="font-extrabold text-brand-strong">{order.store}</span> para retirar tu
            compra
          </p>
        </div>

        <div className="mt-7">
          <PrimaryButton to="/catalogo">Volver al menú</PrimaryButton>
        </div>

        <p className="mt-5 text-[15px] font-medium text-slate-400">
          Puedes acceder a este QR desde Mis Compras
        </p>
      </main>
    </AppShell>
  )
}

import { CheckCircle2, Coffee, EyeOff, Search, Store } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppShell } from '../../components/AppShell'
import { BrandMark } from '../../components/BrandMark'
import { OutlineButton, PrimaryButton } from '../../components/Buttons'
import { Field } from '../../components/Field'
import { GoogleIcon } from '../../components/GoogleIcon'
import { InlineError } from '../../components/InlineError'
import { PageHeader } from '../../components/PageHeader'
import { useToast } from '../../components/ToastProvider'
import { stores } from '../../data/seed'
import { useCart } from '../../hooks/useCart'
import { useAppStore } from '../../store/AppStore'
import { useClientStore } from '../../store/ClientStore'

export function ClientLogin() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { login } = useClientStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!email.trim() || !password) {
      setError('Ingresa tu correo y contraseña.')
      return
    }

    const result = login(email, password)
    if (!result.ok) {
      setError(result.error)
      return
    }

    setError('')
    navigate('/catalogo')
  }

  return (
    <AppShell>
      <form onSubmit={handleSubmit} className="flex min-h-dvh flex-col px-4 pb-10 pt-8">
        <div className="flex justify-center">
          <BrandMark />
        </div>

        <h1 className="mt-7 text-center text-[34px] font-extrabold leading-tight text-[#333333]">
          ¡Qué bueno verte!
        </h1>
        <p className="mt-1 text-center text-[18px] font-medium text-slate-500">
          Accede a tu cuenta para continuar
        </p>

        <div className="mt-8 space-y-5">
          <Field
            label="Correo Electrónico"
            placeholder="tu.correo@universidad.edu"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(value) => {
              setEmail(value)
              setError('')
            }}
          />
          <Field
            label="Contraseña"
            placeholder="Ingresa tu contraseña"
            type="password"
            autoComplete="current-password"
            rightIcon={<EyeOff size={22} />}
            value={password}
            onChange={(value) => {
              setPassword(value)
              setError('')
            }}
          />
        </div>

        {error && <div className="mt-3"><InlineError>{error}</InlineError></div>}

        <button
          type="button"
          onClick={() => showToast('Recuperación de contraseña no disponible en el prototipo', 'info')}
          className="mt-3 self-end text-[15px] font-bold text-brand"
        >
          ¿Olvidaste tu contraseña?
        </button>

        <div className="mt-6 space-y-3">
          <PrimaryButton type="submit">Iniciar Sesión</PrimaryButton>
          <OutlineButton to="/registro">Crear una Cuenta</OutlineButton>
        </div>

        <div className="mt-9 flex items-center gap-4 text-[15px] font-medium text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          O ingresa con
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        <button
          type="button"
          onClick={() => showToast('Ingreso con Google no disponible en el prototipo', 'info')}
          aria-label="Ingresar con Google"
          className="mx-auto mt-6 flex h-[70px] w-[70px] items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm"
        >
          <GoogleIcon size={34} />
        </button>

        <p className="mt-6 text-center text-[14px] font-medium text-slate-500">
          ¿Eres comercio?{' '}
          <Link to="/comercio/login" className="font-extrabold text-brand">
            Accede a tu panel
          </Link>
        </p>

        <p className="mt-3 text-center text-[12px] font-medium text-slate-400">
          Demo: isabella@universidad.cl / 123456
        </p>
      </form>
    </AppShell>
  )
}

export function ClientRegister() {
  const navigate = useNavigate()
  const { register } = useClientStore()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors: Record<string, string> = {}

    if (!name.trim()) nextErrors.name = 'Ingresa tu nombre completo.'
    if (!email.trim() || !email.includes('@')) nextErrors.email = 'Ingresa un correo válido.'
    if (password.length < 6) nextErrors.password = 'Usa al menos 6 caracteres.'
    if (confirmPassword !== password) nextErrors.confirmPassword = 'Las contraseñas no coinciden.'
    if (!accepted) nextErrors.terms = 'Debes aceptar los términos y condiciones.'

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const result = register({ name, email, password })
    if (!result.ok) {
      setErrors({ email: result.error })
      return
    }

    navigate('/seleccionar-comercio')
  }

  return (
    <AppShell>
      <PageHeader backTo="/login" bordered={false} />
      <form onSubmit={handleSubmit} className="px-4 pb-10 pt-8">
        <h1 className="text-[34px] font-extrabold leading-tight text-ink">Crea tu cuenta</h1>
        <p className="mt-2 text-[16px] font-medium text-slate-500">
          Ingresa tus datos para empezar a usar la app.
        </p>

        <div className="mt-8 space-y-5">
          <Field
            label="Nombre completo"
            placeholder="Ingresa tu nombre y apellido"
            value={name}
            onChange={(value) => setName(value)}
            error={errors.name}
          />
          <Field
            label="Correo institucional"
            placeholder="nombre.apellido@universidad.cl"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(value) => setEmail(value)}
            error={errors.email}
          />
          <Field
            label="Contraseña"
            placeholder="Crea una contraseña segura"
            type="password"
            autoComplete="new-password"
            rightIcon={<EyeOff size={22} />}
            value={password}
            onChange={(value) => setPassword(value)}
            error={errors.password}
          />
          <Field
            label="Confirmar contraseña"
            placeholder="Vuelve a escribir la contraseña"
            type="password"
            autoComplete="new-password"
            rightIcon={<EyeOff size={22} />}
            value={confirmPassword}
            onChange={(value) => setConfirmPassword(value)}
            error={errors.confirmPassword}
          />
        </div>

        <label className="mt-6 flex items-start gap-3 text-[15px] font-medium leading-snug text-ink">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(event) => setAccepted(event.target.checked)}
            className="mt-1 h-5 w-5 shrink-0 rounded border-slate-300 accent-[#004e89]"
          />
          <span>
            Al registrarte, aceptas nuestros{' '}
            <span className="font-extrabold text-brand">Términos de Servicio</span> y{' '}
            <span className="font-extrabold text-brand">Política de Privacidad</span>.
          </span>
        </label>
        {errors.terms && <InlineError>{errors.terms}</InlineError>}

        <div className="mt-7 space-y-4">
          <PrimaryButton type="submit">Crear Cuenta</PrimaryButton>
          <p className="text-center text-[15px] font-medium text-ink">
            ¿Ya tienes una cuenta?{' '}
            <Link to="/login" className="font-extrabold text-brand">
              Inicia sesión
            </Link>
          </p>
        </div>
      </form>
    </AppShell>
  )
}

export function StoreSelector() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { products } = useAppStore()
  const { selectedStore, selectStore } = useClientStore()
  const { count } = useCart()

  return (
    <AppShell className="overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="/backgrounds/catalog-blur.png"
          alt=""
          className="h-full w-full scale-105 object-cover blur-[2px]"
        />
        <div className="absolute inset-0 bg-slate-900/35" />
      </div>

      <div className="absolute inset-x-0 bottom-0 rounded-t-[28px] bg-white px-4 pb-6 pt-3 shadow-2xl">
        <div className="mx-auto mb-4 h-1.5 w-16 rounded-full bg-slate-300" />
        <h1 className="text-center text-[23px] font-extrabold text-ink">Selecciona tu Comercio</h1>

        <div className="mt-5 max-h-[58dvh] space-y-3 overflow-y-auto">
          {stores.map((store) => {
            const selected = store.id === selectedStore.id
            const Icon = store.name.includes('Café') ? Coffee : Store
            const productCount = products.filter(
              (product) => product.storeId === store.id && product.visible,
            ).length

            return (
              <button
                key={store.id}
                type="button"
                onClick={() => {
                  if (store.id !== selectedStore.id && count > 0) {
                    showToast('Carrito vaciado al cambiar de comercio', 'info')
                  }
                  selectStore(store.id)
                  navigate('/catalogo')
                }}
                className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-4 text-left transition ${
                  selected ? 'border-brand bg-[#dbe7f3]' : 'border-slate-200 bg-white'
                }`}
              >
                <Icon size={26} strokeWidth={1.8} className="shrink-0 text-brand-strong" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[17px] font-extrabold text-ink">
                    {store.name}
                  </span>
                  <span className="block truncate text-[13px] font-medium text-slate-500">
                    {store.address}
                  </span>
                  <span className="block text-[11px] font-semibold text-slate-400">
                    {productCount > 0
                      ? `${productCount} ${productCount === 1 ? 'producto disponible' : 'productos disponibles'}`
                      : 'Sin productos cargados'}
                  </span>
                </span>
                {selected && <CheckCircle2 size={24} className="shrink-0 text-brand" />}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={() => showToast('Búsqueda de ubicaciones no disponible en el prototipo', 'info')}
          className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#e4ebf3] text-[16px] font-extrabold text-ink"
        >
          <Search size={20} />
          Buscar otra ubicación
        </button>
      </div>
    </AppShell>
  )
}

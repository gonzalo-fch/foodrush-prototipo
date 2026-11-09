import { EyeOff } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppShell } from '../../components/AppShell'
import { BrandMark } from '../../components/BrandMark'
import { PrimaryButton } from '../../components/Buttons'
import { Field } from '../../components/Field'
import { GoogleIcon } from '../../components/GoogleIcon'
import { InlineError } from '../../components/InlineError'
import { useToast } from '../../components/ToastProvider'
import { COMMERCE_DEMO_ACCOUNTS, useCommerceStore } from '../../store/CommerceStore'

export function CommerceAccessPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { login } = useCommerceStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!email.trim() || !password) {
      setError('Ingresa tu correo y contraseña.')
      return
    }

    const result = await login(email, password)
    if (!result.ok) {
      setError(result.error)
      return
    }

    setError('')
    navigate('/comercio/inicio')
  }

  return (
    <AppShell>
      <form onSubmit={handleSubmit} className="flex min-h-dvh flex-col px-4 pb-10 pt-8">
        <div className="flex justify-center">
          <BrandMark />
        </div>

        <h1 className="mt-7 text-center text-[34px] font-extrabold leading-tight text-[#333333]">
          Acceso del comerciante
        </h1>
        <p className="mt-1 text-center text-[18px] font-medium text-slate-500">
          Ingresa al panel de tu negocio
        </p>

        <div className="mt-9 space-y-5">
          <Field
            label="Correo Electrónico"
            placeholder="tu.correo@negocio.com"
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

        <div className="mt-6">
          <PrimaryButton type="submit">Iniciar Sesión</PrimaryButton>
        </div>

        <p className="mt-5 text-center text-[15px] font-medium text-ink">
          ¿No tienes una cuenta?{' '}
          <button
            type="button"
            onClick={() => showToast('Registro de negocios no disponible en el prototipo', 'info')}
            className="font-extrabold text-brand"
          >
            Registrar mi Negocio de Comida
          </button>
        </p>

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

        <p className="mt-5 text-center text-[13px] font-medium text-slate-500">
          ¿Eres cliente?{' '}
          <Link to="/login" className="font-extrabold text-brand">
            Inicia sesión aquí
          </Link>
        </p>

        <div className="mt-6 space-y-1 text-center text-[12px] font-medium text-slate-400">
          <p className="font-bold text-slate-500">Cuentas demo</p>
          {COMMERCE_DEMO_ACCOUNTS.map((account) => (
            <p key={account.email}>
              {account.storeName}: {account.email} / {account.password}
            </p>
          ))}
        </div>
      </form>
    </AppShell>
  )
}

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { stores, users as seedUsers } from '../data/seed'
import { api } from '../lib/api'
import type { CommerceProfile, User } from '../types'

const commerceUsers = seedUsers.filter((user) => user.role === 'comercio')

type CommerceState = {
  currentStoreId: string | null
  commerces: CommerceProfile[]
}

type StoreSettings = {
  open: boolean
  creditEnabled: boolean
  debitEnabled: boolean
}

type AuthResult = { ok: true } | { ok: false; error: string }
type ActionResult = { ok: true } | { ok: false; error: string }

type CommerceStoreValue = {
  currentUser: User | null
  storeId: string
  businessName: string
  businessEmail: string
  open: boolean
  creditEnabled: boolean
  debitEnabled: boolean
  newOrdersNotifications: boolean
  cancellationNotifications: boolean
  openTime: string
  closeTime: string
  loading: boolean
  getStoreSettings: (storeId: string) => StoreSettings
  login: (email: string, password: string) => Promise<AuthResult>
  logout: () => void
  updateBusiness: (name: string, email: string) => Promise<ActionResult>
  changePassword: (
    currentPassword: string,
    nextPassword: string,
  ) => Promise<AuthResult>
  setOpen: (value: boolean) => Promise<ActionResult>
  setCreditEnabled: (value: boolean) => Promise<ActionResult>
  setDebitEnabled: (value: boolean) => Promise<ActionResult>
  setNewOrdersNotifications: (value: boolean) => Promise<ActionResult>
  setCancellationNotifications: (value: boolean) => Promise<ActionResult>
  setHours: (openTime: string, closeTime: string) => Promise<ActionResult>
}

const STORAGE_KEY = 'foodrush-commerce-v3'

const fallbackSettings: StoreSettings = {
  open: true,
  creditEnabled: true,
  debitEnabled: true,
}

function storeNameFor(storeId?: string) {
  return stores.find((store) => store.id === storeId)?.name ?? 'Mi Comercio'
}

const defaultState: CommerceState = {
  currentStoreId: null,
  commerces: [],
}

export const COMMERCE_DEMO_ACCOUNTS = commerceUsers.map((user) => ({
  storeName: storeNameFor(user.storeId),
  email: user.email ?? '',
  password: user.password ?? '123456',
}))

const CommerceStoreContext = createContext<CommerceStoreValue | null>(null)

function loadState(): CommerceState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState

    const parsed = JSON.parse(raw) as Partial<CommerceState>
    return {
      currentStoreId: parsed.currentStoreId ?? null,
      commerces: Array.isArray(parsed.commerces) ? parsed.commerces : [],
    }
  } catch {
    return defaultState
  }
}

function messageOf(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'No se pudo completar la operación.'
}

export function CommerceStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CommerceState>(loadState)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  useEffect(() => {
    let active = true

    async function loadCommerces() {
      try {
        const commerces = await api.getCommerces()
        if (!active) return
        setState((current) => ({ ...current, commerces }))
      } catch {
        // Se conservan los datos locales mientras el API no responde.
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadCommerces()

    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') void loadCommerces()
    }, 5000)
    const onFocus = () => {
      void loadCommerces()
    }

    window.addEventListener('focus', onFocus)

    return () => {
      active = false
      window.clearInterval(interval)
      window.removeEventListener('focus', onFocus)
    }
  }, [])

  const currentProfile =
    state.commerces.find((commerce) => commerce.id === state.currentStoreId) ??
    null

  const value = useMemo<CommerceStoreValue>(() => {
    function getStoreSettings(storeId: string): StoreSettings {
      const commerce = state.commerces.find((entry) => entry.id === storeId)
      if (!commerce) return fallbackSettings

      return {
        open: commerce.open,
        creditEnabled: commerce.creditEnabled,
        debitEnabled: commerce.debitEnabled,
      }
    }

    async function applyUpdate(
      patch: Partial<
        Pick<
          CommerceProfile,
          | 'businessName'
          | 'businessEmail'
          | 'open'
          | 'creditEnabled'
          | 'debitEnabled'
          | 'newOrdersNotifications'
          | 'cancellationNotifications'
          | 'openTime'
          | 'closeTime'
        >
      >,
    ): Promise<ActionResult> {
      if (!currentProfile) {
        return { ok: false, error: 'No hay una sesión de comercio activa.' }
      }

      try {
        const updated = await api.updateCommerce(currentProfile.id, patch)
        setState((current) => ({
          ...current,
          commerces: current.commerces.map((commerce) =>
            commerce.id === updated.id ? updated : commerce,
          ),
        }))
        return { ok: true }
      } catch (requestError) {
        return { ok: false, error: messageOf(requestError) }
      }
    }

    async function login(email: string, password: string): Promise<AuthResult> {
      try {
        const payload = await api.loginCommerce(email, password)
        setState((current) => {
          const exists = current.commerces.some(
            (commerce) => commerce.id === payload.profile.id,
          )
          return {
            ...current,
            currentStoreId: payload.storeId,
            commerces: exists
              ? current.commerces.map((commerce) =>
                  commerce.id === payload.profile.id
                    ? payload.profile
                    : commerce,
                )
              : [payload.profile, ...current.commerces],
          }
        })
        return { ok: true }
      } catch (requestError) {
        return { ok: false, error: messageOf(requestError) }
      }
    }

    function logout() {
      setState((current) => ({ ...current, currentStoreId: null }))
    }

    function updateBusiness(name: string, email: string) {
      return applyUpdate({ businessName: name, businessEmail: email })
    }

    async function changePassword(
      currentPassword: string,
      nextPassword: string,
    ): Promise<AuthResult> {
      if (!currentProfile) {
        return { ok: false, error: 'No hay una sesión de comercio activa.' }
      }

      try {
        await api.changeCommercePassword(
          currentProfile.id,
          currentPassword,
          nextPassword,
        )
        return { ok: true }
      } catch (requestError) {
        return { ok: false, error: messageOf(requestError) }
      }
    }

    return {
      currentUser: currentProfile
        ? {
            id: currentProfile.userId,
            name: currentProfile.businessName,
            email: currentProfile.businessEmail,
            role: 'comercio',
            storeId: currentProfile.id,
          }
        : null,
      storeId: currentProfile?.id ?? '',
      businessName: currentProfile?.businessName ?? '',
      businessEmail: currentProfile?.businessEmail ?? '',
      open: currentProfile?.open ?? true,
      creditEnabled: currentProfile?.creditEnabled ?? true,
      debitEnabled: currentProfile?.debitEnabled ?? true,
      newOrdersNotifications:
        currentProfile?.newOrdersNotifications ?? true,
      cancellationNotifications:
        currentProfile?.cancellationNotifications ?? true,
      openTime: currentProfile?.openTime ?? '08:00',
      closeTime: currentProfile?.closeTime ?? '20:00',
      loading,
      getStoreSettings,
      login,
      logout,
      updateBusiness,
      changePassword,
      setOpen: (value) => applyUpdate({ open: value }),
      setCreditEnabled: (value) => applyUpdate({ creditEnabled: value }),
      setDebitEnabled: (value) => applyUpdate({ debitEnabled: value }),
      setNewOrdersNotifications: (value) =>
        applyUpdate({ newOrdersNotifications: value }),
      setCancellationNotifications: (value) =>
        applyUpdate({ cancellationNotifications: value }),
      setHours: (openTime, closeTime) =>
        applyUpdate({ openTime, closeTime }),
    }
  }, [currentProfile, loading, state.commerces])

  return (
    <CommerceStoreContext.Provider value={value}>
      {children}
    </CommerceStoreContext.Provider>
  )
}

export function useCommerceStore() {
  const context = useContext(CommerceStoreContext)
  if (!context) {
    throw new Error('useCommerceStore debe usarse dentro de CommerceStoreProvider')
  }
  return context
}

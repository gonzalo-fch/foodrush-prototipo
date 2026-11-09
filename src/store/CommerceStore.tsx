import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { stores, users as seedUsers } from '../data/seed'
import type { User } from '../types'

const commerceUsers = seedUsers.filter((user) => user.role === 'comercio')

type CommerceProfile = {
  businessName: string
  businessEmail: string
  password: string
  open: boolean
  creditEnabled: boolean
  debitEnabled: boolean
  newOrdersNotifications: boolean
  cancellationNotifications: boolean
  openTime: string
  closeTime: string
}

type CommerceState = {
  currentUserId: string | null
  profiles: Record<string, CommerceProfile>
}

type StoreSettings = {
  open: boolean
  creditEnabled: boolean
  debitEnabled: boolean
}

type AuthResult = { ok: true } | { ok: false; error: string }

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
  getStoreSettings: (storeId: string) => StoreSettings
  login: (email: string, password: string) => AuthResult
  logout: () => void
  updateBusiness: (name: string, email: string) => void
  changePassword: (current: string, next: string) => AuthResult
  setOpen: (value: boolean) => void
  setCreditEnabled: (value: boolean) => void
  setDebitEnabled: (value: boolean) => void
  setNewOrdersNotifications: (value: boolean) => void
  setCancellationNotifications: (value: boolean) => void
  setHours: (openTime: string, closeTime: string) => void
}

const STORAGE_KEY = 'foodrush-commerce-v2'

const fallbackSettings: StoreSettings = {
  open: true,
  creditEnabled: true,
  debitEnabled: true,
}

function storeNameFor(storeId?: string) {
  return stores.find((store) => store.id === storeId)?.name ?? 'Mi Comercio'
}

const defaultProfiles = commerceUsers.reduce<Record<string, CommerceProfile>>(
  (profiles, user) => {
    profiles[user.id] = {
      businessName: storeNameFor(user.storeId),
      businessEmail: user.email ?? '',
      password: user.password ?? '123456',
      open: true,
      creditEnabled: true,
      debitEnabled: true,
      newOrdersNotifications: true,
      cancellationNotifications: true,
      openTime: '08:00',
      closeTime: '20:00',
    }
    return profiles
  },
  {},
)

const defaultState: CommerceState = {
  currentUserId: null,
  profiles: defaultProfiles,
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
      currentUserId: parsed.currentUserId ?? null,
      profiles: { ...defaultProfiles, ...(parsed.profiles ?? {}) },
    }
  } catch {
    return defaultState
  }
}

export function CommerceStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CommerceState>(loadState)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const value = useMemo<CommerceStoreValue>(() => {
    const currentUser = state.currentUserId
      ? commerceUsers.find((user) => user.id === state.currentUserId) ?? null
      : null
    const activeProfile = currentUser ? state.profiles[currentUser.id] : null

    function updateProfile(patch: Partial<CommerceProfile>) {
      if (!currentUser) return
      setState((current) => {
        const profile = current.profiles[currentUser.id]
        if (!profile) return current
        return {
          ...current,
          profiles: {
            ...current.profiles,
            [currentUser.id]: { ...profile, ...patch },
          },
        }
      })
    }

    function getStoreSettings(storeId: string): StoreSettings {
      const user = commerceUsers.find((entry) => entry.storeId === storeId)
      const profile = user ? state.profiles[user.id] : null
      if (!profile) return fallbackSettings

      return {
        open: profile.open,
        creditEnabled: profile.creditEnabled,
        debitEnabled: profile.debitEnabled,
      }
    }

    function login(email: string, password: string): AuthResult {
      const normalized = email.trim().toLowerCase()
      const user = commerceUsers.find((entry) => {
        const profile = state.profiles[entry.id]
        const loginEmail = profile?.businessEmail || entry.email || ''
        return loginEmail.trim().toLowerCase() === normalized
      })

      if (!user) {
        return { ok: false, error: 'Correo o contraseña incorrectos.' }
      }

      const profile = state.profiles[user.id]
      const expectedPassword = profile?.password ?? user.password
      if (password !== expectedPassword) {
        return { ok: false, error: 'Correo o contraseña incorrectos.' }
      }

      setState((current) => ({ ...current, currentUserId: user.id }))
      return { ok: true }
    }

    function logout() {
      setState((current) => ({ ...current, currentUserId: null }))
    }

    function updateBusiness(name: string, email: string) {
      if (!currentUser) return
      setState((current) => {
        const profile = current.profiles[currentUser.id]
        if (!profile) return current
        return {
          ...current,
          profiles: {
            ...current.profiles,
            [currentUser.id]: {
              ...profile,
              businessName: name.trim() || profile.businessName,
              businessEmail: email.trim() || profile.businessEmail,
            },
          },
        }
      })
    }

    function changePassword(currentPassword: string, nextPassword: string): AuthResult {
      if (!activeProfile) {
        return { ok: false, error: 'No hay una sesión de comercio activa.' }
      }
      if (currentPassword !== activeProfile.password) {
        return { ok: false, error: 'La contraseña actual no es correcta.' }
      }
      if (nextPassword.length < 6) {
        return { ok: false, error: 'La nueva contraseña debe tener al menos 6 caracteres.' }
      }
      updateProfile({ password: nextPassword })
      return { ok: true }
    }

    return {
      currentUser: currentUser
        ? {
            ...currentUser,
            name: activeProfile?.businessName ?? currentUser.name,
            email: activeProfile?.businessEmail ?? currentUser.email,
          }
        : null,
      storeId: currentUser?.storeId ?? '',
      businessName: activeProfile?.businessName ?? '',
      businessEmail: activeProfile?.businessEmail ?? '',
      open: activeProfile?.open ?? true,
      creditEnabled: activeProfile?.creditEnabled ?? true,
      debitEnabled: activeProfile?.debitEnabled ?? true,
      newOrdersNotifications: activeProfile?.newOrdersNotifications ?? true,
      cancellationNotifications: activeProfile?.cancellationNotifications ?? true,
      openTime: activeProfile?.openTime ?? '08:00',
      closeTime: activeProfile?.closeTime ?? '20:00',
      getStoreSettings,
      login,
      logout,
      updateBusiness,
      changePassword,
      setOpen: (value) => updateProfile({ open: value }),
      setCreditEnabled: (value) => updateProfile({ creditEnabled: value }),
      setDebitEnabled: (value) => updateProfile({ debitEnabled: value }),
      setNewOrdersNotifications: (value) =>
        updateProfile({ newOrdersNotifications: value }),
      setCancellationNotifications: (value) =>
        updateProfile({ cancellationNotifications: value }),
      setHours: (openTime, closeTime) => updateProfile({ openTime, closeTime }),
    }
  }, [state])

  return <CommerceStoreContext.Provider value={value}>{children}</CommerceStoreContext.Provider>
}

export function useCommerceStore() {
  const context = useContext(CommerceStoreContext)
  if (!context) {
    throw new Error('useCommerceStore debe usarse dentro de CommerceStoreProvider')
  }
  return context
}

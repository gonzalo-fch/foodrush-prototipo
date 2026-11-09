import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { users as seedUsers } from '../data/seed'
import type { User } from '../types'

const commerceUser = seedUsers.find((user) => user.role === 'comercio')

export const COMMERCE_DEMO_EMAIL = commerceUser?.email ?? 'admin@casinolosnotros.cl'

type CommerceState = {
  currentUserId: string | null
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

const STORAGE_KEY = 'foodrush-commerce-v1'

const defaultState: CommerceState = {
  currentUserId: null,
  businessName: 'Casino Los Notros',
  businessEmail: 'casinolosnotros@gmail.com',
  password: commerceUser?.password ?? '123456',
  open: true,
  creditEnabled: true,
  debitEnabled: true,
  newOrdersNotifications: true,
  cancellationNotifications: true,
  openTime: '08:00',
  closeTime: '20:00',
}

const CommerceStoreContext = createContext<CommerceStoreValue | null>(null)

function loadState(): CommerceState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState
    const parsed = JSON.parse(raw) as Partial<CommerceState>
    return { ...defaultState, ...parsed }
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
    const currentUser =
      state.currentUserId && commerceUser
        ? { ...commerceUser, email: commerceUser.email }
        : null

    function login(email: string, password: string): AuthResult {
      const normalized = email.trim().toLowerCase()
      const validEmail =
        normalized === COMMERCE_DEMO_EMAIL.toLowerCase() ||
        normalized === state.businessEmail.toLowerCase()

      if (!validEmail || password !== state.password) {
        return { ok: false, error: 'Correo o contraseña incorrectos.' }
      }

      setState((current) => ({
        ...current,
        currentUserId: commerceUser?.id ?? 'u-06',
      }))
      return { ok: true }
    }

    function logout() {
      setState((current) => ({ ...current, currentUserId: null }))
    }

    function updateBusiness(name: string, email: string) {
      setState((current) => ({
        ...current,
        businessName: name.trim() || current.businessName,
        businessEmail: email.trim() || current.businessEmail,
      }))
    }

    function changePassword(currentPassword: string, nextPassword: string): AuthResult {
      if (currentPassword !== state.password) {
        return { ok: false, error: 'La contraseña actual no es correcta.' }
      }
      if (nextPassword.length < 6) {
        return { ok: false, error: 'La nueva contraseña debe tener al menos 6 caracteres.' }
      }
      setState((current) => ({ ...current, password: nextPassword }))
      return { ok: true }
    }

    function setOpen(value: boolean) {
      setState((current) => ({ ...current, open: value }))
    }

    function setCreditEnabled(value: boolean) {
      setState((current) => ({ ...current, creditEnabled: value }))
    }

    function setDebitEnabled(value: boolean) {
      setState((current) => ({ ...current, debitEnabled: value }))
    }

    function setNewOrdersNotifications(value: boolean) {
      setState((current) => ({ ...current, newOrdersNotifications: value }))
    }

    function setCancellationNotifications(value: boolean) {
      setState((current) => ({ ...current, cancellationNotifications: value }))
    }

    function setHours(openTime: string, closeTime: string) {
      setState((current) => ({ ...current, openTime, closeTime }))
    }

    return {
      currentUser,
      storeId: commerceUser?.storeId ?? 'casino-los-notros',
      businessName: state.businessName,
      businessEmail: state.businessEmail,
      open: state.open,
      creditEnabled: state.creditEnabled,
      debitEnabled: state.debitEnabled,
      newOrdersNotifications: state.newOrdersNotifications,
      cancellationNotifications: state.cancellationNotifications,
      openTime: state.openTime,
      closeTime: state.closeTime,
      login,
      logout,
      updateBusiness,
      changePassword,
      setOpen,
      setCreditEnabled,
      setDebitEnabled,
      setNewOrdersNotifications,
      setCancellationNotifications,
      setHours,
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

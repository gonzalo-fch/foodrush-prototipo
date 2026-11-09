import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { stores, users as seedUsers } from '../data/seed'
import type { Store, User } from '../types'

type CartLine = {
  productId: string
  quantity: number
}

type ClientState = {
  users: User[]
  currentUserId: string | null
  cart: CartLine[]
  favorites: string[]
  selectedStoreId: string
  readNotificationIds: string[]
  pushNotifications: boolean
}

type AuthResult = { ok: true } | { ok: false; error: string }

type RegisterInput = {
  name: string
  email: string
  password: string
}

type ClientStoreValue = {
  users: User[]
  currentUser: User | null
  selectedStore: Store
  cart: CartLine[]
  cartCount: number
  favorites: string[]
  readNotificationIds: string[]
  pushNotifications: boolean
  login: (email: string, password: string) => AuthResult
  register: (input: RegisterInput) => AuthResult
  logout: () => void
  selectStore: (storeId: string) => void
  addToCart: (productId: string, quantity?: number) => void
  setCartQuantity: (productId: string, quantity: number) => void
  removeFromCart: (productId: string) => void
  clearCart: () => void
  toggleFavorite: (productId: string) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: (ids: string[]) => void
  setPushNotifications: (value: boolean) => void
}

const STORAGE_KEY = 'foodrush-client-v1'

const defaultState: ClientState = {
  users: seedUsers,
  currentUserId: null,
  cart: [
    { productId: 'cp-4', quantity: 1 },
    { productId: 'cp-8', quantity: 1 },
  ],
  favorites: ['cp-9', 'cp-6', 'cp-4', 'cp-2'],
  selectedStoreId: 'casino-los-notros',
  readNotificationIds: [],
  pushNotifications: true,
}

const ClientStoreContext = createContext<ClientStoreValue | null>(null)

function loadState(): ClientState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState

    const parsed = JSON.parse(raw) as Partial<ClientState>
    return {
      users: parsed.users?.length ? parsed.users : defaultState.users,
      currentUserId: parsed.currentUserId ?? null,
      cart: parsed.cart ?? defaultState.cart,
      favorites: parsed.favorites ?? defaultState.favorites,
      selectedStoreId: parsed.selectedStoreId ?? defaultState.selectedStoreId,
      readNotificationIds: parsed.readNotificationIds ?? [],
      pushNotifications: parsed.pushNotifications ?? true,
    }
  } catch {
    return defaultState
  }
}

export function ClientStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ClientState>(loadState)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const value = useMemo<ClientStoreValue>(() => {
    const currentUser = state.users.find((user) => user.id === state.currentUserId) ?? null
    const selectedStore =
      stores.find((store) => store.id === state.selectedStoreId) ?? stores[0]

    function login(email: string, password: string): AuthResult {
      const normalized = email.trim().toLowerCase()
      const user = state.users.find(
        (entry) =>
          entry.role === 'cliente' &&
          entry.email?.toLowerCase() === normalized &&
          entry.password === password,
      )

      if (!user) {
        return { ok: false, error: 'Correo o contraseña incorrectos.' }
      }

      setState((current) => ({ ...current, currentUserId: user.id }))
      return { ok: true }
    }

    function register(input: RegisterInput): AuthResult {
      const normalized = input.email.trim().toLowerCase()
      const exists = state.users.some((entry) => entry.email?.toLowerCase() === normalized)
      if (exists) {
        return { ok: false, error: 'Ya existe una cuenta con ese correo.' }
      }

      const user: User = {
        id: `u-${crypto.randomUUID?.() ?? Date.now()}`,
        name: input.name.trim(),
        email: normalized,
        password: input.password,
        role: 'cliente',
      }

      setState((current) => ({
        ...current,
        users: [...current.users, user],
        currentUserId: user.id,
        selectedStoreId: current.selectedStoreId || stores[0].id,
      }))

      return { ok: true }
    }

    function logout() {
      setState((current) => ({ ...current, currentUserId: null, cart: [] }))
    }

    function selectStore(storeId: string) {
      setState((current) =>
        current.selectedStoreId === storeId
          ? current
          : { ...current, selectedStoreId: storeId, cart: [] },
      )
    }

    function addToCart(productId: string, quantity = 1) {
      setState((current) => {
        const existing = current.cart.find((line) => line.productId === productId)
        const cart = existing
          ? current.cart.map((line) =>
              line.productId === productId
                ? { ...line, quantity: line.quantity + quantity }
                : line,
            )
          : [...current.cart, { productId, quantity }]
        return { ...current, cart }
      })
    }

    function setCartQuantity(productId: string, quantity: number) {
      setState((current) => ({
        ...current,
        cart:
          quantity <= 0
            ? current.cart.filter((line) => line.productId !== productId)
            : current.cart.map((line) =>
                line.productId === productId ? { ...line, quantity } : line,
              ),
      }))
    }

    function removeFromCart(productId: string) {
      setState((current) => ({
        ...current,
        cart: current.cart.filter((line) => line.productId !== productId),
      }))
    }

    function clearCart() {
      setState((current) => ({ ...current, cart: [] }))
    }

    function toggleFavorite(productId: string) {
      setState((current) => ({
        ...current,
        favorites: current.favorites.includes(productId)
          ? current.favorites.filter((id) => id !== productId)
          : [...current.favorites, productId],
      }))
    }

    function markNotificationRead(id: string) {
      setState((current) =>
        current.readNotificationIds.includes(id)
          ? current
          : { ...current, readNotificationIds: [...current.readNotificationIds, id] },
      )
    }

    function markAllNotificationsRead(ids: string[]) {
      setState((current) => ({
        ...current,
        readNotificationIds: Array.from(new Set([...current.readNotificationIds, ...ids])),
      }))
    }

    function setPushNotifications(value: boolean) {
      setState((current) => ({ ...current, pushNotifications: value }))
    }

    const cartCount = state.cart.reduce((sum, line) => sum + line.quantity, 0)

    return {
      users: state.users,
      currentUser,
      selectedStore,
      cart: state.cart,
      cartCount,
      favorites: state.favorites,
      readNotificationIds: state.readNotificationIds,
      pushNotifications: state.pushNotifications,
      login,
      register,
      logout,
      selectStore,
      addToCart,
      setCartQuantity,
      removeFromCart,
      clearCart,
      toggleFavorite,
      markNotificationRead,
      markAllNotificationsRead,
      setPushNotifications,
    }
  }, [state])

  return <ClientStoreContext.Provider value={value}>{children}</ClientStoreContext.Provider>
}

export function useClientStore() {
  const context = useContext(ClientStoreContext)
  if (!context) {
    throw new Error('useClientStore debe usarse dentro de ClientStoreProvider')
  }
  return context
}

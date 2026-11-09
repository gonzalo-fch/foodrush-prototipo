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
import type { Store, User } from '../types'
import { useAppStore } from './AppStore'

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
type ActionResult = { ok: true } | { ok: false; error: string }

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
  logout: () => Promise<void>
  selectStore: (storeId: string) => Promise<void>
  addToCart: (productId: string, quantity?: number) => Promise<ActionResult>
  setCartQuantity: (productId: string, quantity: number) => Promise<ActionResult>
  removeFromCart: (productId: string) => Promise<ActionResult>
  clearCart: () => Promise<ActionResult>
  resetCart: () => void
  toggleFavorite: (productId: string) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: (ids: string[]) => void
  setPushNotifications: (value: boolean) => void
}

const STORAGE_KEY = 'foodrush-client-v2'

const defaultState: ClientState = {
  users: seedUsers,
  currentUserId: null,
  cart: [],
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
      cart: parsed.cart ?? [],
      favorites: parsed.favorites ?? defaultState.favorites,
      selectedStoreId: parsed.selectedStoreId ?? defaultState.selectedStoreId,
      readNotificationIds: parsed.readNotificationIds ?? [],
      pushNotifications: parsed.pushNotifications ?? true,
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

export function ClientStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ClientState>(loadState)
  const { applyProducts } = useAppStore()

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const currentUser =
    state.users.find((user) => user.id === state.currentUserId) ?? null
  const selectedStore =
    stores.find((store) => store.id === state.selectedStoreId) ?? stores[0]

  useEffect(() => {
    if (!currentUser) return

    let active = true
    const storeId = selectedStore.id

    api
      .getCart(currentUser.id, storeId)
      .then((payload) => {
        if (!active) return
        setState((current) => ({ ...current, cart: payload.cart }))
        applyProducts(payload.products)
      })
      .catch(() => {})

    return () => {
      active = false
    }
  }, [applyProducts, currentUser, selectedStore.id])

  const value = useMemo<ClientStoreValue>(() => {
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
      const exists = state.users.some(
        (entry) => entry.email?.toLowerCase() === normalized,
      )
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
        cart: [],
      }))

      return { ok: true }
    }

    async function logout() {
      if (currentUser) {
        try {
          await api.clearCart(currentUser.id, selectedStore.id)
        } catch {
          // La sesión se cierra aunque falle la liberación remota.
        }
      }
      setState((current) => ({
        ...current,
        currentUserId: null,
        cart: [],
      }))
    }

    async function selectStore(storeId: string) {
      if (storeId === state.selectedStoreId) return

      if (currentUser) {
        try {
          await api.clearCart(currentUser.id, state.selectedStoreId)
        } catch {
          // El cambio de comercio continúa aunque falle la liberación remota.
        }
      }

      setState((current) => ({
        ...current,
        selectedStoreId: storeId,
        cart: [],
      }))
    }

    async function applyCart(
      action: () => Promise<{
        products: Parameters<typeof applyProducts>[0]
        cart: CartLine[]
      }>,
    ): Promise<ActionResult> {
      if (!currentUser) {
        return { ok: false, error: 'Debes iniciar sesión para reservar productos.' }
      }

      try {
        const payload = await action()
        setState((current) => ({ ...current, cart: payload.cart }))
        applyProducts(payload.products)
        return { ok: true }
      } catch (requestError) {
        return { ok: false, error: messageOf(requestError) }
      }
    }

    async function addToCart(
      productId: string,
      quantity = 1,
    ): Promise<ActionResult> {
      if (!currentUser) {
        return { ok: false, error: 'Debes iniciar sesión para reservar productos.' }
      }
      if (!Number.isInteger(quantity) || quantity <= 0) {
        return { ok: false, error: 'La cantidad debe ser mayor que cero.' }
      }

      return applyCart(() =>
        api.setCartItem({
          customerId: currentUser.id,
          storeId: selectedStore.id,
          productId,
          quantity,
          mode: 'add',
        }),
      )
    }

    async function setCartQuantity(
      productId: string,
      quantity: number,
    ): Promise<ActionResult> {
      if (!currentUser) {
        return { ok: false, error: 'Debes iniciar sesión para reservar productos.' }
      }

      return applyCart(() =>
        api.setCartItem({
          customerId: currentUser.id,
          storeId: selectedStore.id,
          productId,
          quantity,
        }),
      )
    }

    async function removeFromCart(productId: string): Promise<ActionResult> {
      if (!currentUser) {
        return { ok: false, error: 'Debes iniciar sesión para reservar productos.' }
      }

      return applyCart(() =>
        api.removeCartItem(currentUser.id, selectedStore.id, productId),
      )
    }

    async function clearCart(): Promise<ActionResult> {
      if (!currentUser) {
        setState((current) => ({ ...current, cart: [] }))
        return { ok: true }
      }

      return applyCart(() =>
        api.clearCart(currentUser.id, selectedStore.id),
      )
    }

    function resetCart() {
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
          : {
              ...current,
              readNotificationIds: [...current.readNotificationIds, id],
            },
      )
    }

    function markAllNotificationsRead(ids: string[]) {
      setState((current) => ({
        ...current,
        readNotificationIds: Array.from(
          new Set([...current.readNotificationIds, ...ids]),
        ),
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
      resetCart,
      toggleFavorite,
      markNotificationRead,
      markAllNotificationsRead,
      setPushNotifications,
    }
  }, [applyProducts, currentUser, selectedStore, state])

  return (
    <ClientStoreContext.Provider value={value}>
      {children}
    </ClientStoreContext.Provider>
  )
}

export function useClientStore() {
  const context = useContext(ClientStoreContext)
  if (!context) {
    throw new Error('useClientStore debe usarse dentro de ClientStoreProvider')
  }
  return context
}

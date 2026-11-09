import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  api,
  type AddProductPayload,
  type BootstrapPayload,
  type CreateOrderPayload,
  type UpdateProductPayload,
} from '../lib/api'
import type { CommerceProduct, InventoryMovement, Order } from '../types'

type StoreState = {
  products: CommerceProduct[]
  orders: Order[]
  movements: InventoryMovement[]
}

type AppStoreValue = StoreState & {
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  applyProducts: (products: CommerceProduct[]) => void
  addProduct: (input: AddProductPayload) => Promise<void>
  updateProduct: (id: string, input: UpdateProductPayload) => Promise<void>
  deleteProduct: (id: string) => Promise<void>
  setVisibility: (id: string, visible: boolean) => Promise<void>
  adjustStock: (id: string, delta: number) => Promise<void>
  completeOrder: (id: string) => Promise<void>
  cancelOrder: (id: string) => Promise<void>
  createOrder: (input: CreateOrderPayload) => Promise<Order>
}

const emptyState: StoreState = {
  products: [],
  orders: [],
  movements: [],
}

const AppStoreContext = createContext<AppStoreValue | null>(null)

function messageOf(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'No se pudo completar la operación.'
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoreState>(emptyState)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const apply = useCallback((payload: BootstrapPayload) => {
    setState({
      products: payload.products,
      orders: payload.orders,
      movements: payload.movements,
    })
    setError(null)
  }, [])

  const refresh = useCallback(async () => {
    try {
      apply(await api.bootstrap())
    } catch (requestError) {
      setError(messageOf(requestError))
    } finally {
      setLoading(false)
    }
  }, [apply])

  const applyProducts = useCallback((products: CommerceProduct[]) => {
    setState((current) => ({ ...current, products }))
  }, [])

  useEffect(() => {
    void refresh()

    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh()
    }, 5000)
    const onFocus = () => {
      void refresh()
    }

    window.addEventListener('focus', onFocus)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', onFocus)
    }
  }, [refresh])

  const value = useMemo<AppStoreValue>(() => {
    async function run(action: () => Promise<BootstrapPayload>) {
      try {
        apply(await action())
      } catch (requestError) {
        setError(messageOf(requestError))
        throw requestError
      }
    }

    async function createOrder(input: CreateOrderPayload) {
      try {
        const payload = await api.createOrder(input)
        apply(payload)
        return payload.order
      } catch (requestError) {
        setError(messageOf(requestError))
        throw requestError
      }
    }

    return {
      ...state,
      loading,
      error,
      refresh,
      applyProducts,
      addProduct: (input) => run(() => api.addProduct(input)),
      updateProduct: (id, input) => run(() => api.updateProduct(id, input)),
      deleteProduct: (id) => run(() => api.deleteProduct(id)),
      setVisibility: (id, visible) => run(() => api.setVisibility(id, visible)),
      adjustStock: (id, delta) => run(() => api.adjustStock(id, delta)),
      completeOrder: (id) => run(() => api.completeOrder(id)),
      cancelOrder: (id) => run(() => api.cancelOrder(id)),
      createOrder,
    }
  }, [apply, applyProducts, error, loading, refresh, state])

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>
}

export function useAppStore() {
  const context = useContext(AppStoreContext)
  if (!context) {
    throw new Error('useAppStore debe usarse dentro de AppStoreProvider')
  }
  return context
}

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type {
  CommerceProduct,
  InventoryMovement,
  MovementType,
  Order,
  OrderItem,
  OrderStatus,
} from '../types'
import { seedMovements, seedOrders, seedProducts } from './seed'

type StoreState = {
  products: CommerceProduct[]
  orders: Order[]
  movements: InventoryMovement[]
}

type AddProductInput = {
  storeId: string
  name: string
  description?: string
  price: number
  stock: number
  category?: string
  weight?: string
  image?: string
  visible?: boolean
}

type UpdateProductInput = Partial<Omit<CommerceProduct, 'id'>>

type CreateOrderInput = {
  customer: string
  customerId?: string
  store?: string
  storeId?: string
  paymentMethod: string
  items: Array<{ productId: string; quantity: number }>
}

type AppStoreValue = {
  products: CommerceProduct[]
  orders: Order[]
  movements: InventoryMovement[]
  addProduct: (input: AddProductInput) => CommerceProduct
  updateProduct: (id: string, input: UpdateProductInput) => void
  deleteProduct: (id: string) => void
  setVisibility: (id: string, visible: boolean) => void
  adjustStock: (id: string, delta: number) => void
  completeOrder: (id: string) => void
  cancelOrder: (id: string) => void
  createOrder: (input: CreateOrderInput) => Order
}

const STORAGE_KEY = 'foodrush-state-v6'

const defaultState: StoreState = {
  products: seedProducts,
  orders: seedOrders,
  movements: seedMovements,
}

const AppStoreContext = createContext<AppStoreValue | null>(null)

function now() {
  return new Date().toLocaleString('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function newId(prefix: string) {
  return `${prefix}-${crypto.randomUUID?.() ?? Date.now()}`
}

function loadState(): StoreState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState

    const parsed = JSON.parse(raw) as Partial<StoreState>
    return {
      products: parsed.products ?? defaultState.products,
      orders: parsed.orders ?? defaultState.orders,
      movements: parsed.movements ?? defaultState.movements,
    }
  } catch {
    return defaultState
  }
}

function movement(
  product: Pick<CommerceProduct, 'id' | 'name' | 'storeId'>,
  type: MovementType,
  quantity: number,
  note: string,
  orderId?: string,
): InventoryMovement {
  return {
    id: newId('mv'),
    storeId: product.storeId,
    productId: product.id,
    productName: product.name,
    type,
    quantity,
    orderId,
    date: now(),
    note,
  }
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoreState>(loadState)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const value = useMemo<AppStoreValue>(() => {
    function addProduct(input: AddProductInput) {
      const product: CommerceProduct = {
        id: newId('cp'),
        storeId: input.storeId,
        name: input.name.trim(),
        description: input.description?.trim(),
        price: input.price,
        stock: Math.max(0, Math.floor(input.stock)),
        category: input.category,
        weight: input.weight,
        image: input.image ?? '/products/croissant.png',
        visible: input.visible ?? true,
      }

      setState((current) => ({
        ...current,
        products: [product, ...current.products],
        movements:
          product.stock > 0
            ? [
                movement(product, 'reposicion', product.stock, 'Stock inicial'),
                ...current.movements,
              ]
            : current.movements,
      }))

      return product
    }

    function updateProduct(id: string, input: UpdateProductInput) {
      setState((current) => {
        const product = current.products.find((item) => item.id === id)
        if (!product) return current

        const nextStock =
          input.stock !== undefined ? Math.max(0, Math.floor(input.stock)) : product.stock
        const delta = nextStock - product.stock
        const updated: CommerceProduct = {
          ...product,
          ...input,
          name: input.name?.trim() || product.name,
          stock: nextStock,
        }

        return {
          ...current,
          products: current.products.map((item) => (item.id === id ? updated : item)),
          movements:
            delta !== 0
              ? [
                  movement(
                    updated,
                    delta > 0 ? 'reposicion' : 'ajuste',
                    delta,
                    'Actualización manual de stock',
                  ),
                  ...current.movements,
                ]
              : current.movements,
        }
      })
    }

    function deleteProduct(id: string) {
      setState((current) => ({
        ...current,
        products: current.products.filter((item) => item.id !== id),
      }))
    }

    function setVisibility(id: string, visible: boolean) {
      setState((current) => ({
        ...current,
        products: current.products.map((item) => (item.id === id ? { ...item, visible } : item)),
      }))
    }

    function adjustStock(id: string, delta: number) {
      setState((current) => {
        const product = current.products.find((item) => item.id === id)
        if (!product) return current

        const nextStock = Math.max(0, product.stock + delta)
        const appliedDelta = nextStock - product.stock
        if (appliedDelta === 0) return current

        const updated = { ...product, stock: nextStock }

        return {
          ...current,
          products: current.products.map((item) => (item.id === id ? updated : item)),
          movements: [
            movement(
              updated,
              appliedDelta > 0 ? 'reposicion' : 'ajuste',
              appliedDelta,
              'Ajuste manual de stock',
            ),
            ...current.movements,
          ],
        }
      })
    }

    function setOrderStatus(id: string, status: OrderStatus) {
      setState((current) => ({
        ...current,
        orders: current.orders.map((order) => (order.id === id ? { ...order, status } : order)),
      }))
    }

    function completeOrder(id: string) {
      setOrderStatus(id, 'retirado')
    }

    function cancelOrder(id: string) {
      setState((current) => {
        const order = current.orders.find((item) => item.id === id)
        if (!order || order.status !== 'pendiente') return current

        const restored = order.items
          .map((item) => {
            const product = current.products.find((entry) => entry.id === item.productId)
            return product
              ? {
                  product,
                  item,
                }
              : null
          })
          .filter((entry): entry is { product: CommerceProduct; item: OrderItem } => Boolean(entry))

        const products = current.products.map((product) => {
          const entry = restored.find((item) => item.product.id === product.id)
          return entry ? { ...product, stock: product.stock + entry.item.quantity } : product
        })

        const movements = restored.map(({ product, item }) =>
          movement(product, 'reposicion', item.quantity, 'Reposición por cancelación', order.id),
        )

        return {
          ...current,
          products,
          orders: current.orders.map((item) =>
            item.id === id ? { ...item, status: 'cancelado' } : item,
          ),
          movements: [...movements, ...current.movements],
        }
      })
    }

    function createOrder(input: CreateOrderInput) {
      const items: OrderItem[] = input.items.map(({ productId, quantity }) => {
        const product = state.products.find((entry) => entry.id === productId)
        if (!product) {
          throw new Error('Producto no encontrado')
        }
        if (quantity <= 0 || quantity > product.stock) {
          throw new Error(`Stock insuficiente para ${product.name}`)
        }
        return {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity,
          image: product.image,
        }
      })

      const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
      const nextId = String(
        Math.max(...state.orders.map((order) => Number(order.id) || 0), 1000) + 1,
      )

      const order: Order = {
        id: nextId,
        customer: input.customer,
        customerId: input.customerId,
        store: input.store ?? 'Casino Los Notros',
        storeId: input.storeId ?? 'casino-los-notros',
        date: now(),
        createdAt: new Date().toISOString(),
        status: 'pendiente',
        items,
        total,
        paymentMethod: input.paymentMethod,
      }

      setState((current) => {
        const products = current.products.map((product) => {
          const item = items.find((entry) => entry.productId === product.id)
          return item ? { ...product, stock: product.stock - item.quantity } : product
        })
        const movements = items.map((item) => {
          const product = current.products.find((entry) => entry.id === item.productId)
          return movement(
            product ?? {
              id: item.productId,
              name: item.name,
              storeId: input.storeId ?? 'casino-los-notros',
            },
            'venta',
            -item.quantity,
            'Descuento por venta',
            order.id,
          )
        })

        return {
          ...current,
          products,
          orders: [order, ...current.orders],
          movements: [...movements, ...current.movements],
        }
      })

      return order
    }

    return {
      products: state.products,
      orders: state.orders,
      movements: state.movements,
      addProduct,
      updateProduct,
      deleteProduct,
      setVisibility,
      adjustStock,
      completeOrder,
      cancelOrder,
      createOrder,
    }
  }, [state])

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>
}

export function useAppStore() {
  const context = useContext(AppStoreContext)
  if (!context) {
    throw new Error('useAppStore debe usarse dentro de AppStoreProvider')
  }
  return context
}

import type { CommerceProduct, InventoryMovement, Order } from '../types'

export type BootstrapPayload = {
  products: CommerceProduct[]
  orders: Order[]
  movements: InventoryMovement[]
}

type OrderPayload = BootstrapPayload & { order: Order }
type ProductPayload = BootstrapPayload & { product: CommerceProduct }

export type CreateOrderPayload = {
  customer: string
  customerId?: string
  store?: string
  storeId: string
  paymentMethod: string
  items: Array<{ productId: string; quantity: number }>
}

export type AddProductPayload = {
  storeId: string
  name: string
  description?: string
  price: number
  stock: number
  category?: string
  weight?: string
  unit?: string
  image?: string
  visible?: boolean
}

export type UpdateProductPayload = Partial<Omit<CommerceProduct, 'id'>>

const API_BASE = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '')

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response

  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    })
  } catch {
    throw new Error('No se pudo conectar con el servidor.')
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null
    throw new Error(body?.error ?? 'No se pudo completar la operación.')
  }

  return (await response.json()) as T
}

export const api = {
  bootstrap: () => request<BootstrapPayload>('/bootstrap'),
  createOrder: (input: CreateOrderPayload) =>
    request<OrderPayload>('/orders', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  addProduct: (input: AddProductPayload) =>
    request<ProductPayload>('/products', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  updateProduct: (id: string, input: UpdateProductPayload) =>
    request<ProductPayload>(`/products/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  deleteProduct: (id: string) =>
    request<BootstrapPayload>(`/products/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
  setVisibility: (id: string, visible: boolean) =>
    request<ProductPayload>(`/products/${encodeURIComponent(id)}/visibility`, {
      method: 'PATCH',
      body: JSON.stringify({ visible }),
    }),
  adjustStock: (id: string, delta: number) =>
    request<BootstrapPayload>(`/products/${encodeURIComponent(id)}/stock`, {
      method: 'POST',
      body: JSON.stringify({ delta }),
    }),
  completeOrder: (id: string) =>
    request<OrderPayload>(`/orders/${encodeURIComponent(id)}/complete`, {
      method: 'PATCH',
    }),
  cancelOrder: (id: string) =>
    request<OrderPayload>(`/orders/${encodeURIComponent(id)}/cancel`, {
      method: 'POST',
    }),
}

import type {
  CommerceProduct,
  CommerceProfile,
  InventoryMovement,
  Order,
  Seal,
  User,
} from '../types'

export type BootstrapPayload = {
  products: CommerceProduct[]
  orders: Order[]
  movements: InventoryMovement[]
}

type OrderPayload = BootstrapPayload & { order: Order }
type ProductPayload = BootstrapPayload & { product: CommerceProduct }
export type CartPayload = {
  products: CommerceProduct[]
  cart: Array<{ productId: string; quantity: number }>
}

export type SetCartItemPayload = {
  customerId: string
  storeId: string
  productId: string
  quantity: number
  mode?: 'set' | 'add'
}

export type CommerceLoginPayload = {
  storeId: string
  profile: CommerceProfile
}

export type CommerceUpdatePayload = Partial<
  Omit<CommerceProfile, 'id' | 'userId'>
>

export type RegisterClientPayload = {
  name: string
  email: string
  password: string
}

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
  sellos?: Seal[]
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
  loginClient: (email: string, password: string) =>
    request<User>('/auth/client/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  registerClient: (input: RegisterClientPayload) =>
    request<User>('/auth/client/register', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  loginCommerce: (email: string, password: string) =>
    request<CommerceLoginPayload>('/auth/commerce/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  getCommerces: () => request<CommerceProfile[]>('/commerces'),
  updateCommerce: (storeId: string, input: CommerceUpdatePayload) =>
    request<CommerceProfile>(`/commerces/${encodeURIComponent(storeId)}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  changeCommercePassword: (
    storeId: string,
    currentPassword: string,
    nextPassword: string,
  ) =>
    request<{ ok: true }>(
      `/commerces/${encodeURIComponent(storeId)}/password`,
      {
        method: 'POST',
        body: JSON.stringify({ currentPassword, nextPassword }),
      },
    ),
  getCart: (customerId: string, storeId: string) =>
    request<CartPayload>(
      `/cart?customerId=${encodeURIComponent(customerId)}&storeId=${encodeURIComponent(storeId)}`,
    ),
  setCartItem: (input: SetCartItemPayload) =>
    request<CartPayload>('/cart/items', {
      method: 'PUT',
      body: JSON.stringify(input),
    }),
  removeCartItem: (customerId: string, storeId: string, productId: string) =>
    request<CartPayload>(
      `/cart/items/${encodeURIComponent(productId)}?customerId=${encodeURIComponent(customerId)}&storeId=${encodeURIComponent(storeId)}`,
      { method: 'DELETE' },
    ),
  clearCart: (customerId: string, storeId: string) =>
    request<CartPayload>(
      `/cart?customerId=${encodeURIComponent(customerId)}&storeId=${encodeURIComponent(storeId)}`,
      { method: 'DELETE' },
    ),
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

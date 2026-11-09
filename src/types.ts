export type CategoryId =
  | 'todo'
  | 'sin-sellos'
  | 'snacks'
  | 'sandwiches'
  | 'bebidas'
  | 'almuerzos'

export type Category = {
  id: CategoryId
  label: string
}

export type Seal = 'calorias' | 'grasas-saturadas' | 'sodio' | 'azucares'

export type Product = {
  id: string
  name: string
  unit: string
  price: number
  image: string
  stock: number
  available?: number
  reserved?: number
  category: Exclude<CategoryId, 'todo'>
  sinSellos?: boolean
  sellos?: Seal[]
}

export type Store = {
  id: string
  name: string
  address?: string
  image?: string
}

export type User = {
  id: string
  name: string
  email?: string
  password?: string
  avatar?: string
  role: 'cliente' | 'comercio'
  storeId?: string
}

export type CommerceProduct = {
  id: string
  storeId: string
  name: string
  price: number
  image: string
  visible: boolean
  stock: number
  reserved?: number
  available?: number
  description?: string
  category?: string
  weight?: string
  unit?: string
  sinSellos?: boolean
  sellos?: Seal[]
}

export type Reservation = {
  id: string
  storeId: string
  productId: string
  customerId: string
  quantity: number
  orderId?: string
  status: 'cart' | 'order'
  createdAt: string
  updatedAt: string
}

export type OrderStatus = 'pendiente' | 'retirado' | 'cancelado'

export type OrderItem = {
  productId: string
  name: string
  price: number
  quantity: number
  image: string
}

export type Order = {
  id: string
  customer: string
  customerId?: string
  store: string
  storeId: string
  date: string
  createdAt?: string
  status: OrderStatus
  items: OrderItem[]
  total: number
  paymentMethod: string
}

export type MovementType = 'venta' | 'ajuste' | 'reposicion'

export type InventoryMovement = {
  id: string
  storeId: string
  productId: string
  productName: string
  type: MovementType
  quantity: number
  orderId?: string
  date: string
  note: string
}

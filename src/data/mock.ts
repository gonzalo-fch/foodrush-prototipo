export type CartItem = {
  id: string
  name: string
  price: number
  quantity: number
  image: string
  stock: number
}

export const cartItems: CartItem[] = [
  {
    id: 'p-03',
    name: 'Ensalada César',
    price: 3500,
    quantity: 1,
    image: '/products/cart-ensalada.png',
    stock: 12,
  },
  {
    id: 'p-06',
    name: 'Jumex Piña',
    price: 1150,
    quantity: 1,
    image: '/products/cart-jumex.png',
    stock: 4,
  },
]

export type FavoriteItem = {
  id: string
  name: string
  price: number
  image: string
}

export const favoriteItems: FavoriteItem[] = [
  { id: 'f-01', name: 'Sandwich + Coca Cola', price: 2900, image: '/products/sandwich-coca.png' },
  { id: 'p-04', name: 'Agua Mineral', price: 690, image: '/products/fav-agua.png' },
  { id: 'p-03', name: 'Ensalada César', price: 3500, image: '/products/fav-ensalada.png' },
  { id: 'p-06', name: 'Jumex Piña', price: 1150, image: '/products/fav-jumex.png' },
]

export type Purchase = {
  id: string
  store: string
  date: string
  total: number
  status: string
  tone: 'green' | 'blue' | 'red'
  showQr?: boolean
  showCancel?: boolean
}

export const purchases: Purchase[] = [
  {
    id: '10234',
    store: 'Casino Los Notros',
    date: '15 de Octubre de 2025',
    total: 5400,
    status: 'Retiro Pendiente',
    tone: 'green',
    showQr: true,
    showCancel: true,
  },
  {
    id: '10231',
    store: 'Casino Los Notros',
    date: '14 de Octubre de 2025',
    total: 8200,
    status: 'Retirado',
    tone: 'blue',
  },
  {
    id: '10225',
    store: 'Kiosko Edificio D',
    date: '12 de Octubre de 2025',
    total: 3500,
    status: 'Cancelado',
    tone: 'red',
  },
]

export type NotificationItem = {
  id: string
  title: string
  body: string
  time: string
  icon: 'tag' | 'bag' | 'card' | 'coffee'
  unread?: boolean
}

export const newNotifications: NotificationItem[] = [
  {
    id: 'n-1',
    title: '¡Oferta del Día!',
    body: 'Aprovecha el 2x1 en todos los cafés.',
    time: 'Hace 5 min',
    icon: 'tag',
    unread: true,
  },
  {
    id: 'n-2',
    title: 'Compra Confirmada',
    body: 'Tu compra #1234 fue realizada correctamente',
    time: 'Hace 20 min',
    icon: 'bag',
    unread: true,
  },
]

export const previousNotifications: NotificationItem[] = [
  {
    id: 'n-3',
    title: 'Pago en Efectivo Exitoso',
    body: 'Tu pago de $2.366 fue procesado.',
    time: 'Ayer 15:28',
    icon: 'card',
  },
  {
    id: 'n-4',
    title: '¡Nuevo Producto!',
    body: 'Prueba nuestro nuevo Frappuccino en Casino Los Notros.',
    time: '25 Mayo',
    icon: 'coffee',
  },
]

export type CommerceProduct = {
  id: string
  name: string
  price: number
  image: string
  visible: boolean
  inStock: boolean
}

export const commerceProducts: CommerceProduct[] = [
  {
    id: 'cp-1',
    name: 'Croissant de Almendras',
    price: 2500,
    image: '/products/croissant.png',
    visible: true,
    inStock: true,
  },
  {
    id: 'cp-2',
    name: 'Jumex Piña',
    price: 1150,
    image: '/products/jumex-clean.png',
    visible: true,
    inStock: false,
  },
  {
    id: 'cp-3',
    name: 'Coca cola',
    price: 1800,
    image: '/products/coca-cola.png',
    visible: false,
    inStock: true,
  },
]

export type SaleItem = {
  id: string
  title: string
  body: string
  time: string
  icon: 'bag' | 'check' | 'x' | 'receipt'
  highlighted?: boolean
}

export const salesFeed: SaleItem[] = [
  {
    id: 's-1',
    title: 'Nueva Venta',
    body: 'Total: $1.250\nVenta de Ana Pérez. Pedido #123.',
    time: 'Hace 5 min',
    icon: 'bag',
    highlighted: true,
  },
  {
    id: 's-2',
    title: 'Pedido #122 Cerrado',
    body: 'El pedido de Juan Gómez ha sido completado.',
    time: 'Hace 15 min',
    icon: 'check',
  },
  {
    id: 's-3',
    title: 'Pedido #121 Cancelado',
    body: 'El cliente ha cancelado el pedido.',
    time: 'Ayer a las 14:20',
    icon: 'x',
  },
  {
    id: 's-4',
    title: 'Resumen de ventas de ayer',
    body: 'Total: $56.050',
    time: 'Ayer a las 23:59',
    icon: 'receipt',
  },
]

export type TopProduct = {
  id: string
  name: string
  sold: number
  price: number
  image: string
}

export const topProducts: TopProduct[] = [
  { id: 'tp-1', name: 'Almuerzo Ejecutivo', sold: 32, price: 3660, image: '/products/utensilios.png' },
  { id: 'tp-2', name: 'Ensalada César', sold: 28, price: 3500, image: '/products/ensalada.png' },
  { id: 'tp-3', name: 'Café', sold: 15, price: 1200, image: '/products/cafe.png' },
]

export const nearbyStores = [
  { id: 'st-1', name: 'Casino Los Notros', address: 'Campus Andrés Bello', icon: 'store' as const },
  { id: 'st-2', name: 'Casino de Las Araucarias', address: 'Campus Andrés Bello', icon: 'store' as const },
  { id: 'st-3', name: 'Imperio - Food Truck', address: 'Uruguay 1552', icon: 'store' as const },
  { id: 'st-4', name: 'Café de la Tía', address: 'Montevideo 810', icon: 'coffee' as const },
  {
    id: 'st-5',
    name: 'Kiosko Edificio D',
    address: 'Edificio D - Campus Andrés Bello',
    icon: 'store' as const,
  },
]

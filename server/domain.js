import { randomUUID } from 'node:crypto'

export function newId(prefix) {
  return `${prefix}-${randomUUID()}`
}

export function httpError(status, message) {
  const error = new Error(message)
  error.status = status
  return error
}

export function nowDisplay() {
  return new Date().toLocaleString('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function buildMovement(product, type, quantity, note, orderId) {
  return {
    id: newId('mv'),
    storeId: product.storeId,
    productId: product.id,
    productName: product.name,
    type,
    quantity,
    orderId,
    date: nowDisplay(),
    createdAt: new Date().toISOString(),
    note,
  }
}

const SEAL_VALUES = new Set([
  'calorias',
  'grasas-saturadas',
  'sodio',
  'azucares',
])

export function normalizeSellos(value) {
  if (!Array.isArray(value)) return []
  return Array.from(new Set(value.filter((seal) => SEAL_VALUES.has(seal))))
}

export function withAvailability(product) {
  const stock = Math.max(0, Number(product.stock) || 0)
  const reserved = Math.max(0, Number(product.reserved) || 0)
  const sellos = normalizeSellos(product.sellos)

  return {
    ...product,
    stock,
    reserved,
    available: Math.max(0, stock - reserved),
    sellos,
    sinSellos: sellos.length === 0,
  }
}

export function buildProduct(input) {
  const price = Number(input.price)
  const stock = Math.floor(Number(input.stock))
  const sellos = normalizeSellos(input.sellos)

  if (!input.storeId) throw httpError(400, 'Falta el comercio del producto.')
  if (!input.name?.trim()) throw httpError(400, 'Ingresa el nombre del producto.')
  if (!Number.isFinite(price) || price <= 0) {
    throw httpError(400, 'Ingresa un precio válido mayor a 0.')
  }
  if (!Number.isFinite(stock) || stock < 0) {
    throw httpError(400, 'Ingresa una cantidad válida (0 o más).')
  }

  return {
    id: newId('cp'),
    storeId: input.storeId,
    name: input.name.trim(),
    description: input.description?.trim(),
    price,
    stock,
    category: input.category,
    weight: input.weight,
    unit: input.unit,
    image: input.image ?? '/products/croissant.png',
    visible: input.visible ?? true,
    reserved: 0,
    sellos,
    sinSellos: sellos.length === 0,
    sortIndex: -Date.now(),
  }
}

export function aggregateOrderItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw httpError(400, 'El carrito está vacío.')
  }

  const grouped = new Map()

  for (const item of items) {
    const productId = String(item?.productId ?? '')
    const quantity = Number(item?.quantity)

    if (!productId) throw httpError(400, 'Hay un producto inválido en el carrito.')
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw httpError(400, 'Las cantidades deben ser números enteros mayores que cero.')
    }

    grouped.set(productId, (grouped.get(productId) ?? 0) + quantity)
  }

  return Array.from(grouped, ([productId, quantity]) => ({ productId, quantity }))
}

export function validateOrderInput(input) {
  if (!input?.customer?.trim()) throw httpError(400, 'Falta el cliente de la compra.')
  if (!input?.storeId) throw httpError(400, 'Falta el comercio de la compra.')
  if (!input?.paymentMethod?.trim()) {
    throw httpError(400, 'Falta el método de pago de la compra.')
  }
}

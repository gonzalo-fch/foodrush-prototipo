import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  aggregateOrderItems,
  buildMovement,
  buildProduct,
  httpError,
  nowDisplay,
  validateOrderInput,
} from './domain.js'
import { createSeedState } from './seed.js'

const defaultDataFile = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '.data',
  'state.json',
)

function clone(value) {
  return structuredClone(value)
}

function loadState(dataFile) {
  try {
    const raw = fs.readFileSync(dataFile, 'utf8')
    const parsed = JSON.parse(raw)
    if (
      !Array.isArray(parsed.products) ||
      !Array.isArray(parsed.orders) ||
      !Array.isArray(parsed.movements)
    ) {
      throw new Error('Estado inválido')
    }
    return parsed
  } catch {
    return createSeedState()
  }
}

function storeName(state, storeId) {
  return state.stores.find((store) => store.id === storeId)?.name ?? 'Comercio'
}

export function createFileRepository({ dataFile = defaultDataFile } = {}) {
  const dataDir = path.dirname(dataFile)
  const state = loadState(dataFile)

  function persist() {
    fs.mkdirSync(dataDir, { recursive: true })
    fs.writeFileSync(dataFile, JSON.stringify(state, null, 2))
  }

  function bootstrap() {
    return clone({
      products: state.products,
      orders: state.orders,
      movements: state.movements,
    })
  }

  persist()

  return {
    backend: 'file',

    async bootstrap() {
      return bootstrap()
    },

    async createOrder(input) {
      validateOrderInput(input)
      const requested = aggregateOrderItems(input.items)

      const entries = requested.map(({ productId, quantity }) => {
        const product = state.products.find(
          (entry) => entry.id === productId && entry.storeId === input.storeId,
        )
        if (!product) throw httpError(404, `Producto no encontrado: ${productId}.`)
        if (!product.visible) {
          throw httpError(400, `El producto ${product.name} no está disponible.`)
        }
        if (quantity > product.stock) {
          throw httpError(400, `Stock insuficiente para ${product.name}.`)
        }
        return { product, quantity }
      })

      const items = entries.map(({ product, quantity }) => ({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity,
        image: product.image,
      }))

      entries.forEach(({ product, quantity }) => {
        product.stock -= quantity
      })

      state.orderCounter = (Number(state.orderCounter) || 1000) + 1
      const orderId = String(state.orderCounter)
      const order = {
        id: orderId,
        customer: input.customer.trim(),
        customerId: input.customerId,
        store: input.store ?? storeName(state, input.storeId),
        storeId: input.storeId,
        date: nowDisplay(),
        createdAt: new Date().toISOString(),
        status: 'pendiente',
        items,
        total: items.reduce((total, item) => total + item.price * item.quantity, 0),
        paymentMethod: input.paymentMethod.trim(),
      }

      const movements = entries.map(({ product, quantity }) =>
        buildMovement(product, 'venta', -quantity, 'Descuento por venta', orderId),
      )

      state.orders.unshift(order)
      state.movements.unshift(...movements)
      persist()

      return { ...bootstrap(), order: clone(order) }
    },

    async addProduct(input) {
      const product = buildProduct(input)
      state.products.unshift(product)

      if (product.stock > 0) {
        state.movements.unshift(
          buildMovement(product, 'reposicion', product.stock, 'Stock inicial'),
        )
      }

      persist()
      return { ...bootstrap(), product: clone(product) }
    },

    async updateProduct(id, input) {
      const product = state.products.find((entry) => entry.id === id)
      if (!product) throw httpError(404, 'Producto no encontrado.')

      const nextStock =
        input.stock !== undefined
          ? Math.max(0, Math.floor(Number(input.stock)))
          : product.stock
      if (!Number.isFinite(nextStock)) {
        throw httpError(400, 'Ingresa una cantidad válida (0 o más).')
      }

      const nextPrice = input.price !== undefined ? Number(input.price) : product.price
      if (!Number.isFinite(nextPrice) || nextPrice <= 0) {
        throw httpError(400, 'Ingresa un precio válido mayor a 0.')
      }

      const delta = nextStock - product.stock
      Object.assign(product, input, {
        id: product.id,
        storeId: product.storeId,
        name: input.name?.trim() || product.name,
        price: nextPrice,
        stock: nextStock,
      })

      if (delta !== 0) {
        state.movements.unshift(
          buildMovement(
            product,
            delta > 0 ? 'reposicion' : 'ajuste',
            delta,
            'Actualización manual de stock',
          ),
        )
      }

      persist()
      return { ...bootstrap(), product: clone(product) }
    },

    async deleteProduct(id) {
      state.products = state.products.filter((product) => product.id !== id)
      persist()
      return bootstrap()
    },

    async setVisibility(id, visible) {
      const product = state.products.find((entry) => entry.id === id)
      if (!product) throw httpError(404, 'Producto no encontrado.')
      product.visible = Boolean(visible)
      persist()
      return { ...bootstrap(), product: clone(product) }
    },

    async adjustStock(id, delta) {
      const product = state.products.find((entry) => entry.id === id)
      if (!product) throw httpError(404, 'Producto no encontrado.')

      const numericDelta = Number(delta)
      if (!Number.isFinite(numericDelta)) {
        throw httpError(400, 'El ajuste de stock no es válido.')
      }

      const nextStock = Math.max(0, product.stock + Math.trunc(numericDelta))
      const appliedDelta = nextStock - product.stock
      if (appliedDelta === 0) return bootstrap()

      product.stock = nextStock
      state.movements.unshift(
        buildMovement(
          product,
          appliedDelta > 0 ? 'reposicion' : 'ajuste',
          appliedDelta,
          'Ajuste manual de stock',
        ),
      )

      persist()
      return bootstrap()
    },

    async completeOrder(id) {
      const order = state.orders.find((entry) => entry.id === id)
      if (!order) throw httpError(404, 'Pedido no encontrado.')
      if (order.status !== 'pendiente') {
        throw httpError(400, 'Solo se pueden entregar pedidos pendientes.')
      }

      order.status = 'retirado'
      persist()
      return { ...bootstrap(), order: clone(order) }
    },

    async cancelOrder(id) {
      const order = state.orders.find((entry) => entry.id === id)
      if (!order) throw httpError(404, 'Pedido no encontrado.')
      if (order.status !== 'pendiente') {
        throw httpError(400, 'Solo se pueden cancelar pedidos pendientes.')
      }

      const restored = order.items
        .map((item) => {
          const product = state.products.find((entry) => entry.id === item.productId)
          return product ? { product, item } : null
        })
        .filter(Boolean)

      restored.forEach(({ product, item }) => {
        product.stock += item.quantity
      })

      const movements = restored.map(({ product, item }) =>
        buildMovement(
          product,
          'reposicion',
          item.quantity,
          'Reposición por cancelación',
          order.id,
        ),
      )

      order.status = 'cancelado'
      state.movements.unshift(...movements)
      persist()

      return { ...bootstrap(), order: clone(order) }
    },
  }
}

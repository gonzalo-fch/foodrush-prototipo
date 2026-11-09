import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  aggregateOrderItems,
  buildMovement,
  buildProduct,
  httpError,
  newId,
  normalizeCommerceUpdate,
  normalizeSellos,
  nowDisplay,
  publicCommerce,
  publicUser,
  validateOrderInput,
  withAvailability,
} from './domain.js'
import { createSeedState } from './seed.js'

const defaultDataFile = process.env.FOODRUSH_DATA_FILE
  ? path.resolve(process.env.FOODRUSH_DATA_FILE)
  : path.join(path.dirname(fileURLToPath(import.meta.url)), '.data', 'state-v3.json')

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
      !Array.isArray(parsed.movements) ||
      !Array.isArray(parsed.reservations) ||
      !Array.isArray(parsed.users) ||
      !Array.isArray(parsed.commerces)
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

function cartItems(state, customerId, storeId) {
  return state.reservations
    .filter(
      (reservation) =>
        reservation.customerId === customerId &&
        reservation.storeId === storeId &&
        reservation.status === 'cart',
    )
    .map((reservation) => ({
      productId: reservation.productId,
      quantity: reservation.quantity,
    }))
}

export function createFileRepository({ dataFile = defaultDataFile } = {}) {
  const dataDir = path.dirname(dataFile)
  const state = loadState(dataFile)

  function persist() {
    fs.mkdirSync(dataDir, { recursive: true })
    fs.writeFileSync(dataFile, JSON.stringify(state, null, 2))
  }

  function products() {
    return state.products.map(withAvailability)
  }

  function cartPayload(customerId, storeId) {
    return {
      products: products(),
      cart: cartItems(state, customerId, storeId),
    }
  }

  function bootstrap() {
    return {
      products: products(),
      orders: clone(state.orders),
      movements: clone(state.movements),
    }
  }

  function findProduct(productId, storeId) {
    return state.products.find(
      (product) => product.id === productId && product.storeId === storeId,
    )
  }

  function findCartReservation(customerId, storeId, productId) {
    return state.reservations.find(
      (reservation) =>
        reservation.customerId === customerId &&
        reservation.storeId === storeId &&
        reservation.productId === productId &&
        reservation.status === 'cart',
    )
  }

  function setCartItem({
    customerId,
    storeId,
    productId,
    quantity,
    mode = 'set',
  }) {
    if (!customerId) throw httpError(400, 'Falta el cliente.')
    if (!storeId) throw httpError(400, 'Falta el comercio.')
    if (!productId) throw httpError(400, 'Falta el producto.')

    const requested = Math.trunc(Number(quantity))
    if (!Number.isFinite(requested)) {
      throw httpError(400, 'La cantidad reservada no es válida.')
    }
    if (mode === 'add' && requested <= 0) {
      throw httpError(400, 'La cantidad a reservar debe ser mayor que cero.')
    }

    const product = findProduct(productId, storeId)
    if (!product) throw httpError(404, 'Producto no encontrado.')

    const existing = findCartReservation(customerId, storeId, productId)
    const existingQuantity = existing?.quantity ?? 0
    const reserved = Math.max(0, Number(product.reserved) || 0)
    const nextQuantity =
      mode === 'add' ? existingQuantity + requested : requested
    if (nextQuantity < 0) {
      throw httpError(400, 'La cantidad reservada no es válida.')
    }

    if (nextQuantity === 0) {
      if (existing) {
        product.reserved = Math.max(0, reserved - existingQuantity)
        state.reservations = state.reservations.filter(
          (reservation) => reservation.id !== existing.id,
        )
        persist()
      }
      return cartPayload(customerId, storeId)
    }

    if (!product.visible && !existing) {
      throw httpError(400, 'El producto no está disponible para reservar.')
    }

    const maxQuantity = product.stock - (reserved - existingQuantity)
    if (nextQuantity > maxQuantity) {
      throw httpError(
        400,
        `Solo puedes reservar ${Math.max(0, maxQuantity)} unidades de ${product.name}.`,
      )
    }

    product.reserved = Math.max(0, reserved - existingQuantity + nextQuantity)
    const timestamp = new Date().toISOString()

    if (existing) {
      existing.quantity = nextQuantity
      existing.updatedAt = timestamp
    } else {
      state.reservations.push({
        id: `cart_${customerId}_${storeId}_${productId}`,
        storeId,
        productId,
        customerId,
        quantity: nextQuantity,
        status: 'cart',
        createdAt: timestamp,
        updatedAt: timestamp,
      })
    }

    persist()
    return cartPayload(customerId, storeId)
  }

  persist()

  return {
    backend: 'file',

    async bootstrap() {
      return bootstrap()
    },

    async getCommerces() {
      return state.commerces.map(publicCommerce)
    },

    async loginCommerce(email, password) {
      const normalized = String(email ?? '').trim().toLowerCase()
      const commerce = state.commerces.find(
        (entry) =>
          entry.businessEmail?.toLowerCase() === normalized &&
          entry.password === password,
      )

      if (!commerce) {
        throw httpError(401, 'Correo o contraseña incorrectos.')
      }

      return {
        storeId: commerce.id,
        profile: publicCommerce(commerce),
      }
    },

    async updateCommerce(storeId, patch) {
      const commerce = state.commerces.find((entry) => entry.id === storeId)
      if (!commerce) throw httpError(404, 'Comercio no encontrado.')

      Object.assign(commerce, normalizeCommerceUpdate(patch))
      persist()
      return publicCommerce(commerce)
    },

    async changeCommercePassword(storeId, currentPassword, nextPassword) {
      const commerce = state.commerces.find((entry) => entry.id === storeId)
      if (!commerce) throw httpError(404, 'Comercio no encontrado.')
      if (currentPassword !== commerce.password) {
        throw httpError(400, 'La contraseña actual no es correcta.')
      }
      if (String(nextPassword ?? '').length < 6) {
        throw httpError(400, 'La nueva contraseña debe tener al menos 6 caracteres.')
      }

      commerce.password = String(nextPassword)
      persist()
      return { ok: true }
    },

    async loginClient(email, password) {
      const normalized = String(email ?? '').trim().toLowerCase()
      const user = state.users.find(
        (entry) =>
          entry.role === 'cliente' &&
          entry.email?.toLowerCase() === normalized &&
          entry.password === password,
      )

      if (!user) {
        throw httpError(401, 'Correo o contraseña incorrectos.')
      }

      return publicUser(user)
    },

    async registerClient({ name, email, password }) {
      const cleanName = String(name ?? '').trim()
      const normalized = String(email ?? '').trim().toLowerCase()
      const passwordValue = String(password ?? '')

      if (!cleanName) throw httpError(400, 'Ingresa tu nombre completo.')
      if (!normalized.includes('@')) throw httpError(400, 'Ingresa un correo válido.')
      if (passwordValue.length < 6) {
        throw httpError(400, 'La contraseña debe tener al menos 6 caracteres.')
      }
      if (
        state.users.some(
          (entry) => entry.email?.toLowerCase() === normalized,
        )
      ) {
        throw httpError(409, 'Ya existe una cuenta con ese correo.')
      }

      const user = {
        id: newId('u'),
        name: cleanName,
        email: normalized,
        password: passwordValue,
        role: 'cliente',
      }

      state.users.push(user)
      persist()
      return publicUser(user)
    },

    async getCart(customerId, storeId) {
      return cartPayload(customerId, storeId)
    },

    async setCartItem(input) {
      return setCartItem(input)
    },

    async removeCartItem({ customerId, storeId, productId }) {
      return setCartItem({ customerId, storeId, productId, quantity: 0 })
    },

    async clearCart({ customerId, storeId }) {
      const cartReservations = state.reservations.filter(
        (reservation) =>
          reservation.customerId === customerId &&
          reservation.storeId === storeId &&
          reservation.status === 'cart',
      )

      cartReservations.forEach((reservation) => {
        const product = findProduct(reservation.productId, storeId)
        if (product) {
          product.reserved = Math.max(
            0,
            (Number(product.reserved) || 0) - reservation.quantity,
          )
        }
      })

      const removed = new Set(cartReservations.map((reservation) => reservation.id))
      state.reservations = state.reservations.filter(
        (reservation) => !removed.has(reservation.id),
      )
      persist()
      return cartPayload(customerId, storeId)
    },

    async createOrder(input) {
      validateOrderInput(input)
      const requested = aggregateOrderItems(input.items)
      const cartReservations = state.reservations.filter(
        (reservation) =>
          reservation.customerId === input.customerId &&
          reservation.storeId === input.storeId &&
          reservation.status === 'cart',
      )

      if (cartReservations.length === 0) {
        throw httpError(400, 'Tu carrito está vacío.')
      }

      const byProduct = new Map(
        cartReservations.map((reservation) => [
          reservation.productId,
          reservation,
        ]),
      )

      if (
        requested.length !== byProduct.size ||
        requested.some((item) => !byProduct.has(item.productId))
      ) {
        throw httpError(
          400,
          'El carrito cambió. Actualiza la página e inténtalo de nuevo.',
        )
      }

      const entries = requested.map(({ productId }) => {
        const reservation = byProduct.get(productId)
        const product = findProduct(productId, input.storeId)

        if (!product) {
          throw httpError(404, `Producto no encontrado: ${productId}.`)
        }
        if (!reservation || reservation.quantity <= 0) {
          throw httpError(400, `Falta la reserva de ${product.name}.`)
        }
        if ((Number(product.reserved) || 0) < reservation.quantity) {
          throw httpError(409, `Reserva inconsistente para ${product.name}.`)
        }

        return { product, reservation, quantity: reservation.quantity }
      })

      const items = entries.map(({ product, quantity }) => ({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity,
        image: product.image,
      }))

      state.orderCounter = (Number(state.orderCounter) || 1000) + 1
      const orderId = String(state.orderCounter)
      const createdAt = new Date().toISOString()
      const order = {
        id: orderId,
        customer: input.customer.trim(),
        customerId: input.customerId,
        store: input.store ?? storeName(state, input.storeId),
        storeId: input.storeId,
        date: nowDisplay(),
        createdAt,
        status: 'pendiente',
        items,
        total: items.reduce((total, item) => total + item.price * item.quantity, 0),
        paymentMethod: input.paymentMethod.trim(),
      }

      const converted = entries.map(({ product, reservation, quantity }) => ({
        id: `order_${orderId}_${product.id}`,
        storeId: order.storeId,
        productId: product.id,
        customerId: input.customerId,
        quantity,
        orderId,
        status: 'order',
        createdAt: reservation.createdAt,
        updatedAt: createdAt,
      }))

      const convertedIds = new Set(entries.map((entry) => entry.reservation.id))
      state.reservations = state.reservations.filter(
        (reservation) => !convertedIds.has(reservation.id),
      )
      state.reservations.push(...converted)
      state.orders.unshift(order)
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
      return { ...bootstrap(), product: withAvailability(clone(product)) }
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

      const reserved = Number(product.reserved) || 0
      if (nextStock < reserved) {
        throw httpError(
          409,
          `No puedes dejar el stock por debajo de las reservas (${reserved}).`,
        )
      }

      const nextPrice = input.price !== undefined ? Number(input.price) : product.price
      if (!Number.isFinite(nextPrice) || nextPrice <= 0) {
        throw httpError(400, 'Ingresa un precio válido mayor a 0.')
      }

      const nextSellos =
        input.sellos !== undefined
          ? normalizeSellos(input.sellos)
          : normalizeSellos(product.sellos)
      const delta = nextStock - product.stock
      const {
        id: _id,
        storeId: _storeId,
        reserved: _reserved,
        available: _available,
        ...patch
      } = input

      Object.assign(product, patch, {
        id: product.id,
        storeId: product.storeId,
        name: input.name?.trim() || product.name,
        price: nextPrice,
        stock: nextStock,
        reserved,
        sellos: nextSellos,
        sinSellos: nextSellos.length === 0,
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
      return { ...bootstrap(), product: withAvailability(clone(product)) }
    },

    async deleteProduct(id) {
      const product = state.products.find((entry) => entry.id === id)
      if (!product) throw httpError(404, 'Producto no encontrado.')

      const hasReservations = state.reservations.some(
        (reservation) => reservation.productId === id,
      )
      const hasPendingOrder = state.orders.some(
        (order) =>
          order.status === 'pendiente' &&
          order.items.some((item) => item.productId === id),
      )

      if (hasReservations || hasPendingOrder) {
        throw httpError(
          409,
          'No puedes eliminar un producto con reservas o pedidos pendientes.',
        )
      }

      state.products = state.products.filter((entry) => entry.id !== id)
      state.movements = state.movements.filter(
        (movement) => movement.productId !== id,
      )
      persist()
      return bootstrap()
    },

    async setVisibility(id, visible) {
      const product = state.products.find((entry) => entry.id === id)
      if (!product) throw httpError(404, 'Producto no encontrado.')
      product.visible = Boolean(visible)
      persist()
      return { ...bootstrap(), product: withAvailability(clone(product)) }
    },

    async adjustStock(id, delta) {
      const product = state.products.find((entry) => entry.id === id)
      if (!product) throw httpError(404, 'Producto no encontrado.')

      const numericDelta = Number(delta)
      if (!Number.isFinite(numericDelta)) {
        throw httpError(400, 'El ajuste de stock no es válido.')
      }

      const nextStock = Math.max(0, product.stock + Math.trunc(numericDelta))
      const reserved = Number(product.reserved) || 0
      if (nextStock < reserved) {
        throw httpError(
          409,
          `No puedes dejar el stock por debajo de las reservas (${reserved}).`,
        )
      }

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

      const orderReservations = state.reservations.filter(
        (reservation) => reservation.orderId === id,
      )
      if (orderReservations.length === 0) {
        throw httpError(409, 'El pedido no tiene reservas asociadas.')
      }

      const entries = orderReservations.map((reservation) => {
        const product = state.products.find(
          (entry) => entry.id === reservation.productId,
        )
        if (!product) {
          throw httpError(409, 'El producto del pedido ya no existe.')
        }
        if (product.stock < reservation.quantity) {
          throw httpError(409, `Stock físico insuficiente para ${product.name}.`)
        }
        return { product, reservation }
      })

      const movements = entries.map(({ product, reservation }) => {
        product.stock -= reservation.quantity
        product.reserved = Math.max(
          0,
          (Number(product.reserved) || 0) - reservation.quantity,
        )
        return buildMovement(
          product,
          'venta',
          -reservation.quantity,
          'Descuento por venta',
          order.id,
        )
      })

      state.reservations = state.reservations.filter(
        (reservation) => reservation.orderId !== id,
      )
      state.movements.unshift(...movements)
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

      const orderReservations = state.reservations.filter(
        (reservation) => reservation.orderId === id,
      )

      orderReservations.forEach((reservation) => {
        const product = state.products.find(
          (entry) => entry.id === reservation.productId,
        )
        if (product) {
          product.reserved = Math.max(
            0,
            (Number(product.reserved) || 0) - reservation.quantity,
          )
        }
      })

      state.reservations = state.reservations.filter(
        (reservation) => reservation.orderId !== id,
      )
      order.status = 'cancelado'
      persist()

      return { ...bootstrap(), order: clone(order) }
    },
  }
}

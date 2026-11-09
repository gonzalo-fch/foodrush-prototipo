import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
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

export function firebaseConfigured() {
  if (process.env.FIRESTORE_EMULATOR_HOST) return true
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) return true
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY,
  )
}

function initDb() {
  if (!getApps().length) {
    const projectId = process.env.FIREBASE_PROJECT_ID
    const options = projectId ? { projectId } : {}

    if (process.env.FIRESTORE_EMULATOR_HOST) {
      initializeApp({ projectId: projectId ?? 'foodrush-demo' })
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      initializeApp({ ...options, credential: applicationDefault() })
    } else {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      initializeApp({
        ...options,
        credential: cert({
          projectId,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey,
        }),
      })
    }
  }

  const db = getFirestore()
  db.settings({ ignoreUndefinedProperties: true })
  return db
}

function docData(doc) {
  return { id: doc.id, ...doc.data() }
}

async function seedIfEmpty(db, seed) {
  const existing = await db.collection('products').limit(1).get()
  if (!existing.empty) return

  const batch = db.batch()

  seed.stores.forEach((store) => {
    batch.set(db.collection('stores').doc(store.id), store)
  })
  seed.users.forEach((user) => {
    batch.set(db.collection('users').doc(user.id), user)
  })
  seed.products.forEach((product) => {
    batch.set(db.collection('products').doc(product.id), product)
  })
  seed.orders.forEach((order) => {
    batch.set(db.collection('orders').doc(order.id), order)
  })
  seed.movements.forEach((movement) => {
    batch.set(db.collection('movements').doc(movement.id), movement)
  })
  seed.reservations.forEach((reservation) => {
    batch.set(db.collection('reservations').doc(reservation.id), reservation)
  })
  batch.set(db.collection('meta').doc('orderCounter'), { value: seed.orderCounter })

  await batch.commit()
}

async function seedCommercesIfMissing(db, seed) {
  const existing = await db.collection('commerces').limit(1).get()
  if (!existing.empty) return

  const batch = db.batch()
  seed.commerces.forEach((commerce) => {
    batch.set(db.collection('commerces').doc(commerce.id), commerce)
  })
  await batch.commit()
}

async function readProducts(db) {
  const snap = await db.collection('products').get()
  return snap.docs
    .map(docData)
    .map(withAvailability)
    .sort(
      (a, b) =>
        (a.sortIndex ?? Number.MAX_SAFE_INTEGER) -
        (b.sortIndex ?? Number.MAX_SAFE_INTEGER),
    )
}

async function readAll(db) {
  const [products, ordersSnap, movementsSnap] = await Promise.all([
    readProducts(db),
    db.collection('orders').get(),
    db.collection('movements').get(),
  ])

  const orders = ordersSnap.docs
    .map(docData)
    .sort(
      (a, b) =>
        new Date(b.createdAt ?? 0).getTime() -
        new Date(a.createdAt ?? 0).getTime(),
    )

  const movements = movementsSnap.docs
    .map(docData)
    .sort(
      (a, b) =>
        new Date(b.createdAt ?? 0).getTime() -
        new Date(a.createdAt ?? 0).getTime(),
    )

  return { products, orders, movements }
}

async function readCart(db, customerId, storeId) {
  const snap = await db
    .collection('reservations')
    .where('customerId', '==', customerId)
    .get()

  return snap.docs
    .map(docData)
    .filter(
      (reservation) =>
        reservation.status === 'cart' && reservation.storeId === storeId,
    )
    .map((reservation) => ({
      productId: reservation.productId,
      quantity: reservation.quantity,
    }))
}

async function cartPayload(db, customerId, storeId) {
  const [products, cart] = await Promise.all([
    readProducts(db),
    readCart(db, customerId, storeId),
  ])
  return { products, cart }
}

export async function createFirestoreRepository() {
  const db = initDb()
  const seed = createSeedState()
  const storeNames = new Map(seed.stores.map((store) => [store.id, store.name]))

  await seedIfEmpty(db, seed)
  await seedCommercesIfMissing(db, seed)

  return {
    backend: 'firestore',

    async bootstrap() {
      return readAll(db)
    },

    async getCommerces() {
      const snap = await db.collection('commerces').get()
      return snap.docs.map(docData).map(publicCommerce)
    },

    async loginCommerce(email, password) {
      const normalized = String(email ?? '').trim().toLowerCase()
      const snap = await db.collection('commerces').get()
      const commerce = snap.docs
        .map(docData)
        .find(
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
      const ref = db.collection('commerces').doc(storeId)
      const snap = await ref.get()
      if (!snap.exists) throw httpError(404, 'Comercio no encontrado.')

      const updated = {
        ...docData(snap),
        ...normalizeCommerceUpdate(patch),
      }
      await ref.set(updated)
      return publicCommerce(updated)
    },

    async changeCommercePassword(storeId, currentPassword, nextPassword) {
      const ref = db.collection('commerces').doc(storeId)
      const snap = await ref.get()
      if (!snap.exists) throw httpError(404, 'Comercio no encontrado.')

      const commerce = docData(snap)
      if (currentPassword !== commerce.password) {
        throw httpError(400, 'La contraseña actual no es correcta.')
      }
      if (String(nextPassword ?? '').length < 6) {
        throw httpError(400, 'La nueva contraseña debe tener al menos 6 caracteres.')
      }

      await ref.set({ ...commerce, password: String(nextPassword) })
      return { ok: true }
    },

    async loginClient(email, password) {
      const normalized = String(email ?? '').trim().toLowerCase()
      const snap = await db
        .collection('users')
        .where('email', '==', normalized)
        .limit(1)
        .get()

      if (snap.empty) {
        throw httpError(401, 'Correo o contraseña incorrectos.')
      }

      const user = docData(snap.docs[0])
      if (user.role !== 'cliente' || user.password !== password) {
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

      const existing = await db
        .collection('users')
        .where('email', '==', normalized)
        .limit(1)
        .get()
      if (!existing.empty) {
        throw httpError(409, 'Ya existe una cuenta con ese correo.')
      }

      const user = {
        id: newId('u'),
        name: cleanName,
        email: normalized,
        password: passwordValue,
        role: 'cliente',
      }
      await db.collection('users').doc(user.id).set(user)
      return publicUser(user)
    },

    async getCart(customerId, storeId) {
      return cartPayload(db, customerId, storeId)
    },

    async setCartItem({
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

      const productRef = db.collection('products').doc(productId)
      const reservationRef = db
        .collection('reservations')
        .doc(`cart_${customerId}_${storeId}_${productId}`)
      const timestamp = new Date().toISOString()

      await db.runTransaction(async (transaction) => {
        const productSnap = await transaction.get(productRef)
        const reservationSnap = await transaction.get(reservationRef)

        if (!productSnap.exists) throw httpError(404, 'Producto no encontrado.')

        const product = { id: productSnap.id, ...productSnap.data() }
        if (product.storeId !== storeId) {
          throw httpError(404, 'Producto no encontrado en este comercio.')
        }

        const existing =
          reservationSnap.exists && reservationSnap.data().status === 'cart'
            ? { id: reservationSnap.id, ...reservationSnap.data() }
            : null
        const existingQuantity = existing?.quantity ?? 0
        const reserved = Math.max(0, Number(product.reserved) || 0)
        const nextQuantity =
          mode === 'add' ? existingQuantity + requested : requested
        if (nextQuantity < 0) {
          throw httpError(400, 'La cantidad reservada no es válida.')
        }

        if (nextQuantity === 0) {
          if (existing) {
            transaction.set(productRef, {
              ...product,
              reserved: Math.max(0, reserved - existingQuantity),
            })
            transaction.delete(reservationRef)
          }
          return
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

        transaction.set(productRef, {
          ...product,
          reserved: Math.max(0, reserved - existingQuantity + nextQuantity),
        })
        transaction.set(reservationRef, {
          id: reservationRef.id,
          storeId,
          productId,
          customerId,
          quantity: nextQuantity,
          status: 'cart',
          createdAt: existing?.createdAt ?? timestamp,
          updatedAt: timestamp,
        })
      })

      return cartPayload(db, customerId, storeId)
    },

    async removeCartItem({ customerId, storeId, productId }) {
      return this.setCartItem({ customerId, storeId, productId, quantity: 0 })
    },

    async clearCart({ customerId, storeId }) {
      const snap = await db
        .collection('reservations')
        .where('customerId', '==', customerId)
        .get()
      const refs = snap.docs
        .filter((doc) => {
          const data = doc.data()
          return data.status === 'cart' && data.storeId === storeId
        })
        .map((doc) => doc.ref)

      if (refs.length > 0) {
        await db.runTransaction(async (transaction) => {
          const reservationSnaps = await transaction.getAll(...refs)
          const valid = reservationSnaps
            .map((reservationSnap, index) => ({
              reservationSnap,
              ref: refs[index],
            }))
            .filter(
              ({ reservationSnap }) =>
                reservationSnap.exists &&
                reservationSnap.data().status === 'cart',
            )
          const productRefs = valid.map(({ reservationSnap }) =>
            db.collection('products').doc(reservationSnap.data().productId),
          )
          const productSnaps = productRefs.length
            ? await transaction.getAll(...productRefs)
            : []

          valid.forEach(({ reservationSnap, ref }, index) => {
            const reservation = reservationSnap.data()
            const productSnap = productSnaps[index]

            if (productSnap?.exists) {
              const product = { id: productSnap.id, ...productSnap.data() }
              transaction.set(productSnap.ref, {
                ...product,
                reserved: Math.max(
                  0,
                  (Number(product.reserved) || 0) - reservation.quantity,
                ),
              })
            }

            transaction.delete(ref)
          })
        })
      }

      return cartPayload(db, customerId, storeId)
    },

    async createOrder(input) {
      validateOrderInput(input)
      const requested = aggregateOrderItems(input.items)
      const cartSnap = await db
        .collection('reservations')
        .where('customerId', '==', input.customerId)
        .get()
      const cartRefs = cartSnap.docs
        .filter((doc) => {
          const data = doc.data()
          return data.status === 'cart' && data.storeId === input.storeId
        })
        .map((doc) => doc.ref)

      if (cartRefs.length === 0) {
        throw httpError(400, 'Tu carrito está vacío.')
      }

      const counterRef = db.collection('meta').doc('orderCounter')

      const order = await db.runTransaction(async (transaction) => {
        const counterSnap = await transaction.get(counterRef)
        const reservationSnaps = await transaction.getAll(...cartRefs)
        const valid = reservationSnaps
          .map((reservationSnap, index) => ({
            reservationSnap,
            ref: cartRefs[index],
          }))
          .filter(
            ({ reservationSnap }) =>
              reservationSnap.exists &&
              reservationSnap.data().status === 'cart' &&
              reservationSnap.data().storeId === input.storeId,
          )

        const byProduct = new Map(
          valid.map(({ reservationSnap, ref }) => {
            const reservation = {
              id: reservationSnap.id,
              ...reservationSnap.data(),
            }
            return [reservation.productId, { ref, reservation }]
          }),
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

        const productRefs = requested.map((item) =>
          db.collection('products').doc(item.productId),
        )
        const productSnaps = await transaction.getAll(...productRefs)
        const entries = requested.map((item, index) => {
          const productSnap = productSnaps[index]
          const cartEntry = byProduct.get(item.productId)

          if (!productSnap.exists) {
            throw httpError(404, `Producto no encontrado: ${item.productId}.`)
          }
          if (!cartEntry || cartEntry.reservation.quantity <= 0) {
            throw httpError(400, 'Falta una reserva del carrito.')
          }

          return {
            product: { id: productSnap.id, ...productSnap.data() },
            cartRef: cartEntry.ref,
            reservation: cartEntry.reservation,
            quantity: cartEntry.reservation.quantity,
          }
        })

        const counter = counterSnap.exists
          ? Number(counterSnap.data().value) || 1000
          : 1000
        const orderId = String(counter + 1)
        const createdAt = new Date().toISOString()
        const items = entries.map(({ product, quantity }) => ({
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity,
          image: product.image,
        }))
        const createdOrder = {
          id: orderId,
          customer: input.customer.trim(),
          customerId: input.customerId,
          store: input.store ?? storeNames.get(input.storeId) ?? 'Comercio',
          storeId: input.storeId,
          date: nowDisplay(),
          createdAt,
          status: 'pendiente',
          items,
          total: items.reduce(
            (total, item) => total + item.price * item.quantity,
            0,
          ),
          paymentMethod: input.paymentMethod.trim(),
        }

        entries.forEach(({ product, cartRef, reservation }) => {
          const orderReservationRef = db
            .collection('reservations')
            .doc(`order_${orderId}_${product.id}`)

          transaction.delete(cartRef)
          transaction.set(orderReservationRef, {
            id: orderReservationRef.id,
            storeId: createdOrder.storeId,
            productId: product.id,
            customerId: input.customerId,
            quantity: reservation.quantity,
            orderId,
            status: 'order',
            createdAt: reservation.createdAt ?? createdAt,
            updatedAt: createdAt,
          })
        })

        transaction.set(
          db.collection('orders').doc(orderId),
          createdOrder,
        )
        transaction.set(counterRef, { value: counter + 1 })

        return createdOrder
      })

      return { ...(await readAll(db)), order }
    },

    async addProduct(input) {
      const product = buildProduct(input)
      const batch = db.batch()
      batch.set(db.collection('products').doc(product.id), product)

      if (product.stock > 0) {
        const movement = buildMovement(
          product,
          'reposicion',
          product.stock,
          'Stock inicial',
        )
        batch.set(db.collection('movements').doc(movement.id), movement)
      }

      await batch.commit()
      return { ...(await readAll(db)), product: withAvailability(product) }
    },

    async updateProduct(id, input) {
      const ref = db.collection('products').doc(id)

      const product = await db.runTransaction(async (transaction) => {
        const snap = await transaction.get(ref)
        if (!snap.exists) throw httpError(404, 'Producto no encontrado.')

        const current = { id: snap.id, ...snap.data() }
        const nextStock =
          input.stock !== undefined
            ? Math.max(0, Math.floor(Number(input.stock)))
            : current.stock
        if (!Number.isFinite(nextStock)) {
          throw httpError(400, 'Ingresa una cantidad válida (0 o más).')
        }

        const reserved = Number(current.reserved) || 0
        if (nextStock < reserved) {
          throw httpError(
            409,
            `No puedes dejar el stock por debajo de las reservas (${reserved}).`,
          )
        }

        const nextPrice =
          input.price !== undefined ? Number(input.price) : current.price
        if (!Number.isFinite(nextPrice) || nextPrice <= 0) {
          throw httpError(400, 'Ingresa un precio válido mayor a 0.')
        }

        const nextSellos =
          input.sellos !== undefined
            ? normalizeSellos(input.sellos)
            : normalizeSellos(current.sellos)
        const {
          id: _id,
          storeId: _storeId,
          reserved: _reserved,
          available: _available,
          ...patch
        } = input
        const updated = {
          ...current,
          ...patch,
          id: current.id,
          storeId: current.storeId,
          name: input.name?.trim() || current.name,
          price: nextPrice,
          stock: nextStock,
          reserved,
          sellos: nextSellos,
          sinSellos: nextSellos.length === 0,
        }
        const delta = nextStock - current.stock

        transaction.set(ref, updated)

        if (delta !== 0) {
          const movement = buildMovement(
            updated,
            delta > 0 ? 'reposicion' : 'ajuste',
            delta,
            'Actualización manual de stock',
          )
          transaction.set(db.collection('movements').doc(movement.id), movement)
        }

        return updated
      })

      return { ...(await readAll(db)), product: withAvailability(product) }
    },

    async deleteProduct(id) {
      const productRef = db.collection('products').doc(id)
      const snap = await productRef.get()
      if (!snap.exists) throw httpError(404, 'Producto no encontrado.')

      const reservationSnap = await db
        .collection('reservations')
        .where('productId', '==', id)
        .limit(1)
        .get()
      const pendingOrders = await db
        .collection('orders')
        .where('status', '==', 'pendiente')
        .get()
      const hasPendingOrder = pendingOrders.docs.some((doc) =>
        doc.data().items?.some((item) => item.productId === id),
      )

      if (!reservationSnap.empty || hasPendingOrder) {
        throw httpError(
          409,
          'No puedes eliminar un producto con reservas o pedidos pendientes.',
        )
      }

      const movements = await db
        .collection('movements')
        .where('productId', '==', id)
        .get()
      const batch = db.batch()
      batch.delete(productRef)
      movements.docs.forEach((movement) => batch.delete(movement.ref))
      await batch.commit()

      return readAll(db)
    },

    async setVisibility(id, visible) {
      const ref = db.collection('products').doc(id)
      const snap = await ref.get()
      if (!snap.exists) throw httpError(404, 'Producto no encontrado.')

      const product = {
        id: snap.id,
        ...snap.data(),
        visible: Boolean(visible),
      }
      await ref.set(product)
      return { ...(await readAll(db)), product: withAvailability(product) }
    },

    async adjustStock(id, delta) {
      const ref = db.collection('products').doc(id)

      await db.runTransaction(async (transaction) => {
        const snap = await transaction.get(ref)
        if (!snap.exists) throw httpError(404, 'Producto no encontrado.')

        const current = { id: snap.id, ...snap.data() }
        const numericDelta = Number(delta)
        if (!Number.isFinite(numericDelta)) {
          throw httpError(400, 'El ajuste de stock no es válido.')
        }

        const nextStock = Math.max(0, current.stock + Math.trunc(numericDelta))
        const reserved = Number(current.reserved) || 0
        if (nextStock < reserved) {
          throw httpError(
            409,
            `No puedes dejar el stock por debajo de las reservas (${reserved}).`,
          )
        }

        const appliedDelta = nextStock - current.stock
        if (appliedDelta === 0) return

        const updated = { ...current, stock: nextStock }
        transaction.set(ref, updated)

        const movement = buildMovement(
          updated,
          appliedDelta > 0 ? 'reposicion' : 'ajuste',
          appliedDelta,
          'Ajuste manual de stock',
        )
        transaction.set(db.collection('movements').doc(movement.id), movement)
      })

      return readAll(db)
    },

    async completeOrder(id) {
      const orderRef = db.collection('orders').doc(id)
      const reservationsSnap = await db
        .collection('reservations')
        .where('orderId', '==', id)
        .get()
      const reservationRefs = reservationsSnap.docs.map((doc) => doc.ref)

      if (reservationRefs.length === 0) {
        throw httpError(409, 'El pedido no tiene reservas asociadas.')
      }

      const order = await db.runTransaction(async (transaction) => {
        const orderSnap = await transaction.get(orderRef)
        if (!orderSnap.exists) throw httpError(404, 'Pedido no encontrado.')

        const currentOrder = { id: orderSnap.id, ...orderSnap.data() }
        if (currentOrder.status !== 'pendiente') {
          throw httpError(400, 'Solo se pueden entregar pedidos pendientes.')
        }

        const reservationSnaps = await transaction.getAll(...reservationRefs)
        const valid = reservationSnaps
          .map((reservationSnap, index) => ({
            reservationSnap,
            ref: reservationRefs[index],
          }))
          .filter(
            ({ reservationSnap }) =>
              reservationSnap.exists &&
              reservationSnap.data().orderId === id,
          )
        const productRefs = valid.map(({ reservationSnap }) =>
          db.collection('products').doc(reservationSnap.data().productId),
        )
        const productSnaps = productRefs.length
          ? await transaction.getAll(...productRefs)
          : []

        valid.forEach(({ reservationSnap, ref }, index) => {
          const reservation = reservationSnap.data()
          const productSnap = productSnaps[index]
          if (!productSnap?.exists) {
            throw httpError(409, 'El producto del pedido ya no existe.')
          }

          const product = { id: productSnap.id, ...productSnap.data() }
          if (product.stock < reservation.quantity) {
            throw httpError(
              409,
              `Stock físico insuficiente para ${product.name}.`,
            )
          }

          const updated = {
            ...product,
            stock: product.stock - reservation.quantity,
            reserved: Math.max(
              0,
              (Number(product.reserved) || 0) - reservation.quantity,
            ),
          }
          const movement = buildMovement(
            updated,
            'venta',
            -reservation.quantity,
            'Descuento por venta',
            id,
          )

          transaction.set(productSnap.ref, updated)
          transaction.set(db.collection('movements').doc(movement.id), movement)
          transaction.delete(ref)
        })

        const updatedOrder = { ...currentOrder, status: 'retirado' }
        transaction.set(orderRef, updatedOrder)
        return updatedOrder
      })

      return { ...(await readAll(db)), order }
    },

    async cancelOrder(id) {
      const orderRef = db.collection('orders').doc(id)
      const reservationsSnap = await db
        .collection('reservations')
        .where('orderId', '==', id)
        .get()
      const reservationRefs = reservationsSnap.docs.map((doc) => doc.ref)

      const order = await db.runTransaction(async (transaction) => {
        const orderSnap = await transaction.get(orderRef)
        if (!orderSnap.exists) throw httpError(404, 'Pedido no encontrado.')

        const currentOrder = { id: orderSnap.id, ...orderSnap.data() }
        if (currentOrder.status !== 'pendiente') {
          throw httpError(400, 'Solo se pueden cancelar pedidos pendientes.')
        }

        const reservationSnaps = reservationRefs.length
          ? await transaction.getAll(...reservationRefs)
          : []
        const valid = reservationSnaps
          .map((reservationSnap, index) => ({
            reservationSnap,
            ref: reservationRefs[index],
          }))
          .filter(
            ({ reservationSnap }) =>
              reservationSnap.exists &&
              reservationSnap.data().orderId === id,
          )
        const productRefs = valid.map(({ reservationSnap }) =>
          db.collection('products').doc(reservationSnap.data().productId),
        )
        const productSnaps = productRefs.length
          ? await transaction.getAll(...productRefs)
          : []

        valid.forEach(({ reservationSnap, ref }, index) => {
          const reservation = reservationSnap.data()
          const productSnap = productSnaps[index]

          if (productSnap?.exists) {
            const product = { id: productSnap.id, ...productSnap.data() }
            transaction.set(productSnap.ref, {
              ...product,
              reserved: Math.max(
                0,
                (Number(product.reserved) || 0) - reservation.quantity,
              ),
            })
          }

          transaction.delete(ref)
        })

        const updatedOrder = { ...currentOrder, status: 'cancelado' }
        transaction.set(orderRef, updatedOrder)
        return updatedOrder
      })

      return { ...(await readAll(db)), order }
    },
  }
}

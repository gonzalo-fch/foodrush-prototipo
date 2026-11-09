import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import {
  aggregateOrderItems,
  buildMovement,
  buildProduct,
  httpError,
  nowDisplay,
  validateOrderInput,
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
  batch.set(db.collection('meta').doc('orderCounter'), { value: seed.orderCounter })

  await batch.commit()
}

async function readAll(db) {
  const [productsSnap, ordersSnap, movementsSnap] = await Promise.all([
    db.collection('products').get(),
    db.collection('orders').get(),
    db.collection('movements').get(),
  ])

  const products = productsSnap.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .sort((a, b) => (a.sortIndex ?? Number.MAX_SAFE_INTEGER) - (b.sortIndex ?? Number.MAX_SAFE_INTEGER))

  const orders = ordersSnap.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())

  const movements = movementsSnap.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())

  return { products, orders, movements }
}

export async function createFirestoreRepository() {
  const db = initDb()
  const seed = createSeedState()
  const storeNames = new Map(seed.stores.map((store) => [store.id, store.name]))

  await seedIfEmpty(db, seed)

  return {
    backend: 'firestore',

    async bootstrap() {
      return readAll(db)
    },

    async createOrder(input) {
      validateOrderInput(input)
      const requested = aggregateOrderItems(input.items)
      const counterRef = db.collection('meta').doc('orderCounter')
      const productRefs = requested.map((item) =>
        db.collection('products').doc(item.productId),
      )

      const order = await db.runTransaction(async (transaction) => {
        const counterSnap = await transaction.get(counterRef)
        const productSnaps = await transaction.getAll(...productRefs)
        const counter = counterSnap.exists
          ? Number(counterSnap.data().value) || 1000
          : 1000
        const orderId = String(counter + 1)
        const entries = []

        productSnaps.forEach((snap, index) => {
          const { productId, quantity } = requested[index]

          if (!snap.exists) {
            throw httpError(404, `Producto no encontrado: ${productId}.`)
          }

          const product = { id: snap.id, ...snap.data() }

          if (product.storeId !== input.storeId) {
            throw httpError(400, 'El producto no pertenece al comercio seleccionado.')
          }
          if (!product.visible) {
            throw httpError(400, `El producto ${product.name} no está disponible.`)
          }
          if (quantity > product.stock) {
            throw httpError(400, `Stock insuficiente para ${product.name}.`)
          }

          entries.push({ ref: productRefs[index], product, quantity })
        })

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
          createdAt: new Date().toISOString(),
          status: 'pendiente',
          items,
          total: items.reduce((total, item) => total + item.price * item.quantity, 0),
          paymentMethod: input.paymentMethod.trim(),
        }

        entries.forEach(({ ref, product, quantity }) => {
          transaction.update(ref, { stock: product.stock - quantity })
          const movement = buildMovement(
            product,
            'venta',
            -quantity,
            'Descuento por venta',
            orderId,
          )
          transaction.set(db.collection('movements').doc(movement.id), movement)
        })

        transaction.set(db.collection('orders').doc(orderId), createdOrder)
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
      return { ...(await readAll(db)), product }
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

        const nextPrice =
          input.price !== undefined ? Number(input.price) : current.price
        if (!Number.isFinite(nextPrice) || nextPrice <= 0) {
          throw httpError(400, 'Ingresa un precio válido mayor a 0.')
        }

        const updated = {
          ...current,
          ...input,
          id: current.id,
          storeId: current.storeId,
          name: input.name?.trim() || current.name,
          price: nextPrice,
          stock: nextStock,
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

      return { ...(await readAll(db)), product }
    },

    async deleteProduct(id) {
      await db.collection('products').doc(id).delete()
      return readAll(db)
    },

    async setVisibility(id, visible) {
      const ref = db.collection('products').doc(id)
      const snap = await ref.get()
      if (!snap.exists) throw httpError(404, 'Producto no encontrado.')

      const product = { id: snap.id, ...snap.data(), visible: Boolean(visible) }
      await ref.set(product)
      return { ...(await readAll(db)), product }
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
      const ref = db.collection('orders').doc(id)
      const snap = await ref.get()
      if (!snap.exists) throw httpError(404, 'Pedido no encontrado.')

      const order = { id: snap.id, ...snap.data() }
      if (order.status !== 'pendiente') {
        throw httpError(400, 'Solo se pueden entregar pedidos pendientes.')
      }

      const updated = { ...order, status: 'retirado' }
      await ref.set(updated)
      return { ...(await readAll(db)), order: updated }
    },

    async cancelOrder(id) {
      const orderRef = db.collection('orders').doc(id)

      const order = await db.runTransaction(async (transaction) => {
        const orderSnap = await transaction.get(orderRef)
        if (!orderSnap.exists) throw httpError(404, 'Pedido no encontrado.')

        const currentOrder = { id: orderSnap.id, ...orderSnap.data() }
        if (currentOrder.status !== 'pendiente') {
          throw httpError(400, 'Solo se pueden cancelar pedidos pendientes.')
        }

        const productRefs = currentOrder.items.map((item) =>
          db.collection('products').doc(item.productId),
        )
        const productSnaps = productRefs.length
          ? await transaction.getAll(...productRefs)
          : []
        const restored = []

        productSnaps.forEach((snap, index) => {
          if (!snap.exists) return
          const item = currentOrder.items[index]
          const product = { id: snap.id, ...snap.data() }
          restored.push({ ref: productRefs[index], product, item })
        })

        restored.forEach(({ ref, product, item }) => {
          transaction.update(ref, { stock: product.stock + item.quantity })
          const movement = buildMovement(
            product,
            'reposicion',
            item.quantity,
            'Reposición por cancelación',
            currentOrder.id,
          )
          transaction.set(db.collection('movements').doc(movement.id), movement)
        })

        const updated = { ...currentOrder, status: 'cancelado' }
        transaction.set(orderRef, updated)
        return updated
      })

      return { ...(await readAll(db)), order }
    },
  }
}

// @vitest-environment node
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createFileRepository } from '../fileRepository.js'

let directory
let dataFile
let repository

const baseOrder = {
  customer: 'Cliente de prueba',
  customerId: 'user-test',
  store: 'Casino Los Notros',
  storeId: 'casino-los-notros',
  paymentMethod: 'Efectivo',
}

function reserve(input) {
  return repository.setCartItem({
    customerId: 'user-test',
    storeId: 'casino-los-notros',
    ...input,
  })
}

beforeEach(() => {
  directory = mkdtempSync(path.join(tmpdir(), 'foodrush-test-'))
  dataFile = path.join(directory, 'state.json')
  repository = createFileRepository({ dataFile })
})

afterEach(() => {
  rmSync(directory, { recursive: true, force: true })
})

describe('FileRepository · datos iniciales', () => {
  it('inicializa productos, pedidos, movimientos y reservas', async () => {
    const state = await repository.bootstrap()
    expect(state.products.length).toBeGreaterThan(0)
    expect(state.orders.length).toBeGreaterThan(0)
    expect(state.movements.length).toBeGreaterThan(0)

    const salad = state.products.find((entry) => entry.id === 'cp-4')
    expect(salad.reserved).toBeGreaterThan(0)
    expect(salad.available).toBe(salad.stock - salad.reserved)
  })
})

describe('FileRepository · reservas de carrito', () => {
  it('reserva stock y limita a otros clientes', async () => {
    const created = await repository.addProduct({
      storeId: 'casino-los-notros',
      name: 'Producto limitado',
      price: 1000,
      stock: 3,
    })
    const id = created.product.id

    const first = await repository.setCartItem({
      customerId: 'user-a',
      storeId: 'casino-los-notros',
      productId: id,
      quantity: 2,
    })
    expect(first.cart).toEqual([{ productId: id, quantity: 2 }])
    expect(first.products.find((entry) => entry.id === id).available).toBe(1)

    await expect(
      repository.setCartItem({
        customerId: 'user-b',
        storeId: 'casino-los-notros',
        productId: id,
        quantity: 2,
      }),
    ).rejects.toThrow('Solo puedes reservar 1')

    const second = await repository.setCartItem({
      customerId: 'user-b',
      storeId: 'casino-los-notros',
      productId: id,
      quantity: 1,
    })
    expect(second.products.find((entry) => entry.id === id).available).toBe(0)

    await repository.removeCartItem({
      customerId: 'user-a',
      storeId: 'casino-los-notros',
      productId: id,
    })
    const afterRemove = await repository.getCart(
      'user-b',
      'casino-los-notros',
    )
    expect(afterRemove.products.find((entry) => entry.id === id).available).toBe(2)

    await repository.clearCart({
      customerId: 'user-b',
      storeId: 'casino-los-notros',
    })
    const afterClear = await repository.bootstrap()
    expect(afterClear.products.find((entry) => entry.id === id).reserved).toBe(0)
  })
})

describe('FileRepository · compra ficticia', () => {
  it('convierte la reserva en pedido sin descontar stock', async () => {
    const before = await repository.bootstrap()
    const product = before.products.find((entry) => entry.id === 'cp-4')
    const movementsBefore = before.movements.length

    await reserve({ productId: 'cp-4', quantity: 2 })
    const result = await repository.createOrder({
      ...baseOrder,
      items: [{ productId: 'cp-4', quantity: 2 }],
    })

    const updated = result.products.find((entry) => entry.id === 'cp-4')
    expect(result.order.status).toBe('pendiente')
    expect(result.order.total).toBe(product.price * 2)
    expect(updated.stock).toBe(product.stock)
    expect(updated.reserved).toBe(product.reserved + 2)
    expect(result.movements.length).toBe(movementsBefore)
  })

  it('descuenta stock y libera la reserva al entregar', async () => {
    const before = await repository.bootstrap()
    const product = before.products.find((entry) => entry.id === 'cp-4')

    await reserve({ productId: 'cp-4', quantity: 2 })
    const created = await repository.createOrder({
      ...baseOrder,
      items: [{ productId: 'cp-4', quantity: 2 }],
    })
    const completed = await repository.completeOrder(created.order.id)

    const updated = completed.products.find((entry) => entry.id === 'cp-4')
    expect(completed.order.status).toBe('retirado')
    expect(updated.stock).toBe(product.stock - 2)
    expect(updated.reserved).toBe(product.reserved)
    expect(
      completed.movements.some(
        (movement) =>
          movement.orderId === created.order.id &&
          movement.type === 'venta' &&
          movement.quantity === -2,
      ),
    ).toBe(true)
  })

  it('cancela un pedido sin descontar stock y libera la reserva', async () => {
    const before = await repository.bootstrap()
    const product = before.products.find((entry) => entry.id === 'cp-4')

    await reserve({ productId: 'cp-4', quantity: 2 })
    const created = await repository.createOrder({
      ...baseOrder,
      items: [{ productId: 'cp-4', quantity: 2 }],
    })
    const cancelled = await repository.cancelOrder(created.order.id)

    const updated = cancelled.products.find((entry) => entry.id === 'cp-4')
    expect(cancelled.order.status).toBe('cancelado')
    expect(updated.stock).toBe(product.stock)
    expect(updated.reserved).toBe(product.reserved)
    expect(
      cancelled.movements.some(
        (movement) =>
          movement.orderId === created.order.id && movement.type === 'venta',
      ),
    ).toBe(false)
  })

  it('rechaza una compra sin reservas', async () => {
    await expect(
      repository.createOrder({
        ...baseOrder,
        items: [{ productId: 'cp-4', quantity: 1 }],
      }),
    ).rejects.toThrow('carrito está vacío')
  })

  it('rechaza reservar un producto agotado', async () => {
    await expect(reserve({ productId: 'cp-2', quantity: 1 })).rejects.toThrow(
      'Solo puedes reservar 0',
    )
  })

  it('rechaza un producto de otro comercio', async () => {
    await expect(reserve({ productId: 'imp-coca', quantity: 1 })).rejects.toThrow(
      'Producto no encontrado',
    )
  })

  it('conserva el precio histórico aunque cambie el catálogo', async () => {
    await reserve({ productId: 'cp-4', quantity: 1 })
    const result = await repository.createOrder({
      ...baseOrder,
      items: [{ productId: 'cp-4', quantity: 1 }],
    })
    const originalPrice = result.order.items[0].price

    await repository.updateProduct('cp-4', { price: 9999 })

    const after = await repository.bootstrap()
    const order = after.orders.find((entry) => entry.id === result.order.id)
    expect(order.items[0].price).toBe(originalPrice)
  })
})

describe('FileRepository · productos e inventario', () => {
  it('agrega un producto con sellos y stock inicial', async () => {
    const result = await repository.addProduct({
      storeId: 'casino-los-notros',
      name: 'Producto nuevo',
      price: 1200,
      stock: 5,
      category: 'Bebidas',
      sellos: ['azucares', 'sodio'],
    })

    expect(result.product.sellos).toEqual(['azucares', 'sodio'])
    expect(result.product.sinSellos).toBe(false)
    expect(result.product.reserved).toBe(0)
    expect(
      result.movements.some(
        (movement) =>
          movement.productId === result.product.id &&
          movement.type === 'reposicion' &&
          movement.quantity === 5,
      ),
    ).toBe(true)
  })

  it('actualiza sellos y stock de un producto', async () => {
    const result = await repository.updateProduct('cp-4', {
      name: 'Ensalada actualizada',
      price: 4000,
      stock: 10,
      sellos: [],
    })

    expect(result.product.name).toBe('Ensalada actualizada')
    expect(result.product.price).toBe(4000)
    expect(result.product.stock).toBe(10)
    expect(result.product.sinSellos).toBe(true)
  })

  it('nunca deja stock por debajo de las reservas', async () => {
    const created = await repository.addProduct({
      storeId: 'casino-los-notros',
      name: 'Reservado',
      price: 500,
      stock: 3,
    })
    const id = created.product.id
    await reserve({ productId: id, quantity: 2 })

    await expect(
      repository.updateProduct(id, { stock: 1 }),
    ).rejects.toThrow('reservas')
    await expect(repository.adjustStock(id, -2)).rejects.toThrow('reservas')
  })

  it('bloquea eliminar productos con reservas o pedidos pendientes', async () => {
    const created = await repository.addProduct({
      storeId: 'casino-los-notros',
      name: 'Con reserva',
      price: 500,
      stock: 3,
    })
    const id = created.product.id
    await reserve({ productId: id, quantity: 1 })

    await expect(repository.deleteProduct(id)).rejects.toThrow('reservas')
    await expect(repository.deleteProduct('cp-4')).rejects.toThrow('reservas')

    await repository.clearCart({
      customerId: 'user-test',
      storeId: 'casino-los-notros',
    })
    const deleted = await repository.deleteProduct(id)
    expect(deleted.products.some((entry) => entry.id === id)).toBe(false)
  })

  it('persiste reservas y productos al recrear el repositorio', async () => {
    const created = await repository.addProduct({
      storeId: 'casino-los-notros',
      name: 'Persistente',
      price: 500,
      stock: 2,
    })
    await reserve({ productId: created.product.id, quantity: 1 })

    const reloaded = createFileRepository({ dataFile })
    const state = await reloaded.bootstrap()
    const cart = await reloaded.getCart('user-test', 'casino-los-notros')

    expect(state.products.some((entry) => entry.id === created.product.id)).toBe(
      true,
    )
    expect(cart.cart).toContainEqual({
      productId: created.product.id,
      quantity: 1,
    })
  })
})

describe('FileRepository · cuentas y ajustes compartidos', () => {
  it('autentica clientes del seed sin exponer la contraseña', async () => {
    const user = await repository.loginClient(
      'isabella@universidad.cl',
      '123456',
    )

    expect(user.name).toBe('Isabella Rodriguez')
    expect(user.password).toBeUndefined()
  })

  it('registra un cliente y permite iniciar sesión', async () => {
    const created = await repository.registerClient({
      name: 'Cliente Nuevo',
      email: 'nuevo@universidad.cl',
      password: 'abcdef',
    })

    expect(created.id).toBeTruthy()
    expect(created.password).toBeUndefined()

    const logged = await repository.loginClient(
      'nuevo@universidad.cl',
      'abcdef',
    )
    expect(logged.name).toBe('Cliente Nuevo')

    await expect(
      repository.registerClient({
        name: 'Duplicado',
        email: 'nuevo@universidad.cl',
        password: 'abcdef',
      }),
    ).rejects.toThrow('Ya existe')
  })

  it('comparte los ajustes del comercio y los persiste', async () => {
    const before = await repository.getCommerces()
    const araucarias = before.find(
      (entry) => entry.id === 'casino-araucarias',
    )
    expect(araucarias.password).toBeUndefined()
    expect(araucarias.open).toBe(true)

    const updated = await repository.updateCommerce('casino-araucarias', {
      open: false,
      creditEnabled: false,
      businessName: 'Araucarias Actualizado',
    })
    expect(updated.open).toBe(false)
    expect(updated.creditEnabled).toBe(false)
    expect(updated.businessName).toBe('Araucarias Actualizado')

    const reloaded = createFileRepository({ dataFile })
    const persisted = await reloaded.getCommerces()
    const persistedAraucarias = persisted.find(
      (entry) => entry.id === 'casino-araucarias',
    )
    expect(persistedAraucarias.open).toBe(false)
    expect(persistedAraucarias.businessName).toBe('Araucarias Actualizado')
  })

  it('permite iniciar sesión al comercio y cambiar su contraseña', async () => {
    const login = await repository.loginCommerce(
      'admin@casinoaraucarias.cl',
      '123456',
    )
    expect(login.storeId).toBe('casino-araucarias')
    expect(login.profile.password).toBeUndefined()

    await expect(
      repository.loginCommerce('admin@casinoaraucarias.cl', 'incorrecta'),
    ).rejects.toThrow('incorrectos')

    await repository.changeCommercePassword(
      'casino-araucarias',
      '123456',
      'nueva123',
    )
    const changed = await repository.loginCommerce(
      'admin@casinoaraucarias.cl',
      'nueva123',
    )
    expect(changed.storeId).toBe('casino-araucarias')
  })
})

// @vitest-environment node
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '../app.js'
import { createFileRepository } from '../fileRepository.js'

let directory
let app

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  directory = mkdtempSync(path.join(tmpdir(), 'foodrush-api-test-'))
  app = createApp(
    createFileRepository({ dataFile: path.join(directory, 'state.json') }),
  )
})

afterEach(() => {
  rmSync(directory, { recursive: true, force: true })
})

const orderBody = {
  customer: 'Cliente API',
  customerId: 'u-01',
  store: 'Casino Los Notros',
  storeId: 'casino-los-notros',
  paymentMethod: 'Efectivo',
  items: [{ productId: 'cp-4', quantity: 2 }],
}

function reserve(body = {}) {
  return request(app)
    .put('/api/cart/items')
    .send({
      customerId: 'u-01',
      storeId: 'casino-los-notros',
      productId: 'cp-4',
      quantity: 2,
      ...body,
    })
    .expect(200)
}

describe('API · lectura', () => {
  it('responde el estado del servidor', async () => {
    const response = await request(app).get('/api/health').expect(200)
    expect(response.body).toEqual({ ok: true, backend: 'file' })
  })

  it('entrega productos, pedidos y movimientos', async () => {
    const response = await request(app).get('/api/bootstrap').expect(200)
    expect(response.body.products.length).toBeGreaterThan(0)
    expect(response.body.orders.length).toBeGreaterThan(0)
    expect(response.body.movements.length).toBeGreaterThan(0)
  })
})

describe('API · carrito y reservas', () => {
  it('reserva stock y lo refleja en el carrito', async () => {
    const response = await reserve()
    expect(response.body.cart).toEqual([{ productId: 'cp-4', quantity: 2 }])
  })

  it('impide reservar más que el stock disponible', async () => {
    await request(app)
      .put('/api/cart/items')
      .send({
        customerId: 'u-01',
        storeId: 'casino-los-notros',
        productId: 'cp-2',
        quantity: 1,
      })
      .expect(400)
  })

  it('libera una línea y el carrito completo', async () => {
    await reserve()
    const removed = await request(app)
      .delete('/api/cart/items/cp-4?customerId=u-01&storeId=casino-los-notros')
      .expect(200)
    expect(removed.body.cart).toEqual([])

    await reserve({ quantity: 1 })
    const cleared = await request(app)
      .delete('/api/cart?customerId=u-01&storeId=casino-los-notros')
      .expect(200)
    expect(cleared.body.cart).toEqual([])
  })
})

describe('API · compras', () => {
  it('registra una compra reservada sin descontar stock', async () => {
    const before = await request(app).get('/api/bootstrap')
    const product = before.body.products.find((entry) => entry.id === 'cp-4')

    await reserve()
    const response = await request(app)
      .post('/api/orders')
      .send(orderBody)
      .expect(201)

    expect(response.body.order.total).toBe(product.price * 2)
    expect(
      response.body.products.find((entry) => entry.id === 'cp-4').stock,
    ).toBe(product.stock)
  })

  it('descuenta stock al marcar el pedido como entregado', async () => {
    const before = await request(app).get('/api/bootstrap')
    const product = before.body.products.find((entry) => entry.id === 'cp-4')

    await reserve()
    const created = await request(app).post('/api/orders').send(orderBody)
    const response = await request(app)
      .patch(`/api/orders/${created.body.order.id}/complete`)
      .expect(200)

    expect(response.body.order.status).toBe('retirado')
    expect(
      response.body.products.find((entry) => entry.id === 'cp-4').stock,
    ).toBe(product.stock - 2)
  })

  it('cancela un pedido sin descontar stock', async () => {
    const before = await request(app).get('/api/bootstrap')
    const product = before.body.products.find((entry) => entry.id === 'cp-4')

    await reserve()
    const created = await request(app).post('/api/orders').send(orderBody)
    const response = await request(app)
      .post(`/api/orders/${created.body.order.id}/cancel`)
      .expect(200)

    expect(response.body.order.status).toBe('cancelado')
    expect(
      response.body.products.find((entry) => entry.id === 'cp-4').stock,
    ).toBe(product.stock)
  })

  it('rechaza una compra sin reserva de carrito', async () => {
    const response = await request(app)
      .post('/api/orders')
      .send(orderBody)
      .expect(400)

    expect(response.body.error).toMatch(/carrito está vacío/)
  })
})

describe('API · productos', () => {
  it('crea, edita, oculta, ajusta y elimina un producto', async () => {
    const created = await request(app)
      .post('/api/products')
      .send({
        storeId: 'casino-los-notros',
        name: 'Producto API',
        price: 1200,
        stock: 5,
        category: 'Bebidas',
        sellos: ['azucares'],
      })
      .expect(201)

    const id = created.body.product.id

    const edited = await request(app)
      .patch(`/api/products/${id}`)
      .send({ name: 'Producto editado', price: 1500, stock: 4 })
      .expect(200)
    expect(edited.body.product.name).toBe('Producto editado')
    expect(edited.body.product.sellos).toEqual(['azucares'])

    const hidden = await request(app)
      .patch(`/api/products/${id}/visibility`)
      .send({ visible: false })
      .expect(200)
    expect(hidden.body.product.visible).toBe(false)

    const adjusted = await request(app)
      .post(`/api/products/${id}/stock`)
      .send({ delta: -1 })
      .expect(200)
    expect(
      adjusted.body.products.find((entry) => entry.id === id).stock,
    ).toBe(3)

    const deleted = await request(app)
      .delete(`/api/products/${id}`)
      .expect(200)
    expect(deleted.body.products.some((entry) => entry.id === id)).toBe(false)
  })

  it('bloquea eliminar un producto con reservas', async () => {
    const created = await request(app)
      .post('/api/products')
      .send({
        storeId: 'casino-los-notros',
        name: 'Producto reservado',
        price: 1000,
        stock: 2,
      })
      .expect(201)
    const id = created.body.product.id

    await reserve({ productId: id, quantity: 1 })

    const response = await request(app)
      .delete(`/api/products/${id}`)
      .expect(409)
    expect(response.body.error).toMatch(/reservas/)
  })
})

describe('API · errores', () => {
  it('responde 404 en rutas desconocidas', async () => {
    const response = await request(app).get('/api/inexistente').expect(404)
    expect(response.body.error).toBeTruthy()
  })
})

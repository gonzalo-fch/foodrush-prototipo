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

describe('API · compras', () => {
  it('registra una compra y descuenta stock', async () => {
    const before = await request(app).get('/api/bootstrap')
    const product = before.body.products.find((entry) => entry.id === 'cp-4')

    const response = await request(app)
      .post('/api/orders')
      .send(orderBody)
      .expect(201)

    expect(response.body.order.total).toBe(product.price * 2)
    expect(
      response.body.products.find((entry) => entry.id === 'cp-4').stock,
    ).toBe(product.stock - 2)
  })

  it('rechaza una compra sin stock suficiente', async () => {
    const response = await request(app)
      .post('/api/orders')
      .send({
        ...orderBody,
        items: [{ productId: 'cp-2', quantity: 1 }],
      })
      .expect(400)

    expect(response.body.error).toMatch(/Stock insuficiente/)
  })

  it('marca un pedido como entregado', async () => {
    const created = await request(app).post('/api/orders').send(orderBody)
    const response = await request(app)
      .patch(`/api/orders/${created.body.order.id}/complete`)
      .expect(200)

    expect(response.body.order.status).toBe('retirado')
  })

  it('cancela un pedido y repone el stock', async () => {
    const before = await request(app).get('/api/bootstrap')
    const product = before.body.products.find((entry) => entry.id === 'cp-4')
    const created = await request(app).post('/api/orders').send(orderBody)

    const response = await request(app)
      .post(`/api/orders/${created.body.order.id}/cancel`)
      .expect(200)

    expect(response.body.order.status).toBe('cancelado')
    expect(
      response.body.products.find((entry) => entry.id === 'cp-4').stock,
    ).toBe(product.stock)
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
      })
      .expect(201)

    const id = created.body.product.id

    const edited = await request(app)
      .patch(`/api/products/${id}`)
      .send({ name: 'Producto editado', price: 1500, stock: 3 })
      .expect(200)
    expect(edited.body.product.name).toBe('Producto editado')

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
    ).toBe(2)

    const deleted = await request(app)
      .delete(`/api/products/${id}`)
      .expect(200)
    expect(deleted.body.products.some((entry) => entry.id === id)).toBe(false)
  })
})

describe('API · errores', () => {
  it('responde 404 en rutas desconocidas', async () => {
    const response = await request(app).get('/api/inexistente').expect(404)
    expect(response.body.error).toBeTruthy()
  })
})

import 'dotenv/config'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import cors from 'cors'
import express from 'express'
import { createRepository } from './repository.js'

const app = express()
const port = Number(process.env.PORT ?? 3001)
const repository = await createRepository()

function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next)
  }
}

app.use(cors())
app.use(express.json({ limit: '3mb' }))

app.get('/api/health', (req, res) => {
  res.json({ ok: true, backend: repository.backend })
})

app.get(
  '/api/bootstrap',
  asyncHandler(async (req, res) => {
    res.json(await repository.bootstrap())
  }),
)

app.post(
  '/api/orders',
  asyncHandler(async (req, res) => {
    res.status(201).json(await repository.createOrder(req.body))
  }),
)

app.patch(
  '/api/orders/:id/complete',
  asyncHandler(async (req, res) => {
    res.json(await repository.completeOrder(req.params.id))
  }),
)

app.post(
  '/api/orders/:id/cancel',
  asyncHandler(async (req, res) => {
    res.json(await repository.cancelOrder(req.params.id))
  }),
)

app.post(
  '/api/products',
  asyncHandler(async (req, res) => {
    res.status(201).json(await repository.addProduct(req.body))
  }),
)

app.patch(
  '/api/products/:id',
  asyncHandler(async (req, res) => {
    res.json(await repository.updateProduct(req.params.id, req.body))
  }),
)

app.delete(
  '/api/products/:id',
  asyncHandler(async (req, res) => {
    res.json(await repository.deleteProduct(req.params.id))
  }),
)

app.patch(
  '/api/products/:id/visibility',
  asyncHandler(async (req, res) => {
    res.json(await repository.setVisibility(req.params.id, req.body.visible))
  }),
)

app.post(
  '/api/products/:id/stock',
  asyncHandler(async (req, res) => {
    res.json(await repository.adjustStock(req.params.id, req.body.delta))
  }),
)

const distDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist')

if (existsSync(distDir)) {
  app.use(express.static(distDir))
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api')) return next()
    res.sendFile(path.join(distDir, 'index.html'))
  })
}

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada.' })
})

app.use((error, req, res, _next) => {
  console.error(error)

  if (error.type === 'entity.too.large') {
    res.status(413).json({ error: 'La imagen del producto es demasiado grande.' })
    return
  }

  res.status(error.status ?? 500).json({
    error: error.message ?? 'Error interno del servidor.',
  })
})

app.listen(port, () => {
  console.log(`FoodRush API escuchando en http://localhost:${port}`)
  console.log(`Persistencia activa: ${repository.backend}`)
})

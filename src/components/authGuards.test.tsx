import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '../lib/api'
import { AppStoreProvider } from '../store/AppStore'
import { ClientStoreProvider } from '../store/ClientStore'
import { CommerceStoreProvider } from '../store/CommerceStore'
import { RequireClientAuth } from './RequireClientAuth'
import { RequireCommerceAuth } from './RequireCommerceAuth'

vi.mock('../lib/api', () => ({
  api: {
    bootstrap: vi.fn(),
    getCart: vi.fn(),
    setCartItem: vi.fn(),
    removeCartItem: vi.fn(),
    clearCart: vi.fn(),
    createOrder: vi.fn(),
    addProduct: vi.fn(),
    updateProduct: vi.fn(),
    deleteProduct: vi.fn(),
    setVisibility: vi.fn(),
    adjustStock: vi.fn(),
    completeOrder: vi.fn(),
    cancelOrder: vi.fn(),
  },
}))

function renderClient(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppStoreProvider>
        <ClientStoreProvider>
          <Routes>
            <Route element={<RequireClientAuth />}>
              <Route path="/privado" element={<div>contenido cliente</div>} />
            </Route>
            <Route path="/login" element={<div>login cliente</div>} />
          </Routes>
        </ClientStoreProvider>
      </AppStoreProvider>
    </MemoryRouter>,
  )
}

function renderCommerce(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <CommerceStoreProvider>
        <Routes>
          <Route element={<RequireCommerceAuth />}>
            <Route path="/privado" element={<div>contenido comercio</div>} />
          </Route>
          <Route path="/comercio/login" element={<div>login comercio</div>} />
        </Routes>
      </CommerceStoreProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  window.localStorage.clear()
  vi.mocked(api.bootstrap).mockResolvedValue({
    products: [],
    orders: [],
    movements: [],
  })
  vi.mocked(api.getCart).mockResolvedValue({ products: [], cart: [] })
})

describe('RequireClientAuth', () => {
  it('redirige al login sin sesión de cliente', () => {
    renderClient('/privado')
    expect(screen.getByText('login cliente')).toBeInTheDocument()
  })

  it('permite el acceso con un cliente autenticado', () => {
    window.localStorage.setItem(
      'foodrush-client-v2',
      JSON.stringify({ currentUserId: 'u-01' }),
    )
    renderClient('/privado')
    expect(screen.getByText('contenido cliente')).toBeInTheDocument()
  })
})

describe('RequireCommerceAuth', () => {
  it('redirige al login sin sesión de comercio', () => {
    renderCommerce('/privado')
    expect(screen.getByText('login comercio')).toBeInTheDocument()
  })

  it('permite el acceso con un comercio autenticado', () => {
    window.localStorage.setItem(
      'foodrush-commerce-v2',
      JSON.stringify({ currentUserId: 'u-07', profiles: {} }),
    )
    renderCommerce('/privado')
    expect(screen.getByText('contenido comercio')).toBeInTheDocument()
  })
})

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
    loginClient: vi.fn(),
    registerClient: vi.fn(),
    loginCommerce: vi.fn(),
    getCommerces: vi.fn(),
    updateCommerce: vi.fn(),
    changeCommercePassword: vi.fn(),
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
  vi.mocked(api.getCommerces).mockResolvedValue([])
})

describe('RequireClientAuth', () => {
  it('redirige al login sin sesión de cliente', () => {
    renderClient('/privado')
    expect(screen.getByText('login cliente')).toBeInTheDocument()
  })

  it('permite el acceso con un cliente autenticado', () => {
    window.localStorage.setItem(
      'foodrush-client-v3',
      JSON.stringify({
        currentUser: {
          id: 'u-01',
          name: 'Isabella Rodriguez',
          email: 'isabella@universidad.cl',
          role: 'cliente',
        },
      }),
    )
    renderClient('/privado')
    expect(screen.getByText('contenido cliente')).toBeInTheDocument()
  })
})

describe('RequireCommerceAuth', () => {
  it('redirige al login sin sesión de comercio', async () => {
    renderCommerce('/privado')
    expect(await screen.findByText('login comercio')).toBeInTheDocument()
  })

  it('permite el acceso con un comercio autenticado', async () => {
    const profile = {
      id: 'casino-araucarias',
      userId: 'u-07',
      businessName: 'Casino de Las Araucarias',
      businessEmail: 'admin@casinoaraucarias.cl',
      open: true,
      creditEnabled: true,
      debitEnabled: true,
      newOrdersNotifications: true,
      cancellationNotifications: true,
      openTime: '08:00',
      closeTime: '20:00',
    }
    window.localStorage.setItem(
      'foodrush-commerce-v3',
      JSON.stringify({ currentStoreId: profile.id, commerces: [profile] }),
    )
    vi.mocked(api.getCommerces).mockResolvedValue([profile])
    renderCommerce('/privado')
    expect(await screen.findByText('contenido comercio')).toBeInTheDocument()
  })
})

import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { ClientStoreProvider } from '../store/ClientStore'
import { CommerceStoreProvider } from '../store/CommerceStore'
import { RequireClientAuth } from './RequireClientAuth'
import { RequireCommerceAuth } from './RequireCommerceAuth'

function renderClient(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ClientStoreProvider>
        <Routes>
          <Route element={<RequireClientAuth />}>
            <Route path="/privado" element={<div>contenido cliente</div>} />
          </Route>
          <Route path="/login" element={<div>login cliente</div>} />
        </Routes>
      </ClientStoreProvider>
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
})

describe('RequireClientAuth', () => {
  it('redirige al login sin sesión de cliente', () => {
    renderClient('/privado')
    expect(screen.getByText('login cliente')).toBeInTheDocument()
  })

  it('permite el acceso con un cliente autenticado', () => {
    window.localStorage.setItem(
      'foodrush-client-v1',
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

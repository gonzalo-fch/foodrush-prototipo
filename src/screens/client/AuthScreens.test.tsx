import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { ToastProvider } from '../../components/ToastProvider'
import { ClientStoreProvider } from '../../store/ClientStore'
import { ClientLogin } from './AuthScreens'

beforeEach(() => {
  window.localStorage.clear()
})

describe('ClientLogin', () => {
  it('muestra un enlace al acceso del comercio', () => {
    render(
      <MemoryRouter>
        <ClientStoreProvider>
          <ToastProvider>
            <ClientLogin />
          </ToastProvider>
        </ClientStoreProvider>
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('link', { name: 'Accede a tu panel' }),
    ).toHaveAttribute('href', '/comercio/login')
  })
})

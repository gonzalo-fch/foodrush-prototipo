import { expect, test, type Page } from '@playwright/test'

test.describe.configure({ mode: 'serial' })

async function loginClient(page: Page) {
  await page.goto('/login')
  await page.getByLabel('Correo Electrónico').fill('isabella@universidad.cl')
  await page.getByLabel('Contraseña').fill('123456')
  await page.getByRole('button', { name: 'Iniciar Sesión' }).click()
  await expect(page).toHaveURL(/\/catalogo$/)
  await expect(page.getByText('Almuerzo Ejecutivo')).toBeVisible()
}

async function loginCommerce(page: Page) {
  await page.goto('/comercio/login')
  await page.getByLabel('Correo Electrónico').fill('admin@casinolosnotros.cl')
  await page.getByLabel('Contraseña').fill('123456')
  await page.getByRole('button', { name: 'Iniciar Sesión' }).click()
  await expect(page).toHaveURL(/\/comercio\/inicio$/)
  await expect(page.getByText('Resumen del Día')).toBeVisible()
}

test('login de cliente y carga del catálogo', async ({ page }) => {
  await loginClient(page)
  await expect(page.getByText('Casino Los Notros').first()).toBeVisible()
})

test('reserva de producto y checkout ficticio', async ({ page }) => {
  await loginClient(page)

  await page
    .getByRole('button', { name: 'Agregar Ensalada César al carrito' })
    .click()
  await expect(page.getByText('Ensalada César agregado al carrito')).toBeVisible()

  await page.getByRole('button', { name: 'Ver carrito' }).click()
  await expect(page).toHaveURL(/\/carrito$/)
  await expect(page.getByText(/Reservadas: 1/)).toBeVisible()

  await page.getByRole('button', { name: 'Continuar al Pago' }).click()
  await expect(page).toHaveURL(/\/metodo-pago$/)

  await page.getByRole('link', { name: /Crédito o Débito/ }).click()
  await expect(page).toHaveURL(/\/eleccion-pago$/)

  await page.getByRole('button', { name: /Pagar/ }).click()
  await expect(page).toHaveURL(/\/qr\/\d+$/)
  await expect(page.getByText('¡Compra Exitosa!')).toBeVisible()
})

test('entrega del pedido y descuento de stock', async ({ page }) => {
  await loginCommerce(page)
  await page.goto('/comercio/pedidos')

  const pendingOrder = page
    .locator('a')
    .filter({ hasText: 'Retiro Pendiente' })
    .first()
  await expect(pendingOrder).toBeVisible()
  await pendingOrder.click()

  await expect(page.getByRole('button', { name: 'Marcar como entregado' })).toBeVisible()
  await page.getByRole('button', { name: 'Marcar como entregado' }).click()
  await expect(page).toHaveURL(/\/comercio\/pedidos$/)

  await page.goto('/comercio/productos')
  const salad = page.locator('article').filter({ hasText: 'Ensalada César' })
  await expect(salad.getByText(/Stock: 11/)).toBeVisible()
})

test('layout de escritorio y móvil del comercio', async ({ page }) => {
  await loginCommerce(page)

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/comercio/inicio')
  await expect(page.locator('aside')).toBeVisible()
  await expect(page.locator('nav.fixed')).toBeHidden()
  await expect(page.getByText('Escanear QR').first()).toBeVisible()

  await page.setViewportSize({ width: 390, height: 844 })
  await page.reload()
  await expect(page.locator('aside')).toBeHidden()
  await expect(page.locator('nav.fixed')).toBeVisible()
  await expect(page.getByText('Resumen del Día')).toBeVisible()
})

test('cuenta de cliente compartida entre navegadores', async ({ page, browser }) => {
  const email = `e2e-${Date.now()}@universidad.cl`

  await page.goto('/registro')
  await page.getByLabel('Nombre completo').fill('Cliente Compartido')
  await page.getByLabel('Correo institucional').fill(email)
  await page.getByLabel('Contraseña', { exact: true }).fill('abcdef')
  await page.getByLabel('Confirmar contraseña').fill('abcdef')
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Crear Cuenta' }).click()
  await expect(page).toHaveURL(/\/seleccionar-comercio$/)

  const otherContext = await browser.newContext()
  const otherPage = await otherContext.newPage()
  await otherPage.goto('/login')
  await otherPage.getByLabel('Correo Electrónico').fill(email)
  await otherPage.getByLabel('Contraseña').fill('abcdef')
  await otherPage.getByRole('button', { name: 'Iniciar Sesión' }).click()
  await expect(otherPage).toHaveURL(/\/catalogo$/)
  await expect(otherPage.getByText('¡Hola, Cliente!')).toBeVisible()

  await otherContext.close()
})

test('ajustes del comercio compartidos con el cliente', async ({ page, browser }) => {
  await loginCommerce(page)
  await page.goto('/comercio/ajustes')
  await page.getByText('Ajustes', { exact: true }).first().waitFor()

  const openToggle = page.getByRole('switch').first()
  await openToggle.click()
  await expect(page.getByText('Negocio cerrado')).toBeVisible()

  const clientContext = await browser.newContext()
  const clientPage = await clientContext.newPage()
  await loginClient(clientPage)

  await clientPage
    .getByRole('button', { name: 'Agregar Ensalada César al carrito' })
    .click()
  await clientPage.getByRole('button', { name: 'Ver carrito' }).click()
  await clientPage.getByRole('button', { name: 'Continuar al Pago' }).click()
  await expect(
    clientPage.getByText('El comercio está cerrado en este momento'),
  ).toBeVisible()

  await openToggle.click()
  await expect(page.getByText('Negocio abierto')).toBeVisible()
  await clientContext.close()
})

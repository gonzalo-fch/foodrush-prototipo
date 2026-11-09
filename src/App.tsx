import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { RequireClientAuth } from './components/RequireClientAuth'
import { RequireCommerceAuth } from './components/RequireCommerceAuth'
import { ToastProvider } from './components/ToastProvider'
import { CatalogPage } from './features/catalog/CatalogPage'
import { ClientLayout } from './layouts/ClientLayout'
import { CommerceLayout } from './layouts/CommerceLayout'
import {
  NotificationsPage,
  ProfilePage,
  PurchasesPage,
} from './screens/client/AccountScreens'
import { ClientLogin, ClientRegister, StoreSelector } from './screens/client/AuthScreens'
import { FavoritesPage, ProductDetailPage } from './screens/client/CatalogScreens'
import {
  CardChoicePage,
  CardFormPage,
  CartPage,
  PaymentMethodPage,
  QrPage,
} from './screens/client/CheckoutScreens'
import { CommerceAccessPage } from './screens/commerce/AccessScreen'
import { CommerceHomePage, CommerceSettingsPage, DashboardPage } from './screens/commerce/HomeScreens'
import { InventoryMovementsPage } from './screens/commerce/InventoryScreens'
import { OrderDetailPage, OrdersPage, QrScannerPage, SalesPage } from './screens/commerce/OrderScreens'
import {
  AddProductPage,
  EditProductPage,
  ProductManagementPage,
} from './screens/commerce/ProductScreens'
import { ErrorStatePage } from './screens/ErrorStatePage'
import { AppStoreProvider } from './store/AppStore'
import { ClientStoreProvider } from './store/ClientStore'
import { CommerceStoreProvider } from './store/CommerceStore'

export default function App() {
  return (
    <AppStoreProvider>
      <ClientStoreProvider>
        <CommerceStoreProvider>
          <ToastProvider>
            <BrowserRouter>
            <Routes>
              <Route path="/" element={<Navigate to="/catalogo" replace />} />

              <Route path="/login" element={<ClientLogin />} />
              <Route path="/registro" element={<ClientRegister />} />
              <Route path="/acceso-denegado" element={<ErrorStatePage />} />

              <Route element={<RequireClientAuth />}>
                <Route path="/seleccionar-comercio" element={<StoreSelector />} />

                <Route element={<ClientLayout />}>
                  <Route path="/catalogo" element={<CatalogPage />} />
                  <Route path="/favoritos" element={<FavoritesPage />} />
                  <Route path="/mis-compras" element={<PurchasesPage />} />
                  <Route path="/notificaciones" element={<NotificationsPage />} />
                </Route>

                <Route path="/producto/:id" element={<ProductDetailPage />} />
                <Route
                  path="/producto"
                  element={<Navigate to="/catalogo" replace />}
                />
                <Route path="/carrito" element={<CartPage />} />
                <Route path="/metodo-pago" element={<PaymentMethodPage />} />
                <Route path="/eleccion-pago" element={<CardChoicePage />} />
                <Route path="/tarjeta" element={<CardFormPage />} />
                <Route path="/qr/:id" element={<QrPage />} />
                <Route path="/qr" element={<Navigate to="/mis-compras" replace />} />
                <Route path="/perfil" element={<ProfilePage />} />
              </Route>

              <Route path="/comercio/login" element={<CommerceAccessPage />} />

              <Route element={<RequireCommerceAuth />}>
                <Route element={<CommerceLayout />}>
                  <Route path="/comercio/inicio" element={<CommerceHomePage />} />
                  <Route path="/comercio/dashboard" element={<DashboardPage />} />
                  <Route path="/comercio/ventas" element={<SalesPage />} />
                  <Route path="/comercio/productos" element={<ProductManagementPage />} />
                  <Route path="/comercio/inventario" element={<InventoryMovementsPage />} />
                  <Route path="/comercio/pedidos" element={<OrdersPage />} />
                </Route>

                <Route path="/comercio/productos/nuevo" element={<AddProductPage />} />
                <Route path="/comercio/productos/editar/:id" element={<EditProductPage />} />
                <Route
                  path="/comercio/productos/editar"
                  element={<Navigate to="/comercio/productos" replace />}
                />
                <Route path="/comercio/pedidos/:id" element={<OrderDetailPage />} />
                <Route
                  path="/comercio/resumen"
                  element={<Navigate to="/comercio/pedidos/1042" replace />}
                />
                <Route path="/comercio/escanear" element={<QrScannerPage />} />
                <Route path="/comercio/ajustes" element={<CommerceSettingsPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/catalogo" replace />} />
            </Routes>
            </BrowserRouter>
          </ToastProvider>
        </CommerceStoreProvider>
      </ClientStoreProvider>
    </AppStoreProvider>
  )
}

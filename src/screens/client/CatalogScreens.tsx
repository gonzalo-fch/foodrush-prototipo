import { ChevronLeft, Heart, Minus, Plus, ShoppingCart, Store } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../../components/AppShell'
import { PrimaryButton } from '../../components/Buttons'
import { InlineError } from '../../components/InlineError'
import { PageHeader } from '../../components/PageHeader'
import { useToast } from '../../components/ToastProvider'
import { nearbyStores } from '../../data/mock'
import { useCart } from '../../hooks/useCart'
import { formatCLP } from '../../lib/format'
import { useAppStore } from '../../store/AppStore'
import { useClientStore } from '../../store/ClientStore'
import type { CommerceProduct } from '../../types'
import { ErrorStatePage } from '../ErrorStatePage'

const octagon = {
  clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
}

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { products } = useAppStore()
  const { favorites, toggleFavorite, addToCart, selectedStore } = useClientStore()

  const [quantity, setQuantity] = useState(1)
  const [error, setError] = useState('')

  const product = products.find(
    (item) => item.id === id && item.storeId === selectedStore.id,
  )

  if (!product || !product.visible) {
    return (
      <ErrorStatePage
        title="Producto no encontrado"
        message="El producto no existe, no está disponible en este comercio o fue desactivado."
        icon="search"
        backTo="/catalogo"
        actionLabel="Volver al catálogo"
      />
    )
  }

  const isFavorite = favorites.includes(product.id)
  const isOutOfStock = product.stock <= 0
  const heroImage = product.id === 'cp-5' ? '/products/monster-detail.png' : product.image

  function increase() {
    if (quantity >= product!.stock) {
      setError(`Solo quedan ${product!.stock} unidades disponibles`)
      return
    }
    setError('')
    setQuantity((value) => value + 1)
  }

  function addToCartAction() {
    if (isOutOfStock) {
      setError('Este producto está agotado')
      return
    }
    if (quantity > product!.stock) {
      setError(`Solo quedan ${product!.stock} unidades disponibles`)
      return
    }
    setError('')
    addToCart(product!.id, quantity)
    showToast(`${product!.name} agregado al carrito`)
    navigate('/carrito')
  }

  return (
    <AppShell>
      <div className="relative bg-image pb-44">
        <div className="relative flex h-[430px] items-center justify-center px-6">
          <img
            src={heroImage}
            alt={product.name}
            className="h-full w-full object-contain"
          />
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Volver"
            className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/5 text-ink"
          >
            <ChevronLeft size={26} />
          </button>
          <button
            type="button"
            onClick={() => {
              toggleFavorite(product.id)
              showToast(
                isFavorite ? 'Producto quitado de favoritos' : 'Producto agregado a favoritos',
                'info',
              )
            }}
            aria-label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
            className={`absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/5 ${
              isFavorite ? 'text-[#e8612f]' : 'text-ink'
            }`}
          >
            <Heart size={24} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
        </div>

        <div className="min-h-[600px] rounded-t-[28px] bg-page px-4 pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-[32px] font-extrabold leading-tight text-[#333333]">
                {product.name}
              </h1>
              <p className="text-[16px] font-medium text-slate-500">
                {product.unit ?? product.weight ?? '1 Unidad'}
              </p>
              <p className="mt-3 text-[28px] font-extrabold text-brand-strong">
                {formatCLP(product.price)}
              </p>
            </div>

            {product.id === 'cp-5' && (
              <div
                style={octagon}
                className="mt-12 flex h-[88px] w-[88px] shrink-0 flex-col items-center justify-center bg-[#1f1f1f] text-center text-[9px] font-extrabold leading-tight text-white"
              >
                <span>ALTO EN</span>
                <span className="text-[11px]">AZÚCARES</span>
                <span className="text-[6px] font-medium">Ministerio de Salud</span>
              </div>
            )}
          </div>

          <p className="mt-5 text-[16px] font-medium leading-relaxed text-slate-500">
            {product.description ?? 'Producto disponible en el catálogo de este comercio.'}
          </p>

          <h2 className="mt-7 text-[18px] font-extrabold text-ink">También disponible en</h2>

          <div className="mt-4 space-y-3">
            {nearbyStores.slice(0, 3).map((store, index) => (
              <div
                key={store.id}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                  <Store size={22} strokeWidth={1.8} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[16px] font-bold text-ink">{store.name}</span>
                  <span className="block text-[13px] font-medium text-slate-500">
                    A {100 + index * 100}m de distancia
                  </span>
                </span>
                <span className="shrink-0 text-[18px] font-extrabold text-brand-strong">
                  {formatCLP(product.price + index * 300)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-1/2 z-30 w-full max-w-[430px] -translate-x-1/2 border-t border-slate-200/70 bg-page px-4 pb-5 pt-4">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-[18px] font-extrabold text-ink">Cantidad</span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => {
                setError('')
                setQuantity((value) => Math.max(1, value - 1))
              }}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#dbe7f3] text-brand-strong"
              aria-label="Disminuir cantidad"
            >
              <Minus size={20} />
            </button>
            <span className="w-5 text-center text-[18px] font-bold text-ink">{quantity}</span>
            <button
              type="button"
              onClick={increase}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#dbe7f3] text-brand-strong"
              aria-label="Aumentar cantidad"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        <p className="mb-2 text-right text-[12px] font-medium text-slate-400">
          {isOutOfStock ? 'Agotado' : `Máx. ${product.stock} unidades`}
        </p>
        {error && <InlineError>{error}</InlineError>}

        <PrimaryButton
          onClick={addToCartAction}
          disabled={isOutOfStock}
          className="mt-2"
        >
          {isOutOfStock
            ? 'Producto agotado'
            : `Añadir al Carrito – ${formatCLP(product.price * quantity)}`}
        </PrimaryButton>
      </div>
    </AppShell>
  )
}

export function FavoritesPage() {
  const { showToast } = useToast()
  const { products } = useAppStore()
  const { favorites, toggleFavorite, addToCart, selectedStore } = useClientStore()
  const { count: cartCount } = useCart()

  const favoriteProducts = favorites
    .map((id) =>
      products.find(
        (product) => product.id === id && product.storeId === selectedStore.id,
      ),
    )
    .filter((product): product is CommerceProduct => Boolean(product))

  return (
    <AppShell>
      <PageHeader
        title="Favoritos"
        backTo="/catalogo"
        right={
          <Link to="/carrito" className="relative text-ink" aria-label="Ver carrito">
            <ShoppingCart size={24} strokeWidth={1.9} />
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-strong px-1 text-[10px] font-extrabold leading-none text-white">
                {cartCount}
              </span>
            )}
          </Link>
        }
      />

      <main className="px-4 pt-6">
        {favoriteProducts.length === 0 ? (
          <div className="rounded-2xl bg-white/60 px-6 py-10 text-center">
            <Heart size={40} className="mx-auto text-slate-300" />
            <p className="mt-3 text-[16px] font-bold text-ink">
              Aún no tienes favoritos en este comercio
            </p>
            <p className="mt-1 text-[13px] font-medium text-slate-500">
              Marca productos con el corazón para encontrarlos aquí.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-7">
            {favoriteProducts.map((product) => {
              const isOutOfStock = product.stock <= 0

              return (
                <article key={product.id}>
                  <div className="relative aspect-[384/362] overflow-hidden rounded-2xl bg-image">
                    <Link
                      to={`/producto/${product.id}`}
                      aria-label={`Ver ${product.name}`}
                      className="block h-full w-full"
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    </Link>
                    {isOutOfStock && (
                      <span className="absolute inset-0 flex items-center justify-center bg-white/45">
                        <span className="rounded-lg bg-slate-100/90 px-3 py-1 text-[13px] font-extrabold text-slate-500">
                          Agotado
                        </span>
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        toggleFavorite(product.id)
                        showToast('Producto quitado de favoritos', 'info')
                      }}
                      aria-label="Quitar de favoritos"
                      className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#e8612f]"
                    >
                      <Heart size={20} fill="currentColor" />
                    </button>
                  </div>
                  <h3 className="mt-3 text-[17px] font-bold leading-tight text-[#333333]">
                    {product.name}
                  </h3>
                  <p className="mt-1 text-[16px] font-medium text-slate-500">
                    {formatCLP(product.price)}
                  </p>
                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => {
                      addToCart(product.id)
                      showToast(`${product.name} agregado al carrito`)
                    }}
                    className={`mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-lg text-[16px] font-extrabold text-white ${
                      isOutOfStock ? 'bg-slate-300' : 'bg-brand-strong'
                    }`}
                  >
                    Añadir
                    <ShoppingCart size={18} />
                  </button>
                </article>
              )
            })}
          </div>
        )}
      </main>
    </AppShell>
  )
}

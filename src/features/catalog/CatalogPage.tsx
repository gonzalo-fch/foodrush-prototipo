import { ChevronDown, Search, ShoppingCart } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../../components/ToastProvider'
import { categories } from '../../data/seed'
import { useCart } from '../../hooks/useCart'
import { useAppStore } from '../../store/AppStore'
import { useClientStore } from '../../store/ClientStore'
import type { CategoryId, Product } from '../../types'
import { ProductCard } from './ProductCard'

const categoryMap: Record<string, Product['category']> = {
  Bebidas: 'bebidas',
  Sándwiches: 'sandwiches',
  Galletas: 'snacks',
  Almuerzos: 'almuerzos',
}

export function CatalogPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { products } = useAppStore()
  const { currentUser, selectedStore, addToCart } = useClientStore()
  const { count: cartCount } = useCart()

  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<CategoryId>('todo')

  const catalogProducts = useMemo<Product[]>(
    () =>
      products
        .filter(
          (product) =>
            product.visible && product.storeId === selectedStore.id,
        )
        .map((product) => ({
          id: product.id,
          name: product.name,
          unit: product.unit ?? product.weight ?? '1 Unidad',
          price: product.price,
          image: product.image,
          stock: product.stock,
          category: categoryMap[product.category ?? ''] ?? 'bebidas',
          sinSellos: product.sinSellos,
        })),
    [products, selectedStore.id],
  )

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase()

    return catalogProducts.filter((product) => {
      const matchesQuery = product.name.toLowerCase().includes(query)

      let matchesCategory = false
      if (activeCategory === 'todo') {
        matchesCategory = true
      } else if (activeCategory === 'sin-sellos') {
        matchesCategory = Boolean(product.sinSellos)
      } else {
        matchesCategory = product.category === activeCategory
      }

      return matchesQuery && matchesCategory
    })
  }, [activeCategory, catalogProducts, search])

  function handleAddToCart(product: Product) {
    if (product.stock <= 0) {
      showToast(`${product.name} está agotado`, 'error')
      return
    }
    addToCart(product.id)
    showToast(`${product.name} agregado al carrito`)
  }

  return (
    <div className="bg-page">
      <header className="px-4 pt-3">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center">
          <img src="/brand/logo.png" alt="FoodRush" className="h-[54px] w-auto justify-self-start" />

          <button
            type="button"
            onClick={() => navigate('/seleccionar-comercio')}
            className="flex min-w-0 flex-col items-center"
          >
            <span className="text-[10.5px] font-semibold leading-tight text-muted">
              Estás comprando en
            </span>
            <span className="flex max-w-[190px] items-center gap-1 truncate text-[14px] font-extrabold leading-tight text-ink">
              <span className="truncate">{selectedStore.name}</span>
              <ChevronDown size={14} strokeWidth={2.5} className="shrink-0" />
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/carrito')}
            aria-label="Ver carrito"
            className="relative justify-self-end text-ink"
          >
            <ShoppingCart size={24} strokeWidth={1.9} />
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-strong px-1 text-[10px] font-extrabold leading-none text-white">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="px-4 pb-6">
        <div className="mt-5">
          <h1 className="text-[27px] font-extrabold leading-none tracking-[-0.02em] text-ink">
            ¡Hola, {currentUser?.name.split(' ')[0] ?? 'Cliente'}!
          </h1>
          <p className="mt-2 text-[15px] font-medium text-muted">¿Qué te apetece hoy?</p>
        </div>

        <label className="mt-4 flex h-12 items-center gap-2 rounded-2xl bg-chip px-4">
          <Search size={20} strokeWidth={2} className="shrink-0 text-muted" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Busca snacks, bebidas..."
            className="w-full bg-transparent text-[15px] font-medium text-ink outline-none placeholder:text-[#8a94a6]"
          />
        </label>

        <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto">
          {categories.map((category) => {
            const isActive = category.id === activeCategory

            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategory(category.id)}
                className={`h-9 shrink-0 rounded-full px-4 text-[14px] font-bold transition-colors ${
                  isActive ? 'bg-brand text-white' : 'bg-chip text-ink'
                }`}
              >
                {category.label}
              </button>
            )
          })}
        </div>

        {filteredProducts.length > 0 ? (
          <div className="mt-4 grid grid-cols-2 gap-x-2 gap-y-5">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAdd={handleAddToCart}
                onOpen={() => navigate(`/producto/${product.id}`)}
              />
            ))}
          </div>
        ) : catalogProducts.length === 0 ? (
          <div className="mt-10 rounded-2xl bg-white/60 px-6 py-8 text-center">
            <p className="text-[15px] font-bold text-ink">Este comercio aún no tiene productos</p>
            <p className="mt-1 text-[13px] font-medium text-muted">
              Prueba seleccionando otro comercio.
            </p>
          </div>
        ) : (
          <div className="mt-10 rounded-2xl bg-white/60 px-6 py-8 text-center">
            <p className="text-[15px] font-bold text-ink">No encontramos productos</p>
            <p className="mt-1 text-[13px] font-medium text-muted">
              Prueba con otra categoría o búsqueda.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

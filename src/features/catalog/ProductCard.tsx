import { Plus } from 'lucide-react'
import { formatCLP } from '../../lib/format'
import type { Product } from '../../types'

type ProductCardProps = {
  product: Product
  onAdd: (product: Product) => void
  onOpen?: (product: Product) => void
}

export function ProductCard({ product, onAdd, onOpen }: ProductCardProps) {
  const isOutOfStock = product.stock <= 0

  return (
    <article className="min-w-0">
      <div className="relative">
        <button
          type="button"
          onClick={() => onOpen?.(product)}
          className="relative block aspect-[203/191] w-full overflow-hidden rounded-2xl bg-image"
          aria-label={`Ver ${product.name}`}
        >
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
          {isOutOfStock && (
            <span className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/45">
              <span className="rounded-lg bg-slate-100/90 px-3 py-1 text-[13px] font-extrabold text-slate-500">
                Agotado
              </span>
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => onAdd(product)}
          disabled={isOutOfStock}
          aria-label={`Agregar ${product.name} al carrito`}
          className={`absolute -top-1 right-0 flex h-8 w-8 items-center justify-center rounded-full text-white shadow-sm transition active:scale-95 disabled:active:scale-100 ${
            isOutOfStock ? 'bg-slate-300' : 'bg-brand-strong'
          }`}
        >
          <Plus size={18} strokeWidth={2.6} />
        </button>
      </div>

      <button
        type="button"
        onClick={() => onOpen?.(product)}
        className="mt-2 block w-full text-left"
      >
        <h3 className="truncate text-[15px] font-bold leading-tight text-ink">{product.name}</h3>
        <p className="text-[11.5px] font-medium leading-tight text-muted">{product.unit}</p>
        <p className="mt-1 text-[16px] font-extrabold leading-none text-ink">
          {formatCLP(product.price)}
        </p>
      </button>
    </article>
  )
}

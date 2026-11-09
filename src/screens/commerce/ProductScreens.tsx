import { History, ImagePlus, Minus, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../../components/AppShell'
import { PrimaryButton } from '../../components/Buttons'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { Field, SelectField } from '../../components/Field'
import { PageHeader } from '../../components/PageHeader'
import { Toggle } from '../../components/Toggle'
import { useToast } from '../../components/ToastProvider'
import { useAppStore } from '../../store/AppStore'
import { useCommerceStore } from '../../store/CommerceStore'
import { SEALS } from '../../lib/seals'
import type { CommerceProduct, Seal } from '../../types'
import { formatCLP } from '../../lib/format'
import { ErrorStatePage } from '../ErrorStatePage'

const categories = ['Sándwiches', 'Bebidas', 'Galletas', 'Almuerzos']

export function ProductManagementPage() {
  const { products, deleteProduct, setVisibility, adjustStock } = useAppStore()
  const { storeId } = useCommerceStore()
  const { showToast } = useToast()
  const [search, setSearch] = useState('')
  const [toDelete, setToDelete] = useState<CommerceProduct | null>(null)

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return products.filter(
      (product) =>
        product.storeId === storeId && product.name.toLowerCase().includes(query),
    )
  }, [products, search, storeId])

  async function changeStock(product: CommerceProduct, delta: number) {
    if (delta < 0 && product.stock <= 0) {
      showToast('El stock no puede ser negativo', 'error')
      return
    }

    try {
      await adjustStock(product.id, delta)
      const nextStock = Math.max(0, product.stock + delta)
      showToast(
        `Stock de ${product.name}: ${nextStock} ${nextStock === 1 ? 'unidad' : 'unidades'}`,
      )
    } catch (requestError) {
      showToast(
        requestError instanceof Error
          ? requestError.message
          : 'No se pudo ajustar el stock',
        'error',
      )
    }
  }

  return (
    <div>
      <PageHeader title="Gestión de Productos" backTo="/comercio/inicio" />

      <main className="px-4 pb-28 pt-4">
        <label className="flex h-12 items-center gap-3 rounded-xl bg-white px-4 shadow-sm">
          <Search size={21} className="text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar producto..."
            className="w-full bg-transparent text-[15px] font-medium text-ink outline-none placeholder:text-slate-400"
          />
        </label>

        <Link
          to="/comercio/inventario"
          className="mt-3 flex items-center gap-2 rounded-xl bg-[#dbe7f3] px-4 py-3 text-[15px] font-bold text-brand-strong"
        >
          <History size={20} />
          Movimientos de inventario
        </Link>

        <div className="mt-4 space-y-4">
          {filtered.map((product) => (
            <article key={product.id} className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex gap-3">
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-[78px] w-[78px] shrink-0 rounded-lg bg-slate-50 object-contain"
                />
                <div className="min-w-0 flex-1">
                  <h2 className="text-[18px] font-bold leading-tight text-ink">{product.name}</h2>
                  <p className="mt-1 text-[16px] font-semibold text-brand">
                    {formatCLP(product.price)}
                  </p>
                  <p className="mt-1 text-[13px] font-medium text-slate-500">
                    Stock: {product.stock} · Reservadas: {product.reserved ?? 0} · Libres:{' '}
                    {product.available ?? product.stock}
                  </p>
                </div>
                <div className="shrink-0 space-y-2">
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-[13px] font-medium text-slate-500">Visible</span>
                    <Toggle
                      checked={product.visible}
                      onChange={async (visible) => {
                        try {
                          await setVisibility(product.id, visible)
                          showToast(
                            visible
                              ? 'Producto visible en el catálogo'
                              : 'Producto oculto del catálogo',
                            'info',
                          )
                        } catch (requestError) {
                          showToast(
                            requestError instanceof Error
                              ? requestError.message
                              : 'No se pudo cambiar la visibilidad',
                            'error',
                          )
                        }
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => changeStock(product, -1)}
                      aria-label="Disminuir stock"
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-[#dbe7f3] text-brand-strong"
                    >
                      <Minus size={15} />
                    </button>
                    <span className="w-7 text-center text-[15px] font-extrabold text-ink">
                      {product.stock}
                    </span>
                    <button
                      type="button"
                      onClick={() => changeStock(product, 1)}
                      aria-label="Aumentar stock"
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-[#dbe7f3] text-brand-strong"
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="my-3 border-t border-slate-200" />

              <div className="flex justify-end gap-6">
                <button
                  type="button"
                  onClick={() => setToDelete(product)}
                  className="flex items-center gap-1.5 text-[16px] font-bold text-red-500"
                >
                  <Trash2 size={18} />
                  Eliminar
                </button>
                <Link
                  to={`/comercio/productos/editar/${product.id}`}
                  className="flex items-center gap-1.5 text-[16px] font-bold text-amber-500"
                >
                  <Pencil size={18} />
                  Editar
                </Link>
              </div>
            </article>
          ))}

          {filtered.length === 0 && (
            <div className="rounded-2xl bg-white/60 px-6 py-8 text-center">
              <p className="text-[15px] font-bold text-ink">No encontramos productos</p>
              <p className="mt-1 text-[13px] font-medium text-slate-500">
                Prueba con otra búsqueda.
              </p>
            </div>
          )}
        </div>
      </main>

      <div className="pointer-events-none fixed bottom-[92px] left-1/2 z-20 w-full max-w-[430px] -translate-x-1/2 px-4">
        <Link
          to="/comercio/productos/nuevo"
          aria-label="Agregar producto"
          className="pointer-events-auto ml-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-strong text-white shadow-lg"
        >
          <Plus size={32} />
        </Link>
      </div>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Eliminar producto"
        message={
          <>
            ¿Seguro que quieres eliminar <strong className="text-ink">{toDelete?.name}</strong>? Esta
            acción no se puede deshacer.
          </>
        }
        confirmLabel="Eliminar"
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return
          try {
            await deleteProduct(toDelete.id)
            showToast('Producto eliminado', 'info')
            setToDelete(null)
          } catch (requestError) {
            showToast(
              requestError instanceof Error
                ? requestError.message
                : 'No se pudo eliminar el producto',
              'error',
            )
          }
        }}
      />
    </div>
  )
}

type FormState = {
  name: string
  description: string
  price: string
  stock: string
  category: string
  weight: string
  visible: boolean
  sellos: Seal[]
}

const emptyForm: FormState = {
  name: '',
  description: '',
  price: '',
  stock: '',
  category: 'Galletas',
  weight: '',
  visible: true,
  sellos: [],
}

function validate(form: FormState) {
  const errors: Record<string, string> = {}
  const price = Number(form.price)
  const stock = Number(form.stock)

  if (!form.name.trim()) errors.name = 'Ingresa el nombre del producto.'
  if (!form.price || Number.isNaN(price) || price <= 0) {
    errors.price = 'Ingresa un precio válido mayor a 0.'
  }
  if (form.stock === '' || Number.isNaN(stock) || stock < 0) {
    errors.stock = 'Ingresa una cantidad válida (0 o más).'
  }

  return errors
}

export function AddProductPage() {
  const { addProduct } = useAppStore()
  const { storeId } = useCommerceStore()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>(emptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [image, setImage] = useState<string | undefined>(undefined)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > 600_000) {
      showToast('La imagen no puede superar 600 KB', 'error')
      return
    }

    const reader = new FileReader()
    reader.onload = () => setImage(String(reader.result))
    reader.readAsDataURL(file)
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
    if (errors[key]) {
      setErrors((current) => ({ ...current, [key]: '' }))
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = validate(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    try {
      await addProduct({
        storeId,
        name: form.name,
        description: form.description,
        price: Number(form.price),
        stock: Number(form.stock),
        category: form.category,
        weight: form.weight,
        visible: form.visible,
        sellos: form.sellos,
        image: image ?? '/products/croissant.png',
      })
      showToast('Producto guardado correctamente')
      navigate('/comercio/productos')
    } catch (requestError) {
      showToast(
        requestError instanceof Error
          ? requestError.message
          : 'No se pudo guardar el producto',
        'error',
      )
    }
  }

  return (
    <AppShell>
      <PageHeader title="Agregar Nuevo Producto" backTo="/comercio/productos" />

      <form onSubmit={handleSubmit} className="px-4 pb-10 pt-5">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="hidden"
        />
        <div className="flex flex-col items-center rounded-xl border-2 border-dashed border-[#cbd8e6] px-5 py-7 text-center">
          {image ? (
            <img
              src={image}
              alt="Vista previa del producto"
              className="h-24 w-24 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#dbe7f3] text-brand-strong">
              <ImagePlus size={30} />
            </span>
          )}
          <h2 className="mt-4 text-[18px] font-extrabold text-ink">Subir Imagen del Producto</h2>
          <p className="mt-1 text-[14px] font-medium leading-snug text-slate-500">
            Toca para seleccionar una foto de tu galería o usar la cámara.
          </p>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="mt-4 rounded-lg bg-[#cbd8e6] px-5 py-2.5 text-[15px] font-bold text-ink"
          >
            {image ? 'Cambiar Imagen' : 'Seleccionar Imagen'}
          </button>
        </div>

        <div className="mt-6 space-y-5">
          <Field
            label="Nombre del Producto"
            placeholder="Ej: Café Latte"
            value={form.name}
            onChange={(value) => setField('name', value)}
            error={errors.name}
          />
          <Field
            label="Descripción (opcional)"
            placeholder="Describe tu producto aquí..."
            textarea
            value={form.description}
            onChange={(value) => setField('description', value)}
          />
          <div className="flex gap-4">
            <Field
              label="Precio"
              placeholder="$"
              inputMode="numeric"
              className="flex-1"
              value={form.price}
              onChange={(value) => setField('price', value)}
              error={errors.price}
            />
            <Field
              label="Stock inicial"
              placeholder="Ej: 20"
              inputMode="numeric"
              className="flex-1"
              value={form.stock}
              onChange={(value) => setField('stock', value)}
              error={errors.stock}
            />
          </div>
          <SelectField
            label="Categoría"
            options={categories}
            value={form.category}
            onChange={(value) => setField('category', value)}
          />
          <Field
            label="Peso"
            placeholder="Ej: 200g"
            value={form.weight}
            onChange={(value) => setField('weight', value)}
          />
        </div>

        <div className="mt-5 flex items-center justify-between rounded-xl border border-slate-200 px-4 py-4">
          <div>
            <p className="text-[17px] font-semibold text-ink">Disponibilidad</p>
            <p className="text-[13px] font-medium text-slate-500">
              El producto estará visible para los clientes.
            </p>
          </div>
          <Toggle checked={form.visible} onChange={(visible) => setField('visible', visible)} />
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 px-4 py-4">
          <h2 className="text-[18px] font-extrabold text-ink">Etiquetado de alimentos</h2>
          <p className="mt-1 text-[13px] font-medium text-slate-500">
            Selecciona los sellos que correspondan según la normativa chilena.
          </p>
          <SealToggles
            value={form.sellos}
            onChange={(seal, checked) =>
              setForm((current) => ({
                ...current,
                sellos: checked
                  ? [...current.sellos, seal]
                  : current.sellos.filter((id) => id !== seal),
              }))
            }
          />
        </div>

        <div className="mt-6 space-y-4">
          <PrimaryButton type="submit">Guardar Producto</PrimaryButton>
          <Link
            to="/comercio/productos"
            className="block text-center text-[16px] font-bold text-slate-500"
          >
            Descartar & Cancelar
          </Link>
        </div>
      </form>
    </AppShell>
  )
}

function SealToggles({
  value,
  onChange,
}: {
  value: Seal[]
  onChange: (seal: Seal, checked: boolean) => void
}) {
  return (
    <div className="mt-3 space-y-4">
      {SEALS.map((seal) => (
        <div key={seal.id} className="flex items-center justify-between gap-3">
          <span className="text-[15px] font-medium text-ink">{seal.label}</span>
          <Toggle
            checked={value.includes(seal.id)}
            onChange={(checked) => onChange(seal.id, checked)}
          />
        </div>
      ))}
    </div>
  )
}

export function EditProductPage() {
  const { id } = useParams<{ id: string }>()
  const { products, updateProduct, deleteProduct } = useAppStore()
  const { storeId } = useCommerceStore()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const product = products.find(
    (item) => item.id === id && item.storeId === storeId,
  )

  const [form, setForm] = useState<FormState>(emptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [image, setImage] = useState<string | undefined>(undefined)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > 600_000) {
      showToast('La imagen no puede superar 600 KB', 'error')
      return
    }

    const reader = new FileReader()
    reader.onload = () => setImage(String(reader.result))
    reader.readAsDataURL(file)
  }

  useEffect(() => {
    if (!product) return
    setImage(product.image)
    setForm({
      name: product.name,
      description: product.description ?? '',
      price: String(product.price),
      stock: String(product.stock),
      category: product.category ?? 'Bebidas',
      weight: product.weight ?? '',
      visible: product.visible,
      sellos: product.sellos ?? [],
    })
  }, [product])

  if (!product) {
    return (
      <ErrorStatePage
        title="Producto no encontrado"
        message="El producto no existe o fue eliminado. Vuelve a la gestión de productos para intentarlo de nuevo."
        icon="search"
        backTo="/comercio/productos"
        actionLabel="Volver a productos"
      />
    )
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
    if (errors[key]) {
      setErrors((current) => ({ ...current, [key]: '' }))
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!product) return

    const nextErrors = validate(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    try {
      await updateProduct(product.id, {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        stock: Number(form.stock),
        category: form.category,
        weight: form.weight,
        visible: form.visible,
        sellos: form.sellos,
        image,
      })
      showToast('Cambios guardados correctamente')
      navigate('/comercio/productos')
    } catch (requestError) {
      showToast(
        requestError instanceof Error
          ? requestError.message
          : 'No se pudieron guardar los cambios',
        'error',
      )
    }
  }

  return (
    <AppShell>
      <PageHeader title="Editar Producto" backTo="/comercio/productos" />

      <form onSubmit={handleSubmit} className="pb-10">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="hidden"
        />
        <div className="relative flex h-[250px] items-center justify-center bg-white">
          <img
            src={image ?? product.image}
            alt={product.name}
            className="h-[190px] w-full object-contain"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            aria-label="Cambiar imagen"
            className="absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-strong text-white shadow"
          >
            <ImagePlus size={24} />
          </button>
        </div>

        <div className="space-y-5 px-4 pt-5">
          <Field
            label="Nombre del Producto"
            placeholder="Croissant de Almendras"
            value={form.name}
            onChange={(value) => setField('name', value)}
            error={errors.name}
          />
          <Field
            label="Descripción"
            placeholder="Describe el producto..."
            textarea
            value={form.description}
            onChange={(value) => setField('description', value)}
          />

          <div className="flex gap-4">
            <Field
              label="Precio"
              placeholder="$ 2.500"
              inputMode="numeric"
              className="flex-1"
              value={form.price}
              onChange={(value) => setField('price', value)}
              error={errors.price}
            />
            <Field
              label="Stock"
              placeholder="Ej: 20"
              inputMode="numeric"
              className="flex-1"
              value={form.stock}
              onChange={(value) => setField('stock', value)}
              error={errors.stock}
            />
          </div>

          <div className="flex gap-4">
            <SelectField
              label="Categoría"
              options={categories}
              value={form.category}
              onChange={(value) => setField('category', value)}
              className="flex-1"
            />
            <Field
              label="Peso"
              placeholder="Ej: 200g"
              className="flex-1"
              value={form.weight}
              onChange={(value) => setField('weight', value)}
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-4">
            <span className="text-[16px] font-medium text-ink">Visibilidad</span>
            <Toggle checked={form.visible} onChange={(visible) => setField('visible', visible)} />
          </div>

          <div className="rounded-xl border border-slate-200 px-4 py-4">
            <h2 className="text-[18px] font-extrabold text-ink">Etiquetado de alimentos</h2>
            <p className="mt-1 text-[13px] font-medium text-slate-500">
              Selecciona los sellos que correspondan según la normativa chilena.
            </p>
            <SealToggles
              value={form.sellos}
              onChange={(seal, checked) =>
                setForm((current) => ({
                  ...current,
                  sellos: checked
                    ? [...current.sellos, seal]
                    : current.sellos.filter((id) => id !== seal),
                }))
              }
            />
          </div>

          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="flex h-[54px] w-full items-center justify-center gap-2 rounded-xl bg-red-50 text-[17px] font-bold text-red-500"
          >
            <Trash2 size={21} />
            Eliminar Producto
          </button>

          <PrimaryButton type="submit">Guardar Cambios</PrimaryButton>
        </div>
      </form>

      <ConfirmDialog
        open={confirmDelete}
        title="Eliminar producto"
        message={
          <>
            ¿Seguro que quieres eliminar <strong className="text-ink">{product.name}</strong>? Esta
            acción no se puede deshacer.
          </>
        }
        confirmLabel="Eliminar"
        onClose={() => setConfirmDelete(false)}
        onConfirm={async () => {
          try {
            await deleteProduct(product.id)
            showToast('Producto eliminado', 'info')
            navigate('/comercio/productos')
          } catch (requestError) {
            showToast(
              requestError instanceof Error
                ? requestError.message
                : 'No se pudo eliminar el producto',
              'error',
            )
          }
        }}
      />
    </AppShell>
  )
}

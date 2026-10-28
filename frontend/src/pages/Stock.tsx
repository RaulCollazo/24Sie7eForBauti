import { useEffect, useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { Modal } from '@/components/ui/Modal'
import { api } from '@/lib/api'
import type { Product, Category } from '@/types'

export default function Stock() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<number | ''>('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<Partial<Product>>({ name: '', category_id: undefined })
  const [priceInput, setPriceInput] = useState('')
  const [stockInput, setStockInput] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageError, setImageError] = useState('')
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [nameSuggestions, setNameSuggestions] = useState<Product[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [editPrice, setEditPrice] = useState('')
  const [editStock, setEditStock] = useState('')
  const [editImageFile, setEditImageFile] = useState<File | null>(null)
  const [editImageUrl, setEditImageUrl] = useState('')
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null)
  const [editImageError, setEditImageError] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')
  const [deleting, setDeleting] = useState<Product | null>(null)
  const [deleteSaving, setDeleteSaving] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const load = async () => {
    const [prods, cats] = await Promise.all([
      api.products.list({ q: q || undefined, category_id: cat || undefined }),
      api.categories.list(),
    ])
    setProducts(prods)
    setCategories(cats)
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    const term = (form.name || '').trim()
    if (term.length < 2) {
      setNameSuggestions([])
      return
    }

    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        const matches = await api.products.list({ q: term, limit: 5 })
        if (!cancelled) setNameSuggestions(matches)
      } catch {
        if (!cancelled) setNameSuggestions([])
      }
    }, 300)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [form.name])

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault()
    load()
  }

  const clearPreview = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImagePreview(null)
  }

  const resetForm = () => {
    clearPreview()
    setForm({ name: '' })
    setPriceInput('')
    setStockInput('')
    setImageFile(null)
    setImageUrl('')
    setImageError('')
    setFormError('')
    setNameSuggestions([])
    setShowSuggestions(false)
  }

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    clearPreview()
    setImageFile(file)
    setImageUrl('')
    setImageError('')
    setImagePreview(file ? URL.createObjectURL(file) : null)
  }

  const onUrlChange = (value: string) => {
    setImageUrl(value)
    if (value) {
      clearPreview()
      setImageFile(null)
    }
    setImageError('')
  }

  const onClose = () => {
    setOpen(false)
    resetForm()
  }

  const onSave = async () => {
    const name = (form.name || '').trim()
    if (!name) {
      setFormError('El nombre es obligatorio')
      return
    }
    const price = priceInput.trim() === '' ? 0 : Number(priceInput)
    const stock = stockInput.trim() === '' ? 0 : Number(stockInput)
    if (!Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0) {
      setFormError('El precio y las existencias deben ser mayores o iguales a 0')
      return
    }
    setSaving(true)
    setImageError('')
    setFormError('')
    try {
      let image = form.image || null
      if (imageFile) {
        const uploaded = await api.products.uploadImage(imageFile)
        image = uploaded.image
      } else if (imageUrl.trim()) {
        const downloaded = await api.products.imageFromUrl(imageUrl.trim())
        image = downloaded.image
      }
      await api.products.create({
        name,
        price,
        stock,
        category_id: form.category_id ? Number(form.category_id) : null,
        sku: form.sku || null,
        image,
      })
      setOpen(false)
      resetForm()
      load()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo guardar el producto')
    } finally {
      setSaving(false)
    }
  }

  const resetEditImage = () => {
    if (editImagePreview?.startsWith('blob:')) URL.revokeObjectURL(editImagePreview)
    setEditImageFile(null)
    setEditImageUrl('')
    setEditImagePreview(null)
    setEditImageError('')
  }

  const openEdit = (product: Product) => {
    resetEditImage()
    setEditing(product)
    setEditPrice(String(product.price))
    setEditStock(String(product.stock))
    setEditImageUrl(product.image || '')
    setEditImagePreview(product.image)
    setEditError('')
  }

  const closeEdit = () => {
    if (editSaving) return
    resetEditImage()
    setEditing(null)
    setEditError('')
  }

  const onEditPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    if (editImagePreview?.startsWith('blob:')) URL.revokeObjectURL(editImagePreview)
    setEditImageFile(file)
    setEditImageUrl('')
    setEditImageError('')
    setEditImagePreview(file ? URL.createObjectURL(file) : null)
  }

  const onEditUrlChange = (value: string) => {
    if (editImagePreview?.startsWith('blob:')) URL.revokeObjectURL(editImagePreview)
    setEditImageFile(null)
    setEditImageUrl(value)
    setEditImageError('')
    setEditImagePreview(value.trim() || null)
  }

  const onEditSave = async () => {
    if (!editing) return
    const price = Number(editPrice)
    const stock = Number(editStock)
    if (!Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0) {
      setEditError('Ingresá un precio válido y existencias enteras mayores o iguales a 0')
      return
    }
    setEditSaving(true)
    setEditError('')
    setEditImageError('')
    try {
      let image: string | null = null
      if (editImageFile) {
        const uploaded = await api.products.uploadImage(editImageFile)
        image = uploaded.image
      } else {
        const url = editImageUrl.trim()
        if (url) {
          if (editing.image && url === editing.image) {
            image = editing.image
          } else {
            const downloaded = await api.products.imageFromUrl(url)
            image = downloaded.image
          }
        }
      }
      await api.products.update(editing.id, { price, stock, image })
      resetEditImage()
      setEditing(null)
      load()
    } catch (err) {
      setEditImageError(err instanceof Error ? err.message : 'No se pudo actualizar el producto')
    } finally {
      setEditSaving(false)
    }
  }

  const openDelete = (product: Product) => {
    setDeleting(product)
    setDeleteError('')
  }

  const closeDelete = () => {
    if (deleteSaving) return
    setDeleting(null)
    setDeleteError('')
  }

  const onDelete = async () => {
    if (!deleting) return
    setDeleteSaving(true)
    setDeleteError('')
    try {
      await api.products.remove(deleting.id)
      setDeleting(null)
      load()
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'No se pudo eliminar el producto')
    } finally {
      setDeleteSaving(false)
    }
  }

  const fmt = (n: number) => `$ ${Number(n).toLocaleString('es-AR')}`

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl p-6">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold">Gestión de Stock</h1>
            <p className="text-text-muted">Productos, existencias y precios</p>
          </div>
          <div className="flex gap-2">
            <form onSubmit={onSearch} className="flex gap-2">
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar un producto..." className="w-72" />
              <select
                value={cat}
                onChange={(e) => setCat(e.target.value === '' ? '' : Number(e.target.value))}
                className="h-9 rounded-md border border-border bg-surface px-2 text-sm"
              >
                <option value="">Todas</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <Button type="submit">Buscar</Button>
            </form>
            <Button
              onClick={() => {
                resetForm()
                setOpen(true)
              }}
            >
              Añadir Producto
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Existencias</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <span className="font-medium">{p.name}</span>
                </TableCell>
                <TableCell>{p.category?.name || '-'}</TableCell>
                <TableCell>{p.stock}</TableCell>
                <TableCell>{fmt(p.price)}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="secondary" onClick={() => openEdit(p)}>
                      Editar
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => openDelete(p)}>
                      Eliminar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Modal open={open} onClose={onClose} title="Añadir Producto">
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <Input
              placeholder="Nombre"
              required
              value={form.name || ''}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value })
                setFormError('')
                setShowSuggestions(true)
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setShowSuggestions(false)}
            />
            {showSuggestions && nameSuggestions.length > 0 && (
              <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-border bg-surface shadow-lg">
                <p className="border-b border-border px-3 py-2 text-xs font-semibold text-text-muted">
                  Productos con nombre similar
                </p>
                {nameSuggestions.map((p) => (
                  <div key={p.id} className="border-b border-border px-3 py-2 text-sm last:border-b-0">
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-text-muted">
                      {p.sku ? `SKU: ${p.sku} · ` : ''}
                      {p.category?.name || 'Sin categoría'} · Stock: {p.stock}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Input placeholder="SKU" value={form.sku || ''} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
          <select
            value={form.category_id || ''}
            onChange={(e) => setForm({ ...form, category_id: e.target.value ? Number(e.target.value) : undefined })}
            className="h-9 rounded-md border border-border bg-surface px-2 text-sm col-span-2"
          >
            <option value="">Categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <Input
            placeholder="Valor"
            type="number"
            min="0"
            step="0.01"
            value={priceInput}
            onChange={(e) => setPriceInput(e.target.value)}
          />
          <Input
            placeholder="Cantidad de stock"
            type="number"
            min="0"
            step="1"
            value={stockInput}
            onChange={(e) => setStockInput(e.target.value)}
          />
          <div className="col-span-2 space-y-2">
            <label className="block text-sm font-medium">Imagen del producto</label>
            <Input
              type="file"
              accept="image/*"
              onChange={onPickFile}
              className="file:mr-3 file:rounded-md file:border-0 file:bg-bg-secondary file:px-3 file:py-1 file:text-sm"
            />
            <Input
              placeholder="O pegá una URL de imagen (se descarga automáticamente)"
              value={imageUrl}
              onChange={(e) => onUrlChange(e.target.value)}
            />
            {imagePreview && (
              <img src={imagePreview} alt="Vista previa" className="h-32 w-32 rounded-md border border-border object-cover" />
            )}
            {imageError && <p className="text-xs text-danger">{imageError}</p>}
          </div>
        </div>
        {formError && <p className="mt-3 text-xs text-danger">{formError}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={onSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </Modal>

      <Modal open={!!editing} onClose={closeEdit} title="Editar producto">
        <p className="mb-4 text-sm text-text-muted">{editing?.name}</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Precio</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={editPrice}
              onChange={(e) => setEditPrice(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Existencias</label>
            <Input
              type="number"
              min="0"
              step="1"
              value={editStock}
              onChange={(e) => setEditStock(e.target.value)}
            />
          </div>
          <div className="col-span-2 space-y-2">
            <label className="block text-sm font-medium">Imagen del producto</label>
            <Input
              type="file"
              accept="image/*"
              onChange={onEditPickFile}
              className="file:mr-3 file:rounded-md file:border-0 file:bg-bg-secondary file:px-3 file:py-1 file:text-sm"
            />
            <Input
              placeholder="O pegá una URL de imagen (dejá vacío para quitar la imagen)"
              value={editImageUrl}
              onChange={(e) => onEditUrlChange(e.target.value)}
            />
            {editImagePreview && (
              <div className="flex items-center gap-3">
                <img src={editImagePreview} alt="Vista previa" className="h-32 w-32 rounded-md border border-border object-cover" />
                <Button size="sm" variant="secondary" onClick={resetEditImage} disabled={editSaving}>
                  Quitar imagen
                </Button>
              </div>
            )}
            {editImageError && <p className="text-xs text-danger">{editImageError}</p>}
          </div>
        </div>
        {editError && <p className="mt-3 text-xs text-danger">{editError}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={closeEdit} disabled={editSaving}>
            Cancelar
          </Button>
          <Button onClick={onEditSave} disabled={editSaving}>
            {editSaving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </Modal>

      <Modal open={!!deleting} onClose={closeDelete} title="Eliminar producto">
        <p className="text-sm">
          ¿Querés eliminar <span className="font-semibold">{deleting?.name}</span> del stock? Esta acción no se puede
          deshacer.
        </p>
        {deleteError && <p className="mt-3 text-xs text-danger">{deleteError}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={closeDelete} disabled={deleteSaving}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={onDelete} disabled={deleteSaving}>
            {deleteSaving ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </div>
      </Modal>
    </AppShell>
  )
}

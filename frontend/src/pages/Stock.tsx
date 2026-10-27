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
  const [form, setForm] = useState<Partial<Product>>({ name: '', price: 0, stock: 0, category_id: undefined })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageError, setImageError] = useState('')
  const [saving, setSaving] = useState(false)
  const [nameSuggestions, setNameSuggestions] = useState<Product[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

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
    setForm({ name: '', price: 0, stock: 0 })
    setImageFile(null)
    setImageUrl('')
    setImageError('')
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
    setSaving(true)
    setImageError('')
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
        name: form.name,
        price: Number(form.price),
        stock: Number(form.stock),
        category_id: form.category_id ? Number(form.category_id) : null,
        sku: form.sku || null,
        image,
      })
      setOpen(false)
      resetForm()
      load()
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'No se pudo procesar la imagen')
    } finally {
      setSaving(false)
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
                className="h-9 rounded-md border border-border bg-white px-2 text-sm"
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
              value={form.name || ''}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value })
                setShowSuggestions(true)
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setShowSuggestions(false)}
            />
            {showSuggestions && nameSuggestions.length > 0 && (
              <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-border bg-white shadow-lg">
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
            className="h-9 rounded-md border border-border bg-white px-2 text-sm col-span-2"
          >
            <option value="">Categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <Input placeholder="Valor" type="number" value={form.price || ''} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
          <Input placeholder="Cantidad de stock" type="number" value={form.stock || ''} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
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
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={onSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </Modal>
    </AppShell>
  )
}

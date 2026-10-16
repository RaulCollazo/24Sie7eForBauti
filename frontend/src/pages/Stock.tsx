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

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault()
    load()
  }

  const onSave = async () => {
    await api.products.create({
      name: form.name,
      price: Number(form.price),
      stock: Number(form.stock),
      category_id: form.category_id ? Number(form.category_id) : null,
      sku: form.sku || null,
      image: form.image || null,
    })
    setOpen(false)
    setForm({ name: '', price: 0, stock: 0 })
    load()
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
            <Button onClick={() => setOpen(true)}>Añadir Producto</Button>
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

      <Modal open={open} onClose={() => setOpen(false)} title="Añadir Producto">
        <div className="grid grid-cols-2 gap-3">
          <Input placeholder="Nombre" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
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
          <Input placeholder="Precio" type="number" value={form.price || 0} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
          <Input placeholder="Stock" type="number" value={form.stock || 0} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
          <Input placeholder="Imagen (ruta opcional)" value={form.image || ''} onChange={(e) => setForm({ ...form, image: e.target.value })} className="col-span-2" />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={onSave}>Guardar</Button>
        </div>
      </Modal>
    </AppShell>
  )
}

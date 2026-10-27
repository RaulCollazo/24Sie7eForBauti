import { useEffect, useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { api } from '@/lib/api'
import type { Product, Category } from '@/types'

export default function Catalog() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<number | ''>('')

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

  const fmt = (n: number) => `$ ${Number(n).toLocaleString('es-AR')}`

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl p-6">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold">Catálogo</h1>
            <p className="text-text-muted">Busca tus productos</p>
          </div>
          <form onSubmit={onSearch} className="flex gap-2">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Busca tu producto..." className="w-72" />
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
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => (
            <Card key={p.id} className="overflow-hidden">
              <div className="flex h-40 items-center justify-center bg-bg-tertiary">
                {p.image ? (
                  <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                ) : (
                  <img src="/assets/logo.svg" alt="24Sie7e" className="h-12 w-12 opacity-40" />
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold">{p.name}</h3>
                <div className="mt-1 flex items-center justify-between text-sm text-text-muted">
                  <span>{p.category?.name || 'Sin categoría'}</span>
                  <Badge>Stock: {p.stock}</Badge>
                </div>
                <p className="mt-2 font-display text-lg font-bold">{fmt(p.price)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  )
}

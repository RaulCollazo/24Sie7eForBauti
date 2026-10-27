import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { AppShell } from '@/components/layout/AppShell'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { api } from '@/lib/api'
import type { Product } from '@/types'

interface CartItem {
  product: Product
  quantity: number
}

export default function POS() {
  const [products, setProducts] = useState<Product[]>([])
  const [q, setQ] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [customer, setCustomer] = useState('')
  const [payment, setPayment] = useState('Efectivo')
  const [mpAlias, setMpAlias] = useState('jrraul')
  const [showQr, setShowQr] = useState(false)
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState('')

  const load = async () => {
    const prods = await api.products.list({ q: q || undefined })
    setProducts(prods)
  }

  useEffect(() => {
    load()
  }, [])

  const add = (p: Product) => {
    const existing = cart.find((c) => c.product.id === p.id)
    if (existing) {
      if (existing.quantity < p.stock) existing.quantity += 1
      setCart([...cart])
    } else {
      if (p.stock > 0) setCart([...cart, { product: p, quantity: 1 }])
    }
  }

  const remove = (p: Product) => {
    setCart(cart.filter((c) => c.product.id !== p.id))
  }

  const updateQty = (p: Product, qty: number) => {
    if (qty < 1) return remove(p)
    const item = cart.find((c) => c.product.id === p.id)
    if (item) {
      if (qty > p.stock) return
      item.quantity = qty
      setCart([...cart])
    }
  }

  const subtotal = cart.reduce((acc, c) => acc + c.product.price * c.quantity, 0)
  const discount = 0
  const tax = Math.round((subtotal - discount) * 0.21 * 100) / 100
  const total = Math.round((subtotal - discount + tax) * 100) / 100

  const fmt = (n: number) => `$ ${Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`

  const completeSale = async () => {
    if (cart.length === 0) return
    setPaying(true)
    setPayError('')
    try {
      await api.sales.create({
        payment_method: payment,
        customer: customer || null,
        discount: 0,
        tax_rate: 0.21,
        items: cart.map((c) => ({ product_id: c.product.id, quantity: c.quantity })),
      })
      setCart([])
      setCustomer('')
      setShowQr(false)
      load()
    } catch (err) {
      setPayError(err instanceof Error ? err.message : 'No se pudo registrar el pago')
    } finally {
      setPaying(false)
    }
  }

  const pay = () => {
    if (cart.length === 0) return
    if (payment === 'Mercado Pago') {
      setPayError('')
      setShowQr(true)
      return
    }
    completeSale()
  }

  const qrAlias = mpAlias.trim() || 'jrraul'
  const qrValue = qrAlias

  return (
    <AppShell>
      <div className="grid h-full grid-cols-1 gap-6 p-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="font-heading text-2xl font-bold">Punto de Venta</h1>
              <p className="text-text-muted">Escanea o busca manualmente</p>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); load() }} className="flex gap-2">
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ingrese código o nombre..." className="w-80" />
              <Button type="submit">Buscar</Button>
            </form>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <Card key={p.id} className="cursor-pointer overflow-hidden transition hover:shadow-md">
                <div
                  className="flex h-32 items-center justify-center bg-bg-tertiary"
                  onClick={() => add(p)}
                >
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                  ) : (
                    <img src="/assets/logo.svg" alt="24Sie7e" className="h-10 w-10 opacity-40" />
                  )}
                </div>
                <CardContent className="p-3">
                  <p className="text-sm font-medium line-clamp-2">{p.name}</p>
                  <p className="mt-1 text-xs text-text-muted">Stock: {p.stock}</p>
                  <p className="mt-1 font-display font-semibold">{fmt(p.price)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4">
          <Card className="sticky top-4 flex h-full flex-col">
            <CardContent className="flex flex-1 flex-col p-4">
              <h2 className="mb-2 font-heading text-lg font-semibold">Esta venta</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PRODUCT</TableHead>
                    <TableHead>Cant.</TableHead>
                    <TableHead>Precio U.</TableHead>
                    <TableHead>SUBTOTAL</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cart.map((c) => (
                    <TableRow key={c.product.id}>
                      <TableCell>
                        <span className="max-w-[120px] truncate">{c.product.name}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <button onClick={() => updateQty(c.product, c.quantity - 1)} className="h-6 w-6 rounded border border-border">
                            -
                          </button>
                          <span className="w-6 text-center text-xs">{c.quantity}</span>
                          <button onClick={() => updateQty(c.product, c.quantity + 1)} className="h-6 w-6 rounded border border-border">
                            +
                          </button>
                        </div>
                      </TableCell>
                      <TableCell>{fmt(c.product.price)}</TableCell>
                      <TableCell>{fmt(c.product.price * c.quantity)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-4 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-muted">Subtotal:</span>
                  <span>{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Descuentos:</span>
                  <span>{fmt(discount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Impuestos (21%):</span>
                  <span>{fmt(tax)}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2 font-heading text-lg font-bold">
                  <span>TOTAL</span>
                  <span>{fmt(total)}</span>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Input placeholder="Nombre o DNI (Opcional)" value={customer} onChange={(e) => setCustomer(e.target.value)} />
                <select value={payment} onChange={(e) => setPayment(e.target.value)} className="h-9 rounded-md border border-border bg-surface px-2 text-sm">
                  <option value="Efectivo">Efectivo</option>
                  <option value="Tarjeta">Tarjeta</option>
                  <option value="Trans.">Trans.</option>
                  <option value="Mercado Pago">Mercado Pago</option>
                </select>
              </div>
              {payment === 'Mercado Pago' && (
                <div className="mt-2">
                  <Input placeholder="Alias de Mercado Pago" value={mpAlias} onChange={(e) => setMpAlias(e.target.value)} />
                </div>
              )}
              {payError && <p className="mt-2 text-xs text-danger">{payError}</p>}
              <div className="mt-3 flex gap-2">
                <Button className="flex-1" onClick={pay} disabled={cart.length === 0 || paying}>
                  {paying ? 'Registrando...' : 'Pagar'}
                </Button>
                <Button variant="secondary" onClick={() => setCart([])} disabled={paying}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal open={showQr} onClose={() => setShowQr(false)} title="Pago con Mercado Pago">
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-lg border border-border bg-white p-3">
            <QRCodeSVG value={qrValue} size={220} level="M" marginSize={2} />
          </div>
          <div className="text-center">
            <p className="text-xs uppercase tracking-wide text-text-muted">Alias</p>
            <p className="font-mono text-lg font-bold">{qrAlias}</p>
            <p className="mt-2 text-xs uppercase tracking-wide text-text-muted">Monto a transferir</p>
            <p className="font-display text-xl font-bold">{fmt(total)}</p>
          </div>
          <p className="max-w-sm text-center text-xs text-text-muted">
            Escaneá el QR desde Mercado Pago y transferí al alias indicado. Después confirmá el pago para registrar la venta.
          </p>
          {payError && <p className="text-xs text-danger">{payError}</p>}
          <div className="flex w-full justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowQr(false)} disabled={paying}>
              Cancelar
            </Button>
            <Button onClick={completeSale} disabled={paying}>
              {paying ? 'Registrando...' : 'Confirmar pago'}
            </Button>
          </div>
        </div>
      </Modal>
    </AppShell>
  )
}

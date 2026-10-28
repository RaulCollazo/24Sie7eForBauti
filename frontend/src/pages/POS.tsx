import { useEffect, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { AppShell } from '@/components/layout/AppShell'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { api } from '@/lib/api'
import type { MPPreference, Product } from '@/types'

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
  const [mpPreference, setMpPreference] = useState<MPPreference | null>(null)
  const [mpStatus, setMpStatus] = useState('')
  const [showQr, setShowQr] = useState(false)
  const [checking, setChecking] = useState(false)
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState('')
  const mpCompletedRef = useRef(false)

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
    if (payment === 'Mercado Pago') {
      if (mpCompletedRef.current) return
      mpCompletedRef.current = true
    }
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
      setMpPreference(null)
      setMpStatus('')
      load()
    } catch (err) {
      if (payment === 'Mercado Pago') mpCompletedRef.current = false
      setPayError(err instanceof Error ? err.message : 'No se pudo registrar el pago')
    } finally {
      setPaying(false)
    }
  }

  const pay = async () => {
    if (cart.length === 0) return
    if (payment === 'Mercado Pago') {
      setPayError('')
      setMpPreference(null)
      setMpStatus('')
      mpCompletedRef.current = false
      setPaying(true)
      try {
        const preference = await api.payments.createPreference({
          amount: total,
          description: `Venta 24Sie7e${customer ? ` - ${customer}` : ''}`,
        })
        setMpPreference(preference)
        setShowQr(true)
      } catch (err) {
        setPayError(err instanceof Error ? err.message : 'No se pudo iniciar el pago')
      } finally {
        setPaying(false)
      }
      return
    }
    completeSale()
  }

  const checkPayment = async () => {
    if (!mpPreference) return
    setChecking(true)
    setPayError('')
    try {
      const result = await api.payments.status(mpPreference.external_reference)
      setMpStatus(result.status)
      if (result.status === 'approved') {
        await completeSale()
        return
      }
      if (['rejected', 'cancelled', 'refunded', 'charged_back'].includes(result.status)) {
        setPayError('El pago fue rechazado o cancelado.')
      } else {
        setPayError('El pago todavía no está acreditado. Seguimos verificando automáticamente.')
      }
    } catch (err) {
      setPayError(err instanceof Error ? err.message : 'No se pudo verificar el pago')
    } finally {
      setChecking(false)
    }
  }

  const closeMp = () => {
    setShowQr(false)
    setMpPreference(null)
    setMpStatus('')
    setPayError('')
    mpCompletedRef.current = false
  }

  useEffect(() => {
    if (!showQr || !mpPreference) return
    let cancelled = false
    let timer: number | undefined
    const reference = mpPreference.external_reference

    const poll = async () => {
      try {
        const result = await api.payments.status(reference)
        if (cancelled) return
        setMpStatus(result.status)
        if (result.status === 'approved') {
          await completeSale()
          return
        }
        if (['rejected', 'cancelled', 'refunded', 'charged_back'].includes(result.status)) {
          setPayError('El pago fue rechazado o cancelado.')
          return
        }
        setPayError('')
        timer = window.setTimeout(poll, 3000)
      } catch (err) {
        if (cancelled) return
        setPayError(err instanceof Error ? err.message : 'No se pudo verificar el pago')
        timer = window.setTimeout(poll, 5000)
      }
    }

    poll()

    return () => {
      cancelled = true
      if (timer) window.clearTimeout(timer)
    }
  }, [showQr, mpPreference])

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
              {payError && <p className="mt-2 text-xs text-danger">{payError}</p>}
              <div className="mt-3 flex gap-2">
                <Button className="flex-1" onClick={pay} disabled={cart.length === 0 || paying}>
                  {paying ? (payment === 'Mercado Pago' ? 'Iniciando...' : 'Registrando...') : 'Pagar'}
                </Button>
                <Button variant="secondary" onClick={() => setCart([])} disabled={paying}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal open={showQr} onClose={closeMp} title="Pago con Mercado Pago">
        <div className="flex flex-col items-center gap-4">
          {mpPreference ? (
            <>
              <div className="rounded-lg border border-border bg-white p-3">
                <QRCodeSVG value={mpPreference.init_point} size={220} level="M" marginSize={2} />
              </div>
              <div className="text-center">
                <p className="text-xs uppercase tracking-wide text-text-muted">Monto a pagar</p>
                <p className="font-display text-xl font-bold">{fmt(total)}</p>
                <a
                  href={mpPreference.init_point}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-xs text-brand underline"
                >
                  Abrir checkout en el navegador
                </a>
              </div>
              <p className="max-w-sm text-center text-xs text-text-muted">
                Escaneá el QR o abrí el checkout y pagá con tu cuenta de Mercado Pago. Estamos verificando el pago automáticamente.
              </p>
              {!payError && (
                <p className="flex items-center gap-2 text-xs text-text-muted">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-brand" />
                  {checking || paying ? 'Verificando pago...' : 'Esperando confirmación de Mercado Pago...'}
                </p>
              )}
              {mpStatus && (
                <p className="text-xs text-text-muted">
                  Estado informado: <span className="font-mono">{mpStatus}</span>
                </p>
              )}
              {payError && <p className="text-xs text-danger">{payError}</p>}
              <div className="flex w-full justify-end gap-2">
                <Button variant="secondary" onClick={closeMp} disabled={checking || paying}>
                  Cancelar
                </Button>
                <Button onClick={checkPayment} disabled={checking || paying}>
                  {checking ? 'Verificando...' : paying ? 'Registrando...' : 'Verificar ahora'}
                </Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-text-muted">Iniciando pago en Mercado Pago...</p>
          )}
        </div>
      </Modal>
    </AppShell>
  )
}

import { useEffect, useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { api } from '@/lib/api'
import type { Sale } from '@/types'

export default function SalesHistory() {
  const [sales, setSales] = useState<Sale[]>([])
  const [selected, setSelected] = useState<Sale | null>(null)

  const load = async () => {
    const res = await api.sales.list({ limit: 100 })
    setSales(res)
  }

  useEffect(() => {
    load()
  }, [])

  const fmt = (n: number) => `$ ${Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
  const fmtDate = (d: string) => new Date(d).toLocaleString('es-AR')

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl p-6">
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold">Historial de Ventas</h1>
          <p className="text-text-muted">Listado de ventas realizadas</p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vta N°</TableHead>
              <TableHead>Fecha y Hora</TableHead>
              <TableHead>M. de pago</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Detalle</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.map((s) => (
              <TableRow key={s.id}>
                <TableCell>{s.number}</TableCell>
                <TableCell>{fmtDate(s.created_at)}</TableCell>
                <TableCell>{s.payment_method}</TableCell>
                <TableCell>{fmt(s.total)}</TableCell>
                <TableCell>
                  <Button size="sm" variant="secondary" onClick={() => setSelected(s)}>
                    Ver
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Detalle de Venta N° ${selected?.number || ''}`}>
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <p>
                <span className="text-text-muted">Fecha:</span> {fmtDate(selected.created_at)}
              </p>
              <p>
                <span className="text-text-muted">Pago:</span> {selected.payment_method}
              </p>
              <p>
                <span className="text-text-muted">Subtotal:</span> {fmt(selected.subtotal)}
              </p>
              <p>
                <span className="text-text-muted">Descuentos:</span> {fmt(selected.discount)}
              </p>
              <p>
                <span className="text-text-muted">IVA (21%):</span> {fmt(selected.tax)}
              </p>
              <p className="font-semibold">
                <span className="text-text-muted">Total:</span> {fmt(selected.total)}
              </p>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Cant.</TableHead>
                  <TableHead>Precio U.</TableHead>
                  <TableHead>Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selected.items.map((it) => (
                  <TableRow key={it.id}>
                    <TableCell>{it.product_name}</TableCell>
                    <TableCell>{it.quantity}</TableCell>
                    <TableCell>{fmt(it.unit_price)}</TableCell>
                    <TableCell>{fmt(it.subtotal)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Modal>
    </AppShell>
  )
}

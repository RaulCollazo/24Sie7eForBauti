import { Routes, Route, Navigate } from 'react-router-dom'
import Login from '@/pages/Login'
import Catalog from '@/pages/Catalog'
import Stock from '@/pages/Stock'
import SalesHistory from '@/pages/SalesHistory'
import POS from '@/pages/POS'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/pos"
        element={
          <RequireAuth>
            <POS />
          </RequireAuth>
        }
      />
      <Route
        path="/catalogo"
        element={
          <RequireAuth>
            <Catalog />
          </RequireAuth>
        }
      />
      <Route
        path="/stock"
        element={
          <RequireAuth>
            <Stock />
          </RequireAuth>
        }
      />
      <Route
        path="/ventas"
        element={
          <RequireAuth>
            <SalesHistory />
          </RequireAuth>
        }
      />
      <Route path="/" element={<Navigate to="/pos" replace />} />
      <Route path="*" element={<Navigate to="/pos" replace />} />
    </Routes>
  )
}

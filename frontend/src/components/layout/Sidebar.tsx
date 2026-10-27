import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Box, Layers, History, ShoppingCart, LogOut } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

const navItems = [
  { to: '/catalogo', label: 'Catálogo', icon: Box },
  { to: '/stock', label: 'Stock', icon: Layers },
  { to: '/ventas', label: 'Historial de Ventas', icon: History },
  { to: '/pos', label: 'POS', icon: ShoppingCart },
]

export function Sidebar() {
  const location = useLocation()

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-bg-secondary">
      <div className="flex items-center gap-2 px-4 py-5">
        <img src="/assets/logo.svg" alt="24Sie7e" className="h-8 w-8 dark:rounded-md dark:bg-white dark:p-0.5" />
        <div>
          <p className="font-heading text-sm font-bold">Open 24Sie7e</p>
          <p className="text-xs text-text-muted">Heladería y maxikiosco</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = location.pathname.startsWith(item.to)
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-brand text-white shadow'
                  : 'text-text-primary hover:bg-bg-tertiary',
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-border p-3">
        <ThemeToggle showLabel className="w-full" />
        <button
          onClick={() => {
            localStorage.removeItem('token')
            window.location.href = '/login'
          }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-text-primary hover:bg-bg-tertiary"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </aside>
  )
}

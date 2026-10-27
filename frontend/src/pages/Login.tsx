import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { api } from '@/lib/api'

export default function Login() {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const res = await api.login(username, password)
      localStorage.setItem('token', res.access_token)
      navigate('/pos')
    } catch (err) {
      setError('Usuario o contraseña incorrectos')
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-bg-secondary">
      <ThemeToggle className="absolute right-4 top-4 border border-border bg-surface shadow-sm" />
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center">
            <div className="flex flex-col items-center gap-2">
              <img src="/assets/full_logo.svg" alt="24Sie7e" className="h-10 dark:rounded-md dark:bg-white dark:p-1" />
              <p className="font-display text-base font-bold">Open 24Sie7e</p>
              <p className="text-sm text-text-muted">Heladería y maxikiosco</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-3">
            <Input placeholder="Usuario" value={username} onChange={(e) => setUsername(e.target.value)} />
            <Input placeholder="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            {error && <p className="text-xs text-danger">{error}</p>}
            <Button className="w-full" type="submit">
              INGRESAR
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

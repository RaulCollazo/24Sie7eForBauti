import type { AuthToken, Category, Product, Sale, SaleCreate } from '@/types'

const API_URL = import.meta.env.VITE_API_URL || '/api/v1'

function getAuthHeader() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(getAuthHeader() as Record<string, string>),
    ...(init?.headers as Record<string, string> | undefined),
  }
  const res = await fetch(`${API_URL}${path}`, {
    headers,
    ...init,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || res.statusText)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const api = {
  login: (username: string, password: string) =>
    request<AuthToken>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  products: {
    list: (params?: Record<string, any>) => {
      const qs = new URLSearchParams()
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') qs.append(k, String(v))
        })
      }
      const qstr = qs.toString()
      return request<Product[]>(`/products${qstr ? `?${qstr}` : ''}`)
    },
    get: (id: number) => request<Product>(`/products/${id}`),
    create: (data: Partial<Product>) => request<Product>('/products', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<Product>) => request<Product>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id: number) => request<void>(`/products/${id}`, { method: 'DELETE' }),
  },
  categories: {
    list: () => request<Category[]>('/categories'),
    create: (name: string) => request<Category>('/categories', { method: 'POST', body: JSON.stringify({ name }) }),
  },
  sales: {
    list: (params?: { skip?: number; limit?: number }) => {
      const qs = new URLSearchParams()
      if (params?.skip !== undefined) qs.append('skip', String(params.skip))
      if (params?.limit !== undefined) qs.append('limit', String(params.limit))
      return request<Sale[]>(`/sales${qs.toString() ? `?${qs.toString()}` : ''}`)
    },
    get: (id: number) => request<Sale>(`/sales/${id}`),
    create: (data: SaleCreate) => request<Sale>('/sales', { method: 'POST', body: JSON.stringify(data) }),
  },
}

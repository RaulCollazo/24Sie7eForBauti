export interface Category {
  id: number
  name: string
}

export interface Product {
  id: number
  name: string
  sku: string | null
  category_id: number | null
  price: number
  stock: number
  image: string | null
  is_favorite: boolean
  category?: Category | null
}

export interface SaleItem {
  id: number
  product_id: number | null
  product_name: string
  quantity: number
  unit_price: number
  subtotal: number
}

export interface Sale {
  id: number
  number: number
  created_at: string
  payment_method: string
  customer: string | null
  subtotal: number
  discount: number
  tax: number
  total: number
  status: string
  items: SaleItem[]
}

export interface SaleCreate {
  payment_method: string
  customer?: string | null
  discount?: number
  tax_rate?: number
  items: Array<{ product_id: number; quantity: number }>
}

export interface AuthToken {
  access_token: string
  token_type: string
  username: string
}

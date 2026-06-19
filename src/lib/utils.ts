import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateShort(date: Date | string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

export interface CategoryItem {
  id: string
  value: string
  name: string
  type: string
  color: string
  isDefault: boolean
}

// Default categories used for seeding new users
export const DEFAULT_EXPENSE_CATEGORIES = [
  { value: 'food', name: 'Makanan & Minuman', color: '#FF6384' },
  { value: 'transport', name: 'Transportasi', color: '#36A2EB' },
  { value: 'shopping', name: 'Belanja', color: '#FFCE56' },
  { value: 'health', name: 'Kesehatan', color: '#4BC0C0' },
  { value: 'entertainment', name: 'Hiburan', color: '#9966FF' },
  { value: 'education', name: 'Pendidikan', color: '#FF9F40' },
  { value: 'utilities', name: 'Tagihan', color: '#FF6384' },
  { value: 'rent', name: 'Sewa/KPR', color: '#C9CBCF' },
  { value: 'other_expense', name: 'Lainnya', color: '#4BC0C0' },
]

export const DEFAULT_INCOME_CATEGORIES = [
  { value: 'salary', name: 'Gaji', color: '#4CAF50' },
  { value: 'freelance', name: 'Freelance', color: '#8BC34A' },
  { value: 'investment', name: 'Investasi', color: '#CDDC39' },
  { value: 'gift', name: 'Hadiah', color: '#FFC107' },
  { value: 'other_income', name: 'Lainnya', color: '#03A9F4' },
]

// Lookup helpers — prefer DB categories, fall back to hardcoded defaults
export function getCategoryLabel(value: string, categories?: CategoryItem[]): string {
  if (categories?.length) {
    const found = categories.find((c) => c.value === value)
    if (found) return found.name
  }
  const all = [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES]
  return all.find((c) => c.value === value)?.name || value
}

export function getCategoryColor(value: string, categories?: CategoryItem[]): string {
  if (categories?.length) {
    const found = categories.find((c) => c.value === value)
    if (found) return found.color
  }
  const all = [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES]
  return all.find((c) => c.value === value)?.color || '#6B7280'
}

// Generate a URL-safe slug from a category name
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 50)
}

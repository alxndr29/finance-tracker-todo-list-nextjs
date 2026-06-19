'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  Search,
  Filter,
  ImageIcon,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react'
import {
  formatCurrency,
  formatDateShort,
  getCategoryLabel,
  getCategoryColor,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
} from '@/lib/utils'
import { useCategories } from '@/hooks/useCategories'
import TransactionModal from '@/components/TransactionModal'
import ImageViewer from '@/components/ImageViewer'

interface Transaction {
  id: string
  type: string
  amount: number
  category: string
  description?: string | null
  date: string
  imageUrl?: string | null
  imageName?: string | null
  notes?: string | null
}

export default function TransactionsPage() {
  const { categories } = useCategories()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editTx, setEditTx] = useState<Transaction | undefined>()
  const [viewImage, setViewImage] = useState<{ src: string; alt: string } | null>(null)
  const [filters, setFilters] = useState({ type: '', category: '', search: '', month: '', year: '' })
  const [showFilters, setShowFilters] = useState(false)

  const getToken = () => document.cookie.match(/token=([^;]*)/)?.[1] || ''

  const fetchTransactions = useCallback(
    async (page = 1) => {
      setLoading(true)
      try {
        const params = new URLSearchParams({ page: String(page), limit: '15' })
        if (filters.type) params.set('type', filters.type)
        if (filters.category) params.set('category', filters.category)
        if (filters.search) params.set('search', filters.search)
        if (filters.month) params.set('month', filters.month)
        if (filters.year) params.set('year', filters.year)

        const res = await fetch(`/api/transactions?${params}`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        })
        const data = await res.json()
        setTransactions(data.transactions || [])
        setPagination(data.pagination || { page: 1, limit: 15, total: 0, totalPages: 1 })
      } catch {
        // silent fail
      } finally {
        setLoading(false)
      }
    },
    [filters]
  )

  useEffect(() => {
    fetchTransactions(1)
  }, [fetchTransactions])

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus transaksi ini?')) return
    try {
      await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      fetchTransactions(pagination.page)
    } catch {
      alert('Gagal menghapus transaksi')
    }
  }

  const allCategories = categories.length
    ? categories
    : [...DEFAULT_EXPENSE_CATEGORIES.map((c) => ({ ...c, id: c.value, type: 'EXPENSE', isDefault: true })),
       ...DEFAULT_INCOME_CATEGORIES.map((c) => ({ ...c, id: c.value, type: 'INCOME', isDefault: true }))]

  const now = new Date()
  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i)
  const months = [
    { value: '1', label: 'Januari' }, { value: '2', label: 'Februari' },
    { value: '3', label: 'Maret' }, { value: '4', label: 'April' },
    { value: '5', label: 'Mei' }, { value: '6', label: 'Juni' },
    { value: '7', label: 'Juli' }, { value: '8', label: 'Agustus' },
    { value: '9', label: 'September' }, { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' }, { value: '12', label: 'Desember' },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transaksi</h1>
          <p className="text-gray-500 text-sm mt-0.5">{pagination.total} transaksi ditemukan</p>
        </div>
        <button
          onClick={() => { setEditTx(undefined); setShowModal(true) }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Tambah</span>
        </button>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Cari transaksi..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${showFilters ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Tipe</option>
              <option value="INCOME">Pemasukan</option>
              <option value="EXPENSE">Pengeluaran</option>
            </select>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Kategori</option>
              {allCategories.map((c) => (
                <option key={c.value} value={c.value}>{c.name}</option>
              ))}
            </select>
            <select
              value={filters.month}
              onChange={(e) => setFilters({ ...filters, month: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Bulan</option>
              {months.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <select
              value={filters.year}
              onChange={(e) => setFilters({ ...filters, year: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Tahun</option>
              {years.map((y) => (
                <option key={y} value={String(y)}>{y}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Transaction List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Tidak ada transaksi ditemukan</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {transactions.map((tx) => (
              <div key={tx.id} className="px-4 sm:px-5 py-3.5 flex items-center gap-3 hover:bg-gray-50 transition-colors group">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: getCategoryColor(tx.category, categories) + '20' }}
                >
                  <div
                    className="w-3.5 h-3.5 rounded-full"
                    style={{ backgroundColor: getCategoryColor(tx.category, categories) }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {tx.description || getCategoryLabel(tx.category, categories)}
                    </p>
                    {tx.imageUrl && (
                      <button
                        onClick={() => setViewImage({ src: tx.imageUrl!, alt: tx.imageName || 'Bukti' })}
                        className="text-blue-400 hover:text-blue-600 flex-shrink-0"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-400">{formatDateShort(tx.date)}</span>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-full"
                      style={{
                        backgroundColor: getCategoryColor(tx.category, categories) + '20',
                        color: getCategoryColor(tx.category, categories),
                      }}
                    >
                      {getCategoryLabel(tx.category, categories)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-sm font-semibold ${tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(Number(tx.amount))}
                  </span>
                  <div className="hidden group-hover:flex items-center gap-1">
                    <button
                      onClick={() => { setEditTx(tx); setShowModal(true) }}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(tx.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Halaman {pagination.page} dari {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchTransactions(pagination.page - 1)}
                className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchTransactions(pagination.page + 1)}
                className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <TransactionModal
          onClose={() => { setShowModal(false); setEditTx(undefined) }}
          onSuccess={() => { setShowModal(false); setEditTx(undefined); fetchTransactions(pagination.page) }}
          transaction={editTx}
        />
      )}

      {viewImage && (
        <ImageViewer src={viewImage.src} alt={viewImage.alt} onClose={() => setViewImage(null)} />
      )}
    </div>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  Plus,
  RefreshCw,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { formatCurrency, formatDateShort, getCategoryLabel, getCategoryColor } from '@/lib/utils'
import { useCategories } from '@/hooks/useCategories'
import TransactionModal from '@/components/TransactionModal'

interface DashboardData {
  summary: { totalIncome: number; totalExpense: number; balance: number; month: number; year: number }
  recentTransactions: {
    id: string
    type: string
    amount: number
    category: string
    description?: string | null
    date: string
    imageUrl?: string | null
    imageName?: string | null
    notes?: string | null
  }[]
  categoryBreakdown: { category: string; type: string; amount: number }[]
  monthlyTrend: { month: number; year: number; income: number; expense: number }[]
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des']

export default function DashboardPage() {
  const { categories } = useCategories()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const getToken = () =>
    typeof document !== 'undefined' ? document.cookie.match(/token=([^;]*)/)?.[1] || '' : ''

  const fetchDashboard = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/dashboard', {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      if (!res.ok) return
      const json = await res.json()
      setData(json)
    } catch {
      // silent fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  const expenseBreakdown = data?.categoryBreakdown?.filter((c) => c.type === 'EXPENSE') || []
  const trendData =
    data?.monthlyTrend?.map((t) => ({
      name: MONTH_NAMES[t.month - 1],
      Pemasukan: t.income,
      Pengeluaran: t.expense,
    })) || []

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    )
  }

  const summary = data?.summary ?? { totalIncome: 0, totalExpense: 0, balance: 0, month: new Date().getMonth() + 1, year: new Date().getFullYear() }
  const recentTransactions = data?.recentTransactions ?? []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {MONTH_NAMES[summary.month - 1]} {summary.year}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Tambah</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Saldo Bulan Ini</span>
            <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
              <Wallet className="w-4.5 h-4.5 text-blue-600" />
            </div>
          </div>
          <p
            className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-gray-900' : 'text-red-600'}`}
          >
            {formatCurrency(summary.balance)}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Total Pemasukan</span>
            <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-4.5 h-4.5 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(summary.totalIncome)}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Total Pengeluaran</span>
            <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center">
              <TrendingDown className="w-4.5 h-4.5 text-red-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-red-600">
            {formatCurrency(summary.totalExpense)}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Tren 6 Bulan Terakhir</h2>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} />
                <Tooltip
                  formatter={(v) => formatCurrency(Number(v))}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }}
                />
                <Area type="monotone" dataKey="Pemasukan" stroke="#22c55e" fill="url(#colorIncome)" strokeWidth={2} />
                <Area type="monotone" dataKey="Pengeluaran" stroke="#ef4444" fill="url(#colorExpense)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
              Belum ada data transaksi
            </div>
          )}
        </div>

        {/* Expense Pie */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Pengeluaran per Kategori</h2>
          {expenseBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={expenseBreakdown}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                >
                  {expenseBreakdown.map((entry) => (
                    <Cell key={entry.category} fill={getCategoryColor(entry.category, categories)} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => formatCurrency(Number(v))}
                  labelFormatter={(label) => getCategoryLabel(String(label))}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }}
                />
                <Legend
                  formatter={(value) => (
                    <span style={{ fontSize: 11 }}>{getCategoryLabel(value)}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
              Belum ada pengeluaran
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Transaksi Terbaru</h2>
          <Link href="/transactions" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            Lihat semua <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {recentTransactions.length === 0 ? (
            <div className="px-5 py-10 text-center text-gray-400">
              <Wallet className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Belum ada transaksi</p>
            </div>
          ) : (
            recentTransactions.map((tx) => (
              <div key={tx.id} className="px-5 py-3.5 flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: getCategoryColor(tx.category) + '20' }}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getCategoryColor(tx.category) }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {tx.description || getCategoryLabel(tx.category)}
                  </p>
                  <p className="text-xs text-gray-400">{formatDateShort(tx.date)}</p>
                </div>
                <span
                  className={`text-sm font-semibold flex-shrink-0 ${tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}
                >
                  {tx.type === 'INCOME' ? '+' : '-'}
                  {formatCurrency(Number(tx.amount))}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {showModal && (
        <TransactionModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false)
            fetchDashboard()
          }}
        />
      )}
    </div>
  )
}

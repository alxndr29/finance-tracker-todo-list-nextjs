'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, TrendingUp, TrendingDown, BarChart3, Download } from 'lucide-react'
import {
  BarChart,
  Bar,
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
import { formatCurrency, getCategoryLabel, getCategoryColor } from '@/lib/utils'

interface ReportData {
  summary: {
    totalIncome: number
    totalExpense: number
    balance: number
    incomeCount: number
    expenseCount: number
  }
  expenseByCategory: { category: string; amount: number }[]
  incomeByCategory: { category: string; amount: number }[]
  dailyBreakdown: { day: number; income: number; expense: number }[]
  month: number
  year: number
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

export default function ReportsPage() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  const getToken = () => document.cookie.match(/token=([^;]*)/)?.[1] || ''

  const fetchReport = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reports?month=${month}&year=${year}`, {
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
  }, [month, year])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i)

  const handleExportCSV = () => {
    if (!data) return
    const rows = [
      ['Kategori', 'Tipe', 'Jumlah'],
      ...data.expenseByCategory.map((c) => [getCategoryLabel(c.category), 'Pengeluaran', c.amount]),
      ...data.incomeByCategory.map((c) => [getCategoryLabel(c.category), 'Pemasukan', c.amount]),
    ]
    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `laporan-${MONTH_NAMES[month - 1].toLowerCase()}-${year}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    )
  }

  const summary = data?.summary ?? { totalIncome: 0, totalExpense: 0, balance: 0, incomeCount: 0, expenseCount: 0 }
  const expenseByCategory = data?.expenseByCategory ?? []
  const incomeByCategory = data?.incomeByCategory ?? []
  const dailyBreakdown = data?.dailyBreakdown ?? []

  const dailyData = dailyBreakdown.map((d) => ({
    day: `${d.day}`,
    Pemasukan: d.income,
    Pengeluaran: d.expense,
  }))

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laporan</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {MONTH_NAMES[month - 1]} {year}
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium px-4 py-2 rounded-xl transition-colors text-sm"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Export CSV</span>
        </button>
      </div>

      {/* Month/Year Filter */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex gap-3">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {MONTH_NAMES.map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-xs text-gray-500">Pemasukan</span>
          </div>
          <p className="text-base font-bold text-green-600">{formatCurrency(summary.totalIncome)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{summary.incomeCount} transaksi</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-red-600" />
            <span className="text-xs text-gray-500">Pengeluaran</span>
          </div>
          <p className="text-base font-bold text-red-600">{formatCurrency(summary.totalExpense)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{summary.expenseCount} transaksi</p>
        </div>
        <div className="col-span-2 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-gray-500">Saldo Bersih</span>
          </div>
          <p className={`text-lg font-bold ${summary.balance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
            {formatCurrency(summary.balance)}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {summary.balance >= 0 ? 'Surplus' : 'Defisit'} bulan ini
          </p>
        </div>
      </div>

      {/* Daily Chart */}
      {dailyData.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Arus Kas Harian</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dailyData} barSize={8}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} />
              <Tooltip
                formatter={(v) => formatCurrency(Number(v))}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }}
              />
              <Bar dataKey="Pemasukan" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Pengeluaran" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Expense by Category */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Pengeluaran per Kategori</h2>
          {expenseByCategory.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={expenseByCategory} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={65}>
                    {expenseByCategory.map((entry) => (
                      <Cell key={entry.category} fill={getCategoryColor(entry.category)} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => formatCurrency(Number(v))}
                    labelFormatter={(l) => getCategoryLabel(String(l))}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }}
                  />
                  <Legend formatter={(v) => <span style={{ fontSize: 11 }}>{getCategoryLabel(v)}</span>} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-2">
                {expenseByCategory.slice(0, 5).map((c) => (
                  <div key={c.category} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getCategoryColor(c.category) }} />
                      <span className="text-xs text-gray-600">{getCategoryLabel(c.category)}</span>
                    </div>
                    <span className="text-xs font-medium text-gray-900">{formatCurrency(c.amount)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-32 flex items-center justify-center text-gray-400 text-sm">
              Tidak ada pengeluaran
            </div>
          )}
        </div>

        {/* Income by Category */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Pemasukan per Kategori</h2>
          {incomeByCategory.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={incomeByCategory} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={65}>
                    {incomeByCategory.map((entry) => (
                      <Cell key={entry.category} fill={getCategoryColor(entry.category)} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => formatCurrency(Number(v))}
                    labelFormatter={(l) => getCategoryLabel(String(l))}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }}
                  />
                  <Legend formatter={(v) => <span style={{ fontSize: 11 }}>{getCategoryLabel(v)}</span>} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-2">
                {incomeByCategory.slice(0, 5).map((c) => (
                  <div key={c.category} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getCategoryColor(c.category) }} />
                      <span className="text-xs text-gray-600">{getCategoryLabel(c.category)}</span>
                    </div>
                    <span className="text-xs font-medium text-gray-900">{formatCurrency(c.amount)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-32 flex items-center justify-center text-gray-400 text-sm">
              Tidak ada pemasukan
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

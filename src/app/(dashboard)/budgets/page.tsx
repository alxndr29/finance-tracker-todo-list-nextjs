'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, RefreshCw, Target, AlertCircle } from 'lucide-react'
import { formatCurrency, getCategoryLabel, getCategoryColor } from '@/lib/utils'
import BudgetModal from '@/components/BudgetModal'

interface Budget {
  id: string
  category: string
  amount: number
  spent: number
  remaining: number
  percentage: number
  month: number
  year: number
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

export default function BudgetsPage() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const getToken = () => document.cookie.match(/token=([^;]*)/)?.[1] || ''

  const fetchBudgets = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/budgets?month=${month}&year=${year}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      const data = await res.json()
      setBudgets(data.budgets || [])
    } catch {
      // silent fail
    } finally {
      setLoading(false)
    }
  }, [month, year])

  useEffect(() => {
    fetchBudgets()
  }, [fetchBudgets])

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus anggaran ini?')) return
    try {
      await fetch(`/api/budgets/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      fetchBudgets()
    } catch {
      alert('Gagal menghapus anggaran')
    }
  }

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i)

  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0)
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0)
  const overBudget = budgets.filter((b) => b.spent > b.amount)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Anggaran</h1>
          <p className="text-gray-500 text-sm mt-0.5">Kelola batas pengeluaran bulanan</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Tambah</span>
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

      {/* Summary */}
      {budgets.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Total Anggaran</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(totalBudget)}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Total Terpakai</p>
            <p className={`text-lg font-bold ${totalSpent > totalBudget ? 'text-red-600' : 'text-gray-900'}`}>
              {formatCurrency(totalSpent)}
            </p>
          </div>
          <div className="col-span-2 sm:col-span-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Sisa Anggaran</p>
            <p className={`text-lg font-bold ${totalBudget - totalSpent < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(totalBudget - totalSpent)}
            </p>
          </div>
        </div>
      )}

      {/* Over budget warning */}
      {overBudget.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Anggaran Terlampaui</p>
            <p className="text-xs text-red-600 mt-0.5">
              {overBudget.map((b) => getCategoryLabel(b.category)).join(', ')} melebihi batas anggaran.
            </p>
          </div>
        </div>
      )}

      {/* Budget List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : budgets.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <Target className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Belum ada anggaran untuk periode ini</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-3 text-sm text-blue-600 hover:underline"
            >
              Tambah anggaran sekarang
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {budgets.map((budget) => {
              const isOver = budget.spent > budget.amount
              const color = getCategoryColor(budget.category)
              return (
                <div key={budget.id} className="px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: color + '20' }}
                      >
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {getCategoryLabel(budget.category)}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${
                          isOver
                            ? 'bg-red-100 text-red-700'
                            : budget.percentage > 80
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {budget.percentage.toFixed(0)}%
                      </span>
                      <button
                        onClick={() => handleDelete(budget.id)}
                        className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(budget.percentage, 100)}%`,
                        backgroundColor: isOver ? '#ef4444' : budget.percentage > 80 ? '#f59e0b' : color,
                      }}
                    />
                  </div>

                  {isOver && (
                    <p className="text-xs text-red-500 mt-1.5">
                      Melebihi anggaran: {formatCurrency(Math.abs(budget.remaining))}
                    </p>
                  )}
                  {!isOver && (
                    <p className="text-xs text-gray-400 mt-1.5">
                      Sisa: {formatCurrency(budget.remaining)}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showModal && (
        <BudgetModal
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); fetchBudgets() }}
          month={month}
          year={year}
        />
      )}
    </div>
  )
}

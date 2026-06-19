'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Loader2, Trash2, ImageIcon } from 'lucide-react'
import { format } from 'date-fns'
import { useCategories } from '@/hooks/useCategories'

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

interface TransactionModalProps {
  onClose: () => void
  onSuccess: () => void
  transaction?: Transaction
}

export default function TransactionModal({
  onClose,
  onSuccess,
  transaction,
}: TransactionModalProps) {
  const isEdit = !!transaction
  const { expenseCategories, incomeCategories } = useCategories()

  const [form, setForm] = useState({
    type: transaction?.type || 'EXPENSE',
    amount: transaction?.amount?.toString() || '',
    category: transaction?.category || '',
    description: transaction?.description || '',
    date: transaction?.date
      ? format(new Date(transaction.date), 'yyyy-MM-dd')
      : format(new Date(), 'yyyy-MM-dd'),
    notes: transaction?.notes || '',
    imageUrl: transaction?.imageUrl || '',
    imageName: transaction?.imageName || '',
  })
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const categories = form.type === 'INCOME' ? incomeCategories : expenseCategories

  useEffect(() => {
    const valid = categories.find((c) => c.value === form.category)
    if (!valid) setForm((f) => ({ ...f, category: '' }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.type, categories.length])

  const getToken = () => document.cookie.match(/token=([^;]*)/)?.[1] || ''

  const handleFileUpload = async (file: File): Promise<void> => {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setForm((f) => ({ ...f, imageUrl: data.imageUrl, imageName: data.imageName }))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload gagal')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const url = isEdit ? `/api/transactions/${transaction!.id}` : '/api/transactions'
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onSuccess()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[95vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-lg font-bold text-gray-900">
            {isEdit ? 'Edit Transaksi' : 'Tambah Transaksi'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Type toggle */}
          <div className="flex rounded-xl overflow-hidden border border-gray-200">
            {['EXPENSE', 'INCOME'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setForm((f) => ({ ...f, type: t }))}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                  form.type === t
                    ? t === 'INCOME'
                      ? 'bg-green-500 text-white'
                      : 'bg-red-500 text-white'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jumlah (Rp) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
                min="0"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kategori <span className="text-red-500">*</span>
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Pilih kategori</option>
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Deskripsi singkat transaksi"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={2}
              placeholder="Catatan tambahan (opsional)"
            />
          </div>

          {/* Image upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Foto Bukti (opsional)
            </label>
            {form.imageUrl ? (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <img
                  src={form.imageUrl}
                  alt="Bukti transaksi"
                  className="w-full max-h-48 object-cover"
                />
                <div className="flex items-center justify-between px-3 py-2 bg-gray-50">
                  <span className="text-xs text-gray-500 truncate">{form.imageName}</span>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, imageUrl: '', imageName: '' }))}
                    className="text-red-500 hover:text-red-700 ml-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <div className="flex items-center justify-center gap-2 text-blue-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Mengupload...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1 text-gray-400">
                    <ImageIcon className="w-6 h-6" />
                    <span className="text-sm">Klik untuk upload foto bukti</span>
                    <span className="text-xs">JPG, PNG, WebP maks 5MB</span>
                  </div>
                )}
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileUpload(file)
                e.target.value = ''
              }}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Menyimpan...' : isEdit ? 'Simpan' : 'Tambah'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

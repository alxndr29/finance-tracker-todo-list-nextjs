'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, RefreshCw, Check, X, ShieldCheck } from 'lucide-react'

interface Category {
  id: string
  name: string
  value: string
  type: 'INCOME' | 'EXPENSE'
  color: string
  isDefault: boolean
}

const PRESET_COLORS = [
  '#FF6384', '#FF9F40', '#FFCE56', '#4BC0C0',
  '#36A2EB', '#9966FF', '#C9CBCF', '#4CAF50',
  '#8BC34A', '#CDDC39', '#03A9F4', '#E91E63',
  '#FF5722', '#795548', '#607D8B', '#6B7280',
]

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {PRESET_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
          style={{
            backgroundColor: c,
            borderColor: value === c ? '#1d4ed8' : 'transparent',
            outline: value === c ? '2px solid #bfdbfe' : 'none',
          }}
        />
      ))}
    </div>
  )
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  // Add form state per type
  const [addingType, setAddingType] = useState<'INCOME' | 'EXPENSE' | null>(null)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#6B7280')
  const [saving, setSaving] = useState(false)
  const [addError, setAddError] = useState('')

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const [editError, setEditError] = useState('')

  // Delete state
  const [deleteError, setDeleteError] = useState<Record<string, string>>({})

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/categories')
      if (!res.ok) return
      const json = await res.json()
      setCategories(json.categories ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCategories() }, [fetchCategories])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim() || !addingType) return
    setSaving(true)
    setAddError('')
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), type: addingType, color: newColor }),
      })
      const json = await res.json()
      if (!res.ok) { setAddError(json.error); return }
      setCategories((prev) => [...prev, json.category])
      setNewName('')
      setNewColor('#6B7280')
      setAddingType(null)
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (cat: Category) => {
    setEditingId(cat.id)
    setEditName(cat.name)
    setEditColor(cat.color)
    setEditError('')
  }

  const saveEdit = async (id: string) => {
    if (!editName.trim()) return
    setSaving(true)
    setEditError('')
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), color: editColor }),
      })
      const json = await res.json()
      if (!res.ok) { setEditError(json.error); return }
      setCategories((prev) => prev.map((c) => c.id === id ? json.category : c))
      setEditingId(null)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (cat: Category) => {
    setDeleteError((prev) => ({ ...prev, [cat.id]: '' }))
    const res = await fetch(`/api/categories/${cat.id}`, { method: 'DELETE' })
    const json = await res.json()
    if (!res.ok) {
      setDeleteError((prev) => ({ ...prev, [cat.id]: json.error }))
      return
    }
    setCategories((prev) => prev.filter((c) => c.id !== cat.id))
  }

  const income = categories.filter((c) => c.type === 'INCOME')
  const expense = categories.filter((c) => c.type === 'EXPENSE')

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    )
  }

  const renderGroup = (title: string, type: 'INCOME' | 'EXPENSE', list: Category[], accentClass: string) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className={`px-5 py-3.5 border-b border-gray-100 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${type === 'INCOME' ? 'bg-green-500' : 'bg-red-500'}`} />
          <h2 className="font-semibold text-gray-800 text-sm">{title}</h2>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{list.length}</span>
        </div>
        {addingType !== type && (
          <button
            onClick={() => { setAddingType(type); setNewName(''); setNewColor('#6B7280'); setAddError('') }}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${accentClass}`}
          >
            <Plus className="w-3.5 h-3.5" />
            Tambah
          </button>
        )}
      </div>

      <div className="divide-y divide-gray-50">
        {list.map((cat) => (
          <div key={cat.id}>
            {editingId === cat.id ? (
              <div className="px-5 py-4 space-y-3">
                <div className="flex gap-2">
                  <input
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Escape') setEditingId(null) }}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => saveEdit(cat.id)}
                    disabled={saving || !editName.trim()}
                    className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="p-1.5 border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <ColorPicker value={editColor} onChange={setEditColor} />
                {editError && <p className="text-xs text-red-500">{editError}</p>}
              </div>
            ) : (
              <div className="flex items-center gap-3 px-5 py-3.5 group">
                <div className="w-8 h-8 rounded-xl flex-shrink-0" style={{ backgroundColor: cat.color + '25' }}>
                  <div className="w-full h-full rounded-xl flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-800">{cat.name}</span>
                    {cat.isDefault && (
                      <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                        <ShieldCheck className="w-3 h-3" />
                        default
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">{cat.value}</span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEdit(cat)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  {!cat.isDefault && (
                    <button
                      onClick={() => handleDelete(cat)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}
            {deleteError[cat.id] && (
              <p className="px-5 pb-3 text-xs text-red-500">{deleteError[cat.id]}</p>
            )}
          </div>
        ))}

        {/* Add form */}
        {addingType === type && (
          <form onSubmit={handleAdd} className="px-5 py-4 space-y-3 bg-gray-50">
            <div className="flex gap-2">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nama kategori..."
                className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
              <button
                type="submit"
                disabled={saving || !newName.trim()}
                className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setAddingType(null)}
                className="p-1.5 border border-gray-200 text-gray-500 rounded-lg hover:bg-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <ColorPicker value={newColor} onChange={setNewColor} />
            {addError && <p className="text-xs text-red-500">{addError}</p>}
          </form>
        )}
      </div>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Kelola Kategori</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {income.length} pemasukan · {expense.length} pengeluaran
        </p>
      </div>

      {renderGroup('Pemasukan', 'INCOME', income, 'text-green-700 bg-green-50 hover:bg-green-100')}
      {renderGroup('Pengeluaran', 'EXPENSE', expense, 'text-red-700 bg-red-50 hover:bg-red-100')}

      <p className="text-xs text-gray-400 text-center pb-2">
        Kategori <span className="inline-flex items-center gap-0.5"><ShieldCheck className="w-3 h-3" /> default</span> dapat diubah namanya tapi tidak dapat dihapus.
        Kategori yang sedang dipakai transaksi tidak dapat dihapus.
      </p>
    </div>
  )
}

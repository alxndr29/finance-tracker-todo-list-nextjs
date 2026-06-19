'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, CheckCircle2, Circle, Calendar, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

interface Todo {
  id: string
  title: string
  description: string | null
  completed: boolean
  dueDate: string | null
  createdAt: string
}

type Filter = 'all' | 'active' | 'completed'

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')

  // Form tambah
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newDueDate, setNewDueDate] = useState('')
  const [showFormExtra, setShowFormExtra] = useState(false)
  const [adding, setAdding] = useState(false)

  // Edit inline
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')

  const fetchTodos = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/todos')
      if (!res.ok) return
      const json = await res.json()
      setTodos(json.todos ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTodos() }, [fetchTodos])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    setAdding(true)
    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription || null,
          dueDate: newDueDate || null,
        }),
      })
      if (!res.ok) return
      const json = await res.json()
      setTodos((prev) => [json.todo, ...prev])
      setNewTitle('')
      setNewDescription('')
      setNewDueDate('')
      setShowFormExtra(false)
    } finally {
      setAdding(false)
    }
  }

  const toggleComplete = async (todo: Todo) => {
    setTodos((prev) => prev.map((t) => t.id === todo.id ? { ...t, completed: !t.completed } : t))
    await fetch(`/api/todos/${todo.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !todo.completed }),
    })
  }

  const handleDelete = async (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id))
    await fetch(`/api/todos/${id}`, { method: 'DELETE' })
  }

  const startEdit = (todo: Todo) => {
    setEditingId(todo.id)
    setEditTitle(todo.title)
    setEditDescription(todo.description ?? '')
  }

  const saveEdit = async (id: string) => {
    if (!editTitle.trim()) return
    setTodos((prev) => prev.map((t) =>
      t.id === id ? { ...t, title: editTitle.trim(), description: editDescription.trim() || null } : t
    ))
    setEditingId(null)
    await fetch(`/api/todos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: editTitle, description: editDescription || null }),
    })
  }

  const cancelEdit = () => setEditingId(null)

  const filtered = todos.filter((t) => {
    if (filter === 'active') return !t.completed
    if (filter === 'completed') return t.completed
    return true
  })

  const activeCount = todos.filter((t) => !t.completed).length
  const completedCount = todos.filter((t) => t.completed).length

  const isOverdue = (dueDate: string | null) =>
    !!dueDate && new Date(dueDate) < new Date(new Date().toDateString())

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">To-Do List</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {activeCount} tugas aktif · {completedCount} selesai
        </p>
      </div>

      {/* Form tambah */}
      <form onSubmit={handleAdd} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Tambah tugas baru..."
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={() => setShowFormExtra((v) => !v)}
            className="p-2.5 border border-gray-200 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
            title="Tambah deskripsi & tanggal"
          >
            {showFormExtra ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            type="submit"
            disabled={adding || !newTitle.trim()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium px-4 py-2.5 rounded-xl transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Tambah</span>
          </button>
        </div>

        {showFormExtra && (
          <>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Deskripsi (opsional)..."
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600"
              />
              {newDueDate && (
                <button type="button" onClick={() => setNewDueDate('')} className="text-xs text-gray-400 hover:text-gray-600">
                  Hapus tanggal
                </button>
              )}
            </div>
          </>
        )}
      </form>

      {/* Filter */}
      <div className="flex gap-1 bg-white rounded-xl border border-gray-100 p-1 shadow-sm w-fit">
        {(['all', 'active', 'completed'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {f === 'all' ? 'Semua' : f === 'active' ? 'Aktif' : 'Selesai'}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
        {filtered.length === 0 ? (
          <div className="py-14 text-center text-gray-400">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              {filter === 'completed' ? 'Belum ada tugas yang selesai' :
               filter === 'active' ? 'Semua tugas sudah selesai!' :
               'Belum ada tugas. Tambah sekarang!'}
            </p>
          </div>
        ) : (
          filtered.map((todo) => (
            <div key={todo.id} className={`flex items-start gap-3 px-4 py-4 group ${todo.completed ? 'opacity-60' : ''}`}>
              <button
                onClick={() => toggleComplete(todo)}
                className="mt-0.5 flex-shrink-0 text-gray-300 hover:text-blue-500 transition-colors"
              >
                {todo.completed
                  ? <CheckCircle2 className="w-5 h-5 text-blue-500" />
                  : <Circle className="w-5 h-5" />}
              </button>

              <div className="flex-1 min-w-0">
                {editingId === todo.id ? (
                  <div className="space-y-2">
                    <input
                      autoFocus
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Escape') cancelEdit() }}
                      className="w-full text-sm border border-blue-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Deskripsi (opsional)..."
                      rows={3}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(todo.id)}
                        className="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Simpan
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1 rounded-lg border border-gray-200 transition-colors"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p
                      onDoubleClick={() => !todo.completed && startEdit(todo)}
                      className={`text-sm font-medium ${todo.completed ? 'line-through text-gray-400' : 'text-gray-800 cursor-text'}`}
                    >
                      {todo.title}
                    </p>
                    {todo.description && (
                      <p
                        onDoubleClick={() => !todo.completed && startEdit(todo)}
                        className={`text-xs mt-1 leading-relaxed whitespace-pre-wrap ${todo.completed ? 'text-gray-300' : 'text-gray-500 cursor-text'}`}
                      >
                        {todo.description}
                      </p>
                    )}
                    {todo.dueDate && (
                      <p className={`text-xs mt-1.5 flex items-center gap-1 ${isOverdue(todo.dueDate) && !todo.completed ? 'text-red-500' : 'text-gray-400'}`}>
                        <Calendar className="w-3 h-3" />
                        {format(new Date(todo.dueDate), 'd MMM yyyy', { locale: localeId })}
                        {isOverdue(todo.dueDate) && !todo.completed && ' · Terlambat'}
                      </p>
                    )}
                  </>
                )}
              </div>

              {editingId !== todo.id && (
                <button
                  onClick={() => handleDelete(todo.id)}
                  className="flex-shrink-0 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 mt-0.5"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {completedCount > 0 && filter !== 'active' && (
        <button
          onClick={async () => {
            const completed = todos.filter((t) => t.completed)
            setTodos((prev) => prev.filter((t) => !t.completed))
            await Promise.all(completed.map((t) => fetch(`/api/todos/${t.id}`, { method: 'DELETE' })))
          }}
          className="text-sm text-gray-400 hover:text-red-500 transition-colors"
        >
          Hapus semua yang selesai ({completedCount})
        </button>
      )}
    </div>
  )
}

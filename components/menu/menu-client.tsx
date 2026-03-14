'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { MenuToggle } from './menu-toggle'
import { MenuForm } from './menu-form'
import { deleteMenuItem } from '@/app/(dashboard)/dashboard/menu/actions'
import type { MenuItem } from '@/lib/supabase/types'

interface MenuClientProps {
  itemsByCategory: Record<string, MenuItem[]>
}

export function MenuClient({ itemsByCategory }: MenuClientProps) {
  const [formOpen, setFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | undefined>()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  function openCreate() {
    setEditingItem(undefined)
    setFormOpen(true)
  }

  function openEdit(item: MenuItem) {
    setEditingItem(item)
    setFormOpen(true)
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este ítem del menú?')) return
    setDeletingId(id)
    setDeleteError(null)
    const result = await deleteMenuItem(id)
    setDeletingId(null)
    if (result?.error) setDeleteError(result.error)
  }

  const categories = Object.keys(itemsByCategory).sort()
  const total = categories.reduce((sum, cat) => sum + itemsByCategory[cat].length, 0)

  return (
    <>
      <div className="pb-24">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-gray-900">Menú</h1>
          <p className="text-sm text-gray-500">{total} ítems en el menú</p>
        </div>
        {deleteError && (
          <p className="mb-3 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{deleteError}</p>
        )}

        {categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-gray-500 font-medium">Tu menú está vacío</p>
            <p className="text-sm text-gray-400 mb-4">Agrega tu primer ítem para comenzar</p>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: '#b8922a' }}
            >
              <Plus className="h-4 w-4" />
              Agregar ítem
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {categories.map((category) => (
              <div key={category}>
                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 px-1">
                  {category}
                </h2>
                <div className="space-y-2">
                  {itemsByCategory[category].map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p
                            className="font-semibold text-sm leading-tight"
                            style={{ color: item.is_available ? '#111827' : '#9ca3af' }}
                          >
                            {item.name}
                          </p>
                          {item.description && (
                            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                              {item.description}
                            </p>
                          )}
                          <p
                            className="text-base font-bold mt-1"
                            style={{ color: '#b8922a' }}
                          >
                            €{Number(item.price).toFixed(2)}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <MenuToggle id={item.id} initial={item.is_available} />
                          <button
                            onClick={() => openEdit(item)}
                            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            disabled={deletingId === item.id}
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 disabled:opacity-40"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={openCreate}
        className="fixed bottom-20 right-4 md:bottom-6 z-40 h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-95"
        style={{ backgroundColor: '#b8922a' }}
        aria-label="Añadir ítem"
      >
        <Plus className="h-6 w-6 text-white" />
      </button>

      <MenuForm
        item={editingItem}
        open={formOpen}
        onClose={() => setFormOpen(false)}
      />
    </>
  )
}

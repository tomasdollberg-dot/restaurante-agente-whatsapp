'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
    await deleteMenuItem(id)
    setDeletingId(null)
  }

  const categories = Object.keys(itemsByCategory).sort()
  const total = categories.reduce((sum, cat) => sum + itemsByCategory[cat].length, 0)

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Menú</h1>
          <p className="text-muted-foreground">{total} ítems en el menú</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo ítem
        </Button>
      </div>

      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <p className="text-lg font-medium text-muted-foreground">Tu menú está vacío</p>
          <p className="mb-4 text-sm text-muted-foreground">Agrega tu primer ítem para comenzar</p>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar ítem
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {categories.map((category) => (
            <div key={category}>
              <h2 className="mb-3 text-lg font-semibold text-muted-foreground uppercase tracking-wide text-xs border-b pb-2">
                {category}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {itemsByCategory[category].map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col justify-between rounded-lg border bg-white p-4 shadow-sm"
                  >
                    <div className="mb-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium leading-tight">{item.name}</p>
                        <Badge variant={item.is_available ? 'success' : 'outline'} className="shrink-0">
                          {item.is_available ? (
                            <><CheckCircle className="mr-1 h-3 w-3" />Disponible</>
                          ) : (
                            <><XCircle className="mr-1 h-3 w-3" />No disponible</>
                          )}
                        </Badge>
                      </div>
                      {item.description && (
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold">€{Number(item.price).toFixed(2)}</span>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingId === item.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <MenuForm
        item={editingItem}
        open={formOpen}
        onClose={() => setFormOpen(false)}
      />
    </>
  )
}

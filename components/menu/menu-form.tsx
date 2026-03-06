'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import type { MenuItem } from '@/lib/supabase/types'
import { createMenuItem, updateMenuItem } from '@/app/(dashboard)/dashboard/menu/actions'

const CATEGORIES = [
  'Entrantes', 'Ensaladas', 'Sopas', 'Platos principales', 'Carnes', 'Pescados',
  'Pastas', 'Pizzas', 'Postres', 'Bebidas', 'Vinos', 'Cócteles', 'Otros',
]

const ALLERGENS = [
  { emoji: '🌾', name: 'Gluten' },
  { emoji: '🦐', name: 'Crustáceos' },
  { emoji: '🐟', name: 'Pescado' },
  { emoji: '🫘', name: 'Soja' },
  { emoji: '🥛', name: 'Lácteos' },
  { emoji: '🌰', name: 'Frutos secos' },
]

interface MenuFormProps {
  item?: MenuItem
  open: boolean
  onClose: () => void
}

export function MenuForm({ item, open, onClose }: MenuFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [category, setCategory] = useState(item?.category ?? '')
  const [isAvailable, setIsAvailable] = useState(item?.is_available ?? true)
  const [allergens, setAllergens] = useState<string[]>(item?.allergens ?? [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    formData.set('category', category)
    formData.set('is_available', String(isAvailable))
    allergens.forEach((a) => formData.append('allergens', a))

    const result = item
      ? await updateMenuItem(item.id, formData)
      : await createMenuItem(formData)

    setLoading(false)

    if (result.error) {
      setError(result.error)
      return
    }

    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{item ? 'Editar ítem' : 'Nuevo ítem del menú'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Nombre del plato *</Label>
            <Input
              id="name"
              name="name"
              defaultValue={item?.name}
              placeholder="Ej: Pasta Carbonara"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={item?.description ?? ''}
              placeholder="Ingredientes o descripción breve"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Precio (€) *</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                defaultValue={item?.price ?? ''}
                placeholder="12.50"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Categoría *</Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_available"
              className="h-4 w-4 rounded border-gray-300"
              checked={isAvailable}
              onChange={(e) => setIsAvailable(e.target.checked)}
            />
            <Label htmlFor="is_available" className="font-normal">Disponible en el menú</Label>
          </div>

          <div className="space-y-2">
            <Label>Alérgenos</Label>
            <div className="flex flex-wrap gap-2">
              {ALLERGENS.map(({ emoji, name }) => {
                const checked = allergens.includes(name)
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() =>
                      setAllergens(
                        checked ? allergens.filter((a) => a !== name) : [...allergens, name]
                      )
                    }
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      checked
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span>{emoji}</span>
                    {name}
                  </button>
                )
              })}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !category}>
              {loading ? 'Guardando...' : item ? 'Guardar cambios' : 'Crear ítem'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

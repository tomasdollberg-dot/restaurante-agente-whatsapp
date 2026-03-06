'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import type { Restaurant } from '@/lib/supabase/types'

const MenuItemSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'El precio debe ser mayor o igual a 0'),
  category: z.string().min(1, 'La categoría es requerida'),
  is_available: z.coerce.boolean().default(true),
  allergens: z.array(z.string()).default([]),
})

async function getRestaurantId(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase.from('restaurants').select('id').eq('owner_id', userId).single()
  return (data as Pick<Restaurant, 'id'> | null)?.id
}

export async function createMenuItem(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const restaurantId = await getRestaurantId(supabase, user.id)
  if (!restaurantId) return { error: 'Restaurante no encontrado' }

  const parsed = MenuItemSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    price: formData.get('price'),
    category: formData.get('category'),
    is_available: formData.get('is_available') === 'true',
    allergens: formData.getAll('allergens'),
  })

  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { error } = await supabase.from('menu_items').insert({
    restaurant_id: restaurantId,
    ...parsed.data,
  } as never)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/menu')
  return { success: true }
}

export async function updateMenuItem(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const parsed = MenuItemSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    price: formData.get('price'),
    category: formData.get('category'),
    is_available: formData.get('is_available') === 'true',
    allergens: formData.getAll('allergens'),
  })

  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { error } = await supabase.from('menu_items').update(parsed.data as never).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/menu')
  return { success: true }
}

export async function deleteMenuItem(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('menu_items').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/menu')
  return { success: true }
}

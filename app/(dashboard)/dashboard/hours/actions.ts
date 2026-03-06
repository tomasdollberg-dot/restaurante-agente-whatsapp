'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Restaurant } from '@/lib/supabase/types'

export async function saveHours(hours: Array<{
  day_of_week: number
  open_time: string | null
  close_time: string | null
  is_closed: boolean
}>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: restaurantData } = await supabase
    .from('restaurants')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  const restaurant = restaurantData as Pick<Restaurant, 'id'> | null
  if (!restaurant) return { error: 'Restaurante no encontrado' }

  const rows = hours.map((h) => ({ ...h, restaurant_id: restaurant.id }))

  const { error } = await supabase
    .from('restaurant_hours')
    .upsert(rows as never, { onConflict: 'restaurant_id,day_of_week' })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/hours')
  return { success: true }
}

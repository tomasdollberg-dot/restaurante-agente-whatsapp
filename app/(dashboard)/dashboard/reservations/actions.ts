'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ReservationStatus, Restaurant } from '@/lib/supabase/types'

export async function updateReservationStatus(id: string, status: ReservationStatus) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: reservation } = await supabase
    .from('reservations')
    .select('restaurant_id, restaurants!inner(owner_id)')
    .eq('id', id)
    .eq('restaurants.owner_id', user.id)
    .maybeSingle()

  if (!reservation) return { error: 'No autorizado' }

  const { error } = await supabase
    .from('reservations')
    .update({ status } as never)
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/reservations')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function createReservation(formData: FormData) {
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

  const { error } = await supabase.from('reservations').insert({
    restaurant_id: restaurant.id,
    customer_name: formData.get('customer_name') as string,
    customer_phone: formData.get('customer_phone') as string,
    reservation_date: formData.get('reservation_date') as string,
    reservation_time: formData.get('reservation_time') as string,
    party_size: Number(formData.get('party_size')),
    notes: (formData.get('notes') as string) || null,
    status: 'pending',
  } as never)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/reservations')
  revalidatePath('/dashboard')
  return { success: true }
}

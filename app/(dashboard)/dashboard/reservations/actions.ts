'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { sendWhatsAppMessage } from '@/lib/twilio'
import type { ReservationStatus, Reservation, Restaurant } from '@/lib/supabase/types'

export async function updateReservationStatus(id: string, status: ReservationStatus) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  // Fetch reservation + restaurant in one query for auth check and notification data
  const { data: reservationData } = await supabase
    .from('reservations')
    .select('*, restaurants!inner(owner_id, name, whatsapp_number)')
    .eq('id', id)
    .eq('restaurants.owner_id', user.id)
    .maybeSingle()

  if (!reservationData) return { error: 'No autorizado' }

  const { error } = await supabase
    .from('reservations')
    .update({ status } as Record<string, unknown>)
    .eq('id', id)

  if (error) return { error: error.message }

  // Send WhatsApp notification to the customer
  const r = reservationData as Reservation & { restaurants: Pick<Restaurant, 'owner_id' | 'name' | 'whatsapp_number'> }
  const restaurantName = r.restaurants.name
  const twilioFrom = r.restaurants.whatsapp_number ?? process.env.TWILIO_WHATSAPP_NUMBER!

  let customerMsg: string | null = null
  if (status === 'confirmed') {
    customerMsg = `Hola ${r.customer_name}, tu reserva en ${restaurantName} para el ${r.reservation_date} a las ${r.reservation_time.slice(0, 5)} está confirmada. ¡Hasta pronto!`
  } else if (status === 'cancelled') {
    customerMsg = `Hola ${r.customer_name}, lamentamos informarte que no tenemos disponibilidad para el ${r.reservation_date} a las ${r.reservation_time.slice(0, 5)} en ${restaurantName}. Esperamos verte pronto.`
  }

  if (customerMsg && r.customer_phone) {
    console.log('[RESERVA] Intentando enviar WhatsApp a:', r.customer_phone, 'estado:', status)
    console.log('[RESERVA] TWILIO_ACCOUNT_SID presente:', !!process.env.TWILIO_ACCOUNT_SID)
    console.log('[RESERVA] TWILIO_AUTH_TOKEN presente:', !!process.env.TWILIO_AUTH_TOKEN)
    try {
      await sendWhatsAppMessage(r.customer_phone, customerMsg, twilioFrom)
    } catch (e) {
      console.error('[WHATSAPP] Error enviando notificación al cliente:', e)
    }
  }

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
  } as Record<string, unknown>)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/reservations')
  revalidatePath('/dashboard')
  return { success: true }
}

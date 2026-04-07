'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { sendWhatsAppMessage } from '@/lib/twilio'
import type { ReservationStatus, Reservation, Restaurant, ConversationMessage } from '@/lib/supabase/types'

export async function updateReservationStatus(id: string, status: ReservationStatus) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  // Fetch reservation + restaurant in one query for auth check and notification data
  const { data: reservationData } = await supabase
    .from('reservations')
    .select('*, restaurants!inner(owner_id, name, whatsapp_number, google_maps_url)')
    .eq('id', id)
    .eq('restaurants.owner_id', user.id)
    .maybeSingle()

  if (!reservationData) return { error: 'No autorizado' }

  const { error } = await supabase
    .from('reservations')
    .update({ status } as Record<string, unknown>)
    .eq('id', id)

  if (error) return { error: error.message }

  const r = reservationData as Reservation & { restaurants: Pick<Restaurant, 'owner_id' | 'name' | 'whatsapp_number' | 'google_maps_url'> }

  const restaurantName = r.restaurants.name.trim()
  const twilioFrom = r.restaurants.whatsapp_number ?? process.env.TWILIO_WHATSAPP_NUMBER!

  // Auto-cancel any previous reservation from same customer on same date
  if (status === 'confirmed') {
    const { data: previousReservation } = await supabase
      .from('reservations')
      .select('id')
      .eq('restaurant_id', r.restaurant_id)
      .eq('customer_phone', r.customer_phone)
      .eq('reservation_date', r.reservation_date)
      .in('status', ['confirmed', 'pending'])
      .neq('id', id)
      .limit(1)
      .maybeSingle()

    if (previousReservation) {
      await supabase
        .from('reservations')
        .update({ status: 'cancelled' } as Record<string, unknown>)
        .eq('id', (previousReservation as Record<string, unknown>).id)
      console.log('[RESERVA] Reserva anterior cancelada por modificación:', (previousReservation as Record<string, unknown>).id)
    }

    // Programar mensaje de reseña — el índice único parcial (restaurant_id, customer_phone) WHERE sent=false
    // previene duplicados a nivel de BD incluso ante inserciones concurrentes
    const reservationDateTime = new Date(`${r.reservation_date}T${r.reservation_time}+02:00`)
    const hoursToAdd = r.reservation_time < '17:00:00' ? 3 : 14
    const sendAt = new Date(reservationDateTime.getTime() + hoursToAdd * 60 * 60 * 1000)

    const mapsLine = r.restaurants.google_maps_url
      ? `\n\nSi quieres dejarnos una reseña o valoración, nos ayudaría muchísimo: ${r.restaurants.google_maps_url}`
      : ''

    const { error: scheduleError } = await supabase.from('scheduled_messages').insert({
      restaurant_id: r.restaurant_id,
      customer_phone: r.customer_phone,
      message: `¡Nos encantó haberte visto, ${r.customer_name}! Esperamos volver a recibirte pronto.${mapsLine}`,
      twilio_number: twilioFrom,
      send_at: sendAt.toISOString(),
      type: 'review',
      reservation_date: r.reservation_date,
    } as Record<string, unknown>)

    if (scheduleError) {
      // código 23505 = unique_violation — duplicado prevenido por el índice parcial único
      if (scheduleError.code === '23505') {
        console.log('[RESERVA] Duplicado prevenido por constraint único:', r.customer_phone)
      } else {
        console.error('[RESERVA] Error insertando scheduled_message:', scheduleError.message)
      }
    } else {
      console.log('[RESERVA] Mensaje de reseña programado para:', sendAt.toISOString())
    }
  }

  if (status === 'cancelled') {
    await supabase
      .from('scheduled_messages')
      .delete()
      .eq('restaurant_id', r.restaurant_id)
      .eq('customer_phone', r.customer_phone)
      .eq('sent', false)
    console.log('[RESERVA] Scheduled messages eliminados por cancelación')
  }

  // Send WhatsApp notification to the customer

  let customerMsg: string | null = null
  if (status === 'confirmed') {
    customerMsg = `Hola ${r.customer_name}, tu reserva en ${restaurantName} para el ${r.reservation_date} a las ${r.reservation_time.slice(0, 5)} está confirmada. ¡Nos vemos pronto!`
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

    // Save the system message to conversation history
    try {
      const newMsg: ConversationMessage = {
        role: 'assistant',
        content: customerMsg,
        timestamp: new Date().toISOString(),
      }

      const { data: convData } = await supabase
        .from('conversations')
        .select('id, messages')
        .eq('restaurant_id', r.restaurant_id)
        .eq('customer_phone', r.customer_phone)
        .maybeSingle()

      if (convData) {
        const existing = (convData.messages as ConversationMessage[]) ?? []
        await supabase
          .from('conversations')
          .update({ messages: [...existing, newMsg] })
          .eq('id', convData.id)
      } else {
        await supabase.from('conversations').insert({
          restaurant_id: r.restaurant_id,
          customer_phone: r.customer_phone,
          messages: [newMsg],
        } as Record<string, unknown>)
      }
    } catch (e) {
      console.error('[RESERVA] Error guardando mensaje en historial:', e)
    }
  }

  revalidatePath('/dashboard/reservations')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function loadMoreReservations(restaurantId: string, offset: number): Promise<{ reservations: Reservation[], hasMore: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { reservations: [], hasMore: false }

  // Verify ownership before fetching
  const { data: restaurantData } = await supabase
    .from('restaurants')
    .select('id')
    .eq('id', restaurantId)
    .eq('owner_id', user.id)
    .single()
  if (!restaurantData) return { reservations: [], hasMore: false }

  const { data } = await supabase
    .from('reservations')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('reservation_date', { ascending: false })
    .order('reservation_time', { ascending: false })
    .range(offset, offset + 50)

  const items = (data ?? []) as Reservation[]
  return {
    reservations: items.slice(0, 50),
    hasMore: items.length > 50,
  }
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

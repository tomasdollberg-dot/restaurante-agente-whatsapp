import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { processMessage } from '@/lib/agent'
import { sendWhatsAppMessage } from '@/lib/twilio'
import type { Restaurant, MenuItem, RestaurantHours, Conversation, ConversationMessage } from '@/lib/supabase/types'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  try {
    // Twilio envía application/x-www-form-urlencoded — parsear con URLSearchParams
    const rawBody = await request.text()
    const params = new URLSearchParams(rawBody)
    const from = params.get('From')
    const to = params.get('To')
    const body = params.get('Body')

    console.log('[WEBHOOK] Mensaje recibido:', { from, to, body })

    if (!from || !to || !body) {
      console.log('[WEBHOOK] Ignorado: falta from, to o body')
      return new NextResponse('', { status: 200 })
    }

    const customerPhone = from.replace('whatsapp:', '')
    const twilioNumber = to
    const twilioNumberClean = to.replace('whatsapp:', '')

    console.log('[WEBHOOK] ANTHROPIC_API_KEY presente:', !!process.env.ANTHROPIC_API_KEY)

    const supabase = getServiceClient()

    // 1. Buscar el restaurante por número de WhatsApp (con y sin prefijo whatsapp:)
    const { data: restaurantData } = await supabase
      .from('restaurants')
      .select('*')
      .or(`whatsapp_number.eq.${twilioNumber},whatsapp_number.eq.${twilioNumberClean}`)
      .limit(1)
      .maybeSingle()

    console.log('[WEBHOOK] Búsqueda restaurante:', {
      twilioNumber,
      twilioNumberClean,
      encontrado: !!restaurantData,
    })

    const restaurant = restaurantData as Restaurant | null
    if (!restaurant) {
      console.error('[WEBHOOK] Restaurante no encontrado para:', twilioNumber)
      return new NextResponse('', { status: 200 })
    }

    // 2. Obtener menú y horarios del restaurante
    const [{ data: menuData }, { data: hoursData }] = await Promise.all([
      supabase.from('menu_items').select('*').eq('restaurant_id', restaurant.id).eq('is_available', true),
      supabase.from('restaurant_hours').select('*').eq('restaurant_id', restaurant.id),
    ])

    const menu = (menuData ?? []) as MenuItem[]
    const hours = (hoursData ?? []) as RestaurantHours[]
    console.log('[WEBHOOK] Contexto cargado:', { menuItems: menu.length, horarios: hours.length })

    // 3. Obtener historial de conversación
    const { data: conversationData } = await supabase
      .from('conversations')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .eq('customer_phone', customerPhone)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const conversation = conversationData as Conversation | null
    const history: ConversationMessage[] = conversation?.messages ?? []
    console.log('[WEBHOOK] Historial:', history.length, 'mensajes previos')

    // 4. Procesar el mensaje con el agente IA
    console.log('[WEBHOOK] Llamando al agente Claude...')
    let result
    try {
      result = await processMessage(body, customerPhone, restaurant, menu, hours, history)
      console.log('[WEBHOOK] Respuesta del agente:', {
        message: result.message?.slice(0, 100),
        shouldCreateReservation: !!result.shouldCreateReservation,
        shouldNotifyOwner: !!result.shouldNotifyOwner,
      })
    } catch (agentError) {
      console.error('[WEBHOOK] Error en el agente Claude:', agentError)
      await sendWhatsAppMessage(
        customerPhone,
        'Lo siento, ha ocurrido un error temporal. Por favor inténtalo de nuevo en unos minutos.',
        twilioNumber
      )
      // Guardar el mensaje del usuario en el historial aunque el agente falle
      await supabase.from('conversations').upsert({
        restaurant_id: restaurant.id,
        customer_phone: customerPhone,
        messages: [...history, { role: 'user' as const, content: body, timestamp: new Date().toISOString() }].slice(-20),
      }, { onConflict: 'restaurant_id,customer_phone' })
      return new NextResponse('', { status: 200 })
    }

    // 5. Actualizar historial con upsert para evitar race conditions
    const trimmedHistory: ConversationMessage[] = [
      ...history,
      { role: 'user' as const, content: body, timestamp: new Date().toISOString() },
      { role: 'assistant' as const, content: result.message, timestamp: new Date().toISOString() },
    ].slice(-20)

    await supabase.from('conversations').upsert({
      restaurant_id: restaurant.id,
      customer_phone: customerPhone,
      messages: trimmedHistory,
    }, { onConflict: 'restaurant_id,customer_phone' })

    // 6. Crear reserva si el agente lo indica
    console.log('[WEBHOOK] shouldCreateReservation:', JSON.stringify(result.shouldCreateReservation ?? null))
    if (result.shouldCreateReservation) {
      const r = result.shouldCreateReservation

      // Validar que la fecha no sea en el pasado
      const todayISO = new Date().toISOString().split('T')[0]
      if (r.date < todayISO) {
        console.log('[WEBHOOK] Fecha en el pasado, rechazando reserva:', r.date)
        await sendWhatsAppMessage(
          customerPhone,
          'La fecha indicada ya ha pasado. ¿Para qué fecha quieres la reserva?',
          twilioNumber
        )
        return new NextResponse('', { status: 200 })
      }

      const { error: reservationError } = await supabase.from('reservations').insert({
        restaurant_id: restaurant.id,
        customer_name: r.name,
        customer_phone: customerPhone,
        reservation_date: r.date,
        reservation_time: r.time,
        party_size: r.partySize,
        notes: r.notes || null,
        status: 'pending',
      } as Record<string, unknown>)
      console.log('[WEBHOOK] Reserva creada:', reservationError ? 'ERROR: ' + reservationError.message : 'OK')

      if (!reservationError) {
        // Programar mensaje de agradecimiento basado en la hora de la reserva
        const reservationDateTime = new Date(`${r.date}T${r.time}`)
        const hoursToAdd = r.time < '17:00:00' ? 3 : 14
        const sendAt = new Date(reservationDateTime.getTime() + hoursToAdd * 60 * 60 * 1000)

        const mapsLine = restaurant.google_maps_url
          ? `\n\nSi quieres dejarnos una reseña o valoración, nos ayudaría muchísimo: ${restaurant.google_maps_url}`
          : ''

        await supabase.from('scheduled_messages').insert({
          restaurant_id: restaurant.id,
          customer_phone: customerPhone,
          message: `¡Nos encantó haberte visto, ${r.name}! Esperamos volver a recibirte pronto.${mapsLine}`,
          twilio_number: twilioNumber,
          send_at: sendAt.toISOString(),
        } as Record<string, unknown>)
        console.log('[WEBHOOK] Mensaje de agradecimiento programado para:', sendAt.toISOString())
      }
    }

    // 7. Notificar al dueño si el agente no sabe responder
    if (result.shouldNotifyOwner) {
      await sendWhatsAppMessage(
        restaurant.owner_phone,
        `*Solera* — Un cliente (${customerPhone}) preguntó algo que no supe responder:\n\n"${result.shouldNotifyOwner}"\n\nPuedes contactarle directamente.`,
        twilioNumber
      )
      console.log('[WEBHOOK] Dueño notificado en:', restaurant.owner_phone)
    }

    // 8. Responder al cliente
    if (result.message) {
      console.log('[WEBHOOK] Enviando respuesta al cliente...')
      await sendWhatsAppMessage(customerPhone, result.message, twilioNumber)
      console.log('[WEBHOOK] Respuesta enviada OK')
    }

    return new NextResponse('', { status: 200 })
  } catch (error) {
    console.error('[WEBHOOK] Error general:', error)
    return new NextResponse('', { status: 500 })
  }
}

export async function GET() {
  return new NextResponse('RestauranteBot Webhook OK', { status: 200 })
}

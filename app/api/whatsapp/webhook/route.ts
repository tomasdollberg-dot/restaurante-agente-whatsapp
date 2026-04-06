import { NextRequest, NextResponse } from 'next/server'
import { validateRequest } from 'twilio'
import { createClient } from '@supabase/supabase-js'
import { processMessage } from '@/lib/agent'
import { sendWhatsAppMessage } from '@/lib/twilio'
import type { Restaurant, MenuItem, RestaurantHours, Conversation, ConversationMessage } from '@/lib/supabase/types'

function isRestaurantOpen(hours: RestaurantHours[], date: string, time: string): boolean {
  // Use noon to avoid DST/timezone issues when getting day of week
  const dayOfWeek = new Date(`${date}T12:00:00`).getDay()
  const dayHours = hours.find((h) => h.day_of_week === dayOfWeek)
  if (!dayHours || dayHours.is_closed) return false
  const normalizeTime = (t: string) => t.length === 4 ? '0' + t : t
  const timeNorm = normalizeTime(time)
  const open = normalizeTime(dayHours.open_time?.slice(0, 5) ?? '')
  const close = dayHours.close_time?.slice(0, 5) === '00:00' ? '24:00' : normalizeTime(dayHours.close_time?.slice(0, 5) ?? '')
  if (!open || !close) return false
  const open2 = dayHours.open_time_2?.slice(0, 5)
  const close2Raw = dayHours.close_time_2?.slice(0, 5)
  const close2 = close2Raw === '00:00' ? '24:00' : (close2Raw ? normalizeTime(close2Raw) : undefined)
  return (timeNorm >= open && timeNorm <= close) ||
         (!!open2 && !!close2 && timeNorm >= normalizeTime(open2) && timeNorm <= close2)
}

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  try {
    // Validar firma Twilio antes de cualquier lógica
    const signature = request.headers.get('x-twilio-signature') ?? ''
    const rawBody = await request.text()
    const params = new URLSearchParams(rawBody)
    const paramsObj = Object.fromEntries(params)
    const isValid = validateRequest(
      process.env.TWILIO_AUTH_TOKEN!,
      signature,
      `${process.env.NEXT_PUBLIC_APP_URL}/api/whatsapp/webhook`,
      paramsObj
    )
    if (!isValid) return new NextResponse('Forbidden', { status: 403 })

    const from = params.get('From')
    const to = params.get('To')
    const body = (params.get('Body') ?? '').slice(0, 2000)

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

      // Validar que el restaurante esté abierto en ese horario
      if (!isRestaurantOpen(hours, r.date, r.time)) {
        console.log('[WEBHOOK] Restaurante cerrado en ese horario, rechazando reserva:', r.date, r.time)
        await sendWhatsAppMessage(
          customerPhone,
          'En ese horario no tenemos servicio. Puedes consultarnos los horarios disponibles.',
          twilioNumber
        )
        return new NextResponse('', { status: 200 })
      }

      // Validar número de personas
      if (!r.partySize || r.partySize < 1 || r.partySize > 50) {
        console.log('[WEBHOOK] party_size inválido, rechazando reserva:', r.partySize)
        await sendWhatsAppMessage(
          customerPhone,
          '¿Para cuántas personas sería la reserva?',
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
        if (restaurant.owner_phone) {
          await sendWhatsAppMessage(
            restaurant.owner_phone,
            `*Chispoa* — Nueva solicitud de reserva:\n\n👤 ${r.name}\n📅 ${r.date} a las ${r.time}\n👥 ${r.partySize} personas\n\nConfirma o cancela aquí:\nhttps://chispoa-ia.vercel.app/dashboard/reservations`,
            twilioNumber
          )
          console.log('[WEBHOOK] Dueño notificado de nueva reserva en:', restaurant.owner_phone)
        }

        // Programar mensaje de confirmación para extender ventana WhatsApp 24h
        let confirmSendAt: Date | null = null
        const reservationDtSpain = new Date(`${r.date}T${r.time}:00+02:00`)
        if (r.date === todayISO) {
          // Reserva hoy: enviar 1h antes de la hora de la reserva
          const candidate = new Date(reservationDtSpain.getTime() - 60 * 60 * 1000)
          const now = new Date()
          if (candidate.getTime() - now.getTime() >= 60 * 60 * 1000) {
            confirmSendAt = candidate
          }
          // Si ya pasó o falta menos de 1h → no crear el mensaje
        } else {
          // Reserva futura: 23h después de la hora de la reserva
          let candidate = new Date(reservationDtSpain.getTime() + 23 * 60 * 60 * 1000)
          // Evitar franja nocturna 21:00-09:00 hora española (UTC+2)
          const spainHour = (candidate.getUTCHours() + 2) % 24
          if (spainHour >= 21 || spainHour < 9) {
            // Mover al siguiente día a las 09:00 Spain = 07:00 UTC
            const adjusted = new Date(candidate)
            adjusted.setUTCHours(7, 0, 0, 0)
            if (adjusted <= candidate) adjusted.setUTCDate(adjusted.getUTCDate() + 1)
            candidate = adjusted
          }
          confirmSendAt = candidate
        }
        if (confirmSendAt) {
          const confirmMessage = `Hola ${r.name}, te recordamos tu reserva en ${restaurant.name} el ${r.date} a las ${r.time}. ¿Confirmas tu asistencia? Responde SI o NO.`
          const { error: confirmError } = await supabase.from('scheduled_messages').insert({
            restaurant_id: restaurant.id,
            customer_phone: customerPhone,
            message: confirmMessage,
            twilio_number: twilioNumber,
            send_at: confirmSendAt.toISOString(),
            sent: false,
            retry_count: 0,
            type: 'confirmation',
          } as Record<string, unknown>)
          console.log('[WEBHOOK] Mensaje de confirmación programado para:', confirmSendAt.toISOString(), confirmError ? 'ERROR: ' + confirmError.message : 'OK')
        } else {
          console.log('[WEBHOOK] Mensaje de confirmación omitido (reserva hoy, menos de 1h o ya pasó)')
        }
      }
    }

    // 7. Cancelar reserva si el agente lo indica
    if (result.shouldCancelReservation) {
      const c = result.shouldCancelReservation

      const { data: reservationToCancel } = await supabase
        .from('reservations')
        .select('id, reservation_date, reservation_time, customer_name')
        .eq('restaurant_id', restaurant.id)
        .eq('customer_phone', customerPhone)
        .ilike('customer_name', `%${c.name}%`)
        .in('status', ['pending', 'confirmed'])
        .order('reservation_date', { ascending: true })
        .order('reservation_time', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (reservationToCancel) {
        const cancelled = reservationToCancel as Record<string, unknown>
        await supabase
          .from('reservations')
          .update({ status: 'cancelled' })
          .eq('id', cancelled.id)

        // Eliminar mensajes programados pendientes para este cliente
        await supabase
          .from('scheduled_messages')
          .delete()
          .eq('customer_phone', customerPhone)
          .eq('sent', false)

        if (restaurant.owner_phone) {
          await sendWhatsAppMessage(
            restaurant.owner_phone,
            `*Chispoa* — ${cancelled.customer_name} ha cancelado su reserva del ${cancelled.reservation_date} a las ${cancelled.reservation_time}.`,
            twilioNumber
          )
          console.log('[WEBHOOK] Dueño notificado de cancelación de reserva')
        }
      } else {
        await sendWhatsAppMessage(
          customerPhone,
          `No encontré ninguna reserva a nombre de ${c.name}. ¿Puedes confirmar el nombre con el que hiciste la reserva?`,
          twilioNumber
        )
      }
      console.log('[WEBHOOK] Reserva cancelada:', reservationToCancel ? 'OK' : 'no encontrada')
    }

    // 9. Notificar al dueño si el agente no sabe responder
    if (result.shouldNotifyOwner) {
      await sendWhatsAppMessage(
        restaurant.owner_phone,
        `*Chispoa* — Un cliente (${customerPhone}) preguntó algo que no supe responder:\n\n"${result.shouldNotifyOwner}"\n\nPuedes contactarle directamente.`,
        twilioNumber
      )
      console.log('[WEBHOOK] Dueño notificado en:', restaurant.owner_phone)
    }

    // 10. Responder al cliente
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

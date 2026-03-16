import Anthropic from '@anthropic-ai/sdk'
import type { Restaurant, MenuItem, RestaurantHours, ConversationMessage } from './supabase/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const DAYS_ES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

function formatMenuForPrompt(items: MenuItem[]): string {
  if (!items.length) return 'El menú aún no está configurado.'

  const byCategory: Record<string, MenuItem[]> = {}
  for (const item of items) {
    if (!byCategory[item.category]) byCategory[item.category] = []
    byCategory[item.category].push(item)
  }

  return Object.entries(byCategory)
    .map(([cat, catItems]) => {
      const lines = catItems
        .filter((i) => i.is_available)
        .map((i) => {
          const allergens = i.allergens?.length ? ` ⚠️ Alérgenos: ${i.allergens.join(', ')}` : ''
          return `  - ${i.name}${i.description ? ` (${i.description})` : ''}: €${Number(i.price).toFixed(2)}${allergens}`
        })
        .join('\n')
      return `**${cat}**\n${lines || '  (Sin ítems disponibles)'}`
    })
    .join('\n\n')
}

function formatHoursForPrompt(hours: RestaurantHours[]): string {
  if (!hours.length) return 'Horarios no configurados.'
  return DAYS_ES.map((day, i) => {
    const label = day.charAt(0).toUpperCase() + day.slice(1)
    const h = hours.find((x) => x.day_of_week === i)
    if (!h || h.is_closed) return `  ${label}: Cerrado`
    return `  ${label}: ${h.open_time?.slice(0, 5)} - ${h.close_time?.slice(0, 5)}`
  }).join('\n')
}

function buildSystemPrompt(restaurant: Restaurant, menu: MenuItem[], hours: RestaurantHours[]): string {
  const today = new Date()
  const todayFormatted = today.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const todayISO = today.toISOString().split('T')[0]
  const menuText = formatMenuForPrompt(menu)
  const hoursText = formatHoursForPrompt(hours)

  return `Hoy es ${todayFormatted} (${todayISO}).

Eres el asistente de WhatsApp de ${restaurant.name}. Respondes en español, de forma breve y directa. Nunca expliques tu razonamiento interno.

## INFORMACIÓN DEL RESTAURANTE
${menuText}

## HORARIOS
${hoursText}

## REGLAS DE COMPORTAMIENTO

**Tono**: Profesional y cercano. Respuestas de máximo 2-3 líneas. Sin emojis decorativos (solo ⚠️ para alérgenos). Sin exclamaciones innecesarias.

**Proceso interno**: Cualquier verificación de horarios o datos la haces internamente y en silencio. NUNCA lo expliques al cliente.

**Reservas**: Cuando el cliente quiera reservar o pregunte disponibilidad, recoge los 4 datos en el mínimo de mensajes posible: nombre, fecha, hora y personas. Sin preguntar por notas especiales. Cuando tengas los 4 datos, confirma así:
"Tu solicitud de reserva para el [fecha] a las [hora] para [X] personas ha sido recibida. El restaurante te confirmará en breve."
Y emite el token: [CREAR_RESERVA: nombre="X" fecha="YYYY-MM-DD" hora="HH:MM" personas=N notas=""]

**Cuando no sabes algo**: Usa EXACTAMENTE esta frase, sin variaciones:
"No tengo esa información, pero alguien del restaurante te lo confirmará a la mayor brevedad posible."
Y emite el token: \`[NOTIFICAR_DUENO: <motivo breve>]\`

**Alérgenos**: Si el cliente pregunta por alérgenos de un plato, responde con la información del menú. Si no hay información, usa la frase de no saber.

**Fuera de horario**: Si el cliente pide reserva en horario en que el restaurante está cerrado, di: "En ese horario no tenemos disponibilidad. Abrimos [horarios relevantes]."

**Preguntas generales**: Responde solo con la información que tienes del restaurante. Si no tienes la información, usa la frase de no saber.`
}

interface AgentResponse {
  message: string
  shouldCreateReservation?: {
    name: string
    date: string
    time: string
    partySize: number
    notes: string
  }
  shouldNotifyOwner?: string
}

export async function processMessage(
  userMessage: string,
  customerPhone: string,
  restaurant: Restaurant,
  menu: MenuItem[],
  hours: RestaurantHours[],
  history: ConversationMessage[]
): Promise<AgentResponse> {
  const systemPrompt = buildSystemPrompt(restaurant, menu, hours)

  const messages: Anthropic.Messages.MessageParam[] = [
    ...history.slice(-10).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: userMessage },
  ]

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  })

  if (!response.content?.length) {
    return { message: 'Lo siento, no pude procesar tu mensaje. Inténtalo de nuevo.' }
  }
  const rawText = response.content[0].type === 'text' ? response.content[0].text : ''
  // Strip code fences in case Claude wraps tokens
  const text = rawText.replace(/```[a-z]*\n?/g, '').replace(/```/g, '')

  console.log('[AGENT] Respuesta cruda Claude:', rawText.slice(0, 500))
  console.log('[AGENT] Contiene CREAR_RESERVA:', rawText.includes('[CREAR_RESERVA'))

  // Detect new-format reservation token: [CREAR_RESERVA: nombre="X" fecha="..." hora="..." personas=N notas="..."]
  const reservationMatch = text.match(
    /\[CREAR_RESERVA:\s*nombre="([^"]+)"\s*fecha="(\d{4}-\d{2}-\d{2})"\s*hora="(\d{2}:\d{2})"\s*personas=(\d+)\s*notas="([^"]*)"\]/
  )

  if (reservationMatch) {
    const cleanMessage = text
      .replace(/\[CREAR_RESERVA:[\s\S]*?\]/, '')
      .trim()

    return {
      message: cleanMessage,
      shouldCreateReservation: {
        name: reservationMatch[1].trim(),
        date: reservationMatch[2].trim(),
        time: reservationMatch[3].trim(),
        partySize: parseInt(reservationMatch[4]),
        notes: reservationMatch[5].trim(),
      },
    }
  }

  // Fallback: support legacy block-style token in case model uses old format
  const legacyMatch = text.match(
    /\[CREAR_RESERVA\][\s\S]*?nombre:\s*(.+?)\s*personas:\s*(\d+)\s*fecha:\s*(\d{4}-\d{2}-\d{2})\s*hora:\s*(\d{2}:\d{2})\s*notas:\s*([\s\S]+?)\s*\[\/CREAR_RESERVA\]/
  )

  if (legacyMatch) {
    const cleanMessage = text
      .replace(/\[CREAR_RESERVA\][\s\S]*?\[\/CREAR_RESERVA\]/g, '')
      .trim()

    return {
      message: cleanMessage,
      shouldCreateReservation: {
        name: legacyMatch[1].trim(),
        partySize: parseInt(legacyMatch[2]),
        date: legacyMatch[3].trim(),
        time: legacyMatch[4].trim(),
        notes: legacyMatch[5].trim() === 'ninguna' ? '' : legacyMatch[5].trim(),
      },
    }
  }

  // Detect owner notification token
  const ownerNotifyMatch = text.match(/\[NOTIFICAR_DUENO:\s*(.+?)\]/)
  if (ownerNotifyMatch) {
    const cleanMessage = text.replace(/\[NOTIFICAR_DUENO:\s*.+?\]/g, '').trim()
    return {
      message: cleanMessage,
      shouldNotifyOwner: ownerNotifyMatch[1].trim(),
    }
  }

  return { message: text }
}

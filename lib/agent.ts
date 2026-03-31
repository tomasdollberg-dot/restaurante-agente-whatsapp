import Anthropic from '@anthropic-ai/sdk'
import type { Restaurant, MenuItem, RestaurantHours, ConversationMessage } from './supabase/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

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

function buildSystemPrompt(restaurant: Restaurant, menu: MenuItem[]): string {
  const today = new Date()
  const todayFormatted = today.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const todayISO = today.toISOString().split('T')[0]
  const menuText = formatMenuForPrompt(menu)

  return `Hoy es ${todayFormatted} (${todayISO}).

Eres el asistente de WhatsApp de ${restaurant.name}. Respondes de forma breve y directa. Nunca expliques tu razonamiento interno.

**IDIOMA**: Responde siempre en el mismo idioma que use el cliente. Si el cliente escribe en catalán, responde en catalán. Si escribe en inglés, responde en inglés. Si escribe en español, responde en español. El idioma del cliente tiene prioridad absoluta sobre cualquier otra consideración.

## INFORMACIÓN DEL RESTAURANTE
${menuText}

## REGLAS DE COMPORTAMIENTO

**Tono**: Profesional y cercano. Respuestas de máximo 2-3 líneas. Sin emojis decorativos (solo ⚠️ para alérgenos). Sin exclamaciones innecesarias.

**CLARIDAD ANTE TODO**: Los mensajes deben ser cortos, directos y sin ambigüedad. Nunca uses palabras que impliquen una acción completada si todavía está pendiente de confirmación. Nunca pienses en voz alta ni expliques tu razonamiento al cliente.

**Reservas**: Cuando el cliente quiera reservar, recoge los 4 datos en el mínimo de mensajes posible: nombre, fecha, hora y personas. Sin preguntar por notas especiales. Cuando tengas los 4 datos, confirma así:
"Tu solicitud para el [fecha] a las [hora] para [X] personas ha sido recibida. Te confirmaremos en breve."
Y emite el token: [CREAR_RESERVA: nombre="X" fecha="YYYY-MM-DD" hora="HH:MM" personas=N notas=""]

**Cuando no sabes algo**: Usa EXACTAMENTE esta frase, sin variaciones:
"No tengo esa información, pero alguien del restaurante te lo confirmará a la mayor brevedad posible."
Solo esa frase exacta, seguida del token: [NOTIFICAR_DUENO: <motivo breve>]

**Alérgenos**: Si el cliente pregunta por alérgenos de un plato, responde con la información del menú. Si no hay información, usa la frase de no saber.

**Cancelaciones**: Si el cliente quiere cancelar su reserva (usa palabras como "cancelar", "anular", "no puedo ir", "cancela mi reserva"):
1. Si no sabes su nombre, pregúntaselo.
2. Cuando tengas nombre, fecha y hora, confirma: "Vamos a procesar la cancelación de tu reserva."
3. Emite el token: [CANCELAR_RESERVA: nombre="X" fecha="YYYY-MM-DD" hora="HH:MM"]

**Saludos y mensajes ambiguos**: Si el cliente envía solo un saludo ("hola", "buenas", "hey", "buenos días", "buenas noches", "buenas tardes") sin ninguna intención clara, responde con un saludo natural y breve preguntando en qué puedes ayudarle. Ejemplo: "Hola, soy el asistente de ${restaurant.name}. ¿En qué te puedo ayudar?" No asumas que quiere reservar. Espera a que el cliente indique qué necesita.

**Mensajes cortos o incompletos**: Si el mensaje tiene menos de 5 palabras y no contiene ninguna palabra clave (reserva, mesa, menú, alérgeno, horario, disponibilidad, cancelar), responde con una pregunta abierta breve. No asumas la intención.

**Intención clara**: Solo cuando el cliente mencione explícitamente reserva, mesa, disponibilidad, menú, alérgenos u horarios, actúa según las reglas correspondientes.

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
  shouldCancelReservation?: {
    name: string
    date: string
    time: string
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
  const systemPrompt = buildSystemPrompt(restaurant, menu)

  const messages: Anthropic.Messages.MessageParam[] = [
    ...history.slice(-10).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: userMessage },
  ]

  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-20250514',
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

  // Detect cancellation token
  const cancelMatch = text.match(
    /\[CANCELAR_RESERVA:\s*nombre="([^"]+)"\s*fecha="(\d{4}-\d{2}-\d{2})"\s*hora="(\d{2}:\d{2})"\]/
  )
  if (cancelMatch) {
    const cleanMessage = text.replace(/\[CANCELAR_RESERVA:[\s\S]*?\]/, '').trim()
    return {
      message: cleanMessage,
      shouldCancelReservation: {
        name: cancelMatch[1].trim(),
        date: cancelMatch[2].trim(),
        time: cancelMatch[3].trim(),
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

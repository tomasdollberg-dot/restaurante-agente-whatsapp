import Anthropic from '@anthropic-ai/sdk'
import type { Restaurant, MenuItem, RestaurantHours, ConversationMessage } from './supabase/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const DAYS_ES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const DAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

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
          const allergens = i.allergens?.length ? ` [Alérgenos: ${i.allergens.join(', ')}]` : ''
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
    const h = hours.find((x) => x.day_of_week === i)
    if (!h || h.is_closed) return `  ${day}: Cerrado / Closed`
    return `  ${day} / ${DAYS_EN[i]}: ${h.open_time?.slice(0, 5)} - ${h.close_time?.slice(0, 5)}`
  }).join('\n')
}

function buildSystemPrompt(restaurant: Restaurant, menu: MenuItem[], hours: RestaurantHours[]): string {
  const today = new Date()
  const todayFormatted = today.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const todayISO = today.toISOString().split('T')[0]

  return `Hoy es ${todayFormatted} (${todayISO}).

Eres el asistente virtual de WhatsApp del restaurante "${restaurant.name}".
Respondes en el idioma que usa el cliente (español o inglés).
Eres amable, profesional y conciso.

## Información del restaurante
- Nombre: ${restaurant.name}
- Descripción: ${restaurant.description ?? 'Restaurante'}
- Dirección: ${restaurant.address ?? 'Consultar con el restaurante'}

## Menú
${formatMenuForPrompt(menu)}

## Horarios de apertura
${formatHoursForPrompt(hours)}

## Tus funciones
1. **Responder preguntas** sobre el menú, horarios, dirección y reservas.
2. **Gestionar reservas**: Cuando un cliente quiera hacer una reserva, recoge esta información paso a paso:
   - Nombre (solo el nombre, no hace falta apellido)
   - Número de personas
   - Fecha deseada (formato DD/MM/YYYY)
   - Hora deseada
   - Notas especiales (alergias, ocasión especial, etc.) — opcional

   Una vez que tengas TODOS los datos obligatorios, responde con:
   1. Un mensaje de confirmación visible para el cliente, por ejemplo: "¡Reserva confirmada! ✅ Te esperamos el [fecha en formato legible] a las [hora]. ¡Hasta pronto!"
   2. Inmediatamente después, en la misma respuesta, el token en texto plano (sin bloques de código, sin backticks):

   [CREAR_RESERVA]
   nombre: <nombre>
   personas: <número>
   fecha: <YYYY-MM-DD>
   hora: <HH:MM>
   notas: <notas o "ninguna">
   [/CREAR_RESERVA]

3. **Notificar al dueño**: Si no puedes responder una pregunta, usa:
   \`[NOTIFICAR_DUENO: <mensaje breve del cliente]\`

## Reglas importantes
- NO inventes precios o platos que no están en el menú.
- Si el cliente pregunta algo fuera de tu conocimiento, usa [NOTIFICAR_DUENO].
- Para reservas, verifica que la fecha no sea en el pasado.
- El teléfono del cliente ya lo tienes porque te escribió por WhatsApp.
- Sé tolerante con faltas de ortografía y variaciones de escritura. Trata como equivalentes: "celiaco"/"celíaco"/"celiacs"/"sin gluten"/"gluten free"/"gluten-free"; nombres de platos con o sin tildes; mayúsculas/minúsculas. Interpreta siempre la intención del cliente aunque escriba con errores.`
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

  const rawText = response.content[0].type === 'text' ? response.content[0].text : ''
  // Eliminar bloques de código por si Claude envuelve el token en backticks
  const text = rawText.replace(/```[a-z]*\n?/g, '').replace(/```/g, '')

  console.log('[AGENT] Respuesta cruda Claude:', rawText.slice(0, 500))
  console.log('[AGENT] Contiene CREAR_RESERVA:', rawText.includes('[CREAR_RESERVA]'))

  // Detectar si el agente quiere crear una reserva
  const reservationMatch = text.match(
    /\[CREAR_RESERVA\][\s\S]*?nombre:\s*(.+?)\s*personas:\s*(\d+)\s*fecha:\s*(\d{4}-\d{2}-\d{2})\s*hora:\s*(\d{2}:\d{2})\s*notas:\s*([\s\S]+?)\s*\[\/CREAR_RESERVA\]/
  )

  if (reservationMatch) {
    const cleanMessage = text
      .replace(/\[CREAR_RESERVA\][\s\S]*?\[\/CREAR_RESERVA\]/g, '')
      .trim()

    return {
      message: cleanMessage,
      shouldCreateReservation: {
        name: reservationMatch[1].trim(),
        partySize: parseInt(reservationMatch[2]),
        date: reservationMatch[3].trim(),
        time: reservationMatch[4].trim(),
        notes: reservationMatch[5].trim() === 'ninguna' ? '' : reservationMatch[5].trim(),
      },
    }
  }

  // Detectar si el agente quiere notificar al dueño
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

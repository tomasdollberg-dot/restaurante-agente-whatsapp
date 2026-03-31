import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendWhatsAppMessage } from '@/lib/twilio'
import type { ScheduledMessage } from '@/lib/supabase/types'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: NextRequest) {
  // Verificar Authorization header en producción (Vercel Cron)
  const authHeader = request.headers.get('authorization')
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const supabase = getServiceClient()

  const { data, error } = await supabase
    .from('scheduled_messages')
    .select('*')
    .eq('sent', false)
    .lte('send_at', new Date().toISOString())

  if (error) {
    console.error('[CRON] Error consultando mensajes:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const messages = (data ?? []) as ScheduledMessage[]
  console.log(`[CRON] Mensajes pendientes: ${messages.length}`)

  let sent = 0
  let failed = 0

  for (const msg of messages) {
    if (msg.retry_count >= 3) {
      console.error(`[CRON] Máximo de reintentos alcanzado para ${msg.customer_phone}, descartando mensaje ${msg.id}`)
      await supabase.from('scheduled_messages').update({ sent: true } as Record<string, unknown>).eq('id', msg.id)
      failed++
      continue
    }

    try {
      await sendWhatsAppMessage(msg.customer_phone, msg.message, msg.twilio_number)
      await supabase.from('scheduled_messages').update({ sent: true, sent_at: new Date().toISOString() } as Record<string, unknown>).eq('id', msg.id)
      sent++
      console.log(`[CRON] Enviado a ${msg.customer_phone}`)
    } catch (err) {
      failed++
      console.error(`[CRON] Error enviando a ${msg.customer_phone} (intento ${msg.retry_count + 1}):`, err)
      await supabase.from('scheduled_messages').update({ retry_count: msg.retry_count + 1 } as Record<string, unknown>).eq('id', msg.id)
    }
  }

  return NextResponse.json({ sent, failed })
}

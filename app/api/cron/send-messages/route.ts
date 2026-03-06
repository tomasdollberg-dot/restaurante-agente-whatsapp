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
    try {
      await sendWhatsAppMessage(msg.customer_phone, msg.message, msg.twilio_number)
      await supabase.from('scheduled_messages').update({ sent: true } as never).eq('id', msg.id)
      sent++
      console.log(`[CRON] Enviado a ${msg.customer_phone}`)
    } catch (err) {
      failed++
      console.error(`[CRON] Error enviando a ${msg.customer_phone}:`, err)
    }
  }

  return NextResponse.json({ sent, failed })
}

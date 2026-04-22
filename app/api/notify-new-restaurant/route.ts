import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { restaurantName, ownerEmail } = await request.json()
    console.log('[NOTIFY] Enviando notificación para:', restaurantName, ownerEmail)

    const result = await resend.emails.send({
      from: 'Chispoa <onboarding@resend.dev>',
      to: 'tomas.dollberg@gmail.com',
      subject: `🎉 Nuevo registro — ${restaurantName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #FF5C1A;">Nuevo restaurante registrado en Chispoa</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px; font-weight: bold;">Restaurante:</td><td style="padding: 8px;">${restaurantName}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Email:</td><td style="padding: 8px;">${ownerEmail}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Hora:</td><td style="padding: 8px;">${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}</td></tr>
          </table>
          <br>
          <p style="color: #FF5C1A; font-weight: bold;">⏰ Tienes 72h para configurar el número de WhatsApp.</p>
          <a href="https://chispoa-ia.vercel.app/dashboard" style="background: #FF5C1A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin-top: 16px;">Ir al panel →</a>
        </div>
      `
    })
    console.log('[NOTIFY] Resultado Resend:', JSON.stringify(result))

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[NOTIFY] Error completo:', err)
    return NextResponse.json({ ok: false, error: String(err) })
  }
}

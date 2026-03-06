import twilio from 'twilio'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

export async function sendWhatsAppMessage(to: string, body: string, from?: string) {
  const fromNumber = from ?? process.env.TWILIO_WHATSAPP_NUMBER!

  return client.messages.create({
    from: fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`,
    to: to.startsWith('whatsapp:') ? to : `whatsapp:${to}`,
    body,
  })
}

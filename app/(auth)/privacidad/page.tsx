import Link from 'next/link'

export default function PrivacidadPage() {
  return (
    <div
      className="min-h-screen px-6 py-12"
      style={{ background: 'linear-gradient(160deg, #0f0c08 0%, #1e1508 60%, #0f0c08 100%)', color: '#f5f0e8' }}
    >
      <div className="mx-auto max-w-2xl">
        <Link
          href="/register"
          className="inline-flex items-center gap-2 text-sm font-medium mb-10 transition-opacity hover:opacity-70"
          style={{ color: '#b8922a' }}
        >
          ← Volver
        </Link>

        <p className="text-xs font-bold tracking-[0.35em] uppercase mb-3" style={{ color: '#b8922a' }}>
          SOLERA
        </p>
        <h1 className="text-3xl font-extrabold mb-2" style={{ letterSpacing: '-0.02em' }}>
          Política de Privacidad
        </h1>
        <p className="text-sm mb-10" style={{ color: 'rgba(245,240,232,0.4)' }}>
          Última actualización: marzo de 2026
        </p>

        <div className="space-y-8" style={{ color: 'rgba(245,240,232,0.75)', lineHeight: '1.75' }}>
          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: '#f5f0e8' }}>1. Responsable del tratamiento</h2>
            <p className="text-sm">
              Tomás Francisco Dollberg · NIF Y6043900C · tomas.dollberg@gmail.com
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: '#f5f0e8' }}>2. Datos que recogemos</h2>
            <p className="text-sm">
              Recogemos únicamente los datos necesarios para prestar el servicio: el email y el teléfono WhatsApp del titular del establecimiento, el nombre del restaurante y la información que el propio cliente introduce en el panel (menú, horarios, descripción). No recogemos datos de los comensales más allá de su número de teléfono y los mensajes necesarios para gestionar la reserva.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: '#f5f0e8' }}>3. Finalidad y base legal</h2>
            <p className="text-sm">
              Los datos se tratan exclusivamente para la prestación del servicio contratado. La base legal del tratamiento es la ejecución del contrato entre las partes, de conformidad con el art. 6.1.b del Reglamento General de Protección de Datos (RGPD).
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: '#f5f0e8' }}>4. Destinatarios</h2>
            <p className="text-sm">
              Para prestar el servicio, los datos se comparten con los siguientes subencargados del tratamiento, todos con garantías adecuadas conforme al RGPD: Supabase (base de datos e infraestructura), Twilio (envío de mensajes WhatsApp), Anthropic (procesamiento de lenguaje natural) y Vercel (alojamiento de la aplicación).
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: '#f5f0e8' }}>5. Conservación</h2>
            <p className="text-sm">
              Los datos se conservan durante la vigencia del contrato y, una vez resuelto, durante los plazos establecidos por las obligaciones legales aplicables (fiscales, mercantiles). Transcurridos dichos plazos, los datos serán eliminados de forma segura.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: '#f5f0e8' }}>6. Derechos</h2>
            <p className="text-sm">
              El cliente puede ejercer en cualquier momento sus derechos de acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad de los datos escribiendo a tomas.dollberg@gmail.com. Si considera que el tratamiento no es conforme al RGPD, tiene derecho a presentar una reclamación ante la Agencia Española de Protección de Datos (aepd.es).
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: '#f5f0e8' }}>7. Modificaciones</h2>
            <p className="text-sm">
              Solera se reserva el derecho a actualizar esta política para adaptarla a cambios normativos o del servicio. Cualquier modificación relevante se comunicará al cliente con antelación suficiente.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

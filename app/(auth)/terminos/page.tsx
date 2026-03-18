import Link from 'next/link'

export default function TerminosPage() {
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
          Términos de Servicio
        </h1>
        <p className="text-sm mb-10" style={{ color: 'rgba(245,240,232,0.4)' }}>
          Última actualización: marzo de 2026
        </p>

        <div className="space-y-8" style={{ color: 'rgba(245,240,232,0.75)', lineHeight: '1.75' }}>
          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: '#f5f0e8' }}>1. Objeto</h2>
            <p className="text-sm">
              El presente contrato regula la prestación del servicio Solera, un agente de inteligencia artificial para la gestión de reservas y atención al cliente vía WhatsApp, dirigido a establecimientos de restauración.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: '#f5f0e8' }}>2. Acceso al servicio</h2>
            <p className="text-sm">
              Tras la contratación y el pago de la primera mensualidad, el acceso al servicio se activa en un plazo máximo de 48 horas hábiles. El cliente recibirá las credenciales de acceso al panel de control por email.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: '#f5f0e8' }}>3. Precio</h2>
            <p className="text-sm">
              El precio del servicio es de 150 € + IVA al mes. El pago se realiza mediante transferencia bancaria y debe abonarse por adelantado al inicio de cada período mensual. El impago faculta al prestador a suspender el acceso al servicio.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: '#f5f0e8' }}>4. Duración y resolución</h2>
            <p className="text-sm">
              El contrato se renueva automáticamente cada mes. El cliente puede darse de baja en cualquier momento con un preaviso mínimo de 30 días naturales, comunicado por escrito a tomas.dollberg@gmail.com. No se realizarán devoluciones por el período ya facturado.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: '#f5f0e8' }}>5. Naturaleza del servicio</h2>
            <p className="text-sm">
              El servicio se presta "tal cual" (as-is). Solera no garantiza resultados concretos en términos de reservas, satisfacción del cliente o ingresos del establecimiento. El funcionamiento del agente depende de terceros (Twilio, Anthropic, Supabase, Vercel) cuyas incidencias quedan fuera del control de Solera.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: '#f5f0e8' }}>6. Limitación de responsabilidad</h2>
            <p className="text-sm">
              En ningún caso la responsabilidad total de Solera frente al cliente podrá exceder el importe de una mensualidad abonada. Solera no será responsable de daños indirectos, pérdida de datos, lucro cesante ni daños derivados del uso o la imposibilidad de uso del servicio.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: '#f5f0e8' }}>7. Obligaciones del cliente</h2>
            <p className="text-sm">
              El cliente se compromete a: (i) proporcionar información veraz sobre su establecimiento; (ii) usar el servicio conforme a la legalidad vigente; (iii) no ceder el acceso a terceros; (iv) mantener actualizado el número de WhatsApp asociado y el menú introducido en el sistema.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: '#f5f0e8' }}>8. Propiedad intelectual</h2>
            <p className="text-sm">
              Todo el software, diseño, marca y contenidos de Solera son propiedad exclusiva de Tomás Francisco Dollberg. El cliente recibe una licencia de uso no exclusiva e intransferible mientras el contrato esté vigente.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: '#f5f0e8' }}>9. Modificaciones</h2>
            <p className="text-sm">
              Solera se reserva el derecho a modificar estos términos con un preaviso de 15 días. Si el cliente no acepta los nuevos términos, podrá resolver el contrato sin penalización dentro de ese plazo.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: '#f5f0e8' }}>10. Ley aplicable</h2>
            <p className="text-sm">
              El presente contrato se rige por la ley española. Para cualquier controversia, las partes se someten a los juzgados y tribunales de Barcelona, con renuncia expresa a cualquier otro fuero.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

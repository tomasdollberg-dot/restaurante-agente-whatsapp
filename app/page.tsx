'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function LandingPage() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('on')
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.06 }
    )
    document.querySelectorAll('.rev').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <div className="landing-root">
      {/* NAV */}
      <nav className="landing-nav">
        <div className="nav-inner">
          <div className="nav-logo">
            <div className="nav-spark">
              <svg viewBox="0 0 16 16" fill="none">
                <path d="M9 2L4 9H8L6 14L13 7H9L9 2z" fill="white" stroke="white" strokeWidth="0.5" strokeLinejoin="round" />
              </svg>
            </div>
            Chispoa
          </div>
          <div className="nav-links">
            <a href="#como-funciona" className="nav-link">Cómo funciona</a>
            <a href="#funcionalidades" className="nav-link">Funcionalidades</a>
            <a href="#precio" className="nav-link">Precio</a>
          </div>
          <Link href="/register" className="nav-cta">Prueba gratis 14 días →</Link>
        </div>
      </nav>

      <div className="wrap">
        {/* HERO */}
        <div className="hero rev">
          <div>
            <div className="hero-kicker"><span className="kicker-dot"></span>Agente WhatsApp para restaurantes</div>
            <div className="hero-title">
              NINGUNA<br />RESERVA<br /><span className="hi">SE PIERDE.</span>
            </div>
            <div className="hero-sub">
              Chispoa atiende el WhatsApp de tu restaurante mientras tú sirves en mesa. Reservas, alérgenos, horarios — gestionados al instante, las 24 horas del día.
            </div>
            <div className="hero-btns">
              <Link href="/register" className="btn-main">Prueba gratis 14 días →</Link>
              <a href="#como-funciona" className="btn-sec">Ver cómo funciona</a>
            </div>
            <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--naranja)', marginBottom: '32px' }}>
              Sin tarjeta de crédito · Sin permanencia · Cancela cuando quieras
            </div>
            <div className="hero-stats">
              <div>
                <div className="stat-n"><span>&lt;2</span>s</div>
                <div className="stat-l">tiempo de<br />respuesta</div>
              </div>
              <div>
                <div className="stat-n"><span>24/7</span></div>
                <div className="stat-l">siempre<br />disponible</div>
              </div>
              <div>
                <div className="stat-n"><span>48</span>h</div>
                <div className="stat-l">activación con<br />aprobación incluida</div>
              </div>
            </div>
          </div>

          <div className="chat-widget">
            <div className="chat-header">
              <div className="chat-ava">
                <svg viewBox="0 0 18 18" fill="none"><path d="M10 2L4 10h5.5L8 16 15 8h-5.5L10 2z" fill="white" /></svg>
              </div>
              <div>
                <div className="chat-name">Chispoa · La Tasquería</div>
                <div className="chat-status">respondiendo ahora</div>
              </div>
            </div>
            <div className="chat-msgs">
              <div className="chat-ts">Hoy · 21:34</div>
              <div className="msg msg-in">
                <div className="msg-sender">Cliente</div>
                Buenas, ¿tenéis mesa para 3 el viernes por la noche?
              </div>
              <div className="msg msg-out">
                <div className="msg-sender">Chispoa</div>
                Claro. ¿A qué hora os viene mejor?
              </div>
              <div className="msg msg-in">
                <div className="msg-sender">Cliente</div>
                A las 21h
              </div>
              <div className="msg msg-out">
                <div className="msg-sender">Chispoa</div>
                Tu solicitud para el viernes a las 21h, 3 personas, ha sido recibida. El restaurante te confirmará en breve.
              </div>
              <div className="chat-ts">Solicitud enviada · sin intervención humana</div>
            </div>
            <div className="chat-notification">
              🔔 Nueva reserva de María — viernes 21h · 3 personas
            </div>
          </div>
        </div>

        {/* CÓMO FUNCIONA */}
        <section id="como-funciona" className="rev">
          <div className="sec-tag"><span className="n">01</span> Cómo funciona</div>
          <div className="steps">
            <div className="step">
              <div className="step-n">PASO 01</div>
              <span className="step-icon">🍽️</span>
              <div className="step-title">Te registras y configuras</div>
              <div className="step-body">Introduces tu menú, horarios y el enlace de Google Maps. En menos de 10 minutos tienes todo listo. Lo hacemos contigo si hace falta.</div>
            </div>
            <div className="step">
              <div className="step-n">PASO 02</div>
              <span className="step-icon">⚡</span>
              <div className="step-title">Activamos tu número en 48h</div>
              <div className="step-body">Configuramos tu número de WhatsApp Business. Sin que toques nada técnico. En dos días tu restaurante ya tiene un agente que responde.</div>
            </div>
            <div className="step">
              <div className="step-n">PASO 03</div>
              <span className="step-icon">💬</span>
              <div className="step-title">Chispoa atiende, tú confirmas</div>
              <div className="step-body">El agente recoge las reservas. Tú las confirmas o cancelas en segundos, directamente desde el móvil. El cliente recibe la respuesta automáticamente.</div>
            </div>
            <div className="step">
              <div className="step-n">PASO 04</div>
              <span className="step-icon">⭐</span>
              <div className="step-title">Reseñas automáticas post-visita</div>
              <div className="step-body">Horas después de cada visita, Chispoa le manda un mensaje al cliente pidiéndole una reseña o valoración en Google Maps. Sin que hagas nada.</div>
            </div>
          </div>
        </section>

        {/* FUNCIONALIDADES */}
        <section id="funcionalidades" className="rev">
          <div className="sec-tag"><span className="n">02</span> Qué hace Chispoa</div>
          <div className="features-grid">
            <div className="feat">
              <span className="feat-icon">📋</span>
              <div className="feat-title">Gestiona reservas</div>
              <div className="feat-body">Recoge el nombre, fecha, hora y número de personas. La solicitud llega a tu panel. Tú confirmas o cancelas — el cliente lo sabe al instante.</div>
              <span className="feat-tag">Reservas · Confirmaciones · Cancelaciones</span>
            </div>
            <div className="feat">
              <span className="feat-icon">🥗</span>
              <div className="feat-title">Informa del menú y alérgenos</div>
              <div className="feat-body">Responde preguntas sobre platos, precios y alérgenos con la información que tú has introducido. Sin errores, sin esperas.</div>
              <span className="feat-tag">Menú · Precios · Alérgenos · Horarios</span>
            </div>
            <div className="feat">
              <span className="feat-icon">🔔</span>
              <div className="feat-title">Te avisa cuando es necesario</div>
              <div className="feat-body">Si alguien pregunta algo que Chispoa no sabe responder, te manda un WhatsApp directamente. Tú decides cuándo intervenir.</div>
              <span className="feat-tag">Notificaciones · Solo lo importante</span>
            </div>
            <div className="feat">
              <span className="feat-icon">📱</span>
              <div className="feat-title">Panel desde el móvil</div>
              <div className="feat-body">Ve tus reservas del día, confirma o cancela, actualiza el menú — todo desde el móvil. Diseñado para usarse entre servicio y servicio.</div>
              <span className="feat-tag">iOS · Android · Sin app que instalar</span>
            </div>
            <div className="feat">
              <span className="feat-icon">🕐</span>
              <div className="feat-title">Respeta tus horarios</div>
              <div className="feat-body">Si alguien pide mesa fuera de tu horario, Chispoa le informa amablemente. Sin falsas esperanzas, sin reservas imposibles.</div>
              <span className="feat-tag">Horarios por turno · Días cerrados</span>
            </div>
            <div className="feat" style={{ background: 'var(--tinta)' }}>
              <span className="feat-icon">🔒</span>
              <div className="feat-title" style={{ color: 'var(--crema)' }}>Tus datos, seguros</div>
              <div className="feat-body" style={{ color: 'var(--niebla)' }}>Base de datos en Europa. Cumplimiento RGPD. El restaurante controla sus datos en todo momento.</div>
              <span className="feat-tag" style={{ color: 'var(--humo)' }}>RGPD · Europa · Seguro</span>
            </div>
          </div>

          {/* RESEÑAS DESTACADAS */}
          <div className="reviews-block">
            <div>
              <div className="rb-label">⭐ Diferencial exclusivo</div>
              <div className="rb-title">Más reseñas en Google.<br /><span>Sin tener que pedirlas.</span></div>
              <div className="rb-body">
                Horas después de cada visita, Chispoa manda un mensaje al cliente pidiéndole una reseña o valoración en Google Maps. En el momento exacto en que todavía recuerda la experiencia. Sin que tú hagas nada. Sin que se te olvide.
                <br /><br />
                Más reseñas = más visibilidad = más clientes. El ciclo que todos quieren y nadie tiene tiempo de mantener.
              </div>
            </div>
            <div className="rb-chat">
              <div className="rb-chat-header">Chispoa · La Tasquería</div>
              <div className="rb-msgs">
                <div className="chat-ts" style={{ color: '#525250', fontSize: '9px', textAlign: 'center', padding: '4px 0' }}>Al día siguiente · 11:00h</div>
                <div className="rb-msg rb-out">
                  Hola María, nos encantó haberte visto anoche. Esperamos volver a recibirte pronto.
                </div>
                <div className="rb-msg rb-out" style={{ marginTop: '-4px' }}>
                  Si quieres dejarnos una reseña o valoración, nos ayudaría muchísimo: maps.app.goo.gl/ejemplo
                  <div className="rb-stars">★★★★★</div>
                </div>
                <div className="rb-msg rb-in" style={{ marginTop: '4px' }}>
                  ¡Qué bien! Todo estuvo genial, acabo de dejar la reseña 😊
                </div>
                <div className="rb-msg-system">
                  +1 reseña nueva en Google Maps
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PROPUESTA DE VALOR */}
        <section className="rev">
          <div className="sec-tag"><span className="n">03</span> El problema que resolvemos</div>
          <div className="valor-grid">
            <div className="val-card vc-1">
              <span className="val-icon">📵</span>
              <div className="val-headline">El WhatsApp espera. La reserva se pierde.</div>
              <div className="val-body">Estás sirviendo, tomando nota, atendiendo. El mensaje entra. Nadie lo ve. El cliente espera dos minutos y llama al restaurante de al lado.</div>
            </div>
            <div className="val-card vc-2">
              <span className="val-icon">⚡</span>
              <div className="val-headline">Chispoa lo coge por ti. En menos de 2 segundos.</div>
              <div className="val-body">Responde, recoge los datos de la reserva, informa del menú y los alérgenos. Exactamente como lo harías tú — pero sin que pares lo que estás haciendo.</div>
            </div>
            <div className="val-card vc-3">
              <span className="val-icon">✅</span>
              <div className="val-headline">Tú lo ves cuando puedes. Ya está hecho.</div>
              <div className="val-body">Te llega una notificación con el resumen. Confirmas en un tap. El cliente recibe la confirmación. Cero reservas perdidas. Cero clientes esperando.</div>
            </div>
          </div>
          <div className="frase-grande">
            <div className="fg-text">
              Que el teléfono suene<br />ya <span className="hi">no es tu problema.</span>
            </div>
            <div className="fg-badge">150€/mes<br />Sin permanencia<br />Activo en 48h</div>
          </div>
        </section>

        {/* TESTIMONIOS */}
        <section className="rev">
          <div className="sec-tag"><span className="n">04</span> Lo que dicen nuestros clientes</div>
          <div className="testimonials-grid">
            <div className="testi">
              <div className="testi-stars">★★★★★</div>
              <div className="testi-quote">"Antes perdía reservas cada fin de semana porque estaba en cocina. <strong>Desde que tengo Chispoa no he perdido ninguna.</strong> Y las reseñas de Google se han disparado."</div>
              <div className="testi-author">Carlos M.</div>
              <div className="testi-role">Bar de tapas · Madrid</div>
            </div>
            <div className="testi">
              <div className="testi-stars">★★★★★</div>
              <div className="testi-quote">"La configuración fue en 10 minutos. En 48 horas ya estaba funcionando. <strong>Mis clientes ni saben que es un agente</strong> — creen que soy yo respondiendo."</div>
              <div className="testi-author">Ana R.</div>
              <div className="testi-role">Restaurante · Barcelona</div>
            </div>
            <div className="testi">
              <div className="testi-stars">★★★★★</div>
              <div className="testi-quote">"Lo mejor es el mensaje de después de la visita. <strong>Mis reseñas en Google han subido de 4.1 a 4.7</strong> en tres meses sin hacer nada especial."</div>
              <div className="testi-author">Martín L.</div>
              <div className="testi-role">Restaurante · Buenos Aires</div>
            </div>
          </div>
        </section>

        {/* PRECIO */}
        <section id="precio" className="rev">
          <div className="sec-tag"><span className="n">05</span> Precio</div>
          <div className="pricing-wrap">
            <div className="price-card">
              <div className="price-tag">Plan único · Todo incluido</div>
              <div className="price-amount">150€</div>
              <div className="price-period">al mes + IVA · sin permanencia · cancela cuando quieras</div>
              <div className="price-features">
                <div className="pf">Agente WhatsApp activo 24/7</div>
                <div className="pf">Gestión de reservas con confirmación</div>
                <div className="pf">Respuestas de menú, alérgenos y horarios</div>
                <div className="pf">Notificaciones al dueño en tiempo real</div>
                <div className="pf">Mensajes automáticos post-visita para reseñas</div>
                <div className="pf">Panel de gestión desde el móvil</div>
                <div className="pf">Configuración incluida — lo hacemos nosotros</div>
              </div>
              <Link href="/register" className="price-cta">Empieza ahora →</Link>
              <div className="price-note">Sin coste de alta · Activo en 48 horas · Primer mes sin compromiso</div>
            </div>
            <div className="price-right">
              <div className="pr-title">Activo en <span>48 horas.</span><br />Sin que toques nada técnico.</div>
              <div className="pr-body">Te registras, nos das la información de tu restaurante y nosotros nos encargamos de todo lo demás. No necesitas saber qué es WhatsApp Business API ni cómo funciona. Solo dinos tu menú y tus horarios.</div>
              <div className="pr-steps">
                <div className="prs"><div className="prs-n">1</div>Te registras en chispoa.com en 5 minutos</div>
                <div className="prs"><div className="prs-n">2</div>Introduces tu menú, horarios y Google Maps</div>
                <div className="prs"><div className="prs-n">3</div>Nosotros configuramos el número de WhatsApp</div>
                <div className="prs"><div className="prs-n">4</div>En 48h tu agente está respondiendo clientes</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <div className="cta-final rev">
          <div className="ctaf-title">TU RESTAURANTE,<br />SIEMPRE ENCENDIDO.</div>
          <div className="ctaf-sub">Empieza hoy. Sin permanencia. Sin tecnicismos. Solo más reservas y más reseñas.</div>
          <Link href="/register" className="ctaf-btn">Empieza en 48h →</Link>
          <div className="ctaf-note">150€/mes + IVA · Cancela cuando quieras · Sin coste de alta</div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="wrap">
          <div className="footer-inner">
            <div className="footer-logo">Chispoa<span>.</span></div>
            <div className="footer-links">
              <a href="#como-funciona" className="footer-link">Cómo funciona</a>
              <a href="/terminos" className="footer-link">Términos de servicio</a>
              <a href="/privacidad" className="footer-link">Privacidad</a>
              <a href="mailto:hola@chispoa.com" className="footer-link">Contacto</a>
            </div>
            <div className="footer-meta">
              chispoa.com<br />
              Agente WhatsApp para restaurantes<br />
              © 2026 Chispoa
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

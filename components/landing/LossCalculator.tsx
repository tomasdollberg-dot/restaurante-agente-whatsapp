'use client'

import { useId, useState } from 'react'

// Fáciles de cambiar
const PORCENTAJE_LLAMADAS_PERDIDAS = 0.4
const SEMANAS_POR_MES = 4
const SEMANAS_POR_ANIO = 52

const LLAMADAS_SEMANA_POR_DEFECTO = 10
const TICKET_MEDIO_POR_DEFECTO = 25

const numeroFormatter = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0, useGrouping: 'always' })
const formatEuros = (valor: number) => `${numeroFormatter.format(Math.round(valor))} €`

const clamp = (valor: number, min: number) => (Number.isFinite(valor) && valor > min ? valor : min)

export default function LossCalculator() {
  const [llamadasSemana, setLlamadasSemana] = useState(LLAMADAS_SEMANA_POR_DEFECTO)
  const [ticketMedio, setTicketMedio] = useState(TICKET_MEDIO_POR_DEFECTO)

  const callsId = useId()
  const ticketId = useId()

  const perdidaSemanal = llamadasSemana * PORCENTAJE_LLAMADAS_PERDIDAS * ticketMedio
  const dineroAlMes = perdidaSemanal * SEMANAS_POR_MES
  const dineroAlAnio = perdidaSemanal * SEMANAS_POR_ANIO

  return (
    <section id="calculadora" className="rev">
      <div className="sec-tag"><span className="n">05</span> Calculadora</div>
      <div className="calc-head">
        <div className="calc-title">Sí, estás <span className="hi">perdiendo dinero</span></div>
        <div className="calc-sub">
          Descubre cuánto dinero pierdes cada mes por no atender las llamadas de tus clientes. El 40% de las llamadas perdidas eran para contratar servicios.
        </div>
      </div>

      <div className="calc-grid">
        <div className="calc-control">
          <label className="calc-label" htmlFor={callsId}>Llamadas perdidas a la semana</label>
          <div className="calc-stepper">
            <button
              type="button"
              className="calc-step-btn"
              aria-label="Disminuir llamadas perdidas a la semana"
              onClick={() => setLlamadasSemana((v) => clamp(v - 1, 0))}
            >
              −
            </button>
            <input
              id={callsId}
              className="calc-input"
              type="number"
              inputMode="numeric"
              min={0}
              value={llamadasSemana}
              onChange={(e) => setLlamadasSemana(clamp(Number(e.target.value), 0))}
            />
            <button
              type="button"
              className="calc-step-btn"
              aria-label="Aumentar llamadas perdidas a la semana"
              onClick={() => setLlamadasSemana((v) => clamp(v + 1, 0))}
            >
              +
            </button>
          </div>
        </div>

        <div className="calc-control">
          <label className="calc-label" htmlFor={ticketId}>Ticket medio por cliente (€)</label>
          <div className="calc-stepper">
            <button
              type="button"
              className="calc-step-btn"
              aria-label="Disminuir ticket medio por cliente"
              onClick={() => setTicketMedio((v) => clamp(v - 1, 0))}
            >
              −
            </button>
            <input
              id={ticketId}
              className="calc-input"
              type="number"
              inputMode="numeric"
              min={0}
              value={ticketMedio}
              onChange={(e) => setTicketMedio(clamp(Number(e.target.value), 0))}
            />
            <button
              type="button"
              className="calc-step-btn"
              aria-label="Aumentar ticket medio por cliente"
              onClick={() => setTicketMedio((v) => clamp(v + 1, 0))}
            >
              +
            </button>
          </div>
        </div>

        <div className="calc-result cr-month">
          <div className="calc-result-label">Dinero perdido al mes</div>
          <div className="calc-result-value">{formatEuros(dineroAlMes)}</div>
        </div>

        <div className="calc-result cr-year">
          <div className="calc-result-label">Dinero perdido al año</div>
          <div className="calc-result-value">{formatEuros(dineroAlAnio)}</div>
        </div>
      </div>
    </section>
  )
}

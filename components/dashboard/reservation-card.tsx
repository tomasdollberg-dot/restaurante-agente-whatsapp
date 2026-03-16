'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, Users } from 'lucide-react'
import { updateReservationStatus } from '@/app/(dashboard)/dashboard/reservations/actions'
import type { Reservation } from '@/lib/supabase/types'

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

export function ReservationCard({
  reservation,
  showDate = false,
}: {
  reservation: Reservation
  showDate?: boolean
}) {
  const [status, setStatus] = useState(reservation.status)
  const [loading, setLoading] = useState(false)

  async function handleStatus(newStatus: 'confirmed' | 'cancelled') {
    setLoading(true)
    setStatus(newStatus)
    await updateReservationStatus(reservation.id, newStatus)
    setLoading(false)
  }

  const time = reservation.reservation_time.slice(0, 5)

  return (
    <div
      className="rounded-2xl p-4 shadow-sm"
      style={{ backgroundColor: '#fffdf9', border: '1px solid #e8e0d0' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="text-2xl tabular-nums shrink-0"
            style={{ color: '#0f0c08', fontWeight: 900 }}
          >
            {time}
          </span>
          <div>
            <p className="leading-tight" style={{ fontWeight: 800, color: '#0f0c08' }}>{reservation.customer_name}</p>
            <p className="text-sm text-gray-500 mt-0.5">
              <Users className="inline h-3.5 w-3.5 mr-0.5" />
              {reservation.party_size} personas
              {showDate && (
                <span className="ml-2 text-gray-400">{formatDate(reservation.reservation_date)}</span>
              )}
            </p>
          </div>
        </div>

        {status === 'confirmed' && (
          <span className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">
            Confirmada
          </span>
        )}
        {status === 'cancelled' && (
          <span className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700">
            Cancelada
          </span>
        )}
        {status === 'pending' && (
          <span
            className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ backgroundColor: '#fef3c7', color: '#d97706' }}
          >
            Pendiente
          </span>
        )}
      </div>

      {reservation.notes && (
        <p className="mt-2 text-sm text-gray-500 rounded-lg px-3 py-2" style={{ backgroundColor: 'rgba(15,12,8,0.04)' }}>
          {reservation.notes}
        </p>
      )}

      {status === 'pending' && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => handleStatus('confirmed')}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold text-white disabled:opacity-50 transition-opacity"
            style={{ backgroundColor: '#16a34a' }}
          >
            <CheckCircle className="h-4 w-4" />
            Confirmar
          </button>
          <button
            onClick={() => handleStatus('cancelled')}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold text-red-600 border border-red-200 bg-red-50 disabled:opacity-50 transition-opacity"
          >
            <XCircle className="h-4 w-4" />
            Cancelar
          </button>
        </div>
      )}
    </div>
  )
}

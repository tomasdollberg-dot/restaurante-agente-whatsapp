'use client'

import { useState, useRef } from 'react'
import { X } from 'lucide-react'
import { createReservation } from '@/app/(dashboard)/dashboard/reservations/actions'

export function NewReservationDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  if (!open) return null

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const data = new FormData(e.currentTarget)
    const result = await createReservation(data)
    setLoading(false)
    if (result?.error) {
      setError(result.error)
    } else {
      formRef.current?.reset()
      onClose()
    }
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md rounded-t-2xl md:rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900">Nueva reserva</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {error && (
          <p className="mb-3 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
          <input
            name="customer_name"
            placeholder="Nombre del cliente"
            required
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <input
            name="customer_phone"
            placeholder="Teléfono"
            required
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              name="reservation_date"
              type="date"
              defaultValue={today}
              required
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <input
              name="reservation_time"
              type="time"
              defaultValue="13:00"
              required
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <input
            name="party_size"
            type="number"
            min="1"
            max="50"
            defaultValue="2"
            placeholder="Personas"
            required
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <textarea
            name="notes"
            placeholder="Notas (opcional)"
            rows={2}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-3 text-sm font-bold text-white disabled:opacity-60 transition-opacity"
            style={{ backgroundColor: '#b8922a' }}
          >
            {loading ? 'Guardando...' : 'Crear reserva'}
          </button>
        </form>
      </div>
    </div>
  )
}

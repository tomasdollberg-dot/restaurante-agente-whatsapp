'use client'

import { useState } from 'react'
import { saveHours } from '@/app/(dashboard)/dashboard/hours/actions'
import type { RestaurantHours } from '@/lib/supabase/types'

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

type HourRow = {
  day_of_week: number
  open_time: string
  close_time: string
  is_closed: boolean
}

function buildInitialHours(existing: RestaurantHours[]): HourRow[] {
  return DAYS.map((_, i) => {
    const found = existing.find((h) => h.day_of_week === i)
    return {
      day_of_week: i,
      open_time: found?.open_time ?? '09:00',
      close_time: found?.close_time ?? '22:00',
      is_closed: found?.is_closed ?? false,
    }
  })
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none shrink-0"
      style={{ backgroundColor: enabled ? '#16a34a' : '#d1d5db' }}
    >
      <span
        className="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200"
        style={{ transform: enabled ? 'translateX(1.375rem)' : 'translateX(0.25rem)' }}
      />
    </button>
  )
}

export function HoursForm({ existing }: { existing: RestaurantHours[] }) {
  const [hours, setHours] = useState<HourRow[]>(buildInitialHours(existing))
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  function update(dayIndex: number, field: keyof HourRow, value: string | boolean) {
    setHours((prev) =>
      prev.map((h) => (h.day_of_week === dayIndex ? { ...h, [field]: value } : h))
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const payload = hours.map((h) => ({
      day_of_week: h.day_of_week,
      is_closed: h.is_closed,
      open_time: h.is_closed ? null : h.open_time || null,
      close_time: h.is_closed ? null : h.close_time || null,
    }))

    const result = await saveHours(payload)
    setLoading(false)

    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Horarios guardados correctamente' })
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900">Horarios</h1>
        <p className="text-sm text-gray-500">Define los horarios de apertura y cierre</p>
      </div>

      {message && (
        <div
          className={`mb-4 rounded-xl px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
        {hours.map((h, idx) => (
          <div
            key={h.day_of_week}
            className={`px-4 py-3 ${idx < hours.length - 1 ? 'border-b border-gray-100' : ''}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm text-gray-900">{DAYS[h.day_of_week]}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">{h.is_closed ? 'Cerrado' : 'Abierto'}</span>
                <Toggle
                  enabled={!h.is_closed}
                  onChange={(v) => update(h.day_of_week, 'is_closed', !v)}
                />
              </div>
            </div>

            {!h.is_closed && (
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <p className="text-xs text-gray-400 mb-1">Apertura</p>
                  <input
                    type="time"
                    value={h.open_time}
                    onChange={(e) => update(h.day_of_week, 'open_time', e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-gray-50"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-400 mb-1">Cierre</p>
                  <input
                    type="time"
                    value={h.close_time}
                    onChange={(e) => update(h.day_of_week, 'close_time', e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-gray-50"
                  />
                </div>
              </div>
            )}

            {h.is_closed && (
              <p className="text-xs text-gray-400">Cerrado este día</p>
            )}
          </div>
        ))}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl py-3 text-sm font-bold text-white disabled:opacity-60 transition-opacity"
        style={{ backgroundColor: '#b8922a' }}
      >
        {loading ? 'Guardando...' : 'Guardar horarios'}
      </button>
    </form>
  )
}

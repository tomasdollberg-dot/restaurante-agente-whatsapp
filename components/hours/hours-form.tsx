'use client'

import { useState } from 'react'
import { saveHours } from '@/app/(dashboard)/dashboard/hours/actions'
import type { RestaurantHours } from '@/lib/supabase/types'

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

const TIME_OPTIONS: string[] = []
for (let h = 0; h < 24; h++) {
  TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:00`)
  TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:30`)
}

type HourRow = {
  day_of_week: number
  open_time: string
  close_time: string
  open_time_2: string
  close_time_2: string
  is_closed: boolean
  has_second_shift: boolean
}

function buildInitialHours(existing: RestaurantHours[]): HourRow[] {
  return DAYS.map((_, i) => {
    const found = existing.find((h) => h.day_of_week === i)
    return {
      day_of_week: i,
      open_time: found?.open_time?.slice(0, 5) ?? '09:00',
      close_time: found?.close_time?.slice(0, 5) ?? '17:00',
      open_time_2: found?.open_time_2?.slice(0, 5) ?? '20:00',
      close_time_2: found?.close_time_2?.slice(0, 5) ?? '23:30',
      is_closed: found?.is_closed ?? false,
      has_second_shift: !!(found?.open_time_2),
    }
  })
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none shrink-0"
      style={{ backgroundColor: enabled ? '#b8922a' : '#d1d5db' }}
    >
      <span
        className="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200"
        style={{ transform: enabled ? 'translateX(1.375rem)' : 'translateX(0.25rem)' }}
      />
    </button>
  )
}

function TimeSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
      style={{ border: '1px solid #e8e0d0', color: '#6b7280', backgroundColor: '#fafaf8' }}
    >
      {TIME_OPTIONS.map((t) => (
        <option key={t} value={t}>{t}</option>
      ))}
    </select>
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
      open_time_2: h.is_closed || !h.has_second_shift ? null : h.open_time_2 || null,
      close_time_2: h.is_closed || !h.has_second_shift ? null : h.close_time_2 || null,
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

      <div className="flex flex-col gap-3 mb-6">
        {hours.map((h) => (
          <div
            key={h.day_of_week}
            className="rounded-2xl border p-4"
            style={{ backgroundColor: '#fff', borderColor: '#e8e0d0', borderRadius: '14px' }}
          >
            {/* Top row: day name + toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ fontWeight: 700, color: '#0f0c08' }}>
                {DAYS[h.day_of_week]}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: '#9ca3af' }}>
                  {h.is_closed ? 'Cerrado' : 'Abierto'}
                </span>
                <Toggle
                  enabled={!h.is_closed}
                  onChange={(v) => update(h.day_of_week, 'is_closed', !v)}
                />
              </div>
            </div>

            {/* Time rows when open */}
            {!h.is_closed && (
              <div className="mt-3 flex flex-col gap-3">
                {/* Shift 1 */}
                <div className="flex flex-col md:flex-row gap-2">
                  <div className="flex-1">
                    <p className="text-xs mb-1" style={{ color: '#9ca3af' }}>Apertura</p>
                    <TimeSelect
                      value={h.open_time}
                      onChange={(v) => update(h.day_of_week, 'open_time', v)}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs mb-1" style={{ color: '#9ca3af' }}>Cierre</p>
                    <TimeSelect
                      value={h.close_time}
                      onChange={(v) => update(h.day_of_week, 'close_time', v)}
                    />
                  </div>
                </div>

                {/* Shift 2 */}
                {h.has_second_shift && (
                  <div className="flex flex-col md:flex-row gap-2">
                    <div className="flex-1">
                      <p className="text-xs mb-1" style={{ color: '#9ca3af' }}>Apertura 2º turno</p>
                      <TimeSelect
                        value={h.open_time_2}
                        onChange={(v) => update(h.day_of_week, 'open_time_2', v)}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs mb-1" style={{ color: '#9ca3af' }}>Cierre 2º turno</p>
                      <TimeSelect
                        value={h.close_time_2}
                        onChange={(v) => update(h.day_of_week, 'close_time_2', v)}
                      />
                    </div>
                  </div>
                )}

                {/* Add/remove second shift */}
                <button
                  type="button"
                  onClick={() => update(h.day_of_week, 'has_second_shift', !h.has_second_shift)}
                  className="self-start rounded-lg px-3 py-1.5 text-xs transition-opacity hover:opacity-70"
                  style={{
                    border: '1px solid rgba(0,0,0,0.1)',
                    color: '#9ca3af',
                    backgroundColor: 'transparent',
                  }}
                >
                  {h.has_second_shift ? '— Quitar 2º turno' : '+ 2º turno'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl py-3 text-sm font-bold text-white disabled:opacity-60 transition-opacity hover:opacity-90"
        style={{ backgroundColor: '#b8922a' }}
      >
        {loading ? 'Guardando...' : 'Guardar horarios'}
      </button>
    </form>
  )
}

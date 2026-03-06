'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {message && (
        <div className={`rounded-md px-4 py-3 text-sm ${
          message.type === 'success'
            ? 'bg-green-50 text-green-800'
            : 'bg-destructive/10 text-destructive'
        }`}>
          {message.text}
        </div>
      )}

      <div className="rounded-lg border bg-white overflow-hidden">
        <div className="grid grid-cols-[120px_1fr_1fr_100px] gap-4 border-b bg-gray-50 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <span>Día</span>
          <span>Apertura</span>
          <span>Cierre</span>
          <span>Cerrado</span>
        </div>

        {hours.map((h) => (
          <div
            key={h.day_of_week}
            className="grid grid-cols-[120px_1fr_1fr_100px] items-center gap-4 border-b px-6 py-4 last:border-b-0"
          >
            <span className="font-medium">{DAYS[h.day_of_week]}</span>

            <Input
              type="time"
              value={h.open_time}
              onChange={(e) => update(h.day_of_week, 'open_time', e.target.value)}
              disabled={h.is_closed}
              className="disabled:opacity-40"
            />

            <Input
              type="time"
              value={h.close_time}
              onChange={(e) => update(h.day_of_week, 'close_time', e.target.value)}
              disabled={h.is_closed}
              className="disabled:opacity-40"
            />

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`closed-${h.day_of_week}`}
                className="h-4 w-4 rounded border-gray-300"
                checked={h.is_closed}
                onChange={(e) => update(h.day_of_week, 'is_closed', e.target.checked)}
              />
              <label htmlFor={`closed-${h.day_of_week}`} className="text-sm text-muted-foreground">
                Cerrado
              </label>
            </div>
          </div>
        ))}
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? 'Guardando...' : 'Guardar horarios'}
      </Button>
    </form>
  )
}

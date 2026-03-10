'use client'

import { useState } from 'react'
import { toggleMenuItemAvailability } from '@/app/(dashboard)/dashboard/menu/actions'

export function MenuToggle({ id, initial }: { id: string; initial: boolean }) {
  const [enabled, setEnabled] = useState(initial)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    const next = !enabled
    setEnabled(next)
    setLoading(true)
    await toggleMenuItemAvailability(id, next)
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-label={enabled ? 'Desactivar' : 'Activar'}
      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 disabled:opacity-60 focus:outline-none"
      style={{ backgroundColor: enabled ? '#b8922a' : '#d1d5db' }}
    >
      <span
        className="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200"
        style={{ transform: enabled ? 'translateX(1.375rem)' : 'translateX(0.25rem)' }}
      />
    </button>
  )
}

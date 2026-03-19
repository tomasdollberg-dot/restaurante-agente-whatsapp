'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Users } from 'lucide-react'
import { ReservationCard } from '@/components/dashboard/reservation-card'
import { NewReservationDialog } from './new-reservation-dialog'
import type { Reservation } from '@/lib/supabase/types'

type Filter = 'all' | 'pending' | 'confirmed'

const filterBtns: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'pending', label: 'Pendientes' },
  { key: 'confirmed', label: 'Confirmadas' },
]

export function ReservationsClient({ reservations }: { reservations: Reservation[] }) {
  const router = useRouter()
  const [filter, setFilter] = useState<Filter>('all')
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh()
    }, 60000)
    return () => clearInterval(interval)
  }, [router])

  const filtered =
    filter === 'all' ? reservations : reservations.filter((r) => r.status === filter)

  return (
    <>
      <div>
        {/* Filter pills */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {filterBtns.map(({ key, label }) => {
            const count = key === 'all' ? reservations.length : reservations.filter((r) => r.status === key).length
            const isActive = filter === key
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className="shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
                style={{
                  backgroundColor: isActive ? '#b8922a' : 'rgba(15,12,8,0.08)',
                  color: isActive ? 'white' : '#6b7280',
                }}
              >
                {label}
                <span
                  className="text-xs px-1.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(15,12,8,0.1)',
                    color: isActive ? 'white' : '#6b7280',
                  }}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Cards */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-gray-500">No hay reservas para mostrar</p>
          </div>
        ) : (
          <div className="space-y-3 pb-20">
            {filtered.map((r) => (
              <ReservationCard key={r.id} reservation={r} showDate />
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setDialogOpen(true)}
        className="fixed bottom-20 right-4 md:bottom-6 z-40 h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-95"
        style={{ backgroundColor: '#b8922a' }}
        aria-label="Nueva reserva"
      >
        <Plus className="h-6 w-6 text-white" />
      </button>

      <NewReservationDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </>
  )
}

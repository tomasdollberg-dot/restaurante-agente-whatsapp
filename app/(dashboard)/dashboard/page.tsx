import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MessageSquare } from 'lucide-react'
import { ReservationCard } from '@/components/dashboard/reservation-card'
import type { Restaurant, Reservation } from '@/lib/supabase/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: restaurantData } = await supabase
    .from('restaurants')
    .select('id, name')
    .eq('owner_id', user!.id)
    .single()

  const restaurant = restaurantData as Pick<Restaurant, 'id' | 'name'> | null
  if (!restaurant) redirect('/dashboard/settings')

  const today = new Date().toISOString().split('T')[0]
  const firstOfMonth = today.slice(0, 8) + '01'

  const [
    { count: todayCount },
    { count: pendingCount },
    { count: monthCount },
    { data: todayData },
  ] = await Promise.all([
    supabase.from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('restaurant_id', restaurant.id)
      .eq('reservation_date', today),

    supabase.from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('restaurant_id', restaurant.id)
      .eq('status', 'pending'),

    supabase.from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('restaurant_id', restaurant.id)
      .gte('reservation_date', firstOfMonth),

    supabase.from('reservations')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .eq('reservation_date', today)
      .neq('status', 'cancelled')
      .order('reservation_time', { ascending: true }),
  ])

  const todayReservations = (todayData ?? []) as Reservation[]
  const mediodia = todayReservations.filter((r) => r.reservation_time < '16:00:00')
  const noche = todayReservations.filter((r) => r.reservation_time >= '16:00:00')

  const dateLabel = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div>
      {/* Dark header — escapes shell padding on mobile */}
      <div
        className="-mx-4 -mt-4 md:-mx-8 md:-mt-8 px-5 pt-8 pb-6 md:px-8"
        style={{ backgroundColor: '#0f0c08' }}
      >
        <p className="text-xs font-medium capitalize mb-1" style={{ color: '#b8922a' }}>
          {dateLabel}
        </p>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white leading-tight">{restaurant.name}</h1>
          <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-900/50 text-green-400 border border-green-800">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
            Agente activo
          </span>
        </div>

        {/* Stats grid */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-xl p-3" style={{ backgroundColor: '#1a1610' }}>
            <p className="text-xs text-gray-400 mb-1">Hoy</p>
            <p className="text-3xl font-bold text-white tabular-nums">{todayCount ?? 0}</p>
          </div>
          <div
            className="rounded-xl p-3"
            style={{
              backgroundColor: (pendingCount ?? 0) > 0 ? '#451a03' : '#1a1610',
            }}
          >
            <p className="text-xs mb-1" style={{ color: (pendingCount ?? 0) > 0 ? '#fbbf24' : '#9ca3af' }}>
              Pendientes
            </p>
            <p
              className="text-3xl font-bold tabular-nums"
              style={{ color: (pendingCount ?? 0) > 0 ? '#d97706' : 'white' }}
            >
              {pendingCount ?? 0}
            </p>
          </div>
          <div className="rounded-xl p-3" style={{ backgroundColor: '#1a1610' }}>
            <p className="text-xs text-gray-400 mb-1">Este mes</p>
            <p className="text-3xl font-bold text-white tabular-nums">{monthCount ?? 0}</p>
          </div>
        </div>
      </div>

      {/* WhatsApp banner */}
      <div className="mt-4 flex items-center gap-3 rounded-xl px-4 py-3 bg-green-50 border border-green-200">
        <MessageSquare className="h-5 w-5 shrink-0" style={{ color: '#16a34a' }} />
        <div>
          <p className="text-sm font-semibold text-green-800">WhatsApp conectado</p>
          <p className="text-xs text-green-600">El agente responde automáticamente a tus clientes</p>
        </div>
        <span className="ml-auto h-2 w-2 rounded-full bg-green-500 animate-pulse shrink-0" />
      </div>

      {/* Mediodía */}
      <section className="mt-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Mediodía
        </h2>
        {mediodia.length === 0 ? (
          <p className="text-sm text-gray-400 py-3">Sin reservas para el mediodía</p>
        ) : (
          <div className="space-y-3">
            {mediodia.map((r) => (
              <ReservationCard key={r.id} reservation={r} />
            ))}
          </div>
        )}
      </section>

      {/* Noche */}
      <section className="mt-6 mb-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Noche
        </h2>
        {noche.length === 0 ? (
          <p className="text-sm text-gray-400 py-3">Sin reservas para la noche</p>
        ) : (
          <div className="space-y-3">
            {noche.map((r) => (
              <ReservationCard key={r.id} reservation={r} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

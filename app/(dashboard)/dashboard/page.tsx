import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
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

  const { data: todayData } = await supabase.from('reservations')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .eq('reservation_date', today)
    .neq('status', 'cancelled')
    .order('reservation_time', { ascending: true })

  const todayReservations = (todayData ?? []) as Reservation[]
  const mediodia = todayReservations.filter((r) => r.reservation_time < '16:00:00')
  const noche = todayReservations.filter((r) => r.reservation_time >= '16:00:00')

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

import { createClient } from '@/lib/supabase/server'
import { ReservationsClient } from '@/components/reservations/reservations-client'
import { NoRestaurant } from '@/components/ui/no-restaurant'
import type { Restaurant, Reservation } from '@/lib/supabase/types'

export default async function ReservationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: restaurantData } = await supabase
    .from('restaurants')
    .select('id')
    .eq('owner_id', user!.id)
    .single()

  const restaurant = restaurantData as Pick<Restaurant, 'id'> | null
  if (!restaurant) return <NoRestaurant />

  const { data: reservationsData } = await supabase
    .from('reservations')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .order('reservation_date', { ascending: false })
    .order('reservation_time', { ascending: false })

  const reservations = (reservationsData ?? []) as Reservation[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reservas</h1>
        <p className="text-muted-foreground">
          Gestiona las reservas recibidas por WhatsApp
        </p>
      </div>
      <ReservationsClient reservations={reservations} />
    </div>
  )
}

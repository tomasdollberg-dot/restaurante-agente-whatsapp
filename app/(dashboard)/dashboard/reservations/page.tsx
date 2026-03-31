import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ReservationsClient } from '@/components/reservations/reservations-client'
import type { Restaurant, Reservation } from '@/lib/supabase/types'

export default async function ReservationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // TODO: consolidar con layout query (app/(dashboard)/layout.tsx ya obtiene restaurants.name)
  const { data: restaurantData } = await supabase
    .from('restaurants')
    .select('id')
    .eq('owner_id', user!.id)
    .single()

  const restaurant = restaurantData as Pick<Restaurant, 'id'> | null
  if (!restaurant) redirect('/dashboard/settings')

  const { data: reservationsData } = await supabase
    .from('reservations')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .order('reservation_date', { ascending: false })
    .order('reservation_time', { ascending: false })
    .range(0, 50)

  const allData = (reservationsData ?? []) as Reservation[]
  const reservations = allData.slice(0, 50)
  const hasMore = allData.length > 50

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reservas</h1>
        <p className="text-muted-foreground">
          Gestiona las reservas recibidas por WhatsApp
        </p>
      </div>
      <ReservationsClient reservations={reservations} hasMore={hasMore} restaurantId={restaurant.id} />
    </div>
  )
}

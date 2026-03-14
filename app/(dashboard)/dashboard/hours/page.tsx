import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { HoursForm } from '@/components/hours/hours-form'
import type { Restaurant, RestaurantHours } from '@/lib/supabase/types'

export default async function HoursPage() {
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

  const { data: hoursData } = await supabase
    .from('restaurant_hours')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .order('day_of_week')

  const hours = (hoursData ?? []) as RestaurantHours[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Horarios</h1>
        <p className="text-muted-foreground">
          Define los horarios de apertura y cierre de tu restaurante
        </p>
      </div>
      <HoursForm existing={hours} />
    </div>
  )
}

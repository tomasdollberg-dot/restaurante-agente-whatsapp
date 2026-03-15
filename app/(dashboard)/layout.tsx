import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import type { Restaurant } from '@/lib/supabase/types'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('restaurants')
    .select('id, name')
    .eq('owner_id', user.id)
    .single()

  const restaurant = data as Pick<Restaurant, 'id' | 'name'> | null

  const today = new Date().toISOString().split('T')[0]
  const firstOfMonth = today.slice(0, 8) + '01'

  let todayCount = 0
  let pendingCount = 0
  let monthCount = 0

  if (restaurant) {
    const [{ count: tc }, { count: pc }, { count: mc }] = await Promise.all([
      supabase.from('reservations').select('*', { count: 'exact', head: true })
        .eq('restaurant_id', restaurant.id).eq('reservation_date', today),
      supabase.from('reservations').select('*', { count: 'exact', head: true })
        .eq('restaurant_id', restaurant.id).eq('status', 'pending'),
      supabase.from('reservations').select('*', { count: 'exact', head: true })
        .eq('restaurant_id', restaurant.id).gte('reservation_date', firstOfMonth),
    ])
    todayCount = tc ?? 0
    pendingCount = pc ?? 0
    monthCount = mc ?? 0
  }

  return (
    <DashboardShell
      restaurantName={restaurant?.name ?? 'Mi Restaurante'}
      todayCount={todayCount}
      pendingCount={pendingCount}
      monthCount={monthCount}
    >
      {children}
    </DashboardShell>
  )
}

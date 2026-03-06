import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/dashboard/sidebar'
import type { Restaurant } from '@/lib/supabase/types'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const getUserResult = await supabase.auth.getUser()
  console.log('[DASHBOARD LAYOUT] getUser result:', JSON.stringify(getUserResult, null, 2))
  const { data: { user } } = getUserResult
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('restaurants')
    .select('name')
    .eq('owner_id', user.id)
    .single()

  const restaurant = data as Pick<Restaurant, 'name'> | null

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar restaurantName={restaurant?.name ?? 'Mi Restaurante'} />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  )
}

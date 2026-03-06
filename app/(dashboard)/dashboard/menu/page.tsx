import { createClient } from '@/lib/supabase/server'
import { MenuClient } from '@/components/menu/menu-client'
import { NoRestaurant } from '@/components/ui/no-restaurant'
import type { MenuItem, Restaurant } from '@/lib/supabase/types'

export default async function MenuPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: restaurantData } = await supabase
    .from('restaurants')
    .select('id')
    .eq('owner_id', user!.id)
    .single()

  const restaurant = restaurantData as Pick<Restaurant, 'id'> | null
  if (!restaurant) return <NoRestaurant />

  const { data: itemsData } = await supabase
    .from('menu_items')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .order('category')
    .order('name')

  const items = (itemsData ?? []) as MenuItem[]

  const itemsByCategory: Record<string, MenuItem[]> = {}
  for (const item of items) {
    if (!itemsByCategory[item.category]) itemsByCategory[item.category] = []
    itemsByCategory[item.category].push(item)
  }

  return (
    <div className="space-y-6">
      <MenuClient itemsByCategory={itemsByCategory} />
    </div>
  )
}

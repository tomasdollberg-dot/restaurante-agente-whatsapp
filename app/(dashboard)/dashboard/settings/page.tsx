import { createClient } from '@/lib/supabase/server'
import { SettingsForm } from '@/components/settings/settings-form'
import type { Restaurant } from '@/lib/supabase/types'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: restaurantData } = await supabase
    .from('restaurants')
    .select('*')
    .eq('owner_id', user!.id)
    .single()

  const restaurant = (restaurantData as Restaurant | null) ?? {
    id: '',
    owner_id: user!.id,
    name: '',
    description: null,
    address: null,
    owner_phone: '',
    whatsapp_number: null,
    google_maps_url: null,
    created_at: '',
  } satisfies Restaurant

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Ajustes</h1>
        <p className="text-muted-foreground">
          Configura la información de tu restaurante y WhatsApp
        </p>
      </div>
      <SettingsForm restaurant={restaurant} />
    </div>
  )
}

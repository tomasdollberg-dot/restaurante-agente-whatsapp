'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const SettingsSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  address: z.string().optional(),
  owner_phone: z.string().min(1, 'El teléfono del dueño es requerido'),
  whatsapp_number: z.string().optional(),
  google_maps_url: z.string().optional(),
})

export async function saveSettings(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const parsed = SettingsSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    address: formData.get('address'),
    owner_phone: formData.get('owner_phone'),
    whatsapp_number: formData.get('whatsapp_number'),
    google_maps_url: formData.get('google_maps_url'),
  })

  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { error } = await supabase
    .from('restaurants')
    .upsert({ ...parsed.data, owner_id: user.id } as never, { onConflict: 'owner_id' })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard')
  return { success: true }
}

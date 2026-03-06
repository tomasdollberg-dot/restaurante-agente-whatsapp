'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ReservationStatus } from '@/lib/supabase/types'

export async function updateReservationStatus(id: string, status: ReservationStatus) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('reservations')
    .update({ status } as never)
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/reservations')
  revalidatePath('/dashboard')
  return { success: true }
}

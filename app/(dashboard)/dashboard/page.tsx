import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CalendarCheck, Clock, Users, TrendingUp } from 'lucide-react'
import type { Restaurant, Reservation } from '@/lib/supabase/types'

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-ES', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
}

function formatTime(timeStr: string) {
  return timeStr.slice(0, 5)
}

const statusLabel: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
}

const statusVariant: Record<string, 'warning' | 'success' | 'destructive'> = {
  pending: 'warning',
  confirmed: 'success',
  cancelled: 'destructive',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: restaurantData } = await supabase
    .from('restaurants')
    .select('id, name')
    .eq('owner_id', user!.id)
    .single()

  const restaurant = restaurantData as Pick<Restaurant, 'id' | 'name'> | null
  if (!restaurant) return null

  const today = new Date().toISOString().split('T')[0]
  const firstOfMonth = today.slice(0, 8) + '01'

  const [
    { count: todayCount },
    { count: pendingCount },
    { count: monthCount },
    { data: upcomingData },
  ] = await Promise.all([
    supabase.from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('restaurant_id', restaurant.id)
      .eq('reservation_date', today),

    supabase.from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('restaurant_id', restaurant.id)
      .eq('status', 'pending'),

    supabase.from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('restaurant_id', restaurant.id)
      .gte('reservation_date', firstOfMonth),

    supabase.from('reservations')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .gte('reservation_date', today)
      .neq('status', 'cancelled')
      .order('reservation_date', { ascending: true })
      .order('reservation_time', { ascending: true })
      .limit(10),
  ])

  const upcomingReservations = (upcomingData ?? []) as Reservation[]

  const stats = [
    { label: 'Reservas hoy', value: todayCount ?? 0, icon: CalendarCheck, color: 'text-blue-600' },
    { label: 'Pendientes', value: pendingCount ?? 0, icon: Clock, color: 'text-yellow-600' },
    { label: 'Este mes', value: monthCount ?? 0, icon: TrendingUp, color: 'text-green-600' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Bienvenido, {restaurant.name}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className={`h-5 w-5 ${color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">Próximas reservas</h2>
        <Card>
          {!upcomingReservations.length ? (
            <CardContent className="py-8 text-center text-muted-foreground">
              <Users className="mx-auto mb-3 h-10 w-10 opacity-30" />
              <p>No hay reservas próximas</p>
            </CardContent>
          ) : (
            <div className="divide-y">
              {upcomingReservations.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{r.customer_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {r.party_size} personas · {r.customer_phone}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatDate(r.reservation_date)}</p>
                      <p className="text-sm text-muted-foreground">{formatTime(r.reservation_time)}</p>
                    </div>
                    <Badge variant={statusVariant[r.status]}>
                      {statusLabel[r.status]}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

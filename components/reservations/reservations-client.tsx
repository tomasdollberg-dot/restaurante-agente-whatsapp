'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, Clock, Users, Phone, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { updateReservationStatus } from '@/app/(dashboard)/dashboard/reservations/actions'
import type { Reservation } from '@/lib/supabase/types'

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

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function formatTime(timeStr: string) {
  return timeStr.slice(0, 5)
}

type Filter = 'all' | 'pending' | 'confirmed' | 'cancelled'

export function ReservationsClient({ reservations }: { reservations: Reservation[] }) {
  const [filter, setFilter] = useState<Filter>('all')
  const [detailItem, setDetailItem] = useState<Reservation | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const filtered = filter === 'all' ? reservations : reservations.filter((r) => r.status === filter)

  async function handleStatus(id: string, status: 'confirmed' | 'cancelled') {
    setUpdatingId(id)
    await updateReservationStatus(id, status)
    setUpdatingId(null)
    if (detailItem?.id === id) setDetailItem((prev) => prev ? { ...prev, status } : null)
  }

  const filterBtns: { key: Filter; label: string }[] = [
    { key: 'all', label: 'Todas' },
    { key: 'pending', label: 'Pendientes' },
    { key: 'confirmed', label: 'Confirmadas' },
    { key: 'cancelled', label: 'Canceladas' },
  ]

  return (
    <>
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {filterBtns.map(({ key, label }) => (
            <Button
              key={key}
              variant={filter === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(key)}
            >
              {label}
              <span className="ml-1.5 rounded-full bg-white/20 px-1.5 text-xs">
                {key === 'all' ? reservations.length : reservations.filter((r) => r.status === key).length}
              </span>
            </Button>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-white overflow-hidden">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Users className="mx-auto mb-3 h-10 w-10 opacity-30" />
              <p>No hay reservas para mostrar</p>
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50">
                  <button
                    className="flex flex-1 items-center gap-4 text-left"
                    onClick={() => setDetailItem(r)}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{r.customer_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {r.party_size} personas · {formatDate(r.reservation_date)} · {formatTime(r.reservation_time)}
                      </p>
                    </div>
                  </button>

                  <div className="flex items-center gap-3 ml-4">
                    <Badge variant={statusVariant[r.status]}>
                      {statusLabel[r.status]}
                    </Badge>
                    {r.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-200 hover:bg-green-50"
                          onClick={() => handleStatus(r.id, 'confirmed')}
                          disabled={updatingId === r.id}
                        >
                          <CheckCircle className="mr-1 h-4 w-4" />
                          Confirmar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive border-destructive/20 hover:bg-destructive/5"
                          onClick={() => handleStatus(r.id, 'cancelled')}
                          disabled={updatingId === r.id}
                        >
                          <XCircle className="mr-1 h-4 w-4" />
                          Cancelar
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!detailItem} onOpenChange={(v) => !v && setDetailItem(null)}>
        {detailItem && (
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Detalle de reserva</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-lg">{detailItem.customer_name}</span>
                <Badge variant={statusVariant[detailItem.status]}>
                  {statusLabel[detailItem.status]}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  {detailItem.customer_phone}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  {detailItem.party_size} personas
                </div>
                <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                  <Clock className="h-4 w-4" />
                  {formatDate(detailItem.reservation_date)} a las {formatTime(detailItem.reservation_time)}
                </div>
              </div>

              {detailItem.notes && (
                <div className="rounded-md bg-gray-50 p-3">
                  <div className="flex items-start gap-2 text-sm">
                    <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <p>{detailItem.notes}</p>
                  </div>
                </div>
              )}

              {detailItem.status === 'pending' && (
                <div className="flex gap-3">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => handleStatus(detailItem.id, 'confirmed')}
                    disabled={updatingId === detailItem.id}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Confirmar
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 text-destructive"
                    onClick={() => handleStatus(detailItem.id, 'cancelled')}
                    disabled={updatingId === detailItem.id}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancelar
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  )
}

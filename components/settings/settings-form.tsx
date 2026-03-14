'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { saveSettings } from '@/app/(dashboard)/dashboard/settings/actions'
import type { Restaurant } from '@/lib/supabase/types'

export function SettingsForm({ restaurant }: { restaurant: Restaurant }) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const formData = new FormData(e.currentTarget)
    const result = await saveSettings(formData)

    setLoading(false)
    if (result?.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Ajustes guardados correctamente' })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message && (
        <div className={`rounded-md px-4 py-3 text-sm ${
          message.type === 'success'
            ? 'bg-green-50 text-green-800'
            : 'bg-destructive/10 text-destructive'
        }`}>
          {message.text}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Información del restaurante</CardTitle>
          <CardDescription>
            Esta información la usará el agente para responder preguntas de los clientes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del restaurante *</Label>
            <Input
              id="name"
              name="name"
              defaultValue={restaurant.name}
              placeholder="La Trattoria"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="owner_phone">Tu WhatsApp personal *</Label>
            <Input
              id="owner_phone"
              name="owner_phone"
              type="tel"
              defaultValue={restaurant.owner_phone}
              placeholder="+34 600 000 000"
              required
            />
            <p className="text-xs text-muted-foreground">
              Te avisaremos aquí cuando el agente no sepa responder algo
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="google_maps_url">Tu perfil en Google Maps</Label>
            <Input
              id="google_maps_url"
              name="google_maps_url"
              defaultValue={restaurant.google_maps_url ?? ''}
              placeholder="https://maps.google.com/..."
            />
            <p className="text-xs text-muted-foreground">
              Para pedir reseñas automáticamente después de cada visita
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              name="address"
              defaultValue={restaurant.address ?? ''}
              placeholder="Calle Mayor 15, Madrid"
            />
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={loading}>
        {loading ? 'Guardando...' : 'Guardar ajustes'}
      </Button>
    </form>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

function mapAuthError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('user already registered') || m.includes('already registered')) return 'Ya existe una cuenta con este email.'
  if (m.includes('password should be at least')) return 'La contraseña debe tener al menos 6 caracteres.'
  if (m.includes('invalid email')) return 'El formato del email no es válido.'
  if (m.includes('email not confirmed')) return 'Debes confirmar tu email antes de entrar.'
  return 'Error inesperado. Inténtalo de nuevo.'
}

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [registered, setRegistered] = useState(false)
  const [form, setForm] = useState({
    email: '',
    password: '',
    restaurantName: '',
    ownerPhone: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    const { error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    })

    if (signUpError) {
      setError(mapAuthError(signUpError.message))
      setLoading(false)
      return
    }

    setRegistered(true)
    setLoading(false)
  }

  if (registered) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8 px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <span className="text-3xl">📬</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Revisa tu bandeja de entrada</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Te hemos enviado un email de confirmación a <strong>{form.email}</strong>.
              Una vez confirmado podrás acceder a tu panel.
            </p>
            <p className="text-xs text-gray-400">
              ¿No lo encuentras? Revisa la carpeta de spam.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
            <span className="text-2xl">🍽️</span>
          </div>
          <CardTitle className="text-2xl">Crear cuenta</CardTitle>
          <CardDescription>Registra tu restaurante en RestauranteBot</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="restaurantName">Nombre del restaurante</Label>
              <Input
                id="restaurantName"
                name="restaurantName"
                placeholder="La Trattoria"
                value={form.restaurantName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerPhone">Tu teléfono WhatsApp</Label>
              <Input
                id="ownerPhone"
                name="ownerPhone"
                type="tel"
                placeholder="+34 600 000 000"
                value={form.ownerPhone}
                onChange={handleChange}
                required
              />
              <p className="text-xs text-muted-foreground">
                El agente te enviará notificaciones aquí cuando no sepa responder
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="tu@restaurante.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={form.password}
                onChange={handleChange}
                minLength={8}
                required
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Inicia sesión
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

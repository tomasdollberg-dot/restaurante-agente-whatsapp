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
      <div
        className="min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #0f0c08 0%, #1e1508 45%, #2d1f08 100%)' }}
      >
        {/* Decorative circles */}
        <div
          className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(184,146,42,0.35) 0%, transparent 70%)' }}
        />
        <div
          className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, rgba(184,146,42,0.3) 0%, transparent 70%)' }}
        />

        <div className="relative w-full max-w-sm flex flex-col items-center text-center gap-6">
          {/* Logo */}
          <p
            className="text-xs font-bold tracking-[0.35em] uppercase"
            style={{ color: '#b8922a' }}
          >
            SOLERA
          </p>

          {/* Icon */}
          <div
            className="flex h-20 w-20 items-center justify-center rounded-2xl text-4xl"
            style={{ border: '1px solid rgba(184,146,42,0.25)', backgroundColor: 'rgba(184,146,42,0.06)' }}
          >
            ✉️
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h1
              className="text-3xl leading-tight"
              style={{ color: '#f5f0e8', fontWeight: 800 }}
            >
              Ya casi estás dentro 🎉
            </h1>
            <p className="text-sm" style={{ color: 'rgba(245,240,232,0.55)' }}>
              Hemos enviado un enlace de confirmación a
            </p>
          </div>

          {/* Email pill */}
          <div
            className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
            style={{
              backgroundColor: 'rgba(184,146,42,0.10)',
              border: '1px solid rgba(184,146,42,0.3)',
            }}
          >
            <span style={{ color: '#b8922a' }}>✉</span>
            <span style={{ color: '#f5f0e8' }}>{form.email}</span>
          </div>

          {/* Steps card */}
          <div
            className="w-full rounded-2xl p-5 text-left space-y-4"
            style={{
              backgroundColor: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#b8922a' }}>
              A continuación
            </p>
            {[
              'Abre el email que te enviamos',
              'Haz clic en el enlace de confirmación',
              'Configura tu restaurante',
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                  style={{ backgroundColor: 'rgba(184,146,42,0.2)', color: '#b8922a' }}
                >
                  {i + 1}
                </span>
                <p className="text-sm" style={{ color: 'rgba(245,240,232,0.7)' }}>
                  {step}
                </p>
              </div>
            ))}
          </div>

          {/* Footer resend */}
          <p className="text-xs" style={{ color: 'rgba(245,240,232,0.4)' }}>
            ¿No llegó?{' '}
            <button
              onClick={async () => {
                const supabase = createClient()
                await supabase.auth.resend({ type: 'signup', email: form.email })
              }}
              className="font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity"
              style={{ color: '#b8922a' }}
            >
              Reenviar email
            </button>
          </p>
        </div>
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
